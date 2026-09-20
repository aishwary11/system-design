<div align="center">

# Interview Q&A — Failure Terminology & High-Level "Why/What-If" Questions

</div>

Every technology has its own failure vocabulary — Redis talks about *stampedes* and *avalanches*, Kafka about *lag* and *rebalance storms*, Kubernetes about *OOMKills* and *CrashLoopBackOff* — but they are the same handful of physics wearing different costumes. **Part IV** gives the cross-technology failure glossary with production-grade solutions. **Part V** answers the high-level questions that separate seniors from juniors: *why is Kafka fast? what do you do when Redis dies? how does Redis Cluster actually work?*

Section numbering continues from `system-design-concepts.md` (Parts I–III end at §72).

---

## Table of Contents

<details>
<summary><b>📑 Jump to a section</b></summary>

**Part IV — Failure Terminology (every technology, one glossary)**
73. [Cache Failure Terminology (Stampede, Avalanche, Penetration, Breakdown…)](#73-cache-failure-terminology-stampede-avalanche-penetration-breakdown)
74. [Queue & Stream Failure Terminology (Lag, Rebalance Storms, Poison Messages…)](#74-queue--stream-failure-terminology-lag-rebalance-storms-poison-messages)
75. [Database & Replication Failure Terminology (Lag, Split-Brain, Pool Exhaustion…)](#75-database--replication-failure-terminology-lag-split-brain-pool-exhaustion)
76. [Kubernetes & Platform Failure Terminology (OOMKilled, CrashLoopBackOff, Evictions…)](#76-kubernetes--platform-failure-terminology-oomkilled-crashloopbackoff-evictions)
77. [Service & Network Failure Terminology (Cascades, Gray Failure, Brownouts…)](#77-service--network-failure-terminology-cascades-gray-failure-brownouts)

**Part V — High-Level Q&A With Answers**
78. [Caching & Redis — "What if Redis goes down?", "How does Redis Cluster work?"](#78-caching--redis)
79. [Messaging & Storage — "Why is Kafka fast?", "Kafka vs RabbitMQ?"](#79-messaging--storage)
80. [Kubernetes & DevOps — pods/clusters, Jenkins vs Actions, GitOps, rollbacks](#80-kubernetes--devops)

</details>

---

# Part IV — Failure Terminology: One Glossary for Every Technology

> 💡 The pattern: every "named" failure is one of four physics — **synchronized load** (herd/storm/avalanche), **skew** (hot key/partition/noisy neighbor), **unbounded accumulation** (lag/tombstones/compaction debt), or **ambiguous state after failure** (split-brain/duplicates/gray failure). Learn the four shapes and you can reason about any technology's outage.

## 73. Cache Failure Terminology (Stampede, Avalanche, Penetration, Breakdown)

The canonical Redis vocabulary — and the same taxonomy applies to **any** cache: CDN, Memcached, Caffeine, CloudFront, or the write-through cache in your design docs (§16).

| Term | What happens | Production solutions |
| :--- | :--- | :--- |
| **Cache Stampede** (≠ avalanche) | ONE hot key expires while thousands of concurrent requests are in flight → all miss → all hit the DB simultaneously. The thundering herd of §43. | ① **Mutex/single-flight fill**: first miss takes a distributed lock (`SET key:nx`), others wait & re-read; ② **Probabilistic early expiration (XFetch)**: each caller refreshes early with probability ∝ time-since-refresh ÷ TTL — the herd dissolves statistically; ③ **Logical TTL + async refresh**: serve stale, refresh in background; ④ **Stale-while-revalidate** at the CDN layer. |
| **Cache Avalanche** | A *swarm* of keys expires at the same instant (bulk-loaded with identical TTLs) — or the whole cache tier restarts → a traffic wall hits the DB. | ① **TTL jitter**: `ttl = base + random(0, 600s)` so expirations spread out; ② **HA cache tier**: Redis Sentinel/Cluster + AOF `everysec`, no cold start; ③ **Circuit breaker + degrade** (§11, §27): when the DB saturates, shed load and serve stale; ④ **Warming**: replay hot keys before admitting full traffic. |
| **Cache Penetration** | Queries for keys that **don't exist** (often malicious) — cache can't help, every request hits the DB. | ① **Cache the empty result** with a short TTL (`key → null, 60s`); ② **Bloom filter gate** (§17) in front of the keyspace: "definitely absent" rejects without touching the DB; ③ **Validate + rate-limit** at the API edge; ④ per-client quotas for 404-heavy callers. |
| **Cache Breakdown** (hot-spot invalidation) | A celebrity key is *invalidated* by a write while reads are in flight. | Stampede tools plus **versioned keys** (`user:42:v7`) — writers bump the version while v6 stays warm for in-flight readers. |
| **Hot Key** | One key gets disproportionate traffic and saturates one shard/cache node (§43). | Replicate the key (`key:shard-a/b/c` read-splitting), local in-process L1 in front of L2, or split the value. |
| **Big Key** | One huge value (a 50 MB sorted set) blocks Redis's single thread; `DEL` of it stalls everything. | Split into chunks, `UNLINK` (async free) not `DEL`, `SCAN`-based progressive deletion, or move to a stream/secondary store. |

```text
avalanche:  10k keys, same TTL, loaded 09:00, TTL 1h → 10:00:00 the DB sees 10k simultaneous fills
fix:        ttl = 3600 + rand(600)      → fills spread over 10 min — trivial
stampede:   1 key ("feed:42"), 30k req/s, TTL hits → 30k parallel DB queries in one instant
fix:        single-flight + logical TTL → 1 query; the other 29,999 await the same promise
```

**Pairs with:** §16 caching strategies, §17 Bloom filters, §43 hot keys & single-flight, §11 circuit breakers, the distributed-cache design doc.

---

## 74. Queue & Stream Failure Terminology (Lag, Rebalance Storms, Poison Messages)

Kafka/Pulsar/RabbitMQ/SQS vocabulary — same physics, different brokers (messaging-app & code-deployment docs).

| Term | What happens | Production solutions |
| :--- | :--- | :--- |
| **Consumer Lag** | Offsets accumulate faster than consumers drain — the queue becomes a delay line, then a loss risk (retention expiry). | Scale consumers ≤ partition count; add partitions for hot topics; autoscale on `records-lag-max`; bulkhead slow consumers from fast ones; alert on lag *slope*, not absolute value. |
| **Rebalance Storm** | A consumer pod flaps (tight liveness probe, GC pause) → group rebalances → all partitions stop mid-processing → lag spikes → more flapping. A synchronized-load spiral. | **Static membership** (`group.instance.id`) so restarts don't trigger rebalance; **cooperative-sticky** assignment (incremental, not stop-the-world); fix the flapping cause; session timeout > worst-case GC pause. |
| **Poison Message** | One malformed record crashes the consumer → redelivered forever → the partition is stuck. | Try/catch per record → after N attempts route to a **DLQ** (§20) with the failure reason; never let one record kill the worker; schema-validate at produce time (schema registry). |
| **Retry Storm** | Failures beget retries beget load beget failures (§39) — amplified when consumers re-enqueue failed work. | Exponential backoff + jitter, retry budgets (cap the retry fraction), separate retry topic with delayed consumption, circuit-break the downstream. |
| **Duplicate Delivery** | At-least-once redelivery after consumer crash → double-charged payment, double-sent notification. | **Idempotent consumers** (§10): dedup by message ID / `idempotency_key`; Kafka EOS helps in-stream, but downstream *effects* still need idempotency. |
| **Uncommitted Offset Death** | Consumer processes but never commits (crash loop or manual-commit bug) → infinite redelivery. | Commit watermark per batch; monitor committed-vs-consumed delta; auto-commit only where at-least-once is safe. |
| **Hot Partition** | One partition key (tenant, celebrity) takes most traffic — one consumer burns while others idle. | Key salting (`key#bucket`), two-level keying, or per-tenant queues for whale customers. |
| **Queue Overflow / Backpressure** | Broker hits disk/memory limits; RabbitMQ blocks publishers, SQS is fine but the bill explodes. | Backpressure end-to-end (§21), quotas + load shedding at producers, DLQ-depth alarms, retention/cost budgeting. |

**Pairs with:** §10 idempotency, §20 DLQ, §21 backpressure, §39 retries & backoff, the code-deployment and messaging-app design docs.

---

## 75. Database & Replication Failure Terminology (Lag, Split-Brain, Pool Exhaustion)

| Term | What happens | Production solutions |
| :--- | :--- | :--- |
| **Replication Lag** | Async replicas trail the primary; users write then read a stale replica ("I changed my email and it's still the old one"). | **Read-your-writes**: sticky routing (session → primary or caught-up replica) for latency-sensitive reads; monitor replay lag; version tokens for monotonic reads; quorum/sync replication on money paths (§28, §29). |
| **Split-Brain** | Two nodes both believe they're primary after a partition — divergent writes. | **Fencing tokens** (§34): monotonic epochs; storage rejects stale-epoch writes; quorum election (Raft, §23) so at most one leader per term. |
| **Connection Pool Exhaustion** | Every request waits for a DB connection; latency cascades — often the *first* domino of an outage. | Pool sizing math (≈ cores × 2 for OLTP), statement timeouts so connections recycle, circuit-break on pool wait time, per-endpoint bulkheads. |
| **Lock Contention / Deadlock** | Hot-row updates serialize; deadlock detector kills victims; retries amplify the storm. | Short transactions (never hold locks across RPCs), optimistic concurrency (§44) for low-conflict paths, single-writer queueing on hot rows, deadlock-retry with backoff + jitter. |
| **Slow Query Rot** | A 5 ms query regresses silently after data growth or a plan flip — the classic 3 a.m. page. | Per-endpoint latency SLOs (§45), `pg_stat_statements` regression alerts, plan baselines, index reviews on schema change. |
| **N+1 Queries** | ORM lazily loads 1 + N related rows per render — fine at 10 users, dies at 10k. | Eager loading / dataloader batching, query-count assertions in tests, APM detection (§38). |
| **Connection Storm After Failover** | Primary dies → every app instance reconnects simultaneously to the new primary → the survivor is stampeded. | Reconnect with exponential backoff **+ jitter** (§39), staggered health-check intervals, proxy-side connection limits (PgBouncer/ProxySQL). |
| **Tombstone / Compaction Debt** | Delete-heavy workloads accumulate tombstones (Cassandra) or uncompacted LSM levels → reads crawl (§32). | TTL + compaction tuning, bucketed time-series instead of wide delete sweeps, monitor `sstables-per-read`, I/O-budgeted compaction. |

**Pairs with:** §15 replication topologies, §28 quorums, §29 consistency models, §31 WAL, §32 storage engines, §34 fencing, §44 optimistic concurrency.

---

## 76. Kubernetes & Platform Failure Terminology (OOMKilled, CrashLoopBackOff, Evictions)

| Term | What happens | Production solutions |
| :--- | :--- | :--- |
| **OOMKilled** | Container exceeds its memory **limit** → kernel kills it; restart loops under sustained creep. | Right-size requests=limit for stateless services (Guaranteed QoS), leak profiling, heap-dump on SIGTERM, VPA recommendations in staging. Contrast **CPU throttling**: limits throttle, they don't kill — latency, not death. |
| **CrashLoopBackOff** | Container crashes repeatedly; backoff stretches 10s → 5 min. Bad config, app bug, or failing readiness. | `kubectl describe pod` + previous logs; separate **liveness** (process alive) from **readiness** (can serve) — never probe dependencies in liveness; startup probes for slow boots. |
| **ImagePullBackOff** | Node can't pull the image (registry outage, wrong tag, rate limit). | Registry mirror / pull-through cache, `imagePullSecrets`, pinned tags (never `:latest` in prod). |
| **Eviction / Node Pressure** | Node runs out of memory/disk → kubelet evicts BestEffort/Burstable pods first. | Requests on **every** pod (no BestEffort in prod), PodDisruptionBudgets, priority classes, node-pressure alerting before hard limits. |
| **Liveness Probe Death Spiral** | Probe timeout too tight under load → kubelet restarts healthy-but-slow pods → load shifts to siblings → they fail too → fleet-wide rolling restart. | Generous liveness thresholds, readiness-based load shedding instead of liveness kills, scale out before probe limits bind. |
| **Scale-from-Zero Herd** | Autoscaler adds 50 pods at once; all start cold and fail readiness together — or stampede the DB on boot. | `minReadySeconds` + steady `maxSurge`, staged scale-up, warm-up hooks behind readiness, lazy pool init, cache warming (§73). |
| **Noisy Neighbor** | One tenant/pod saturates shared CPU/network/disk; everyone's p99 suffers. | Requests/limits + QoS, taints & tolerations to isolate whales, separate node pools, per-tenant quotas at the gateway. |
| **PDB Violation During Drains** | Node drains ignore disruption budgets → too many replicas down at once. | PodDisruptionBudgets (minAvailable/maxUnavailable), drains that respect them, surge upgrades one node at a time. |

**Pairs with:** the code-deployment design doc, §45 SLIs/SLOs, §27 load shedding, `devops-features.md`.

---

## 77. Service & Network Failure Terminology (Cascades, Gray Failure, Brownouts)

| Term | What happens | Production solutions |
| :--- | :--- | :--- |
| **Cascading Failure** | A slow dependency slows callers → their threads pile up → they slow *their* callers → the whole graph collapses. | Circuit breakers (§11) with per-dependency bulkheads, timeouts everywhere (§40), load shedding (§27), fail-static/fail-stale fallbacks, autoscale on the *right* signal (queue depth, not CPU). |
| **Retry Storm** | Retries multiply load exactly when the system can least afford it (10% errors × aggressive retry ≈ 2× traffic). | Backoff + jitter (§39), retry budgets, breaker-gated retries, hedging only for idempotent tail-latency ops. |
| **Gray Failure** | One replica fails in a way health checks miss (200s but garbage; checks pass, work fails) — traffic keeps flowing to the sick replica. | Deep health checks probing real dependencies, canary analysis on **outcomes** by cohort (not just 5xx), outlier ejection (Envoy), probes from multiple vantage points. |
| **Brownout** | Deliberate partial degradation: drop expensive features (recommendations, images, relevance sort) to keep the core (search, cart) alive. | Feature-flagged degradation tiers, request-class prioritization — the "dimmer switch" of §27. |
| **SYN / Connection Backlog** | Accept queue overflows under burst → SYNs dropped → client retries amplify the burst. | Accept-queue tuning, connection rate limiting, L7 LB keep-alive reuse, autoscale on connection count. |
| **DNS Failover Lag** | A dead region keeps receiving traffic until cached DNS answers expire. | 30–60 s TTLs on failover records, health-checked DNS (Route 53), **plus** active connection draining — never DNS alone; anycast/proxy-layer cut-over for speed. |
| **Thundering Herd on Recovery** | Service returns → all backlogged clients reconnect and replay at once → it dies again. The second wave kills more outages than the first. | Gradual admission (ramp 5→25→100%), jittered reconnects (§39), token-bucket admission at the edge, warm-up behind the LB. |

**Pairs with:** §11, §21, §27, §39, §40, §45 — this table is those sections in battle dress.

---

# Part V — High-Level Q&A With Answers

## 78. Caching & Redis

**Q1. Why is Redis so fast?**

Everything is tuned to make one thread absurdly efficient: data lives in **RAM** (sub-microsecond access); command execution is **single-threaded** — no locks, no context switches — on top of an **epoll** event loop; the structures are hand-optimized (SDS strings, listpacks storing small collections contiguously, skiplists for sorted sets); the keyspace is an O(1) hash table with **incremental rehashing** (two tables, one bucket migrated per op — no stop-the-world resize). Network I/O moved to threads in Redis 6+, but the data path stays single-threaded: simplicity *is* the performance feature. Result: >1M ops/s per node, ~µs p99.

**Q2. What do you do when Redis goes down?** (the playbook answer)

First: **it should degrade, not die.** ① The app treats Redis as an *optional accelerator* — a circuit breaker (§11) trips on connection errors and traffic falls through to the DB **with load shedding** so the DB survives the miss storm (§73 avalanche); ② serve **stale-while-error** from a last-known-good local copy for hot entities; ③ non-critical features (counters, session lookups → cookie fallback) switch off via feature flags; ④ recovery: Sentinel/Cluster auto-fails-over in seconds, AOF `everysec` caps loss at ~1 s, and a cold restart **warms hot keys** before full traffic returns. The anti-pattern to name: treating Redis as the system of record — if losing it loses data, the design is wrong (cache-aside over a durable DB, or streams with persistence).

**Q3. How does distributed Redis (Cluster) work?**

**16384 hash slots.** Every key maps to a slot: `slot = CRC16(key) mod 16384`; each master owns a slot range (e.g. 0–5461). Clients connect to **any** node; if the key lives elsewhere the node replies `MOVED <slot> <ip:port>` (or `ASK` mid-reshard) and cluster-aware clients learn the slot map and route directly. Nodes discover and fault-detect each other via **gossip** (the `CLUSTER MEET` mesh); when a *majority* of masters agree a master is dead, a replica is promoted — quorum semantics, a mini-Raft (§23). **Multi-key ops** (MGET, transactions, Lua) only work when all keys hash to the same slot, so you co-locate with **hash tags**: `{user:42}:cart`, `{user:42}:profile`. Resharding moves slot ranges online (MIGRATING/ASKING, keys in batches). Sentinel vs Cluster: Sentinel = HA for one replicated keyspace; Cluster = HA **+ horizontal sharding**. Trade-offs to volunteer: no cross-slot multi-key ops, no cross-slot ACID — and slots make resharding cheap (move ranges, not rehash everything à la `mod N`).

**Q4. RDB or AOF?**

RDB = periodic binary snapshots: compact, fast to load, but you lose everything since the last save. AOF = append-only command log: `everysec` (default) caps loss at ~1 s; `always` is fsync-per-command (money paths only). Redis 7's **multi-part AOF** can start rewrites from an RDB preamble — most production setups run both: AOF for durability, RDB for fast restarts and backups.

**Q5. Redis vs Memcached in 2026?**

Memcached: multithreaded, dead-simple flat KV, good for a handful of large values. Redis: rich structures (sets, sorted sets, streams, JSON), persistence, replication, Lua, pub/sub — the default unless all you need is flat KV. Eviction differs too: Memcached's LRU hot-count vs Redis's `maxmemory-policy` approximations (`allkeys-lru`, `volatile-lfu`).

---

## 79. Messaging & Storage

**Q6. Why is Kafka so fast?** (answer in layers)

① **Sequential I/O** — an append-only log turns random writes into disk-fast sequential ones; ② **zero-copy** — consumers are served by `sendfile()`: page cache → NIC, no trip through user space; ③ **the OS page cache is the cache** — Kafka allocates none of its own, so warm reads are RAM-speed and restarts keep warmth; ④ **batching + compression** — producers batch, whole batches compress (lz4/zstd), brokers store as-is, consumers fetch batches: every syscall and round-trip is amortized; ⑤ **partitioned parallelism** — linear scale-out by adding partitions/consumers; ⑥ **cheap brokers** — consumers track their own offsets, so broker bookkeeping is a tiny append. Net: millions of msgs/s on modest hardware.

**Q7. Kafka vs RabbitMQ — which and when?**

Kafka = **distributed log**: retention by time/size, consumers cursor at their own pace, replay, per-partition ordering, massive fan-out (many independent consumer groups read the same events). RabbitMQ = **smart broker, dumb consumer**: flexible routing (topic exchanges), per-message acks/TTLs/priorities, built-in dead-lettering, work-queue semantics — but messages are removed on ack and can't be replayed. Kafka for event streaming, CDC, event sourcing, analytics firehoses; RabbitMQ for job queues, RPC-over-AMQP, fine-grained routing. (`rabbitmq-features.md` has the full decision table.)

**Q8. Consumers fall behind — what's your triage?**

① Confirm lag *slope* vs producer rate (`records-lag-max` per partition); ② find the bottleneck: downstream sink latency (bulkhead/batch it), consumer CPU (scale out), or partition skew (re-key); ③ short-term: raise `max.poll.records`/fetch sizes, add consumers up to partition count (more consumers than partitions just idle — adding partitions is a *planned* op since it changes key→partition mapping); ④ structural: autoscale on lag, split hot topics, tier cold traffic to a second cluster. Never "fix" by silently skipping data — if you must drop, route to quarantine with explicit accounting.

**Q9. Is S3 "eventually consistent" still a thing?**

No — since **December 2020** S3 has strong read-after-write consistency for all operations (new PUTs, overwrites, deletes, list-after-write). The interview-worthy nuance: it was the last big eventual-consistency holdout; S3/GCS/Azure Blob are all strongly consistent now. What *remains* eventual: cross-region replication, CDN caches in front of the store, and derived indexes — the cache layers your design adds, not the store itself.

---

## 80. Kubernetes & DevOps

**Q10. Pod, node, cluster — the 30-second mental model.**

A **pod** is the smallest schedulable unit: one or more containers sharing network/IP, storage, and lifecycle — born together, die together, talking over localhost. A **node** is one machine running kubelet + container runtime; it executes pods and reports status. A **cluster** is the fleet: the control plane (API server, etcd, scheduler, controllers) decides *which node runs which pod*; nodes carry it out. You almost never manage pods directly — **Deployments** manage ReplicaSets manage pods — so rollouts and self-healing are declarative.

**Q11. Jenkins vs GitHub Actions vs GitLab CI in 2026?**

GitHub Actions: in-repo YAML, a marketplace of reusable actions, zero infra for small/medium teams — the greenfield default. Jenkins: self-hosted freedom — a plugin for everything, on-prem compliance, self-hosted GPU executors, a decade of existing pipelines — but you own the masters and agents. GitLab CI: strongest when your SCM is GitLab (built-in, `include:` composition, environments). The modern pattern: **Actions for CI** (build, test, lint, SAST) + **ArgoCD for CD** (GitOps pull-deploy) — CI and CD decoupled; Jenkins survives as the legacy-integration workhorse.

**Q12. What does SonarQube actually add to a pipeline?**

Static-analysis gates: code smells, bug-prone patterns, vulnerability detection — and, the part that changes behavior, **quality gates** ("no new coverage regression, no new blocker issues") that fail the build before merge. Paired with dependency scanning (Dependabot/Snyk), image scanning (Trivy), and secrets scanning (gitleaks), it's the shift-left floor: the cheapest place to catch a defect is before runtime. Pipeline shape: PR → lint+unit → SonarQube scan → quality gate → build image → Trivy scan → sign → deploy staging.

**Q13. Blue-green vs canary in Kubernetes?**

Blue-green: two full environments; switch the Service selector blue→green — instant rollback (flip back), 2× capacity cost, and the switch is binary (a bad release hits 100% of users the moment you flip). Canary: route 1% → 5% → 25% → 100% with automated analysis (error rate, latency, saturation by cohort) — progressive blast radius, rollback = stop the ramp; it needs metrics plus mesh/ingress traffic splitting (Argo Rollouts, Flagger). Production answer: canary for user-facing services with good SLOs (§45); blue-green where state or schema compatibility makes partial traffic unsafe; both orchestrated by the GitOps operator.

**Q14. Why GitOps (ArgoCD/Flux) instead of push-based CD?**

The cluster **pulls** declared state from Git and reconciles continuously. Wins: Git is the audit trail (who changed what, when); drift is detected and corrected automatically; disaster recovery = point a fresh cluster at the repo; deploy credentials live *inside* the cluster (no CI→prod keys); "who deployed what" tribal knowledge disappears. Rollback is `git revert` — the same lever as every other change.

**Q15. A bad deploy is hitting prod right now — walk me through the first 5 minutes.**

① **Stop the bleeding**: canary → halt the ramp; full rollout → `kubectl rollout undo` (seconds — this is why Deployments keep revision history) or flip the blue-green selector; ② **confirm blast radius**: SLO burn rate (§45), error cohorts — one region, one cohort, one endpoint?; ③ **protect dependencies**: shed load (§27), open breakers to flapping downstreams so one outage doesn't cascade (§77); ④ **communicate**: status page + incident channel, one incident commander; ⑤ *only now* debug root cause — with traffic protected you can think. After: blameless review, and add the missing gate (canary analysis, schema-compat check, Sonar gate) so this class of failure can't ship silently again.

**Pairs with:** every section of `system-design-concepts.md` (§ references inline), `devops-features.md` for tooling detail, and the interview-adjacent designs (code-deployment, distributed lock manager, unique ID generator).

---

<div align="center">

*Part IV says the quiet part out loud: every technology's failure zoo is four shapes — synchronized load, skew, unbounded accumulation, ambiguous state. Name the shape, and the solution menu writes itself.*

</div>
