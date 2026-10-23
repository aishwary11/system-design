# 🌍 Industry Concepts & Real Systems

Every design doc teaches the *mechanism*. This guide records the **named concept and the system that made it famous**, so a design review can say "use H3 cells, not a geohash prefix scan" instead of "use a geo index".

**How to read a row:** the concept is the thing to name in an interview; the "who runs it" column is evidence that it survives production; the source is the primary write-up. Where a widely repeated claim has no public primary source, the row says so rather than inventing one — notably **Swiggy's geohash use is not documented publicly**, while Zomato has described cell/subzone-based dispatch and Uber has published H3.

> Verification note: links were opened and read while writing this guide. A handful of "who runs it" cells are marked *(documented use)* where the company describes the technique without naming the algorithm.

---

## Contents

| Domain | Topics |
| :--- | :--- |
| [Streaming & Media](#streaming--media) | Hotstar · Netflix · YouTube · Video conferencing · Spotify |
| [Social & Messaging](#social--messaging) | Twitter · Instagram · Reddit · Discord · Messaging · LinkedIn |
| [Commerce](#commerce) | E-commerce · Food delivery · Ticketing · Payments · Ads · Recommendations · Fraud · Airbnb |
| [Transport & Geo](#transport--geo) | Uber · Google Maps · Proximity · Route reconstruction · Parking · Metro · IRCTC |
| [Finance](#finance) | Stock exchange · Algorithmic trading |
| [Infrastructure](#infrastructure) | Cache · Locks · KV store · File storage · Rate limiter · IDs · URL shortener · Pastebin · Search · Autocomplete · Crawler · Notifications · Alerting · Observability · Serverless · Deployment · Scheduler · Leaderboard · Webhooks |
| [AI Infrastructure](#ai-infrastructure) | AI gateway · LLM inference · A/B testing |
| [Productivity](#productivity) | Google Docs · Google Calendar · Online judge |
| [Dating & Communities](#dating--communities) | Tinder |

---

## Streaming & Media

### Hotstar

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Low-latency HLS / DASH** | Segment-based ABR; the player switches rendition on buffer level, not on a bandwidth probe alone | Disney+ Hotstar, Netflix, YouTube | [RFC 8216](https://www.rfc-editor.org/rfc/rfc8216) |
| **Multi-CDN steering** | DNS/HTTP steering across CDNs with per-CDN health and cost, so one CDN's bad hour is not the event's bad hour | Hotstar, Netflix | [Hotstar at 50M](https://blog.hotstar.com/scaling-the-hotstar-platform-for-50m-a7f96a019add) |
| **Server-side ad insertion (SSAI)** | Ads stitched into the stream so ad blockers cannot skip them and the manifest stays consistent | Hotstar, Hulu | [Hotstar engineering](https://blog.hotstar.com/scaling-the-hotstar-platform-for-50m-a7f96a019add) |
| **DRM (Widevine / FairPlay)** | Per-device licence exchange; the CDN only ever serves encrypted segments | Hotstar, Netflix | [Widevine](https://widevine.com/) |
| **HyperLogLog view counts** | ~12 KB per sketch estimates uniques within ~0.8%, instead of storing a set per title | Hotstar-scale analytics | [HyperLogLog paper](https://research.google/pubs/pub40671/) |

### Netflix

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Open Connect** | Netflix-owned appliances embedded inside ISPs, fed by a tiered cache hierarchy rather than a public CDN | Netflix | [Open Connect](https://openconnect.netflix.com/en/) |
| **Per-title encoding** | The bitrate ladder is computed per title from its complexity, so a talk show and an action film get different ladders | Netflix | [Netflix TechBlog](https://netflixtechblog.com/per-title-encode-optimization-7e99442b62a2) |
| **EVCache** | Memcached-based, multi-region cache for session state and precomputed recommendation rows | Netflix | [EVCache](https://github.com/Netflix/EVCache) |
| **Chaos Monkey** | Randomly terminates production instances so failure is routine rather than an incident | Netflix | [Chaos Monkey](https://github.com/netflix/chaosmonkey) |
| **Hystrix-style bulkheads** | Per-dependency thread pools and timeouts stop one slow service from consuming the whole request budget | Netflix (originally) | [Hystrix](https://github.com/Netflix/Hystrix) |

### YouTube

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Vitess** | MySQL sharding middleware with connection pooling and resharding; YouTube built it before donating it to CNCF | YouTube | [Vitess](https://vitess.io/) |
| **DAG transcoding** | Each upload becomes a task graph (demux, per-rendition encode, package, publish) with per-node retries | YouTube | [YouTube engineering](https://blog.youtube/inside-youtube/) |
| **Watch-time ranking** | The recommender optimises expected watch time, not click-through, which is why clickbait decays | YouTube | [Deep Neural Networks for YouTube Recommendations](https://research.google/pubs/pub45530/) |
| **Two-tower retrieval** | User and item towers produce embeddings; serving is an approximate nearest-neighbour lookup | YouTube, many recsys | [Sampling-Bias-Corrected Neural Modeling](https://research.google/pubs/pub48840/) |

### Video conferencing

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **SFU** | Forwards each participant's stream to the others with per-receiver layer selection; far cheaper than mixing | Zoom, Meet, LiveKit | [WebRTC](https://webrtc.org/) |
| **Simulcast / SVC** | The sender uploads several qualities; the SFU picks one per receiver, so one weak link does not degrade the room | Zoom, Meet | [WebRTC simulcast](https://webrtc.org/) |
| **TURN relay** | Relays media when NAT traversal fails; budget bandwidth for the 10–20% of calls that cannot go direct | All WebRTC products | [RFC 8656](https://www.rfc-editor.org/rfc/rfc8656) |
| **GCC congestion control** | Delay-based bandwidth estimation adjusts encoder bitrate before the buffer overflows | Meet, Zoom | [GCC draft](https://datatracker.ietf.org/doc/draft-ietf-rmcat-gcc/) |
| **Jitter buffer** | Reorders and paces packets so a bursty network does not become choppy audio | All real-time media | [RFC 3550](https://www.rfc-editor.org/rfc/rfc3550) |

### Spotify

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Luigi** | Batch pipeline orchestration with dependency graphs; Spotify open-sourced it before Airflow dominated | Spotify | [Luigi](https://github.com/spotify/luigi) |
| **Backstage** | A service catalogue and developer portal generated from metadata, not hand-written docs | Spotify | [Backstage](https://backstage.io/) |
| **Cassandra for playlists** | Wide-column storage for user playlist metadata; read-heavy with predictable access by user id | Spotify | [Spotify engineering](https://engineering.atspotify.com/) |
| **Audio caching + prefetch** | The client caches encrypted tracks and prefetches the next queue entries to survive tunnels and lifts | Spotify | [Spotify engineering](https://engineering.atspotify.com/) |

---

## Social & Messaging

### Twitter / X

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Snowflake IDs** | 64-bit time-ordered ids (timestamp, machine, sequence) — sortable, no coordination, no UUID randomness | Twitter (created), Discord | [Snowflake](https://github.com/twitter-archive/snowflake) |
| **Fan-out hybrid** | Push tweet ids into follower timelines for normal accounts, merge at read for high-follower accounts | Twitter, Instagram | [Twitter engineering](https://blog.twitter.com/engineering) |
| **Manhattan** | Multi-tenant KV store with per-tenant replication and strong consistency where it is needed | Twitter | [Manhattan](https://blog.twitter.com/engineering/en_us/topics/infrastructure/2016/manhattan-distributed-key-value-database) |
| **Count-Min Sketch trends** | Heavy hitters over a sliding window without storing every term's exact count | Twitter, many | [Count-Min sketch](https://en.wikipedia.org/wiki/Count%E2%80%93min_sketch) |

### Instagram

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Sharded Postgres** | Logical shards mapped to physical databases; ids embed the shard so a lookup needs no directory | Instagram (early architecture) | [Instagram sharding](https://medium.com/instagram-engineering/sharding-ids-at-instagram-1cf5a71e5a5c) |
| **Feed fan-out hybrid** | Inbox push for normal accounts, read-time merge for celebrities | Instagram | [Instagram Engineering](https://medium.com/instagram-engineering) |
| **Content-hashed media URLs** | Immutable URLs plus resizing at the edge; a change is a new URL, never a cache purge | Instagram, Facebook | [Instagram Engineering](https://medium.com/instagram-engineering) |
| **Memcached tiers** | Hot object cache in front of sharded storage, with explicit invalidation on write | Instagram | [Instagram Engineering](https://medium.com/instagram-engineering) |

### Reddit

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Wilson score** | Lower-bound confidence sort for comments: a 9/10 with 10 votes does not beat 9.5/10 with 10,000 | Reddit | [How Not To Sort By Average Rating](https://www.evanmiller.org/how-not-to-sort-by-average-rating.html) |
| **Time-decay hot ranking** | `log(score) + age/45000` — the classic hot formula that makes new posts competitive | Reddit, Hacker News | [Reddit source](https://github.com/reddit-archive/reddit/blob/master/r2/r2/lib/db/_sorts.pyx) |
| **Materialized comment paths** | Ancestor path strings make subtree reads a prefix query instead of a recursive walk | Reddit-style trees | [Reddit source](https://github.com/reddit-archive/reddit/blob/master/r2/r2/lib/db/_sorts.pyx) |

### Discord

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Snowflake message ids** | Time-ordered ids give pagination and ordering without a sequence per channel | Discord | [Discord API reference](https://docs.discord.com/developers/reference) |
| **Cassandra → ScyllaDB** | Message storage moved to a lower-tail-latency wide-column store as the cluster grew | Discord | [How Discord stores trillions of messages](https://discord.com/blog/how-discord-stores-trillions-of-messages) |
| **Guild sharding** | A guild lives on one gateway shard, so fan-out is bounded by guild size and never by total users | Discord | [Discord gateway docs](https://docs.discord.com/developers/events/gateway) |
| **Session resume** | Reconnect replays from the last received event id instead of refetching state | Discord | [Discord gateway docs](https://docs.discord.com/developers/events/gateway) |

### Messaging app

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Signal Double Ratchet** | Per-message key evolution gives forward secrecy and post-compromise security | Signal, WhatsApp | [Double Ratchet](https://signal.org/docs/specifications/doubleratchet/) |
| **MLS (RFC 9420)** | Tree-based group key agreement so a 500-member group rekeys in O(log n) | IETF, Wire, Cisco | [RFC 9420](https://www.rfc-editor.org/rfc/rfc9420.html) |
| **Per-conversation ordering** | Kafka partition key = conversation id; global ordering is neither needed nor affordable | All chat backends | [Kafka docs](https://kafka.apache.org/documentation/) |
| **Multi-device sync cursors** | Each device tracks a monotonic cursor; the server keeps a per-device queue, not a global inbox | Signal, WhatsApp | [Signal protocol](https://signal.org/docs/) |

### LinkedIn

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Kafka** | The durable, partitioned log LinkedIn built for activity tracking and then open-sourced | LinkedIn (created) | [Kafka at LinkedIn](https://www.linkedin.com/blog/engineering/open-source/apache-kafka-trillion-messages) |
| **Espresso** | Document store with per-partition replication and change streams feeding derived views | LinkedIn | [Espresso](https://www.linkedin.com/blog/engineering/data-management/espresso) |
| **Venice** | Derived-data platform that pushes precomputed views to read-optimised stores | LinkedIn | [Venice](https://www.linkedin.com/blog/engineering/data-management/venice) |
| **Pinot** | OLAP store for user-facing analytics with low-latency filtered aggregation | LinkedIn (created) | [Pinot](https://pinot.apache.org/) |

---

## Commerce

### E-commerce

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Reserve-then-confirm inventory** | A TTL hold plus a conditional decrement (`WHERE qty >= 1`) — the database, not a read-modify-write, decides who wins | Amazon-style checkout | [Amazon build](https://www.amazon.science/) |
| **Saga** | Each step has a compensating action; a failed payment releases the inventory hold instead of leaving it stranded | Uber, Shopify | [Saga pattern](https://microservices.io/patterns/data/saga.html) |
| **Transactional outbox** | Order row and event commit in one transaction; a relay publishes after commit, so no event is lost | Shopify, Stripe | [Outbox pattern](https://microservices.io/patterns/data/transactional-outbox.html) |
| **Shopify pods** | Shops are partitioned into isolated pods with their own MySQL shard; shops move between pods as they grow | Shopify | [Shopify pods](https://shopify.engineering/a-pods-architecture-to-allow-shopify-to-scale) |
| **Flash-sale waiting room** | A queue in front of checkout paces admission so the inventory service sees a rate it can survive | Ticketmaster, Queue-it | [Ticketmaster queue](https://blog.ticketmaster.com/how-ticketmaster-queue-works/) |

### Food delivery

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **H3 hexagonal cells** | Uniform neighbour distance and 16 resolutions; better than geohash's rectangular distortion for rider joins | Uber (created) | [Uber H3](https://www.uber.com/us/en/blog/h3/) |
| **Cell/subzone serviceability** | A restaurant's deliverable area is a set of small cells, precomputed so "can we deliver here?" is a lookup | Zomato (documented) | [Zomato geo](https://geospatialworld.net/blogs/geo-location-is-centric-to-our-business-hardik-batra-zomato-philippines/) |
| **Geohash** | Prefix cells (`9q8yy…`) with eight-neighbour expansion; cheapest option, rectangular distortion at high latitudes | Widely used; **no public Swiggy/Zomato primary source** | [Geohash](https://en.wikipedia.org/wiki/Geohash) |
| **Batched dispatch** | Assign several orders to one rider by solving a small optimisation, not by greedy nearest-first | DoorDash DeepRed | [DoorDash dispatch](https://careersatdoordash.com/blog/using-ml-and-optimization-to-solve-doordashs-dispatch-problem/) |
| **Road-network ETA** | OSRM/Valhalla turn-by-turn cost over the real graph, then an ML correction for prep and traffic | OSRM, Valhalla users | [OSRM](https://github.com/Project-OSRM/osrm-backend) · [Valhalla](https://github.com/valhalla/valhalla) |

### Ticketing

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Virtual waiting room** | Admission is paced by a queue, so the booking service never sees the full spike | Ticketmaster, Queue-it | [Ticketmaster queue](https://blog.ticketmaster.com/how-ticketmaster-queue-works/) |
| **Seat hold with TTL** | `SET seat:{id} {user} NX PX 300000` reserves for the payment window, then the DB confirms | Ticketing systems | [Redis SET NX](https://redis.io/docs/latest/commands/set/) |
| **Optimistic seat claim** | `UPDATE ... WHERE status='free'` lets the loser pick another seat instead of blocking | Ticketmaster-class systems | [Optimistic locking](https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html) |
| **Idempotent confirm** | Attempt id on hold and confirm, so a double-click cannot take two seats | Payments/ticketing | [Stripe idempotency](https://docs.stripe.com/api/idempotent_requests) |

### Payments

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Double-entry ledger** | Every movement is debit + credit summing to zero; balances are derived, never overwritten | Stripe Ledger | [Stripe Ledger](https://stripe.dev/blog/ledger-stripe-system-for-tracking-and-validating-money-movement) |
| **Idempotency keys** | Client key stored with the response; a retry replays the first result instead of charging twice | Stripe | [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests) |
| **Tokenization + PCI scope** | Card data is replaced by a token at ingress, keeping app servers out of the cardholder-data scope | Stripe, Adyen | [PCI SSC](https://www.pcisecuritystandards.org/) |
| **Reconciliation** | Daily settlement files compared with the internal ledger; every break becomes a case with an owner | Every PSP | [Stripe Ledger](https://stripe.dev/blog/ledger-stripe-system-for-tracking-and-validating-money-movement) |
| **3-D Secure 2** | Risk-based step-up authentication; most low-risk transactions are frictionless | Card networks | [EMVCo 3DS](https://www.emvco.com/emv-technologies/3d-secure/) |

### Google Ads

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **GSP auction** | Rank by bid × quality, charge the next-highest price — the industry default between first-price and VCG | Google, Meta | [GSP paper](https://www.cs.princeton.edu/~arora/pubs/ads.pdf) |
| **Budget pacing** | Token-bucket pacing spreads a daily budget across the day instead of spending it by 9 a.m. | Google Ads, Meta | Google Ads Help, *Budget pacing* |
| **Quality score** | A learned relevance signal that lets a lower bid outrank a higher one, aligning auction with user value | Google Ads | Google Ads Help, *Quality Score* |
| **Click fraud detection** | Streaming graph clustering over click/device/IP edges catches rings that per-click rules miss | Google, Meta | Google Ads Help, *Invalid traffic* |

### Recommendations

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Two-tower retrieval** | User and item embeddings trained separately, items precomputed for ANN lookup at request time | YouTube, Pinterest | [YouTube DNN](https://research.google/pubs/pub45530/) |
| **HNSW** | Hierarchical navigable small-world graph gives sub-5 ms ANN over 100M vectors | FAISS, Lucene, Vespa | [HNSW paper](https://arxiv.org/abs/1603.09320) |
| **Feature store** | One feature definition materialised online (Redis) and offline (lake), eliminating train/serve skew | Uber Michelangelo, Feast | [Michelangelo](https://www.uber.com/blog/michelangelo-machine-learning-platform/) |
| **Exploration budget** | A fixed share of impressions goes to uncertain items (epsilon-greedy/Thompson) to keep the feedback loop alive | Netflix, Spotify | [Bandit algorithms](https://tor-lattimore.com/downloads/book/book.pdf) |

### Fraud detection

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Two-phase scoring** | Cheap velocity rules clear most events; only the grey zone reaches the model, cutting inference cost | Stripe Radar, banks | [Stripe Radar](https://stripe.com/radar) |
| **Graph/ring detection** | Streaming union-find over shared devices, cards and addresses exposes rings invisible per-account | Stripe, PayPal | [Stripe Radar](https://stripe.com/radar) |
| **Device fingerprinting** | Stable device signals survive new accounts and link them to prior behaviour | Stripe, Sift | [Sift](https://sift.com/) |
| **Fail-open vs fail-closed tiers** | Sanctions checks fail closed; soft risk rules fail open with alerting | Banks, PSPs | [Stripe Radar](https://stripe.com/radar) |

### Airbnb (marketplace)

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **SmartStack (Synapse + Nerve)** | Local service discovery with a sidecar proxy and health checks, so callers survive a zone losing a service | Airbnb | [Synapse](https://github.com/airbnb/synapse) |
| **Chronon** | Feature platform that computes the same definition for training and serving, eliminating train/serve skew | Airbnb | [Chronon](https://airbnb.io/projects/chronon/) |
| **Airflow** | DAG scheduler for batch pipelines; Airbnb built it and donated it to Apache | Airbnb (created) | [Airflow](https://airflow.apache.org/) |
| **Interval trees for availability** | A stay search is a range-overlap query, not a per-night row scan | Booking/calendar systems | [Interval tree](https://en.wikipedia.org/wiki/Interval_tree) |
| **Escrow + two-sided trust** | Funds are held until check-in, which is what makes a stranger-to-stranger marketplace work | Airbnb, eBay | [Airbnb payments](https://www.airbnb.com/help/article/1238) |

---

## Transport & Geo

### Uber

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **H3** | Hexagonal hierarchical index, 16 resolutions; Uber created it because geohash cells are rectangular and pinch near the poles | Uber (created) | [Uber H3](https://www.uber.com/us/en/blog/h3/) · [repo](https://github.com/uber/h3) |
| **Batched dispatch** | Match a batch of riders to nearby drivers by minimising pickup ETA, instead of first-come greedy | Uber | [Uber H3](https://www.uber.com/us/en/blog/h3/) |
| **Ringpop** | Gossip membership plus consistent hashing for stateless service sharding | Uber | [Ringpop](https://github.com/uber/ringpop-node) |
| **Cadence** | Durable workflow engine: trip and payment state survives crashes, retries are explicit | Uber | [Cadence](https://cadenceworkflow.io/) |
| **Schemaless / Docstore** | Append-only sharded datastore for trip and location records, built when MySQL sharding ran out | Uber | [Uber Schemaless](https://www.uber.com/blog/schemaless-part-one-mysql-datastore/) |

### Google Maps

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **S2 cells** | Spherical quadtree; a region query becomes a set of Hilbert-curve cell ranges | Google (created) | [S2 library](https://opensource.googleblog.com/2017/12/announcing-s2-library-geometry-on-sphere.html) |
| **Contraction hierarchies** | Precomputed shortcut edges make continental shortest paths milliseconds instead of seconds | OSRM, Google | [Contraction hierarchies](https://en.wikipedia.org/wiki/Contraction_hierarchies) |
| **Map matching (HMM)** | Viterbi over candidate road segments snaps noisy GPS to the road network | Google, Uber, OSRM | [Valhalla Meili](https://valhalla.github.io/valhalla/meili/) |
| **Tile pyramid + CDN** | Vector or raster tiles keyed by z/x/y, immutable and edge-cached | Google, Mapbox | [Mapbox tiles](https://docs.mapbox.com/data/tilesets/guides/vector-tiles-introduction/) |

### Proximity service

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Geohash** | Interleaved lat/lon bits; a prefix match finds a cell, eight neighbours cover the radius | Widely used | [Geohash](https://en.wikipedia.org/wiki/Geohash) |
| **H3** | Hexagonal neighbours are equidistant, so radius search does not distort with latitude | Uber | [Uber H3](https://www.uber.com/us/en/blog/h3/) |
| **S2** | Spherical cells with exact covering of arbitrary regions | Google | [S2](https://github.com/google/s2geometry) |
| **Redis GEO** | GEOADD/GEOSEARCH over a geohash-encoded sorted set, the pragmatic hot path | Many | [Redis GEO](https://redis.io/docs/latest/commands/geoadd/) |
| **PostGIS GiST** | ST_DWithin over an R-tree for arbitrary polygons and exact geometry | Many | [PostGIS](https://postgis.net/) |

### Route reconstruction

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **HMM + Viterbi map matching** | Hidden road-segment sequence inferred from noisy pings; the standard formulation | Valhalla Meili, OSRM | [Meili](https://valhalla.github.io/valhalla/meili/) |
| **Kalman smoothing** | Constant-velocity model fills gaps and damps GPS jitter before matching | Telematics, Uber | [Kalman filter](https://en.wikipedia.org/wiki/Kalman_filter) |
| **Douglas-Peucker** | Polyline simplification within an epsilon, cutting storage and map calls | Mapping tools | [Douglas-Peucker](https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm) |
| **H3 cell consensus** | Count pings per cell to infer the route without snapping every point | Uber | [Uber H3](https://www.uber.com/us/en/blog/h3/) |

### Parking

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **ANPR/ALPR** | Plate recognition at entry and exit with a confidence threshold and a manual review queue | Parking operators | [OpenALPR](https://github.com/openalpr/openalpr) |
| **Bay sensors** | Per-space magnetometer or radar sensors report occupancy, reconciled with gate counts | Smart-city deployments | [SFpark](https://en.wikipedia.org/wiki/SFpark) |
| **Occupancy-based pricing** | Price rises with occupancy to shift demand, the SFpark model | SFpark, LA ExpressPark | [SFpark](https://en.wikipedia.org/wiki/SFpark) |

### Metro ticketing

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Closed-loop AFC** | Tap-in/tap-out with a stored-value card; fare computed on exit from the journey | Transport for London | [TfL fares](https://tfl.gov.uk/fares) |
| **Open-loop EMV (cEMV)** | Contactless bank card as the ticket; settlement batched through the acquirer | TfL, NYC OMNY | [EMVCo](https://www.emvco.com/) |
| **Offline gate mode** | Gates store taps locally and reconcile on reconnect, so a network blip does not stop the network | Metro operators | [TfL](https://tfl.gov.uk/) |

### IRCTC (rail reservations)

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Quota-segmented inventory** | General, Tatkal, ladies and senior quotas are separate pools with their own release times | Indian Railways | [Tatkal scheme](https://www.indianrail.gov.in/enquiry/StaticPages/StaticEnquiry.jsp?StaticPage=tatkal_Scheme.html) |
| **Waitlist/RAC ladder** | A deterministic promotion order on cancellation; the PNR status is derived from the booking log | Indian Railways | [PNR enquiry](https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html) |
| **Conditional seat decrement** | `UPDATE ... WHERE available > 0` (or a Redis DECR guard) so two concurrent bookings cannot take one berth | Booking systems | [Optimistic locking](https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html) |
| **Idempotent PNR** | One PNR per booking attempt; a retried payment cannot create a second reservation | Ticketing systems | [Stripe idempotency](https://docs.stripe.com/api/idempotent_requests) |
| **Virtual queue at open** | Tatkal's fixed opening time is a designed spike; pacing admission is the only way the backend survives it | Ticketing/retail | [Queue-it](https://queue-it.com/how-does-queue-it-work/) |

---

## Finance

### Stock exchange

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Single-writer matching engine** | One thread per symbol book removes locks and gives deterministic ordering | LMAX, exchanges | [LMAX architecture](https://martinfowler.com/articles/lmax.html) |
| **Disruptor ring buffer** | Lock-free, cache-friendly hand-off between stages with mechanical-sympathy batching | LMAX | [LMAX](https://martinfowler.com/articles/lmax.html) |
| **FIX protocol** | The standard order-entry and market-data session protocol between brokers and venues | Exchanges, brokers | [FIX Trading Community](https://www.fixtrading.org/standards/) |
| **Price bands / circuit breakers** | Per-instrument limits and index-level halts convert a crash into an auction instead of a cascade | Exchanges worldwide | [SEC circuit breakers](https://www.sec.gov/about/circuit-breakers) |
| **Event-sourced order book** | The log is the truth; the book is a deterministic fold, so recovery and audit are replays | Exchanges | [Event sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) |

### Algorithmic trading

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Pre-trade risk controls (Rule 15c3-5)** | Credit, order-size and price-collar checks that must reject an order *before* it reaches an exchange — a legal control, not a quality one | US broker-dealers providing market access | [SEC Market Access FAQ](https://www.sec.gov/rules-regulations/staff-guidance/trading-markets-frequently-asked-questions/divisionsmarketregfaq-0) |
| **Execution algorithms (TWAP / VWAP / POV)** | Slice a parent order into children that track time, a volume curve or a participation rate, so the footprint disappears into the tape | Every institutional desk | [SEC staff report on algorithmic trading](https://www.sec.gov/file/staff-report-algorithmic-trading-us-capital-markets) |
| **OMS vs EMS split** | The OMS is the book of record (what we intended); the EMS optimizes execution (what the market allowed) — separate systems even when one vendor ships both | Asset managers | [SS&C Advent](https://www.advent.com/news-and-insights/blog/order-management-system-vs-execution-management-system/) |
| **Embedded feed handlers** | Decode and normalize exchange feeds in a fixed microsecond budget — usually the hottest loop on the trading floor | Exegy, OneMarketData | [Exegy](https://www.exegy.com/embedded-software-feed-handlers/) |
| **FIX Orchestra** | A venue's rules of engagement as a machine-readable spec instead of a PDF, so session code can be generated and diffed | FIX Trading Community | [fix-orchestra](https://github.com/FIXTradingCommunity/fix-orchestra-spec) |
| **T+1 settlement** | US equities settle one day after trade date since May 2024, collapsing the overnight reconciliation window to a single night | SEC-regulated markets | [SEC Rule 15c6-1](https://www.sec.gov/investment/settlement-cycle-small-entity-compliance-guide-15c6-1-15c6-2-204-2) |

---

## Infrastructure

### Distributed cache

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Consistent hashing** | Ring with virtual nodes; adding a node moves about 1/N of keys instead of rehashing everything | Dynamo, memcached clients | [Dynamo paper](https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html) |
| **W-TinyLFU** | Window + frequency sketch eviction that beats plain LRU on scan-heavy workloads | Caffeine, Redis | [Caffeine](https://github.com/ben-manes/caffeine) |
| **Single-flight** | One caller recomputes a missing key while the rest wait, collapsing a stampede into one query | Go singleflight, Envoy | [singleflight](https://pkg.go.dev/golang.org/x/sync/singleflight) |
| **Redis Cluster hash slots** | 16,384 slots with CRC16; hash tags keep multi-key operations in one slot | Redis | [Redis cluster spec](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/) |
| **Write-behind** | Batches writes to the store and accepts a loss window on crash, which is why it is used for counters | Many | [Caching patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside) |

### Distributed lock manager

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Lease-based locks** | Time-bounded ownership with renewal; a crashed holder's lock expires instead of deadlocking | Chubby, etcd | [Chubby paper](https://research.google/pubs/pub44824/) |
| **Fencing tokens** | A monotonically increasing token with every lock grant, so a stalled holder's write is rejected downstream | Kleppmann's analysis | [How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) |
| **Sequenced ephemeral nodes** | ZooKeeper's ordered children give fair lock acquisition without polling | ZooKeeper | [ZooKeeper recipes](https://zookeeper.apache.org/doc/current/recipes.html) |
| **Raft log as the lock state machine** | Every acquire/release is a log entry, so the lock state is replicated and replayable | etcd, Consul | [Raft](https://raft.github.io/) |
| **Redlock critique** | A majority of independent Redis nodes is not a consensus system; clock jumps and GC pauses break the safety argument | Analysis, not a product | [Kleppmann](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) |

### Key-value store

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Dynamo model** | Consistent hashing, vector clocks, quorum reads/writes and Merkle-tree repair in one design | Amazon Dynamo | [Dynamo paper](https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html) |
| **LSM tree** | Memtable + SSTables + compaction; writes are appends and reads pay a level search | RocksDB, LevelDB, Cassandra | [RocksDB wiki](https://github.com/facebook/rocksdb/wiki) |
| **Quorum R + W > N** | Tunes consistency per operation instead of per cluster | Dynamo, Cassandra | [Dynamo paper](https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html) |
| **Merkle anti-entropy** | Hash trees locate divergent ranges so repair moves only the differences | Dynamo, Cassandra | [Dynamo paper](https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html) |
| **Bloom filters per SSTable** | Skip files that cannot contain the key, turning a level search into a few reads | RocksDB, Cassandra | [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) |

### File storage

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **S3 object model** | Flat key space, immutable objects, strong read-after-write consistency, multipart upload | AWS S3 | [S3 consistency](https://aws.amazon.com/s3/consistency/) |
| **Erasure coding** | Reed-Solomon k-of-n shards survive failures at lower storage overhead than 3x replication | S3, Azure, Ceph | [Reed-Solomon](https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction) |
| **Content-defined chunking** | Rabin fingerprints cut at content boundaries, so inserts do not shift every downstream chunk | Backup systems, Dropbox | [Rolling hash](https://en.wikipedia.org/wiki/Rolling_hash) |
| **Presigned URLs** | Scope-limited, time-boxed credentials so bytes bypass the API tier | S3, GCS | [S3 presigned](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html) |

### Rate limiter

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Token bucket** | Capacity plus refill rate; bursts are allowed up to the bucket, and the model maps directly to a tenant plan | Stripe | [Stripe rate limiters](https://stripe.com/blog/rate-limiters) |
| **Sliding-window counter** | Two adjacent fixed windows weighted by overlap, cheap and accurate enough for edge limits | Cloudflare | [Cloudflare counting](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/) |
| **GCRA** | A leaky bucket expressed as a single theoretical-arrival-time timestamp; one key, no window counters | Throttled library (Stripe) | [GCRA](https://brandur.org/rate-limiting) |
| **Local buckets + periodic sync** | Cut Redis round trips by enforcing locally and reconciling a shared budget every few hundred ms | Large API fleets | [Stripe rate limiters](https://stripe.com/blog/rate-limiters) |
| **Retry-After on 429** | Tells the client when to come back, which is the difference between backoff and a retry storm | HTTP standard | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) |

### Unique ID generator

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Snowflake** | 64-bit timestamp + machine + sequence; sortable and coordination-free | Twitter (created), Discord | [Snowflake](https://github.com/twitter-archive/snowflake) |
| **ULID** | 128-bit, lexicographically sortable, Crockford base32; random tail removes the machine-id problem | Widely used | [ULID spec](https://github.com/ulid/spec) |
| **Sonyflake** | Snowflake variant with a longer lifetime and a different machine-id width | Sony | [Sonyflake](https://github.com/sony/sonyflake) |
| **Segment/range allocation** | A node leases a block of ids from the database, then mints locally; one round trip per block | Flickr ticket servers | [Ticket server](https://code.flickr.net/2010/02/08/ticket-servers-distributed-unique-primary-keys-on-the-cheap/) |
| **Clock-rollback guard** | Refuse to mint while the clock is behind the last timestamp, rather than risk duplicate ids | Snowflake implementations | [Snowflake](https://github.com/twitter-archive/snowflake) |

### URL shortener

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Base62 encoding** | 62^7 is about 3.5 trillion keys and avoids URL-hostile characters | bit.ly-style services | [Base62](https://en.wikipedia.org/wiki/Base62) |
| **Key-generation service** | Pre-mints unused keys so creation never does a per-URL database round trip | bit.ly (described) | [System design](https://github.com/donnemartin/system-design-primer) |
| **301 vs 302** | 301 is cached and loses analytics; 302 keeps every click measurable | Marketing links | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) |
| **Bloom filter pre-check** | Reject "does this code exist?" lookups without touching the database | Large link fleets | [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) |

### Pastebin

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Object storage + TTL** | Paste bodies in object storage with a lifecycle rule; metadata in a small database | S3-style services | [S3 lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html) |
| **Content-hash dedupe** | Identical pastes share one blob; the key is the hash, the public id is separate | Pastebin-style | [Content-addressable storage](https://en.wikipedia.org/wiki/Content-addressable_storage) |
| **Syntax highlighting at render** | Highlight on the client or at edge, never in the write path | Pastebin, GitHub Gist | [highlight.js](https://highlightjs.org/) |

### Search engine

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Inverted index + BM25** | Term postings with BM25 term saturation and length normalization, the Lucene default | Elasticsearch, Lucene | [Elasticsearch BM25](https://www.elastic.co/docs/solutions/search/full-text/how-full-text-works) |
| **WAND / MaxScore** | Skip documents that cannot enter the top-k, turning a full scan into a few postings reads | Lucene, Vespa | [WAND paper](https://www.researchgate.net/publication/221301109_Efficient_Query_Evaluation_with_WAND) |
| **HNSW** | Graph ANN index for vector/semantic recall, now a first-class field type in Elasticsearch | Elasticsearch, FAISS, Vespa | [HNSW paper](https://arxiv.org/abs/1603.09320) |
| **Immutable segments** | Readers never lock; deletes are tombstones and merges reclaim space | Lucene | [Lucene](https://lucene.apache.org/) |
| **Sharding + scatter-gather** | Each shard returns top-r, the coordinator merges top-k; r/k is tuned to bound fan-out | Elasticsearch | [Elasticsearch](https://www.elastic.co/docs) |

### Search autocomplete

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **FST (finite-state transducer)** | Compact prefix structure with shared suffixes; Lucene's suggestion module is built on it | Lucene, Elasticsearch | [Lucene FST](https://lucene.apache.org/core/) |
| **Trie with top-K per node** | O(prefix) lookup, memory-bound; the classic interview answer and a real production option at small scale | Many | [Trie](https://en.wikipedia.org/wiki/Trie) |
| **Time-decayed counts** | A short window for trending plus a long window for evergreen; raw all-time counts fossilise | Google, Bing | [Count-Min sketch](https://en.wikipedia.org/wiki/Count%E2%80%93min_sketch) |
| **Prefix cache** | The head of the query distribution is tiny; cache the top prefixes at the edge | Large search fronts | [CDN caching](https://www.cloudflare.com/learning/cdn/what-is-caching/) |

### Web crawler

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Politeness per host** | Per-host queues with crawl-delay, so one slow server is never hit in parallel by two workers | Googlebot, Common Crawl | [robots.txt](https://www.rfc-editor.org/rfc/rfc9309) |
| **Bloom filter dedupe** | O(1) "seen this URL" with false positives only, the correct error direction for a crawler | Common Crawl | [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) |
| **SimHash near-duplicate** | 64-bit content fingerprint; Hamming distance finds mirrors and scraped copies | Google (described) | [SimHash](https://www.cs.princeton.edu/courses/archive/spr04/cos598B/bib/CharikarEstim.pdf) |
| **Conditional GET** | ETag/If-Modified-Since avoids re-downloading unchanged pages | All crawlers | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) |
| **Sitemap ingestion** | Publishers declare URLs and change frequency, shortcutting discovery | Google, Bing | [sitemaps.org](https://www.sitemaps.org/protocol.html) |

### Notification system

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **APNs / FCM** | Platform push with per-device tokens, collapse keys and a 4 KB payload limit | Apple, Google | [FCM](https://firebase.google.com/docs/cloud-messaging) |
| **Fan-out with dedupe keys** | One logical notification per (user, event, channel), so a retry does not page someone twice | Large consumer apps | [Idempotency](https://docs.stripe.com/api/idempotent_requests) |
| **Quiet hours + preferences** | A per-user matrix of channel by category, enforced before send | Every mature notifier | [OneSignal](https://documentation.onesignal.com/) |
| **Channel fallback chain** | Push, then SMS, then email, with a time budget so a late fallback is not useless | OTP/alerting systems | [Twilio](https://www.twilio.com/docs) |

### Alerting

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **SLO burn-rate alerts** | Page when the error budget burns fast over a long window, not when a single metric crosses a line | Google SRE | [Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/) |
| **Alertmanager grouping + inhibition** | One notification per incident, and child alerts suppressed while the parent fires | Prometheus | [Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/) |
| **`for:` durations** | A pending state suppresses flaps without hiding real outages | Prometheus | [Alerting rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/) |
| **Dead-man's switch** | A heartbeat alert fires when the alerting pipeline itself goes silent | Alertmanager, Healthchecks.io | [Watchdog](https://prometheus.io/docs/alerting/latest/alertmanager/) |

### Observability pipeline

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **OTel Collector** | Vendor-neutral agents with receivers, processors (batch, memory limiter, tail sampling) and exporters | OpenTelemetry adopters | [Collector](https://opentelemetry.io/docs/collector/) |
| **Gorilla compression** | Delta-of-delta timestamps and XOR floats cut a sample to about 1.7 bytes | Prometheus, M3 | [Gorilla paper](https://www.vldb.org/pvldb/vol8/p1816-teller.pdf) |
| **Tail-based sampling** | Buffer a trace, keep errors and outliers, sample the boring rest | Tempo, OTel Collector | [Tail sampling](https://opentelemetry.io/docs/concepts/sampling/) |
| **Tiered downsampling** | Raw for days, 1m for months, 1h for years; queries pick the cheapest tier | Mimir, Thanos | [Thanos](https://thanos.io/) |
| **Cardinality governor** | Cap series per metric and coalesce the offending label instead of taking down the TSDB | Mimir, Datadog | [Cardinality](https://grafana.com/docs/mimir/latest/) |

### Serverless

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Firecracker microVMs** | KVM microVMs with ~125 ms boot and a small memory footprint, the substrate behind Lambda | AWS | [Firecracker](https://firecracker-microvm.github.io/) |
| **V8 isolates** | No VM at all: many tenants share a process with isolate-level isolation, giving sub-ms cold starts | Cloudflare Workers | [Workers](https://developers.cloudflare.com/workers/) |
| **Snapshot restore** | Serialize a warmed runtime once, then mmap it per invocation | AWS Lambda, Cloudflare | [Firecracker](https://firecracker-microvm.github.io/) |
| **Predictive pre-warming** | Forecast traffic and pre-place workers before the spike, since cold starts are the SLA | Lambda provisioned concurrency | [Provisioned concurrency](https://docs.aws.amazon.com/lambda/latest/dg/provisioned-concurrency.html) |

### Code deployment

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Canary analysis** | Compare canary and baseline cohorts statistically before promoting, the Kayenta/Argo Rollouts model | Netflix, Google | [Kayenta](https://netflixtechblog.com/automated-canary-analysis-at-netflix-with-kayenta-3260bc7acc69) |
| **Blue-green** | Two identical fleets, switch traffic at the router, keep the old one for instant rollback | Many | [Blue-green](https://martinfowler.com/bliki/BlueGreenDeployment.html) |
| **Progressive delivery** | Rollouts automated by metrics, not by a human watching a dashboard | Argo Rollouts, Flagger | [Argo Rollouts](https://argoproj.github.io/rollouts/) |
| **Feature flags** | Decouple deploy from release; the kill switch is a flag, not a redeploy | LaunchDarkly, Unleash | [Feature flags](https://martinfowler.com/articles/feature-toggles.html) |
| **GitOps reconciliation** | Git is desired state; a controller continuously reconciles drift | Argo CD, Flux | [Argo CD](https://argo-cd.readthedocs.io/) |

### Delayed job scheduler

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Timing wheels** | Hierarchical buckets give O(1) insert and expiry for millions of short delays | Kafka (purgatory), Netty | [Hashed wheel timer](https://netty.io/4.1/api/io/netty/util/HashedWheelTimer.html) |
| **Delay topics** | A broker topic per delay bucket, consumed when due; no external scheduler needed | Kafka-based systems | [Kafka](https://kafka.apache.org/documentation/) |
| **Durable execution** | Workflow state persists after each step, so a crash resumes mid-flow instead of restarting | Temporal, Cadence | [Temporal](https://docs.temporal.io/) |
| **Transactional outbox for enqueue** | Job row and outbox commit together; the publisher cannot lose the job | Scheduler backends | [Outbox](https://microservices.io/patterns/data/transactional-outbox.html) |
| **Full jitter** | Randomises retry and due-time release so a burst does not become a thundering herd | AWS guidance | [Backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/) |

### Leaderboard

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Redis sorted set** | Skip list + hash table gives O(log N) insert and O(log N + K) rank/range queries | Redis (documented leaderboard use case) | [Redis ZSET](https://redis.io/docs/latest/develop/data-types/sorted-sets/) |
| **Score-band sharding** | Split a global board by score range, because user-hash sharding makes top-K a full scatter | Large game backends | [Redis ZSET](https://redis.io/docs/latest/develop/data-types/sorted-sets/) |
| **Sharded counters** | N sub-counters summed at read, avoiding one hot key per viral item | Many | [Hot key](https://redis.io/docs/latest/develop/reference/) |
| **Sliding-window scoreboards** | "Last 24h" boards expire old scores instead of recomputing from an event log | Game/consumer apps | [Redis ZSET](https://redis.io/docs/latest/develop/data-types/sorted-sets/) |

### Webhook delivery

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **HMAC request signing** | A shared secret signs timestamp + body, so the receiver can verify authenticity and freshness | Stripe, GitHub | [Stripe webhooks](https://docs.stripe.com/webhooks) |
| **Exponential backoff with jitter** | Retries spread over hours instead of hammering a broken endpoint | Stripe, GitHub | [Backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/) |
| **Idempotency on the receiver** | Event ids let the receiver dedupe, because at-least-once delivery is the only honest guarantee | Stripe | [Stripe webhooks](https://docs.stripe.com/webhooks) |
| **SSRF egress guard** | Resolve and allowlist the destination; never POST to link-local or metadata addresses | Security best practice | [OWASP SSRF](https://owasp.org/www-community/attacks/Server_Side_Request_Forgery) |

---

## AI Infrastructure

### AI gateway

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **LiteLLM-style unified API** | One OpenAI-compatible surface mapped onto many providers, so swapping models is config | LiteLLM adopters | [LiteLLM](https://github.com/BerriAI/litellm) |
| **Provider prompt caching** | Providers bill cached prefix tokens at a fraction of input; the gateway must preserve stable prefixes | Anthropic, OpenAI | [Anthropic caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) |
| **tiktoken tokenizers** | Exact token counts per model family; a shared estimate is wrong by 10-30% | OpenAI ecosystem | [tiktoken](https://github.com/openai/tiktoken) |
| **Semantic cache** | Embedding similarity within a tenant + model-version scope, with revocation on prompt change | GPTCache-style systems | [GPTCache](https://github.com/zilliztech/GPTCache) |
| **Estimate-then-settle accounting** | Reserve on `max_tokens`, settle on reported usage, then correct the counter | Metered inference platforms | [OpenAI usage](https://platform.openai.com/docs/api-reference/chat/object) |

### LLM inference

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **PagedAttention** | KV cache as virtual memory blocks with a page table, eliminating fragmentation and enabling sharing | vLLM | [vLLM paper](https://arxiv.org/abs/2309.06180) |
| **Continuous batching** | Iteration-level scheduling lets requests join and leave each decode step | ORCA, vLLM | [ORCA](https://www.usenix.org/conference/osdi22/presentation/yu) |
| **Prefix caching** | Reuse KV pages for a shared prompt prefix; multi-turn chat hits are nearly 100% per turn | vLLM, SGLang | [vLLM](https://docs.vllm.ai/) |
| **Speculative decoding** | A draft model proposes k tokens, the target verifies in one pass, output distribution unchanged | vLLM, TensorRT-LLM | [Speculative decoding](https://arxiv.org/abs/2211.17192) |
| **Quantization (FP8/INT8/AWQ)** | Shrinks weights and KV cache so a model fits on fewer GPUs at similar quality | TensorRT-LLM, vLLM | [AWQ](https://arxiv.org/abs/2306.00978) |

### A/B testing

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Deterministic hashing** | `hash(salt:unit)` to a bucket, so every service agrees without coordination | GrowthBook, PlanOut | [GrowthBook](https://github.com/growthbook/growthbook) |
| **Layered experiments** | Per-layer salts keep concurrent tests orthogonal | Microsoft ExP, Airbnb | [Microsoft ExP](https://www.microsoft.com/en-us/research/group/experimentation-platform-exp/) |
| **CUPED** | Pre-period covariates absorb variance, raising effective sample size 30-50% | Microsoft, Netflix | [CUPED paper](https://alexdeng.github.io/public/files/kdd2023-inexp.pdf) |
| **SRM detection** | Chi-square on the observed split catches a broken randomiser before anyone trusts the result | Microsoft (Fabijan et al.) | [SRM paper](https://exp-platform.com/Documents/2019_KDDFabijanGupchupFuptaOmhoverVermeerDmitriev.pdf) |
| **Always-valid inference** | Mixture SPRT keeps false positives controlled under continuous peeking | Optimizely, Statsig | [Always Valid Inference](https://arxiv.org/pdf/1512.04922) |
| **Switchback tests** | Alternate treatment by time block when units interfere (marketplaces, pricing) | Uber, Lyft | Bojinov, Simchi-Levi & Zhao, *Design and Analysis of Switchback Experiments* (2023) |

---

## Productivity

### Google Docs

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Operational transformation** | The server transforms concurrent ops so replicas converge; Google's Jupiter design | Google Docs | [OT paper](https://dl.acm.org/doi/10.1145/67544.66932) |
| **CRDT** | Commutative data types converge without a central transformer; Yjs and Automerge are the references | Figma (CRDT-like), Yjs | [Yjs](https://github.com/yjs/yjs) |
| **Op log + snapshots** | History is an append-only log with periodic snapshots, so restore is an op rather than a truncation | Docs, Figma | [Figma multiplayer](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/) |
| **Presence channels** | Ephemeral, lossy cursor/selection state on a separate path from document ops | Docs, Figma | [Figma multiplayer](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/) |

### Google Calendar

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **RRULE (RFC 5545)** | Recurrence rules expanded over a window instead of materialising infinite events | Google, Apple | [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545) |
| **IANA tz database** | Named zones with historical rules, so "9am" survives DST and political changes | Everyone | [tz database](https://www.iana.org/time-zones) |
| **Interval trees for free/busy** | O(log n + k) overlap queries instead of scanning a user's events | Calendar backends | [Interval tree](https://en.wikipedia.org/wiki/Interval_tree) |
| **CalDAV** | The standard sync protocol for third-party calendar clients | Apple, Fastmail | [RFC 4791](https://www.rfc-editor.org/rfc/rfc4791) |

### Online judge

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **seccomp + namespaces** | Restrict syscalls and isolate the filesystem/network without a full VM | nsjail, gVisor | [nsjail](https://github.com/google/nsjail) |
| **cgroup limits** | CPU, memory and process caps per submission so one infinite loop cannot take the host | Linux cgroups | [cgroups](https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html) |
| **Per-language queues** | Compile-time diversity: Python submissions never wait behind a Rust compile | Judges at scale | [Judge0](https://github.com/judge0/judge0) |
| **Warm sandbox pools** | Pre-booted sandboxes amortise the isolation cost across submissions | Serverless pattern | [Firecracker](https://firecracker-microvm.github.io/) |

---

## Dating & Communities

### Tinder

| Concept | What it actually does | Who runs it | Source |
| :--- | :--- | :--- | :--- |
| **Elo-style rating** | Pairwise preference updates a score; Tinder has described moving to ML ranking since | Tinder (historical) | [Tinder engineering](https://medium.com/tinder-engineering) |
| **Cell-based candidate generation** | Nearby candidates from a spatial index, then preference and activity filters | Tinder-class apps | [Geohash](https://en.wikipedia.org/wiki/Geohash) |
| **Reciprocity signal** | Ranking blends who already liked you, which is why likes are not symmetric | Tinder, Bumble | [Tinder engineering](https://medium.com/tinder-engineering) |
| **Exploration budget** | A share of impressions goes to less-certain candidates to avoid a feedback-loop collapse | Dating/recsys | [Bandit algorithms](https://tor-lattimore.com/downloads/book/book.pdf) |

*Reddit's ranking concepts (Wilson score, hot decay, materialised paths) are covered under [Social & Messaging](#reddit) above.*

---

## How to use this map

1. **Name the concept, then the mechanism.** "H3 cells at resolution 8, because hex neighbours are equidistant" beats "a geo index".
2. **Say why the company's constraint forced the choice.** Uber's H3 exists because geohash rectangles distort; Stripe's ledger exists because money must reconcile.
3. **Distinguish documented from folklore.** If a design says "Swiggy uses geohash", ask for the source — this map marks the cases where the public record is thin.
4. **Pick the boring option when the constraint is absent.** H3 is not better than PostGIS for 10,000 parking spaces; the concept is a tool, not a badge.

**Caveats.** Company architecture changes; a 2019 blog post describes a 2019 system. Several rows describe a technique a company documents without naming the exact algorithm (marked *documented use*). Papers and official docs are preferred over secondary summaries, and vendor marketing was not used as evidence.
