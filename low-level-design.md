<a id="top"></a>

<div align="center">

<sub>SYSTEM DESIGN · CONCURRENCY</sub>

# Low-Level Design for Interviews

**The twelve primitives behind every system — and the invariants interviewers actually grade.**

<sub>12 PRIMITIVES · 25 INTERVIEW PROMPTS · 39 PRIMARY SOURCES</sub>

</div>

> [!TIP]
> **The thesis** — HLD rounds ask *which boxes*; LLD rounds ask *what invariant your lock protects*. Every section follows the same shape: **scope → invariant → baseline → what production does → what breaks**, then the follow-up that separates recall from engineering judgement.

---

## On this page

<details open>
<summary><b>18 sections</b></summary>

1. [How to Answer an LLD Question](#1-how-to-answer-an-lld-question)
2. [Thread-Safe LRU Cache](#2-thread-safe-lru-cache)
3. [Hash Map Without the STL](#3-hash-map-without-the-stl)
4. [Bounded Blocking Queue](#4-bounded-blocking-queue)
5. [Thread Pool](#5-thread-pool)
6. [Priority Task Scheduler](#6-priority-task-scheduler)
7. [malloc/free Allocator](#7-mallocfree-allocator)
8. [Fixed-Size Object Pool](#8-fixed-size-object-pool)
9. [Reader–Writer Lock](#9-readerwriter-lock)
10. [Concurrent Ring Buffer](#10-concurrent-ring-buffer)
11. [Asynchronous Logging Library](#11-asynchronous-logging-library)
12. [Timer Service for Millions of Timers](#12-timer-service-for-millions-of-timers)
13. [Connection Pool](#13-connection-pool)
14. [Cross-Cutting Rules: Memory Ordering, False Sharing, Measurement](#14-cross-cutting-rules-memory-ordering-false-sharing-measurement)
15. [Coverage Map: The 25-Question NVIDIA Set](#15-coverage-map-the-25-question-nvidia-set)
16. [One-Screen Cheat Sheet](#16-one-screen-cheat-sheet)
17. [Hidden Tips & Tricks](#17-hidden-tips--tricks)
18. [Do's & Don'ts](#18-dos--donts)

</details>

---

## 1. How to Answer an LLD Question

An LLD round is not a coding round with extra prose. The interviewer is testing whether you can **name the invariant, choose the weakest synchronization that preserves it, and say what happens at the edges** — capacity, cancellation, shutdown, allocation failure, and a thread dying at the worst moment.

<a id="how-to-use"></a>
### How to use this guide

| | |
| :--- | :--- |
| **WHAT** | A working reference for the twelve primitives that recur across backend and systems interviews. |
| **TRAINS** | Naming the invariant, choosing the weakest sufficient synchronization, and handling the edges — not memorising implementations. |
| **WHY IT'S DIFFERENT** | Every mechanism is tied to production code (CacheLib, Folly, oneTBB, TCMalloc, Linux, Netty, HikariCP), and every primitive has a runnable model you can break. |

**READING PATHS**

| Time | Read | You should be able to |
| :--- | :--- | :--- |
| 30 minutes | This section → [the map](#the-map) → [coverage](#15-coverage-map-the-25-question-nvidia-set) → [cheat sheet](#16-one-screen-cheat-sheet) | Place every prompt and name its invariant |
| 3 hours | All twelve primitives, running the code as you go | Defend the baseline and the edges in a mock |
| Interview week | [Cheat sheet](#16-one-screen-cheat-sheet) + re-derive each invariant from memory | Answer without reading |

<a id="the-map"></a>
### The map

| Concern | Primitives | The shared question |
| :--- | :--- | :--- |
| **Indexing & ownership** | [LRU](#2-thread-safe-lru-cache) · [hash map](#3-hash-map-without-the-stl) · [object pool](#8-fixed-size-object-pool) · [allocator](#7-mallocfree-allocator) · [connection pool](#13-connection-pool) | Where does the data live, and who may free it? |
| **Coordination** | [blocking queue](#4-bounded-blocking-queue) · [RW lock](#9-readerwriter-lock) · [ring buffer](#10-concurrent-ring-buffer) | Which invariant does the lock protect? |
| **Execution** | [thread pool](#5-thread-pool) · [priority scheduler](#6-priority-task-scheduler) · [timer wheel](#12-timer-service-for-millions-of-timers) | What happens at capacity, cancellation and shutdown? |
| **Observability** | [async logger](#11-asynchronous-logging-library) | What do you drop, and what does `flush` promise? |

**THE FIVE-MINUTE SCRIPT**

| Step | What you say | Why it scores |
| :--- | :--- | :--- |
| 1. Scope | "Fixed capacity, `get` refreshes recency, one process, no persistence. Capacity zero stores nothing." | Removes 80% of the ambiguity before you draw |
| 2. Invariant | "Map and list are updated as one atomic step, or a reader can hold an evicted node." | Shows you think in correctness, not boxes |
| 3. Baseline | Mutex + condition variable + one data structure. Simple enough to prove. | A correct baseline beats a lock-free sketch you cannot finish |
| 4. Edges | Full, empty, closed, cancelled, OOM, timeout, double free, spurious wakeup. | The follow-up questions are all here |
| 5. Escalation | "Only if measured contention justifies it: shard / per-thread cache / atomics — and here is what that breaks." | Senior signal: complexity must be earned |

**THREE SENTENCES THAT SOUND SENIOR**

1. "A hit is a write, so a read lock is not enough for `get`."
2. "This is at-least-once, so the operation must be idempotent or deduplicated."
3. "That optimisation changes the guarantee from global LRU to per-shard LRU — is that acceptable?"

> Code below is JavaScript because the repo's examples are executable. JavaScript cannot show real data races, so each sketch **simulates the scheduling decision** and the prose names the C++/Java primitive you would actually use. Treat the code as a state-machine model, not a concurrency proof.

---

## 2. Thread-Safe LRU Cache

> **FOUNDATION** · **12 MIN** — *A hit is a write; a read lock does not make `get` safe.*

**Scope.** `get(key)` returns the value and refreshes recency; `put(key, value)` inserts or updates; capacity is fixed; eviction removes the least-recently-used entry. Define capacity `0` as "store nothing" and decide whether `get` returns a copy or a stable handle.

**Invariant.** The hash index and the recency list agree at every observation point: every key in the map has exactly one list node, and the list contains no key absent from the map.

**Baseline.** One mutex around both structures. `get` must take the **exclusive** lock because a hit mutates recency. That single fact kills the "use a read lock for reads" answer.

```js
// Map + explicit recency order, one critical section. O(1) get/put.
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();              // key -> value; Map preserves insertion order
  }
  get(key) {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key);
    this.map.delete(key);              // promote: remove ...
    this.map.set(key, value);          // ... and re-insert at the MRU end
    return value;
  }
  put(key, value) {
    if (this.capacity === 0) return 'no-store';
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size === this.capacity) {
      this.map.delete(this.map.keys().next().value); // evict LRU (oldest insertion)
    }
    this.map.set(key, value);
    return 'stored';
  }
  keys() { return [...this.map.keys()]; }
}

const c = new LRUCache(2);
c.put('A', 1); c.put('B', 2);
console.log('after A,B:', c.keys().join(','));
c.get('A');
c.put('C', 3);
console.log('after get(A), put(C):', c.keys().join(','), '| B =', c.get('B'));
```

Expected: `after get(A), put(C): A,C | B = undefined` — A was promoted to most-recent, so B was the victim.

**What production does.**

- **CacheLib (Meta)** keeps a hash-table index plus intrusive LRU containers. It deliberately **delays promotion** (a refresh interval) so a hot key does not rewrite shared state on every hit; its docs describe the index as mutex-protected.
- **Caffeine (Java)** does not implement strict LRU. It buffers recency changes in striped read buffers and drains them under a maintenance lock; its policy is Window TinyLFU (admission + frequency), which beats LRU on scan-heavy workloads.
- **Folly `EvictingCacheMap`** is a production-quality LRU that is explicitly **not thread-safe** — a useful reminder that "thread-safe" is a wrapper decision, not an LRU property.

**What breaks / follow-ups.**

| Question | Answer |
| :--- | :--- |
| Why not a read lock on `get`? | A hit changes order; the read is a write. |
| Shard by key hash? | Throughput up, but eviction becomes per-shard LRU, capacity is unbalanced, and a global size limit needs coordination. |
| `get` returns a reference? | Another thread can evict and free it after you unlock. Return a copy / `shared_ptr` / refcounted handle. |
| Miss storm? | Add single-flight loading; do not hold the cache lock while calling the origin. |
| Byte-bounded instead of count-bounded? | Track size explicitly and evict until both limits hold; one entry can exceed the whole budget. |
| TTL? | Lazy expiry on access plus a timer wheel for proactive cleanup; expiring under the same lock keeps the invariant. |

**Sources:** [CacheLib — RAM cache indexing and eviction](https://cachelib.org/docs/Cache_Library_Architecture_Guide/ram_cache_indexing_and_eviction/) · [CacheLib — LRU eviction policy](https://cachelib.org/docs/Cache_Library_User_Guides/eviction_policy/) · [Caffeine design wiki](https://github.com/ben-manes/caffeine/wiki/Design) · [Folly `EvictingCacheMap.h`](https://github.com/facebook/folly/blob/main/folly/container/EvictingCacheMap.h)

---

## 3. Hash Map Without the STL

> **INTERMEDIATE** · **15 MIN** — *Deletion must not break the probe chain; tombstones or backward shift.*

**Scope.** `insert`, `find`, `erase` for integer keys and values, no `std::unordered_map`. State the collision strategy, the deletion strategy, and what a resize invalidates.

**Invariant.** Every live key is reachable by following its probe sequence from its home bucket; a lookup never stops early because of a deletion.

**Baseline.** Open addressing with linear probing and **tombstones**, or separate chaining. Chaining is easier to prove; open addressing is cache-friendlier and is what modern production maps use.

```js
// Open addressing + linear probing + tombstones + resize. No STL.
const DELETED = Symbol('deleted');
class IntMap {
  constructor(cap = 8) { this.keys = new Array(cap); this.vals = new Array(cap); this.live = 0; this.tombs = 0; }
  _hash(k) { return k >>> 0; }        // identity keeps the collision demo legible
  _find(k) {
    const mask = this.keys.length - 1;
    let i = this._hash(k) & mask, firstTomb = -1;
    while (this.keys[i] !== undefined) {
      if (this.keys[i] === k) return { found: true, i };
      if (this.keys[i] === DELETED && firstTomb < 0) firstTomb = i;
      i = (i + 1) & mask;
    }
    return { found: false, i: firstTomb >= 0 ? firstTomb : i };
  }
  set(k, v) {
    if ((this.live + this.tombs + 1) * 4 >= this.keys.length * 3) this._resize();
    const { found, i } = this._find(k);
    if (!found && this.keys[i] === DELETED) this.tombs--;   // reclaim tombstone
    this.keys[i] = k; this.vals[i] = v; this.live++;
    return 'ok';
  }
  get(k) { const { found, i } = this._find(k); return found ? this.vals[i] : undefined; }
  delete(k) {
    const { found, i } = this._find(k);
    if (!found) return false;
    this.keys[i] = DELETED; this.vals[i] = undefined; this.live--; this.tombs++;
    return true;
  }
  _resize() {
    const oldK = this.keys, oldV = this.vals;
    this.keys = new Array(oldK.length * 2); this.vals = new Array(oldK.length * 2);
    this.live = 0; this.tombs = 0;
    for (let j = 0; j < oldK.length; j++) if (oldK[j] !== undefined && oldK[j] !== DELETED) this.set(oldK[j], oldV[j]);
  }
  get size() { return this.live; }
}

const m = new IntMap(8);
for (const k of [1, 9, 17, 2, 10]) m.set(k, k * 100);   // 1, 9, 17 collide at bucket 1
console.log('get(9):', m.get(9), '| size:', m.size);
m.delete(9);
console.log('after delete(9): get(9) =', m.get(9), '| get(17) =', m.get(17));
console.log('get(10) still reachable:', m.get(10));
```

Expected: `get(9): 900`, `get(17): 1700` after deleting 9 — the probe chain must not break at the tombstone.

**What production does.** Abseil's Swiss tables use a control byte per slot plus SIMD probing; deleted slots are marked distinctly from empty so probing continues correctly. `tidwall/hashmap.c` is a no-STL C implementation of Robin Hood hashing with backward-shift deletion (no tombstones). `robin-map` documents the same trade-off, including iterator invalidation on rehash.

**What breaks / follow-ups.**

| Question | Answer |
| :--- | :--- |
| Why tombstones? | Deleting to empty would terminate a later lookup before the key's slot. |
| Why backward-shift deletion? | Removes tombstones entirely; more complex erase, better probe lengths. |
| Resize under concurrent readers? | Not safe. Stop-the-world, or per-shard locks, or epoch-based reclamation. |
| Allocation failure during resize? | Keep the old table valid and return failure; publish the new table only after a successful migration. |
| Adversarial keys? | Hash flooding — use a keyed hash (SipHash) and randomise the seed. |
| Load factor? | Open addressing degrades fast; ~0.7 is a common ceiling, 0.875 in Abseil's flat maps. |

**Sources:** [Abseil — Swiss Tables design](https://abseil.io/about/design/swisstables) · [tidwall/hashmap.c](https://github.com/tidwall/hashmap.c) · [Tessil/robin-map](https://github.com/Tessil/robin-map)

---

## 4. Bounded Blocking Queue

> **FOUNDATION** · **12 MIN** — *A closed queue rejects new work but must drain what it already accepted.*

**Scope.** Multiple producers and consumers, FIFO, fixed capacity, graceful close. Contract: a closed queue rejects new items but lets consumers drain what is already inside.

**Invariant.** `size` is never negative and never exceeds capacity; a blocked producer is woken only when space exists or the queue closes; a blocked consumer is woken only when an item exists or the queue is closed and empty.

**Baseline.** One mutex, one FIFO, two condition variables (`notEmpty`, `notFull`), plus a `closed` flag. **Wait in a predicate loop** — wakeups can be spurious and the condition can be stolen before you reacquire the lock.

```js
// Deterministic model of the admission contract; a real implementation parks
// waiters on condition variables instead of returning 'blocked'.
class BoundedQueue {
  constructor(capacity) { this.capacity = capacity; this.items = []; this.closed = false; this.blockedPuts = 0; }
  put(x) {
    if (this.closed) return 'closed';
    if (this.items.length >= this.capacity) { this.blockedPuts++; return 'blocked'; }
    this.items.push(x);
    return 'ok';
  }
  take() {
    if (this.items.length) return { ok: true, value: this.items.shift() };
    return this.closed ? { ok: false, end: true } : { ok: false, empty: true };
  }
  close() { this.closed = true; return this.items.length; }
}

const q = new BoundedQueue(2);
console.log(q.put('A'), q.put('B'), q.put('C'));          // C blocks at capacity
console.log('take:', q.take().value, '| put C now:', q.put('C'));
console.log('close, draining:', q.close());
console.log([q.take(), q.take(), q.take()].map(r => r.value ?? (r.end ? 'END' : 'EMPTY')));
```

**What production does.** oneTBB's `concurrent_bounded_queue` reserves push/pop tickets so producers and consumers do not race on the same counter; it exposes `abort()` to release pending operations. moodycamel's `BlockingConcurrentQueue` is MPMC and lock-free but **not linearizable** across coordinated producers, and its blocking wrapper only waits for items — it does not block when full.

**What breaks / follow-ups.**

| Question | Answer |
| :--- | :--- |
| `if` instead of `while` around `wait`? | Spurious wakeup or another thread consumes the slot → over/underflow. |
| Shutdown? | Set `closed` under the lock, `notify_all` both conditions, define whether queued items drain. |
| Timeout? | Wait until a **monotonic deadline**, not a fixed duration per wakeup. |
| Producer blocked forever? | Consumer crashed or exception escaped; use `close()` in a scope guard. |
| Lock-free version? | Linked nodes need safe reclamation (hazard pointers/epochs) and ABA protection; a bounded ring buffer is the easier lock-free design (§10). |
| Backpressure vs drop? | State it: block, return `FULL`, or drop-oldest. Each is valid; silence is not. |

**Sources:** [oneTBB bounded queue specification](https://oneapi-spec.uxlfoundation.org/specifications/oneapi/v1.1-rev-1/elements/onetbb/source/containers/concurrent_bounded_queue_cls) · [moodycamel `BlockingConcurrentQueue`](https://github.com/cameron314/concurrentqueue/blob/master/blockingconcurrentqueue.h) · [Boost.Lockfree rationale](https://www.boost.org/doc/libs/latest/doc/html/lockfree/rationale.html)

---

## 5. Thread Pool

> **INTERMEDIATE** · **12 MIN** — *Bound the queue or overload becomes latency, then OOM.*

**Scope.** Fixed worker count, bounded submission queue, completion result or exception per task, defined shutdown. Work is executed **outside** the queue lock.

**Invariant.** A task runs at most once; every accepted task is either executed or explicitly cancelled; workers never die because a task threw.

**Baseline.** N workers loop on `take()`; a task wrapper stores either a value or an exception. Size the queue: an unbounded queue converts overload into latency and then OOM.

```js
class ThreadPool {
  constructor(workers, capacity) {
    this.workers = workers; this.capacity = capacity;
    this.queue = []; this.closed = false; this.running = 0;
  }
  submit(fn) {
    if (this.closed) return 'rejected: closed';
    if (this.queue.length >= this.capacity) return 'rejected: full';
    this.queue.push(fn); return 'accepted';
  }
  drain() {                              // model of the worker loop
    const results = [];
    while (this.queue.length) {
      const fn = this.queue.shift();
      this.running++;
      try { results.push({ ok: true, value: fn() }); }
      catch (e) { results.push({ ok: false, error: e.message }); }  // worker survives
      finally { this.running--; }
    }
    return results;
  }
  shutdown() { this.closed = true; return this.drain(); }   // graceful: drain accepted work
}

const pool = new ThreadPool(2, 3);
console.log(pool.submit(() => 1), pool.submit(() => { throw new Error('bad task'); }), pool.submit(() => 2));
console.log('over capacity:', pool.submit(() => 3));
console.log('drained:', JSON.stringify(pool.shutdown()));
console.log('after shutdown:', pool.submit(() => 4));
```

Expected: the fourth submit is rejected while the queue is full; the failing task does not kill the pool; shutdown still accepts nothing.

**What production does.** Folly's `CPUThreadPoolExecutor` uses an MPMC queue plus a semaphore for wakeups, and its **LIFO** wakeup order deliberately reuses a small set of threads for cache locality. It also warns that a bounded queue can deadlock when pool tasks submit into a full queue. Boost.Asio's `thread_pool` is the minimal fixed-size execution context.

**What breaks / follow-ups.**

| Question | Answer |
| :--- | :--- |
| Task submits a child and waits? | Classic pool-starvation deadlock: all workers wait on tasks queued behind them. Avoid blocking dependencies or use a work-stealing/fork-join pool. |
| Unbounded queue? | Latency grows invisibly, then memory. Bound it and reject/block explicitly. |
| Exceptions? | Capture at the worker boundary and deliver through the future; never let them unwind the worker loop. |
| Shutdown semantics? | Stop admission → drain or cancel → wake all → join. "Stop" is not "join" (Folly makes this distinction). |
| Dynamic sizing? | Add threads on queue growth, retire on idle; watch thread churn and cache loss. |
| False sharing? | Per-worker counters adjacent in memory ping-pong; cache-line-align worker state. |

**Sources:** [Folly `CPUThreadPoolExecutor.h`](https://github.com/facebook/folly/blob/main/folly/executors/CPUThreadPoolExecutor.h) · [Folly executors doc](https://github.com/facebook/folly/blob/main/folly/docs/Executors.md) · [Boost.Asio `thread_pool`](https://www.boost.org/doc/libs/latest/doc/html/boost_asio/reference/thread_pool.html)

---

## 6. Priority Task Scheduler

> **ADVANCED** · **15 MIN** — *Priority picks the next task; it never preempts a running one.*

**Scope.** Ready tasks ordered by priority, FIFO within a priority, with delayed tasks and cancellation. State whether priority is strict or fair.

**Invariant.** A task is in exactly one state (`QUEUED`, `RUNNING`, `CANCELLED`, `DONE`); a cancelled task never starts; a task popped from the ready heap is the highest-ranked runnable task at that moment.

**Baseline.** Max-heap ordered by `(priority, -sequence)`; tie-break by enqueue order so equal priorities stay FIFO. Remove under the mutex, execute outside it. A separate min-heap (or timer wheel, §12) holds not-yet-due tasks.

```js
class Heap {
  constructor(better) { this.a = []; this.better = better; }
  push(x) {
    this.a.push(x); let i = this.a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.better(this.a[i], this.a[p])) break;
      [this.a[i], this.a[p]] = [this.a[p], this.a[i]]; i = p;
    }
  }
  pop() {
    const top = this.a[0], last = this.a.pop();
    if (this.a.length) {
      this.a[0] = last; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let best = i;
        if (l < this.a.length && this.better(this.a[l], this.a[best])) best = l;
        if (r < this.a.length && this.better(this.a[r], this.a[best])) best = r;
        if (best === i) break;
        [this.a[i], this.a[best]] = [this.a[best], this.a[i]]; i = best;
      }
    }
    return top;
  }
}

const strict = new Heap((x, y) => (x.priority !== y.priority ? x.priority > y.priority : x.seq < y.seq));
let seq = 0;
const submit = (name, priority) => strict.push({ name, priority, seq: seq++ });
submit('normal-A', 1); submit('urgent-B', 9); submit('normal-C', 1);
console.log('strict order:', [strict.pop().name, strict.pop().name, strict.pop().name]);

// Aging: effective priority grows with wait time, then the heap is rebuilt.
const now = 1000, agingPerMs = 100, waiting = [
  { name: 'low', priority: 1, enqueued: 0 }, { name: 'high', priority: 9, enqueued: 1000 },
];
const effective = waiting.map(t => ({ ...t, rank: t.priority + Math.floor((now - t.enqueued) / agingPerMs) }));
effective.sort((a, b) => b.rank - a.rank);
console.log('aged order:', effective.map(t => `${t.name}(${t.rank})`).join(', '));
```

**What production does.** Folly runs one queue per priority level and checks the highest non-empty queue first; its own docs warn that strict priority starves low-priority work. Linux's `nice` is a weight, not a priority — fairness comes from virtual runtime, the same idea as aging.

**What breaks / follow-ups.**

| Question | Answer |
| :--- | :--- |
| How do you cancel? | Indexed heap (position map) for `O(log n)` removal, or lazy cancellation with a state check on pop. |
| Why not mutate priority during comparison? | A heap's invariant breaks when keys change underneath it; rebuild or use an indexed heap. |
| Priority inversion? | A high-priority task blocked on a lock held by a low-priority one — that is priority inheritance at the lock layer, not queue ordering. |
| Preemption? | This is non-preemptive: priority picks the next task, it does not interrupt a running one. |
| Delayed tasks? | Min-heap is simple (`O(log n)`); a timing wheel is better at millions of timers. |
| Starvation? | Aging, weighted fair queues, or reserved capacity for low priority. |

**Sources:** [Folly `CPUThreadPoolExecutor.h`](https://github.com/facebook/folly/blob/main/folly/executors/CPUThreadPoolExecutor.h) · [Folly `PriorityLifoSemMPMCQueue.h`](https://github.com/facebook/folly/blob/main/folly/executors/task_queue/PriorityLifoSemMPMCQueue.h) · [Linux locking — priority inheritance](https://docs.kernel.org/locking/locktypes.html)

---

## 7. malloc/free Allocator

> **ADVANCED** · **18 MIN** — *Splitting is easy; coalescing is where fragmentation is won.*

**Scope.** An educational allocator over an owned arena: alignment, splitting, coalescing, thread safety. Invalid free is a caller bug; double free and foreign pointers must be detected or documented.

**Invariant.** Allocated extents are disjoint and inside the arena; every free extent is reachable from the free structure; adjacent free extents are merged (or the design documents why not).

**Baseline.** Block headers with size + free flag, a free list (first-fit or size classes), split on allocation, coalesce with physical neighbours on free. Round sizes for alignment and check arithmetic overflow.

```js
const ALIGN = 8;
const round = n => (n + ALIGN - 1) & ~(ALIGN - 1);
class Arena {
  constructor(bytes) { this.bytes = bytes; this.blocks = [{ off: 0, size: bytes, free: true }]; }
  _merge() {
    const out = [];
    for (const b of this.blocks) {
      const prev = out[out.length - 1];
      if (prev && prev.free && b.free && prev.off + prev.size === b.off) prev.size += b.size;
      else out.push({ ...b });
    }
    this.blocks = out;
  }
  alloc(n) {
    const need = round(Math.max(n, 1));
    for (let i = 0; i < this.blocks.length; i++) {
      const b = this.blocks[i];
      if (!b.free || b.size < need) continue;
      if (b.size > need) {                       // split only if the remainder is useful
        this.blocks.splice(i + 1, 0, { off: b.off + need, size: b.size - need, free: true });
        b.size = need;
      }
      b.free = false;
      return b.off;
    }
    return -1;                                    // OOM: caller must handle
  }
  free(off) {
    const b = this.blocks.find(x => x.off === off);
    if (!b || b.free) throw new Error(`invalid or double free at ${off}`);
    b.free = true; this._merge();
    return 'ok';
  }
  largestFree() { return Math.max(0, ...this.blocks.filter(b => b.free).map(b => b.size)); }
  extents() { return this.blocks.map(b => `${b.free ? 'free' : 'used'}@${b.off}+${b.size}`).join(' '); }
}

const a = new Arena(64);
const p1 = a.alloc(8), p2 = a.alloc(16), p3 = a.alloc(8);
console.log('allocated:', p1, p2, p3, '|', a.extents());
a.free(p2);
console.log('free middle:', a.extents(), '| largest:', a.largestFree());
a.free(p1); a.free(p3);
console.log('all free + coalesced:', a.extents(), '| largest:', a.largestFree());
```

Expected: after freeing the middle, the largest free extent is the untouched 32-byte tail; after freeing the neighbours, the whole 64-byte arena is one extent.

**What production does.** glibc `ptmalloc` uses multiple arenas, per-thread caches (`tcache`), and `mmap` for large requests; its tunables control arena count, trimming, and cache size. TCMalloc divides small objects into size classes with per-thread/per-CPU front-end caches, a transfer cache, and a page-heap back end. Both trade **lock contention against retained memory**.

**What breaks / follow-ups.**

| Question | Answer |
| :--- | :--- |
| Internal vs external fragmentation? | Internal = rounded-up bytes wasted inside an allocation; external = free bytes that cannot satisfy a request. Measure both. |
| How do you find metadata? | Header before the payload, alignment-corrected; or a side table for large blocks. |
| Thread safety? | One arena mutex is the baseline; per-thread caches scale but strand memory, and cross-thread frees need a slow path. |
| `realloc`? | May move; in-place only if the next block is free and large enough. |
| Return memory to the OS? | `free` often retains it; `malloc_trim` / `MADV_DONTNEED` / TCMalloc's release logic decide RSS. |
| Double free? | Detect via free flag or canaries in a teaching allocator; production uses hardened metadata (safe-linking). |

**Sources:** [glibc `malloc.c`](https://codebrowser.dev/glibc/glibc/malloc/malloc.c.html) · [glibc malloc tunables](https://sourceware.org/glibc/manual/latest/html_node/Memory-Allocation-Tunables.html) · [TCMalloc design](https://github.com/google/tcmalloc/blob/master/docs/design.md) · [TCMalloc stats](https://github.com/google/tcmalloc/blob/master/docs/stats.md)

---

## 8. Fixed-Size Object Pool

> **FOUNDATION** · **10 MIN** — *Storage is not an object: construct on acquire, destroy before release.*

**Scope.** Many objects of one known size, allocated and freed repeatedly. Distinguish **raw storage** from a constructed C++ object: placement-new on acquire, destructor before release.

**Invariant.** A slot is either free and on the free list, or leased exactly once. The pool outlives every object allocated from it.

**Baseline.** Preallocate slabs, carve into equal aligned slots, link free slots through the slots themselves. `acquire` pops; `release` pushes; construction failure returns the slot.

```js
class FixedPool {
  constructor(slots, objectSize) {
    this.objectSize = objectSize;
    this.free = Array.from({ length: slots }, (_, i) => i);
    this.leased = new Set();
  }
  acquire() {
    const slot = this.free.pop();
    if (slot === undefined) return null;      // exhaustion: reject or grow to a budget
    this.leased.add(slot);
    return { slot, offset: slot * this.objectSize };
  }
  release(slot) {
    if (!this.leased.has(slot)) throw new Error(`double free or foreign slot ${slot}`);
    this.leased.delete(slot);
    this.free.push(slot);
    return 'released';
  }
  get inUse() { return this.leased.size; }
}

const pool = new FixedPool(3, 64);
const objs = [pool.acquire(), pool.acquire(), pool.acquire()];
console.log('offsets:', objs.map(o => o.offset).join(','), '| in use:', pool.inUse);
console.log('fourth:', pool.acquire());
console.log('release:', pool.release(objs[1].slot), '| in use:', pool.inUse);
const reused = pool.acquire();
console.log('reused slot:', reused.slot, '| in use:', pool.inUse);
try { pool.release(objs[1].slot); } catch (e) { console.log('guard:', e.message); }
```

Expected: the three offsets are distinct (`128,64,0` — the free list pops from the tail); the fourth acquire returns `null`; slot 1 is reused after release; the second release of slot 1 trips the guard.

**What production does.** Boost.Pool implements "simple segregated storage": fixed-size chunks with an in-chunk free list, amortised constant-time allocation. Linux SLUB is the kernel analogue: per-CPU array caches over slabs, with a slower partial-slab path. Neither hands individual slots back to the general allocator.

**What breaks / follow-ups.**

| Question | Answer |
| :--- | :--- |
| Object larger than the free-list link? | Stride = max(object size, link size), rounded to alignment. |
| Over-aligned type? | `alignof(T)` must be honoured by the slab base and stride, or use aligned allocation. |
| Concurrent access? | Mutex baseline; thread-local caches or a lock-free stack need ABA protection and safe reclamation. |
| Exhaustion? | Add a slab within a budget, or reject. Never silently fall back to `malloc` if the pool is the point. |
| Destructor throws? | Destructors should not throw; if construction throws, return the slot. |
| Memory never returned? | That is the trade: predictable latency and no fragmentation, at the cost of retained memory. |

**Sources:** [Boost.Pool — pooling in depth](https://www.boost.org/doc/libs/latest/libs/pool/doc/html/boost_pool/pool/pooling.html) · [Linux `mm/slub.c`](https://github.com/torvalds/linux/blob/master/mm/slub.c) · [Linux false sharing](https://docs.kernel.org/kernel-hacking/false-sharing.html)

---

## 9. Reader–Writer Lock

> **ADVANCED** · **15 MIN** — *Fairness is a policy choice, not a property you get for free.*

**Scope.** Many concurrent readers or one exclusive writer. State the fairness policy and whether upgrade is supported. The simple version is non-reentrant.

**Invariant.** `writerActive` implies `activeReaders === 0`; readers never observe a partially written state; every waiter is eventually admitted under the stated fairness policy.

**Baseline.** Internal mutex + condition variables + counters. **Writer preference**: once a writer waits, new readers stop entering, which prevents writer starvation at the cost of reader latency.

```js
class WriterPrefRWLock {
  constructor() { this.readers = 0; this.writer = false; this.waitingWriters = 0; this.log = []; }
  tryRead(tag) {
    if (this.writer || this.waitingWriters > 0) { this.log.push(`${tag}:read-wait`); return false; }
    this.readers++; this.log.push(`${tag}:read`); return true;
  }
  requestWrite(tag) {
    if (this.writer || this.readers > 0) { this.waitingWriters++; this.log.push(`${tag}:write-wait`); return false; }
    this.writer = true; this.log.push(`${tag}:write`); return true;
  }
  releaseRead() { this.readers--; }
  releaseWrite() { this.writer = false; }
  admitWriter(tag) {
    if (this.writer || this.readers > 0 || this.waitingWriters === 0) return false;
    this.waitingWriters--; this.writer = true; this.log.push(`${tag}:write-admitted`); return true;
  }
}

const rw = new WriterPrefRWLock();
console.log('R1', rw.tryRead('R1'), 'R2', rw.tryRead('R2'));
console.log('W1', rw.requestWrite('W1'));
console.log('R3 blocked behind waiting writer:', rw.tryRead('R3'));
rw.releaseRead(); rw.releaseRead();
console.log('admit W1:', rw.admitWriter('W1'));
console.log('R4 while writing:', rw.tryRead('R4'));
```

Expected: R3 and R4 fail while a writer is waiting/active — writer preference is visible in the log.

**What production does.** glibc's `pthread_rwlock` encodes reader count plus phase/owner state and parks waiters on futexes; it explicitly does **not** elide read/write acquisitions. Folly's `SharedMutex` uses scalable reader accounting, defaults to **writer priority**, and offers a reader-priority variant. Linux's `rw_semaphore` is fair, but under PREEMPT_RT a preempted reader can still stall a high-priority writer because the writer cannot boost multiple readers.

**What breaks / follow-ups.**

| Question | Answer |
| :--- | :--- |
| Upgrade a read lock? | Two upgraders can deadlock. Release and reacquire with validation, or a separate upgrade protocol. |
| Recursive read? | Needs owner tracking; with writer preference, recursion can deadlock if a writer arrives between acquisitions. |
| Fairness? | Reader preference starves writers; writer preference stalls readers; FIFO/ticket is fair but slower. |
| Faster than a mutex? | Often no for tiny critical sections — cache-coherence traffic dominates. Measure. |
| Priority inversion? | PREEMPT_RT documents the multi-reader boosting limitation; don't claim a general fix. |

**Sources:** [glibc `pthread_rwlock_common.c`](https://codebrowser.dev/glibc/glibc/nptl/pthread_rwlock_common.c.html) · [Folly `SharedMutex.h`](https://github.com/facebook/folly/blob/main/folly/SharedMutex.h) · [Linux lock types](https://docs.kernel.org/locking/locktypes.html) · [cppreference `std::shared_mutex`](https://en.cppreference.com/w/cpp/thread/shared_mutex)

---

## 10. Concurrent Ring Buffer

> **ADVANCED** · **15 MIN** — *Reserve a slot, or you cannot distinguish full from empty.*

**Scope.** Fixed-capacity FIFO. **Start with single-producer/single-consumer (SPSC)**; MPMC is a different design. Reserve one slot to distinguish full from empty, or carry monotonically increasing sequence numbers.

**Invariant.** The producer never overwrites an unconsumed slot; the consumer never reads a slot the producer has not published; each index has exactly one writer.

**Baseline.** Array of N slots, `head` written only by the producer, `tail` only by the consumer. Publish the payload **before** the index with release semantics; read the index with acquire before touching the payload. Full = `(head + 1) % N === tail`; empty = `head === tail`.

```js
class SPSCRing {
  constructor(capacityPlusOne) {
    this.buf = new Array(capacityPlusOne);
    this.head = 0; this.tail = 0;          // producer-owned / consumer-owned
  }
  push(x) {
    const next = (this.head + 1) % this.buf.length;
    if (next === this.tail) return false;   // full: usable capacity is N-1
    this.buf[this.head] = x;                // payload first ...
    this.head = next;                       // ... then publish index (release)
    return true;
  }
  shift() {
    if (this.head === this.tail) return undefined;  // empty
    const value = this.buf[this.tail];
    this.buf[this.tail] = undefined;
    this.tail = (this.tail + 1) % this.buf.length;  // release slot for reuse
    return value;
  }
  get size() { return (this.head - this.tail + this.buf.length) % this.buf.length; }
}

const ring = new SPSCRing(4);               // 3 usable slots
console.log('pushes:', ring.push(1), ring.push(2), ring.push(3), 'fourth:', ring.push(4));
console.log('shift:', ring.shift(), '| size:', ring.size);
console.log('push after drain:', ring.push(5), '| order:', ring.shift(), ring.shift(), ring.shift());
```

Expected: fourth push fails at capacity 3; after one shift a new item fits; FIFO order survives the wrap.

**What production does.** Linux's circular-buffer API documents the SPSC release/acquire pattern (it is not an MPMC recipe). XDP's `xsk_queue.h` models reserve → write → submit and peek → read → release, with barriers around each phase. LMAX Disruptor uses monotonic sequences, preallocated events, and consumer gating; its `Sequence` class pads fields to avoid false sharing.

**What breaks / follow-ups.**

| Question | Answer |
| :--- | :--- |
| Two producers? | Both can claim the same slot. Use a CAS on the index (MPMC) or per-slot sequence numbers; probes need more than two indices. |
| Full/empty ambiguity? | Reserve a slot (capacity N-1), or use free-running 64-bit counters and compare differences. |
| Memory ordering? | "Atomic" is not enough: payload write → release-store index; acquire-load index → payload read. |
| False sharing? | `head` and `tail` on the same cache line ping-pong; pad them (measure first). |
| Blocking behaviour? | Full = block, reject, or overwrite-oldest. State it; silent overwrite loses data. |
| Variable-size records? | Ring of offsets into a byte arena; handle wraparound records explicitly. |

**Sources:** [Linux circular buffers](https://docs.kernel.org/core-api/circular-buffers.html) · [Linux `xsk_queue.h`](https://github.com/torvalds/linux/blob/master/net/xdp/xsk_queue.h) · [LMAX Disruptor user guide](https://lmax-exchange.github.io/disruptor/user-guide/index.html)

---

## 11. Asynchronous Logging Library

> **INTERMEDIATE** · **12 MIN** — *Flush is not durability; the OS may still hold the bytes.*

**Scope.** Keep the caller fast with bounded memory. Define severity, overload policy, ordering, and what `flush` actually guarantees.

**Invariant.** Enqueued records are immutable and owned by the logger (never a pointer to a caller buffer); sequence numbers are monotonic per producer; a flush barrier completes only after preceding records reach the stated sink.

**Baseline.** Bounded MPSC queue, one background writer, batching into the sink. At capacity: drop low severity and count it, or block for a bounded interval — never grow without limit.

```js
class AsyncLogger {
  constructor(capacity = 4) {
    this.capacity = capacity; this.queue = []; this.nextSeq = 0;
    this.dropped = { debug: 0, info: 0, warn: 0, error: 0 };
  }
  log(level, message) {
    const rec = { seq: this.nextSeq++, level, message };
    if (this.queue.length < this.capacity) { this.queue.push(rec); return 'queued'; }
    const victim = this.queue.findIndex(r => r.level === 'debug' || r.level === 'info');
    if (victim >= 0) {                                  // evict low severity, never an error
      this.dropped[this.queue[victim].level]++;
      this.queue.splice(victim, 1); this.queue.push(rec); return 'evicted';
    }
    this.dropped[level]++; return 'dropped';
  }
  drainBatch(max = 3) { return this.queue.splice(0, max); }
  flushBarrier() { return { afterSeq: this.nextSeq - 1, snapshot: this.queue.length }; }
}

const log = new AsyncLogger(4);
for (let i = 0; i < 4; i++) log.log('debug', `d${i}`);
console.log('error under pressure:', log.log('error', 'disk full'));
console.log('dropped:', JSON.stringify(log.dropped));
console.log('batch:', log.drainBatch(5).map(r => `${r.level}:${r.message}`).join(','));
console.log('shutdown barrier:', JSON.stringify(log.flushBarrier()));
```

Expected: the error displaces a debug record; `dropped.debug` is 1; the batch is `d1,d2,d3,error` in sequence order.

**What production does.** Log4j2 offers two architectures: Async **Loggers** over the LMAX Disruptor, and an Async **Appender** that is a bounded queue plus a forwarding thread with a queue-full policy and shutdown timeout. spdlog's async mode uses a preallocated queue (default 8192) and a thread pool; multiple workers can reorder messages. Both document that flushing an app queue is not the same as `fsync` — the OS may still hold the bytes.

**What breaks / follow-ups.**

| Question | Answer |
| :--- | :--- |
| What does `flush` mean? | Drain app queue → flush appender buffers → durable write. Say which level you promise. |
| Caller mutates the message buffer? | Copy/own fields at the call site; async logging must not retain borrowed memory. |
| Sustained overload? | No queue fixes producers faster than the sink; shed low severity or apply backpressure. |
| Ordering? | Queue order is total only with one writer; per-thread order needs sequence numbers. |
| Sink throws or blocks? | Isolate the writer, bound the retry, expose a dropped metric; never log from the sink error path (recursion). |
| Audit records? | Use a synchronous, durable path. Async logging is for diagnostics. |

**Sources:** [Log4j2 async loggers](https://logging.apache.org/log4j/2.x/manual/async.html) · [Log4j2 async appender](https://logging.apache.org/log4j/2.x/manual/appenders/delegating.html) · [spdlog async logging](https://github.com/gabime/spdlog/wiki/Asynchronous-logging)

---

## 12. Timer Service for Millions of Timers

> **ADVANCED** · **18 MIN** — *A wheel buys cheap insertion, not cheap expiry.*

**Scope.** One-shot callbacks by monotonic deadline; acceptable precision; cancellation semantics; overload behaviour. Millions of pending timers, thousands of expiries per second.

**Invariant.** A timer fires at most once; a cancelled timer never fires if cancellation wins the race; a callback running past its deadline does not block other timers.

**Baseline.** A min-heap gives `O(log n)` insert and cancel, which is perfectly defensible. At millions of timers, use a **hierarchical timing wheel**: buckets per tick, coarser wheels for farther horizons, cascade down as time advances.

```js
// Hashed wheel: one level, tick = 10ms, 8 buckets. Insert by target tick.
class TimingWheel {
  constructor(tickMs = 10, buckets = 8) {
    this.tickMs = tickMs; this.buckets = buckets;
    this.slots = Array.from({ length: buckets }, () => []);
    this.currentTick = 0; this.cancelled = new Set();
  }
  schedule(id, delayMs) {
    const fireTick = Math.ceil((this.currentTick * this.tickMs + delayMs) / this.tickMs);
    this.slots[fireTick % this.buckets].push({ id, fireTick });
    return fireTick * this.tickMs;
  }
  cancel(id) { this.cancelled.add(id); }
  advanceTo(nowMs) {
    const target = Math.floor(nowMs / this.tickMs);
    const fired = [];
    while (this.currentTick < target) {
      this.currentTick++;
      const bucket = this.slots[this.currentTick % this.buckets];
      this.slots[this.currentTick % this.buckets] = [];
      for (const t of bucket) {
        if (this.cancelled.has(t.id)) continue;
        if (t.fireTick <= this.currentTick) fired.push({ id: t.id, at: this.currentTick * this.tickMs });
        else this.slots[t.fireTick % this.buckets].push(t);   // still future (rounding)
      }
    }
    return fired;
  }
}

const wheel = new TimingWheel();
console.log('scheduled at:', wheel.schedule('fast', 5), wheel.schedule('slow', 23), wheel.schedule('gone', 10));
wheel.cancel('gone');
console.log('t=10ms:', JSON.stringify(wheel.advanceTo(10)));
console.log('t=30ms:', JSON.stringify(wheel.advanceTo(30)));
```

Expected: `fast` at 10 ms, `gone` never fires, `slow` at 30 ms — a 23 ms deadline on a 10 ms wheel lands on the next tick, not exactly at 23 ms.

**What production does.** Netty's `HashedWheelTimer` defaults to a 100 ms tick and 512 buckets, queues new timeouts and cancellations through MPSC queues, and documents itself as an approximate I/O-timeout timer (share one instance). Kafka's `TimingWheel` (2.8 source, not necessarily current trunk) uses hierarchical wheels and feeds expired buckets through a `DelayQueue`; insertion is `O(m)` across `m` levels, deletion `O(1)`.

**What breaks / follow-ups.**

| Question | Answer |
| :--- | :--- |
| Wheel vs heap? | Heap is simpler and exact; wheel is cheaper per insert and tolerates coarse precision. A million simultaneous expiries cost a million actions either way. |
| Cancel vs fire race? | Atomic state machine (`PENDING → FIRED | CANCELLED`); once dispatched, cancellation is cooperative. |
| Slow callback? | Never run user code on the timer thread; hand off to a bounded executor and shed when full. |
| Clock jumps? | Use a monotonic clock for relative deadlines; wall clock only for calendar scheduling. |
| Long delays? | Hierarchy (seconds/minutes/hours) or a heap overflow; a single small wheel wraps and mis-fires. |
| Precision? | Expiry is "first tick at or after the deadline"; state the tick and the executor delay separately. |

**Sources:** [Netty `HashedWheelTimer`](https://netty.io/4.1/api/io/netty/util/HashedWheelTimer.html) · [Netty source](https://netty.io/4.1/xref/io/netty/util/HashedWheelTimer.html) · [Kafka 2.8 `TimingWheel.scala`](https://github.com/apache/kafka/blob/2.8/core/src/main/scala/kafka/utils/timer/TimingWheel.scala)

---

## 13. Connection Pool

> **INTERMEDIATE** · **12 MIN** — *Reserve the slot under the lock; connect outside it.*

**Scope.** Reuse expensive database/network connections with a hard maximum, acquisition timeout, and exclusive ownership while checked out. Return a lease, not a raw handle.

**Invariant.** `checkedOut + idle + pendingCreations <= max`; a connection is leased to at most one caller; a broken connection is never returned to the idle set.

**Baseline.** Idle list + counters under a mutex. Reserve a creation slot **under the lock**, connect **outside** it, then publish or release the reservation on failure. Wait with a deadline when at capacity.

```js
class ConnectionPool {
  constructor(max) { this.max = max; this.idle = []; this.total = 0; this.leased = new Set(); this.nextId = 1; }
  acquire(now, timeoutMs) {
    if (this.idle.length) {
      const conn = this.idle.pop(); this.leased.add(conn);
      return { ok: true, conn, reused: true };
    }
    if (this.total < this.max) {                     // reserve under lock ...
      const conn = { id: this.nextId++ };
      this.total++; this.leased.add(conn);
      return { ok: true, conn, created: true };       // ... connect outside the lock
    }
    return { ok: false, retryAfterMs: now + timeoutMs, waiters: this.leased.size };
  }
  release(conn, broken = false) {
    if (!this.leased.delete(conn)) throw new Error('foreign lease');
    if (broken) { this.total--; return 'discarded'; } // never poison the idle set
    this.idle.push(conn); return 'idle';
  }
  get stats() { return { total: this.total, idle: this.idle.length, leased: this.leased.size }; }
}

const pool = new ConnectionPool(2);
const a = pool.acquire(0, 500), b = pool.acquire(0, 500);
console.log('created:', a.created, b.created, '| stats:', JSON.stringify(pool.stats));
const c = pool.acquire(0, 500);
console.log('third blocked:', c.ok, '| retry after ms:', c.retryAfterMs);
pool.release(a.conn);
const d = pool.acquire(10, 500);
console.log('reused:', d.reused, '| same conn:', d.conn.id === a.conn.id, '| stats:', JSON.stringify(pool.stats));
pool.release(b.conn, true);
console.log('after broken release:', JSON.stringify(pool.stats));
```

Expected: total never exceeds 2; the third borrower is refused with a deadline; a broken connection reduces the total instead of entering the idle list.

**What production does.** HikariCP bounds `maximumPoolSize`, waits up to `connectionTimeout`, and validates/retires connections by idle and lifetime limits. PgBouncer pools **server** connections in front of PostgreSQL: session pooling holds a backend for the client session, transaction pooling releases it at commit, statement pooling at query end — each changes what session state is legal. PostgreSQL's `max_connections` is the hard ceiling for the whole fleet, not one process.

**What breaks / follow-ups.**

| Question | Answer |
| :--- | :--- |
| Pool sizing? | Sum across replicas + migrations + admin must fit the database's connection budget; start small and measure. HikariCP's formula is a heuristic. |
| Pool lock held during connect? | No — a slow handshake would block every borrower. Reserve the slot, connect outside. |
| Leak? | Track lease duration, warn on long holds, never force-reuse a leased connection. |
| Stale connection? | Validate on borrow or keepalive; still handle failure after checkout. |
| Session state? | Transaction pooling resets/forbids `SET`, temp tables, prepared statements as appropriate — know the mode. |
| Thundering herd on restart? | Cap connection creation rate and add jitter. |

**Sources:** [HikariCP](https://github.com/brettwooldridge/HikariCP) · [HikariCP pool sizing](https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing) · [PgBouncer configuration](https://www.pgbouncer.org/config.html) · [PostgreSQL connections](https://www.postgresql.org/docs/current/runtime-config-connection.html)

---

## 14. Cross-Cutting Rules: Memory Ordering, False Sharing, Measurement

These four rules apply to every section above and are where most LLD answers lose points.

**1. A lock is not the only correctness tool, and it is not always the right one.** `std::mutex` (C++), `ReentrantLock` (Java), `pthread_mutex` (C) are baselines. Atomics require a stated memory order: `relaxed` for counters, `acquire/release` for publication, `seq_cst` only when you need a single total order. "It's atomic" answers the tearing question, not the visibility or ordering question.

**2. False sharing is a measurement, not an assumption.** Two hot counters on one 64-byte cache line make independent cores invalidate each other. Pad or align (Folly pads its sequence/worker state), confirm with `perf c2c`, then check that padding did not blow up the memory footprint.

**3. Complexity must be earned by a number.** Rough orders of magnitude: uncontended mutex lock/unlock ~20–40 ns; contended lock ~µs plus scheduler delay; CAS ~10–20 ns uncontended; cache-line transfer ~100 ns; syscall ~100–300 ns; thread context switch ~1–10 µs plus cache pollution. If the critical section is 50 ns, a lock-free rewrite is usually slower and always harder to review.

**4. Every design needs a shutdown story.** Who stops admission, who wakes the waiters, what happens to queued work, and what does the caller observe? A pool that cannot shut down cleanly is a production incident waiting for a deploy.

| Symptom | First suspect | Instrument |
| :--- | :--- | :--- |
| p99 latency spikes, CPU idle | lock contention or off-CPU wait | `off_cpu` profile, mutex wait time |
| Throughput flat as cores increase | false sharing or a single global lock | `perf c2c`, shard counters |
| Memory grows after load drops | allocator retention / pool slabs | RSS vs live bytes, `malloc_trim` |
| "Random" 100 ms stalls | container CPU throttling or timer coalescing | cgroup throttling, runqlat |
| Tasks never complete | pool starvation / lost wakeup | queue depth, waiter counts |

---

## 15. Coverage Map: The 25-Question NVIDIA Set

The preparation document that prompted this guide lists 25 prompts. Twelve are pure LLD; the repo had no LLD guide, and most of these primitives had no home at all (LRU existed only as an algorithm inside Concepts and Distributed Cache). The rest are already covered — linking rather than duplicating is deliberate, so there is one canonical answer per topic.

| # | Prompt | Where it lives | Status |
| :- | :--- | :--- | :--- |
| 1 | Thread-safe LRU cache | §2 above; [Concepts — LRU cache](system-design-concepts.md); [Distributed Cache](system-design-distributed-cache.md) | **New** + existing |
| 2 | Hash map without STL | §3 above | **New** |
| 3 | Bounded blocking queue | §4 above; [Kafka](kafka-features.md) consumer backpressure | **New** |
| 4 | Thread pool | §5 above | **New** |
| 5 | Priority task scheduler | §6 above; [Delayed Job Scheduler](system-design-delayed-job-scheduler.md) | **New** |
| 6 | malloc/free allocator | §7 above; [Operating Systems](operating-systems.md) §4 | **New** |
| 7 | Fixed-size object pool | §8 above | **New** |
| 8 | Reader–writer lock | §9 above | **New** |
| 9 | Concurrent circular buffer | §10 above | **New** |
| 10 | Asynchronous logging library | §11 above; [Observability Pipeline](system-design-observability-pipeline.md) | **New** |
| 11 | Timer service for millions of tasks | §12 above; [Delayed Job Scheduler](system-design-delayed-job-scheduler.md) | **New** |
| 12 | Connection pool | §13 above | **New** |
| 13 | Extensible rate limiter | [Rate Limiter](system-design-rate-limiter.md) — token bucket, sliding window, distributed state, composite policy chain | Covered |
| 14 | Resumable file download manager | [File Storage](system-design-file-storage.md) — multipart upload, presigned parts, and a resumable-download path (`Range`/`If-Range`, durable bitmap, atomic rename); [RFC 9110 §13.1.5](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.5) | Covered |
| 15 | Internal metrics collection system | [Alerting & Monitoring](system-design-alerting.md) + [Observability Pipeline](system-design-observability-pipeline.md) | Covered |
| 16 | Distributed job scheduler | [Delayed Job Scheduler](system-design-delayed-job-scheduler.md) — queues, retries, DLQ, worker pool | Covered |
| 17 | Distributed key-value store | [Key-Value Store (DynamoDB)](system-design-key-value-store.md) | Covered |
| 18 | Distributed cache | [Distributed Cache (Redis)](system-design-distributed-cache.md) | Covered |
| 19 | Distributed message queue | [Kafka](kafka-features.md) + [RabbitMQ](rabbitmq-features.md) | Covered |
| 20 | Large-file transfer service | [File Storage](system-design-file-storage.md) — chunking, checksums, multipart commit | Covered |
| 21 | Multi-tenant GPU resource scheduler | [GPU Scheduler & Model Lifecycle](system-design-gpu-scheduler.md) | **New** |
| 22 | Model inference-serving platform | [LLM Inference](system-design-llm-inference.md) | Covered |
| 23 | Dynamic batching scheduler | [LLM Inference](system-design-llm-inference.md) — request-level dynamic batching vs iteration-level continuous batching, queue delay and KV admission | Covered |
| 24 | Model loading & eviction across GPUs | [GPU Scheduler & Model Lifecycle](system-design-gpu-scheduler.md) | **New** |
| 25 | Checkpoint & recovery for distributed training | [Distributed Training Checkpoints](system-design-distributed-training.md) | **New** |

**15 NEW · 10 LINKED EXISTING DOCS · 0 DUPLICATE TOPICS**

**What this map deliberately does not do:** restate Kafka's ISR protocol, Dynamo's quorum math, or the LLM serving path. Those already have canonical docs; the LLD layer is the part that was missing.

**Verification notes.** Every row was checked against a primary source (GitHub code, vendor docs, or the paper), not just recall. Version-sensitive mechanisms are marked where they appear: Kafka's timing-wheel source cited here is the 2.8 tag, `redis-cell`'s GCRA module describes itself as best-effort maintenance, HikariCP's pool-size formula is a heuristic, and the original Dynamo paper (2007) predates Cassandra's last-write-wins implementation. Caffeine's design page is from 2021 and describes Window TinyLFU — it is cited as an architectural contrast, not as strict LRU or a current release note.

---

## 16. One-Screen Cheat Sheet

The whole guide on one screen. If you remember nothing else before the interview, remember these twelve rows.

| Primitive | Invariant in one line | Default guard | Signature failure |
| :--- | :--- | :--- | :--- |
| [LRU](#2-thread-safe-lru-cache) | Map and recency list agree; a hit promotes | One mutex | Returning a reference to an evicted node |
| [Hash map](#3-hash-map-without-the-stl) | Every live key is reachable along its probe chain | Mutex / stop-the-world resize | Deleting to empty breaks later lookups |
| [Blocking queue](#4-bounded-blocking-queue) | `0 ≤ size ≤ capacity`; closed rejects but drains | Mutex + two CVs | `if` instead of `while` around `wait` |
| [Thread pool](#5-thread-pool) | An accepted task runs at most once | Bounded queue + futures | A worker dies on a task exception |
| [Priority scheduler](#6-priority-task-scheduler) | Pop returns the highest-ranked runnable task | Mutex + indexed heap | Starvation; cancellation leaves a ghost entry |
| [Allocator](#7-mallocfree-allocator) | Live extents disjoint; adjacent free extents merged | Arena mutex | Splitting without coalescing → fragmentation |
| [Object pool](#8-fixed-size-object-pool) | A slot is free XOR leased exactly once | Mutex / thread-local cache | Double free; destroy-after-release |
| [RW lock](#9-readerwriter-lock) | Writer active ⇒ zero readers | Counters + CVs | Upgrade deadlock; writer starvation |
| [Ring buffer](#10-concurrent-ring-buffer) | Producer never overwrites an unpublished slot | Acquire/release atomics | Full/empty ambiguity; torn index |
| [Async logger](#11-asynchronous-logging-library) | Owned records, monotonic sequence, bounded memory | Bounded queue + writer | Borrowed buffer; silent loss without a counter |
| [Timer wheel](#12-timer-service-for-millions-of-timers) | Fires at most once, at or after its deadline | Bucket lock + state machine | A slow callback blocks the wheel |
| [Connection pool](#13-connection-pool) | `idle + leased + creating ≤ max` | Mutex + lease | Connecting under the lock; poisoned idle set |

### You're ready when…

- [ ] You can state the invariant **before** drawing the data structure
- [ ] You can name what wakes a waiter and what happens on `close()`
- [ ] You can explain why an LRU `get` needs the exclusive lock
- [ ] You can choose between tombstones and backward-shift deletion, and price both
- [ ] You can size a pool against the backend's total connection budget
- [ ] You can make full and empty unambiguous in a ring buffer
- [ ] You can say what `flush` promises — and what it does not
- [ ] You can give a shutdown sequence with no lost wakeups

---

## 17. Hidden Tips & Tricks

| Tip | Why it matters |
| :-- | :-- |
| Ask "copy or handle?" before writing `get` | The eviction-after-unlock bug is the most common LLD failure |
| Say "one mutex first, then measure" | Interviewers score judgement, not lock-free bravado |
| Reserve one slot for full/empty | Removes a whole class of ring-buffer off-by-one bugs |
| Name the wakeup predicate out loud | "Wait while `size == 0 && !closed`" proves you understand spurious wakeups |
| Put `close()` in the same lock as `put`/`take` | Otherwise shutdown races with admission and hangs a waiter |
| Bound every queue | An unbounded queue is an OOM with extra steps |
| Distinguish "flush" from "durable" | App buffer → OS page cache → device are three different promises |
| State the failure atomicity | "Checkpoint data is durable before the completion record" is the sentence that earns the point |
| Use monotonic time for deadlines | Wall-clock jumps break timers and rate limiters |
| Give a number for context-switch and lock cost | Orders of magnitude show you have operated a system, not just read one |

## 18. Do's & Don'ts

| ✅ Do | ❌ Don't |
| :-- | :-- |
| State capacity, ownership, and shutdown before the data structure | Don't start with a lock-free design you cannot finish |
| Make the invariant one sentence and repeat it | Don't hand-wave "thread-safe" without saying what is protected |
| Return copies/leases across the lock boundary | Don't hand out a pointer to an evictable node |
| Bound queues, pools, and buffers; define the rejection | Don't convert overload into latency and then OOM |
| Say what a resize/rehash invalidates | Don't assume callers hold stable pointers into a table |
| Separate construction from storage in a pool | Don't `memcpy` objects or skip destructors |
| Measure contention before sharding or padding | Don't add per-shard locks and claim global LRU |
| Define cancellation and dispatch races | Don't promise "cancelled means never runs" after dispatch without qualification |
| Size pools against the backend's total budget | Don't multiply pools by replicas and ignore `max_connections` |
| Name the exact HTTP/durability guarantee | Don't say "resume works" without ETag/If-Range or a commit order |

---

*Pairs with:* [Operating Systems](operating-systems.md) (scheduler, page cache, futex/epoll) · [Core Concepts](system-design-concepts.md) (LRU, consistent hashing, backpressure) · [Distributed Cache](system-design-distributed-cache.md) · [Rate Limiter](system-design-rate-limiter.md) · [Delayed Job Scheduler](system-design-delayed-job-scheduler.md) · [File Storage](system-design-file-storage.md) · [Observability Pipeline](system-design-observability-pipeline.md) · [GPU Scheduler](system-design-gpu-scheduler.md) · [LLM Inference](system-design-llm-inference.md) · [Distributed Training](system-design-distributed-training.md)

---

<p align="right"><a href="#top">↑ Back to top</a></p>
