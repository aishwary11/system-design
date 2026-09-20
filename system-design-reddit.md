<div align="center">

# System Design: Reddit (Threaded Discussions & Ranking)

</div>

> [!TIP]
> **TL;DR** — A community/link-aggregation platform: threaded comment trees, vote-based ranking with time decay, per-subreddit feeds, and moderation. Distinct from Twitter/Instagram because the core object is a **mutable tree**, not a flat feed.

## Overview

Users post links/text to subreddits; others vote and reply **in nested threads**. Feeds rank by score decayed over time (the classic Reddit "hot" algorithm), comment trees render lazily, and moderation (removal, locking, flair) mutates content after the fact. The design problems: hierarchical storage, decaying ranking, vote dedup, and vote-brigading defense.

### Key Numbers

| Metric | Value |
| :--- | :--- |
| **Posts/day** | 2M+ |
| **Comments/day** | 25M+ (trees avg depth 5, max 30+) |
| **Votes/day** | 100M+ |
| **Subreddits** | 100K+ active, 15K+ highly active |

---

## Requirements

### Functional Requirements

- Create posts (link/text) in subreddits; edit/delete later
- Nested commenting (reply-to-reply, arbitrary depth)
- Upvote/downvote posts and comments; change/cancel votes
- Feeds: home (subscribed), r/all, per-subreddit; sorted hot/new/top/rising
- Moderation: remove, lock, ban, flair, distinguishing mod actions

### Non-Functional Requirements

| Attribute | Target |
| :--- | :--- |
| **Vote latency** | counted within seconds, but ranking updates batched |
| **Feed latency** | < 200ms P99 |
| **Comment tree render** | lazy-load by depth — never load a 10K-comment tree at once |
| **Consistency** | eventual for scores; strong for vote dedup per user |

---

## High-Level Architecture

### Architecture Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1762" width="900" role="img" aria-label="Reddit — System Architecture">
<rect x="0.5" y="0.5" width="959" height="1761" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
<rect x="52" y="288" width="713" height="1374" rx="14" fill="none" stroke="#cbd5e1" stroke-width="1.3" stroke-dasharray="7 5"/>
<rect x="64" y="296" width="63.2" height="20" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
<text x="95.6" y="310" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" fill="#475569">Reddit</text>
<path d="M409 132 L409 156 L425 156 L425 298 L409 298 L409 322" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-reddit)"/>
<path d="M409 384 L409 574" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-reddit)"/>
<path d="M389 636 L389 731 L151 731 L151 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-reddit)"/>
<path d="M409 636 L409 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-reddit)"/>
<path d="M429 636 L429 731 L667 731 L667 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-reddit)"/>
<path d="M151 888 L151 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-reddit)"/>
<path d="M409 888 L409 912 L430 912 L430 1054 L414 1054 L414 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-reddit)"/>
<path d="M667 888 L667 912 L688 912 L688 1054 L672 1054 L672 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-reddit)"/>
<path d="M151 1140 L151 1235 L389 1235 L389 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-reddit)"/>
<path d="M409 1140 L409 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-reddit)"/>
<path d="M672 1140 L672 1235 L429 1235 L429 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-reddit)"/>
<path d="M389 1392 L389 1487 L146 1487 L146 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-reddit)"/>
<path d="M409 1392 L409 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-reddit)"/>
<path d="M429 1392 L429 1487 L668 1487 L668 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-reddit)"/>
<rect x="335" y="73" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="335" y="70" width="148" height="62" rx="12" fill="#ecfdf5" stroke="#10b981" stroke-width="1.4"/>
<rect x="338" y="73" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="409" y="106" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#064e3b">Web / Mobile</text>
<rect x="328" y="325" width="161" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="328" y="322" width="161" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="331" y="325" width="155" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="408.5" y="358" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">WAF / API Gateway</text>
<rect x="326" y="577" width="165" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="326" y="574" width="165" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="329" y="577" width="159" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="408.5" y="610" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Load Balancer (ALB)</text>
<rect x="77" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="77" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="80" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="151" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Content Svc</text>
<rect x="335" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="335" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="338" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="409" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Vote Svc</text>
<rect x="593" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="593" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="596" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="667" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Feed Svc</text>
<rect x="72" y="1081" width="158" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="72" y="1078" width="158" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="75" y="1081" width="152" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="151" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Cassandra</text>
<rect x="340" y="1081" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="340" y="1078" width="148" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="343" y="1081" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="414" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Redis Scores</text>
<rect x="598" y="1081" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="598" y="1078" width="148" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="601" y="1081" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="672" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">PostgreSQL Mods</text>
<rect x="335" y="1333" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="335" y="1330" width="148" height="62" rx="12" fill="#fff7ed" stroke="#f97316" stroke-width="1.4"/>
<rect x="338" y="1333" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="409" y="1366" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#7c2d12">Kafka</text>
<rect x="70" y="1585" width="151" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="70" y="1582" width="151" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="73" y="1585" width="145" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="145.5" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Score Updaters</text>
<rect x="331" y="1585" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="331" y="1582" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="334" y="1585" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="405" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Ranking Workers</text>
<rect x="589" y="1585" width="158" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="589" y="1582" width="158" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="592" y="1585" width="152" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="668" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Mod Audit Workers</text>
<defs><marker id="arr-reddit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker><marker id="arrEm-reddit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#10b981"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/system-design/reddit.architecture.html](diagrams/system-design/reddit.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


**Interactive diagram:** [diagrams/system-design/reddit.architecture.html](diagrams/system-design/reddit.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.

### Data Flow

1. Post/comment writes go to Content Service → Cassandra (partitioned by post/subreddit)
2. Votes go to Vote Service: one vote per (user, target) enforced via Cassandra LWT; emitted to Kafka
3. Score aggregates updated in Redis; hot-rank scores recomputed on a schedule (every few minutes per post, decaying)
4. Feed queries fan out to per-subreddit post lists (cached), merge and rank at read time
5. Comment trees fetched by `post_id` page-by-page (depth pagination), cached hot paths
6. Moderation actions mutate content rows and emit audit events

## Microservices

| Service | Tech Stack | Database | Pattern |
| --------- | ------------ | ---------- | ---------- |
| Content Service | Java | Cassandra | Tree storage |
| Vote Service | Go | Cassandra LWT + Redis | Idempotency |
| Feed Service | Go | Redis + Cassandra | Fan-out on read |
| Ranking Service | Python | Redis | Time-decay scoring |
| Mod Service | Java | PostgreSQL | Audit log |

---

## Database Design

### Cassandra

```
posts:            PK (subreddit, bucket, post_id) bucket by month
comments_by_post: PK (post_id, parent_path, comment_id)
                  parent_path = materialized path "root.1.4.2"
votes:            PK (target_id, user_id) -> dir(+1/-1)  (dedup + LWT)
scores:           PK (post_id) -> upvotes, downvotes, hot_score
```

### Redis

```bash
feed:{subreddit}:{sort}   -> ZSET of post_ids by score
hot:{post_id}             -> cached hot score
tree:{post_id}:{page}     -> cached comment tree page (TTL 30s)
```

---

## Scaling Tiers

| Tier | Users | Infrastructure | Monthly Cost |
| ------ | ------- | -------------- | ------------- |
| 1K-10K | 10K | 2 app + PostgreSQL (posts, comments, votes) | $300 |
| 10K-1M | 1M | 6 app + Cassandra 3 + Redis + Kafka | $6,000 |
| 1M-10M+ | 10M+ | 20 app + Cassandra 12 + Redis cluster + Kafka + ES search | $60,000 |

---

## Key Techniques & Patterns

- **Time-decay ranking**: hot = f(score, age) — the signature algorithm (below)
- **Materialized paths**: comment trees stored as `parent_path` strings for subtree queries
- **Idempotency**: one vote per user per target via LWT / conditional insert
- **Fan-out on Read**: feeds ranked at request time from cached post lists
- **Hot Keys & Thundering Herd**: viral posts cached aggressively, request coalescing
- **Event-Driven Architecture**: vote events → score updater → ranking recompute

---

## Key Design Decisions

1. **Cassandra for comments/votes**: write-heavy, huge volume, query-by-key access patterns
2. **Materialized path over adjacency list**: subtree fetch = one range scan, no recursion
3. **Batched ranking recompute**: voting is high-frequency; re-ranking every vote is waste — decaying scores recomputed on a timer
4. **Lazy tree pagination**: never materialize 10K-comment threads in one response
5. **Separate vote dedup from aggregates**: strict dedup per user, approximate-at-the-edge aggregates

---

## Failure Modes & Recovery

| Failure | Impact | Mitigation |
| --------- | -------- | ----------- |
| Vote dedup fails | Double-counted votes | LWT + reconciliation job |
| Viral post | Tree page cache stampede | Request coalescing + pre-warm on trend signal |
| Cassandra node loss | Partial comment reads | RF=3, hinted handoff, repair |
| Ranking worker down | Stale hot order | Serve last scores with staleness marker |
| Brigade attack | Manipulated ranking | Vote-pattern anomaly detection, rate limits |

---

## Cost Estimation (1M Users)

| Component | Configuration | Monthly Cost |
| ----------- | -------------- | ------------- |
| App (10) | c7g.xlarge | $1,400 |
| Cassandra (6) | i4i.large | $2,500 |
| Redis (3) | cache.r7g.large | $700 |
| Kafka (3) | m7g.large | $900 |
| Elasticsearch | r7g.large ×3 | $800 |
| **Total** | | **~$6,300** |

---

## Trade-off Analysis

| Decision | Option A | Option B | Choice | Why |
| ---------- | ---------- | ---------- | -------- | ----- |
| Comment storage | Adjacency list | Materialized path | Path | Subtree = single scan |
| Vote store | PostgreSQL row lock | Cassandra LWT | LWT | Write volume at scale |
| Feed | Fan-out on write | Fan-out on read | On read | Subreddit-centric, not follower-centric |
| Ranking | Compute per vote | Periodic recompute | Periodic | Decays make per-vote compute pointless |
| Tree render | Full tree JSON | Depth-paginated | Paginated | Threads can hit 10K+ comments |

---

## Key Metrics to Monitor

1. Votes/second, dedup rejection rate
2. Feed latency P99 per sort type
3. Comment tree fetch depth distribution
4. Ranking recompute lag
5. Cache hit ratio on tree/feed caches
6. Vote-ring detection alerts
7. Cassandra read/write latency, repair status

---

## Deep Dive Prompts

1. How would you implement "best" comment sorting (Wilson score, confidence interval)?
2. Design cross-posting without duplicating storage.
3. How do you count views without counting bots?
4. Design subreddit recommendation ("communities you may like").
5. How do you make r/all ranking region- and language-aware?

---

## Common Interview Follow-ups

1. How would you handle a subreddit going viral mid-Sunday? (cache, coalesce, scale read replicas)
2. How do you store edit history for comments? (event sourcing trade-off)
3. How do you prevent vote manipulation rings? (graph clustering — see fraud-detection)
4. Why not Neo4j for comment trees?
5. How do you delete a 1M-comment tree? (tombstone by post_id, async GC)

---

## Low-Level Design (LLD) - Algorithms & Data Structures

### Reddit "Hot" Ranking (time-decayed score)

```text
function hotScore(up, down, postTimeMs) {
  const score = up - down;
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const seconds = (postTimeMs - 1134028003650) / 1000; // Reddit epoch
  return sign * order + seconds / 12500; // 12500s ≈ 3.47h half-life-ish decay
}

// top 3 of (10 up/0 down, 4h old) vs (100 up/5 down, 8h old)
const now = Date.now();
console.log(hotScore(10, 0, now - 4 * 3600e3).toFixed(2));
console.log(hotScore(100, 5, now - 8 * 3600e3).toFixed(2));

// deterministic comment-tree page: depth-first with sibling ordering by score
function flattenTree(comments, parentId = null, depth = 0, out = []) {
  const kids = comments
    .filter(c => c.parent === parentId)
    .sort((a, b) => hotScore(b.up, b.down, b.ts) - hotScore(a.up, a.down, a.ts));
  for (const c of kids) {
    out.push({ id: c.id, depth });
    flattenTree(comments, c.id, depth + 1, out);
  }
  return out;
}
```

### Comment-Tree Materialization (fetch any subtree in one query)

Adjacency lists (`parent_id`) need recursive CTEs per read. Precompute a **path prefix** (`/1/4/17/`) so an entire subtree is a single indexed range scan.

```sql
CREATE TABLE comments (
  comment_id BIGINT PRIMARY KEY,
  post_id    BIGINT NOT NULL,
  parent_id  BIGINT,            -- NULL = top-level
  path       LTREE NOT NULL,    -- 'root.1.4.17'  (ancestor chain of ids)
  depth      INT  NOT NULL,
  score      INT DEFAULT 0,
  body       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON comments (post_id, path);        -- subtree range scan
CREATE INDEX ON comments (post_id, score DESC);  -- "best" ranking

-- entire reply tree under comment 17, depth ≤ 6, in ONE query:
SELECT * FROM comments
WHERE post_id = 42 AND path <@ 'root.1.4.17' AND depth <= 6
ORDER BY path;
```

Why Reddit-style ranking pairs well with this: `score` is denormalized and updated by the vote pipeline; hotness = `log10(max(|score|,1)) + sign(score)·(age_hours)/12.5` — computed at read time per visible page (a page shows ~200 comments, so 200 log() calls beat maintaining a sorted structure per parent). Deletion keeps the row, nulls the body, and flags `deleted` — children keep their path (threads don't vanish).
