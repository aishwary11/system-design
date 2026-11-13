<a id="top"></a>

<div align="center">

<sub>REFERENCE</sub>

# Glossary — System Design Terms in Plain English

<sub>104 TERMS · 9 GROUPS · 14 MIN READ</sub>

</div>

> [!TIP]
> **THE GUIDE** — Every piece of jargon in this library, defined in one sentence, with the failure it prevents and the document that explains it properly.

Design docs use short labels because repeating a definition in 56 files wastes the reader's time. This page holds the definitions once. Each entry says what the term means, what goes wrong without it, and where to learn the mechanism.

**How to use it:** follow a link from a design doc, read the three lines, then go back. If you are revising, read the "failure it prevents" line only — that is usually the interview answer.

---

## On this page

<details open>
<summary><b>8 groups</b></summary>

1. [Distribution & consistency](#distribution)
2. [Storage & databases](#storage)
3. [Caching](#caching)
4. [Messaging & streaming](#messaging)
5. [Delivery & operations](#delivery)
6. [Security & identity](#security)
7. [Data & analytics](#data)
8. [Algorithms & search](#algorithms-search)
9. [AI infrastructure](#ai)

</details>

---

<a id="distribution"></a>
## Distribution & consistency

<a id="shard"></a>
### Shard
One horizontal slice of a dataset; each shard holds a disjoint subset of rows and lives on its own machine.
**Failure it prevents:** a single database that cannot hold the writes or fit the indexes of a growing service.
**Go deeper:** [Sharding](system-design-concepts.md#1-sharding-data-partitioning) · [Key-value store](system-design-key-value-store.md).

<a id="consistent-hashing"></a>
### Consistent hashing
Placing keys and nodes on the same ring so adding or removing a node moves only its neighbours' keys, not the whole keyspace.
**Failure it prevents:** a re-shard that remaps every key and turns a routine scale-out into a cache-miss storm.
**Go deeper:** [Consistent hashing](system-design-concepts.md#2-consistent-hashing) · [Distributed cache](system-design-distributed-cache.md).

<a id="replication"></a>
### Replication
Keeping copies of the same data on multiple nodes for durability, read capacity, or failover.
**Failure it prevents:** losing data when one disk, host, or availability zone dies.
**Go deeper:** [Replication topologies](system-design-concepts.md#15-replication-topologies).

<a id="quorum"></a>
### Quorum
The minimum number of replicas that must acknowledge an operation before it counts as successful — `R` for reads, `W` for writes, out of `N` copies.
**Failure it prevents:** accepting a write on a minority that later disappears, or reading a value that no majority ever agreed on.
**Go deeper:** [Quorum reads & writes](system-design-concepts.md#28-quorum-reads--writes).

<a id="leader-election"></a>
### Leader election
Choosing one node to make decisions or accept writes, with a rule for replacing it when it stops responding.
**Failure it prevents:** two nodes both believing they are in charge and issuing conflicting writes.
**Go deeper:** [Leader election](system-design-concepts.md#14-leader-election) · [Distributed lock manager](system-design-distributed-lock-manager.md).

<a id="consensus"></a>
### Consensus
A protocol (Raft, Paxos) that gets a group of nodes to agree on one ordered log of decisions despite crashes and network delays.
**Failure it prevents:** replicas diverging after a failure, with no safe way to decide which history is real.
**Go deeper:** [Consensus algorithms](system-design-concepts.md#23-consensus-algorithms-raft--paxos).

<a id="cap-theorem"></a>
### CAP theorem
During a network partition you must choose consistency or availability; you cannot have both. "Partition tolerance" is not optional in a real network.
**Failure it prevents:** claiming a system is simultaneously strongly consistent and always available while its network is split.
**Go deeper:** [CAP theorem](system-design-concepts.md#3-cap-theorem).

<a id="pacelc"></a>
### PACELC
Extends CAP: if there is a Partition, choose Availability or Consistency; Else (normal operation), choose Latency or Consistency.
**Failure it prevents:** ignoring the latency cost of synchronous replication on the happy path.
**Go deeper:** [PACELC](system-design-concepts.md#30-pacelc-theorem).

<a id="eventual-consistency"></a>
### Eventual consistency
Replicas may disagree for a while, but if writes stop, they converge to the same value.
**Failure it prevents:** paying cross-region consensus latency for data that does not need it (likes, view counts, timelines).
**Go deeper:** [Consistency models](system-design-concepts.md#29-consistency-models).

<a id="strong-consistency"></a>
### Strong consistency
Every read sees the latest completed write, as if there were one copy of the data.
**Failure it prevents:** a user reading their own write and seeing the old value — the classic "I saved it and it disappeared" bug.
**Go deeper:** [Consistency models](system-design-concepts.md#29-consistency-models).

<a id="linearizability"></a>
### Linearizability
The strongest single-object consistency: operations appear to happen in one global order, and a completed write is visible to every later read.
**Failure it prevents:** confusing "a quorum answered" with "the value is now the truth" — quorum intersection alone does not provide linearizability.
**Go deeper:** [Quorum reads & writes](system-design-concepts.md#28-quorum-reads--writes).

<a id="vector-clock"></a>
### Vector clock
A per-replica logical counter attached to a value so the system can tell whether two versions are ordered or genuinely concurrent.
**Failure it prevents:** silently overwriting one of two conflicting writes instead of detecting the conflict.
**Go deeper:** [Vector clocks](system-design-concepts.md#19-vector-clocks--conflict-resolution) · [Key-value store](system-design-key-value-store.md).

<a id="crdt"></a>
### CRDT
A data type whose merge operation is commutative and associative, so replicas that see updates in any order still converge.
**Failure it prevents:** concurrent edits diverging permanently — the reason collaborative apps and offline-first sync use CRDTs.
**Go deeper:** [CRDTs](system-design-concepts.md#25-crdts--conflict-free-replicated-data-types) · [Google Docs](system-design-google-docs.md).

<a id="merkle-tree"></a>
### Merkle tree
A hash tree over data blocks; comparing roots and branches finds which blocks differ without comparing every byte.
**Failure it prevents:** anti-entropy scans that ship the entire dataset to discover a handful of mismatched keys.
**Go deeper:** [Merkle trees](system-design-concepts.md#22-merkle-trees-anti-entropy).

<a id="gossip"></a>
### Gossip protocol
Nodes periodically exchange what they know with a few random peers, so membership and state spread without a central coordinator.
**Failure it prevents:** a single registry that becomes a bottleneck or a single point of failure for cluster membership.
**Go deeper:** [Gossip protocol](system-design-concepts.md#18-gossip-protocol).

<a id="split-brain"></a>
### Split brain
Two halves of a cluster each believe they are the active leader and accept writes, usually after a partition.
**Failure it prevents:** duplicated side effects — double charges, double bookings — after a failover.
**Go deeper:** [Leader election](system-design-concepts.md#14-leader-election) · [Distributed locking](system-design-concepts.md#34-distributed-locking--fencing).

<a id="lease"></a>
### Lease
A time-bounded grant of authority. The holder may act until the lease expires; after that, it must stop.
**Failure it prevents:** a paused process waking up and continuing to act as leader long after it lost the role.
**Go deeper:** [Distributed locking & fencing](system-design-concepts.md#34-distributed-locking--fencing).

<a id="fencing-token"></a>
### Fencing token
A monotonically increasing number issued with a lock grant; every write carries it, and the storage rejects tokens older than the latest seen.
**Failure it prevents:** a stale lock holder writing after a new holder has taken over — the failure a lease alone cannot stop.
**Go deeper:** [Distributed locking & fencing](system-design-concepts.md#34-distributed-locking--fencing).

<a id="heartbeat"></a>
### Heartbeat
A periodic "still alive" signal used to detect crashed or partitioned nodes.
**Failure it prevents:** routing traffic to a dead server forever because nothing noticed it stopped.
**Go deeper:** [Gossip protocol](system-design-concepts.md#18-gossip-protocol).

<a id="read-repair"></a>
### Read repair
When a read finds replicas disagreeing, the reader writes the newest value back to the stale replicas.
**Failure it prevents:** a stale replica serving old data indefinitely because anti-entropy has not run yet.
**Go deeper:** [Quorum reads & writes](system-design-concepts.md#28-quorum-reads--writes).

<a id="hinted-handoff"></a>
### Hinted handoff
When a replica is down, another node stores a hint and replays the write when the replica returns.
**Failure it prevents:** losing writes during a brief node outage just because the intended replica was unavailable.
**Go deeper:** [Key-value store](system-design-key-value-store.md).

<a id="anti-entropy"></a>
### Anti-entropy
A background process that compares replicas and repairs differences, often using Merkle trees.
**Failure it prevents:** slow drift between replicas that no read ever touches.
**Go deeper:** [Merkle trees](system-design-concepts.md#22-merkle-trees-anti-entropy).

---

<a id="storage"></a>
## Storage & databases

<a id="wal"></a>
### Write-ahead log (WAL)
Append every change to a durable log before applying it to the main data structure; replay the log after a crash.
**Failure it prevents:** a crash in the middle of an update leaving the database half-written and unrecoverable.
**Go deeper:** [WAL & durability](system-design-concepts.md#31-write-ahead-log-wal--durability).

<a id="lsm-tree"></a>
### LSM tree
Buffer writes in memory, flush sorted files to disk, and merge them in the background. Optimised for write throughput.
**Failure it prevents:** random disk writes becoming the bottleneck in an ingest-heavy workload.
**Go deeper:** [B-trees vs LSM trees](system-design-concepts.md#32-storage-engines-b-trees-vs-lsm-trees).

<a id="b-tree"></a>
### B-tree
A balanced, page-oriented index that keeps data sorted on disk and supports efficient point and range reads.
**Failure it prevents:** full-table scans for every lookup; the default index structure in relational databases.
**Go deeper:** [B-trees vs LSM trees](system-design-concepts.md#32-storage-engines-b-trees-vs-lsm-trees).

<a id="secondary-index"></a>
### Secondary index
An index built on a non-primary column, maintained separately from the table and often from the shard key.
**Failure it prevents:** scanning every row to answer "find by email". The cost: it must be updated on every write and may span shards.
**Go deeper:** [Indexing fundamentals](system-design-concepts.md#50-indexing-fundamentals--selection-strategy).

<a id="leftmost-prefix"></a>
### Leftmost prefix
A composite index can serve a query only if the query filters on a leading prefix of the index columns.
**Failure it prevents:** adding `(a, b)` and wondering why `WHERE b = ?` still scans — the index is ordered by `a` first.
**Go deeper:** [Indexing fundamentals](system-design-concepts.md#50-indexing-fundamentals--selection-strategy).

<a id="materialized-view"></a>
### Materialized view
A stored query result, refreshed on a schedule or on change, traded for freshness in exchange for read speed.
**Failure it prevents:** recomputing an expensive join or aggregate on every page load.
**Go deeper:** [PostgreSQL views & materialized views](postgresql-features.md#14-views--materialized-views-postgres-as-a-cache).

<a id="cdc"></a>
### Change data capture (CDC)
Reading a database's write log and publishing each committed change as an event stream.
**Failure it prevents:** dual writes where the database succeeds and the event publish fails, leaving downstream systems permanently inconsistent.
**Go deeper:** [Logical replication & CDC](postgresql-features.md#17-logical-replication--change-data-capture-cdc) · [Kafka Connect](kafka-features.md).

<a id="compaction"></a>
### Compaction
Merging small sorted files and discarding obsolete versions in an LSM store.
**Failure it prevents:** read amplification and disk exhaustion as thousands of tiny files accumulate.
**Go deeper:** [B-trees vs LSM trees](system-design-concepts.md#32-storage-engines-b-trees-vs-lsm-trees).

<a id="mvcc"></a>
### MVCC
Multi-version concurrency control: readers see a consistent snapshot while writers create new versions, so reads do not block writes.
**Failure it prevents:** long reports blocking every checkout transaction behind a table lock.
**Go deeper:** [PostgreSQL MVCC & isolation](postgresql-features.md#12-transactions-mvcc--isolation-levels).

<a id="optimistic-locking"></a>
### Optimistic locking
Read a version number, then update only if the version is unchanged; retry on conflict.
**Failure it prevents:** lost updates without holding a database lock for the whole user think-time.
**Go deeper:** [Optimistic concurrency](system-design-concepts.md#44-optimistic-concurrency--versioning).

<a id="pessimistic-locking"></a>
### Pessimistic locking
Take a lock before reading or writing, so no one else can change the row until you release it.
**Failure it prevents:** high-contention races (seat booking, inventory) at the cost of blocking and deadlock risk.
**Go deeper:** [Locking](postgresql-features.md#13-locking-rows-tables-advisory) · [Ticketing](system-design-ticketing-system.md).

<a id="sql-vs-nosql"></a>
### SQL vs NoSQL
Choosing a relational model (rows, joins, multi-row transactions) versus a document, key-value, wide-column, graph, search, time-series, or vector model based on the access pattern and the invariants.
**Failure it prevents:** picking a store for the logo, then discovering the hot query needs a join or transaction the store cannot provide.
**Go deeper:** [Data models vs access patterns](system-design-concepts.md#49-data-models-vs-access-patterns).

<a id="schema-evolution"></a>
### Schema evolution
Changing a stored or event schema without breaking existing readers and writers: add optional fields, never reuse tags, use expand/contract migrations.
**Failure it prevents:** a deploy that removes a field while an old consumer is still reading it.
**Go deeper:** [API contracts](system-design-concepts.md#55-api-styles--rest-vs-grpc-vs-graphql) · [Kafka Schema Registry](kafka-features.md).

<a id="denormalization"></a>
### Denormalization
Duplicating data to avoid joins, accepting the cost of keeping copies in sync.
**Failure it prevents:** read latency and fan-out joins in a sharded system; the trade-off is write complexity and drift.
**Go deeper:** [Data models vs access patterns](system-design-concepts.md#49-data-models-vs-access-patterns).

<a id="oltp"></a>
### OLTP
Online transaction processing: many small, low-latency reads and writes against the current state.
**Failure it prevents:** running analytics scans on the same database that serves checkout.
**Go deeper:** [PostgreSQL](postgresql-features.md) · [Payment system](system-design-payment-system.md).

<a id="olap"></a>
### OLAP
Online analytical processing: large scans and aggregations over history, usually column-oriented.
**Failure it prevents:** analytic queries starving transactional traffic; the fix is a separate warehouse or columnar store.
**Go deeper:** [Observability pipeline](system-design-observability-pipeline.md) · [Cloud analytics](cloud.md#8-analytics-warehouses--data-lakes).

<a id="columnar-storage"></a>
### Columnar storage
Storing each column contiguously so a scan reads only the columns it needs and compresses similar values well.
**Failure it prevents:** row-store scans that read every field to compute one sum over billions of rows.
**Go deeper:** [Observability pipeline](system-design-observability-pipeline.md).

<a id="object-storage"></a>
### Object storage
A flat store of immutable blobs addressed by key (S3, GCS, Azure Blob), with metadata and HTTP access.
**Failure it prevents:** storing large files on application servers or in a relational row, which does not scale or replicate well.
**Go deeper:** [File storage](system-design-file-storage.md) · [Cloud object storage](cloud.md#1-object-storage--archive-tiers-s3--gcs--blob).

<a id="erasure-coding"></a>
### Erasure coding
Splitting data into `k` fragments plus `m` parity fragments so any `k` can reconstruct it, cheaper than full replication.
**Failure it prevents:** paying 3× storage for durability, at the cost of repair traffic and CPU on read.
**Go deeper:** [File storage](system-design-file-storage.md).

<a id="bloom-filter"></a>
### Bloom filter
A compact probabilistic set: it can say "definitely not present" or "possibly present", never "definitely present".
**Failure it prevents:** a disk or database lookup for keys that certainly do not exist; it trades a small false-positive rate for memory.
**Go deeper:** [Bloom filter](system-design-concepts.md#17-bloom-filter).

<a id="count-min-sketch"></a>
### Count-min sketch
A fixed-memory frequency estimator that over-counts but never under-counts, useful for heavy hitters.
**Failure it prevents:** keeping an exact hash map of every key when you only need approximate frequencies.
**Go deeper:** [Count-min sketch](system-design-concepts.md#68-count-min-sketch).

<a id="hyperloglog"></a>
### HyperLogLog
A fixed-memory cardinality estimator (about 1.5 KB for billions of distinct values, ~2% error).
**Failure it prevents:** storing every unique visitor ID to answer "how many distinct users?".
**Go deeper:** [HyperLogLog](system-design-concepts.md#69-hyperloglog-cardinality-estimation).

---

<a id="caching"></a>
## Caching

<a id="cache-aside"></a>
### Cache-aside
Read the cache first; on a miss, read the database, populate the cache, and return the value.
**Failure it prevents:** every read hitting the database; the trade-off is a stale window and a cold-start stampede.
**Go deeper:** [Caching strategies](system-design-concepts.md#16-caching-strategies).

<a id="write-through"></a>
### Write-through
Write to the cache and the database together, so the cache is never behind an acknowledged write.
**Failure it prevents:** reading stale data right after a write; the cost is higher write latency.
**Go deeper:** [Caching strategies](system-design-concepts.md#16-caching-strategies).

<a id="write-behind"></a>
### Write-behind
Acknowledge the write after the cache accepts it, then flush to the database asynchronously.
**Failure it prevents:** write latency dominated by the database; the risk is losing acknowledged writes if the cache dies before flushing.
**Go deeper:** [Caching strategies](system-design-concepts.md#16-caching-strategies).

<a id="ttl"></a>
### TTL
Time to live: the period after which a cached value expires and must be fetched again.
**Failure it prevents:** stale data living forever; the trade-off is more misses and a refresh cost.
**Go deeper:** [Caching strategies](system-design-concepts.md#16-caching-strategies).

<a id="eviction"></a>
### Eviction
Removing items from a full cache according to a policy (LRU, LFU, random, TTL).
**Failure it prevents:** the cache growing until the process is OOM-killed; the policy decides which misses you pay for.
**Go deeper:** [Distributed cache](system-design-distributed-cache.md).

<a id="lru"></a>
### LRU
Least recently used: evict the item that has gone longest without access.
**Failure it prevents:** keeping cold data while hot data is evicted; weak against a one-off scan that touches everything.
**Go deeper:** [LRU cache](system-design-concepts.md#65-lru-cache).

<a id="cache-stampede"></a>
### Cache stampede
Many requests miss the same key at once and all rush the database to rebuild it.
**Failure it prevents:** a single hot-key expiry taking down the origin; the fix is single-flight, early refresh, or jittered TTLs.
**Go deeper:** [Hot keys & thundering herd](system-design-concepts.md#43-hot-keys--thundering-herd).

<a id="hot-key"></a>
### Hot key
One key that receives a disproportionate share of traffic, overloading the single node that owns it.
**Failure it prevents:** a sharded cache that is perfectly balanced on paper but has one melted shard in practice; the fix is key splitting, local caching, or replication.
**Go deeper:** [Hot keys & thundering herd](system-design-concepts.md#43-hot-keys--thundering-herd).

<a id="thundering-herd"></a>
### Thundering herd
A large group of clients retrying or reconnecting simultaneously, amplifying the load that caused the failure.
**Failure it prevents:** a recovering service being knocked over again by its own clients; the fix is jitter and backoff.
**Go deeper:** [Retries, backoff & jitter](system-design-concepts.md#39-retries-backoff--jitter).

---

<a id="messaging"></a>
## Messaging & streaming

<a id="queue-vs-log"></a>
### Queue vs log
A queue deletes a message after acknowledgement and distributes work; a log retains ordered partitions so consumers can replay facts.
**Failure it prevents:** using a queue as event history, or a log as a per-task work queue.
**Go deeper:** [Event-driven architecture](system-design-concepts.md#26-event-driven-architecture).

<a id="delivery-semantics"></a>
### Delivery semantics
At-most-once can lose a message; at-least-once can duplicate it; exactly-once is a property of the whole pipeline, and external side effects still need idempotency.
**Failure it prevents:** assuming the broker makes a charge or email happen exactly once.
**Go deeper:** [Event-driven architecture](system-design-concepts.md#26-event-driven-architecture) · [Idempotency](system-design-concepts.md#10-idempotency).

<a id="fan-out"></a>
### Fan-out
Delivering one event to many consumers or timelines. Fan-out on write does the work at publish time; fan-out on read does it at fetch time.
**Failure it prevents:** a celebrity post requiring millions of timeline writes; the hybrid is to push for most users and pull for the giant accounts.
**Go deeper:** [Fan-out & push vs pull](system-design-concepts.md#42-fan-out--push-vs-pull) · [Twitter](system-design-twitter.md).

<a id="backpressure"></a>
### Backpressure
Telling producers to slow down when consumers cannot keep up, instead of buffering until memory runs out.
**Failure it prevents:** an unbounded queue that grows until the broker or process dies, taking the whole pipeline with it.
**Go deeper:** [Backpressure](system-design-concepts.md#21-backpressure).

<a id="dead-letter-queue"></a>
### Dead-letter queue (DLQ)
A separate queue for messages that repeatedly fail processing, so they can be inspected and replayed without blocking the main stream.
**Failure it prevents:** one poison message retrying forever and stalling every consumer behind it.
**Go deeper:** [Dead letter queue](system-design-concepts.md#20-dead-letter-queue).

<a id="outbox"></a>
### Outbox pattern
Write the business row and an event row in the same local transaction; a separate relay publishes the event.
**Failure it prevents:** the dual-write problem — the database commits but the event publish fails, or vice versa.
**Go deeper:** [Outbox pattern](system-design-concepts.md#9-outbox-pattern).

<a id="saga"></a>
### Saga
A long-running transaction split into local steps, each with a compensating action if a later step fails.
**Failure it prevents:** holding a distributed lock across services for seconds; the cost is that intermediate states are visible and compensations must be idempotent.
**Go deeper:** [Saga pattern](system-design-concepts.md#8-saga-pattern).

<a id="two-phase-commit"></a>
### Two-phase commit (2PC)
A coordinator asks all participants to prepare, then tells them all to commit; if any prepare fails, everyone rolls back.
**Failure it prevents:** partial commits across databases; the cost is blocking and coordinator fragility.
**Go deeper:** [2PC vs Saga](system-design-concepts.md#24-two-phase-commit-2pc-vs-saga).

<a id="idempotency"></a>
### Idempotency
Performing the same operation twice has the same effect as performing it once.
**Failure it prevents:** a retried payment charging the customer twice; the fix is a client-supplied key plus a stored result.
**Go deeper:** [Idempotency](system-design-concepts.md#10-idempotency) · [Payment system](system-design-payment-system.md).

<a id="consumer-group"></a>
### Consumer group
A set of consumers that share the partitions of a topic, with each partition assigned to exactly one consumer in the group.
**Failure it prevents:** two consumers processing the same partition and duplicating side effects; it is also how you scale consumption horizontally.
**Go deeper:** [Kafka consumer groups](kafka-features.md).

<a id="offset"></a>
### Offset
A consumer's position in a partition log — the sequence number of the next record to read.
**Failure it prevents:** losing track of what was processed; committing an offset too early loses messages, too late replays them.
**Go deeper:** [Kafka offsets](kafka-features.md).

<a id="isr"></a>
### ISR
In-sync replicas: the followers that are caught up enough with the leader to be eligible for failover.
**Failure it prevents:** electing a lagging replica as leader and silently losing acknowledged writes.
**Go deeper:** [Kafka replication](kafka-features.md).

<a id="exactly-once"></a>
### Exactly-once
The end-to-end guarantee that each event affects the output exactly once, despite retries and failures. It is a property of the whole pipeline, not a switch.
**Failure it prevents:** duplicate charges or double-counted metrics after a consumer restart; usually implemented as at-least-once delivery plus idempotent writes.
**Go deeper:** [Kafka exactly-once](kafka-features.md) · [Data pipeline](system-design-data-pipeline.md).

<a id="at-least-once"></a>
### At-least-once
Every event is delivered, but duplicates are possible. The default for most queues.
**Failure it prevents:** silent message loss; the cost is that every consumer must deduplicate.
**Go deeper:** [Kafka delivery semantics](kafka-features.md).

<a id="watermark"></a>
### Watermark
A moving boundary in event-time processing: the system assumes no events older than the watermark will arrive, so it can close a window.
**Failure it prevents:** waiting forever for late data, or emitting a window result before the data that belongs in it has arrived.
**Go deeper:** [Data pipeline](system-design-data-pipeline.md) · [Stream processing](kafka-features.md).

<a id="windowing"></a>
### Windowing
Grouping an unbounded stream into finite buckets (tumbling, sliding, session) so it can be aggregated.
**Failure it prevents:** an aggregation that never completes because the stream never ends.
**Go deeper:** [Data pipeline](system-design-data-pipeline.md).

<a id="webhook"></a>
### Webhook
A reverse API call: your service POSTs an event to a URL the customer registered, instead of the customer polling you.
**Failure it prevents:** polling every endpoint every minute and still being late; the cost is retries, signing, and endpoint failure handling.
**Go deeper:** [Webhook delivery](system-design-webhook-delivery.md).

<a id="event-sourcing"></a>
### Event sourcing
Storing the sequence of state changes as the source of truth, then deriving current state by replaying them.
**Failure it prevents:** losing the "how we got here" history that audits and debugging need; the cost is replay time and schema evolution.
**Go deeper:** [Event sourcing](system-design-concepts.md#7-event-sourcing).

<a id="cqrs"></a>
### CQRS
Separating the write model from one or more read models, each optimised for its own access pattern.
**Failure it prevents:** one schema trying to serve both transactional writes and heavy read queries; the cost is eventual consistency between models.
**Go deeper:** [CQRS](system-design-concepts.md#6-cqrs-command-query-responsibility-segregation).

---

<a id="delivery"></a>
<a id="algorithms-search"></a>
## Algorithms & search

<a id="inverted-index"></a>
### Inverted index
A map from each normalized token to the documents (and positions) that contain it, used for full-text search and ranking.
**Failure it prevents:** scanning every document for every query term.
**Go deeper:** [Indexing](system-design-concepts.md#50-indexing-fundamentals--selection-strategy).

<a id="bm25"></a>
### BM25
A lexical ranking function that combines saturating term frequency, inverse document frequency, and document-length normalization.
**Failure it prevents:** long or repetitive documents winning by raw term count.
**Go deeper:** [BM25](system-design-concepts.md#extended-bm25).

<a id="lfu"></a>
### LFU
Least-frequently-used eviction: remove the key with the lowest access count, with an LRU tie-break.
**Failure it prevents:** a scan evicting a small hot set that LRU would keep.
**Go deeper:** [LFU cache](system-design-concepts.md#extended-lfu-cache).

<a id="leaky-bucket"></a>
### Leaky bucket
A fixed-capacity bucket that drains at a constant rate, smoothing output instead of allowing token-bucket bursts.
**Failure it prevents:** a bursty client overwhelming a downstream that needs a steady request rate.
**Go deeper:** [Leaky bucket](system-design-concepts.md#extended-leaky-bucket).

<a id="cuckoo-filter"></a>
### Cuckoo filter
A compact approximate-membership index storing fingerprints in two candidate buckets, supporting deletion and relocation.
**Failure it prevents:** a Bloom filter's inability to delete safely as the set churns.
**Go deeper:** [Cuckoo filter](system-design-concepts.md#extended-cuckoo-filter).

<a id="skip-list"></a>
### Skip list
A layered linked list with random express lanes, giving expected O(log n) search and easy range scans.
**Failure it prevents:** the implementation complexity of a balanced tree when an ordered map is needed.
**Go deeper:** [Skip list](system-design-concepts.md#extended-skip-list).

<a id="minhash"></a>
### MinHash
A compact signature built from the minimum hash of a set under many hash functions; signature agreement estimates Jaccard similarity.
**Failure it prevents:** comparing every element of two huge sets to find near-duplicates.
**Go deeper:** [MinHash](system-design-concepts.md#extended-minhash).

<a id="pagerank"></a>
### PageRank
Iterative graph importance: each node distributes its rank across outlinks, with a damping factor for random jumps.
**Failure it prevents:** treating every incoming link as equally authoritative.
**Go deeper:** [PageRank](system-design-concepts.md#extended-pagerank).

<a id="top-k-heap"></a>
### Top-K heap
A min-heap of size K that keeps the largest K values seen so far; each new value replaces the root only if it is larger.
**Failure it prevents:** sorting or storing an unbounded stream to answer "top 10" on every request.
**Go deeper:** [Top-K heap](system-design-concepts.md#extended-top-k-heap).

<a id="quickselect"></a>
### Quickselect
A partition-based selection algorithm that finds the k-th value in average O(n) without fully sorting.
**Failure it prevents:** paying O(n log n) for a median or percentile when only one order statistic is needed.
**Go deeper:** [Quickselect](system-design-concepts.md#extended-quickselect).

<a id="aho-corasick"></a>
### Aho-Corasick
A trie with failure links that matches thousands of patterns in one pass over the text, reporting all hits.
**Failure it prevents:** running one regex or substring search per keyword, which becomes patterns × text.
**Go deeper:** [Aho-Corasick](system-design-concepts.md#extended-aho-corasick).

<a id="bellman-ford"></a>
### Bellman-Ford
Relax every edge V−1 times to find shortest paths even with negative weights; a further relaxation proves a negative cycle.
**Failure it prevents:** Dijkstra returning wrong distances when edge weights can be negative.
**Go deeper:** [Bellman-Ford](system-design-concepts.md#extended-bellman-ford).

## Delivery & operations

<a id="cdn"></a>
### CDN
A geographically distributed cache that serves content from an edge near the user and shields the origin.
**Failure it prevents:** every video segment or static asset travelling from one region, and the origin melting under global traffic.
**Go deeper:** [CDN & edge caching](system-design-concepts.md#37-cdn--edge-caching).

<a id="load-balancer"></a>
### Load balancer
A component that spreads requests across healthy backends and removes failed ones from rotation.
**Failure it prevents:** one server taking all the traffic while others idle, and users hitting a dead instance.
**Go deeper:** [Load balancing](system-design-concepts.md#13-load-balancing) · [Networking](networking.md#7-load-balancing--l4-vs-l7).

<a id="reverse-proxy"></a>
### Reverse proxy
A server that sits in front of backends, terminating TLS, routing by path, caching, and hiding internal topology.
**Failure it prevents:** exposing every backend directly and repeating TLS and compression logic in each service.
**Go deeper:** [Proxies](networking.md#10-proxies--forward-reverse--api-gateways).

<a id="api-gateway"></a>
### API gateway
The single entry point for external API traffic: authentication, rate limits, routing, and protocol translation.
**Failure it prevents:** every client needing to know every service, and every service reimplementing auth and quotas.
**Go deeper:** [API gateway vs service mesh](system-design-concepts.md#36-api-gateway-vs-service-mesh).

<a id="circuit-breaker"></a>
### Circuit breaker
Stop calling a failing dependency after a threshold, fail fast for a cooldown, then probe cautiously before closing again.
**Failure it prevents:** a slow dependency consuming every thread and turning a partial outage into a total one.
**Go deeper:** [Circuit breaker](system-design-concepts.md#11-circuit-breaker).

<a id="rate-limiting"></a>
### Rate limiting
Capping how many requests a caller may make in a window, by user, key, IP, or tenant.
**Failure it prevents:** one noisy client starving everyone else, and abuse that looks like legitimate traffic.
**Go deeper:** [Rate limiting](system-design-concepts.md#12-rate-limiting) · [Rate limiter](system-design-rate-limiter.md).

<a id="token-bucket"></a>
### Token bucket
A bucket refills at a steady rate; each request takes a token, and an empty bucket rejects or queues. Allows short bursts up to the bucket size.
**Failure it prevents:** rejecting legitimate bursts while still enforcing a long-run average.
**Go deeper:** [Rate limiter](system-design-rate-limiter.md).

<a id="sliding-window"></a>
### Sliding window
Counting requests over the last `N` seconds by combining the current and previous fixed buckets, instead of resetting at a boundary.
**Failure it prevents:** a caller sending 2× the limit around a fixed-window boundary.
**Go deeper:** [Rate limiter](system-design-rate-limiter.md).

<a id="service-discovery"></a>
### Service discovery
A registry that tells a caller which instances of a service are currently alive and where to reach them.
**Failure it prevents:** hard-coded IPs and a config deploy every time an instance moves.
**Go deeper:** [Service discovery](system-design-concepts.md#35-service-discovery--registry).

<a id="slo"></a>
### SLO
A service-level objective: a target for a measured user-facing signal, such as "99.9% of requests under 300 ms over 30 days".
**Failure it prevents:** arguing about reliability with no shared definition of "good enough".
**Go deeper:** [SLIs, SLOs & error budgets](system-design-concepts.md#45-slis-slos--error-budgets).

<a id="error-budget"></a>
### Error budget
The allowed amount of unreliability implied by an SLO (0.1% of 30 days ≈ 43 minutes); spend it on releases and experiments.
**Failure it prevents:** either freezing all change after one incident or shipping recklessly with no reliability accounting.
**Go deeper:** [SLIs, SLOs & error budgets](system-design-concepts.md#45-slis-slos--error-budgets).

<a id="canary"></a>
### Canary release
Send a small slice of traffic to the new version, watch health and business metrics, then widen or roll back.
**Failure it prevents:** a bad build reaching the whole fleet at once.
**Go deeper:** [Deployment strategies](system-design-concepts.md#47-deployment-strategies) · [Code deployment](system-design-code-deployment.md).

<a id="blue-green"></a>
### Blue-green deployment
Run two identical environments; switch traffic from the old (blue) to the new (green), and switch back if health fails.
**Failure it prevents:** an in-place upgrade with no instant rollback path; the cost is double capacity during the switch.
**Go deeper:** [Deployment strategies](system-design-concepts.md#47-deployment-strategies).

<a id="feature-flag"></a>
### Feature flag
A runtime switch that enables code paths per user, tenant, or percentage without redeploying.
**Failure it prevents:** coupling every release to a deploy; the cost is flag debt and evaluation consistency across services.
**Go deeper:** [Deployment strategies](system-design-concepts.md#47-deployment-strategies).

<a id="chaos-engineering"></a>
### Chaos engineering
Deliberately injecting failures (killing a node, adding latency) in a controlled experiment to verify recovery.
**Failure it prevents:** discovering on the biggest day of the year that the failover path was never exercised.
**Go deeper:** [Observability pipeline](system-design-observability-pipeline.md).

<a id="cardinality"></a>
### Cardinality
The number of distinct label combinations in a metric series; high cardinality explodes storage and query cost.
**Failure it prevents:** a `user_id` label turning a metrics bill into a database bill.
**Go deeper:** [Observability pipeline](system-design-observability-pipeline.md).

<a id="sampling"></a>
### Sampling
Keeping only a fraction of events (head or tail) to control cost while preserving the signals that matter.
**Failure it prevents:** storing every trace and log at full fidelity; tail sampling keeps all errors even when volume is high.
**Go deeper:** [Observability pipeline](system-design-observability-pipeline.md).

<a id="geohash"></a>
### Geohash
Encoding latitude/longitude into a short string whose shared prefix means spatial proximity, so a normal index can answer nearby queries.
**Failure it prevents:** scanning every location row to find "within 5 km"; the edge cases are cells that touch but do not share a prefix.
**Go deeper:** [Geospatial indexing](system-design-concepts.md#48-geospatial-indexing-geohash--s2) · [Proximity service](system-design-proximity-service.md).

---

<a id="security"></a>
<a id="multi-tenancy"></a>
### Multi-tenancy
Sharing infrastructure across customers using one of three isolation models: silo (separate stack), pool (shared rows with tenant ID), or bridge (shared database, per-tenant schema/partition).
**Failure it prevents:** a missing tenant filter leaking one customer's data to another; pooled tenants also need quotas to stop noisy neighbours.
**Go deeper:** [Monolith vs microservices](system-design-concepts.md#51-monolith-vs-microservices--service-decomposition).

<a id="pagination"></a>
### Pagination
Returning a bounded page of results using an opaque cursor (stable under inserts) or an offset (simple but drifts and slows deep in the result set).
**Failure it prevents:** missing or duplicated rows when a user pages while data is being written.
**Go deeper:** [API contracts](system-design-concepts.md#55-api-styles--rest-vs-grpc-vs-graphql).

<a id="bulkhead"></a>
### Bulkhead
Partitioning threads, connections, or in-flight requests per dependency or tenant so one slow caller cannot exhaust the whole service.
**Failure it prevents:** a single degraded downstream turning every endpoint into a timeout.
**Go deeper:** [Load shedding](system-design-concepts.md#27-load-shedding--graceful-degradation).

<a id="littles-law"></a>
### Little's law
`L = λW`: the average number of items in a stable system equals arrival rate times average time in the system; use it to size concurrency and queues.
**Failure it prevents:** provisioning far fewer in-flight requests than the throughput and latency require, then blaming the database.
**Go deeper:** [Estimation](system-design-concepts.md#52-back-of-the-envelope-estimation).

## Security & identity

<a id="tls"></a>
### TLS
Encrypting a connection and authenticating the server with a certificate.
**Failure it prevents:** credentials and tokens travelling in clear text across the network.
**Go deeper:** [TLS & mTLS](networking.md#5-tls--mtls).

<a id="mtls"></a>
### mTLS
Mutual TLS: both client and server present certificates, so each side proves its identity.
**Failure it prevents:** any pod in the cluster calling a service just because it is inside the network.
**Go deeper:** [TLS & mTLS](networking.md#5-tls--mtls).

<a id="oauth"></a>
### OAuth 2.0
A delegation protocol: a client gets a scoped access token to act on a resource owner's behalf without seeing their password.
**Failure it prevents:** sharing passwords with third-party apps and giving them unlimited access.
**Go deeper:** [Security & auth](system-design-concepts.md#54-security--authnauthz-oauth2-jwt-mtls).

<a id="oidc"></a>
### OpenID Connect (OIDC)
An identity layer on top of OAuth 2.0 that adds an ID token and a standard user-info endpoint, so "who is this?" has a standard answer.
**Failure it prevents:** every app inventing its own login protocol and user-profile shape.
**Go deeper:** [Security & auth](system-design-concepts.md#54-security--authnauthz-oauth2-jwt-mtls).

<a id="saml"></a>
### SAML
An older XML-based SSO standard, still common in enterprise identity providers.
**Failure it prevents:** enterprise customers needing separate credentials for every internal app; the cost is XML complexity and clunky redirects.
**Go deeper:** [Security & auth](system-design-concepts.md#54-security--authnauthz-oauth2-jwt-mtls).

<a id="jwt"></a>
### JWT
A signed, base64url-encoded claims token (`header.payload.signature`). It is signed, not encrypted; anyone can read the payload.
**Failure it prevents:** a database lookup on every request to validate a session; the cost is revocation — a short expiry plus refresh is the usual answer.
**Go deeper:** [Security & auth](system-design-concepts.md#54-security--authnauthz-oauth2-jwt-mtls).

<a id="sso"></a>
### Single sign-on (SSO)
One authentication event at a central identity provider grants access to many applications.
**Failure it prevents:** users juggling separate credentials per app and IT losing the ability to revoke access centrally.
**Go deeper:** [Security & auth](system-design-concepts.md#54-security--authnauthz-oauth2-jwt-mtls).

<a id="rbac"></a>
### RBAC
Role-based access control: permissions are attached to roles, and users are assigned roles.
**Failure it prevents:** per-user permission lists that become unmaintainable; the limit is roles that do not fit fine-grained rules.
**Go deeper:** [Security & auth](system-design-concepts.md#54-security--authnauthz-oauth2-jwt-mtls).

<a id="abac"></a>
### ABAC
Attribute-based access control: decisions use attributes of the user, resource, action, and context (department, time, sensitivity).
**Failure it prevents:** role explosion when access depends on more than a job title.
**Go deeper:** [Security & auth](system-design-concepts.md#54-security--authnauthz-oauth2-jwt-mtls).

<a id="zero-trust"></a>
### Zero trust
Assume the network is hostile: authenticate and authorise every request, even inside the perimeter.
**Failure it prevents:** one compromised pod having unrestricted access to every internal service.
**Go deeper:** [API gateway vs service mesh](system-design-concepts.md#36-api-gateway-vs-service-mesh).

<a id="hmac"></a>
### HMAC
A keyed hash that proves a message came from someone holding the shared secret and was not modified.
**Failure it prevents:** forged webhook payloads and replay attacks when combined with a timestamp window.
**Go deeper:** [Webhook delivery](system-design-webhook-delivery.md).

<a id="secret-rotation"></a>
### Secret rotation
Replacing credentials on a schedule and supporting two valid versions during the overlap.
**Failure it prevents:** a leaked key remaining valid forever; the hard part is rotating without breaking live consumers.
**Go deeper:** [Security & auth](system-design-concepts.md#54-security--authnauthz-oauth2-jwt-mtls).

---

<a id="data"></a>
## Data & analytics

<a id="etl"></a>
### ETL / ELT
Extract from sources, transform, and load into a warehouse or lake. ELT loads raw data first and transforms it with warehouse compute.
**Failure it prevents:** analytics queries competing with production transactions on the same database.
**Go deeper:** [Data pipeline](system-design-data-pipeline.md).

<a id="data-lake"></a>
### Data lake
A central store of raw files in object storage, with schema applied at read time.
**Failure it prevents:** throwing away raw data before you know which questions you will ask; the risk is a swamp with no catalog or schema discipline.
**Go deeper:** [Data pipeline](system-design-data-pipeline.md) · [Cloud analytics](cloud.md#8-analytics-warehouses--data-lakes).

<a id="lakehouse"></a>
### Lakehouse
A data lake with table-format guarantees (Iceberg, Delta, Hudi): ACID commits, time travel, and schema evolution over object storage.
**Failure it prevents:** choosing between a cheap but unreliable lake and an expensive, closed warehouse.
**Go deeper:** [Data pipeline](system-design-data-pipeline.md).

<a id="lambda-architecture"></a>
### Lambda architecture
Run a batch layer for correct historical results and a speed layer for low-latency approximations, then merge them.
**Failure it prevents:** choosing between freshness and correctness; the cost is maintaining two copies of the logic.
**Go deeper:** [Data pipeline](system-design-data-pipeline.md).

<a id="kappa-architecture"></a>
### Kappa architecture
Use a single streaming path for everything, replaying the log to reprocess history instead of maintaining a separate batch layer.
**Failure it prevents:** the dual-codebase problem of Lambda; the cost is long retention and a stream processor that can handle backfills.
**Go deeper:** [Data pipeline](system-design-data-pipeline.md).

<a id="backfill"></a>
### Backfill
Reprocessing historical data after a logic change or a bug, usually into a new table or partition.
**Failure it prevents:** fixing the code but leaving years of wrong data in place; the risk is overwhelming the production cluster.
**Go deeper:** [Data pipeline](system-design-data-pipeline.md).

<a id="data-contract"></a>
### Data contract
An explicit schema, semantics, and freshness guarantee agreed between a producer and its consumers.
**Failure it prevents:** a silent upstream rename breaking every dashboard and model downstream.
**Go deeper:** [Data pipeline](system-design-data-pipeline.md).

<a id="data-quality"></a>
### Data quality check
An assertion about the data itself — null rate, uniqueness, referential integrity, freshness, distribution — run as part of the pipeline.
**Failure it prevents:** a pipeline that succeeds technically while producing garbage that nobody notices for a week.
**Go deeper:** [Data pipeline](system-design-data-pipeline.md).

---

<a id="ai"></a>
## AI infrastructure

<a id="token"></a>
### Token
A sub-word unit of text (roughly ¾ of a word in English) that a language model reads and bills for.
**Failure it prevents:** estimating cost or context limits in characters and being wrong by a large factor.
**Go deeper:** [LLM inference](system-design-llm-inference.md) · [Agentic AI](agentic-ai-features.md).

<a id="embedding"></a>
### Embedding
A dense vector that represents an item's meaning, so similarity becomes distance in vector space.
**Failure it prevents:** keyword matching that misses paraphrases; the cost is an embedding model and a vector index.
**Go deeper:** [Recommendation system](system-design-recommendation-system.md) · [Agentic AI](agentic-ai-features.md).

<a id="vector-index"></a>
### Vector index
A data structure that finds the nearest vectors to a query without comparing against every vector.
**Failure it prevents:** a full scan over millions of embeddings per search.
**Go deeper:** [Recommendation system](system-design-recommendation-system.md).

<a id="hnsw"></a>
### HNSW
Hierarchical Navigable Small World: a layered graph index for approximate nearest-neighbour search, trading a little recall for large speed gains.
**Failure it prevents:** exact k-NN at a latency and memory cost that makes retrieval impractical.
**Go deeper:** [Recommendation system](system-design-recommendation-system.md) · [Search engine](system-design-search-engine.md).

<a id="kv-cache"></a>
### KV cache
Stored key/value attention tensors for the tokens already processed, so generating the next token does not recompute the whole prompt.
**Failure it prevents:** quadratic re-prefill on every decode step; the cost is GPU memory, which is why batching and paging matter.
**Go deeper:** [LLM inference](system-design-llm-inference.md).

<a id="batching"></a>
### Continuous batching
Adding and removing requests from a running GPU batch at every decode step instead of waiting for a fixed batch to finish.
**Failure it prevents:** GPUs idling behind the slowest request in a static batch.
**Go deeper:** [LLM inference](system-design-llm-inference.md).

<a id="quantization"></a>
### Quantization
Storing model weights in lower precision (FP8, INT8, INT4) to cut memory and increase throughput, at some quality cost.
**Failure it prevents:** a model that needs more GPU memory than the deployment can afford.
**Go deeper:** [LLM inference](system-design-llm-inference.md).

<a id="prompt-caching"></a>
### Prompt caching
Reusing the computed KV state for a shared prefix (system prompt, tools, retrieved context) across requests.
**Failure it prevents:** paying full prefill cost for the same long prefix on every call.
**Go deeper:** [LLM inference](system-design-llm-inference.md) · [AI gateway](system-design-ai-gateway.md).

---

## Related reading

- [Learning paths](LEARNING-PATHS.md) — the order to read these in
- [Core concepts](system-design-concepts.md) — the mechanisms behind the definitions
- [Interview Q&A](interview-qa.md) — the failure vocabulary in question form

---

<p align="right"><a href="#top">↑ Back to top</a></p>
