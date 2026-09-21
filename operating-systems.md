<div align="center">

# Operating Systems for System Design — Why Your Servers Behave That Way

</div>

> [!TIP]
> **TL;DR** — Every database, broker, and container is a guest of the kernel. Latency spikes, OOM kills, "mysterious" 100ms stalls, and container throttling all trace back to OS primitives: scheduling, virtual memory, the page cache, and I/O. This guide covers the kernel concepts that make the rest of this repo make sense — including *what a container actually is*.

## Table of Contents

<details>
<summary><b>📑 Jump to a section</b></summary>

1. [Why OS Knowledge Matters in System Design](#1-why-os-knowledge-matters-in-system-design)
2. [Processes & Threads](#2-processes--threads)
3. [Scheduling — Who Runs Next](#3-scheduling--who-runs-next)
4. [Virtual Memory & Paging](#4-virtual-memory--paging)
5. [The Page Cache — The Kernel's Free Database](#5-the-page-cache--the-kernels-free-database)
6. [File Systems, fsync & Durability](#6-file-systems-fsync--durability)
7. [I/O Models — From Blocking to io_uring](#7-io-models--from-blocking-to-io_uring)
8. [Zero-Copy — Kafka's Secret Weapon](#8-zero-copy--kafkas-secret-weapon)
9. [CPU Caches, NUMA & Pinning](#9-cpu-caches-numa--pinning)
10. [Containers — cgroups + Namespaces](#10-containers--cgroups--namespaces)
11. [Interview Q&A](#11-interview-qa)
12. [Hidden Tips & Tricks](#12-hidden-tips--tricks)
13. [Do's & Don'ts](#13-dos--donts)

</details>

---

## 1. Why OS Knowledge Matters in System Design

The stack you design for:

```
Your system design (services, queues, databases)
  └── Databases / brokers / runtimes (PostgreSQL, Kafka, JVM, Node)
        └── OS kernel (scheduler, VM, page cache, TCP)
              └── Hardware (cores, caches, disks, NIC)
```

Most "random" production incidents live in the kernel layer: the p99 spike that's actually a scheduler delay, the OOM kill from cgroup accounting, the write-stall from `fsync`, the container throttled at 99% of its CPU quota. Senior engineers name these; the rest log "no known cause."

---

## 2. Processes & Threads

| | Process | Thread |
| :-- | :-- | :-- |
| Address space | Own, isolated | Shared with siblings |
| Creation cost | Expensive (fork: copy page tables, COW) | Cheap (clone: stack + registers) |
| Context switch | Heavy (page tables, TLB flush) | Light (registers + stack pointer) |
| Communication | IPC (pipes, sockets, shared memory) | Direct memory (needs locks!) |
| Failure blast radius | Contained | One crash kills the process |

**The numbers:** syscall ~100–300ns; thread context switch ~1–10µs (plus cache pollution — the real cost is the cold L1/L2 you return to); process switch adds TLB flush.

**The interview connection:** this is why **event loops / async runtimes** exist (§7) — thousands of threads = thousands of context switches + stacks (1–8MB VA each) = scheduler death. Nginx/Node handle 100K connections with *1–4 threads* + epoll, not 100K threads.

**fork vs spawn:** fork is copy-on-write — cheap-ish but breaks in threaded runtimes (fork only clones the calling thread; the child inherits locked mutexes → deadlock). That's why modern runtimes (Node, Go, Erlang) avoid fork for parallelism.

---

## 3. Scheduling — Who Runs Next

Linux **CFS (Completely Fair Scheduler)**: every runnable task gets a virtual runtime; the leftmost node in the red-black tree runs next. `nice` values weight the share, not the priority.

**What this means for services:**
- CPU-bound and latency-sensitive work sharing a box → the batch job *does* slow your API (CFS is fair, not smart)
- **CPU quota throttling** (containers, §10): a pod limited to 1 CPU that spawns 4 busy threads gets throttled **every 100ms period** — the classic "why is my p99 exactly 100ms+ in Kubernetes"
- **Run queue latency** is a golden signal: `runqlat` (BPF) histograms scheduler delay; high runqlat with low CPU% = scheduling problem, not capacity

**Preemption & interrupts:** network softirq (IRQ → ksoftirqd) processes packets; a core saturated by RX softirq starves user threads. RSS/multi-queue NICs spread it — the deep answer to "one core is at 100% but the box is idle."

---

## 4. Virtual Memory & Paging

Every process gets a private virtual address space; the MMU translates VA→PA via **page tables**, cached in the **TLB**.

| Concept | What it is | Why you care |
| :-- | :-- | :-- |
| Pages | 4KB units (hugepages: 2MB/1GB) | TLB miss costs ~10–100 cycles; hugepages fix TLB pressure for big heaps/DBs |
| Page fault | Access without mapping: minor (map page-cache page) / major (disk read!) | **Major faults = your service reading disk** — the p99 spike in "memory" is often this |
| Demand paging | Nothing loaded until touched | First-request slowness; page in ahead with `mlock`/prefault |
| Swap | Anonymous pages evicted to disk | `vm.swappiness=1` for DBs; swap on a DB box = mystery stalls |
| OOM killer | Picks victim by badness score when memory + swap exhausted | Kills the biggest RSS — often your most important process; cgroups (§10) scope this |

**The interview story:** "memory is fast" is wrong — **memory is fast, disk wearing memory's clothes is not.** A major page fault (~100µs+) is 1000× a TLB hit. When a JVM "pauses," half the time it's swapping or major-faulting, not GC.

---

## 5. The Page Cache — The Kernel's Free Database

The kernel keeps file data in RAM (the **page cache**) and shares it between processes. This is *the* reason several systems in this repo are fast:

- **PostgreSQL reads** hit the OS page cache on warm paths (its `shared_buffers` is deliberately small — the OS cache does the heavy lifting)
- **Kafka consumers** reading recent messages: the "log" is already RAM — sequential disk reads only for old segments (§`kafka-features.md`)
- **Hot static files** (CDN origins, video) are served from cache without touching disk

**Write path (the part that bites):** writes update the page cache, mark pages **dirty**, and a kernel thread (writeback) flushes them later. **You are not durable until `fsync` says so.**

```
write() → page cache (fast, "done")
  … kernel writeback … eventually …
fsync() → forces dirty pages to disk (the actual durability point)
```

---

## 6. File Systems, fsync & Durability

**Journaling FS** (ext4/xfs): metadata (and optionally data) changes go to a journal first — crash-consistent without long fsck.

**`fsync` semantics — where correctness lives:**
- `fsync(fd)` flushes the file's dirty pages; **rename without fsync on the directory is not durable** (the classic SQLite/Postgres-level subtlety)
- `O_DIRECT` bypasses the page cache entirely (DBs that run their own cache — Postgres with `O_DIRECT`-style engines, Oracle) to avoid double-caching
- `fdatasync` skips metadata (faster; use when size didn't change)

**fsync cost:** on spinning disk ~10ms; on NVMe ~20–200µs; **group commit** (batch many transactions under one fsync — Postgres commit_delay, Kafka `linger.ms` + flush) is how systems amortize it. This is the exact mechanism behind "Kafka throughput is a *fsync batching* story, not a network one."

**I/O schedulers:** mq-deadline (default for NVMe — latency-bounded), none/kmq (fastest for NVMe with many queues), bfq (fairness). On cloud EBS, the hypervisor already schedules — pick `none`.

---

## 7. I/O Models — From Blocking to io_uring

The evolution that made 100K-connection servers possible:

| Model | Behavior | Cost per connection |
| :-- | :-- | :-- |
| **Blocking I/O** | Thread blocks until ready | 1 thread each → 10K threads dies |
| **Non-blocking + poll** | Check readiness in a loop | O(n) syscalls per loop |
| **epoll/kqueue** | Register interest once; kernel reports ready set | O(1) amortized per event |
| **io_uring** (Linux 5.1+) | Shared ring buffers: submit + complete queues | Syscall-free batches; also does *files*, not just sockets |

```
epoll flow (Nginx/Node/Redis/Go netpoller):
  epoll_create → epoll_ctl(add, fd, EPOLLIN) [once]
  loop: epoll_wait → ready list → handle events (non-blocking work only!)
```

**C10K → C10M:** the old limit was threads; the new limit is syscall rate and cache misses. io_uring, SO_REUSEPORT (per-core listeners, no lock contention), busy-polling, and kernel-bypass (DPDK) are the C10M toolbox.

**The runtime mapping (interview gold):** Node's event loop, Go's netpoller, Java NIO, Python asyncio, Rust tokio — **all of them are epoll/kqueue wrappers**. "Async/await" is user-space cooperative scheduling on top of kernel readiness APIs.

**The one rule that keeps epoll servers fast:** never do blocking work (sync DNS, sync fs, CPU loops) on the event thread — one 50ms blocking call stalls *every* connection.

---

## 8. Zero-Copy — Kafka's Secret Weapon

The normal path to send a file over a socket copies 4× and context-switches 4×:

```
disk → page cache → user buffer → socket buffer → NIC
  (DMA)     (copy)     (copy)        (DMA)
```

**`sendfile(2)`** collapses it:

```
disk → page cache → NIC      (DMA + scatter-gather; zero user copies)
```

- **Kafka** serves consumers with sendfile — data goes disk-cache → NIC without touching user space; this plus sequential I/O is *why* Kafka saturates NICs (§`kafka-features.md` "why fast")
- **Nginx** `sendfile on;` for static files
- Java: `FileChannel.transferTo`; Go: `io.Copy` uses splice/sendfile internally
- TLS breaks plain sendfile (data must be encrypted in user space) — kTLS fixes it by letting the NIC/kernel do encryption

**Related:** `mmap` for read-mostly files (page cache shared into address space — RoaringBitDB/index files), `splice`/`tee` for pipe plumbing, `MSG_ZEROCOPY` for large sends.

---

## 9. CPU Caches, NUMA & Pinning

| Memory | Latency (cycles) | Size |
| :-- | :-- | :-- |
| L1 | ~4 | 32–64KB/core |
| L2 | ~12 | 256KB–1MB/core |
| L3 | ~40 | 8–64MB shared |
| RAM | ~200–300 | GBs |

**Cache line = 64 bytes.** Two hot variables on the same line on different cores = **false sharing** — cores ping-pong the line; per-core counters need padding. (This is the kernel-level reason lock-free structures pad to cache lines.)

**NUMA:** multi-socket boxes — RAM is split per socket; remote-socket access costs ~1.4–2×. Consequences:
- `numactl --cpunodebind --membind` keeps a DB node-local
- Cross-socket NIC/IRQ steering hurts; bio-commerce latency percentile cliffs often trace to NUMA remote hits
- On cloud VMs (usually one socket / vCPU-sliced), this matters less — but huge fleets on bare metal (Kafka, ClickHouse, Redis) tune it hard

**Why Redis is single-threaded (mostly):** the data set fits L3, one thread avoids locking + context switches, and epoll provides concurrency. The bottleneck is memory/network, not CPU (§`redis-features.md`).

---

## 10. Containers — cgroups + Namespaces

**A container is two kernel features, not a VM:**

| Feature | Isolates | Examples |
| :-- | :-- | :-- |
| **Namespaces** | *What you can see*: pid (process tree), net (interfaces, ports), mnt (filesystem), uts (hostname), ipc, user (UID maps), cgroup | Your pod "thinks" it's alone |
| **cgroups** | *What you can use*: CPU shares/quota, memory limits, pids, blkio, devices | Limits + accounting |

No guest kernel, no hardware virtualization — that's why containers start in milliseconds and why they share the host kernel (and its limits — one kernel panic takes the host, and the *same kernel version* is a constraint VMs don't have).

**Memory limits — how OOM actually happens:**

```
cgroup memory.limit:
  usage = RSS + page cache (reclaimable) + kernel memory
  under pressure → kernel reclaims page cache first
  anonymous memory (heap) can't be reclaimed (no swap) → OOM kill
```

- **OOMKilled (exit 137)** in Kubernetes = cgroup limit hit, *not* host out of memory
- Java/Node need heap **+ off-heap** headroom below the limit (JVM: `-XX:MaxRAMPercentage`, not fixed Xmx + hope)
- **CPU limits:** quota per 100ms period; bursting threads → throttled with the process stopped mid-flight → **the 100ms p99 cliff**. Many shops run *requests-only* (no limits) for latency-critical pods (§`devops-features.md` §3)

**Layered filesystems (overlayfs):** images are read-only layers + writable layer — the reason builds cache and pulls dedupe, and the root of "ephemeral container storage" (logs written to the container layer die with it — mount a volume).

---

## 11. Interview Q&A

**Q: Why is Kafka so fast? (OS answer)**
Sequential appends (disk seeks vs sequential), the page cache serving hot reads, sendfile zero-copy to consumers, and fsync batching (group commit). Kernel literacy is the difference between a memorized answer and an explained one.

**Q: Your Kubernetes pod has p99 = exactly ~100ms spikes. CPU looks 25% utilized. What is it?**
CPU limit throttling: multiple busy threads exhaust the quota early in each 100ms CFS period; the cgroup freezes until the next period. Fix: raise/limit-less (requests-based scheduling), or reduce thread parallelism to ≈ the CPU limit.

**Q: What's the difference between a container and a VM, mechanically?**
VM: hypervisor + guest kernel per VM, hardware-virtualized. Container: *namespaces* isolate views, *cgroups* limit resources, all sharing the host kernel. Start time ms vs s; density; shared-kernel attack surface as the trade.

**Q: Why do databases advise `vm.swappiness=1`?**
DBs manage their own cache (buffer pool) over the page cache; swapping heap/anonymous pages to disk converts in-memory lookups into major faults — worse than dropping the OS cache. 1 (not 0) keeps emergency swap as a last resort without inviting it.

**Q: A service shows high CPU but low throughput. Hmm?**
Candidate culprits: false sharing (perf c2c), GC thrash (check major faults + swap first), syscall storms (strace/perf tracepoints — chatty fs sync or small socket writes), or softirq saturation on one core (RSS/MQ misconfig). The discipline: profile before scaling — horizontal scaling multiplies the bill for a kernel-level bug.

**Q: What happens on disk write + crash without fsync?**
write() only dirtied the page cache; the crash loses it. Journaling FS gives metadata consistency, not your data durability. Databases fsync on WAL commit; Kafka relies on replication for durability by default (`flush.messages` off — replication *is* the durability mechanism).

**Q: Why is Node/Nginx "fast" with one thread?**
epoll readiness multiplexing + non-blocking work: one thread serves thousands of sockets with O(1) event wait, no per-connection thread stacks or context switches. Add the caveat that shows seniority: *as long as per-event work stays non-blocking* (or delegated to workers).

---

## 12. Hidden Tips & Tricks

| Tip | Why it matters |
| :-- | :-- |
| `off_cpu` time (BPF) is the hidden half of latency | CPU% says "idle" — off-CPU says "waiting on lock/IO/scheduler" |
| `runqlat` before buying bigger instances | High run-queue latency with spare CPU = scheduler/NUMA problem, not capacity |
| Hugepages for big heaps & DBs | TLB miss reduction can be worth 5–15% on memory-heavy workloads |
| `sync` is not `fsync` | `sync` is a hint; only fsync/fdatasync on your fd is a durability contract |
| `strace -c` first, then samples | Syscall totals expose "slow because chatty" instantly |
| kTLS restores sendfile under TLS | Encryption at kernel/NIC level keeps zero-copy paths |
| `MADV_DONTNEED` vs `MADV_FREE` differ | Redis/module memory-release semantics depend on it — RSS graphs lie without knowing this |
| THP (transparent hugepages) off for Redis/DBs | Defrag stalls; the classic Redis latency footnote |
| Exit code 137 = OOM (SIGKILL by cgroup) | Not a crash bug — a memory accounting event; check `memory.max` events |
| SO_REUSEPORT per-core listeners | Removes accept-lock contention on high-connection servers |

---

## 13. Do's & Don'ts

| ✅ Do | ❌ Don't |
| :-- | :-- |
| Set container memory limits = heap + off-heap + headroom (measure RSS) | Don't set limits = heap size and act surprised at exit 137 |
| Use requests-based CPU scheduling for latency-critical pods | Don't slap tight CPU limits on bursty threads (100ms throttle cliffs) |
| fsync on the directory after rename for atomic-file publishes | Don't treat write() as durable or rename as ordered |
| Group-commit / batch fsyncs under load | Don't fsync per record and blame "slow disk" |
| `vm.swappiness=1`, dedicated data partitions, `none` scheduler on NVMe/EBS | Don't run databases on default desktop-tuned kernels |
| Keep event threads non-blocking; offload CPU work | Don't run crypto loops on the epoll thread |
| Pad per-core counters; profile with `perf c2c` | Don't chase phantom "CPU cache luck" without profiling |
| Monitor runqlat, major faults, throttling — leading indicators | Don't scale horizontally to hide a kernel-level pathology |
| Prefer `fdatasync` when metadata didn't change | Don't fsync twice what one syscall can flush |
| Pin + bind NUMA on bare-metal data tiers | Don't spread one Redis/ClickHouse node across sockets blindly |

---

*Pairs with:* `networking.md` (sockets, epoll's cousin problems, zero-copy NIC paths) · `kafka-features.md` (sequential I/O + sendfile in practice) · `redis-features.md` (single-thread + epoll + THP) · `postgresql-features.md` (page cache + WAL fsync) · `devops-features.md` §3 (requests/limits → cgroups) · `interview-qa.md` §74–77 (failure vocabulary).
