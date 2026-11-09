#!/usr/bin/env node
/**
 * add-start-here.mjs — insert the plain-English orientation card into every
 * system-design doc, directly after the "THE PROBLEM" callout and before the
 * table of contents.
 *
 * Why: the design docs are reference material. A reader who does not already
 * know the system has no mental model, no analogy, and no definition of the
 * jargon. This card gives them one before the tables begin. It is additive:
 * no existing section is removed.
 *
 * Idempotent: a doc that already contains the heading is skipped, so re-running
 * after editing the data updates nothing.
 *
 * Usage:
 *   node tools/add-start-here.mjs            # insert into every design doc
 *   node tools/add-start-here.mjs --check    # report missing cards, exit 1
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

/**
 * One entry per design doc. `before`, `next` and `terms` are rendered as links.
 * Keep `before` anchors aligned with system-design-concepts.md; the doc audit
 * validates every cross-file anchor.
 */
const DOCS = {
  'system-design-ab-testing.md': {
    what: 'Runs two versions of a product change on live traffic and measures which one is actually better.',
    analogy: 'A restaurant testing a new menu on half its tables and comparing tips, without telling the diners.',
    hard: 'The result has to be trustworthy: users must be split deterministically, the metric must not be peeked at, and a guardrail must stop a harmful variant on its own.',
    idea: 'Hash the user ID with a layer salt to assign a stable bucket, then judge the metric with always-valid statistics and CUPED.',
    watch: 'It is not "compare the averages." Sample-ratio mismatch and peeking are what make most experiment results wrong.',
    before: [['system-design-concepts.md#2-consistent-hashing', 'Consistent hashing'], ['system-design-concepts.md#45-slis-slos--error-budgets', 'SLIs, SLOs & error budgets']],
    next: [['system-design-recommendation-system.md', 'Recommendation system'], ['system-design-code-deployment.md', 'Code deployment']],
    terms: ['feature-flag', 'canary', 'slo', 'sampling'],
  },
  'system-design-ai-gateway.md': {
    what: 'One API in front of many model providers that routes each request, enforces quotas, and falls back when a provider fails.',
    analogy: 'A company switchboard that routes calls to the right department, limits how long each caller may talk, and redials another line if one is busy.',
    hard: 'Model quality, price, and latency differ per provider; a quota must count tokens before the response exists, and failover must not double-charge.',
    idea: 'Normalize every provider behind one schema, meter tokens and dollars per tenant, and route with capacity-aware weights plus bounded failover.',
    watch: 'Adding a retry is not resilience. Retrying a streaming call can duplicate spend and produce two answers; failover must be bounded and idempotent.',
    before: [['system-design-concepts.md#12-rate-limiting', 'Rate limiting'], ['system-design-concepts.md#11-circuit-breaker', 'Circuit breaker']],
    next: [['system-design-llm-inference.md', 'LLM inference'], ['system-design-rate-limiter.md', 'Rate limiter']],
    terms: ['token', 'prompt-caching', 'rate-limiting', 'circuit-breaker'],
  },
  'system-design-airbnb.md': {
    what: 'A two-sided marketplace where hosts list places and guests search, book, and pay for them.',
    analogy: 'A hotel front desk that owns no rooms: it checks availability across thousands of independent landlords and holds a room while you pay.',
    hard: 'Search must stay fast while availability changes constantly, and two guests must never book the same dates.',
    idea: 'Keep search in a read-optimized index, but make the authoritative booking decision a single conditional write on the availability row.',
    watch: 'A Redis lock does not make booking safe. It reduces contention; the database constraint is what prevents the double booking.',
    before: [['system-design-concepts.md#16-caching-strategies', 'Caching strategies'], ['system-design-concepts.md#44-optimistic-concurrency--versioning', 'Optimistic concurrency']],
    next: [['system-design-ticketing-system.md', 'Ticketing system'], ['system-design-ecommerce.md', 'E-commerce']],
    terms: ['cache-aside', 'optimistic-locking', 'idempotency', 'shard'],
  },
  'system-design-alerting.md': {
    what: 'Collects metrics from thousands of services, stores them as time series, evaluates rules, and pages the right person.',
    analogy: 'A hospital monitor bank: sensors stream vitals, a rules engine watches thresholds, and only the alarms that need a human ring.',
    hard: 'Ingest volume is enormous and bursty, but the query path must stay fast and alerts must not flap.',
    idea: 'Buffer ingest in a log, write to a time-series store with tiered retention, and evaluate rules against a consistent snapshot rather than raw events.',
    watch: 'More metrics does not mean better alerting. Cardinality is the cost driver; one high-cardinality label can double the bill and slow every query.',
    before: [['system-design-concepts.md#45-slis-slos--error-budgets', 'SLIs, SLOs & error budgets'], ['system-design-concepts.md#21-backpressure', 'Backpressure']],
    next: [['system-design-observability-pipeline.md', 'Observability pipeline'], ['system-design-code-deployment.md', 'Code deployment']],
    terms: ['cardinality', 'slo', 'error-budget', 'sampling'],
  },
  'system-design-algo-trading.md': {
    what: 'Turns a trading signal into an order, passes it through pre-trade risk, sends it to a venue, and books the fill as a position.',
    analogy: 'A pit trader with a checklist: check the order against limits, shout it to the exchange, and write every fill in a ledger that must reconcile.',
    hard: 'The risk gate must reject before the wire in microseconds, while every retry and partial fill must leave the position correct.',
    idea: 'Make order state a monotonic state machine with idempotent transitions; the risk check is a legal control, not a best-effort validation.',
    watch: 'Retrying an order when the ack is slow creates a second position. A retry without an idempotency key is a new trade.',
    before: [['system-design-concepts.md#10-idempotency', 'Idempotency'], ['system-design-concepts.md#44-optimistic-concurrency--versioning', 'Optimistic concurrency']],
    next: [['system-design-stock-exchange.md', 'Stock exchange'], ['system-design-payment-system.md', 'Payment system']],
    terms: ['idempotency', 'wal', 'fencing-token', 'exactly-once'],
  },
  'system-design-code-deployment.md': {
    what: 'Takes a commit through build, test, artifact, staged rollout, health checks, and rollback across thousands of hosts.',
    analogy: 'A relay race with a safety inspector at every handoff: the baton only moves if the runner is healthy.',
    hard: 'The deploy must be fast enough to matter, safe enough to stop on its own, and reversible before the bad version spreads.',
    idea: 'Make artifacts immutable and content-addressed, then let a controller advance through health-gated batches with automatic rollback.',
    watch: 'Rollback is not just redeploying the old commit. Without immutable artifacts and a compatible schema, the "old" build may no longer exist or cannot read the new data.',
    before: [['system-design-concepts.md#47-deployment-strategies', 'Deployment strategies'], ['system-design-concepts.md#11-circuit-breaker', 'Circuit breaker']],
    next: [['system-design-serverless.md', 'Serverless platform'], ['system-design-observability-pipeline.md', 'Observability pipeline']],
    terms: ['canary', 'blue-green', 'feature-flag', 'idempotency'],
  },
  'system-design-delayed-job-scheduler.md': {
    what: 'Accepts jobs with a future run time and executes each one once, close to its due time, at massive scale.',
    analogy: 'A restaurant reservation book: every booking has a time, the host scans for parties due now, and a no-show is retried or cancelled.',
    hard: 'Millions of timers, no missed jobs, no double execution, and a due-time promise that survives a node crash.',
    idea: 'Keep the durable schedule in a database, use a sorted set for fast "what is due", and make execution idempotent with a visibility timeout.',
    watch: 'Polling every second does not fire a job once. Two workers can see the same due row; the claim has to be atomic.',
    before: [['system-design-concepts.md#10-idempotency', 'Idempotency'], ['system-design-concepts.md#14-leader-election', 'Leader election']],
    next: [['system-design-notification-system.md', 'Notification system'], ['system-design-webhook-delivery.md', 'Webhook delivery']],
    terms: ['idempotency', 'lease', 'exactly-once', 'dead-letter-queue'],
  },
  'system-design-discord.md': {
    what: 'Runs huge community chat rooms with millions of simultaneous WebSocket connections, plus voice and video.',
    analogy: 'A stadium with thousands of sections: a message is announced once to each section speaker, not to every seat individually.',
    hard: 'A 500,000-member room cannot fan out per member, and a single gateway node cannot hold every socket.',
    idea: 'Fan out hierarchically: room to gateway clusters, then gateway to local sockets, with an append-only message log underneath.',
    watch: 'A bigger WebSocket server is not the fix. The bottleneck is the fan-out work per message, not socket count alone.',
    before: [['system-design-concepts.md#42-fan-out--push-vs-pull', 'Fan-out & push vs pull'], ['system-design-concepts.md#21-backpressure', 'Backpressure']],
    next: [['system-design-messaging-app.md', 'Messaging app'], ['system-design-video-conferencing.md', 'Video conferencing']],
    terms: ['fan-out', 'backpressure', 'idempotency', 'consumer-group'],
  },
  'system-design-distributed-cache.md': {
    what: 'A shared in-memory layer that serves hot reads in under a millisecond and protects the database.',
    analogy: 'A row of quick-access shelves in front of the warehouse: most requests never need the warehouse, but a missing item sends a runner.',
    hard: 'The cache must survive node loss without losing the keyspace, and a hot key must not melt one shard.',
    idea: 'Shard with consistent hashing, replicate each shard, and treat a miss as the normal path with single-flight protection.',
    watch: 'Invalidation is not just deleting the key. The hard part is the race between the database write and the cache fill.',
    before: [['system-design-concepts.md#16-caching-strategies', 'Caching strategies'], ['system-design-concepts.md#2-consistent-hashing', 'Consistent hashing']],
    next: [['system-design-key-value-store.md', 'Key-value store'], ['system-design-url-shortener.md', 'URL shortener']],
    terms: ['consistent-hashing', 'cache-aside', 'eviction', 'lru', 'hot-key', 'cache-stampede'],
  },
  'system-design-distributed-lock-manager.md': {
    what: 'A coordination service that grants locks, leases, leader election, and small configuration reads on top of consensus.',
    analogy: 'A building key cabinet: one key per room, a sign-out ledger, and a rule that a key left too long is reclaimed.',
    hard: 'A paused client can wake up believing it still holds a lock; the lock service cannot see the pause.',
    idea: 'Every grant is a consensus log entry with a monotonic fencing token, and every protected write checks that token.',
    watch: 'Redis SETNX is not a safe lock. Without a fencing token, a stale holder can still write after the lock has moved.',
    before: [['system-design-concepts.md#23-consensus-algorithms-raft--paxos', 'Consensus'], ['system-design-concepts.md#10-idempotency', 'Idempotency']],
    next: [['system-design-delayed-job-scheduler.md', 'Delayed job scheduler'], ['system-design-code-deployment.md', 'Code deployment']],
    terms: ['lease', 'fencing-token', 'consensus', 'leader-election'],
  },
  'system-design-distributed-training.md': {
    what: 'Snapshots a 1,000-GPU training job (weights, optimizer, RNG, data position) and restores it after a failure.',
    analogy: 'A group project saving a consistent draft: every member must save the same version, or the merged document is nonsense.',
    hard: 'All shards must come from the same step, the pause must be short, and a committed checkpoint must survive a region loss.',
    idea: 'Pin a global step, stage shards asynchronously to a replicated object store, and commit the manifest atomically only when every shard is durable.',
    watch: 'Checkpointing each GPU independently produces a set that cannot be resumed correctly; the step boundary is the unit of consistency.',
    before: [['system-design-concepts.md#31-write-ahead-log-wal--durability', 'WAL & durability'], ['system-design-concepts.md#28-quorum-reads--writes', 'Quorum reads & writes']],
    next: [['system-design-gpu-scheduler.md', 'GPU scheduler'], ['system-design-llm-inference.md', 'LLM inference']],
    terms: ['quorum', 'object-storage', 'wal', 'idempotency'],
  },
  'system-design-ecommerce.md': {
    what: 'Product catalog, search, cart, checkout, inventory, payment, and order management for millions of shoppers.',
    analogy: 'A department store where the shelf, the cash register, and the stockroom are separate systems that must agree on what is actually for sale.',
    hard: 'Browse traffic is huge and tolerant of staleness; checkout is small and must be exactly right.',
    idea: 'Split the read path (cache plus search index) from the write path (authoritative database plus inventory reservation), and make the order boundary a transaction.',
    watch: 'Decrementing inventory when the order is placed is too late. The reserve must happen before payment, or you sell stock you do not have.',
    before: [['system-design-concepts.md#16-caching-strategies', 'Caching strategies'], ['system-design-concepts.md#8-saga-pattern', 'Saga pattern']],
    next: [['system-design-payment-system.md', 'Payment system'], ['system-design-ticketing-system.md', 'Ticketing system']],
    terms: ['cache-aside', 'saga', 'idempotency', 'optimistic-locking'],
  },
  'system-design-file-storage.md': {
    what: 'Stores files in chunks, syncs changes across devices, and shares them with other users.',
    analogy: 'A library that keeps the catalog card and the book on separate shelves: the card is small and fast, the book is large and slow.',
    hard: 'Differential sync must move only changed chunks, and two devices editing the same file must not silently overwrite each other.',
    idea: 'Content-address immutable chunks in object storage, keep metadata in a transactional database, and sync by comparing chunk hashes.',
    watch: 'Re-uploading the whole file on every edit destroys the product. Chunk-level hashing is what makes sync feel instant.',
    before: [['system-design-concepts.md#22-merkle-trees-anti-entropy', 'Merkle trees'], ['GLOSSARY.md#object-storage', 'Object storage']],
    next: [['system-design-google-docs.md', 'Google Docs'], ['system-design-youtube.md', 'YouTube']],
    terms: ['object-storage', 'merkle-tree', 'idempotency', 'ttl'],
  },
  'system-design-food-delivery.md': {
    what: 'Connects hungry customers, restaurants, and delivery partners in real time, from discovery to doorstep.',
    analogy: 'An air-traffic controller for dinners: it finds nearby drivers, assigns the closest one, and tracks every order until it lands.',
    hard: 'The matching decision is a moving target: drivers, restaurants, and traffic all change while the order is being assigned.',
    idea: 'Keep live locations in a geospatial index, make assignment a state machine with an expiring claim, and stream status changes to both sides.',
    watch: 'Picking the nearest driver once is not enough. Nearest at assignment time may be far away by pickup time; the claim must expire and re-match.',
    before: [['system-design-concepts.md#48-geospatial-indexing-geohash--s2', 'Geospatial indexing'], ['system-design-concepts.md#10-idempotency', 'Idempotency']],
    next: [['system-design-uber.md', 'Uber'], ['system-design-proximity-service.md', 'Proximity service']],
    terms: ['geohash', 'idempotency', 'fan-out', 'cache-aside'],
  },
  'system-design-fraud-detection.md': {
    what: 'Scores transactions in under 100 ms against velocity rules, device fingerprints, and ML models, then feeds confirmed fraud back into training.',
    analogy: 'A bank teller with a sixth sense: the teller checks the signature, the amount, and whether this customer has ever done anything like this before.',
    hard: 'Deep, stateful analysis must fit inside a payment latency budget, and a false positive blocks a legitimate customer.',
    idea: 'Precompute features into an online store, score with a cheap cascade, and push anything uncertain to an asynchronous review queue.',
    watch: 'If scoring is down, silence is not a policy. Decide explicitly whether to fail open or closed, and alert either way.',
    before: [['system-design-concepts.md#16-caching-strategies', 'Caching strategies'], ['system-design-concepts.md#10-idempotency', 'Idempotency']],
    next: [['system-design-payment-system.md', 'Payment system'], ['system-design-observability-pipeline.md', 'Observability pipeline']],
    terms: ['cache-aside', 'cardinality', 'sampling', 'backpressure'],
  },
  'system-design-google-ads.md': {
    what: 'Runs an auction for every ad slot, ranks ads by bid and quality, and paces each advertiser budget across the day.',
    analogy: 'A live auction where the auctioneer also knows how much each bidder has left to spend and refuses to let one bidder empty their wallet in the first hour.',
    hard: 'The auction must finish inside the search latency budget, and budget pacing must be fair without letting spend run out early.',
    idea: 'Retrieve eligible ads with an inverted index, score with an auction-time model, and pace with a probabilistic filter driven by remaining budget.',
    watch: 'The highest bid does not always win. Quality and expected impact are part of the rank, otherwise the platform fills with bad ads.',
    before: [['system-design-concepts.md#52-back-of-the-envelope-estimation', 'Back-of-the-envelope estimation'], ['system-design-concepts.md#16-caching-strategies', 'Caching strategies']],
    next: [['system-design-search-engine.md', 'Search engine'], ['system-design-recommendation-system.md', 'Recommendation system']],
    terms: ['token-bucket', 'cache-aside', 'cardinality', 'idempotency'],
  },
  'system-design-google-calendar.md': {
    what: 'Stores events with recurrence and time zones, answers free/busy queries across users, and manages invites and RSVPs.',
    analogy: 'A shared scheduling assistant that keeps everyone calendar, but must reconcile "every second Tuesday" with daylight saving and a guest in another country.',
    hard: 'Recurrence expands into a huge number of instances, and free/busy must be fast without scanning every event.',
    idea: 'Store the recurrence rule once, materialize exceptions only, and maintain a per-user interval index of busy blocks.',
    watch: 'Expanding every recurrence into rows turns a daily meeting for ten years into thousands of rows per event and a migration nightmare.',
    before: [['system-design-concepts.md#50-indexing-fundamentals--selection-strategy', 'Indexing fundamentals'], ['GLOSSARY.md#materialized-view', 'Materialized view']],
    next: [['system-design-google-docs.md', 'Google Docs'], ['system-design-notification-system.md', 'Notification system']],
    terms: ['materialized-view', 'secondary-index', 'idempotency', 'ttl'],
  },
  'system-design-google-docs.md': {
    what: 'Lets many people edit the same document at once, with sub-100 ms sync and conflict resolution.',
    analogy: 'Several people writing on the same whiteboard through a video feed: each stroke must land in the same place for everyone, even if two people draw at once.',
    hard: 'Concurrent edits arrive out of order, and every client must converge to the same document without losing intent.',
    idea: 'Transform each operation against concurrent operations (OT), or make the operations mergeable by construction (CRDT), then broadcast the result.',
    watch: 'Last-write-wins silently deletes one person sentence. Collaborative editing needs intention-preserving merge, not a timestamp compare.',
    before: [['system-design-concepts.md#25-crdts--conflict-free-replicated-data-types', 'CRDTs'], ['system-design-concepts.md#19-vector-clocks--conflict-resolution', 'Vector clocks']],
    next: [['system-design-file-storage.md', 'File storage'], ['system-design-discord.md', 'Discord']],
    terms: ['crdt', 'vector-clock', 'idempotency', 'consensus'],
  },
  'system-design-google-maps.md': {
    what: 'Renders map tiles, geocodes places, computes routes over a road graph, and updates ETAs from live traffic.',
    analogy: 'A paper atlas with a traffic reporter on every road: the map is static, but the recommended route changes as the reporter calls in.',
    hard: 'The road graph is enormous, traffic changes every few seconds, and routes must be recomputed without recomputing the world.',
    idea: 'Precompute tiles and contraction hierarchies, keep traffic in a streaming layer, and update only the affected edge weights.',
    watch: 'Running Dijkstra on the full graph for every request does not scale. Preprocessing and hierarchical routing are what make continent-scale queries fast.',
    before: [['system-design-concepts.md#48-geospatial-indexing-geohash--s2', 'Geospatial indexing'], ['system-design-concepts.md#37-cdn--edge-caching', 'CDN & edge caching']],
    next: [['system-design-uber.md', 'Uber'], ['system-design-proximity-service.md', 'Proximity service']],
    terms: ['geohash', 'cdn', 'cache-aside', 'read-repair'],
  },
  'system-design-gpu-scheduler.md': {
    what: 'Decides which tenant gets which GPU slice and which model stays resident in GPU memory.',
    analogy: 'A hotel manager who assigns rooms by size and priority, and must also decide whose luggage stays unpacked in the room.',
    hard: 'A GPU must never be double-assigned, gang scheduling needs all workers at once, and model loads are slow.',
    idea: 'Treat GPUs as schedulable inventory with topology-aware placement, and make admission and model loading a single atomic decision.',
    watch: 'Adding more GPUs does not fix fragmentation. Topology and model-load time dominate; a bigger cluster can be slower if placement is naive.',
    before: [['system-design-concepts.md#14-leader-election', 'Leader election'], ['system-design-concepts.md#28-quorum-reads--writes', 'Quorum reads & writes']],
    next: [['system-design-llm-inference.md', 'LLM inference'], ['system-design-distributed-training.md', 'Distributed training']],
    terms: ['lease', 'idempotency', 'quorum', 'batching'],
  },
  'system-design-hotstar.md': {
    what: 'Streams live cricket and entertainment to tens of millions of concurrent viewers without falling over at the opening ball.',
    analogy: 'A stadium that sells 25 million seats for one match: the gates, the replay screens, and the food stalls all peak at the same second.',
    hard: 'Traffic is spiky and synchronized; a cache miss or a thundering herd at the start of a match is fatal.',
    idea: 'Push content to the edge, pre-warm and shard the hot manifest, and degrade gracefully (lower bitrate, fewer features) instead of failing.',
    watch: 'Autoscaling does not save a synchronized spike. Instances take minutes to boot; capacity must be pre-provisioned and the origin shielded.',
    before: [['system-design-concepts.md#37-cdn--edge-caching', 'CDN & edge caching'], ['system-design-concepts.md#21-backpressure', 'Backpressure']],
    next: [['system-design-netflix.md', 'Netflix'], ['system-design-youtube.md', 'YouTube']],
    terms: ['cdn', 'cache-stampede', 'thundering-herd', 'backpressure'],
  },
  'system-design-instagram.md': {
    what: 'Shares photos and short videos, builds a personalized feed, and runs stories, likes, comments, and explore.',
    analogy: 'A newspaper that prints a different front page for every reader, and must reprint it every time someone they follow posts.',
    hard: 'Fan-out on write is expensive for celebrities, fan-out on read is expensive at page load; the feed must feel instant either way.',
    idea: 'Hybrid fan-out: push to the timelines of normal users, pull celebrity posts at read time, then rank and merge.',
    watch: 'One fan-out strategy for everyone breaks at both ends: the celebrity case breaks write fan-out, the inactive-user case breaks read fan-out.',
    before: [['system-design-concepts.md#42-fan-out--push-vs-pull', 'Fan-out & push vs pull'], ['system-design-concepts.md#16-caching-strategies', 'Caching strategies']],
    next: [['system-design-twitter.md', 'Twitter / X'], ['system-design-linkedin.md', 'LinkedIn']],
    terms: ['fan-out', 'cache-aside', 'hot-key', 'cdn'],
  },
  'system-design-irctc.md': {
    what: 'Books train tickets for billions of passengers a year, including the Tatkal rush where millions compete for the same seats at 10:00.',
    analogy: 'A railway ticket counter that opens one window for a whole city: the queue must be fair, and no seat may be sold twice.',
    hard: 'The opening-second load is extreme, seat inventory is finite, and payment may fail after the seat is held.',
    idea: 'Hold the seat atomically with an expiry, make payment idempotent, and treat the database constraint, not the queue, as the final arbiter.',
    watch: 'A queue does not make booking correct. Fairness is a product rule; the correctness rule is the atomic seat claim plus a compensating release.',
    before: [['system-design-concepts.md#10-idempotency', 'Idempotency'], ['GLOSSARY.md#pessimistic-locking', 'Pessimistic locking']],
    next: [['system-design-ticketing-system.md', 'Ticketing system'], ['system-design-metro-ticketing.md', 'Metro ticketing']],
    terms: ['pessimistic-locking', 'idempotency', 'saga', 'lease'],
  },
  'system-design-key-value-store.md': {
    what: 'A distributed map from key to value that stays available across node and network failures.',
    analogy: 'A fleet of librarians, each owning a slice of the card catalog; if one is out, a neighbour covers, and the catalog converges later.',
    hard: 'Availability and partition tolerance force eventual consistency, but conflicting versions must not silently overwrite each other.',
    idea: 'Consistent-hash the keyspace, replicate each key N times, require R/W quorums, and resolve conflicts with vector clocks or a read-repair path.',
    watch: 'Quorum overlap does not prove linearizability. It gives read-your-writes only with the right R+W>N and explicit conflict handling.',
    before: [['system-design-concepts.md#28-quorum-reads--writes', 'Quorum reads & writes'], ['system-design-concepts.md#2-consistent-hashing', 'Consistent hashing']],
    next: [['system-design-distributed-cache.md', 'Distributed cache'], ['system-design-distributed-lock-manager.md', 'Distributed lock manager']],
    terms: ['consistent-hashing', 'quorum', 'vector-clock', 'read-repair', 'hinted-handoff'],
  },
  'system-design-leaderboard.md': {
    what: 'Absorbs millions of score updates per second and answers "top 100" and "what is my rank" in milliseconds.',
    analogy: 'A live scoreboard at a stadium: every point updates the board, but nobody scans every player to answer "who is winning?".',
    hard: 'A single sorted set cannot hold 50 million members, and rank queries must stay fast as scores change.',
    idea: 'Shard the board by score band, keep a per-shard top-K, and merge the shards at query time.',
    watch: 'One Redis ZSET works until the set is too large for one node and every update becomes a hot key.',
    before: [['system-design-concepts.md#16-caching-strategies', 'Caching strategies'], ['system-design-concepts.md#1-sharding-data-partitioning', 'Sharding']],
    next: [['system-design-search-autocomplete.md', 'Search autocomplete'], ['system-design-recommendation-system.md', 'Recommendation system']],
    terms: ['hot-key', 'shard', 'cache-aside', 'fan-out'],
  },
  'system-design-linkedin.md': {
    what: 'A professional network with a feed, connections, jobs, messaging, and recruiter search for 900M+ members.',
    analogy: 'A convention center where everyone wears a name badge: the value is in who is connected to whom, and the graph is the product.',
    hard: 'The social graph is huge and multi-hop, the feed must be fresh, and job matching is a different access pattern from the feed.',
    idea: 'Separate the graph store from the feed and search indexes; use fan-out with ranking for the feed and a graph traversal for recommendations.',
    watch: 'One database for the graph and the feed does not work: graph traversals and timeline reads have incompatible shapes.',
    before: [['system-design-concepts.md#42-fan-out--push-vs-pull', 'Fan-out & push vs pull'], ['system-design-concepts.md#50-indexing-fundamentals--selection-strategy', 'Indexing fundamentals']],
    next: [['system-design-instagram.md', 'Instagram'], ['system-design-twitter.md', 'Twitter / X']],
    terms: ['fan-out', 'secondary-index', 'cache-aside', 'cqrs'],
  },
  'system-design-llm-inference.md': {
    what: 'Serves a language model to millions of users, streaming tokens while keeping GPUs busy and costs bounded.',
    analogy: 'A kitchen with one very expensive oven: the job is to keep it full, not to cook one dish at a time.',
    hard: 'Autoregressive decoding is sequential, KV-cache memory is finite, and requests arrive with wildly different lengths.',
    idea: 'Continuous batching with a paged KV cache, prefix caching for shared prompts, and admission control that budgets tokens rather than requests.',
    watch: 'Batch size is not a fixed number. The right batch changes every decode step; static batching wastes GPU time.',
    before: [['GLOSSARY.md#batching', 'Continuous batching'], ['system-design-concepts.md#21-backpressure', 'Backpressure']],
    next: [['system-design-ai-gateway.md', 'AI gateway'], ['system-design-gpu-scheduler.md', 'GPU scheduler']],
    terms: ['kv-cache', 'batching', 'quantization', 'prompt-caching', 'token'],
  },
  'system-design-messaging-app.md': {
    what: 'Delivers one-to-one and group messages in real time, with presence, receipts, media, and offline delivery.',
    analogy: 'A postal service with a live doorbell: if you are home, the letter is handed over instantly; if not, it waits in your box.',
    hard: '100B+ messages a day, mostly tiny, with strict per-conversation ordering and delivery to online and offline devices.',
    idea: 'Route by a connection registry, append to a per-conversation log, push to online sockets, and queue for offline devices.',
    watch: 'Storing messages in the chat service database is not the whole design. Connection routing, ordering, and multi-device fan-out are the hard parts.',
    before: [['system-design-concepts.md#42-fan-out--push-vs-pull', 'Fan-out & push vs pull'], ['system-design-concepts.md#21-backpressure', 'Backpressure']],
    next: [['system-design-discord.md', 'Discord'], ['system-design-notification-system.md', 'Notification system']],
    terms: ['fan-out', 'offset', 'consumer-group', 'idempotency'],
  },
  'system-design-metro-ticketing.md': {
    what: 'Handles tap-in and tap-out at subway gates, computes the fare, and reconciles the money.',
    analogy: 'A turnstile that reads a card, remembers where you entered, and charges you when you leave, even if the network is down.',
    hard: 'The gate must decide in under 500 ms, the network may be unavailable, and an incomplete journey still needs a fair fare.',
    idea: 'Validate offline with a signed token, record entry and exit as immutable events, and compute the fare asynchronously with a reconciliation pass.',
    watch: 'Charging at tap-in is usually wrong. The gate needs a local decision, but the backend needs the exit event to compute the final fare.',
    before: [['system-design-concepts.md#10-idempotency', 'Idempotency'], ['system-design-concepts.md#7-event-sourcing', 'Event sourcing']],
    next: [['system-design-irctc.md', 'IRCTC'], ['system-design-parking-system.md', 'Smart parking']],
    terms: ['idempotency', 'event-sourcing', 'lease', 'ttl'],
  },
  'system-design-netflix.md': {
    what: 'Streams licensed video to 260M+ subscribers, personalizes the catalog, and runs its own CDN.',
    analogy: 'A global video vending machine: the catalog is centralized, but the tapes are copied to neighborhood lockers so the last mile is short.',
    hard: 'The catalog is read-heavy and personal, video is enormous, and the system must survive a region outage without stopping playback.',
    idea: 'Keep metadata in a read-optimized store with a large cache, pre-position video in an owned CDN, and isolate playback from the control plane.',
    watch: 'Streaming quality is not just a player problem. The encoding ladder, CDN placement, and client ABR all decide it.',
    before: [['system-design-concepts.md#37-cdn--edge-caching', 'CDN & edge caching'], ['system-design-concepts.md#16-caching-strategies', 'Caching strategies']],
    next: [['system-design-hotstar.md', 'Hotstar'], ['system-design-youtube.md', 'YouTube']],
    terms: ['cdn', 'cache-aside', 'eventual-consistency', 'shard'],
  },
  'system-design-notification-system.md': {
    what: 'Sends push, email, SMS, and in-app notifications with preferences, templates, priorities, and delivery tracking.',
    analogy: 'A postal sorting office with different carriers: the same letter may go by bike, van, or overnight courier depending on urgency and address.',
    hard: 'Multiple providers with different latency and failure modes, plus user preferences and quiet hours, must produce one reliable decision.',
    idea: 'Normalize every channel behind one event, resolve preferences once, and route to per-channel workers with retries and a DLQ.',
    watch: 'Retrying until it succeeds turns a provider outage into a spam storm. Cap, back off, and dead-letter.',
    before: [['system-design-concepts.md#20-dead-letter-queue', 'Dead letter queue'], ['system-design-concepts.md#39-retries-backoff--jitter', 'Retries, backoff & jitter']],
    next: [['system-design-webhook-delivery.md', 'Webhook delivery'], ['system-design-messaging-app.md', 'Messaging app']],
    terms: ['dead-letter-queue', 'idempotency', 'backpressure', 'token-bucket'],
  },
  'system-design-observability-pipeline.md': {
    what: 'Collects metrics, logs, and traces from every service, controls cardinality and cost, and keeps the signals that matter.',
    analogy: 'A city CCTV system: you cannot store every camera forever, so you keep every alarm clip and sample the quiet streets.',
    hard: 'Volume grows faster than budget, high-cardinality labels explode storage, and tail sampling must keep errors without knowing the future yet.',
    idea: 'Buffer at the edge, enforce per-tenant cardinality budgets, fingerprint logs, and tail-sample traces with a delay window.',
    watch: 'Keeping everything is not cheap at observability volume. Indexing and query cost dominate, not raw disk.',
    before: [['GLOSSARY.md#cardinality', 'Cardinality'], ['system-design-concepts.md#21-backpressure', 'Backpressure']],
    next: [['system-design-alerting.md', 'Alerting'], ['system-design-code-deployment.md', 'Code deployment']],
    terms: ['cardinality', 'sampling', 'backpressure', 'slo'],
  },
  'system-design-online-judge.md': {
    what: 'Runs untrusted user code against hidden tests in sandboxes and returns a verdict quickly.',
    analogy: 'A firing range with disposable rooms: every submission gets its own sealed booth, time limit, and cleanup crew.',
    hard: 'Untrusted code can fork-bomb, escape, or hang; contest spikes are 100x normal, and the verdict must be trustworthy.',
    idea: 'One microVM per submission, hard resource limits at the kernel boundary, per-language warm pools, and streaming verdicts.',
    watch: 'Docker is not a strong sandbox. Containers share a kernel; hostile code needs a stronger boundary (microVM, gVisor) plus limits.',
    before: [['system-design-concepts.md#21-backpressure', 'Backpressure'], ['system-design-concepts.md#10-idempotency', 'Idempotency']],
    next: [['system-design-serverless.md', 'Serverless platform'], ['system-design-code-deployment.md', 'Code deployment']],
    terms: ['backpressure', 'idempotency', 'lease', 'object-storage'],
  },
  'system-design-parking-system.md': {
    what: 'Finds nearby parking, holds a spot, opens the gate, and charges for the stay.',
    analogy: 'A valet stand with numbered spaces: the board says which spaces are free, a cone reserves yours, and the exit clock starts when you drive in.',
    hard: 'Physical entry and exit events arrive late or out of order, and a reservation must expire without double-booking.',
    idea: 'Model the spot as a state machine, hold with a TTL, and treat gate events as the source of truth for occupancy.',
    watch: 'The app reservation is not the ground truth. The car is; sensors and gate events must reconcile the digital state.',
    before: [['system-design-concepts.md#10-idempotency', 'Idempotency'], ['system-design-concepts.md#48-geospatial-indexing-geohash--s2', 'Geospatial indexing']],
    next: [['system-design-metro-ticketing.md', 'Metro ticketing'], ['system-design-proximity-service.md', 'Proximity service']],
    terms: ['geohash', 'lease', 'idempotency', 'ttl'],
  },
  'system-design-pastebin.md': {
    what: 'Stores text snippets and serves them at short URLs, with expiry and optional privacy.',
    analogy: 'A public locker room: you put a note in a locker, get the number, and anyone with the number can read it.',
    hard: 'Writes are large and read-heavy, content may be huge, and expired pastes must disappear reliably.',
    idea: 'Put the blob in object storage, keep metadata in a database, cache hot reads, and expire with a TTL plus a sweeper.',
    watch: 'A 10 MB paste in a database row bloats backups and ruins cache efficiency. Use object storage for the blob.',
    before: [['GLOSSARY.md#object-storage', 'Object storage'], ['system-design-concepts.md#16-caching-strategies', 'Caching strategies']],
    next: [['system-design-url-shortener.md', 'URL shortener'], ['system-design-file-storage.md', 'File storage']],
    terms: ['object-storage', 'cache-aside', 'ttl', 'idempotency'],
  },
  'system-design-payment-system.md': {
    what: 'Moves money between customers, merchants, and banks, with idempotency, fraud checks, and a double-entry ledger.',
    analogy: 'A bank vault with two keys: one for the customer side and one for the merchant side, and every movement is written in a book that must balance.',
    hard: 'Retries, partial failures, and provider timeouts are normal; the ledger must never double-charge or lose a cent.',
    idea: 'Make the payment intent idempotent, record every movement as a balanced pair, and reconcile against the provider asynchronously.',
    watch: 'The provider saying success is not the end. The webhook can arrive twice or not at all; reconcile, do not trust a single signal.',
    before: [['system-design-concepts.md#10-idempotency', 'Idempotency'], ['system-design-concepts.md#8-saga-pattern', 'Saga pattern']],
    next: [['system-design-ecommerce.md', 'E-commerce'], ['system-design-stock-exchange.md', 'Stock exchange']],
    terms: ['idempotency', 'saga', 'outbox', 'wal'],
  },
  'system-design-proximity-service.md': {
    what: 'Answers "what is near me?" over millions of moving and static points, in under 200 ms.',
    analogy: 'A city map with a grid of transparent overlays: you only look at the squares near you, not the whole city.',
    hard: 'Geospatial indexes must handle dense cities, sparse oceans, and constantly moving points without hot spots.',
    idea: 'Index by geohash or S2 cell, query the target cell plus its neighbours, and rank by exact distance after the candidate set.',
    watch: 'One geohash prefix is not enough. A radius crosses cell boundaries; you must query neighbours and deduplicate.',
    before: [['system-design-concepts.md#48-geospatial-indexing-geohash--s2', 'Geospatial indexing'], ['system-design-concepts.md#16-caching-strategies', 'Caching strategies']],
    next: [['system-design-uber.md', 'Uber'], ['system-design-google-maps.md', 'Google Maps']],
    terms: ['geohash', 'cache-aside', 'hot-key', 'shard'],
  },
  'system-design-rate-limiter.md': {
    what: 'Caps API traffic per user, key, or tenant, and returns a clear "slow down" response.',
    analogy: 'A nightclub with a capacity limit: the doorman counts arrivals, lets in up to the limit, and asks the rest to wait.',
    hard: 'The check must be atomic across distributed nodes, fast enough to sit on every request, and fair under bursts.',
    idea: 'Run an atomic Lua script in Redis against a sliding-window or token-bucket key, and fail open or closed by product policy.',
    watch: 'Counting requests in each app instance multiplies the real limit by the fleet size. The counter must be shared.',
    before: [['system-design-concepts.md#12-rate-limiting', 'Rate limiting'], ['system-design-concepts.md#16-caching-strategies', 'Caching strategies']],
    next: [['system-design-ai-gateway.md', 'AI gateway'], ['system-design-notification-system.md', 'Notification system']],
    terms: ['token-bucket', 'sliding-window', 'rate-limiting', 'hot-key'],
  },
  'system-design-recommendation-system.md': {
    what: 'Turns a catalog of millions into a short, ranked list personalized for one user.',
    analogy: 'A sommelier who first narrows thousands of bottles to a dozen promising ones, then picks the three that fit your taste and the meal.',
    hard: 'The funnel must retrieve from a huge catalog, score accurately, and stay fast enough for a page load.',
    idea: 'Retrieve with multiple cheap sources (ANN, co-visitation, trending), enrich with features, rank with a heavier model, then re-rank for diversity and business rules.',
    watch: 'A bigger ranker does not fix retrieval. The ranker can only choose from candidates it is given; bad retrieval makes it useless.',
    before: [['system-design-concepts.md#16-caching-strategies', 'Caching strategies'], ['GLOSSARY.md#vector-index', 'Vector index']],
    next: [['system-design-search-engine.md', 'Search engine'], ['system-design-google-ads.md', 'Google Ads']],
    terms: ['embedding', 'vector-index', 'hnsw', 'cache-aside'],
  },
  'system-design-reddit.md': {
    what: 'Hosts community forums with threaded comments, votes, and time-decayed ranking.',
    analogy: 'A giant noticeboard per neighborhood: posts are pinned, comments branch like a tree, and votes slowly rotate the board.',
    hard: 'Comment trees are deep, votes are frequent, and ranking must balance freshness with quality without recomputing the world.',
    idea: 'Store the tree by parent pointer, aggregate votes incrementally, and recompute hot scores on a schedule with a decay function.',
    watch: 'Sorting comments by score at read time is expensive at depth and volume; cache the ordered children and update incrementally.',
    before: [['system-design-concepts.md#42-fan-out--push-vs-pull', 'Fan-out & push vs pull'], ['system-design-concepts.md#16-caching-strategies', 'Caching strategies']],
    next: [['system-design-twitter.md', 'Twitter / X'], ['system-design-discord.md', 'Discord']],
    terms: ['fan-out', 'cache-aside', 'hot-key', 'eventual-consistency'],
  },
  'system-design-route-reconstruction.md': {
    what: 'Turns noisy GPS pings from millions of trips into clean, map-matched routes.',
    analogy: 'A detective reconstructing a drive from blurry photos: remove the impossible jumps, smooth the path, then snap it to the road network.',
    hard: 'GPS error can be 200 m, pings are missing, and the output must be consistent enough to compare across trips.',
    idea: 'Clean anomalies, smooth with a Kalman filter, map-match with an HMM/Viterbi pass, then validate against the road graph.',
    watch: 'Snapping each point to the nearest road jumps across bridges and service roads; the sequence matters, not the single point.',
    before: [['system-design-concepts.md#48-geospatial-indexing-geohash--s2', 'Geospatial indexing'], ['system-design-concepts.md#52-back-of-the-envelope-estimation', 'Back-of-the-envelope estimation']],
    next: [['system-design-google-maps.md', 'Google Maps'], ['system-design-proximity-service.md', 'Proximity service']],
    terms: ['geohash', 'sampling', 'backfill', 'data-quality'],
  },
  'system-design-search-autocomplete.md': {
    what: 'Returns the top few query completions within 100 ms of each keystroke.',
    analogy: 'A librarian who has already ranked every phrase people might start saying, so the answer is a lookup, not a search.',
    hard: 'The vocabulary changes constantly, personalization must not blow the latency budget, and typos are common.',
    idea: 'Keep a prefix index (trie or finite-state transducer) of top queries, rank by popularity and context, and update it from the query log.',
    watch: 'Querying Elasticsearch on every keystroke is too slow and too expensive; autocomplete is a separate, precomputed index.',
    before: [['system-design-concepts.md#64-trie-prefix-tree', 'Trie'], ['system-design-concepts.md#16-caching-strategies', 'Caching strategies']],
    next: [['system-design-search-engine.md', 'Search engine'], ['system-design-leaderboard.md', 'Leaderboard']],
    terms: ['cache-aside', 'shard', 'hot-key', 'ttl'],
  },
  'system-design-search-engine.md': {
    what: 'Crawls the web, builds an inverted index, and returns ranked results in under 200 ms.',
    analogy: 'The index at the back of a book, rebuilt continuously for billions of pages, with a ranking judge on top.',
    hard: 'The index is larger than any one machine, documents change constantly, and ranking must be both relevant and fast.',
    idea: 'Shard the index by document and by term, serve from replicated shards, and rank with a cascade from cheap to expensive signals.',
    watch: 'One index on one big machine does not reach web scale; sharding and a serving cascade are the design.',
    before: [['system-design-concepts.md#50-indexing-fundamentals--selection-strategy', 'Indexing fundamentals'], ['system-design-concepts.md#1-sharding-data-partitioning', 'Sharding']],
    next: [['system-design-search-autocomplete.md', 'Search autocomplete'], ['system-design-web-crawler.md', 'Web crawler']],
    terms: ['shard', 'secondary-index', 'cache-aside', 'cardinality'],
  },
  'system-design-serverless.md': {
    what: 'Runs user functions on demand, scaling from zero to thousands of workers, with per-invocation billing.',
    analogy: 'A taxi rank that only summons a car when you hail one: you pay for the ride, not for the fleet waiting.',
    hard: 'Cold starts must be tiny, tenants must be isolated, and a function may run for milliseconds or minutes.',
    idea: 'Keep a pool of pre-warmed microVMs with snapshot restore, bin-pack by function shape, and route each invocation to a matching warm worker.',
    watch: 'Containers are not fast enough to start per request. A cold container can take seconds; snapshot restore and warm pools are the product.',
    before: [['system-design-concepts.md#21-backpressure', 'Backpressure'], ['system-design-concepts.md#10-idempotency', 'Idempotency']],
    next: [['system-design-online-judge.md', 'Online judge'], ['system-design-code-deployment.md', 'Code deployment']],
    terms: ['idempotency', 'backpressure', 'lease', 'object-storage'],
  },
  'system-design-spotify.md': {
    what: 'Streams music and podcasts, builds personalized playlists, and supports offline listening across devices.',
    analogy: 'A radio station that knows your taste, but also lets you download the songs before you go into the tunnel.',
    hard: 'The catalog is large but each stream is small, personalization is continuous, and offline devices must reconcile plays.',
    idea: 'Separate the catalog, the playlist/recommendation layer, and the streaming edge; precompute personalized mixes and sync play state.',
    watch: 'Recommendations are not only a nightly batch job. The best systems blend batch candidates with near-real-time signals.',
    before: [['system-design-concepts.md#37-cdn--edge-caching', 'CDN & edge caching'], ['system-design-concepts.md#16-caching-strategies', 'Caching strategies']],
    next: [['system-design-netflix.md', 'Netflix'], ['system-design-youtube.md', 'YouTube']],
    terms: ['cdn', 'cache-aside', 'embedding', 'fan-out'],
  },
  'system-design-stock-exchange.md': {
    what: 'Accepts orders from brokers, matches them deterministically, and publishes trades and market data.',
    analogy: 'A single auctioneer with a rulebook: everyone shouts orders, but the auctioneer processes them in one exact order so the outcome is reproducible.',
    hard: 'The matching engine must be deterministic, microsecond-fast, and recoverable without losing or duplicating an order.',
    idea: 'Sequence every order through one shard, match in memory with a price-time priority book, and replicate the command log for recovery.',
    watch: 'Running one symbol on many threads destroys determinism. Scale by symbol, not by thread.',
    before: [['system-design-concepts.md#10-idempotency', 'Idempotency'], ['system-design-concepts.md#31-write-ahead-log-wal--durability', 'WAL & durability']],
    next: [['system-design-algo-trading.md', 'Algorithmic trading'], ['system-design-payment-system.md', 'Payment system']],
    terms: ['wal', 'idempotency', 'fencing-token', 'offset'],
  },
  'system-design-ticketing-system.md': {
    what: 'Sells seats or rooms for events and stays, holding inventory while a buyer pays.',
    analogy: 'A box office with a seat map: the clerk puts a temporary "reserved" sticker on your seat, then removes it if you do not pay.',
    hard: 'Flash sales put 50K+ users on one event, and a hold that never expires or a payment that arrives twice both break inventory.',
    idea: 'Make the hold an atomic, expiring row in the authoritative store; treat the Redis lock as a contention reducer, not the correctness boundary.',
    watch: 'A cache-only hold can oversell after a failover. The database constraint is the source of truth.',
    before: [['GLOSSARY.md#pessimistic-locking', 'Pessimistic locking'], ['system-design-concepts.md#10-idempotency', 'Idempotency']],
    next: [['system-design-irctc.md', 'IRCTC'], ['system-design-ecommerce.md', 'E-commerce']],
    terms: ['pessimistic-locking', 'lease', 'idempotency', 'saga'],
  },
  'system-design-tinder.md': {
    what: 'Shows nearby profiles, records swipes, detects mutual likes, and opens a chat when two people match.',
    analogy: 'A party where everyone has a card: you only see the people near you, and a conversation starts only when both cards say yes.',
    hard: 'Discovery must be fast and local, swipes are write-heavy, and a match must be detected exactly once.',
    idea: 'Index by location and preferences, keep the swipe graph in a store with a uniqueness constraint, and detect matches with a conditional write.',
    watch: 'Scanning all nearby users for every swipe is too slow; pre-filtering and a cached candidate set make discovery cheap.',
    before: [['system-design-concepts.md#48-geospatial-indexing-geohash--s2', 'Geospatial indexing'], ['system-design-concepts.md#10-idempotency', 'Idempotency']],
    next: [['system-design-proximity-service.md', 'Proximity service'], ['system-design-messaging-app.md', 'Messaging app']],
    terms: ['geohash', 'cache-aside', 'idempotency', 'fan-out'],
  },
  'system-design-twitter.md': {
    what: 'Publishes short posts, builds timelines, and runs search and trends for 500M+ users.',
    analogy: 'A newspaper that prints a personalized front page for every reader, and must reprint it whenever someone they follow posts.',
    hard: 'Fan-out on write is enormous for celebrity accounts; the timeline must still load in under 50 ms.',
    idea: 'Hybrid fan-out: push posts into follower timelines for normal accounts, pull celebrity posts at read time, then merge and rank.',
    watch: 'Fanning out every post to every follower means one celebrity post can cause tens of millions of writes.',
    before: [['system-design-concepts.md#42-fan-out--push-vs-pull', 'Fan-out & push vs pull'], ['system-design-concepts.md#16-caching-strategies', 'Caching strategies']],
    next: [['system-design-instagram.md', 'Instagram'], ['system-design-reddit.md', 'Reddit']],
    terms: ['fan-out', 'cache-aside', 'hot-key', 'eventual-consistency'],
  },
  'system-design-uber.md': {
    what: 'Matches riders to nearby drivers, tracks trips, computes fares, and handles payments in real time.',
    analogy: 'A dispatcher with a live map: drivers are dots, riders are pins, and the dispatcher pairs the closest free dot with each pin.',
    hard: 'Location updates are constant, matching is a two-sided market, and the trip state must survive driver, rider, and network failures.',
    idea: 'Keep live locations in a geospatial index, make trip state an explicit machine, and treat matching as a proposal with an expiring claim.',
    watch: 'The nearest driver is not always the best match. ETA, direction, acceptance rate, and surge all matter; distance alone is a weak proxy.',
    before: [['system-design-concepts.md#48-geospatial-indexing-geohash--s2', 'Geospatial indexing'], ['system-design-concepts.md#10-idempotency', 'Idempotency']],
    next: [['system-design-food-delivery.md', 'Food delivery'], ['system-design-google-maps.md', 'Google Maps']],
    terms: ['geohash', 'lease', 'idempotency', 'fan-out'],
  },
  'system-design-unique-id-generator.md': {
    what: 'Mints roughly sortable 64-bit IDs at high volume without a central database sequence.',
    analogy: 'A ticket dispenser at each gate, each with its own roll: the numbers never collide because every gate has a different prefix.',
    hard: 'Clock skew, machine restarts, and multi-region deployment can all produce duplicates or go backwards.',
    idea: 'Compose the ID from timestamp + machine ID + sequence, and on clock regression either wait or borrow from the future.',
    watch: 'Random UUIDs are fine for uniqueness but fragment B-tree indexes and do not sort; Snowflake-style IDs trade coordination for locality.',
    before: [['system-design-concepts.md#52-back-of-the-envelope-estimation', 'Back-of-the-envelope estimation'], ['system-design-concepts.md#23-consensus-algorithms-raft--paxos', 'Consensus']],
    next: [['system-design-url-shortener.md', 'URL shortener'], ['system-design-key-value-store.md', 'Key-value store']],
    terms: ['shard', 'lease', 'idempotency', 'wal'],
  },
  'system-design-url-shortener.md': {
    what: 'Turns a long URL into a short code and redirects every visit to the original, counting clicks.',
    analogy: 'A coat-check ticket: a small numbered tag that the desk can exchange for your coat.',
    hard: 'Reads outnumber writes 100:1, so redirects must never wait on the database, and codes must be unique across regions.',
    idea: 'Mint IDs in bulk (counter ranges or Snowflake), encode them in Base62, and serve the mapping from cache with the database as fallback.',
    watch: 'Hashing the URL and taking the first seven characters collides. A counter or a checked-unique hash is safer.',
    before: [['system-design-concepts.md#16-caching-strategies', 'Caching strategies'], ['system-design-concepts.md#73-base62-encoding--snowflake-ids', 'Base62 & Snowflake IDs']],
    next: [['system-design-pastebin.md', 'Pastebin'], ['system-design-unique-id-generator.md', 'Unique ID generator']],
    terms: ['cache-aside', 'ttl', 'idempotency', 'shard'],
  },
  'system-design-video-conferencing.md': {
    what: 'Runs real-time multi-party audio and video with screen sharing, chat, and recording.',
    analogy: 'A conference room where the hotel staff mix and forward each speaker microphone, instead of every guest calling every other guest.',
    hard: 'Media is latency-sensitive, uploads are asymmetric, and a server must fan out each stream without re-encoding everything.',
    idea: 'Use an SFU: each participant sends one stream, the server forwards selected streams to the others, and adaptive bitrate handles bad networks.',
    watch: 'A mesh where everyone sends to everyone collapses on home broadband as participants grow; the SFU is the scalable shape.',
    before: [['system-design-concepts.md#37-cdn--edge-caching', 'CDN & edge caching'], ['system-design-concepts.md#21-backpressure', 'Backpressure']],
    next: [['system-design-hotstar.md', 'Hotstar'], ['system-design-discord.md', 'Discord']],
    terms: ['cdn', 'backpressure', 'fan-out', 'batching'],
  },
  'system-design-web-crawler.md': {
    what: 'Systematically fetches pages across the web, respects site rules, deduplicates content, and feeds an index.',
    analogy: 'A team of door-to-door canvassers with a shared list: each street is visited once, politely, and every new address is added to the list.',
    hard: 'The web is hostile: infinite calendars, duplicate content, rate limits, and traps that generate unbounded URLs.',
    idea: 'A prioritized frontier, per-host politeness, URL normalization plus content hashing, and a seen-set that fits in memory.',
    watch: 'Plain BFS over every link loops forever and gets blocked. Politeness, dedup, and trap detection are the design.',
    before: [['system-design-concepts.md#17-bloom-filter', 'Bloom filter'], ['system-design-concepts.md#21-backpressure', 'Backpressure']],
    next: [['system-design-search-engine.md', 'Search engine'], ['system-design-search-autocomplete.md', 'Search autocomplete']],
    terms: ['bloom-filter', 'backpressure', 'idempotency', 'ttl'],
  },
  'system-design-webhook-delivery.md': {
    what: 'Pushes events to customer endpoints at least once, with signatures, retries, and a replayable dead-letter queue.',
    analogy: 'A courier who keeps knocking: if nobody answers, they try again later, leave a signed parcel, and never pretend it was delivered.',
    hard: 'Endpoints fail, retries can stampede a recovering service, and duplicate deliveries must be safe.',
    idea: 'Write one delivery intent per endpoint, sign the payload with a timestamp, retry with full jitter, and dead-letter after the ladder.',
    watch: 'Retrying immediately in a tight loop turns one outage into a self-inflicted DDoS; use exponential backoff with jitter.',
    before: [['system-design-concepts.md#39-retries-backoff--jitter', 'Retries, backoff & jitter'], ['system-design-concepts.md#10-idempotency', 'Idempotency']],
    next: [['system-design-notification-system.md', 'Notification system'], ['system-design-payment-system.md', 'Payment system']],
    terms: ['webhook', 'hmac', 'dead-letter-queue', 'idempotency', 'thundering-herd'],
  },
  'system-design-youtube.md': {
    what: 'Accepts video uploads, transcodes them into a ladder of resolutions, and streams them to 2B+ users.',
    analogy: 'A publishing house that turns every submitted manuscript into several editions, then ships the right edition to each reader device.',
    hard: 'Transcoding is CPU-heavy and asynchronous, storage is enormous, and playback must start fast on any connection.',
    idea: 'Chunk the upload, transcode a per-title ladder asynchronously, store segments in object storage, and serve them through a CDN with ABR.',
    watch: 'Transcoding one 1080p file and scaling it down on the fly is not how ABR stays cheap; pre-segmented per-title ladders are.',
    before: [['system-design-concepts.md#37-cdn--edge-caching', 'CDN & edge caching'], ['GLOSSARY.md#object-storage', 'Object storage']],
    next: [['system-design-netflix.md', 'Netflix'], ['system-design-hotstar.md', 'Hotstar']],
    terms: ['cdn', 'object-storage', 'backpressure', 'cache-aside'],
  },
};

const LABELS = {
  crdt: 'CRDT', ttl: 'TTL', lru: 'LRU', cdn: 'CDN', wal: 'WAL', 'kv-cache': 'KV cache',
  hnsw: 'HNSW', slo: 'SLO', hmac: 'HMAC', 'fencing-token': 'fencing token',
  'consistent-hashing': 'consistent hashing', 'cache-aside': 'cache-aside',
  'read-repair': 'read repair', 'hinted-handoff': 'hinted handoff',
  'dead-letter-queue': 'dead-letter queue', 'consumer-group': 'consumer group',
  'feature-flag': 'feature flag', 'blue-green': 'blue-green', 'canary': 'canary',
  'token-bucket': 'token bucket', 'sliding-window': 'sliding window',
  'materialized-view': 'materialized view', 'secondary-index': 'secondary index',
  'pessimistic-locking': 'pessimistic locking', 'optimistic-locking': 'optimistic locking',
  'object-storage': 'object storage', 'eventual-consistency': 'eventual consistency',
  'vector-index': 'vector index', 'prompt-caching': 'prompt caching',
  'kv-cache': 'KV cache', 'thundering-herd': 'thundering herd',
  'cache-stampede': 'cache stampede', 'hot-key': 'hot key',
  'backpressure': 'backpressure', 'cardinality': 'cardinality',
  'sampling': 'sampling', 'batching': 'continuous batching',
  'quantization': 'quantization', 'token': 'token', 'embedding': 'embedding',
  'idempotency': 'idempotency', 'shard': 'shard', 'fan-out': 'fan-out',
  'lease': 'lease', 'quorum': 'quorum', 'saga': 'saga', 'outbox': 'outbox',
  'webhook': 'webhook', 'offset': 'offset', 'bloom-filter': 'Bloom filter',
  'geohash': 'geohash', 'slo': 'SLO', 'error-budget': 'error budget',
  'rate-limiting': 'rate limiting', 'circuit-breaker': 'circuit breaker',
  'consensus': 'consensus', 'leader-election': 'leader election',
  'merkle-tree': 'Merkle tree', 'vector-clock': 'vector clock',
  'data-quality': 'data quality', 'backfill': 'backfill',
};

const label = (key) => LABELS[key] || key;

function render(doc) {
  const link = ([href, text]) => `[${text}](${href})`;
  const lines = [
    '## Start here (plain English)',
    '',
    `**What it does.** ${doc.what}`,
    '',
    `**Think of it like.** ${doc.analogy}`,
    '',
    `**Why it's hard.** ${doc.hard}`,
    '',
    `**The core idea.** ${doc.idea}`,
    '',
    `**Watch out for.** ${doc.watch}`,
    '',
    `**Before this doc.** ${doc.before.map(link).join(' · ')}`,
    '',
    '**Read it in.** 5 min: [Overview](#overview) + [Architecture](#high-level-architecture) · 20 min: add [Design decisions](#key-design-decisions) + [Failure modes](#failure-modes--recovery) · full: all 16 sections.',
    '',
    `**Read next.** ${doc.next.map(link).join(' · ')}`,
    '',
    `**Terms.** ${doc.terms.map(t => `[${label(t)}](GLOSSARY.md#${t})`).join(' · ')}`,
    '',
  ];
  return lines;
}

const files = readdirSync(ROOT).filter(f => /^system-design-/.test(f) && f.endsWith('.md') && f !== 'system-design-concepts.md');
const problems = [];
let inserted = 0, skipped = 0;

for (const f of files) {
  const src = readFileSync(join(ROOT, f), 'utf8');
  if (/^## Start here \(plain English\)$/m.test(src)) { skipped++; continue; }
  if (CHECK) { problems.push(`${f}: missing Start here card`); continue; }

  const doc = DOCS[f];
  if (!doc) { problems.push(`${f}: no content entry in add-start-here.mjs`); continue; }

  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const lines = src.split(/\r?\n/);
  const tip = lines.findIndex(l => /^> \[!TIP\]/.test(l));
  if (tip < 0) { problems.push(`${f}: no TIP callout to anchor the card`); continue; }

  let end = tip;
  while (end + 1 < lines.length && /^>/.test(lines[end + 1])) end++;

  let at = end + 1;
  while (at < lines.length && lines[at].trim() === '') at++;
  if (at >= lines.length) { problems.push(`${f}: could not find insertion point`); continue; }

  lines.splice(at, 0, ...render(doc), '');
  writeFileSync(join(ROOT, f), lines.join(eol), 'utf8');
  inserted++;
}

if (problems.length) {
  console.log(`PROBLEMS (${problems.length}):`);
  for (const p of problems) console.log(`- ${p}`);
  process.exit(1);
}
console.log(CHECK ? `checked ${files.length} designs: all have Start here cards` : `inserted ${inserted}, skipped ${skipped} (already present)`);
