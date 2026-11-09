<a id="top"></a>

<div align="center">

<sub>START HERE</sub>

# Learning Paths — How to Read This Library

<sub>3 ROUTES · 58 DESIGNS · 16 GUIDES · 1 COVERAGE MAP</sub>

</div>

> [!TIP]
> **THE GUIDE** — The library has more material than any one person needs. This page tells you which eight documents to read first, which order to read the rest in, and what each design assumes you already know.

System design is not a list of products to memorise. It is a small set of constraints — latency, consistency, failure, cost — applied to a problem. The designs in this library are worked examples of that application. Read them for the reasoning, not the boxes.

**The one rule:** never read a design cold. Read the two concept sections it lists under "Before this doc" first. Ten minutes of vocabulary saves an hour of confusion.

---

## On this page

<details open>
<summary><b>8 sections</b></summary>

1. [The 60-second orientation](#orientation)
2. [Three routes through the library](#routes)
3. [The prerequisite chain](#prerequisites)
4. [Read these eight first](#first-eight)
5. [Difficulty tiers](#difficulty)
6. [Coverage map — every canonical topic](#coverage)
7. [What this library does not cover](#not-covered)
8. [How to read a design doc](#how-to-read)

</details>

---

<a id="orientation"></a>
## The 60-second orientation

Every design in this library answers the same six questions. If you can answer them for a system, you can hold a design conversation about it.

| Question | What a good answer sounds like |
| :--- | :--- |
| **1. What is the core action?** | "Shorten a URL", "deliver a message", "match an order", "score a transaction". Everything else supports it. |
| **2. What are the numbers?** | Users, requests/sec, read/write ratio, data size, growth. A design without numbers is a diagram. |
| **3. What must be correct?** | Money, inventory, identity: strong. Feeds, counts, recommendations: eventual is fine. |
| **4. Where does state live?** | The authoritative store, the caches, the derived indexes, and which one wins after a failure. |
| **5. What breaks first?** | The hot key, the celebrity fan-out, the database write, the third-party provider, the retry storm. |
| **6. What does it cost?** | The dominant line item: compute, storage, egress, or humans. |

The rest of a design doc is detail under those six answers. When a doc feels complicated, find the six answers first.

---

<a id="routes"></a>
## Three routes through the library

### Route A — Newcomer (4 weeks, ~2 hours/day)

For engineers who have not designed a large system before. Read the concepts before the designs; do not try to read all 58.

| Week | Focus | Read | Do |
| :--- | :--- | :--- | :--- |
| **1** | Primitives | [Concepts §1–§16](system-design-concepts.md#1-sharding-data-partitioning) (sharding → caching), [URL shortener](system-design-url-shortener.md), [Pastebin](system-design-pastebin.md), [Unique ID](system-design-unique-id-generator.md) | Estimate storage and QPS for the shortener on paper |
| **2** | State & messaging | [Concepts §17–§28](system-design-concepts.md#17-bloom-filter) (Bloom → quorum), [Distributed cache](system-design-distributed-cache.md), [Key-value store](system-design-key-value-store.md), [Messaging app](system-design-messaging-app.md) | Trace one message from sender to offline recipient |
| **3** | Delivery & scale | [Concepts §29–§47](system-design-concepts.md#29-consistency-models), [Twitter](system-design-twitter.md), [Netflix](system-design-netflix.md), [Payment system](system-design-payment-system.md), [Data pipeline](system-design-data-pipeline.md) | Compare fan-out on write vs read for three designs |
| **4** | Depth & practice | [Rate limiter](system-design-rate-limiter.md), [Uber](system-design-uber.md), [Google Docs](system-design-google-docs.md), [Observability pipeline](system-design-observability-pipeline.md) | Whiteboard two designs end-to-end, then compare |

### Route B — Interview in 10 days (~3 hours/day)

For engineers who know the basics and need coverage and articulation.

| Day | Read | Practice |
| :--- | :--- | :--- |
| **1** | [Concepts §1–§10](system-design-concepts.md#1-sharding-data-partitioning) (sharding, hashing, CAP, ACID, SOLID, CQRS, events, saga, outbox, idempotency) | Explain CAP and idempotency aloud in 2 minutes each |
| **2** | [URL shortener](system-design-url-shortener.md), [Rate limiter](system-design-rate-limiter.md), [Distributed cache](system-design-distributed-cache.md) | Derive the shortener's key numbers from memory |
| **3** | [Concepts §11–§22](system-design-concepts.md#11-circuit-breaker) (breaker → Merkle), [Key-value store](system-design-key-value-store.md), [Distributed lock](system-design-distributed-lock-manager.md) | Draw the quorum read/write path |
| **4** | [Messaging app](system-design-messaging-app.md), [Notification system](system-design-notification-system.md), [Webhook delivery](system-design-webhook-delivery.md) | Compare at-least-once vs exactly-once with examples |
| **5** | [Kafka guide](kafka-features.md), [Concepts §28–§32](system-design-concepts.md#28-quorum-reads--writes) | Explain consumer groups and ISR without notes |
| **6** | [Twitter](system-design-twitter.md), [Instagram](system-design-instagram.md), [LinkedIn](system-design-linkedin.md) | Defend hybrid fan-out for a celebrity case |
| **7** | [Payment system](system-design-payment-system.md), [E-commerce](system-design-ecommerce.md), [Ticketing](system-design-ticketing-system.md) | Trace a double-charge and a double-booking |
| **8** | [Uber](system-design-uber.md), [Food delivery](system-design-food-delivery.md), [Google Maps](system-design-google-maps.md) | Explain geohash neighbour queries |
| **9** | [Google Docs](system-design-google-docs.md), [YouTube](system-design-youtube.md), [Netflix](system-design-netflix.md) | Compare OT and CRDT; explain the transcoding ladder |
| **10** | [Data pipeline](system-design-data-pipeline.md), [Observability pipeline](system-design-observability-pipeline.md), [Interview Q&A](interview-qa.md) | Mock interview: one design, 45 minutes, no notes |

### Route C — Revision (1 day)

For engineers who have read the library before and need the shape back.

| Block | Read | Why |
| :--- | :--- | :--- |
| **2 h** | [Concepts §57 — concept → problem map](system-design-concepts.md#57-quick-map-concept--problem-solved) | Rebuild the index in your head |
| **2 h** | Five designs you are weakest on, using the [Start here](#how-to-read) card only | Refresh the one idea and the trap |
| **1 h** | [Interview Q&A failure glossary](interview-qa.md#part-iv--failure-terminology-one-glossary-for-every-technology) | Rehearse the failure vocabulary |
| **1 h** | This page's [coverage map](#coverage) | Find the topic you cannot explain, then read only that |

---

<a id="prerequisites"></a>
## The prerequisite chain

Read upward. A design assumes the layer below it.

```text
                    ┌──────────────────────────────┐
                    │  Designs (58 worked examples) │
                    └──────────────┬───────────────┘
                                   │ uses
                    ┌──────────────▼───────────────┐
                    │  Technology guides (16)       │
                    │  PostgreSQL · Redis · Kafka   │
                    │  MongoDB · Elasticsearch ·    │
                    │  RabbitMQ · cloud · DevOps    │
                    └──────────────┬───────────────┘
                                   │ assumes
                    ┌──────────────▼───────────────┐
                    │  Core concepts (75 sections)  │
                    │  sharding · CAP · caching ·   │
                    │  queues · consensus · SLOs    │
                    └──────────────┬───────────────┘
                                   │ assumes
                    ┌──────────────▼───────────────┐
                    │  Networking + Operating Systems│
                    │  TCP · DNS · TLS · epoll ·    │
                    │  page cache · fsync           │
                    └──────────────────────────────┘
```

**The minimum viable chain for an interview:** concepts §1–§3, §10, §16, §28, §42; one database guide; one messaging guide; then the design.

**The chain for a specific design:** open its Start-here card. "Before this doc" lists the two sections that matter.

---

<a id="first-eight"></a>
## Read these eight first

If you read nothing else, read these in this order. They cover the primitives that every other design reuses.

| # | Document | What it teaches | Why first |
| :- | :--- | :--- | :--- |
| 1 | [Concepts §1–§3](system-design-concepts.md#1-sharding-data-partitioning) | Sharding, consistent hashing, CAP | The vocabulary for every scale conversation |
| 2 | [Concepts §16](system-design-concepts.md#16-caching-strategies) | Cache-aside, write-through, TTL, eviction | The cheapest performance win, and the most common source of staleness |
| 3 | [Concepts §28](system-design-concepts.md#28-quorum-reads--writes) | Quorum reads and writes | The bridge between replication and consistency |
| 4 | [URL shortener](system-design-url-shortener.md) | Read-heavy design, Base62, cache-aside | The smallest complete design; every pattern appears once |
| 5 | [Distributed cache](system-design-distributed-cache.md) | Sharding, replication, hot keys | Turns caching theory into a running system |
| 6 | [Rate limiter](system-design-rate-limiter.md) | Atomic counters, token bucket, distributed state | A small system with a genuinely hard race |
| 7 | [Messaging app](system-design-messaging-app.md) | Fan-out, ordering, online/offline delivery | The canonical stateful real-time design |
| 8 | [Payment system](system-design-payment-system.md) | Idempotency, ledger, saga, reconciliation | The canonical correctness design; the opposite of a feed |

After those eight, choose a domain: social ([Twitter](system-design-twitter.md)), media ([Netflix](system-design-netflix.md)), transport ([Uber](system-design-uber.md)), or AI ([LLM inference](system-design-llm-inference.md)).

---

<a id="difficulty"></a>
## Difficulty tiers

The tiers are about the number of interacting constraints, not the length of the document.

### Start here — one dominant constraint

| Design | The one idea |
| :--- | :--- |
| [URL shortener](system-design-url-shortener.md) | Read-heavy cache-aside with unique codes |
| [Pastebin](system-design-pastebin.md) | Blob in object storage, metadata in a database |
| [Unique ID generator](system-design-unique-id-generator.md) | Timestamp + machine + sequence |
| [Rate limiter](system-design-rate-limiter.md) | Atomic shared counter in a window |
| [Distributed cache](system-design-distributed-cache.md) | Consistent hashing plus replication |
| [Key-value store](system-design-key-value-store.md) | Quorum plus conflict resolution |
| [Leaderboard](system-design-leaderboard.md) | Shard by score band, merge top-K |
| [Web crawler](system-design-web-crawler.md) | Frontier, politeness, dedup |
| [Search autocomplete](system-design-search-autocomplete.md) | Precomputed prefix index |

### Intermediate — two or three constraints

| Design | The tension |
| :--- | :--- |
| [Twitter](system-design-twitter.md), [Instagram](system-design-instagram.md), [LinkedIn](system-design-linkedin.md) | Fan-out on write vs read |
| [Messaging app](system-design-messaging-app.md), [Discord](system-design-discord.md) | Ordering, presence, hierarchical fan-out |
| [Notification system](system-design-notification-system.md), [Webhook delivery](system-design-webhook-delivery.md) | Multi-channel delivery, retries, DLQ |
| [E-commerce](system-design-ecommerce.md), [Ticketing](system-design-ticketing-system.md), [IRCTC](system-design-irctc.md) | Inventory correctness under contention |
| [Payment system](system-design-payment-system.md) | Idempotency plus ledger plus reconciliation |
| [Uber](system-design-uber.md), [Food delivery](system-design-food-delivery.md) | Geo matching plus trip state |
| [Netflix](system-design-netflix.md), [YouTube](system-design-youtube.md), [Spotify](system-design-spotify.md), [Hotstar](system-design-hotstar.md) | CDN, transcoding, personalized catalog |
| [Google Docs](system-design-google-docs.md), [Google Calendar](system-design-google-calendar.md) | Concurrent editing, recurrence, time zones |
| [File storage](system-design-file-storage.md) | Chunking, sync, sharing |
| [Search engine](system-design-search-engine.md), [Recommendation system](system-design-recommendation-system.md) | Index/funnel at scale |
| [A/B testing](system-design-ab-testing.md) | Deterministic bucketing plus statistics |
| [Code deployment](system-design-code-deployment.md) | Immutable artifacts, health-gated rollout |
| [Distributed lock manager](system-design-distributed-lock-manager.md) | Consensus plus fencing |
| [Google Maps](system-design-google-maps.md), [Proximity service](system-design-proximity-service.md) | Graph/geo indexing at scale |

### Advanced — many constraints, or a domain with hard correctness

| Design | Why it is hard |
| :--- | :--- |
| [Data pipeline](system-design-data-pipeline.md) | Batch + stream, exactly-once, backfill, schema evolution |
| [Observability pipeline](system-design-observability-pipeline.md) | Cardinality, sampling, cost |
| [Alerting](system-design-alerting.md) | Time-series ingest plus rule evaluation |
| [Google Ads](system-design-google-ads.md) | Auction latency plus budget pacing |
| [Stock exchange](system-design-stock-exchange.md) | Deterministic matching, microsecond budgets |
| [Algorithmic trading](system-design-algo-trading.md) | Pre-trade risk, order state, market data |
| [Fraud detection](system-design-fraud-detection.md) | Sub-100 ms stateful scoring |
| [Content moderation](system-design-content-moderation.md) | Precision/recall asymmetry, appeals, adversarial drift |
| [AI gateway](system-design-ai-gateway.md), [LLM inference](system-design-llm-inference.md) | Token quotas, KV cache, GPU batching |
| [GPU scheduler](system-design-gpu-scheduler.md), [Distributed training](system-design-distributed-training.md) | Placement, gang scheduling, checkpoint consistency |
| [Serverless](system-design-serverless.md), [Online judge](system-design-online-judge.md) | Isolation, cold start, untrusted code |
| [Metro ticketing](system-design-metro-ticketing.md), [Smart parking](system-design-parking-system.md) | Offline decisions plus physical events |
| [Route reconstruction](system-design-route-reconstruction.md) | Noisy GPS plus map matching |
| [Airbnb](system-design-airbnb.md) | Search plus booking correctness |
| [Tinder](system-design-tinder.md), [Reddit](system-design-reddit.md) | Discovery/ranking plus write volume |

---

<a id="coverage"></a>
## Coverage map — every canonical topic

The list below merges the topic indexes of the [System Design Primer](https://github.com/donnemartin/system-design-primer), [karanpratapsingh/system-design](https://github.com/karanpratapsingh/system-design), [ByteByteGo's system-design-101](https://github.com/ByteByteGoHq/system-design-101), and the [awesome-system-design-resources](https://github.com/ashishps1/awesome-system-design-resources) list. Each row points at the place this library explains it.

### Fundamentals

| Topic | Where |
| :--- | :--- |
| Performance vs scalability, latency vs throughput | [Concepts §56](system-design-concepts.md#56-performance-vs-scalability-and-latency-vs-throughput) |
| Back-of-the-envelope estimation | [Concepts §52](system-design-concepts.md#52-back-of-the-envelope-estimation) |
| Load balancing (L4/L7, algorithms) | [Concepts §13](system-design-concepts.md#13-load-balancing) · [Networking §7](networking.md#7-load-balancing--l4-vs-l7) |
| Caching strategies and eviction | [Concepts §16](system-design-concepts.md#16-caching-strategies) · [Distributed cache](system-design-distributed-cache.md) |
| CDN and edge caching | [Concepts §37](system-design-concepts.md#37-cdn--edge-caching) · [Networking §8](networking.md#8-cdns--edge-caching) |
| DNS | [Concepts §53](system-design-concepts.md#53-dns--the-internets-directory) · [Networking §6](networking.md#6-dns--the-internets-phone-book) |
| TCP/UDP, HTTP/1.1 → 3, TLS | [Networking §2–§5](networking.md#2-ip-tcp--udp) |
| Proxies and API gateways | [Networking §10](networking.md#10-proxies--forward-reverse--api-gateways) · [Concepts §36](system-design-concepts.md#36-api-gateway-vs-service-mesh) |
| REST vs gRPC vs GraphQL, WebSockets, SSE | [Concepts §55](system-design-concepts.md#55-api-styles--rest-vs-grpc-vs-graphql) · [Networking §11](networking.md#11-api-protocols--rest-grpc-websocket-sse) |

### Data and storage

| Topic | Where |
| :--- | :--- |
| Sharding and partition keys | [Concepts §1](system-design-concepts.md#1-sharding-data-partitioning) |
| Consistent hashing | [Concepts §2](system-design-concepts.md#2-consistent-hashing) |
| Replication topologies | [Concepts §15](system-design-concepts.md#15-replication-topologies) |
| CAP, PACELC, consistency models | [Concepts §3](system-design-concepts.md#3-cap-theorem) · [§29](system-design-concepts.md#29-consistency-models) · [§30](system-design-concepts.md#30-pacelc-theorem) |
| Quorums and read repair | [Concepts §28](system-design-concepts.md#28-quorum-reads--writes) · [Key-value store](system-design-key-value-store.md) |
| ACID vs BASE, transactions, isolation | [Concepts §4](system-design-concepts.md#4-acid-vs-base) · [PostgreSQL §12](postgresql-features.md#12-transactions-mvcc--isolation-levels) |
| B-tree vs LSM, WAL, compaction | [Concepts §31–§32](system-design-concepts.md#31-write-ahead-log-wal--durability) |
| Indexing, leftmost prefix, secondary indexes | [Concepts §50](system-design-concepts.md#50-indexing-fundamentals--selection-strategy) |
| Data models vs access patterns, denormalization | [Concepts §49](system-design-concepts.md#49-data-models-vs-access-patterns) |
| CDC and logical replication | [PostgreSQL §17](postgresql-features.md#17-logical-replication--change-data-capture-cdc) · [Data pipeline](system-design-data-pipeline.md) |
| Batch and stream processing, MapReduce/Spark/Flink | [Data pipeline](system-design-data-pipeline.md) |
| Data warehouse vs lake vs lakehouse | [Data pipeline](system-design-data-pipeline.md) · [Cloud §8](cloud.md#8-analytics-warehouses--data-lakes) |
| Object storage and erasure coding | [File storage](system-design-file-storage.md) · [Cloud §1](cloud.md#1-object-storage--archive-tiers-s3--gcs--blob) |
| Blob, probability and cardinality sketches | [Concepts §17](system-design-concepts.md#17-bloom-filter) · [§68](system-design-concepts.md#68-count-min-sketch) · [§69](system-design-concepts.md#69-hyperloglog-cardinality-estimation) |

### Messaging and coordination

| Topic | Where |
| :--- | :--- |
| Message queues and pub/sub | [Kafka guide](kafka-features.md) · [RabbitMQ guide](rabbitmq-features.md) |
| Consumer groups, offsets, ISR, exactly-once | [Kafka guide](kafka-features.md) |
| Event sourcing and CQRS | [Concepts §6–§7](system-design-concepts.md#6-cqrs-command-query-responsibility-segregation) |
| Saga, outbox, 2PC | [Concepts §8](system-design-concepts.md#8-saga-pattern) · [§9](system-design-concepts.md#9-outbox-pattern) · [§24](system-design-concepts.md#24-two-phase-commit-2pc-vs-saga) |
| Idempotency and deduplication | [Concepts §10](system-design-concepts.md#10-idempotency) |
| Dead-letter queues, backpressure, retries | [Concepts §20](system-design-concepts.md#20-dead-letter-queue) · [§21](system-design-concepts.md#21-backpressure) · [§39](system-design-concepts.md#39-retries-backoff--jitter) |
| Consensus (Raft/Paxos), leader election | [Concepts §23](system-design-concepts.md#23-consensus-algorithms-raft--paxos) · [§14](system-design-concepts.md#14-leader-election) |
| Distributed locks and fencing | [Concepts §34](system-design-concepts.md#34-distributed-locking--fencing) · [Lock manager](system-design-distributed-lock-manager.md) |
| Gossip, vector clocks, Merkle trees, CRDTs | [Concepts §18–§19](system-design-concepts.md#18-gossip-protocol) · [§22](system-design-concepts.md#22-merkle-trees-anti-entropy) · [§25](system-design-concepts.md#25-crdts--conflict-free-replicated-data-types) |
| Service discovery and service mesh | [Concepts §35–§36](system-design-concepts.md#35-service-discovery--registry) |

### Delivery and operations

| Topic | Where |
| :--- | :--- |
| SLIs, SLOs, error budgets | [Concepts §45](system-design-concepts.md#45-slis-slos--error-budgets) |
| Metrics, logs, traces, sampling, cardinality | [Observability pipeline](system-design-observability-pipeline.md) |
| Alerting and time-series storage | [Alerting](system-design-alerting.md) |
| Deployment strategies (canary, blue-green) | [Concepts §47](system-design-concepts.md#47-deployment-strategies) · [Code deployment](system-design-code-deployment.md) |
| Feature flags and kill switches | [Concepts §47](system-design-concepts.md#47-deployment-strategies) |
| Containers, Kubernetes, CI/CD, IaC | [DevOps guide](devops-features.md) · [Code deployment](system-design-code-deployment.md) |
| Serverless and cold starts | [Serverless](system-design-serverless.md) |
| Multi-region and disaster recovery | [Concepts §46](system-design-concepts.md#46-multi-region--disaster-recovery) |

### Security and identity

| Topic | Where |
| :--- | :--- |
| Authentication vs authorization | [Concepts §54](system-design-concepts.md#54-security--authnauthz-oauth2-jwt-mtls) |
| OAuth 2.0, OIDC, SSO, SAML | [Concepts §54](system-design-concepts.md#54-security--authnauthz-oauth2-jwt-mtls) |
| JWT, sessions, token revocation | [Concepts §54](system-design-concepts.md#54-security--authnauthz-oauth2-jwt-mtls) |
| RBAC, ABAC, least privilege | [Concepts §54](system-design-concepts.md#54-security--authnauthz-oauth2-jwt-mtls) |
| TLS, mTLS, zero trust | [Networking §5](networking.md#5-tls--mtls) · [Concepts §54](system-design-concepts.md#54-security--authnauthz-oauth2-jwt-mtls) |
| Webhook signing, replay windows, secret rotation | [Webhook delivery](system-design-webhook-delivery.md) · [Concepts §54](system-design-concepts.md#54-security--authnauthz-oauth2-jwt-mtls) |

### Domains

| Topic | Where |
| :--- | :--- |
| Social feed and fan-out | [Twitter](system-design-twitter.md) · [Instagram](system-design-instagram.md) · [LinkedIn](system-design-linkedin.md) |
| Chat and real-time messaging | [Messaging app](system-design-messaging-app.md) · [Discord](system-design-discord.md) |
| Video streaming and live | [Netflix](system-design-netflix.md) · [YouTube](system-design-youtube.md) · [Hotstar](system-design-hotstar.md) |
| Music streaming | [Spotify](system-design-spotify.md) |
| Video conferencing | [Video conferencing](system-design-video-conferencing.md) |
| Search and autocomplete | [Search engine](system-design-search-engine.md) · [Search autocomplete](system-design-search-autocomplete.md) |
| Recommendations and ads | [Recommendation system](system-design-recommendation-system.md) · [Google Ads](system-design-google-ads.md) |
| Payments, ledgers, trading | [Payment system](system-design-payment-system.md) · [Stock exchange](system-design-stock-exchange.md) · [Algorithmic trading](system-design-algo-trading.md) |
| Commerce, booking, inventory | [E-commerce](system-design-ecommerce.md) · [Ticketing](system-design-ticketing-system.md) · [IRCTC](system-design-irctc.md) · [Airbnb](system-design-airbnb.md) |
| Transport and geospatial | [Uber](system-design-uber.md) · [Food delivery](system-design-food-delivery.md) · [Google Maps](system-design-google-maps.md) · [Proximity service](system-design-proximity-service.md) · [Route reconstruction](system-design-route-reconstruction.md) |
| Trust and safety | [Fraud detection](system-design-fraud-detection.md) · [Content moderation](system-design-content-moderation.md) |
| AI infrastructure | [LLM inference](system-design-llm-inference.md) · [AI gateway](system-design-ai-gateway.md) · [GPU scheduler](system-design-gpu-scheduler.md) · [Distributed training](system-design-distributed-training.md) · [Agentic AI](agentic-ai-features.md) |
| Productivity and collaboration | [Google Docs](system-design-google-docs.md) · [Google Calendar](system-design-google-calendar.md) |
| Communities and dating | [Reddit](system-design-reddit.md) · [Tinder](system-design-tinder.md) |
| Infrastructure primitives | [URL shortener](system-design-url-shortener.md) · [Rate limiter](system-design-rate-limiter.md) · [Unique ID](system-design-unique-id-generator.md) · [Leaderboard](system-design-leaderboard.md) · [Distributed cache](system-design-distributed-cache.md) · [Key-value store](system-design-key-value-store.md) · [File storage](system-design-file-storage.md) · [Web crawler](system-design-web-crawler.md) · [Notification](system-design-notification-system.md) · [Webhook](system-design-webhook-delivery.md) · [Delayed job scheduler](system-design-delayed-job-scheduler.md) · [Distributed lock](system-design-distributed-lock-manager.md) |

---

<a id="not-covered"></a>
## What this library does not cover

Being explicit about the gaps is part of being a good reference. These topics are canonical but do not have a dedicated document here yet:

| Gap | Why it is not covered | Where to go instead |
| :--- | :--- | :--- |
| **Distributed file systems (HDFS, GFS)** | The library covers object storage and sync, not block placement and NameNode design | [Data pipeline](system-design-data-pipeline.md) explains the storage layer it uses; the original GFS/HDFS papers are the primary source |
| **Multiplayer game servers** | A different latency and state-replication model (tick loops, rollback, interest management) | [Video conferencing](system-design-video-conferencing.md) and [Discord](system-design-discord.md) share the real-time fan-out mechanics |
| **Garbage collection / language runtimes** | Belongs to operating systems and language internals, not distributed design | [Operating systems](operating-systems.md) covers memory and scheduling |
| **Queueing theory (Little's law, M/M/1)** | Mentioned inside capacity estimation but not derived | [Concepts §52](system-design-concepts.md#52-back-of-the-envelope-estimation) |
| **Bulkhead isolation** | Related to circuit breaking and load shedding, but no dedicated section | [Concepts §11](system-design-concepts.md#11-circuit-breaker) and [§27](system-design-concepts.md#27-load-shedding--graceful-degradation) |
| **Workflow orchestration (Temporal-style)** | The delayed job scheduler covers timers, not long-running durable workflows | [Delayed job scheduler](system-design-delayed-job-scheduler.md) · [Data pipeline](system-design-data-pipeline.md) |
| **Configuration service** | Feature flags are covered in §47; a full config distribution service is not | [Concepts §47](system-design-concepts.md#47-deployment-strategies) |
| **Blockchain / distributed ledgers** | A different trust model; out of scope for this library | [Payment system](system-design-payment-system.md) covers the ledger mechanics that transfer |

If one of these is your interview topic, read the nearest document for the mechanics, then use the primary sources in [resources.md](resources.md).

---

<a id="how-to-read"></a>
## How to read a design doc

Every design opens with a **Start here** card. Use it as the map, then choose a depth.

### The 5-minute pass

Read only:

1. **Start here** — the one idea and the trap
2. **Overview → Key Numbers** — the scale you are designing for
3. **Architecture diagram** — the boxes and the main path

You should now be able to say what the system does and where the data lives.

### The 20-minute pass

Add:

4. **Data Flow** — trace one request from entry to storage
5. **Key Design Decisions** — why this shape, not the obvious alternative
6. **Failure Modes** — what breaks first and how it recovers

You should now be able to defend the design in a interview for 10 minutes.

### The full pass

Read everything, including:

7. **Database Design** — the actual keys and indexes
8. **Scaling Tiers** — what changes at 10K, 1M and 10M users
9. **Cost** and **Trade-offs** — the engineering economics
10. **LLD** — run the code, then break it

### A note-taking template

For each design, write five lines:

```text
Core action:
Key numbers:
What must be correct:
Where state lives:
What breaks first:
```

If you cannot fill a line, that is the section to reread.

---

## Hidden Tips & Tricks

- **Read the trade-off table before the architecture.** It tells you which decisions were contested, which is where the interview lives.
- **The "Watch out for" line is the most valuable sentence in each doc.** It is the mistake the design exists to avoid.
- **Do not memorise 58 designs.** Memorise the six questions and the ten patterns; the designs are combinations.
- **When a doc feels dense, find the diagram and trace one request.** Prose explains; the diagram locates.
- **Read the failure table out loud.** "What happens when X dies?" is the follow-up to every design answer.

---

## Do's & Don'ts

| ✅ Do | ❌ Don't |
| :-- | :-- |
| Read the prerequisite concept before the design | Start with the hardest design (stock exchange, LLM inference) on day one |
| Use the 5/20/full pass deliberately | Read every doc end-to-end and retain none of it |
| Trace one request through the diagram | Memorise boxes without the data flow |
| Write the five-line summary after each design | Highlight the doc and call it studying |
| Compare two designs that solve similar problems | Treat each design as unique; the patterns repeat |
| Say "I don't know" and reason from constraints | Recite a design you do not understand |

*More cross-topic rules: [Interview Q&A §84](interview-qa.md#84-universal-dos--donts) · [Glossary](GLOSSARY.md) · [30-day roadmap](STUDY-ROADMAP.md)*

---

<nav>← [README](README.md) · [Glossary](GLOSSARY.md) · [30-day roadmap](STUDY-ROADMAP.md) →</nav>

---

<p align="right"><a href="#top">↑ Back to top</a></p>
