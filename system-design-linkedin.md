<div align="center">

# System Design: LinkedIn (Professional Networking Platform)

</div>

> [!TIP]
> **TL;DR** — Professional networking platform with job matching, feed, messaging, learning, and recruiter tools for 900M+ members.

## Overview

Professional networking platform with job matching, feed, messaging, learning, and recruiter tools for 900M+ members.

### Key Numbers

| Metric | Value |
| :--- | :--- |
| **members, 55M+ companies, 20M+ job postings** | 900M+ |
| **Feed P** | 99 < 200ms, 10M+ messages/day |

---

## Requirements

### Functional Requirements

- Professional profile with experience, skills, education
- Connection requests and professional graph
- Personalized news feed with posts and articles
- Job search, Easy Apply, and alerts
- InMail messaging and chat
- Learning courses and certifications

### Non-Functional Requirements

| Attribute | Target |
| :--- | :--- |
| **Latency** | Feed < 200ms, Search < 100ms |
| **Throughput** | 10M+ concurrent users |
| **Availability** | 99.99% |
| **Scale** | 900M+ members |

---

## High-Level Architecture

### Architecture Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1762" width="900" role="img" aria-label="Linkedin — System Architecture">
<rect x="0.5" y="0.5" width="959" height="1761" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
<title>Linkedin — System Architecture</title>
<rect x="52" y="288" width="710" height="1374" rx="14" fill="none" stroke="#cbd5e1" stroke-width="1.3" stroke-dasharray="7 5"/>
<rect x="64" y="296" width="77.6" height="20" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
<text x="102.8" y="310" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" fill="#475569">LinkedIn</text>
<path d="M407 132 L407 156 L424 156 L424 298 L408 298 L408 322" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-linkedin)"/>
<path d="M408 384 L408 574" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-linkedin)"/>
<path d="M388 636 L388 731 L149 731 L149 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-linkedin)"/>
<path d="M408 636 L408 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-linkedin)"/>
<path d="M428 636 L428 731 L665 731 L665 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-linkedin)"/>
<path d="M149 888 L149 912 L165 912 L165 1054 L144 1054 L144 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-linkedin)"/>
<path d="M407 888 L407 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-linkedin)"/>
<path d="M665 888 L665 912 L686 912 L686 1054 L670 1054 L670 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-linkedin)"/>
<path d="M144 1140 L144 1235 L387 1235 L387 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-linkedin)"/>
<path d="M407 1140 L407 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-linkedin)"/>
<path d="M670 1140 L670 1235 L427 1235 L427 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-linkedin)"/>
<path d="M387 1392 L387 1487 L149 1487 L149 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-linkedin)"/>
<path d="M407 1392 L407 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-linkedin)"/>
<path d="M427 1392 L427 1487 L665 1487 L665 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-linkedin)"/>
<rect x="333" y="73" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="333" y="70" width="148" height="62" rx="12" fill="#ecfdf5" stroke="#10b981" stroke-width="1.4"/>
<rect x="336" y="73" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="407" y="106" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#064e3b">Web App</text>
<rect x="327" y="325" width="161" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="327" y="322" width="161" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="330" y="325" width="155" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="407.5" y="358" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">WAF / API Gateway</text>
<rect x="325" y="577" width="165" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="325" y="574" width="165" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="328" y="577" width="159" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="407.5" y="610" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Load Balancer (ALB)</text>
<rect x="75" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="75" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="78" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="149" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Feed Service</text>
<rect x="333" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="333" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="336" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="407" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Connection Svc</text>
<rect x="591" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="591" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="594" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="665" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Job Service</text>
<rect x="75" y="1585" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="75" y="1582" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="78" y="1585" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="149" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Feed Workers</text>
<rect x="333" y="1585" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="333" y="1582" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="336" y="1585" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="407" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Analytics</text>
<rect x="591" y="1585" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="591" y="1582" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="594" y="1585" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="665" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Notifications</text>
<rect x="70" y="1081" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="70" y="1078" width="148" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="73" y="1081" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="144" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Fan-out + Redis</text>
<rect x="328" y="1081" width="158" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="328" y="1078" width="158" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="331" y="1081" width="152" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="407" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">PostgreSQL + Neo4j</text>
<rect x="596" y="1081" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="596" y="1078" width="148" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="599" y="1081" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="670" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Elasticsearch</text>
<rect x="333" y="1333" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="333" y="1330" width="148" height="62" rx="12" fill="#fff7ed" stroke="#f97316" stroke-width="1.4"/>
<rect x="336" y="1333" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="407" y="1366" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#7c2d12">Kafka</text>
<defs><marker id="arr-linkedin" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker><marker id="arrEm-linkedin" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#10b981"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/system-design/linkedin.architecture.html](diagrams/system-design/linkedin.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


*Solid = data flow, dashed = control plane / monitoring.*

### Data Flow

1. User posts update - Feed Service fans out to connections feeds
2. Connection suggestions: Neo4j graph traversal (2nd-degree)
3. Job matching: ML model matches profile to job postings
4. Feed ranking: ML sorts by relevance, recency, engagement
5. InMail: messaging via WebSocket (read receipts, typing)
6. Kafka events: post, like, connection - Analytics
7. Notifications: job alerts, connection requests, endorsements

## Microservices
How the system is decomposed into independently deployed services:

| Service | Tech Stack | Database | Pattern |
| --------- | ------------ | ---------- | ---------- |
| Feed Service | Node.js | Redis + Cassandra | Fan-out on Read |
| Connection Service | Go | Neo4j | Graph Traversal |
| Job Service | Java Spring Boot | PostgreSQL + ES | Saga + CQRS |
| Messaging Service | Elixir/Phoenix | Cassandra | WebSocket |
| Search Service | Go | Elasticsearch | BM25 + ML |
| Learning Service | Node.js | PostgreSQL | Event Sourcing |
| Notification Service | Go | Redis Queue | Fan-out |
| Profile Service | Java | PostgreSQL + Redis | CQRS |

---

## Database Design

### PostgreSQL (Relational)

```sql
CREATE TABLE profiles (
    profile_id    BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    headline      VARCHAR(200),
    summary       TEXT,
    location      VARCHAR(100),
    industry      VARCHAR(100),
    profile_pic   VARCHAR(500),
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE experiences (
    experience_id BIGSERIAL PRIMARY KEY,
    profile_id    BIGINT REFERENCES profiles(profile_id),
    title         VARCHAR(200),
    company       VARCHAR(200),
    location      VARCHAR(100),
    start_date    DATE,
    end_date      DATE,
    description   TEXT
);

CREATE TABLE connections (
    connection_id  BIGSERIAL PRIMARY KEY,
    requester_id   BIGINT NOT NULL,
    connectee_id   BIGINT NOT NULL,
    status         VARCHAR(20) DEFAULT pending,
    created_at     TIMESTAMP DEFAULT NOW(),
    UNIQUE(requester_id, connectee_id)
);

CREATE TABLE jobs (
    job_id        BIGSERIAL PRIMARY KEY,
    company_id    BIGINT NOT NULL,
    title         VARCHAR(200),
    description   TEXT,
    location      VARCHAR(200),
    salary_min    INT,
    salary_max    INT,
    job_type      VARCHAR(50),
    posted_at     TIMESTAMP DEFAULT NOW(),
    status        VARCHAR(20) DEFAULT active
);
```

### Cassandra (Wide Column)

```sql
CREATE TABLE feed_items (
    user_id      BIGINT,
    feed_type    VARCHAR(20),
    created_at   TIMESTAMP,
    post_id      BIGINT,
    author_id    BIGINT,
    content      TEXT,
    like_count   INT,
    comment_count INT,
    PRIMARY KEY ((user_id, feed_type), created_at)
);

CREATE TABLE messages (
    thread_id    UUID,
    sender_id    BIGINT,
    message_id   TIMEUUID,
    content      TEXT,
    msg_type     VARCHAR(20),
    PRIMARY KEY ((thread_id), message_id)
);
```

### Redis

```bash
feed:{user_id}         -> SortedSet
profile:{profile_id}   -> Hash
connection:{user_id}   -> Set
online:{user_id}       -> String with TTL
rate_limit:{user_id}   -> Hash
```

---

## Scaling Tiers
How the architecture grows from MVP to global scale:

| Tier | Users | Infrastructure | Monthly Cost |
| ------ | ------- | --------------- | ------------- |
| 1K-10K | 10K | 2 Node.js + PG + Redis | $300 |
| 10K-1M | 1M | 10 app + PG cluster + Redis + ES | $15,000 |
| 1M-10M+ | 10M+ | 50+ app + sharded PG + Cassandra + Neo4j | $500,000 |

---

## Key Techniques & Patterns

- **Fan-out on Read**: Feed generated at read time for regular users
- **Consistent Hashing**: Distribute feed data across Redis cluster
- **Redis Caching**: Hot profiles cached, LRU eviction
- **SOLID Principles**: Each microservice owns its domain
- **CAP Theorem**: CP for connections, AP for feed
- **Graph Database (Neo4j)**: 2nd-degree connections
- **Event-Driven Architecture**: Kafka events for feed updates
- **CQRS**: Separate read/write paths

---

## Key Design Decisions

1. **Fan-out on Read vs Write**: Read for regular users, Write for influencers
2. **Neo4j vs PostgreSQL**: Neo4j for complex graph traversals
3. **Cassandra for Messages**: Write-heavy, time-series pattern
4. **Elasticsearch for Jobs**: Full-text search with faceted filtering

---

## Failure Modes & Recovery
What can go wrong in production, and how the system detects and recovers:

| Failure | Impact | Mitigation |
| --------- | -------- | ----------- |
| Redis Cache Failure | Feed slow | Read replica + failover |
| Neo4j Crash | No graph traversal | Replicated cluster |
| Kafka Broker Down | Events delayed | Multi-broker + RF=3 |
| ES Cluster Split | Search degraded | Multi-node + replicas |
| Fan-out Storm | Spike after viral post | Rate limit + async queue |

---

## Cost Estimation (1M Users)
Rough monthly cost of running this design for one million users:

| Component | Configuration | Monthly Cost |
| ----------- | -------------- | ------------- |
| App Servers (10x) | c5.2xlarge | $3,500 |
| PostgreSQL | r5.xlarge | $2,000 |
| Cassandra (6 nodes) | i3.xlarge | $4,300 |
| Redis (6 nodes) | r5.xlarge | $3,200 |
| Neo4j (3 nodes) | r5.2xlarge | $3,600 |
| Elasticsearch (6) | r5.xlarge | $4,300 |
| Kafka (6 brokers) | m5.xlarge | $2,500 |
| CDN + LB | CloudFront + ALB | $800 |
| **Total** | | **~$24,200** |

---

## Trade-off Analysis
The alternatives considered, and which one won and why:

| Decision | Option A | Option B | Choice | Why |
| ---------- | ---------- | ---------- | -------- | ----- |
| Feed Model | Fan-out on write | Fan-out on read | Hybrid | Write for <1K followers |
| Graph DB | Neo4j | PostgreSQL | Neo4j | Complex traversals |
| Messages | PostgreSQL | Cassandra | Cassandra | Write-heavy, TTL |
| Search | PG FTS | Elasticsearch | ES | Faceted search + ML |
| Real-time | Polling | WebSocket | WebSocket | Low latency |

---

## Key Metrics to Monitor

1. Feed P50/P99 latency (target: <200ms)
2. Connection recommendation accuracy
3. Job match rate (applied / viewed)
4. Message delivery latency
5. Feed freshness (seconds since latest post)
6. Search relevance score (NDCG)
7. Kafka consumer lag
8. Cache hit rate (Redis)
9. Daily active users / DAU ratio
10. Connection request acceptance rate

---

## Deep Dive Prompts

1. How would you design the LinkedIn feed to handle both regular users and influencers with 10M+ followers?
2. How would you implement People You May Know recommendations using graph traversals?
3. How would you handle the job matching algorithm at scale?
4. How would you design real-time messaging with read receipts?
5. How would you implement LinkedIn search with faceted filtering and ML ranking?

---

## Common Interview Follow-ups

1. How would you handle a viral post from a celebrity reaching 10M followers?
2. How would you implement Open to Work feature efficiently?
3. How would you design LinkedIn Learning course recommendations?
4. How would you handle duplicate job postings across companies?
5. How would you implement the professional graph for recruiter tools?

---

## Low-Level Design (LLD) - Algorithms & Data Structures

### Fan-out on Read Feed Generator

```text
class FeedGenerator {
  constructor(redis, db) {
    this.redis = redis;
    this.db = db;
  }

  async generateFeed(userId, page = 0, limit = 20) {
    const cacheKey = "feed:" + userId;
    const start = page * limit;
    const end = start + limit - 1;

    const cachedIds = await this.redis.zrevrange(cacheKey, start, end);
    if (cachedIds.length > 0) {
      return this.db.getPostsByIds(cachedIds);
    }

    const connections = await this.db.getConnections(userId);
    const recentPosts = await this.db.getRecentPosts(connections, 100);

    const scored = recentPosts.map(post => ({
      ...post,
      score: this.calculateScore(post, userId)
    }));
    scored.sort((a, b) => b.score - a.score);

    await this.redis.del(cacheKey);
    for (const post of scored.slice(0, 500)) {
      await this.redis.zadd(cacheKey, post.score, post.postId);
    }
    await this.redis.expire(cacheKey, 3600);

    return scored.slice(start, start + limit);
  }

  calculateScore(post, userId) {
    const recency = Math.max(0, 1 - (Date.now() - post.timestamp) / (24 * 3600 * 1000));
    const affinity = post.authorId === userId ? 1 : 0.5;
    const engagement = Math.log(post.likeCount + post.commentCount + 1);
    return recency * 0.4 + affinity * 0.3 + engagement * 0.3;
  }
}

const feed = new FeedGenerator(); console.log("Feed generator ready");
```
