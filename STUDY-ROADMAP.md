<div align="center">

# 30-Day System Design Study Roadmap

</div>

A day-by-day path through this repo: designs interleaved with the concepts that power them, guides where the tech shows up, and the Q&A bank for the "why/what-if" layer. Budget **~2 hours/day**; every 7th day is a consolidation checkpoint.

**Legend:** 📐 design doc · 🧩 concepts section · 🧰 guide · ❓ interview Q&A · 📚 resource

---

## Week 1 — Foundations (the primitives everything reuses)

| Day | Read | Do |
| :--- | :--- | :--- |
| 1 | 🧩 Concepts §1–§8 (sharding, hashing, CAP, ACID/BASE, CQRS, event sourcing, saga, outbox) | Re-derive back-of-envelope math for a URL shortener on paper |
| 2 | 📐 URL shortener · 📐 Pastebin | Estimate keys/sec + storage for both; write the Key Numbers from memory |
| 3 | 🧩 §9–§16 (idempotency, breaker, rate limiting, LB, leader election, replication, caching) | Implement the single-flight snippet; explain cache-aside vs write-through aloud |
| 4 | 📐 Rate limiter · 📐 Distributed cache | Trace which pattern (§73) each doc uses and why |
| 5 | 🧰 Redis guide (+ §20 tips, §21 do's) · ❓ §78 Q&A | Run every redis-cli example locally |
| 6 | 📐 Unique ID generator · 🧩 §55–§70 algorithms (Base62/Snowflake) | Execute the drift-guard minter; break it on purpose (clock skew) |
| 7 | **Checkpoint** | Whiteboard: design a pastebin end-to-end in 45 min. Compare against the doc's trade-off table |

## Week 2 — Data & Messaging (state, streams, and consistency)

| Day | Read | Do |
| :--- | :--- | :--- |
| 8 | 🧩 §17–§26 (Bloom, gossip, vector clocks, DLQ, backpressure, Merkle, consensus, 2PC, CRDT, EDA) | Simulate a Raft election on paper for a 3-node cluster |
| 9 | 🧰 Kafka guide (+ §17 tips, §18 do's) · ❓ §79 Q&A ("why is Kafka fast?") | Explain the consumers>partitions table from memory |
| 10 | 📐 Messaging app · 📐 Discord | Compare fan-out strategies; when does hierarchical fan-out win? |
| 11 | 🧰 RabbitMQ guide · ❓ §74 queue failure terms | Write the Kafka-vs-RabbitMQ decision table from memory |
| 12 | 🧰 PostgreSQL guide · 🧰 MongoDB guide | Run the ESR example; explain MVCC bloat to a rubber duck |
| 13 | 📐 Twitter · 📐 Instagram | Do the fan-out-on-write vs on-read math at 10M/100M DAU |
| 14 | **Checkpoint** | Whiteboard: chat app with 500K-member rooms (Discord follow-ups) |

## Week 3 — Delivery & Infrastructure (geo, video, money, deploys)

| Day | Read | Do |
| :--- | :--- | :--- |
| 15 | 🧩 §27–§34 (load shedding, quorum, consistency models, PACELC, WAL, storage engines, checksums, locking) | Draw the fencing-token write-rejection sequence |
| 16 | 📐 Uber · 📐 Route reconstruction (Zepto) | Compute a geohash by hand for your city; explain the H3/HMM consensus |
| 17 | 📐 Netflix · 📐 YouTube · 📐 Hotstar | Compare CDN strategies; estimate bandwidth for 1M concurrent 4K streams |
| 18 | 📐 Payment system · 📐 Stock exchange | Write the double-spend prevention flow; where do idempotency keys live? |
| 19 | 🧰 DevOps guide (+ §17 tips, §18 do's) · ☁️ Cloud map | Explain blue-green vs canary vs rolling with cost trade-offs |
| 20 | 📐 Code deployment (CI/CD) · ❓ §80 Q&A | Walk the bad-deploy 5-minute playbook aloud |
| 21 | **Checkpoint** | Whiteboard: multi-region payments with reconciliation |

## Week 4 — Interview simulation (hard docs, tips, mock loops)

| Day | Read | Do |
| :--- | :--- | :--- |
| 22 | 📐 Search engine · 📐 Recommendation system | Explain WAND pruning + two-tower in one breath each |
| 23 | 📐 Google Ads · 📐 Distributed lock manager | Argue Kleppmann's fencing critique both sides |
| 24 | 📐 Serverless · 📐 Online judge · 📐 Leaderboard | Estimate cold-start economics at 10K RPS |
| 25 | 📐 Google Calendar · 📐 Reddit · 📐 Web crawler | Recurrence + threaded-comments data modeling |
| 26 | ❓ Full interview-qa.md (§73–81) · 📚 resources §9 hidden tips | Self-quiz: every term table, closed book |
| 27 | 🧰 Elasticsearch · 🤖 Agentic AI guide · ☁️ Cloud §17 tips | Modern-stack follow-ups (RAG, vector search) |
| 28 | Pick 2 weak docs; re-read trade-offs + failure modes | Teach-back: explain each to someone (or a camera) |
| 29 | Full mock: 45-min design + 15-min follow-ups (record yourself) | Grade against the rubric-by-level (resources §9) |
| 30 | Light review: Key Numbers tables + §49 estimation | Rest. You've earned it. |

---

## Rules that make it stick

1. **Estimate before reading** each design doc — then check your numbers against its Key Numbers table.
2. **Close the doc, redraw the diagram** from memory. The Archify HTMLs are the answer key.
3. **Every failure mode table is a quiz** — cover the mitigation column, guess, verify.
4. **One mock per week minimum** — a design you can't *talk* through isn't one you know.
5. **Breadth days beat depth spirals** — if a doc hooks you, note the rabbit hole and keep the schedule.
