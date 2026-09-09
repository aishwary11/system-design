# 📚 System Design & Technology Guides

> **32 comprehensive system design documents** covering High-Level Architecture (HLD), Low-Level Design (LLD), database design, scaling strategies, and executable JavaScript algorithms — **plus 4 technology feature guides** (PostgreSQL, Redis, Kafka, and core concepts) with basic, copy-paste-able examples.

| 🗂️ Documents | 32 system designs | 4 feature guides |
| --- | --- | --- |
| **Topics** | Streaming, Social, E-Commerce, Transport, Infra, Productivity & more | Databases · Message queues · Core concepts |
| **Each doc has** | 15-section template + Archify diagram (inline SVG + interactive HTML) + JS algorithms | Feature catalog + runnable examples + trade-offs |

---

## 🧭 Quick Navigation
Jump straight to a technology guide:

| Guide | What it covers |
| ----- | -------------- |
| 🔷 [PostgreSQL Features](postgresql-features.md) | Triggers, LISTEN/NOTIFY, indexes, JSONB, MVCC, partitioning, replication, CDC |
| 🔴 [Redis Features](redis-features.md) | 15+ data types, caching, locking, rate limiting, Streams, HA/security |
| ⚫ [Kafka Features](kafka-features.md) | Topics, consumer groups, exactly-once, compaction, Connect/Streams, CDC |
| 🧩 [System Design Concepts](system-design-concepts.md) | Sharding, consistent hashing, quorum, PACELC, WAL, B-tree vs LSM, SOLID, CAP, saga, outbox, CRDTs & more + 17 LLD algorithms (Luhn, Dijkstra, A*, trie, LRU, HLL…) |

---

## 🗂️ Topics

### 📺 Streaming & Media

| # | Topic | File |
| --- | ------- | ------ |
| 1 | Hotstar (Live Streaming) | [View](system-design-hotstar.md) |
| 2 | Netflix (Video Streaming) | [View](system-design-netflix.md) |
| 3 | YouTube (Video Streaming) | [View](system-design-youtube.md) |
| 4 | Video Conferencing (Zoom) | [View](system-design-video-conferencing.md) |
| 5 | Spotify (Music Streaming) | [View](system-design-spotify.md) |

### 💬 Social & Messaging

| # | Topic | File |
| --- | ------- | ------ |
| 1 | Twitter / X | [View](system-design-twitter.md) |
| 2 | Instagram | [View](system-design-instagram.md) |
| 3 | LinkedIn | [View](system-design-linkedin.md) |
| 4 | Messaging App (WhatsApp) | [View](system-design-messaging-app.md) |

### 🛒 E-Commerce & Booking

| # | Topic | File |
| --- | ------- | ------ |
| 1 | E-Commerce (Amazon) | [View](system-design-ecommerce.md) |
| 2 | Ticketing (BookMyShow) | [View](system-design-ticketing-system.md) |
| 3 | IRCTC (Railway Booking) | [View](system-design-irctc.md) |
| 4 | Food Delivery (Zomato) | [View](system-design-food-delivery.md) |
| 5 | Smart Parking System | [View](system-design-parking-system.md) |
| 6 | Airbnb (Rental Marketplace) | [View](system-design-airbnb.md) |

### 🚗 Transportation

| # | Topic | File |
| --- | ------- | ------ |
| 1 | Uber (Ride-Hailing) | [View](system-design-uber.md) |
| 2 | Metro Ticketing System | [View](system-design-metro-ticketing.md) |
| 3 | Proximity Service | [View](system-design-proximity-service.md) |
| 4 | Google Maps (Navigation) | [View](system-design-google-maps.md) |

### 🏗️ Infrastructure

| # | Topic | File |
| --- | ------- | ------ |
| 1 | Rate Limiter | [View](system-design-rate-limiter.md) |
| 2 | URL Shortener (bit.ly) | [View](system-design-url-shortener.md) |
| 3 | Web Crawler | [View](system-design-web-crawler.md) |
| 4 | Search Autocomplete | [View](system-design-search-autocomplete.md) |
| 5 | Notification System | [View](system-design-notification-system.md) |
| 6 | File Storage (Google Drive) | [View](system-design-file-storage.md) |
| 7 | Distributed Cache (Redis) | [View](system-design-distributed-cache.md) |
| 8 | Key-Value Store (DynamoDB) | [View](system-design-key-value-store.md) |
| 9 | Pastebin | [View](system-design-pastebin.md) |

### 🤝 Collaborative & Productivity

| # | Topic | File |
|---|-------|------|
| 1 | Google Docs (Collaborative Editing) | [View](system-design-google-docs.md) |

### 💘 Dating

| # | Topic | File |
|---|-------|------|
| 1 | Tinder (Dating App) | [View](system-design-tinder.md) |

### 💳 Finance

| # | Topic | File |
|---|-------|------|
| 1 | Payment System (Stripe) | [View](system-design-payment-system.md) |

### ⏰ Scheduling

| # | Topic | File |
|---|-------|------|
| 1 | Delayed Job Scheduler | [View](system-design-delayed-job-scheduler.md) |

---

## 🧰 Technology Feature Guides
The four guides cover the technology stack behind the design documents, each with runnable examples:

| # | Guide | Highlights | File |
| --- | ----- | ---------- | ------ |
| 1 | **PostgreSQL** | Data types, constraints, 10+ index types, triggers, LISTEN/NOTIFY pub-sub, PL/pgSQL functions, CTEs, window functions, full-text search, JSONB + SQL/JSON, upsert/RETURNING, MVCC & isolation, locks, materialized views (caching), partitioning, replication + PITR, CDC, VACUUM, extensions, row/column security, FDWs | [View](postgresql-features.md) |
| 2 | **Redis** | 15+ data structures (incl. JSON, Time Series, Vector sets), caching patterns & eviction, distributed locking, rate limiting, Pub/Sub, Streams, delayed queues, transactions, Lua, pipelining, ACL security, persistence, Sentinel/Cluster | [View](redis-features.md) |
| 3 | **Kafka** | Topics/partitions/offsets, producers & acks, consumer groups, ordering, exactly-once, replication/ISR, retention vs compaction, Connect + CDC, Kafka Streams, Schema Registry, DLQs, security | [View](kafka-features.md) |
| 4 | **Core Concepts** | Sharding, consistent hashing, CAP, ACID vs BASE, SOLID, CQRS, event sourcing, saga, outbox, idempotency, circuit breaker, rate limiting, load balancing, leader election, replication, caching, bloom filters, gossip, vector clocks, Merkle trees, consensus, 2PC, CRDTs, event-driven architecture, DLQ, backpressure, quorum reads & writes, consistency models, PACELC, WAL, B-tree vs LSM, checksums, distributed locking, service discovery, API gateway vs service mesh, CDN, distributed tracing, retries & backoff, timeouts & hedging, logical clocks, fan-out, hot keys, optimistic concurrency, SLI/SLO, multi-region DR, deployment strategies, geospatial indexing, plus 17 classic algorithms with runnable JS (Luhn, Dijkstra, A*, BFS/DFS, topological sort, union-find, trie, LRU cache, external sort, reservoir sampling, count-min sketch, HyperLogLog, Levenshtein, KMP/Rabin-Karp, haversine, Base62/Snowflake, sliding window) — each with an example | [View](system-design-concepts.md) |

---

## 📐 Document Structure

Each **system design** document follows a consistent **15-section template**:

1. Overview
2. Requirements
3. High-Level Architecture
4. Microservices
5. Database Design
6. Scaling Tiers (1K-10K, 10K-1M, 1M-10M+)
7. Key Techniques & Patterns
8. Key Design Decisions
9. Failure Modes & Recovery
10. Cost Estimation
11. Trade-off Analysis
12. Key Metrics to Monitor
13. Deep Dive Prompts
14. Common Interview Follow-ups
15. Low-Level Design (Algorithms & Data Structures)

Each **feature guide** follows its own reference layout: a table of contents, a feature-by-feature catalog with runnable examples (SQL / `redis-cli` / Kafka CLI / code), trade-off tables, and links to the related system design documents.

---

### Diagram Style (Archify)

Every architecture diagram is an [Archify](https://github.com/tt-a1i/archify) diagram: a typed JSON spec in `diagrams/json/`, validated against Archify's showcase quality profile (no label overlaps, no edge crossings, no ambiguous corridors), then rendered two ways:

- **Inline SVG** — embedded directly in each Markdown file (GitHub-safe, light theme) so the diagram is visible without leaving the doc.
- **Interactive HTML** — a self-contained file (pan/zoom, search, dark/light theme, PNG/SVG export) linked right below the SVG, organized in topic folders:

| Folder | Contents |
| ------ | -------- |
| `diagrams/system-design/` | One architecture diagram per system-design doc |
| `diagrams/concepts/` | Sharding, replication, quorum concept diagrams |
| `diagrams/features/` | Kafka / Redis / PostgreSQL at-a-glance + the Redis AI-infrastructure set |
| `diagrams/template.html` | Reference architecture template (below) |
| `diagrams/json/` | Editable specs — the source of truth for regeneration |

Regenerate everything after editing a spec: `node tools/convert-mermaid.mjs && node tools/archify-all.mjs validate && node tools/archify-all.mjs deliver` (tools `embed-svg.mjs` refreshes the inline SVGs).
> **Shared theme:** every diagram opens with the same `%%{init}%%` header (below), pinning `theme: base` plus explicit colors for boundary boxes, edges, and text. GitHub and VS Code all honor this directive, so the diagrams render identically in light and dark viewers — no theme-dependent colors are left to the renderer.
 — C4's hierarchy and boundaries without Structurizr/PlantUML, which don't render natively in GitHub Markdown.

| Component type | Meaning | Renders as |
| -------------- | ------- | ---------- |
| `external` | Humans / external clients | Stadium, green |
| `backend` | Services, workers, gateways | Rectangle, indigo |
| `database` | Databases, caches, buckets | Rectangle, violet |
| `messagebus` | Kafka / event bus | Rectangle, orange |
| `cloud` | Control plane (mesh, ops, DR) | Rectangle, sky |
| Boundary | `{ kind: "region", wraps: [...] }` | Dashed region |
| Emphasis edge | `variant: "emphasis"` | The one main path |
| Dashed edge | `variant: "dashed"` | Control plane / monitoring |

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1762" width="900" role="img" aria-label="Reference Architecture Template">
<rect x="0" y="0" width="960" height="1762" fill="#ffffff"/>
<title>Reference Architecture Template</title>
<rect x="52" y="288" width="201" height="1374" rx="10" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6 4"/>
<text x="66" y="308" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="12" fill="#475569">System Name</text>
<path d="M153 132 L153 156 L169 156 L169 298 L153 298 L153 322" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M153 384 L153 574" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M153 636 L153 660 L169 660 L169 802 L153 802 L153 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M153 888 L153 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M153 1140 L153 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M153 1392 L153 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<rect x="79" y="70" width="148" height="62" rx="9" fill="#ecfdf5" stroke="#059669" stroke-width="1.6"/>
<text x="153" y="106" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#065f46">Web / Mobile</text>
<rect x="72" y="322" width="161" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="152.5" y="358" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">WAF / API Gateway</text>
<rect x="70" y="574" width="165" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="152.5" y="610" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Load Balancer (ALB)</text>
<rect x="79" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="153" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Service A</text>
<rect x="79" y="1582" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="153" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Workers</text>
<rect x="74" y="1078" width="158" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="153" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">PostgreSQL + Redis</text>
<rect x="79" y="1330" width="148" height="62" rx="9" fill="#fff7ed" stroke="#ea580c" stroke-width="1.6"/>
<text x="153" y="1366" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#9a3412">Kafka</text>
<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/template.html](diagrams/template.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


Every diagram closes with a caption: `*Solid = data flow, dashed = control plane / monitoring.*`

## 📈 Scaling Tiers

Every system design document includes infrastructure recommendations at three scale levels:

| Tier | Users | Focus |
| ------ | ------- | ------- |
| **Tier 1** | 1K - 10K | MVP / Prototype |
| **Tier 2** | 10K - 1M | Growth Phase |
| **Tier 3** | 1M - 10M+ | Global Scale |

---

## 🛠️ Technology Stack
The technologies referenced across the system design documents:

| Category | Technologies |
| ---------- | ------------- |
| **Databases** | PostgreSQL, MongoDB, Cassandra, DynamoDB, Redis, Elasticsearch, Neo4j |
| **Message Queues** | Kafka, RabbitMQ, Redis Streams |
| **Caching** | Redis, Memcached |
| **CDN** | CloudFront, Akamai, Fastly |
| **Compute** | AWS EC2, ECS, EKS, Lambda |
| **Load Balancers** | ALB, NLB, NGINX |
| **Monitoring** | Prometheus, Grafana, Jaeger |
| **Storage** | S3, GCS, HDFS |
| **Geospatial** | PostGIS, Google Maps API, Geohash |
| **Search** | Elasticsearch, Apache Solr |

---

## ⚙️ Key Algorithms Implemented (JavaScript)
Executable JavaScript implementations of the algorithms used across the designs:

| Algorithm | File | Use Case |
| ----------- | ------ | ---------- |
| Haversine Distance | food-delivery | Driver proximity calculation |
| Token Bucket | rate-limiter | API rate limiting |
| Base62 Encoding | url-shortener, pastebin | Short URL generation |
| Elo Rating System | tinder | Match scoring |
| Luhn Algorithm | payment-system | Credit card validation |
| Sliding Window Counter | rate-limiter | Request throttling |
| Tatkal Seat Allocation | irctc | Atomic seat booking |
| Waitlist Priority Queue | irctc | Waitlist/RAC management |
| PNR Status Tracker | irctc | Event-sourced status |
| Fare Calculator | irctc | Dynamic pricing |
| Saga Orchestrator | irctc | Distributed transactions |
| LRU Cache | distributed-cache | Cache eviction |
| Consistent Hash Ring | distributed-cache, key-value-store | Distributed data placement |
| Vector Clock | key-value-store | Causal ordering |
| OT Engine | google-docs | Collaborative editing |
| Feed Generator | linkedin, instagram | Fan-out on read |
| URL Generator | pastebin | Short paste URLs |
| BFS Crawler | web-crawler | Web page traversal |
| Geohash Encoder | proximity-service | Location indexing |
| Surge Pricing | uber, food-delivery | Dynamic pricing |

---

## 🧠 Key Techniques & Patterns

| Technique | Description | Used In |
| ----------- | ------------- | ---------- |
| Consistent Hashing | Distributed key distribution | distributed-cache, key-value-store, rate-limiter |
| Redis Caching | In-memory data store for hot data | All systems |
| SOLID Principles | Single Responsibility, Open/Closed, etc. | All microservices |
| CAP Theorem | Consistency vs Availability trade-offs | key-value-store, distributed-cache |
| Event-Driven Architecture | Kafka/RabbitMQ for async | All systems |
| CQRS | Command Query Responsibility Segregation | google-docs, netflix, linkedin |
| Event Sourcing | Immutable event log | irctc, google-docs, linkedin |
| Saga Pattern | Distributed transaction management | irctc, ecommerce, payment-system |
| Circuit Breaker | Graceful degradation on failure | All systems |
| Rate Limiting | Token bucket, sliding window | rate-limiter, all API gateways |
| Geospatial Indexing | Geohash, PostGIS | uber, food-delivery, google-maps |
| WebSockets | Real-time bidirectional | messaging-app, google-docs, video-conferencing |
| CDN Edge Caching | Content delivery at edge | hotstar, netflix, youtube, file-storage |
| Microservices | Service decomposition by domain | All systems |
| Database Sharding | Horizontal partitioning | ecommerce, payment-system, key-value-store |
| Idempotency | Prevent duplicate operations | payment-system, irctc, ticketing-system |
| LRU/LFU Eviction | Cache eviction strategies | distributed-cache, url-shortener, pastebin |
| Vector Clocks | Causal ordering | key-value-store |
| Merkle Trees | Inconsistency detection | key-value-store, distributed-cache |
| Gossip Protocol | Membership and failure detection | key-value-store, distributed-cache |
| Fan-out on Read | Feed generation at read time | linkedin, instagram, twitter |
| Graph Traversal | Relationship queries | linkedin, instagram (Neo4j) |
| Base62 Encoding | Short URL generation | url-shortener, pastebin |

> 💡 Every technique listed above is explained with a basic example in [System Design Concepts](system-design-concepts.md) and the technology feature guides.

---

## 🚀 How to Use

1. **Browse by topic** — click any link in the tables above.
2. **Study scaling** — each system design doc shows infrastructure at 3 scale tiers.
3. **Review LLD** — all code examples are executable JavaScript.
4. **Master the technology** — read the PostgreSQL / Redis / Kafka guides before their system design docs.
5. **Interview prep** — each document includes common follow-up Q&A.
6. **Understand patterns** — concepts are explained with examples in the Concepts guide.

---

## 🤝 Contributing

To add a new document:

1. **System design**: create `system-design-<topic>.md`, follow the 15-section template, include executable JavaScript in the LLD section, add an Archify diagram: author `diagrams/json/<topic>.architecture.json` (copy `template.architecture.json` as a starting point), validate with `node tools/archify-all.mjs validate`, deliver with `node tools/archify-all.mjs deliver`, and embed the inline SVG via `node tools/embed-svg.mjs` ([Diagram Style](#diagram-style-archify)), and add the topic to this README.
2. **Feature guide**: create `<technology>-features.md` (e.g. `mongodb-features.md`), follow the catalog layout used by the PostgreSQL/Redis/Kafka guides (TOC → feature sections with examples → takeaways → related docs), and add it to the *Technology Feature Guides* table.
3. Verify the Markdown structure and code examples locally.

---
