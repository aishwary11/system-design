# System Design Documents

32 comprehensive system design documents covering High-Level Architecture (HLD), Low-Level Design (LLD), database design, scaling strategies, and executable JavaScript algorithms.

Each document follows a consistent 15-section template:
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

---

## Topics

### Streaming & Media

| # | Topic | File |
|---|-------|------|
| 1 | Hotstar (Live Streaming) | [View](system-design-hotstar.md) |
| 2 | Netflix (Video Streaming) | [View](system-design-netflix.md) |
| 3 | YouTube (Video Streaming) | [View](system-design-youtube.md) |
| 4 | Video Conferencing (Zoom) | [View](system-design-video-conferencing.md) |
| 5 | Spotify (Music Streaming) | [View](system-design-spotify.md) |

### Social & Messaging

| # | Topic | File |
|---|-------|------|
| 1 | Twitter / X | [View](system-design-twitter.md) |
| 2 | Instagram | [View](system-design-instagram.md) |
| 3 | LinkedIn | [View](system-design-linkedin.md) |
| 4 | Messaging App (WhatsApp) | [View](system-design-messaging-app.md) |

### E-Commerce & Booking

| # | Topic | File |
|---|-------|------|
| 1 | E-Commerce (Amazon) | [View](system-design-ecommerce.md) |
| 2 | Ticketing (BookMyShow) | [View](system-design-ticketing-system.md) |
| 3 | IRCTC (Railway Booking) | [View](system-design-irctc.md) |
| 4 | Food Delivery (Zomato) | [View](system-design-food-delivery.md) |
| 5 | Smart Parking System | [View](system-design-parking-system.md) |
| 6 | Airbnb (Rental Marketplace) | [View](system-design-airbnb.md) |

### Transportation

| # | Topic | File |
|---|-------|------|
| 1 | Uber (Ride-Hailing) | [View](system-design-uber.md) |
| 2 | Metro Ticketing System | [View](system-design-metro-ticketing.md) |
| 3 | Proximity Service | [View](system-design-proximity-service.md) |
| 4 | Google Maps (Navigation) | [View](system-design-google-maps.md) |

### Infrastructure

| # | Topic | File |
|---|-------|------|
| 1 | Rate Limiter | [View](system-design-rate-limiter.md) |
| 2 | URL Shortener (bit.ly) | [View](system-design-url-shortener.md) |
| 3 | Web Crawler | [View](system-design-web-crawler.md) |
| 4 | Search Autocomplete | [View](system-design-search-autocomplete.md) |
| 5 | Notification System | [View](system-design-notification-system.md) |
| 6 | File Storage (Google Drive) | [View](system-design-file-storage.md) |
| 7 | Distributed Cache (Redis) | [View](system-design-distributed-cache.md) |
| 8 | Key-Value Store (DynamoDB) | [View](system-design-key-value-store.md) |
| 9 | Pastebin | [View](system-design-pastebin.md) |

### Collaborative & Productivity

| # | Topic | File |
|---|-------|------|
| 1 | Google Docs (Collaborative Editing) | [View](system-design-google-docs.md) |

### Dating

| # | Topic | File |
|---|-------|------|
| 1 | Tinder (Dating App) | [View](system-design-tinder.md) |

### Finance

| # | Topic | File |
|---|-------|------|
| 1 | Payment System (Stripe) | [View](system-design-payment-system.md) |

### Scheduling

| # | Topic | File |
|---|-------|------|
| 1 | Delayed Job Scheduler | [View](system-design-delayed-job-scheduler.md) |

---

## Scaling Tiers

Every document includes infrastructure recommendations at three scale levels:

| Tier | Users | Focus |
|------|-------|-------|
| **Tier 1** | 1K - 10K | MVP / Prototype |
| **Tier 2** | 10K - 1M | Growth Phase |
| **Tier 3** | 1M - 10M+ | Global Scale |

---

## Technology Stack

| Category | Technologies |
|----------|-------------|
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

## Key Algorithms Implemented (JavaScript)

| Algorithm | File | Use Case |
|-----------|------|----------|
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

## Key Techniques & Patterns Used

| Technique | Description | Used In |
|-----------|-------------|----------|
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

---

## How to Use

1. **Browse by topic** - Click any link in the tables above
2. **Study scaling** - Each document shows infrastructure at 3 scale tiers
3. **Review LLD** - All code examples are executable JavaScript
4. **Interview prep** - Each document includes common follow-up Q&A
5. **Understand patterns** - Each document covers key design patterns used

---

## Contributing

To add a new system design document:
1. Create `system-design-<topic>.md`
2. Follow the 15-section template
3. Include executable JavaScript in LLD section
4. Add a Mermaid architecture diagram
5. Add the topic to this README
6. Verify the Markdown structure and JavaScript examples locally

---
