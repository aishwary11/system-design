# System Design Concepts — Quick Reference with Basic Examples

The foundational concepts behind every distributed system, each explained in a few lines with a tiny, concrete example: **sharding, consistent hashing, CAP, ACID vs BASE, SOLID, CQRS, event sourcing, saga, outbox, idempotency, circuit breaker, rate limiting, load balancing, leader election, replication, caching, bloom filters, gossip, vector clocks, Merkle trees, consensus (Raft/Paxos), two-phase commit, CRDTs, event-driven architecture, DLQs, backpressure, quorum reads & writes, consistency models, PACELC, write-ahead logs, B-tree vs LSM storage engines, checksums, distributed locking, service discovery, API gateways vs service meshes, CDNs, distributed tracing, retries & backoff, timeouts & hedging, logical clocks, fan-out, hot keys, optimistic concurrency, SLIs/SLOs, multi-region disaster recovery, deployment strategies and geospatial indexing.**

**Part II adds 17 classic algorithms** — Luhn's (credit card validation), Dijkstra, A*, BFS/DFS, topological sort, union-find, trie, LRU cache, external sort, reservoir sampling, count-min sketch, HyperLogLog, Levenshtein, KMP/Rabin-Karp, haversine, Base62/Snowflake IDs, sliding window — each with a runnable JavaScript implementation and where it's used in system design.

---

## Table of Contents

1. [Sharding (Data Partitioning)](#1-sharding-data-partitioning)
2. [Consistent Hashing](#2-consistent-hashing)
3. [CAP Theorem](#3-cap-theorem)
4. [ACID vs BASE](#4-acid-vs-base)
5. [SOLID Principles](#5-solid-principles)
6. [CQRS (Command Query Responsibility Segregation)](#6-cqrs-command-query-responsibility-segregation)
7. [Event Sourcing](#7-event-sourcing)
8. [Saga Pattern](#8-saga-pattern)
9. [Outbox Pattern](#9-outbox-pattern)
10. [Idempotency](#10-idempotency)
11. [Circuit Breaker](#11-circuit-breaker)
12. [Rate Limiting](#12-rate-limiting)
13. [Load Balancing](#13-load-balancing)
14. [Leader Election](#14-leader-election)
15. [Replication Topologies](#15-replication-topologies)
16. [Caching Strategies](#16-caching-strategies)
17. [Bloom Filter](#17-bloom-filter)
18. [Gossip Protocol](#18-gossip-protocol)
19. [Vector Clocks & Conflict Resolution](#19-vector-clocks--conflict-resolution)
20. [Dead Letter Queue](#20-dead-letter-queue)
21. [Backpressure](#21-backpressure)
22. [Merkle Trees (Anti-Entropy)](#22-merkle-trees-anti-entropy)
23. [Consensus Algorithms (Raft & Paxos)](#23-consensus-algorithms-raft--paxos)
24. [Two-Phase Commit (2PC) vs Saga](#24-two-phase-commit-2pc-vs-saga)
25. [CRDTs — Conflict-Free Replicated Data Types](#25-crdts--conflict-free-replicated-data-types)
26. [Event-Driven Architecture](#26-event-driven-architecture)
28. [Quorum Reads & Writes](#28-quorum-reads--writes)
29. [Consistency Models](#29-consistency-models)
30. [PACELC Theorem](#30-pacelc-theorem)
31. [Write-Ahead Log (WAL) & Durability](#31-write-ahead-log-wal--durability)
32. [Storage Engines: B-Trees vs LSM Trees](#32-storage-engines-b-trees-vs-lsm-trees)
33. [Checksums & Data Integrity](#33-checksums--data-integrity)
34. [Distributed Locking & Fencing](#34-distributed-locking--fencing)
35. [Service Discovery & Registry](#35-service-discovery--registry)
36. [API Gateway vs Service Mesh](#36-api-gateway-vs-service-mesh)
37. [CDN & Edge Caching](#37-cdn--edge-caching)
38. [Distributed Tracing](#38-distributed-tracing)
39. [Retries, Backoff & Jitter](#39-retries-backoff--jitter)
40. [Timeouts & Hedging](#40-timeouts--hedging)
41. [Logical Clocks (Lamport & HLC)](#41-logical-clocks-lamport--hlc)
42. [Fan-out & Push vs Pull](#42-fan-out--push-vs-pull)
43. [Hot Keys & Thundering Herd](#43-hot-keys--thundering-herd)
44. [Optimistic Concurrency & Versioning](#44-optimistic-concurrency--versioning)
45. [SLIs, SLOs & Error Budgets](#45-slis-slos--error-budgets)
46. [Multi-Region & Disaster Recovery](#46-multi-region--disaster-recovery)
47. [Deployment Strategies](#47-deployment-strategies)
48. [Geospatial Indexing (Geohash & S2)](#48-geospatial-indexing-geohash--s2)
49. [Quick Map: Concept → Problem Solved](#49-quick-map-concept--problem-solved)

**Part II — Classic Algorithms & Data Structures (LLD)**
50. [Luhn's Algorithm (Credit Card Validation)](#50-luhns-algorithm-credit-card-validation)
51. [Dijkstra's Shortest Path](#51-dijkstras-shortest-path)
52. [A* Search](#52-a-search)
53. [BFS & DFS Graph Traversal](#53-bfs--dfs-graph-traversal)
54. [Topological Sort (Kahn's Algorithm)](#54-topological-sort-kahns-algorithm)
55. [Union-Find (Disjoint Set)](#55-union-find-disjoint-set)
56. [Trie (Prefix Tree)](#56-trie-prefix-tree)
57. [LRU Cache](#57-lru-cache)
58. [External Sort & K-Way Merge](#58-external-sort--k-way-merge)
59. [Reservoir Sampling](#59-reservoir-sampling)
60. [Count-Min Sketch](#60-count-min-sketch)
61. [HyperLogLog (Cardinality Estimation)](#61-hyperloglog-cardinality-estimation)
62. [Levenshtein Distance (Edit Distance)](#62-levenshtein-distance-edit-distance)
63. [String Matching (KMP & Rabin-Karp)](#63-string-matching-kmp--rabin-karp)
64. [Haversine Distance](#64-haversine-distance)
65. [Base62 Encoding & Snowflake IDs](#65-base62-encoding--snowflake-ids)
66. [Sliding Window & Two Pointers](#66-sliding-window--two-pointers)

---

## 1. Sharding (Data Partitioning)

**Problem:** one database can't hold the writes/reads of a billion users.
**Idea:** split the data horizontally across many database nodes; each node ("shard") owns a disjoint subset of rows. Together they serve the whole dataset.

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1110 1258" width="900" role="img" aria-label="Sharding — Data Partitioning">
<rect x="0" y="0" width="1110" height="1258" fill="#ffffff"/>
<title>Sharding — Data Partitioning</title>
<path d="M531 132 L531 322" fill="none" stroke="#334155" stroke-width="1.6" marker-end="url(#arr-concept-sharding)"/>
<path d="M531 384 L531 574" fill="none" stroke="#334155" stroke-width="1.6" marker-end="url(#arr-concept-sharding)"/>
<path d="M531 636 L531 826" fill="none" stroke="#334155" stroke-width="1.6" marker-end="url(#arr-concept-sharding)"/>
<path d="M501 888 L501 983 L144 983 L144 1078" fill="none" stroke="#334155" stroke-width="1.6" marker-end="url(#arr-concept-sharding)"/>
<path d="M521 888 L521 983 L402 983 L402 1078" fill="none" stroke="#334155" stroke-width="1.6" marker-end="url(#arr-concept-sharding)"/>
<path d="M541 888 L541 983 L660 983 L660 1078" fill="none" stroke="#334155" stroke-width="1.6" marker-end="url(#arr-concept-sharding)"/>
<path d="M561 888 L561 983 L918 983 L918 1078" fill="none" stroke="#334155" stroke-width="1.6" marker-end="url(#arr-concept-sharding)"/>
<rect x="457" y="70" width="148" height="62" rx="9" fill="#ecfdf5" stroke="#059669" stroke-width="1.6"/>
<text x="531" y="106" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#065f46">Clients</text>
<rect x="457" y="322" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="531" y="358" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">API Gateway</text>
<rect x="445" y="574" width="172" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="531" y="610" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Application Services</text>
<rect x="413" y="826" width="236" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="531" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Sharding layer</text>
<rect x="70" y="1078" width="148" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="144" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">users_0</text>
<rect x="328" y="1078" width="148" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="402" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">users_1</text>
<rect x="586" y="1078" width="148" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="660" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">users_2</text>
<rect x="844" y="1078" width="148" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="918" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">users_3</text>
<defs><marker id="arr-concept-sharding" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#334155"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/concepts/concept-sharding.architecture.html](diagrams/concepts/concept-sharding.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


*Every query must carry the shard key so the router stays stateless; config service supports directory-based sharding and re-sharding (see below).*

Three common strategies:

| Strategy | Rule for choosing a shard | Strength | Weakness |
| -------- | ------------------------- | -------- | -------- |
| **Hash-based** | `shard = hash(shard_key) % N` | even distribution | range queries hit all shards; re-sharding moves almost everything |
| **Range-based** | shard owns `id 1..1M`, next owns `1M..2M`, ... | great for range scans (time series, id ranges) | hot shard for new data (e.g. latest ids) |
| **Directory-based** | lookup table: `key → shard` | full control, easy migration | the directory is a single point / extra hop |

```text
// Hash sharding
shardId = hash(userId) % 4        // user 99 → shard 3
// DB shards
users_0   users_1   users_2   users_3

// Query must ALWAYS carry the shard key
SELECT * FROM users_3 WHERE id = 99        // knows the shard from the key

// Range sharding (time-series)
events_2026_Q1   events_2026_Q2   events_2026_Q3
```

```sql
-- Real example: shard orders by tenant/user so one user's rows stay together
CREATE TABLE orders_0 (LIKE orders INCLUDING ALL);  -- schema copy per shard
CREATE TABLE orders_1 (LIKE orders INCLUDING ALL);
-- app: shard = user_id % 2  →  route the query to orders_0 or orders_1
```

**Costs & rules of thumb:**

- Pick a **shard key with high cardinality and even access** (user_id good; country bad — a few giant countries overheat).
- **Secondary indexes don't span shards** — index by non-shard-key = query every shard (scatter-gather).
- **Joins & transactions across shards are painful** — shard by the entity that must stay together (a user and all their data).
- Re-sharding (adding shards) with `% N` moves ~all keys — that's exactly why **consistent hashing** (§2) exists.

---

## 2. Consistent Hashing

**Problem:** with `hash(key) % N`, adding or removing one node remaps almost every key → mass cache misses / data migration.
**Idea:** put both nodes and keys on a hash **ring** (0..2³²); each key goes clockwise to the *first* node it meets. When a node joins/leaves, **only the keys between it and its clockwise neighbor move**.

```text
       node C ◄─────────────── key 5, key 9, key 1
      /
  ring (hash space 0..2^32)
      \
       node A ◄── key 3, key 8        ← key 3 lands on A
```

```js
// Minimal consistent-hash ring
const ring = new Map();            // position -> node
const NODE_COUNT = 3;

function hash(x) {                 // pretend: uniform in [0, 360)
  let h = 0;
  for (const c of String(x)) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function addNode(node)  { ring.set(hash(node), node); }
function removeNode(node){ ring.delete(hash(node)); }

function findNode(key) {
  const pos = hash(key);
  // first node clockwise (wrap around); keys() sorted ascending
  for (const [p, node] of ring) if (p >= pos) return node;
  return ring.values().next().value;   // wrapped past 360
}

addNode("A"); addNode("B"); addNode("C");

// Adding node D moves only the keys between D and its clockwise neighbor
console.log(findNode("user:42"));   // always the SAME node while ring is unchanged
```

**Virtual nodes** fix the balance problem: each physical node occupies *many* ring positions (e.g. `A-0..A-199`), so hash randomness evens out and removals redistribute smoothly. When one node dies, its keys spread across *all* remaining nodes (not just one neighbor).

Used in: DynamoDB/Cassandra, Memcached/Redis client-side sharding, CDN edge caches, load balancers that need sticky routing.

---

## 3. CAP Theorem

**Problem:** in a distributed system, a network partition (P) is not a matter of *if* but *when*.
**Idea:** during a partition you must choose between **Consistency** (all nodes return the latest write or an error) and **Availability** (every request gets a response, possibly stale). You can't have all three simultaneously — pick **CP** or **AP** per system.

```
        Consistency
            ▲
           / \
          /   \
         /  CA  \     ← impossible during a real partition
        /  (rare) \
       ▼───────────▶ Availability
      CP            AP
   (ZooKeeper,  (Cassandra, DynamoDB,
    HBase,       Redis Cluster AP mode,
    Postgres     most caches)
    single-node)
```

```text
// Network partition between replica R1 and R2. Client asks R2:
//   "what is the balance of account 42?"
CP answer  → "error: can't confirm with majority"   (correct, but unavailable)
AP answer  → "here's my copy: $100"                  (available, may be stale)
```

**Trade-off in practice:** banks & payment systems → CP (never double-spend). Feeds, likes, leaderboards → AP (eventual consistency is fine). Databases are usually CP (or CA within one node); caches lean AP.

---

## 4. ACID vs BASE

Two philosophies for how a data store behaves under concurrency and failure.

| | ACID (relational) | BASE (distributed NoSQL / caches) |
| -- | ----------------- | --------------------------------- |
| A | **Atomicity** — all-or-nothing | **Basically Available** — system stays up |
| C | **Consistency** — constraints hold after every tx | **Soft state** — data may drift between nodes |
| I | **Isolation** — concurrent txs don't interfere | **Eventually consistent** — converges over time |
| D | **Durability** — committed = survives crash | (still want replication for durability) |
| Example | PostgreSQL, MySQL | Cassandra, DynamoDB, Redis-as-cache |

```sql
-- ACID example (Postgres): transfer is atomic — both updates or neither
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

```text
-- BASE example: a "like counter" propagated via async events
like-service increments → publishes to Kafka → followers apply it.
Read your own like a moment later? It may not be reflected yet (soft state).
Read it 500 ms later? Consistent (eventually).
```

Rule of thumb: start ACID for anything involving money/truth; add BASE components (caches, analytics, feeds) around it deliberately.

---

## 5. SOLID Principles

Five object-oriented design rules that keep code maintainable. Each one with a tiny before/after.

### S — Single Responsibility

A class should have **one reason to change**.

```js
// ✗ BAD: this class changes when reporting, storage, OR user rules change
class UserService {
  saveUser(u) { /* db */ }
  sendWelcomeEmail(u) { /* smtp */ }
  buildUserReport() { /* csv */ }
}

// ✓ GOOD: three classes, each with one job
class UserRepository { saveUser(u) { /* db */ } }
class WelcomeMailer   { send(u) { /* smtp */ } }
class UserReporter    { buildReport() { /* csv */ } }
```

### O — Open/Closed

Open for **extension**, closed for **modification**: add behavior by adding code, not editing existing code.

```js
// ✗ BAD: adding a new payment type means editing this method
class PaymentProcessor {
  charge(type, amount) {
    if (type === 'card') { /* card logic */ }
    else if (type === 'upi') { /* upi logic */ }   // ← edit here each time
  }
}

// ✓ GOOD: extend by adding a strategy
const strategies = {
  card: { charge: (a) => { /* card */ } },
  upi:  { charge: (a) => { /* upi */ } },
};
function charge(type, amount) { return strategies[type].charge(amount); }
// new type → new entry in `strategies`, existing code untouched
```

### L — Liskov Substitution

Subtypes must be usable wherever their base type is expected, **without breaking behavior**.

```text
// ✗ BAD: a Square is-a Rectangle, but breaks setWidth's contract
class Rectangle { setWidth(w) { this.w = w; } }
class Square extends Rectangle {
  setWidth(w) { this.w = w; this.h = w; }   // breaks callers that set w then read h
}

// ✓ GOOD: don't force inheritance; separate shape
class Square { constructor(side) { this.side = side; } }
```

### I — Interface Segregation

Don't force clients to depend on methods they don't use — split fat interfaces.

```text
// ✗ BAD: an InkjetPrinter must implement scan(), which it can't do
class Printer { print(); scan(); fax(); }

// ✓ GOOD: small, focused interfaces the client chooses from
class Printer { print(); }
class Scanner { scan(); }
class MultiFunctionPrinter extends Printer, Scanner { /* has both */ }
```

### D — Dependency Inversion

Depend on **abstractions**, not concrete details.

```text
// ✗ BAD: NotificationService is welded to the concrete email sender
class NotificationService {
  constructor() { this.sender = new EmailSender(); }  // hard to test / swap
}

// ✓ GOOD: depend on the abstraction; inject the implementation
class MessageSender { send(msg) {} }                 // the abstraction (interface)
class EmailSender extends MessageSender { send(m) { /* SMTP */ } }
class SmsSender   extends MessageSender { send(m) { /* SMS */ } }
class FakeSender  extends MessageSender { send(m) { /* tests */ } }
class NotificationService {
  constructor(sender) { this.sender = sender; }      // any MessageSender works
}
new NotificationService(new EmailSender());          // prod
new NotificationService(new SmsSender());            // added later — no edit to service
new NotificationService(new FakeSender());           // tests
```

---

## 6. CQRS (Command Query Responsibility Segregation)

**Problem:** the same model can't be optimal for both *writes* (normalized, transactional) and *reads* (denormalized, aggregated, searchable).
**Idea:** split the model — **commands** (writes) go to one store, **queries** (reads) go to a separate read-optimized store. A projection keeps the read model in sync (sync call, CDC, or events).

```
                 ┌─────────────── write path ───────────────┐
  client ──POST──► CommandService ──► PostgreSQL (source of truth)
                 └──────────────────────────────────────────┘
                 ┌─────────────── read path ────────────────┐
  client ──GET───► QueryService ──► Elasticsearch / read replica
                    ▲                    ▲
                    └──── projection (events / CDC) ────────┘
```

```text
// Example: order service
// WRITE (command): validate stock, insert order row in Postgres  → status 'created'
// READ (query):    dashboard shows pre-joined "orders + products + customer"
//                  served from a denormalized projection in Elasticsearch
// Sync: the order insert publishes an event; a projection worker updates the read model.
```

**When:** read-heavy apps with complex queries, event-sourced systems, reporting. **When not:** CRUD apps where reads are simple — CQRS is extra machinery.

---

## 7. Event Sourcing

**Problem:** storing only the current state loses *why* it became that state (audit, replay, debugging, rebuilding projections).
**Idea:** instead of (or alongside) the current state, store the **append-only sequence of events** that changed it. Current state = fold/replay the events.

```
Bank account 42 — events (append-only, immutable):
  AccountOpened        { amount: 0    }
  MoneyDeposited       { amount: +500 }
  MoneyWithdrawn       { amount: -100 }
  MoneyDeposited       { amount: +25  }

balance now = 0 + 500 - 100 + 25 = $425     ← derived by replay
```

```js
// The event log (append-only) — in production this lives in Kafka or a DB
const events = [
  { accountId: 42, type: 'AccountOpened',  amount:   0 },
  { accountId: 42, type: 'MoneyDeposited', amount: 500 },
  { accountId: 42, type: 'MoneyWithdrawn', amount: 100 },
  { accountId: 42, type: 'MoneyDeposited', amount:  25 },
];

// Replay = reduce over events → current balance ($425)
const balance = events
  .filter(e => e.accountId === 42)
  .reduce((bal, e) =>
    e.type === 'MoneyDeposited'  ? bal + e.amount :
    e.type === 'MoneyWithdrawn'  ? bal - e.amount : bal, 0);

// A NEW projection (e.g. "monthly statement") can be built from history
// without re-running the business logic that produced today's rows.
```

**Rules:** events are immutable (never edit history — append corrections); event schema evolves (versioning); snapshot every N events to avoid replaying forever. Kafka is the natural event log (see `kafka-features.md`); CQRS usually pairs with it (write events, project read models).

---

## 8. Saga Pattern

**Problem:** a business flow spans several services, each with its own DB — there is no cross-service transaction.
**Idea:** split the flow into local transactions; if one fails, run **compensating actions** for the already-completed steps. Two flavors:

| | Choreography | Orchestration |
| -- | ------------ | ------------- |
| Coordination | each service listens for events and acts | a central orchestrator calls each service |
| Example | order → event → inventory → event → payment | OrderSaga service drives step by step |
| Pro | no central point, simple | easy to see/control the flow |
| Con | flow is implicit, hard to debug | orchestrator is a single point |

```
Orchestrated "place order" saga:

  OrderSaga: 1) OrderService.createOrder ───────────────► OK
             2) InventoryService.reserve(id) ───────────► OK
             3) PaymentService.charge(card) ────────────► FAIL ❌
  compensation: 2b) InventoryService.release(id)         ← undo step 2
                1b) OrderService.cancelOrder(id)         ← undo step 1
  final state: order cancelled, stock released, no money moved
```

```text
// Choreography version — each service reacts to events and emits the next:
OrderService  creates order          → publishes OrderCreated
InventorySvc  OrderCreated → reserve → publishes StockReserved   (or StockFailed)
PaymentSvc    StockReserved → charge → publishes PaymentCharged (or PaymentFailed → StockReleased)
ShippingSvc   PaymentCharged → ship → publishes OrderShipped
```

**Key:** compensations must be *idempotent* (re-running them is safe) — that's why §10 matters.

---

## 9. Outbox Pattern

**Problem:** "write to my DB **and** publish to Kafka" in two steps can half-fail (DB committed, event lost → other services never hear about it).
**Idea:** write the entity **and** the event row in the **same DB transaction**. A separate **relay/outbox publisher** reads committed outbox rows and publishes them to Kafka, deleting/marking them after. If the publish fails, the row is still there to retry.

```sql
-- 1) app code: ONE transaction does both
BEGIN;
INSERT INTO orders (id, user_id, total) VALUES (1001, 42, 99.50);
INSERT INTO outbox (event_id, topic, payload, created_at)
VALUES ('evt_1', 'order-created', '{"orderId":1001,"userId":42}', now());
COMMIT;                       -- both or neither — no half state

-- 2) outbox relay worker (separate process):
--    SELECT * FROM outbox ORDER BY created_at LIMIT 100
--    → publish each row to Kafka → DELETE row (or mark published)
--    retries forever on Kafka failure; exactly-once-ish via idempotent consumers
```

**Why it exists:** dual-write (call DB, then call Kafka from the app) has a race — DB commit succeeds, process crashes before Kafka call → event permanently lost. The outbox makes the DB the single source of truth for both data *and* events. (Debezium CDC on the outbox table is an even more decoupled variant — see `kafka-features.md`.)

---

## 10. Idempotency

**Problem:** retries (timeouts, at-least-once delivery, double-clicks) cause duplicate charges/orders/emails.
**Idea:** make an operation safe to repeat — the **first** attempt has an effect; repeats return the same result. Enforce at the API (idempotency key), at the store (unique constraint), and at the worker (dedupe).

```text
// API level: client sends an idempotency key on retries
POST /payments        { amount: 100, idempotencyKey: "abc-123" }
   → server: if key "abc-123" seen before, return the SAME stored response
   → else process and cache response under the key for ~24h

// Store level: a unique constraint makes double-insert impossible
```

```sql
CREATE TABLE payment_attempts (
  idempotency_key TEXT PRIMARY KEY,   -- duplicate insert fails with a unique violation
  order_id BIGINT NOT NULL,
  status   TEXT NOT NULL DEFAULT 'processing'
);

INSERT INTO payment_attempts (idempotency_key, order_id)
VALUES ('abc-123', 1001)
ON CONFLICT (idempotency_key) DO NOTHING;   -- second attempt: no-op, not a double charge
```

**Where to enforce:** 1) API with `Idempotency-Key` headers; 2) DB with unique constraints / `ON CONFLICT`; 3) consumers by tracking processed event ids (`processed_events` table or a Redis `SET`). Do at least two layers for payments.

---

## 11. Circuit Breaker

**Problem:** when a downstream service is failing, every caller retrying synchronously makes it worse (retry storm, thread exhaustion) and calls fail slowly.
**Idea:** wrap calls in a breaker with three states — **closed** (normal), **open** (fail fast, don't call), **half-open** (probe with a few requests to see if it recovered).

```
  closed ──(failure rate > threshold, e.g. 50% of last 20 calls)──► open
     ▲                                                              │
     │                 (after 30s cool-down → a few trial requests) │
     └────────────── success ───────────── half-open ◄──────────────┘
                            (failure → back to open)
```

```js
// Concept — the state machine behind libraries (resilience4j, Hystrix, Polly)
const breaker = { state: 'CLOSED', failures: 0, openedAt: null };

function callService() {
  if (breaker.state === 'OPEN') {
    if (Date.now() - breaker.openedAt > 30_000) breaker.state = 'HALF_OPEN';
    else return fallback();                      // fail fast
  }
  try {
    const result = downstream.call();
    breaker.failures = 0;                        // success resets
    if (breaker.state === 'HALF_OPEN') breaker.state = 'CLOSED';
    return result;
  } catch (e) {
    if (++breaker.failures >= 10) {              // 10 in a row → open
      breaker.state = 'OPEN';
      breaker.openedAt = Date.now();
    }
    return fallback();
  }
}
```

Always pair with a **fallback** (cached value, default, error) and stream **metrics** — a breaker is only useful if you can see it tripping. Compare: *retry* (with backoff) for transient errors, *circuit breaker* for sustained outages, *rate limiter* for protecting yourself, *bulkhead* for isolating failures per dependency.

---

## 12. Rate Limiting

**Problem:** one abusive client (or a buggy loop) can take down the whole service.
**Idea:** cap requests per key (user/IP/token) over a time window. Classic algorithms (implemented fully in `system-design-rate-limiter.md`):

| Algorithm | Behavior | Analogy |
| --------- | -------- | ------- |
| Fixed window | N requests per minute (per calendar minute) | cheap; boundary bursts (59→00 resets) |
| Sliding window log | exact count over last N seconds | precise, memory heavy |
| Sliding window counter | weighted previous + current window | good accuracy, low memory |
| Token bucket | refill r tokens/sec, burst up to capacity b | allows bursts, smooths average |
| Leaky bucket | fixed output rate, drops overflow | shapes traffic to a constant rate |

```js
// Token bucket — the interview favorite, in ~10 lines
class TokenBucket {
  constructor(capacity, refillPerSec) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.rate = refillPerSec;
    this.last = Date.now();
  }
  allow() {
    const now = Date.now();
    this.tokens = Math.min(this.capacity,
                           this.tokens + ((now - this.last) / 1000) * this.rate);
    this.last = now;
    if (this.tokens < 1) return false;   // deny (HTTP 429 + Retry-After)
    this.tokens -= 1;
    return true;                         // allow
  }
}
```

Distributed rate limiting needs a shared atomic store — Redis `INCR`/Lua (see `redis-features.md` §4). Always answer: *what happens when the limiter itself is down?* (fail-open vs fail-closed).

---

## 13. Load Balancing

**Problem:** many servers, one entry point — who gets each request?
**Idea:** a load balancer (LB) distributes traffic across healthy backends and removes unhealthy ones (health checks).

| Strategy | How it picks | Use when |
| -------- | ------------ | -------- |
| Round robin | server 1, 2, 3, ... | uniform servers, uniform work |
| Weighted round robin | bigger servers get more | heterogeneous hardware |
| Least connections | fewest active requests | uneven request durations |
| Least response time | fastest recent p99 | latency-sensitive |
| IP hash / consistent hashing | same client → same server | sticky sessions, cache locality |
| Random | uniform random pick | simplicity |

```nginx
# nginx: round robin + health check (concept)
upstream api_servers {
    server 10.0.0.1:8080 weight=3;   # faster box gets 3x traffic
    server 10.0.0.2:8080;
    server 10.0.0.3:8080;
}
server { location / { proxy_pass http://api_servers; } }
```

Two layers: **L4** (TCP — fast, no content awareness) and **L7** (HTTP — path/host/cookie routing, used by API gateways). DNS round robin is the poor-man's LB (no health checking).

---

## 14. Leader Election

**Problem:** for many tasks exactly **one** replica must act (single writer, scheduler, coordinator) — and if it dies, another must take over.
**Idea:** replicas race to acquire a lock/lease with a **TTL (heartbeat)**; the holder renews periodically. When it stops renewing (crash, network split), the lease expires and another replica wins. Systems: ZooKeeper (ephemeral sequential znodes), etcd (leases), Redis (`SET NX PX`), or Postgres advisory locks.

```text
Replica A  → acquires lease: SET leader_lock "A" NX PX 10000   → A is leader
Replica B  → SET leader_lock ... → (nil)                       → A holds it; B is standby
A          → renews every ~3s (PX 10000)                        → stays leader
A crashes  → no renewals → after 10s the key expires
Replica B  → SET leader_lock "B" NX PX 10000 → OK               → B is the new leader
```

```text
// Pseudocode: the standby loop
while (true) {
  if (acquireLock('leader_lock', 'B', ttlMs)) {   // SET NX PX
    runAsLeader();                                 // heartbeat + work
  } else {
    await sleep(1000);                             // wait and retry
  }
}
```

**Danger — split brain:** with slow networks, the old leader may still think it's leader while the new one takes over (clock/latency). **Fencing tokens** fix it: each lease has an increasing token, and the resource (DB row, filesystem) rejects writes with a stale token. Async replica promotion has the same hazard — see §15.

---

## 15. Replication Topologies

**Problem:** one server = single point of failure + limited read throughput.
**Idea:** keep copies of data on multiple nodes and keep them in sync.

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 754" width="900" role="img" aria-label="Replication Topologies">
<rect x="0" y="0" width="960" height="754" fill="#ffffff"/>
<title>Replication Topologies</title>
<path d="M146 132 L146 322" fill="none" stroke="#334155" stroke-width="1.6" marker-end="url(#arr-concept-replication)"/>
<path d="M404 132 L404 322" fill="none" stroke="#334155" stroke-width="1.6" marker-end="url(#arr-concept-replication)"/>
<path d="M478 353 L760 353 L760 680 L144 680 L144 636" fill="none" stroke="#334155" stroke-width="1.6" marker-end="url(#arr-concept-replication)"/>
<path d="M414 384 L414 574" fill="none" stroke="#334155" stroke-width="1.6" marker-end="url(#arr-concept-replication)"/>
<path d="M136 384 L136 574" fill="none" stroke="#334155" stroke-width="1.6" marker-end="url(#arr-concept-replication)"/>
<rect x="177.8" y="389" width="36.4" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
<text x="196" y="402" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="11" fill="#334155">sync repl</text>
<path d="M156 384 L156 479 L394 479 L394 574" fill="none" stroke="#334155" stroke-width="1.6" marker-end="url(#arr-concept-replication)"/>
<rect x="230.4" y="460" width="89.19999999999999" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
<text x="275" y="473" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="11" fill="#334155">asynchronous replication</text>
<rect x="72" y="70" width="148" height="62" rx="9" fill="#ecfdf5" stroke="#059669" stroke-width="1.6"/>
<text x="146" y="106" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#065f46">Write clients</text>
<rect x="330" y="70" width="148" height="62" rx="9" fill="#ecfdf5" stroke="#059669" stroke-width="1.6"/>
<text x="404" y="106" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#065f46">Read clients</text>
<rect x="330" y="322" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="404" y="358" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Read LB</text>
<rect x="72" y="322" width="148" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="146" y="358" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">Leader</text>
<rect x="70" y="574" width="148" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="144" y="610" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">Sync replica</text>
<rect x="328" y="574" width="151" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="403.5" y="610" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">Async replicas x2</text>
<defs><marker id="arr-concept-replication" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#334155"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/concepts/concept-replication.architecture.html](diagrams/concepts/concept-replication.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


*Solid = data path, dashed = control. Async replicas serve reads and are promoted on failure; fencing tokens stop the old leader from writing after promotion (§14).*

| Topology | Writes | Reads | Example |
| -------- | ------ | ----- | ------- |
| **Single-leader** | all to the leader, followers replicate | followers (may lag) | PostgreSQL streaming, MySQL |
| **Multi-leader** | any leader (conflicts!) | any node | cross-region, collaborative editing |
| **Leaderless** | quorum `W + R > N` | any node | Cassandra, DynamoDB |

```text
Single-leader:
   app ──WRITE──► leader ──replicate──► follower1 ──READ──► app
                                   └──► follower2
   • async replication = fast, but a crash can lose the last writes + stale reads
   • sync = no loss, but a slow follower slows every write
   • promotion: follower → leader. If the old leader rejoins, it must not accept
     writes anymore (split brain!) — same fencing problem as §14

Leaderless quorum (N=3, W=2, R=2):
   write to 2 of 3, read from 2 of 3 → at least one node overlaps → strong-ish
   but concurrent writes need conflict handling → vector clocks (§19)
```

**Replication lag** causes: reading your own write (fix: read-your-writes routing), monotonic reads (fix: read from same replica per user), and lagged analytics (usually fine). Don't assume replicas are current — know your target staleness.

---

## 16. Caching Strategies

**Problem:** the DB can't serve every read; latency matters.
**Idea:** keep hot data in a faster layer (Redis, CDN, in-memory) close to the request.

| Pattern | Behavior | Notes |
| ------- | -------- | ----- |
| **Cache-aside** | app checks cache → miss → reads DB → fills cache | standard; cache holds only what's asked |
| **Read-through** | cache library loads from DB on miss | app code simpler |
| **Write-through** | writes go to cache AND DB | always fresh, write latency ↑ |
| **Write-back / behind** | write cache now, flush to DB later | fast writes, risk of loss |
| **Tiered** | L1 in-process → L2 Redis → DB | hot + shared |

```js
// Cache-aside (see redis-features.md §2 for the full example)
function getUser(id) {
  const hit = redis.get(`user:${id}`);
  if (hit) return JSON.parse(hit);                 // HIT
  const row = db.findUser(id);                     // MISS → fall through
  redis.set(`user:${id}`, JSON.stringify(row), 'EX', 300);
  return row;
}
// On update: db.updateUser(...); redis.del(`user:${id}`);   // invalidate, don't write-through
```

**Eviction** when full: LRU (recency), LFU (frequency), TTL (age) — Redis `allkeys-lru` etc. **Invalidation is the hard problem**: delete-on-write + short TTL backstop; PostgreSQL `LISTEN/NOTIFY` for cross-service invalidation (`postgresql-features.md` §5). **Stampede**: many requests miss simultaneously on expiry → add TTL jitter or a single-filler lock (Redis `SETNX`).

---

## 17. Bloom Filter

**Problem:** "have we seen this before?" checks (dedupe URL, cache-miss guard, DB lookup guard) over billions of items — a real set won't fit in memory.
**Idea:** a compact **bit array + k hash functions**. Insert = set k bits; membership = all k bits set. Answer is **"definitely not in set"** (no false negatives) or **"probably in set"** (small false-positive rate ε).

```js
// Minimal bloom filter (m = bit size, k = hash count)
class BloomFilter {
  constructor(m, k) { this.bits = new Uint8Array(m); this.k = k; }
  _hashes(x) {           // k different hash values
    const out = [];
    let h = 0;
    for (let i = 0; i < this.k; i++) {
      for (const c of x) h = (h * 31 + c.charCodeAt(0) + i * 97) >>> 0;
      out.push(h % this.bits.length);
    }
    return out;
  }
  add(x)    { for (const i of this._hashes(x)) this.bits[i] = 1; }
  maybeHas(x) { return this._hashes(x).every(i => this.bits[i] === 1); }
}

const bf = new BloomFilter(1000, 7);
bf.add("https://a.com/page");
bf.maybeHas("https://a.com/page");   // true
bf.maybeHas("https://b.com/other");  // false — guaranteed correct ("definitely not seen")
// occasionally a non-member returns true ("probably seen") — that's the price of 1 KB
```

**Where:** Cassandra/DynamoDB avoid disk reads for missing keys (before a read, check bloom — miss means skip the read), web crawlers dedupe URLs, CDNs decide "do we even have this cache key?", BigTable, Ethereum light clients, databases (RocksDB). Redis has it as `BF.*` (RedisBloom) — see `redis-features.md` §14.

---

## 18. Gossip Protocol

**Problem:** in a large cluster there's no central registry — how do nodes learn who's alive, who's new, and what data they hold?
**Idea:** each node periodically picks a random peer and **exchanges state** (membership + failure info + data summaries). Information spreads exponentially — like a rumor — and the cluster converges without a coordinator.

```text
  Node A: "I know: A(up), B(up), C(suspect)"  ──► B
  Node B merges: "A told me C looks suspect; D is new since last time"
  B ──► D ──► A ...  within a few rounds, every node knows C is down and D joined
```

- Membership: heartbeat counters; if no heartbeat for X rounds → mark suspect → after Y → dead.
- Used by: Cassandra/DynamoDB (no single point of failure), Redis Cluster, Consul, ScyllaDB.
- Failure detection is **probabilistic and eventually consistent** — a node partitioned off may be declared dead then rejoin; data must handle it (hinted handoff, read repair).
- Contrast: ZooKeeper/Raft use a *centralized quorum* — stronger guarantees, more coordination.

---

## 19. Vector Clocks & Conflict Resolution

**Problem:** with leaderless/multi-leader replication, two nodes can accept writes for the same key concurrently (no single "latest" — wall-clock timestamps lie under clock skew). Which value wins?
**Idea:** each node keeps a **version counter per node** — a vector clock. Comparing two clocks tells you if one write *happened-before* the other (causal) or if they're **concurrent** (conflict to resolve).

```text
key "cart" — vector clock = {A:0, B:0}

A accepts write w1        → clock {A:1, B:0}
B accepts write w2        → clock {A:0, B:1}
A and B replicate to each other:
  compare {A:1,B:0} vs {A:0,B:1} → neither dominates ⇒ CONCURRENT ⇒ keep both, resolve
A writes after seeing w1+w2 → {A:2,B:1}  → dominates both → the latest value
```

```js
// Comparison rule: clock X dominates Y if every entry of X >= Y and at least one is >
//   dominates → X happened after Y → X wins
//   incomparable → concurrent → surface both (or merge, e.g. union of cart items)
function dominates(x, y) {
  const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
  let strictlyGreater = false;
  for (const k of keys) {
    if ((x[k] ?? 0) < (y[k] ?? 0)) return false;
    if ((x[k] ?? 0) > (y[k] ?? 0)) strictlyGreater = true;
  }
  return strictlyGreater;
}
```

Resolution strategies: last-writer-wins (LWW — simple but can lose data), merge (CRDTs, e.g. set union), or ask the user ("this document was edited in two places — keep both"). DynamoDB/Cassandra use vector clocks internally with LWW or merge on top.

---

## 20. Dead Letter Queue

**Problem:** a poison message (malformed payload, bug, schema mismatch) makes a consumer crash-loop; retrying forever blocks the queue and stalls healthy messages behind it.
**Idea:** after N failed attempts, move the message to a **dead letter queue** — inspected/alerted on, replayed later after a fix — and keep the main queue flowing.

```text
orders-queue ──► worker: process(order)
                   │ ok ────────────────────────► done
                   │ fail ×3 (with backoff)
                   ▼
              orders-dlq ──► alert on-call / dashboard
                              │ (after fix) replay back to orders-queue
```

```text
// Every broker has a flavor:
// RabbitMQ:   x-dead-letter-exchange → dlq + requeue rules
// SQS:        RedrivePolicy → DLQ (maxReceiveCount = 3)
// Kafka:      consumer catches poison record → publishes to orders-dlq topic (manual)
//             (see kafka-features.md §13)
```

Design decisions: max retries, backoff policy, DLQ retention, alerting on DLQ depth, and *who* replays (tooling) — otherwise a DLQ is just a quieter place for messages to die.

---

## 21. Backpressure

**Problem:** a fast producer can overwhelm a slow consumer (or an overloaded server can be buried by in-flight requests) until buffers explode and everything crashes.
**Idea:** slow down the *source* explicitly instead of letting queues/threads grow unbounded. Strategies, strongest first:

| Strategy | Mechanism | Example |
| -------- | --------- | ------- |
| **Load shedding / fail fast** | reject excess work early | return 503 when queue > X |
| **Bounded queues** | cap the buffer; block/reject when full | `ArrayBlockingQueue(1000)` |
| **Throttling / rate limiting** | limit how fast you accept | token bucket (§12) |
| **Window / credit based** | consumer tells producer how much it can send | TCP flow control, gRPC flow control |
| **Buffering to disk** | spill, don't drop | Kafka (durable log) is *the* backpressure tool: consumers lag instead of crashing |

```java
// Bounded queue + fail fast (concept) — Java's ArrayBlockingQueue
BlockingQueue<Task> queue = new ArrayBlockingQueue<>(1000);
if (!queue.offer(task)) {           // offer() returns false when full
  return 503;                       // shed load NOW instead of queueing forever
}
workerLoop(queue);                  // single consumer drains at its own pace
```

In stream processing, Kafka/Kinesis *are* the backpressure buffer — a slow consumer lags rather than losing data; monitor consumer lag (see `kafka-features.md` §5) and alert before lag turns into data loss at retention time.

---

## 22. Merkle Trees (Anti-Entropy)

**Problem:** two replicas hold terabytes of the same data, and somewhere they differ (bit rot, missed update) — comparing everything to find it is too expensive.
**Idea:** build a hash tree: leaf = hash of one data block; every internal node = hash of its children. Equal roots ⇒ identical data. Different roots ⇒ descend both trees to isolate exactly the divergent blocks and sync only those.

```text
root = H( H(a) || H(b) )
        /          \
      H12          H34
     /  \         /  \
   H1   H2      H3   H4      leaf Hn = hash(block n)
   a    b       c    d

replica1 root == replica2 root  → identical, stop
roots differ                     → compare children recursively
                                 → H3 differs → only block c needs syncing
```

- DynamoDB/Cassandra keep a Merkle tree per key range; background anti-entropy compares ranges and repairs the exact divergent blocks.
- Bitcoin hashes blocks into a Merkle tree; git's object model is Merkle-ish; ZFS/restic verify backups with them.

## 23. Consensus Algorithms (Raft & Paxos)

**Problem:** replicas must agree on the same value / log order / leader without a coordinator — even when servers crash or the network partitions, and never with two leaders (split brain).
**Idea:** majority quorum — a cluster of `2f + 1` nodes tolerates `f` failures because a majority must ack every decision. **Paxos** proved agreement is possible; **Raft** made it practical (leader election by term, log replication, commit on majority). Used by ZooKeeper (Zab), etcd & Consul (Raft), Kubernetes (etcd).

```text
3 nodes → quorum = 2 → tolerates 1 failure
leader appends entry → followers ack → 2 acks → committed → state machine applies
leader dies → followers vote → new leader (highest term wins)
old leader wakes up with a stale term → rejected (fencing token protects the system)
```

Strong and linearizable, but every write costs a quorum round trip. When latency matters more than strict agreement, gossip (§18) trades guarantees for speed.

## 24. Two-Phase Commit (2PC) vs Saga

**Problem:** one transaction touches two databases that don't coordinate (microservices with private DBs). SQL-style cross-DB atomicity is **2PC**; the distributed-systems answer is **Saga** (§8).
**Idea (2PC):** a coordinator asks every participant to *prepare* (phase 1 — write and hold locks, vote). All vote yes → *commit* (phase 2). Any no → *abort*. Participants hold locks until the decision arrives.

```sql
-- participant side (Postgres)
PREPARE TRANSACTION 'global-order-1';     -- phase 1: durable and ready
-- coordinator decides: all prepared → tell everyone to commit
COMMIT PREPARED 'global-order-1';
-- any NO, or coordinator timeout → ROLLBACK PREPARED 'global-order-1';
```

**The catch:** if the coordinator crashes *after* prepare, participants block holding locks — they cannot decide alone. 2PC works inside one database system (XA) but is avoided across microservices.

| | 2PC | Saga |
| -- | --- | ---- |
| Guarantee | atomic (all or nothing), blocking | eventually consistent, non-blocking |
| On failure | abort; wait for the coordinator | run compensating actions |
| Used for | single DB cluster / XA transactions | distributed business flows |
| Danger | coordinator crash → stuck locks | partial states visible between steps |

Rule of thumb: within one database → transaction. Across services → saga + idempotency + outbox.

## 25. CRDTs — Conflict-Free Replicated Data Types

**Problem:** replicas (offline devices, multi-region) accept writes with no coordinator; concurrent edits must converge to the *same* state everywhere without a merge server.
**Idea:** design the data type so its operations *commute* — order doesn't matter, so any replica that applied the same operations reaches the same state (strong eventual consistency). Vector clocks (§19) *detect* conflicts; CRDTs *eliminate* them by construction.

```js
// G-Counter: each replica only increments its own entry; merge = max per entry
const count = c => Object.values(c).reduce((s, n) => s + n, 0);
const a = { r1: 5, r2: 0 };          // replica A saw 5 local increments
const b = { r1: 2, r2: 7 };          // replica B saw 7 local increments
const merged = { r1: Math.max(a.r1, b.r1), r2: Math.max(a.r2, b.r2) };
count(merged);                        // 12 on EVERY replica — no increments lost
```

| CRDT | How it converges |
| ---- | ---------------- |
| G-Counter / PN-Counter | per-replica counts (max / signed) |
| G-Set / OR-Set | set union (add-wins) |
| LWW-Register | last-writer-wins per replica clock |
| RGA / YATA (text) | concurrent text edits merge — Automerge & Yjs power collaborative editing |

CRDTs cost extra metadata per replica and constrain the API (a G-Counter can't just decrement) — in exchange you get coordinator-free convergence.

## 26. Event-Driven Architecture

**Problem:** synchronous service-to-service calls couple deployments and amplify failures (A down → B retries → B down); adding a new consumer means editing the producer.
**Idea:** services communicate through **events** on a broker (Kafka) — producers publish facts and never call consumers directly, so consumers scale, fail, and deploy independently.

```text
OrderService ──OrderCreated──► Kafka topic "orders"
                                 ├─► EmailService      (receipt)
                                 ├─► InventoryService  (reserve stock)
                                 ├─► FraudService      (score risk)
                                 └─► AnalyticsService  (dashboard)
   each consumer subscribes independently; new consumers just join the group
```

| Benefit | Cost |
| ------- | ---- |
| decoupled, independently scalable services | eventual consistency between services |
| replayable history (audit, backfill) | harder to trace one flow end-to-end |
| new consumers without touching producers | needs schema governance (Schema Registry) |
| natural backpressure: consumers lag, nothing crashes | must handle duplicates (idempotency) & poison messages (DLQ) |

Pairs with: outbox (§9) for reliable publishing, event sourcing (§7) when the log is the source of truth, and Kafka as the durable backbone (`kafka-features.md`).

## 28. Quorum Reads & Writes

**Problem:** with N replicas, a write must reach enough nodes to be safe and a read must not return stale data — but you can't wait for *all* nodes (one slow node would block everything), and you don't know which are up.
**Idea:** require **W** nodes to acknowledge a write and **R** nodes to answer a read, with **`W + R > N`** — then any read set and any write set are guaranteed to *overlap*, so every read sees at least one node that acknowledged the write. Same math as majority quorum in consensus (§23): N=3 with W=2, R=2 tolerates 1 node down and still never reads fully stale data.

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 502" width="900" role="img" aria-label="Quorum Reads &amp; Writes">
<rect x="0" y="0" width="960" height="502" fill="#ffffff"/>
<title>Quorum Reads &amp; Writes</title>
<path d="M263 132 L263 227 L144 227 L144 322" fill="none" stroke="#334155" stroke-width="1.6" marker-end="url(#arr-concept-quorum)"/>
<rect x="175.9" y="208" width="56.199999999999996" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
<text x="204" y="221" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="11" fill="#334155">write W=2/N=3 / ack</text>
<path d="M283 132 L283 227 L392 227 L392 322" fill="none" stroke="#334155" stroke-width="1.6" marker-end="url(#arr-concept-quorum)"/>
<rect x="316.5" y="208" width="43" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
<text x="338" y="221" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="11" fill="#334155">write / ack</text>
<path d="M521 132 L521 227 L412 227 L412 322" fill="none" stroke="#334155" stroke-width="1.6" marker-end="url(#arr-concept-quorum)"/>
<rect x="438.9" y="208" width="56.199999999999996" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
<text x="467" y="221" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="11" fill="#334155">read R=2/N=3 / value</text>
<path d="M541 132 L541 227 L660 227 L660 322" fill="none" stroke="#334155" stroke-width="1.6" marker-end="url(#arr-concept-quorum)"/>
<rect x="572.9" y="208" width="56.199999999999996" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
<text x="601" y="221" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="11" fill="#334155">read / value (stale)</text>
<rect x="199" y="70" width="148" height="62" rx="9" fill="#ecfdf5" stroke="#059669" stroke-width="1.6"/>
<text x="273" y="106" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#065f46">Writer</text>
<rect x="457" y="70" width="148" height="62" rx="9" fill="#ecfdf5" stroke="#059669" stroke-width="1.6"/>
<text x="531" y="106" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#065f46">Reader</text>
<rect x="70" y="322" width="148" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="144" y="358" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">Replica A</text>
<rect x="328" y="322" width="148" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="402" y="358" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">Replica B</text>
<rect x="586" y="322" width="148" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="660" y="358" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">Replica C</text>
<defs><marker id="arr-concept-quorum" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#334155"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/concepts/concept-quorum.architecture.html](diagrams/concepts/concept-quorum.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


| N | W | R | W + R > N? | Behavior |
| - | - | - | ---------- | -------- |
| 3 | 2 | 2 | ✓ | any 1 node down; reads never fully stale — the default |
| 3 | 3 | 1 | ✓ | writes must hit all nodes; any single read is guaranteed fresh |
| 3 | 1 | 3 | ✓ | fast writes (any node); reads hit all nodes |
| 3 | 1 | 1 | ✗ | overlap NOT guaranteed — reads can be stale |

**Keeping quorums honest when nodes miss writes:**
- **Read repair:** a read that returns a stale value also fetches the fresh one from the overlapping node and writes it back.
- **Hinted handoff:** a node that was down during a write gets the write stored ("hinted") on a live neighbor and delivered when it returns.
- **Anti-entropy:** background comparison with Merkle trees (§22) finds and fixes the rest.
- **Sloppy quorum:** during a partition Cassandra accepts the write from *any* W reachable nodes (even non-owners) and replays later — writes stay available, guarantees weaken.

**The limits:** quorum fixes *stale reads*; it does not order *concurrent writes* — two clients writing different values to overlapping quorums still need versioning (vector clocks §19) or last-writer-wins.

```js
// Quorum check + which answers a read can return (N=3, W=2, R=2)
const guaranteed = 2 + 2 > 3;                 // true → every read sees a fresh value

const replicas = [
  { id: "A", up: true,  acked: true  },       // acked the last write
  { id: "B", up: true,  acked: true  },
  { id: "C", up: true,  acked: false },       // missed it (was down → hinted handoff)
];
const answers = replicas.filter(r => r.up).slice(0, 2);   // pick R of the up nodes
const fresh = answers.filter(r => r.acked).length;
// guaranteed: fresh >= 1 whenever W + R > N — the read can never be all-stale
if (fresh < answers.length) repairStale(answers);         // read repair fills C
```

---

## 29. Consistency Models

**Problem:** "eventual consistency" is a spectrum, not a point — an app must know exactly what it may observe after a write (its own write? never going backwards?) before it can be correct.
**Idea:** pick the model that matches the user-visible contract, strongest → weakest:

```text
Linearizable      reads see the latest completed write — like a single CPU
                  (Raft §23, Spanner, etcd, ZooKeeper)
Sequential        a global order exists; each client's ops stay in order
Causal            causally related ops are ordered; unrelated ops may reorder
Read-your-writes  a client sees its own writes (no "where did my post go?")
Monotonic reads   reads never move backwards (no flip-flopping values)
Eventual          replicas converge if writes stop; reads may be stale (DNS, search)
```

| Model | What it guarantees | Typical cost | Where you meet it |
| ----- | ------------------ | ------------ | ----------------- |
| Linearizable | single point-in-time global order | quorum / leader round trip per op | etcd, ZooKeeper, Spanner |
| Read-your-writes | own writes visible | route user to leader / a replica with their writes | most user-facing APIs |
| Monotonic reads | no going backwards | pin a user to one replica | session reads |
| Eventual | convergence when writes stop | nothing | DNS, search, analytics |

Replication lag (§15) is where these break: without read-your-writes a user sees a 404 right after creating a page; without monotonic reads a refresh can show an older value than the previous one. Choose the weakest model that doesn't confuse users — every step up costs a round trip.

---

## 30. PACELC Theorem

**Problem:** CAP (§3) only describes behavior *during a partition* — but most of the time the network is fine, and systems still make a choice: be fast or be strongly consistent?
**Idea:** **P**artition → **A**vailability vs **C**onsistency (CAP); **E**lse → **L**atency vs **C**onsistency. PACELC is the "rest of the time" half of CAP.

| System | During partition (P) | Otherwise (E) |
| ------ | -------------------- | ------------- |
| Cassandra (default quorum) | Availability | Latency (async reads) |
| Cassandra (serial / LWT) | Consistency | Consistency |
| DynamoDB (default) | Availability | Latency |
| DynamoDB (strongly consistent reads) | Availability | Consistency |
| Spanner / CockroachDB | Consistency | Consistency — pays the latency |
| MongoDB (replica read preference) | Availability | Latency (or consistency if primary-only) |
| Redis Cluster | Availability | Latency |

Practical takeaway: most systems run **PA/EL** — available under partitions, fast when healthy — and pay with weaker guarantees; only money- or correctness-critical paths (ledgers, IDs, leases) choose consistency on both axes.

---

## 31. Write-Ahead Log (WAL) & Durability

**Problem:** a database that only updates in-memory tables loses everything on crash; a database that only updates data files needs slow random I/O and can leave *torn* (half-written) pages.
**Idea:** before touching data, **append the change to a sequential log on disk** (the write-ahead log) and fsync it — then apply to memory / pages at leisure. On crash, replay the log from the last checkpoint: no committed write is ever lost, no partial page is ever trusted.

```text
write ──► append + fsync to WAL ──► apply to in-memory / page cache ──► later: checkpoint to table
                                        │ crash here?
                                        ▼
                              replay WAL from last checkpoint → committed writes restored
```

- **Group commit:** batch several commits into one fsync — hundreds of thousands of small commits/sec.
- **The WAL doubles as the replication stream:** followers replay the same log (PostgreSQL streaming, MySQL, Kafka's partition log, etcd's raft log).
- Durability vs latency knob: `synchronous_commit = off` skips the fsync (fast; RPO = a few ms of log).

```text
-- PostgreSQL: COMMIT is durable in pg_wal before the client is told "committed"
BEGIN; UPDATE accounts SET balance = balance - 10 WHERE id = 42; COMMIT;
-- power loss 1 ms later → recovery replays pg_wal → the -10 is there
-- without the WAL the update might live only in a dirty page that never hit disk
```

| | WAL-first | Write data file directly |
| -- | --------- | ----------------------- |
| I/O pattern | sequential append (fast) | random page writes (slow) |
| Crash safety | replay log; atomic by design | torn pages, lost commits |
| Cost | extra write (log) + checkpointing | simplicity for tiny datasets |

---

## 32. Storage Engines: B-Trees vs LSM Trees

**Problem:** the same data can be stored in two very different ways, and the choice decides whether your workload is fast — read-heavy or write-heavy.
**Idea:** **B-trees** update pages *in place* (sorted tree on disk, read-optimized); **LSM trees** (log-structured merge) never touch old data — they append writes to a sorted in-memory **memtable**, flush immutable sorted **SSTables** to disk, and merge them in the background.

```text
LSM write path:
  write ──► memtable (sorted, in memory) ──flush when full──► SSTable 0 (immutable)
                                                                  │ background compaction
                                                                  ▼
                                          SSTable 0 ──merge──► SSTable 1 ──► fewer, bigger files
  point read: memtable → bloom filter (§17) → newest SSTable → older SSTables (one has the key)
```

| | B-Tree | LSM (RocksDB, Cassandra, HBase, ScyllaDB) |
| -- | ------ | ------------------------------------------ |
| Writes | in-place page update: random I/O, write amplification | append-only: sequential, very fast |
| Point reads | O(log n) tree walk, predictable | memtable → bloom (§17) → SSTables, still fast |
| Range scans | excellent (leaf-level linked list) | good (SSTables sorted, but spans many files) |
| Compaction | none | background merges — CPU + space amplification |
| Latency tails | steady | compaction bursts spike p99 |
| Durability | WAL (§31) in front | WAL in front; memtable is ephemeral |

Rule of thumb: heavy inserts / logs / time-series → LSM; read-mostly with range queries and predictable latency → B-tree. PostgreSQL and MySQL InnoDB are B-tree; RocksDB (used inside Kafka tiered storage and many other systems) is LSM.

---

## 33. Checksums & Data Integrity

**Problem:** disks, RAM, and networks silently flip bits (bit rot, bad sectors, cosmic rays) — no crash, no error message, just wrong data. Silent corruption is worse than a crash because nobody notices.
**Idea:** store a **checksum with every block/value** (CRC32C is cheap, SHA-256 is stronger); verify on every read; on mismatch, treat the block as corrupt — repair from a replica (or re-fetch) instead of returning garbage.

- PostgreSQL `data_checksums`, ZFS / btrfs scrub, S3 per-part checksums, Kafka per-record-batch checksums, git object hashes.
- Merkle trees (§22) extend the idea to *ranges*: compare roots, descend only where hashes differ — a plain checksum can't say *which* block differs without reading everything.

```js
// CRC32 (table-free version) — store on write, verify on read
function crc32(str) {
  let crc = 0xffffffff;
  for (let i = 0; i < str.length; i++) {
    let c = (crc ^ str.charCodeAt(i)) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
const block = "balance=1000";
const stored = crc32(block);            // write path: store (block, stored)
const ok = crc32(block) === stored;     // read path: mismatch ⇒ corrupted ⇒ repair from replica
```

---

## 34. Distributed Locking & Fencing

**Problem:** "only one worker may run this job / write this key" across machines — an in-process mutex doesn't span processes, and a lock that never expires deadlocks forever when its holder crashes.
**Idea:** a **lease-based lock** in a consensus-backed store (etcd, ZooKeeper, Redis): acquire with a TTL, renew by heartbeat, release on delete; a crashed holder's lease simply expires. The safety net for "holder paused longer than its lease" (GC pause, slow network) is a **fencing token**: an increasing token issued at acquire time; the *resource* rejects any write carrying a stale token.

```text
t1: acquire (token 41) ──► works ──► GC pause 30 s (> lease) ──► resumes, writes "balance=0" with token 41
t2: acquire (token 42) ──► works while t1 is paused ──► writes "balance=100" with token 42

without fencing:  t1's stale write clobbers t2's — silent corruption
with fencing:     storage checks token: 41 < 42 → REJECT t1's write
```

- Same machinery as leader election (§14): a leader *is* a lock holder — fencing tokens are exactly the split-brain protection Raft (etcd, ZooKeeper) and Patroni provide.
- **Redlock caveat:** Redis-based Redlock can't detect a holder paused past its lease (unbounded pause ⇒ two "holders"), so it's only a soft guarantee — pair it with fencing tokens, or use etcd/ZooKeeper when correctness matters.

```text
// etcd / ZooKeeper pattern (concept)
lease = store.lock("job:nightly-report", ttl: 30s, token: ++sequence)   // token increases per acquire
heartbeat loop renews the lease every 10 s
on work: storage.apply(write, token)   // storage rejects if token < last accepted (fencing)
```

---

## 35. Service Discovery & Registry

**Problem:** in a dynamic cluster (autoscaling, rolling deploys, crashes) an instance's address is temporary — hardcoded IPs break, and clients must only talk to *healthy* instances.
**Idea:** a **registry** (etcd, Consul, Kubernetes, ZooKeeper) holds `service → [healthy instances]`; each instance **self-registers** with a lease and renews a heartbeat; clients resolve through DNS or a client-side load balancer that watches the registry.

```text
Service A ──"where is B?"──► DNS / registry (etcd, Consul, K8s)
                                 │ B1, B2 self-register + heartbeat
                                 ▼
                    B1 (healthy)  B2 (healthy)  B3 (draining — unregistered)
Service A round-robins over B1/B2; unhealthy or slow B3 is removed automatically
```

| Approach | How it resolves | Failover speed | Notes |
| -------- | --------------- | -------------- | ----- |
| DNS round-robin | DNS name → several A records | slow (DNS TTL caching) | simplest; the *client* doesn't know health |
| Client-side LB | watch registry directly (gRPC resolver, Finagle) | instant | health-aware; more client complexity |
| Sidecar / proxy | local proxy resolves on behalf (§36) | instant | mesh territory — mTLS + retries bundled |

Health checks matter more than the registry: a "healthy" instance serving errors is worse than a down one. Distinguish **readiness** (can take traffic) from **liveness** (process alive). Gossip (§18) is the *decentralized* alternative — no registry to fail, weaker consistency.

---

## 36. API Gateway vs Service Mesh

**Problem:** clients shouldn't each know and authenticate against a dozen services, and intra-cluster traffic (service → service) needs mTLS, retries, and tracing without rewriting every service.
**Idea:** an **API gateway** (north-south) is the single edge L7 proxy: authN/authZ, TLS termination, rate limiting, routing, response caching, WAF. A **service mesh** (east-west) injects a **sidecar proxy** next to every instance: mTLS between services, retries, timeouts, circuit breaking, tracing, policy — application code stays unaware.

```text
clients ──► [API Gateway] ──► svcA ─sidecar──► svcB ─sidecar──► svcC ──► db
             authn / TLS /        └────── mTLS + retries + tracing between sidecars ──────┘
             rate-limit / route
```

| | API Gateway | Service Mesh |
| -- | ----------- | ------------ |
| Where | the edge, one hop before services | next to every instance (sidecar) |
| Typical job | auth, TLS, rate limit, routing, aggregation | mTLS, retries, circuit breaking, observability |
| Examples | Kong, APISIX, Traefik, AWS API Gateway | Envoy, Istio, Linkerd, Consul Connect |
| Cost | one more hop at the edge | CPU/RAM per instance + control plane |

Both are proxies with overlapping features (Traefik does both) — the question is *where* the traffic flows: external clients → gateway; internal calls → mesh.

---

## 37. CDN & Edge Caching

**Problem:** a user in Mumbai should not wait for a round trip to us-east for every image / JS / video byte, and the origin shouldn't serve the same popular object a million times.
**Idea:** cache content at **edge PoPs** near users. **Pull CDN** (CloudFront, Fastly): the edge fetches from origin on first miss, then serves locally until the TTL expires. **Push CDN**: the origin uploads to edges (rare; full control).

```text
user (Mumbai) ──► PoP Mumbai ── cache hit? ──yes──► serve from edge (5 ms)
                            │ miss
                            ▼
                     origin (us-east) ── fetch once ──► cache at edge with TTL
```

| Problem | Standard fix |
| ------- | ------------ |
| Stale objects | versioned URLs (`app.js?v=42`), short TTL for mutable content, cache-busting on deploy |
| Forced update | purge API (`/*` invalidate), or write-through edge cache |
| Private content | signed URLs / cookies (CloudFront signed URLs, S3 presigned) |
| Dynamic API responses | edge functions (CloudFront Functions / Lambda@Edge) for geo-routing, A/B, token checks |

Rule of thumb: static + globally popular → CDN; user-specific → cache *behind* auth at the app layer (§16). CDNs also absorb DDoS by spreading load across PoPs — put the WAF at the edge, not just at the origin.

---

## 38. Distributed Tracing

**Problem:** one request fans out across 10 services; when it's slow, *which hop* is guilty? Per-service logs can't stitch the path together.
**Idea:** a **trace ID** propagates in headers (`traceparent`, W3C) from the edge through every call; each service records a **span** (name, start, duration, tags, parent span ID); the collector (Jaeger, Zipkin, Tempo, Datadog) joins spans into one tree per trace.

```text
GET /feed  ──► trace id = 0a1b2c ──►
  api-gateway    [span: gateway   12 ms ]
  feed-svc       [span: feed      80 ms ]  parent = gateway
  timeline-svc   [span: timeline 200 ms ]  parent = feed     ← the slow one
  redis          [span: cache      3 ms ]  parent = timeline
```

- **Sampling:** head-based (decide at entry: keep 1%) or tail-based (keep only slow/error traces) — sampled traces are cheap, unsampled spans are not.
- **Correlation:** put `trace_id` in log lines and turn span durations into metric histograms — logs answer "what", metrics "how many", traces "where".
- Make it zero-effort per service: propagate the header in your HTTP client wrapper; never fork or retry without passing the span context.

```js
// concept: propagate and record one hop
async function handle(req, res) {
  const traceparent = req.headers["traceparent"] ?? `00-${randId()}-${randId()}-01`;
  const start = Date.now();
  try { await downstream.call({ traceparent }); }        // pass it on
  finally { reportSpan(traceparent, "handle", Date.now() - start); }
}
```

---

## 39. Retries, Backoff & Jitter

**Problem:** transient failures (timeouts, 503s, resets) are common — but retrying *immediately and identically* from thousands of clients turns one blip into a self-inflicted outage (retry storm, thundering herd §43).
**Idea:** retry with **exponential backoff + jitter**, cap the attempts, and only retry operations that are safe to repeat (idempotent, or with an idempotency key §10).

```js
// exponential backoff with full jitter — breaks client synchronization
function backoff(attempt, baseMs = 100, capMs = 10_000) {
  const exp = Math.min(capMs, baseMs * 2 ** attempt);    // 100, 200, 400, 800, … capped
  return Math.random() * exp;                            // random in [0, exp)
}
// use: for (let a = 0; a < 5; a++) { try { return await call(); } catch { await sleep(backoff(a)); } }
```

- **Why jitter:** without it every client retries at the same +1 s / +2 s / +4 s marks, recreating the exact load spike that caused the failure.
- **What to retry:** reads, and writes with idempotency keys — never blindly retry a mutating call (double-charge, double-spend).
- **When to stop:** cap attempts (e.g. 5), then fail fast; if errors persist, trip a circuit breaker (§11) instead of hammering.

---

## 40. Timeouts & Hedging

**Problem:** a request's latency = its slowest subcall; one outlier (GC pause, noisy neighbor) drags the p99 of the whole system, and waiting forever for it is worse than failing fast.
**Idea:** **timeouts** bound every call, **deadlines** bound the *total* budget (propagate remaining time down the call graph), **hedging** duplicates slow calls to another replica and takes the first answer.

| Tool | What it does | Example |
| ---- | ------------ | ------- |
| Timeout | bounds a single call | 100 ms per hop |
| Deadline | total budget, propagated | "2 s left", not "retry forever" |
| Hedging | after a delay (e.g. 95th %ile), fire a duplicate elsewhere; first success wins | Google: ~half the long tails gone for ~14% extra requests |
| Bounded concurrency | cap in-flight work; reject or queue the rest (§21) | queues are where latency goes to die |

Classic failure mode: retry logic that resets the clock per attempt — the *deadline* (total) must stay fixed even as individual *timeouts* shrink. Hedging pairs with idempotency (§10): the duplicate read is free; the duplicate write is only safe if the operation is idempotent or keyed.

---

## 41. Logical Clocks (Lamport & HLC)

**Problem:** wall-clock timestamps from different machines can't order events — NTP skew means A's "12:00:01" can be earlier than B's "12:00:00". Multi-machine causality needs a *logical* clock.
**Idea (Lamport):** every node keeps a counter; local event → `L++`; send → attach `L`; receive → `L = max(L, msg.L) + 1`. If event `a` causally precedes `b`, then `L(a) < L(b)` — a total order exists, but concurrent events get arbitrary order.

```text
A: L=1 ──send──► B: L = max(0, 1)+1 = 2   (happened-before is preserved)
B: L=2 ──send──► C: L = max(0, 2)+1 = 3
two nodes with no communication: both at L=1 — same timestamp, no causality — arbitrary tiebreak
```

| Clock | Ordering guarantee | Detects concurrency? | Used by |
| ----- | ------------------ | -------------------- | ------- |
| Wall clock (NTP) | none under skew | no | logs only |
| Lamport | causal order | no | distributed algorithms |
| Vector clocks (§19) | causal order | **yes** | DynamoDB, Cassandra |
| HLC (hybrid) | causal + near-wall-clock | no | CockroachDB, MongoDB |

**HLC** = physical ms + a logical counter: timestamps that *look* like wall clock (good for UX, logs) but stay safe under skew. For conflict *detection* (two replicas wrote the same key), only vector clocks suffice — see §19.

---

## 42. Fan-out & Push vs Pull

**Problem:** one user's action must reach thousands or millions of others (a post → followers' feeds; an event → subscribers), and client devices need updates without polling themselves into a DoS.
**Idea:** **fan-out** spreads the single write. **Write fan-out**: on publish, copy the post into every follower's timeline (fast reads, expensive writes). **Read fan-out**: assemble the timeline at read time by querying followed users (cheap writes, slow reads). **Hybrid** (Twitter/Instagram): regular users write-fanout; celebrities' posts merge at read time.

```text
user posts ──► post-svc ──► fanout worker (async, batches) ──► insert into 1M followers' feed caches
timeline read ──► cached feed (fan-out part) + celebrity posts fetched live and merged
```

**Push vs pull to clients:**

| Mechanism | Direction | Use for | Cost |
| --------- | --------- | ------- | ---- |
| Polling | client pulls on a timer | cheap, low-frequency sync | wasteful at scale (constant empty requests) |
| Long-poll | client holds the request until data arrives | near-real-time without sockets | one open connection per client |
| SSE | server → client stream (HTTP) | notifications, live scores | one-way only; auto-reconnect |
| WebSockets | bidirectional | chat, collaborative editing, live cursors | connection state + backpressure burden |
| Webhooks | server → server (event-driven) | payments, CI, external systems | needs retries + idempotency (§10, §39) |

Same shape as event-driven architecture (§26): fan-out is the *delivery* pattern; a broker (Kafka) is the durable backbone — see the Twitter, Instagram, and Notification System docs for full designs.

---

## 43. Hot Keys & Thundering Herd

**Problem:** two skew problems: (1) a **hot key** — one key gets a disproportionate share of traffic (viral tweet, trending product), saturating its shard while the rest idle; (2) a **thundering herd** — a cache entry expires and *all* concurrent requests miss at once, stampeding the database.
**Idea:** for hot keys: split or replicate the key across shards (`video:42:a/b/c`), keep hot data in a local in-process cache, detect skewed shards adaptively. For stampedes: **TTL jitter**, **single-flight** (one in-flight loader; everyone else awaits the same promise), stale-while-revalidate, or warm the key on write.

```js
// Single-flight: concurrent callers share ONE loader — the DB sees 1 query, not 10k
const inflight = new Map();
function singleFlight(key, load) {
  if (!inflight.has(key)) {
    inflight.set(key, load().finally(() => inflight.delete(key)));
  }
  return inflight.get(key);
}
// cache fill: singleFlight("feed:42", () => db.query(...))
```

```text
without single-flight: 10 000 requests miss "feed:42" → 10 000 DB queries → DB melts → retries (§39) melt it more
with single-flight:    10 000 await one promise → 1 DB query → everyone served the same fresh value
```

Same physics as retry storms (§39): synchronized load is the enemy — jitter, batching, and a single authoritative filler break the synchronization. Redis `SETNX` implements the same idea across processes (see the distributed-cache doc).

---

## 44. Optimistic Concurrency & Versioning

**Problem:** two writers update the same row at the same time; last-writer-wins silently drops one user's edit.
**Idea:** assume conflicts are rare — no locks — but make them *detectable*: each write carries a **version** (or the read's value); the update only succeeds if the version hasn't changed. A failed compare-and-swap (CAS) means retry or surface the conflict.

```sql
-- version column: exactly one writer wins
UPDATE users SET name = 'Alice', version = version + 1
WHERE id = 42 AND version = 5;
-- 1 row updated → you won. 0 rows → someone else wrote first → retry with the new value, or 409
```

| Mechanism | Where you see it |
| --------- | ---------------- |
| Version column / CAS (`WHERE version = ?`) | SQL apps, DynamoDB conditional writes |
| ETag + `If-Match` | HTTP: PUT only if the client's ETag still matches |
| `WATCH`/`MULTI` + Lua compare-and-set | Redis optimistic CAS |
| Tombstones | deletes as markers so a stale replica can't resurrect a key (LSM §32, multi-leader) |

Without versioning a concurrent write is silently lost (LWW); with it you choose: retry (low contention) or show the user both versions (Google Docs-style merge — vector clocks §19, CRDTs §25).

---

## 45. SLIs, SLOs & Error Budgets

**Problem:** "make it reliable" is unmeasurable — you can't discuss whether to ship, buy capacity, or stop deploys without numbers; and 100% uptime is both impossible and pointless.
**Idea:** pick a **signal** (SLI), set a **target** (SLO) over a window, and treat the leftover as a **budget** you may deliberately spend — on deploys, experiments, or repairs.

| Term | Meaning | Example |
| ---- | ------- | ------- |
| SLI | the measured signal | p99 latency ≤ 250 ms; error rate ≤ 0.1%; availability |
| SLO | the target for the SLI | 99.9% availability over a 30-day window |
| SLA | contractual commitment (usually weaker) | 99.95% with refunds |
| Error budget | 100% − SLO | 0.1% ≈ 43 minutes/month of *allowed* failures |

- **Burn-rate alerting:** if the budget burns at 14.4× (would exhaust in ~2 days), page now — not when the budget is already gone.
- The budget makes trade-offs discussable: "we've used 10% of the month's budget — we can afford this rollout," or "deploys are frozen until the budget recovers."
- Choose SLIs that match user pain (latency/errors on *user-visible* paths), not internal niceties.

---

## 46. Multi-Region & Disaster Recovery

**Problem:** one region is a single point of failure (outage, disaster) and far-away users suffer latency; being multi-region means trading consistency and money for resilience.
**Idea:** **RPO** (how much data you may lose) and **RTO** (how long you may be down) set the bar; then pick a topology:

| | Active-Passive | Active-Active |
| -- | -------------- | ------------- |
| Writes | primary region only; async replicate to DR | both regions (conflicts possible!) |
| Reads | primary + DR can both serve reads | both regions |
| Failover | promote DR (RTO = minutes with automation, else hours) | none needed — clients just reroute |
| Data loss | RPO = replication lag (async) or ~0 (sync, slower writes) | conflict resolution (§19, §25) |
| Example | PostgreSQL streaming + PITR backups, Redis replicas | Spanner, multi-region Cassandra |

```text
us-east (primary) ──async replication──► us-west (DR)          active-passive
  app writes → us-east only; us-east dies → promote us-west (RTO), accept losing < 1 s (RPO)
geo-routing: latency-based DNS / anycast steers users to the nearest healthy region
```

- Never trust replication alone: restore-from-backup drills (PITR) are the only proof the DR story works.
- Cross-region is where consistency models (§29) bite hardest: async replication + active-active = eventual across regions; strong consistency (Spanner) costs the latency CAP/PACELC (§30) predicts.

---

## 47. Deployment Strategies

**Problem:** shipping new code is the most common way to break production; a bad release should fail loudly, affect few users, and roll back in seconds — not hours.
**Idea:** control *how* new versions meet traffic:

| Strategy | How it works | Rollback | Risk profile |
| -------- | ------------ | -------- | ------------ |
| Rolling | replace instances gradually (K8s default) | redeploy previous version | both versions live together — schema must be backward-compatible |
| Blue-green | two full environments; switch the router | instant: flip back | 2× infra; DB still shared — schema must be compatible |
| Canary | 1–5% of traffic to the new version; watch SLOs (§45); ramp up | route 100% back | small blast radius; needs metrics + alerts |
| Feature flags | ship code hidden; toggle per user/group | flip a flag — no deploy | flag sprawl; flags must be cleaned up |

```text
traffic ──► canary 2% ──► watch error budget / latency ──► ramp 10% → 50% → 100% ──► done
            errors or budget burn? ──► route 100% back to the old version, investigate
```

Best practice is a stack: **canary + feature flags + error-budget monitoring + automated rollback**, with migrations designed backward-compatible (additive columns, dual writes) so old and new code can coexist during any of these.

---

## 48. Geospatial Indexing (Geohash & S2)

**Problem:** "venues within 5 km of me" — scanning every point is too slow, and (lat, lng) pairs don't sort into one key that supports range queries.
**Idea:** **geohash**: encode (lat, lng) into a base32 string where *longer prefixes = smaller boxes* and nearby points share prefixes — a normal string index (B-tree §32) now serves "near me". **Quadtrees** split space into 4 recursively; **S2/H3** (Google/Uber) use spherical cells; PostGIS uses R-tree (GiST).

```text
geohash "te7u..." (≈ 1.2 km box)          ┌───┬───┬───┐
Mumbai (19.07, 72.87) → "te7um..."        │   │   │   │  4-way split (quadtree):
nearby venue            → "te7um9..."      │ X │   │   │  recurse only into the
Delhi (28.61, 77.20)    → "ttd..."         └───┴───┴───┘  cell that contains points
"near me" query: prefix match, then filter exact distance (haversine)
```

```js
// Bounding-box prefilter — cheap with a normal index, then refine with exact distance
function bboxQuery(lat, lng, radiusKm) {
  const dLat = radiusKm / 111;                        // 1° latitude ≈ 111 km
  const dLng = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  return { minLat: lat - dLat, maxLat: lat + dLat,
           minLng: lng - dLng, maxLng: lng + dLng };
}
// SELECT * FROM venues WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?  →  haversine filter
```

Two-tier pattern everywhere: coarse index (geohash prefix / bbox / S2 cell) gets candidates, an exact haversine filter confirms — see `system-design-proximity-service.md` for the full design.

---

## 49. Quick Map: Concept → Problem Solved
Lost? Start here - find the concept that matches the problem you are solving:

| Concept | Solves | See also |
| ------- | ------ | -------- |
| Sharding | one DB can't scale | — |
| Consistent hashing | cheap node add/remove in sharded caches | system-design-distributed-cache.md |
| CAP | consistency vs availability choice | system-design-key-value-store.md |
| ACID vs BASE | durability/consistency philosophy | — |
| SOLID | maintainable code | — |
| CQRS | read/write models optimized separately | google-docs, netflix, linkedin docs |
| Event sourcing | audit + replay of state changes | irctc, google-docs docs |
| Saga | transactions across services | ecommerce, payment docs |
| Outbox | reliable DB → Kafka publishing | kafka-features.md |
| Idempotency | safe retries / no duplicates | payment-system.md |
| Circuit breaker | graceful degradation | all systems |
| Rate limiting | protect against abuse | system-design-rate-limiter.md |
| Load balancing | spread traffic across servers | — |
| Leader election | one active coordinator | — |
| Replication | availability + read scaling | — |
| Caching | latency reduction | redis-features.md |
| Bloom filter | memory-cheap membership | key-value-store, web-crawler docs |
| Gossip | decentralized membership | key-value-store.md |
| Vector clocks | concurrent-write ordering | key-value-store.md |
| DLQ | poison messages don't stall queues | kafka-features.md |
| Backpressure | fast producer / slow consumer | kafka-features.md |
| Merkle trees | detect divergence between replicas cheaply | key-value-store.md |
| Consensus (Raft/Paxos) | crash-safe agreement, one leader | ZooKeeper / etcd topics |
| 2PC vs Saga | blocking 2-phase commit vs compensating saga | saga row above |
| CRDTs | coordinator-free convergence | google-docs (editing) |
| Event-driven architecture | decouple services via an event bus | kafka-features.md |
| Quorum | never read stale data; survive node loss | system-design-key-value-store.md |
| Consistency models | which read guarantees your app needs | — |
| PACELC | the no-partition half of CAP | — |
| WAL | durability + cheap crash recovery | postgresql-features.md |
| B-tree vs LSM | storage engine choice (reads vs writes) | — |
| Checksums | silent data corruption | system-design-key-value-store.md |
| Distributed locking | exactly one worker, safely | system-design-distributed-cache.md |
| Service discovery | find healthy instances dynamically | — |
| Gateway vs mesh | edge auth/routing vs intra-cluster mTLS | — |
| CDN | low-latency global content | system-design-file-storage.md |
| Distributed tracing | find the slow hop across services | — |
| Retries & backoff | survive transient failures without storms | system-design-payment-system.md |
| Timeouts & hedging | kill tail latency | — |
| Logical clocks | order events without trusting wall clocks | — |
| Fan-out | one write → many readers | twitter, instagram docs |
| Hot keys & stampede | skewed load; cache-miss herds | system-design-distributed-cache.md |
| Optimistic concurrency | lost updates without locks | system-design-google-docs.md |
| SLI/SLO/SLA | reliability you can measure and budget | — |
| Multi-region & DR | survive a region outage | — |
| Deployment strategies | ship safely, roll back fast | — |
| Geospatial indexing | "near me" at scale | system-design-proximity-service.md |
| Algorithms (Luhn, Dijkstra, LRU, …) | classic LLD interview tools, JS included | Part II — §50–§66 |

---

## Part II — Classic Algorithms & Data Structures (LLD)

## 50. Luhn's Algorithm (Credit Card Validation)

**Problem:** a user typos a 16-digit card number — you want to reject it before it reaches the payment provider, without a database lookup.
**Idea:** a checksum-style format check: from the rightmost (check) digit, double every second digit; any doubled digit > 9 subtracts 9; the total must be divisible by 10. Catches every single-digit error and ~90% of adjacent-transposition errors.

```js
function luhnValid(card) {
  const d = String(card).replace(/\D/g, "");
  if (d.length < 13) return false;
  let sum = 0, double = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let v = +d[i];
    if (double) { v *= 2; if (v > 9) v -= 9; }
    sum += v; double = !double;
  }
  return sum % 10 === 0;
}
luhnValid("4532015112830366");  // true — Visa test number
luhnValid("4532015112830367");  // false — last digit flipped
```

Luhn is a *format* check, not security: still verify with the issuer, tokenize (never store PANs), and keep PCI scope minimal — see `system-design-payment-system.md`.

---

## 51. Dijkstra's Shortest Path

**Problem:** cheapest route from A to B on a weighted graph (roads with travel times, network hops with latency) — exploring every path is exponential.
**Idea:** expand nodes in order of current best known distance: pop the closest unsettled node, relax its neighbors, stop when the destination is popped. O((V + E) log V) with a min-heap.

```js
// adjacency list graph: { A: [["B", 4], ["C", 2]], B: [["C", 1], ["D", 5]], ... }
function dijkstra(graph, start, goal) {
  const dist = Object.fromEntries(Object.keys(graph).map(k => [k, Infinity]));
  dist[start] = 0;
  const pq = [[0, start]];                        // [distance, node] — real prod code uses a heap
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift();
    if (u === goal) return d;
    if (d > dist[u]) continue;                    // stale entry
    for (const [v, w] of graph[u]) {
      if (d + w < dist[v]) { dist[v] = d + w; pq.push([d + w, v]); }
    }
  }
  return Infinity;                                // unreachable
}
```

Where: route engines (Google Maps), network routing (OSPF), P2P overlays. Positive weights only — with negative edges use Bellman-Ford. See `system-design-google-maps.md`.

---

## 52. A* Search

**Problem:** Dijkstra expands in all directions; with an estimate of where the goal is, you can skip most of the map.
**Idea:** score every node f(n) = g(n) + h(n): known cost so far + an **admissible heuristic** (straight-line / haversine §64 distance). Expand lowest f first — optimal whenever h never overestimates.

```js
// grid: 2D array of walkable cells; h: heuristic (e.g. straight-line distance to goal)
function astar(grid, start, goal, h) {
  const key = ([r, c]) => r + "," + c;
  const open = [[h(start), 0, start]];            // [f, g, cell]
  const gScore = { [key(start)]: 0 }, came = {};
  while (open.length) {
    open.sort((a, b) => a[0] - b[0]);
    const [, g, cur] = open.shift();
    if (key(cur) === key(goal)) return g;         // (reconstruct path via `came`)
    for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const nb = [cur[0] + dr, cur[1] + dc];
      if (!grid[nb[0]]?.[nb[1]]) continue;
      const ng = g + 1;
      if (ng < (gScore[key(nb)] ?? Infinity)) {
        gScore[key(nb)] = ng; came[key(nb)] = cur;
        open.push([ng + h(nb), ng, nb]);
      }
    }
  }
  return Infinity;
}
```

Where: navigation, delivery routing, games — the heuristic is what turns Dijkstra into a focused search.

---

## 53. BFS & DFS Graph Traversal

**Problem:** explore a graph: shortest number of hops (BFS) or deep traversal / cycle detection (DFS).
**Idea:** BFS = queue, visits by layers — the first time you see a node is the fewest-edge path (unweighted graphs). DFS = stack / recursion — finds cycles, connected components, and post-order.

```js
function bfs(graph, start) {                      // shortest hop count, unweighted
  const seen = new Set([start]), q = [start], hops = { [start]: 0 };
  while (q.length) {
    const u = q.shift();
    for (const v of graph[u]) if (!seen.has(v)) { seen.add(v); hops[v] = hops[u] + 1; q.push(v); }
  }
  return hops;
}

function hasCycle(graph) {                        // DFS with a recursion stack
  const state = {};                               // 0 = visiting, 1 = done
  const visit = u => {
    if (state[u] === 1) return false;
    if (state[u] === 0) return true;              // back-edge → cycle
    state[u] = 0;
    for (const v of graph[u]) if (visit(v)) return true;
    state[u] = 1; return false;
  };
  return Object.keys(graph).some(visit);
}
```

Where: web-crawler.md (BFS frontier), social graphs (friends-of-friends), metro hop queries — see `system-design-web-crawler.md` and `system-design-metro-ticketing.md`.

---

## 54. Topological Sort (Kahn's Algorithm)

**Problem:** order tasks where some depend on others — build pipelines, DB migrations, stream-processing DAGs, Spark stages — and detect circular dependencies.
**Idea (Kahn):** repeatedly remove nodes with in-degree 0; the removal order is a valid order; if nodes remain, there's a cycle.

```js
function topoSort(n, edges) {                     // n nodes, edges [[a, b]] = a before b
  const adj = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [a, b] of edges) { adj[a].push(b); indeg[b]++; }
  const q = [], order = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
  while (q.length) {
    const u = q.shift(); order.push(u);
    for (const v of adj[u]) if (--indeg[v] === 0) q.push(v);
  }
  return order.length === n ? order : null;       // null ⇒ cycle — no valid order
}
```

Where: delayed-job-scheduler.md (job DAGs), schema migrations, Airflow/DAG orchestration, Kafka Streams topology validation.

---

## 55. Union-Find (Disjoint Set)

**Problem:** maintain connected components dynamically — friend circles, fraud-related accounts, dedupe clusters — with near-constant-time operations.
**Idea:** parent pointers + **union by rank** + **path compression** → amortized α(n), practically O(1).

```js
class UnionFind {
  constructor(n) { this.p = [...Array(n).keys()]; this.r = new Array(n).fill(0); }
  find(x) { return this.p[x] === x ? x : (this.p[x] = this.find(this.p[x])); }  // path compression
  union(a, b) {
    a = this.find(a); b = this.find(b);
    if (a === b) return false;
    if (this.r[a] < this.r[b]) [a, b] = [b, a];   // union by rank
    this.p[b] = a; if (this.r[a] === this.r[b]) this.r[a]++;
    return true;
  }
}
const uf = new UnionFind(6);
uf.union(0, 1); uf.union(1, 2); uf.union(3, 4);
uf.find(0) === uf.find(2);   // true  — same friend circle
uf.find(0) === uf.find(4);   // false — different circle
```

Where: social networks (mutual friends), fraud detection (linked accounts), crawler URL clustering.

---

## 56. Trie (Prefix Tree)

**Problem:** prefix queries at scale — autocomplete, dictionary lookup, IP routing — where comparing full strings repeatedly is wasteful.
**Idea:** a tree where each edge is one character and every node is a prefix. Insert / search / prefix-walk cost O(key length), independent of dictionary size.

```js
class Trie {
  constructor() { this.root = { kids: {} }; }
  insert(word) {
    let n = this.root;
    for (const c of word) n = (n.kids[c] ??= { kids: {} });
    n.end = true;
  }
  search(word) {
    let n = this.root;
    for (const c of word) if (!(n = n.kids[c])) return false;
    return !!n.end;
  }
  startsWith(prefix) {
    let n = this.root;
    for (const c of prefix) if (!(n = n.kids[c])) return false;
    return true;
  }
}
```

Where: search-autocomplete.md (prefix → top-k suggestions; each node holds a ranked list), load-balancer URL routing (longest-prefix match), spell-check dictionaries.

---

## 57. LRU Cache

**Problem:** a bounded cache must evict the least-recently-used entry, and both get and put must be O(1).
**Idea:** hash map for O(1) lookup + recency tracking; get touches the entry, put evicts the least-recent one when full. (Interview version: doubly-linked list + hash map — same complexity, no reliance on Map ordering.)

```js
class LRU {
  constructor(cap) { this.cap = cap; this.m = new Map(); }   // Map preserves insertion order
  get(k) {
    if (!this.m.has(k)) return -1;
    const v = this.m.get(k); this.m.delete(k); this.m.set(k, v);   // touch → move to front
    return v;
  }
  put(k, v) {
    if (this.m.has(k)) this.m.delete(k);
    this.m.set(k, v);
    if (this.m.size > this.cap) this.m.delete(this.m.keys().next().value);  // evict LRU
  }
}
```

Where: system-design-distributed-cache.md, Redis `allkeys-lru`, CDN edge caches, in-process caches (§16).

---

## 58. External Sort & K-Way Merge

**Problem:** sorting 1 TB of URLs on a machine with 8 GB RAM (crawler dedupe, index building) — the data never fits in memory.
**Idea:** split into chunks that fit in RAM → sort each in memory → write sorted runs to disk → **k-way merge** with a heap, streaming the output.

```js
// k-way merge: repeatedly take the smallest head across k sorted runs
function kWayMerge(runs) {                        // runs: array of sorted arrays
  const heap = runs.map((r, i) => r.length ? [r[0], i, 0] : null).filter(Boolean);
  const out = [];
  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0]);
    const [v, run, idx] = heap.shift();
    out.push(v);
    const next = runs[run][idx + 1];
    if (next !== undefined) heap.push([next, run, idx + 1]);
  }
  return out;
}
```

Where: web-crawler.md URL dedupe, search index building, MapReduce shuffle phase, database sort-merge joins.

---

## 59. Reservoir Sampling

**Problem:** pick k uniform-random items from a stream of unknown (or unbounded) size — without storing the stream.
**Idea:** keep the first k items; for item i ≥ k, replace a random slot with probability k/i. Every item ends up selected with equal probability k/n.

```js
function reservoir(stream, k) {
  const keep = [];
  for (let i = 0; i < stream.length; i++) {
    if (i < k) keep.push(stream[i]);
    else {
      const j = Math.floor(Math.random() * (i + 1));   // uniform in [0, i]
      if (j < k) keep[j] = stream[i];
    }
  }
  return keep;
}
```

Where: canary selection (§47), A/B test assignment, metrics/tracing sampling (§38), random playlist generation (netflix / spotify docs).

---

## 60. Count-Min Sketch

**Problem:** track frequencies of top items in a stream (trending topics, hot keys §43, per-key rate limiting) with bounded memory — exact counts for every key don't fit.
**Idea:** d rows of counters, each row hashed by a different hash function; estimate = **min** across rows. Never undercounts; may overcount (hash collisions).

```js
class CountMinSketch {
  constructor(w = 1000, d = 5) {
    this.w = w; this.d = d;
    this.t = Array.from({ length: d }, () => new Array(w).fill(0));
  }
  _h(i, x) {
    let h = 2166136261;
    for (const c of x) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return Math.abs(h + i * 0x9e3779b9) % this.w;
  }
  add(x) { for (let i = 0; i < this.d; i++) this.t[i][this._h(i, x)]++; }
  count(x) {
    let m = Infinity;
    for (let i = 0; i < this.d; i++) m = Math.min(m, this.t[i][this._h(i, x)]);
    return m;
  }
}
const cms = new CountMinSketch();
["video:42", "video:42", "video:7"].forEach(x => cms.add(x));
cms.count("video:42");   // ≥ 2 — exact or overcount, never under
```

Where: hot-key detection (§43), trending hashtags, heavy hitters — pairs with bloom filter (§17, membership) and HLL (§61, distinct counts).

---

## 61. HyperLogLog (Cardinality Estimation)

**Problem:** "how many distinct visitors today?" on a stream of billions — exact counting needs memory proportional to the set size.
**Idea:** hash each element; keep the maximum run of leading zeros per register bucket; estimate ≈ 2^maxZeros averaged across registers. Redis PFADD/PFCOUNT: ~12 KB regardless of cardinality, ~0.8% error.

```js
// simplified HLL (single pass, m registers; real HLL adds bias correction)
function hllEstimate(items, m = 1024) {
  const regs = new Array(m).fill(0);
  for (const it of items) {
    let h = 0;
    for (const c of it) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
    const idx = h % m, w = h >>> 10;
    regs[idx] = Math.max(regs[idx], Math.clz32(w) + 1);   // leading zeros
  }
  const alpha = 0.7213 / (1 + 1.079 / m);
  return alpha * m * m / regs.reduce((s, r) => s + 2 ** -r, 0);
}
```

Where: redis-features.md (HLL data type), analytics dashboards, ad-tech reach counts, dedupe at the edge.

---

## 62. Levenshtein Distance (Edit Distance)

**Problem:** fuzzy match — "did the user mean 'resturant'?" — or dedupe similar records (addresses, names) where exact equality fails.
**Idea:** dynamic programming: edit distance between prefixes; cost 1 per insert / delete / substitute. O(m·n) time; O(n) space with two rows.

```js
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}
levenshtein("kitten", "sitting");   // 3
```

Where: search "did you mean", contact/address dedupe, OCR correction. O(n·m) is too slow for huge dictionaries → prefilter with trigrams / BK-trees, then exact DP on the candidates.

---

## 63. String Matching (KMP & Rabin-Karp)

**Problem:** find a pattern in text (fraud-pattern scan, log search, content fingerprinting) without re-scanning matched characters on every mismatch.
**Idea:** **KMP** precomputes the longest-prefix-suffix (LPS) table and never backtracks — O(n + m). **Rabin-Karp** hashes a sliding window and compares hashes — O(n) average, and one pass can check *many* patterns simultaneously (verify on hash match).

```js
function kmp(text, pat) {
  const lps = new Array(pat.length).fill(0);            // longest proper prefix = suffix
  for (let i = 1, j = 0; i < pat.length; i++) {
    while (j > 0 && pat[i] !== pat[j]) j = lps[j - 1];
    if (pat[i] === pat[j]) lps[i] = ++j;
  }
  const found = [];
  for (let i = 0, j = 0; i < text.length; i++) {
    while (j > 0 && text[i] !== pat[j]) j = lps[j - 1];
    if (text[i] === pat[j]) j++;
    if (j === pat.length) { found.push(i - j + 1); j = lps[j - 1]; }
  }
  return found;
}
```

Where: intrusion/abuse pattern scanning, streaming content fingerprinting (rolling hash), plagiarism checks.

---

## 64. Haversine Distance

**Problem:** exact distance between two (lat, lng) points — courier ETAs, "within 5 km", driver matching.
**Idea:** spherical-law formula (haversine) over Earth's radius R ≈ 6371 km. Below ~1 km a flat-earth approximation is fine.

```js
function haversineKm(a, b) {
  const R = 6371, toRad = x => x * Math.PI / 180;
  const dLat = toRad(b[0] - a[0]), dLng = toRad(b[1] - a[1]);
  const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
haversineKm([19.076, 72.8777], [19.1176, 72.9061]);   // ≈ 5.6 km — Mumbai
```

Where: proximity-service.md, uber.md, food-delivery.md — always as the *final filter* after a cheap geohash / bbox prefilter (§48), never as a full-table scan.

---

## 65. Base62 Encoding & Snowflake IDs

**Problem:** URL-shortener keys must be short and URL-safe; globally unique IDs must be generated without a central sequence and ideally sort by time.
**Idea:** **Base62** (0-9a-zA-Z) shrinks IDs: 7 characters encode ~3.5×10^12 values. **Snowflake** packs 41-bit ms timestamp + 10-bit machine + 12-bit sequence → 4096 IDs/ms/machine, ~69 years, time-ordered, zero coordination.

```js
const B62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function toBase62(n) {
  let s = "";
  do { s = B62[n % 62] + s; n = Math.floor(n / 62); } while (n > 0);
  return s;
}
// Snowflake (concept): (timestamp - epoch) << 22 | machineId << 12 | sequence
function snowflake(ms, machineId, seq) {
  return ((BigInt(ms) - 1288834974657n) << 22n) | (BigInt(machineId) << 12n) | BigInt(seq);
}
```

Where: url-shortener.md (Base62 keys), payment-system.md and messaging-app.md (time-ordered IDs), distributed logs (IDs sort by creation time).

---

## 66. Sliding Window & Two Pointers

**Problem:** windowed stats over streams — per-second rate limits, moving averages, anomaly detection — needing O(1) amortized add/evict, not a full recount.
**Idea:** keep a queue (or circular buffer) of events; on each event, append and drop everything outside the window. Sliding-window *log* (exact), fixed-window *counter* (cheap, bursty), or sliding-window *counter* (buckets, approximate).

```js
class SlidingWindowRateLimiter {
  constructor(limit, windowMs) { this.limit = limit; this.windowMs = windowMs; this.events = []; }
  allow(now = Date.now()) {
    while (this.events.length && this.events[0] <= now - this.windowMs) this.events.shift();
    if (this.events.length >= this.limit) return false;
    this.events.push(now);
    return true;
  }
}
```

Where: rate-limiter.md (token bucket vs sliding window trade-offs), metrics aggregation, session windows — see `system-design-rate-limiter.md`.

---

## Related System Design Documents

- [Distributed Cache (Redis)](system-design-distributed-cache.md) — consistent hashing, LRU, bloom, gossip in practice
- [Key-Value Store (DynamoDB)](system-design-key-value-store.md) — vector clocks, quorum, gossip
- [Rate Limiter](system-design-rate-limiter.md) — token bucket, sliding window implementations
- [Payment System (Stripe)](system-design-payment-system.md) — idempotency, saga
- [E-Commerce (Amazon)](system-design-ecommerce.md) — sharding, caching, outbox
- [Proximity Service](system-design-proximity-service.md) — geohash, spatial indexes, "near me" queries
- [PostgreSQL Features Guide](postgresql-features.md) · [Redis Features Guide](redis-features.md) · [Kafka Features Guide](kafka-features.md)
