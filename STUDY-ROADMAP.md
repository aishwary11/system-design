<div align="center">

# 30-Day System Design Study Roadmap

</div>

A day-by-day path through this repo: designs interleaved with the concepts that power them, guides where the tech shows up, and the Q&A bank for the "why/what-if" layer. Budget **~2 hours/day**; every 7th day is a consolidation checkpoint.

**Legend:** 📐 design doc · 🧩 concepts section · 🧰 guide · ❓ interview Q&A · 📚 resource

---

## Table of Contents

<details>
<summary><b>📑 Jump to a section</b></summary>

1. [Week 1 — Foundations (the primitives everything reuses)](#week-1--foundations-the-primitives-everything-reuses)
2. [Week 2 — Data & Messaging (state, streams, and consistency)](#week-2--data--messaging-state-streams-and-consistency)
3. [Week 3 — Delivery & Infrastructure (geo, video, money, deploys)](#week-3--delivery--infrastructure-geo-video-money-deploys)
4. [Week 4 — Interview simulation (hard docs, tips, mock loops)](#week-4--interview-simulation-hard-docs-tips-mock-loops)
5. [Complete Coverage Map — all 56 designs](#complete-coverage-map--all-56-designs)
6. [Rules that make it stick](#rules-that-make-it-stick)
7. [Hidden Tips & Tricks](#hidden-tips--tricks)
8. [Do's & Don'ts](#dos--donts)

</details>

---

## Week 1 — Foundations (the primitives everything reuses)

| Day | Read | Do |
| :--- | :--- | :--- |
| 1 | 🧩 [Concepts §1–§8](system-design-concepts.md#1-sharding-data-partitioning) (sharding, hashing, CAP, ACID/BASE, SOLID, CQRS, event sourcing, saga) | Re-derive back-of-envelope math for a URL shortener on paper |
| 1½ | 🧩 [§49–§52](system-design-concepts.md#49-data-models-vs-access-patterns) (data models vs access patterns, indexing & leftmost prefix, monolith vs microservices, estimation) | Write the 5 query shapes of your last project; check one EXPLAIN plan against the leftmost-prefix table |
| 2 | 📐 [URL shortener](system-design-url-shortener.md) · 📐 [Pastebin](system-design-pastebin.md) · 📐 [Unique ID generator](system-design-unique-id-generator.md) | Estimate keys/sec + storage for both; write the Key Numbers from memory |
| 3 | 🧩 [§9–§16](system-design-concepts.md#9-outbox-pattern) (outbox, idempotency, breaker, rate limiting, LB, leader election, replication, caching) · 🌍 [Industry concept map](industry-concepts.md) | Implement the single-flight snippet; explain cache-aside vs write-through aloud |
| 4 | 📐 [Rate limiter](system-design-rate-limiter.md) · 📐 [Distributed cache](system-design-distributed-cache.md) · 📐 [Key-value store](system-design-key-value-store.md) | Trace which pattern each doc uses and why; compare LRU vs LFU eviction |
| 5 | 🧰 [Redis guide](redis-features.md) (+ §20 tips, §21 do's) · ❓ [Q&A §81](interview-qa.md#81-caching--redis) | Run every redis-cli example locally |
| 6 | 🧩 [§58–§74](system-design-concepts.md#58-luhns-algorithm-credit-card-validation) algorithms (Luhn → sliding window) | Execute the drift-guard minter; break it on purpose (clock skew) |
| 6½ | 🧵 [Low-Level Design](low-level-design.md) — the twelve concurrency primitives | For five of them, write the invariant, the shutdown contract and the overload policy from memory |
| 7 | **Checkpoint** | Whiteboard: design a pastebin end-to-end in 45 min. Compare against the doc's trade-off table |

## Week 2 — Data & Messaging (state, streams, and consistency)

| Day | Read | Do |
| :--- | :--- | :--- |
| 8 | 🧩 §17–§26 (Bloom, gossip, vector clocks, DLQ, backpressure, Merkle, consensus, 2PC, CRDT, EDA) | Simulate a Raft election on paper for a 3-node cluster |
| 9 | 🧰 [Kafka guide](kafka-features.md) (+ §17 tips, §18 do's) · ❓ [Q&A §79](interview-qa.md#79-kubernetes--platform-failure-terminology-oomkilled-crashloopbackoff-evictions) | Explain the consumers>partitions table from memory |
| 10 | 📐 [Messaging app](system-design-messaging-app.md) · 📐 [Discord](system-design-discord.md) · 📐 [Notification system](system-design-notification-system.md) | Compare fan-out strategies; when does hierarchical fan-out win? |
| 11 | 🧰 [RabbitMQ guide](rabbitmq-features.md) · 📐 [Delayed job scheduler](system-design-delayed-job-scheduler.md) · ❓ [Q&A §77](interview-qa.md) queue failure terms | Write the Kafka-vs-RabbitMQ decision table from memory |
| 12 | 🧰 [PostgreSQL guide](postgresql-features.md) · 🧰 [MongoDB guide](mongodb-features.md) | Run the ESR example; explain MVCC bloat to a rubber duck |
| 13 | 📐 [Twitter](system-design-twitter.md) · 📐 [Instagram](system-design-instagram.md) · 📐 [LinkedIn](system-design-linkedin.md) · 📐 [Tinder](system-design-tinder.md) | Do the fan-out-on-write vs on-read math at 10M/100M DAU |
| 14 | **Checkpoint** | Whiteboard: chat app with 500K-member rooms (Discord follow-ups) |

## Week 3 — Delivery & Infrastructure (geo, video, money, deploys)

| Day | Read | Do |
| :--- | :--- | :--- |
| 15 | 🧩 §27–§34 (load shedding, quorum, consistency models, PACELC, WAL, storage engines, checksums, locking) | Draw the fencing-token write-rejection sequence |
| 16 | 📐 [Uber](system-design-uber.md) · 📐 [Route reconstruction](system-design-route-reconstruction.md) · 📐 [Proximity service](system-design-proximity-service.md) · 📐 [Google Maps](system-design-google-maps.md) | Compute a geohash by hand for your city; explain the H3/HMM consensus |
| 17 | 📐 [Metro ticketing](system-design-metro-ticketing.md) · 📐 [Parking system](system-design-parking-system.md) · 📐 [Food delivery](system-design-food-delivery.md) · 📐 [Airbnb](system-design-airbnb.md) | Where does each system need a hard consistency boundary, and where is eventual consistency fine? |
| 18 | 📐 [Netflix](system-design-netflix.md) · 📐 [YouTube](system-design-youtube.md) · 📐 [Hotstar](system-design-hotstar.md) · 📐 [Spotify](system-design-spotify.md) · 📐 [Video conferencing](system-design-video-conferencing.md) | Compare CDN strategies; estimate bandwidth for 1M concurrent 4K streams |
| 19 | 🧰 [Networking guide](networking.md) · 🧰 [Cloud map](cloud.md) | Trace one request through DNS → TLS → CDN → LB → service; pick the cloud service for each hop |
| 20 | 📐 [Payment system](system-design-payment-system.md) · 📐 [Stock exchange](system-design-stock-exchange.md) · 📐 [Algorithmic trading](system-design-algo-trading.md) | Write the double-spend prevention flow; then trace one order from signal → risk gate → venue → fill → reconciliation |
| 21 | **Checkpoint** | Whiteboard: multi-region payments with reconciliation |

## Week 4 — Interview simulation (hard docs, tips, mock loops)

| Day | Read | Do |
| :--- | :--- | :--- |
| 22 | 🧰 [DevOps guide](devops-features.md) (+ §17 tips, §18 do's) · 📐 [Code deployment](system-design-code-deployment.md) · 📐 [Alerting & monitoring](system-design-alerting.md) · 📐 [Webhook delivery](system-design-webhook-delivery.md) · 📐 [Observability pipeline](system-design-observability-pipeline.md) | Explain blue-green vs canary vs rolling with cost trade-offs; design the alert that pages you, then the retry ladder that doesn't |
| 23 | 📐 [Search engine](system-design-search-engine.md) · 📐 [Search autocomplete](system-design-search-autocomplete.md) · 📐 [Web crawler](system-design-web-crawler.md) · 📐 [Recommendation system](system-design-recommendation-system.md) · 📐 [A/B experimentation](system-design-ab-testing.md) | Explain WAND pruning + two-tower in one breath each; then how you would *prove* a ranking change helped |
| 24 | 📐 [Google Ads](system-design-google-ads.md) · 📐 [Fraud detection](system-design-fraud-detection.md) · 📐 [Distributed lock manager](system-design-distributed-lock-manager.md) · 📐 [Leaderboard](system-design-leaderboard.md) | Argue Kleppmann's fencing critique both sides |
| 25 | 📐 [Serverless](system-design-serverless.md) · 📐 [Online judge](system-design-online-judge.md) · 📐 [File storage](system-design-file-storage.md) · ❓ [Q&A §83](interview-qa.md#83-kubernetes--devops) | Estimate cold-start economics at 10K RPS; walk the bad-deploy 5-minute playbook |
| 26 | 📐 [Google Calendar](system-design-google-calendar.md) · 📐 [Reddit](system-design-reddit.md) · 📐 [Google Docs](system-design-google-docs.md) | Recurrence + threaded-comments data modeling; OT vs CRDT decision |
| 27 | 🧰 [Elasticsearch guide](elasticsearch-features.md) · 🤖 [Agentic AI guide](agentic-ai-features.md) · 📐 [LLM inference](system-design-llm-inference.md) · 📐 [AI gateway](system-design-ai-gateway.md) · 📐 [GPU scheduler](system-design-gpu-scheduler.md) · 📐 [Distributed training](system-design-distributed-training.md) · ☁️ [Cloud §19 catalog](cloud.md) | Modern-stack follow-ups (RAG, vector search, continuous batching, multi-provider routing and quotas); then explain MIG vs MPS and derive a checkpoint interval from MTBF |
| 28 | 🧰 [Operating Systems guide](operating-systems.md) · 📐 [IRCTC](system-design-irctc.md) · 📐 [Ticketing system](system-design-ticketing-system.md) · 📐 [E-commerce](system-design-ecommerce.md) | Explain epoll → io_uring and zero-copy to a rubber duck; then the flash-sale fairness problem |
| 29 | ❓ [Full interview Q&A §76–§84](interview-qa.md) · 📚 [Resources §9 hidden tips](resources.md) | Self-quiz every term table, closed book; record a 45-min mock + 15-min follow-ups |
| 30 | Light review: Key Numbers tables + §52 estimation · 🧩 [Concepts end-to-end](system-design-concepts.md) | Rest. You've earned it. |

---

## Complete Coverage Map — all 56 designs

Every design document and its scheduled day, so nothing gets skipped:

| Day | Designs |
| :--- | :--- |
| 2 | [URL shortener](system-design-url-shortener.md) · [Pastebin](system-design-pastebin.md) · [Unique ID generator](system-design-unique-id-generator.md) |
| 4 | [Rate limiter](system-design-rate-limiter.md) · [Distributed cache](system-design-distributed-cache.md) · [Key-value store](system-design-key-value-store.md) |
| 10 | [Messaging app](system-design-messaging-app.md) · [Discord](system-design-discord.md) · [Notification system](system-design-notification-system.md) |
| 11 | [Delayed job scheduler](system-design-delayed-job-scheduler.md) |
| 13 | [Twitter](system-design-twitter.md) · [Instagram](system-design-instagram.md) · [LinkedIn](system-design-linkedin.md) · [Tinder](system-design-tinder.md) |
| 16 | [Uber](system-design-uber.md) · [Route reconstruction](system-design-route-reconstruction.md) · [Proximity service](system-design-proximity-service.md) · [Google Maps](system-design-google-maps.md) |
| 17 | [Metro ticketing](system-design-metro-ticketing.md) · [Parking system](system-design-parking-system.md) · [Food delivery](system-design-food-delivery.md) · [Airbnb](system-design-airbnb.md) |
| 18 | [Netflix](system-design-netflix.md) · [YouTube](system-design-youtube.md) · [Hotstar](system-design-hotstar.md) · [Spotify](system-design-spotify.md) · [Video conferencing](system-design-video-conferencing.md) |
| 20 | [Payment system](system-design-payment-system.md) · [Stock exchange](system-design-stock-exchange.md) · [Algorithmic trading](system-design-algo-trading.md) |
| 22 | [Code deployment](system-design-code-deployment.md) · [Alerting & monitoring](system-design-alerting.md) · [Webhook delivery](system-design-webhook-delivery.md) · [Observability pipeline](system-design-observability-pipeline.md) |
| 23 | [Search engine](system-design-search-engine.md) · [Search autocomplete](system-design-search-autocomplete.md) · [Web crawler](system-design-web-crawler.md) · [Recommendation system](system-design-recommendation-system.md) · [A/B experimentation](system-design-ab-testing.md) |
| 24 | [Google Ads](system-design-google-ads.md) · [Fraud detection](system-design-fraud-detection.md) · [Distributed lock manager](system-design-distributed-lock-manager.md) · [Leaderboard](system-design-leaderboard.md) |
| 25 | [Serverless](system-design-serverless.md) · [Online judge](system-design-online-judge.md) · [File storage](system-design-file-storage.md) |
| 26 | [Google Calendar](system-design-google-calendar.md) · [Reddit](system-design-reddit.md) · [Google Docs](system-design-google-docs.md) |
| 27 | [LLM inference](system-design-llm-inference.md) · [AI gateway](system-design-ai-gateway.md) · [GPU scheduler](system-design-gpu-scheduler.md) · [Distributed training](system-design-distributed-training.md) |
| 28 | [IRCTC](system-design-irctc.md) · [Ticketing system](system-design-ticketing-system.md) · [E-commerce](system-design-ecommerce.md) |

Guides are interleaved the same way: [Concepts](system-design-concepts.md) (days 1–15, 30), [Redis](redis-features.md) (5), [Kafka](kafka-features.md) (9), [RabbitMQ](rabbitmq-features.md) (11), [PostgreSQL](postgresql-features.md) + [MongoDB](mongodb-features.md) (12), [Networking](networking.md) (19), [Cloud](cloud.md) (19, 27), [DevOps](devops-features.md) (22), [Elasticsearch](elasticsearch-features.md) + [Agentic AI](agentic-ai-features.md) (27), [Operating Systems](operating-systems.md) (28), [Low-Level Design](low-level-design.md) (6½), [Resources](resources.md) (29), [Interview Q&A](interview-qa.md) (days 5, 9, 11, 25, 29).

---

## Rules that make it stick

1. **Estimate before reading** each design doc — then check your numbers against its Key Numbers table.
2. **Close the doc, redraw the diagram** from memory. The Archify HTMLs are the answer key.
3. **Every failure mode table is a quiz** — cover the mitigation column, guess, verify.
4. **One mock per week minimum** — a design you can't *talk* through isn't one you know.
5. **Breadth days beat depth spirals** — if a doc hooks you, note the rabbit hole and keep the schedule.

---

## Hidden Tips & Tricks

1. **Read the trade-off table before the architecture.** The diagram shows *what* was built; the trade-off table shows *why*, and that's what interviewers probe.
2. **Say the numbers out loud.** "50M DAU, 5 writes/day/user, ~3K writes/sec peak" turns a vague design into an engineering argument — practise until it's automatic.
3. **Name the bottleneck before proposing a component.** Adding Kafka to a system whose problem is read amplification is a red flag, not an answer.
4. **Keep one deliberate failure in mind per design.** "What breaks first at 10× traffic?" is the follow-up question you will always get.
5. **Weak docs are worth more than easy docs.** Re-reading the three you find hardest beats a fourth pass over the ones you already enjoy.
6. **Two-pass reading.** First pass for the architecture and numbers, second pass (a day later) for failure modes and edge cases — spaced repetition beats cramming.
7. **Use the interactive HTMLs as answer keys.** Close the markdown, recall the diagram, then pan/zoom the HTML to check what you missed.
8. **Keep a one-page "weaknesses" log.** Every mock adds a row; the log becomes your revision plan for the last three days.

## Do's & Don'ts

| ✅ Do | ❌ Don't |
| :--- | :--- |
| Estimate before reading, then diff against the doc's Key Numbers | Don't read a design as prose — read it as a set of decisions |
| Redraw the diagram from memory the next day | Don't skip the failure-mode and trade-off tables |
| Say requirements and constraints out loud before drawing boxes | Don't jump to the "interesting" component first |
| Record one mock per week and watch it back | Don't practise only the designs you already know |
| Link every concept you use back to its guide section | Don't collect tools you can't cost, size, or operate |
| Log your weaknesses after every mock | Don't spiral into one rabbit hole and lose the schedule |
| Sleep on the hard docs and revisit them | Don't cram all four weeks into the last three days |

*More cross-topic rules: [Interview Q&A §84](interview-qa.md#84-universal-dos--donts) · [Core Concepts](system-design-concepts.md) · [Curated Resources](resources.md)*
