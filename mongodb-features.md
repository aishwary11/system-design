<div align="center">

# MongoDB — Features Guide with Basic Examples

</div>

A quick-reference catalog of MongoDB features used in document-oriented backends: documents & collections, CRUD, indexes, the aggregation pipeline, schema design (embedding vs referencing), multi-document transactions, change streams, replication, sharding, time-series collections, and performance fundamentals — each with a small, concrete example.

**MongoDB in one line:** a distributed **document database** — you store JSON-like BSON documents, query them with a rich expression language, and scale horizontally with built-in sharding and replica sets. It trades relational joins for flexible schemas and locality.

### Document database at a glance

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 996 1338" width="900" role="img" aria-label="Mongodb at a Glance">
<rect x="0.5" y="0.5" width="995" height="1337" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
<title>Mongodb at a Glance</title>
<rect x="68" y="288" width="824" height="950" rx="14" fill="none" stroke="#cbd5e1" stroke-width="1.3" stroke-dasharray="7 5"/>
<rect x="80" y="296" width="70.4" height="20" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
<text x="115.2" y="310" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" fill="#475569">MongoDB</text>
<path d="M460 132 L460 227 L181 227 L181 322" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-mongodb-at-a-glance)"/>
<path d="M480 132 L480 322" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-mongodb-at-a-glance)"/>
<path d="M500 132 L500 227 L779 227 L779 322" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-mongodb-at-a-glance)"/>
<path d="M181 384 L181 626" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-mongodb-at-a-glance)"/>
<path d="M480 384 L480 626" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-mongodb-at-a-glance)"/>
<path d="M779 384 L779 626" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-mongodb-at-a-glance)"/>
<path d="M181 688 L181 795 L460 795 L460 902" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-mongodb-at-a-glance)"/>
<path d="M480 688 L480 902" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-mongodb-at-a-glance)"/>
<path d="M779 688 L779 795 L500 795 L500 902" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-mongodb-at-a-glance)"/>
<path d="M460 964 L460 1061 L175 1061 L175 1158" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-mongodb-at-a-glance)"/>
<path d="M480 964 L480 1158" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-mongodb-at-a-glance)"/>
<path d="M500 964 L500 1061 L785 1061 L785 1158" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-mongodb-at-a-glance)"/>
<rect x="396" y="73" width="168" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="396" y="70" width="168" height="62" rx="12" fill="#ecfdf5" stroke="#10b981" stroke-width="1.4"/>
<rect x="399" y="73" width="162" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="480" y="106" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#064e3b">Applications</text>
<rect x="86" y="325" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="86" y="322" width="190" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="89" y="325" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="181" y="358" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Mongos Router</text>
<rect x="385" y="325" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="385" y="322" width="190" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="388" y="325" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="480" y="358" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Change Stream App</text>
<rect x="684" y="325" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="684" y="322" width="190" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="687" y="325" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="779" y="358" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Analytics App</text>
<rect x="86" y="629" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="86" y="626" width="190" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="89" y="629" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="181" y="662" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Shard Replica Sets</text>
<rect x="385" y="629" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="385" y="626" width="190" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="388" y="629" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="480" y="662" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Config Servers (RS)</text>
<rect x="684" y="629" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="684" y="626" width="190" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="687" y="629" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="779" y="662" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">S3 Snapshots</text>
<rect x="395" y="905" width="170" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="395" y="902" width="170" height="62" rx="12" fill="#fff7ed" stroke="#f97316" stroke-width="1.4"/>
<rect x="398" y="905" width="164" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="480" y="938" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#7c2d12">Change Events</text>
<rect x="86" y="1161" width="178" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="86" y="1158" width="178" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="89" y="1161" width="172" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="175" y="1194" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Search Indexer</text>
<rect x="391" y="1161" width="178" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="391" y="1158" width="178" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="394" y="1161" width="172" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="480" y="1194" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Cache Invalidation</text>
<rect x="696" y="1161" width="178" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="696" y="1158" width="178" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="699" y="1161" width="172" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="785" y="1194" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Archive Workers</text>
<defs><marker id="arr-mongodb-at-a-glance" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker><marker id="arrEm-mongodb-at-a-glance" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#10b981"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/features/mongodb-at-a-glance.architecture.html](diagrams/features/mongodb-at-a-glance.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.
*Solid = query/mutation flow. Router §10, replica sets §9, shards §10, change streams §8, transactions §7.

---

## Table of Contents

<details>
<summary><b>📑 Jump to a section</b></summary>

1. [Documents & Collections](#1-documents--collections)
2. [CRUD — Insert, Find, Update, Delete](#2-crud--insert-find-update-delete)
3. [Query Operators & Projections](#3-query-operators--projections)
4. [Indexes](#4-indexes)
5. [Aggregation Framework](#5-aggregation-framework)
6. [Schema Design — Embedding vs Referencing](#6-schema-design--embedding-vs-referencing)
7. [Transactions (Multi-Document)](#7-transactions-multi-document)
8. [Change Streams (Reactive Apps)](#8-change-streams-reactive-apps)
9. [Replication — Replica Sets & Read Preference](#9-replication--replica-sets--read-preference)
10. [Sharding — Horizontal Scale-Out](#10-sharding--horizontal-scale-out)
11. [Time-Series Collections](#11-time-series-collections)
12. [GridFS — Large Files](#12-gridfs--large-files)
13. [Performance — Explain Plans & Covered Queries](#13-performance--explain-plans--covered-queries)
14. [Security](#14-security)
15. [MongoDB in This Repo's Designs](#15-mongodb-in-this-repos-designs)
16. [Key Takeaways](#16-key-takeaways)

</details>

---

## 1. Documents & Collections

MongoDB stores **BSON documents** (binary JSON) in **collections** — schema-flexible groups of documents. Documents in one collection *can* differ in shape, but disciplined designs keep a consistent core schema plus optional fields.

```javascript
// mongosh
db.users.insertOne({
  _id: ObjectId("66f1a2b3c4d5e6f7a8b9c0d1"),
  name: "Ada Lovelace",
  email: "ada@example.com",
  address: { city: "London", geo: { lat: 51.5, lng: -0.12 } },  // nested doc
  tags: ["admin", "beta"],                                       // array
  created_at: ISODate("2026-09-20T10:00:00Z")
})
```

| Feature | Notes |
| :--- | :--- |
| `_id` primary key | auto `ObjectId` (12-byte: ts + machine + counter) or custom |
| 16MB doc limit | big payloads → GridFS (§12) or object storage |
| Schema validation | `validator` with JSON Schema keeps flexibility honest |

---

## 2. CRUD — Insert, Find, Update, Delete

```javascript
// CREATE
db.products.insertMany([{ sku: "A1", price: 9.99 }, { sku: "B2", price: 19.99 }]);

// READ
db.products.find({ price: { $lt: 15 } }, { sku: 1, price: 1, _id: 0 }); // projection
db.products.findOne({ sku: "A1" });

// UPDATE (atomic per document)
db.products.updateOne({ sku: "A1" }, { $set: { price: 8.99 }, $inc: { version: 1 } });
db.products.updateOne({ sku: "A1" }, { $push: { priceHistory: { p: 8.99, at: new Date() } } });

// DELETE
db.products.deleteMany({ price: null });
```

**Upsert** — insert-or-update in one atomic call (used by cart/counter patterns):

```javascript
db.carts.updateOne(
  { user_id: 42, sku: "A1" },
  { $inc: { qty: 1 } },
  { upsert: true }
);
```

---

## 3. Query Operators & Projections

```javascript
db.events.find({
  status: { $in: ["open", "pending"] },
  created_at: { $gte: ISODate("2026-09-01") },
  $or: [{ priority: "high" }, { sla_hours: { $lt: 4 } }],
  "address.city": "London"                       // dot-path into nested docs
}).sort({ created_at: -1 }).limit(20).skip(40);  // pagination (range-based preferred)
```

| Operator family | Examples |
| :--- | :--- |
| Comparison | `$eq $ne $gt $gte $lt $lte $in $nin` |
| Logical | `$and $or $not $nor` |
| Element | `$exists`, `$type` |
| Array | `$elemMatch`, `$size`, `$all`, array filters in updates |
| Evaluation | `$regex`, `$expr` (joins fields in one doc) |

---

## 4. Indexes

Indexes are B-trees like any relational DB — and the #1 performance lever.

```javascript
db.products.createIndex({ sku: 1 }, { unique: true });            // unique
db.orders.createIndex({ user_id: 1, created_at: -1 });            // compound (ESR: Equality, Sort, Range)
db.posts.createIndex({ title: "text", body: "text" });            // text search
db.places.createIndex({ location: "2dsphere" });                  // geospatial
db.sessions.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index
db.events.createIndex({ user_id: 1 }, { partialFilterExpression: { archived: false } }); // partial
db.products.createIndex({ "attributes.$**": 1 });                 // wildcard (schema-flexible)
```

| Index type | Use case |
| :--- | :--- |
| Single / compound | the workhorses; order fields by ESR rule |
| TTL | auto-expiring sessions, carts, one-time tokens |
| Partial | index only hot subset (e.g., unarchived rows) |
| 2dsphere | proximity queries (see `system-design-proximity-service.md`) |
| Wildcard | unknown attribute keys — use sparingly |

---

## 5. Aggregation Framework

A pipeline of stages transforming documents — group-bys, joins, and analytics inside the DB.

```javascript
db.orders.aggregate([
  { $match: { status: "delivered", created_at: { $gte: startOfMonth } } }, // use the index
  { $group: {
      _id: { user: "$user_id", day: { $dateTrunc: { date: "$created_at", unit: "day" } } },
      revenue: { $sum: "$total" }, orders: { $sum: 1 }
  }},
  { $sort: { revenue: -1 } },
  { $limit: 100 },
  { $lookup: {                       // join to users (same-shard or unsharded)
      from: "users", localField: "_id.user", foreignField: "_id", as: "user"
  }},
  { $facet: {                        // multi-branch in one pass
      top: [{ $limit: 10 }],
      histogram: [{ $bucketAuto: { groupBy: "$revenue", buckets: 5 } }]
  }}
]);
```

**Rule:** `$match` and `$sort` early (index-backed); `$lookup` late; `$facet` for dashboards.

---

## 6. Schema Design — Embedding vs Referencing

The MongoDB design decision — everything else follows from it.

| Model | When | Example |
| :--- | :--- | :--- |
| **Embed** | data accessed together, bounded size, owned 1:1 or 1:few | order + line items |
| **Reference** | data accessed independently, unbounded, shared many:many | user ↔ reviews |
| **Subset** | hot fields embedded, full doc elsewhere | product + top 5 reviews |
| **Bucket** | time-series-style grouping | sensor readings per hour |

```javascript
// Embed (bounded): order with line items — one read, one write, atomic
{ _id: orderId, user_id: 42, total: 89.97,
  items: [{ sku: "A1", qty: 2, price: 8.99 }, { sku: "B2", qty: 1, price: 19.99 }] }

// Reference (unbounded): product reviews live in their own collection
db.reviews.createIndex({ product_id: 1, created_at: -1 });
```

**Anti-patterns:** unbounded arrays (16MB wall), massive "everything" docs, joining everything client-side.

---

## 7. Transactions (Multi-Document)

Single-document writes are always atomic. Multi-document ACID needs a session — use it for true invariants (ledgers, stock reservation), and design schemas to avoid needing it everywhere.

```javascript
const session = db.getMongo().startSession();
session.startTransaction();
try {
  const accounts = session.getDatabase("shop").accounts;
  accounts.updateOne({ _id: "a" }, { $inc: { balance: -100 } }, { session });
  accounts.updateOne({ _id: "b" }, { $inc: { balance: 100 } }, { session });
  session.commitTransaction();
} catch (e) { session.abortTransaction(); }
```

Requires a replica set (§9) or sharded cluster; watch for `TransientTransactionError` retries (the saga/outbox patterns in `system-design-concepts.md` §8/§9 often replace transactions entirely).

---

## 8. Change Streams (Reactive Apps)

Subscribe to data changes — the outbox-free version of event-driven design for MongoDB-backed systems.

```javascript
const stream = db.orders.watch(
  [{ $match: { "fullDocument.status": "paid" } }],
  { fullDocument: "updateLookup" }
);
while (stream.hasNext()) {
  const ev = stream.next();
  console.log("order paid:", ev.fullDocument._id, ev.operationType); // insert/update/delete
}
```

Uses the oplog under the hood; resumable via `resumeToken` (survives consumer restarts). Powers cache invalidation, search indexing, and notifications (see `system-design-notification-system.md` patterns).

---

## 9. Replication — Replica Sets & Read Preference

A **replica set** = 1 primary + N secondaries with automatic failover (Raft-like election).

```javascript
// Writes go to primary by default. Reads can be steered:
db.orders.find({ user_id: 42 }).readPref("secondaryPreferred"); // scale reads, tolerate staleness
db.ledger.find({ _id: x }).readConcern("majority");             // never read rolled-back data
```

| Read preference | Use |
| :--- | :--- |
| `primary` | strong consistency (default) |
| `primaryPreferred` | primary if alive |
| `secondary` | analytics / caches (may be stale) |
| `secondaryPreferred` | read-heavy apps across regions |
| `nearest` | geo-latency-sensitive reads |

**Write concern:** `w: "majority"` = durable across failover (combine with `readConcern: "majority"` for causal consistency).

---

## 10. Sharding — Horizontal Scale-Out

```
                ┌─ mongos (query router) ─┐
   clients ───► │   routes by shard key   │ ───► shards (each = a replica set)
                └──── config servers (RS) ┘
```

```javascript
sh.enableSharding("shop");
sh.shardCollection("shop.orders", { user_id: "hashed" });      // even write spread
sh.shardCollection("shop.events", { tenant_id: 1, ts: 1 });    // range + locality
```

**Shard-key rules:** high cardinality, monotonic-ish distribution, present in every query — changing it later is a full re-write. Hot-spotting on monotonic keys (`ts` alone) is the classic mistake — prefix with something uncorrelated (tenant, user) or hash it. Zones route data by region (data residency).

---

## 11. Time-Series Collections

First-class collections for metrics/IoT — automatic bucketing per source + time window (10×–50× storage win vs raw docs).

```javascript
db.createCollection("device_metrics", {
  timeseries: { timeField: "ts", metaField: "device_id", granularity: "minutes" },
  expireAfterSeconds: 60 * 60 * 24 * 90   // 90-day retention
});
db.device_metrics.insertMany([
  { device_id: "d1", ts: new Date(), temp: 22.4, humidity: 41 },
  { device_id: "d1", ts: new Date(Date.now() + 60000), temp: 22.6, humidity: 40 },
]);
// Downsampling: nightly aggregation into a coarser-grained collection
```

Related: tiered retention design in `system-design-alerting.md` (raw → 1m → 1h rollups).

---

## 12. GridFS — Large Files

Splits files >16MB into chunks across two collections (`fs.files` metadata, `fs.chunks` 255KB pieces) — range reads and partial retrieval included.

```javascript
// mongosh / drivers
const bucket = new GridFSBucket(db);
fs.createReadStream("video.mp4").pipe(bucket.openUploadStream("video.mp4"));
bucket.openDownloadStreamByName("video.mp4").pipe(fs.createWriteStream("copy.mp4"));
```

**Rule of thumb:** object storage (S3) beats GridFS for new designs; GridFS shines when files must live transactionally *inside* the database.

---

## 13. Performance — Explain Plans & Covered Queries

```javascript
db.orders.find({ user_id: 42, status: "paid" })
         .sort({ created_at: -1 }).explain("executionStats");
// Good:  IXSCAN on {user_id:1, status:1, created_at:-1}, totalKeysExamined ≈ nReturned
// Bad:   COLLSCAN, or totalDocsExamined >> nReturned (fetch-heavy)
```

Checklist: every query has a supporting index (ESR order) → `PROJECTION_COVERED` where possible → no `$where`/unindexed `$regex` prefix scans → `allowDiskUse` only for real analytics. Watch `working set in RAM` — cache misses show as p99 latency cliffs (see cache patterns in `system-design-distributed-cache.md`).

---

## 14. Security

```javascript
// auth + roles
db.createUser({ user: "app", pwd: "...", roles: [{ role: "readWrite", db: "shop" }] });
// field-level redaction via views
db.createView("orders_public", "orders", [
  { $unset: ["card_pan", "internal_notes"] }
]);
```

| Layer | Feature |
| :--- | :--- |
| Authentication | SCRAM, x.509, LDAP/OIDC |
| Authorization | role-based, per-collection/custom roles |
| Network | TLS everywhere, IP allowlists, VPC peering |
| At rest | encrypted storage engine, key management (KMS) |
| Fields | client-side field-level encryption (CSFLE) |

---

## 15. MongoDB in This Repo's Designs

| Design | Why MongoDB fits |
| :--- | :--- |
| `system-design-ecommerce.md` | product catalog (flexible attributes), carts |
| `system-design-instagram.md` | post/comment documents, timeline metadata |
| `system-design-twitter.md` | tweet documents with denormalized counters |
| `system-design-linkedinf.md` → `system-design-linkedin.md` | profile documents, activity streams |
| `system-design-file-storage.md` | GridFS-style chunking concepts |
| `system-design-online-judge.md` | submission metadata (flexible per-language fields) |

See also: document-vs-relational trade-off tables in those docs' **Trade-off Analysis** sections.

---

## 16. Key Takeaways

1. **Schema design is the design** — embedding vs referencing decides everything downstream
2. Index with the **ESR rule** (Equality, Sort, Range) and verify with `explain`
3. Single-document atomicity is free; multi-document transactions are a deliberate choice
4. Change streams make MongoDB systems reactive without an outbox
5. Replica sets give HA; sharding gives scale — shard keys are forever, choose carefully
6. Time-series collections + TTL indexes handle retention natively
7. Related guides: `postgresql-features.md` (relational alternative), `redis-features.md` (hot-path cache in front), `kafka-features.md` (event backbone)
