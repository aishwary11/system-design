# System Design: Proximity / Nearby Service

## Overview

A geospatial service that finds nearby users, drivers, restaurants, or stores based on geographic location with sub-second response times.

### Key Numbers

- 100M+ location updates per minute
- 10M+ queries per minute for nearby search
- 1M+ moving entities tracked simultaneously
- Sub-second response time

---

## Requirements

### Functional Requirements

- Search nearby venues within radius
- View venue details and reviews
- Get directions to venue
- Save favorites and share
- Filter by cuisine, price, rating

### Non-Functional Requirements

- Latency: Nearby search < 200ms
- Throughput: 100K+ searches/sec
- Availability: 99.99% uptime
- Consistency: Eventually consistent venue data
- Scale: 100M+ venues, 500M+ users

---

---

---

## High-Level Architecture

### Architecture Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1762" width="900" role="img" aria-label="Proximity Service — System Architecture">
<rect x="0" y="0" width="960" height="1762" fill="#ffffff"/>
<title>Proximity Service — System Architecture</title>
<rect x="52" y="288" width="795" height="1374" rx="10" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6 4"/>
<text x="66" y="308" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="12" fill="#475569">Proximity Service</text>
<path d="M450 132 L450 156 L466 156 L466 298 L450 298 L450 322" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\proximity-service)"/>
<path d="M450 384 L450 574" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\proximity-service)"/>
<path d="M436 636 L436 731 L192 731 L192 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\proximity-service)"/>
<path d="M450 636 L450 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\proximity-service)"/>
<path d="M464 636 L464 731 L708 731 L708 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\proximity-service)"/>
<path d="M192 888 L192 983 L153 983 L153 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\proximity-service)"/>
<path d="M450 888 L450 983 L424 983 L424 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\proximity-service)"/>
<path d="M708 888 L708 912 L737 912 L737 1054 L721 1054 L721 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\proximity-service)"/>
<path d="M153 1140 L153 1235 L436 1235 L436 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\proximity-service)"/>
<path d="M424 1140 L424 1235 L450 1235 L450 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\proximity-service)"/>
<path d="M721 1140 L721 1235 L464 1235 L464 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\proximity-service)"/>
<path d="M436 1392 L436 1487 L192 1487 L192 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\proximity-service)"/>
<path d="M450 1392 L450 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\proximity-service)"/>
<path d="M464 1392 L464 1487 L708 1487 L708 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\proximity-service)"/>
<rect x="376" y="70" width="148" height="62" rx="9" fill="#ecfdf5" stroke="#059669" stroke-width="1.6"/>
<text x="450" y="106" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#065f46">Mobile App</text>
<rect x="369" y="322" width="161" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="449.5" y="358" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">WAF / API Gateway</text>
<rect x="367" y="574" width="165" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="449.5" y="610" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Load Balancer (ALB)</text>
<rect x="118" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="192" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Proximity Svc</text>
<rect x="376" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="450" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Venue Service</text>
<rect x="634" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="708" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Review Service</text>
<rect x="118" y="1582" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="192" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Geo Workers</text>
<rect x="376" y="1582" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="450" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Analytics</text>
<rect x="634" y="1582" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="708" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Notifications</text>
<rect x="70" y="1078" width="165" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="152.5" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">Redis GEO + PostGIS</text>
<rect x="345" y="1078" width="158" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="424" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">PostgreSQL + Redis</text>
<rect x="613" y="1078" width="216" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="721" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">PostgreSQL + Elasticsearch</text>
<rect x="376" y="1330" width="148" height="62" rx="9" fill="#fff7ed" stroke="#ea580c" stroke-width="1.6"/>
<text x="450" y="1366" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#9a3412">Kafka</text>
<defs><marker id="arr-D:\Aish\Coding\System-Design\diagrams\json\proximity-service" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/system-design/proximity-service.architecture.html](diagrams/system-design/proximity-service.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


*Solid = data flow, dashed = control plane / monitoring.*

### Data Flow

1. User opens app - Proximity Service queries Redis GEO
2. Returns top-10 venues within 5km, sorted by distance + rating
3. Venue Service loads details: hours, photos, menu from cache
4. User checks in - Kafka event - update venue popularity score
5. Reviews stored in PostgreSQL, indexed in Elasticsearch
6. Geohash-based caching: hot areas cached in Redis
7. Analytics: check-in patterns, popular times, trending venues

## Microservices

### 1. Location Ingestion Service

- **Responsibility**: Receive location updates from devices, validate, normalize, publish to Kafka
- **Tech**: Go
- **Queue**: Kafka (location updates)
- **Rate Limiting**: Per-device rate limiting

### 2. Location Storage Service

- **Responsibility**: Store latest location per entity, update geospatial index, handle high write throughput
- **Tech**: Go
- **DB**: Redis (latest location + GEO index), PostgreSQL/PostGIS (persistent)
- **Pattern**: Write-behind to persistent store

### 3. Nearby Search Service

- **Responsibility**: Find nearby entities within radius, sort by distance, filter by attributes
- **Tech**: Go
- **DB**: Redis GEO (GEORADIUS), PostGIS (complex queries)
- **Cache**: Redis (recent search results)

### 4. Geofence Service

- **Responsibility**: Define geographic boundaries, trigger events when entities enter/exit geofences
- **Tech**: Python / Go
- **DB**: PostGIS (polygon storage)
- **Queue**: Kafka (geofence events)

### 5. ETA Calculation Service

- **Responsibility**: Estimate time of arrival, route optimization, traffic-aware routing
- **Tech**: Go / Python
- **External**: Google Maps API / OSRM / Mapbox

---

## Database Design

### Redis (Primary - Real-Time)

```
# Store location (Geo Hash)
GEOADD entities:locations {longitude} {latitude} {entity_id}

# Find nearby entities (5km radius, max 10 results)
GEORADIUS entities:locations {lon} {lat} 5 km ASC COUNT 10 WITHDIST WITHCOORD

# Store latest location details
HSET entity:{entity_id} lat {lat} lng {lng} speed {speed} heading {heading} updated_at {ts}

# Geofence membership
SADD geofence:{zone_id} {entity_id}

# Location history (last N updates)
LPUSH location:history:{entity_id} {json}
LTRIM location:history:{entity_id} 0 99
```

### PostGIS (Persistent - Complex Queries)

```sql
-- Entities table with geospatial index
CREATE TABLE entities (
    entity_id       UUID PRIMARY KEY,
    entity_type     VARCHAR(50),
    latitude        DECIMAL(10,8) NOT NULL,
    longitude       DECIMAL(11,8) NOT NULL,
    location        GEOMETRY(POINT, 4326) NOT NULL,
    speed           DECIMAL(5,2),
    heading         DECIMAL(5,2),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Geospatial index
CREATE INDEX idx_entities_location ON entities USING GIST (location);

-- Find nearby entities (PostGIS query)
SELECT entity_id, ST_Distance(
    location, ST_Point({lon}, {lat})::geography
) AS distance_meters
FROM entities
WHERE ST_DWithin(
    location, ST_Point({lon}, {lat})::geography, 5000
)
ORDER BY distance_meters
LIMIT 10;

-- Geofences table
CREATE TABLE geofences (
    zone_id         UUID PRIMARY KEY,
    name            VARCHAR(255),
    boundary        GEOMETRY(POLYGON, 4326),
    zone_type       VARCHAR(50),
    created_at      TIMESTAMP DEFAULT NOW()
);
```

### S2 Geometry (Google's Spatial Index)

```
# S2 Cell Hierarchy
Level 0:  ~5,000 km cells (continent)
Level 6:  ~1,000 km cells (country)
Level 10: ~10 km cells (city)
Level 15: ~100 m cells (neighborhood)
Level 20: ~1 m cells (street)

# Entity stored in multiple S2 cells at different levels
# Enables efficient proximity search at various distances
```

---

## Scaling Tiers

### Tier 1: 1K - 10K Users

| Component | Choice |
| ----------- | -------- |
| **Compute** | 2 EC2 (t3.large) |
| **Database** | Redis GEO (single) |
| **Persistent** | PostgreSQL + PostGIS |
| **Queue** | Redis Streams |
| **ETA** | Google Maps API |

### Tier 2: 10K - 1M Users

| Component | Choice |
| ----------- | -------- |
| **Compute** | ECS (10-30 containers) |
| **Database** | Redis Cluster (6 nodes) |
| **Persistent** | PostgreSQL + PostGIS (read replicas) |
| **Queue** | Kafka (3 brokers) |
| **Search** | Elasticsearch (geo queries) |
| **ETA** | Mapbox / OSRM |

### Tier 3: 1M - 10M+ Users

| Component | Choice |
| ----------- | -------- |
| **Compute** | Multi-region K8s (200+ pods) |
| **Database** | Redis Cluster (30+ nodes) |
| **Persistent** | PostgreSQL + PostGIS (sharded) |
| **Queue** | Kafka (15+ brokers) |
| **Index** | S2 Cells + Quadtree |
| **ETA** | Custom routing engine |

---

## Key Design Decisions

### 1. Why Redis GEO over PostGIS for Hot Queries?

- Redis GEO: O(log N) for GEORADIUS, sub-millisecond
- PostGIS: O(N) for complex polygon queries, millisecond-range
- Use Redis for hot nearby searches, PostGIS for complex spatial queries

### 2. Why S2 Cells over Geohashing?

- S2 cells are hierarchical (multi-level)
- Better for variable-radius searches
- Used by Google Maps internally
- Supports polygon containment checks

### 3. Why Kafka for Location Updates?

- 100M+ updates/minute needs durable queue
- Decouples ingestion from processing
- Enables replay for index rebuilding

### 4. Location Update Frequency

- Moving vehicles: every 4 seconds (Uber standard)
- Walking users: every 30 seconds
- Stationary users: every 5 minutes
- Battery-aware adaptive frequency

### 5. Write-Behind Pattern

- Write to Redis immediately (fast)
- Async batch write to PostgreSQL (durable)
- 5-10 second delay acceptable for persistent store

---

## Failure Modes & Recovery
What can go wrong in production, and how the system detects and recovers:

| Failure | Impact | Recovery |
| --------- | -------- | ---------- |
| Geohash edge case | Venues near boundary missed | Search 8 neighboring cells, Haversine fallback |
| Redis GEO stale | Closed venue still shows | TTL on data, periodic re-indexing |
| Venue data inconsistency | Rating differs search vs detail | Single source PostgreSQL, cache invalidation |
| Search spike lunch hours | Search takes > 500ms | Auto-scale replicas, CDN cache popular areas |
| Maps API quota exceeded | Directions unavailable | Cached routes, basic distance fallback |
| Review spam attack | Fake reviews flood venue | Rate limiting, ML spam detection |

---

## Cost Estimation (1M Users)
Rough monthly cost of running this design for one million users:

| Component | Specification | Monthly Cost |
| ----------- | -------------- | ------------- |
| API Servers | 20x c5.xlarge | $2,800 |
| PostgreSQL + PostGIS | db.r5.xlarge + 3 replicas | $4,800 |
| Redis GEO Cluster | 6x cache.r5.xlarge | $4,800 |
| Elasticsearch | 15x m5.xlarge | $6,300 |
| Google Maps API | 20M requests/day | $6,000 |
| CDN | 20TB/month transfer | $1,600 |
| Venue Data Pipeline | Kafka + workers | $2,400 |
| **Total** | | **~$28,700/month** |

---

## Trade-off Analysis
The alternatives considered, and which one won and why:

| Approach A | Approach B | Winner | Reason |
| ----------- | ----------- | -------- | -------- |
| Redis GEO | PostGIS | Redis GEO | Sub-ms proximity queries |
| Geohash | Quadtree | Geohash | Simpler, better for distributed systems |
| Haversine | Euclidean | Haversine | Accurate for earth-surface distances |
| Elasticsearch | PostgreSQL | Elasticsearch | Better geo-query support |
| Redis cache | Database cache | Redis | Sub-ms cached results |

---

## Key Metrics to Monitor
The metrics that signal system health, with alert thresholds:

| Metric | Target |
| -------- | -------- |
| Nearby search latency (p99) | < 100ms |
| Location update latency | < 50ms |
| Location accuracy | < 10 meters |
| ETA accuracy | +/- 2 minutes |
| Geofence trigger latency | < 5s |
| API response time (p99) | < 200ms |
| Location updates per second | 1M+ |
| Nearby query throughput | 10K+ qps |
| System availability | 99.95% |
| Redis GEO query latency | < 10ms |

---

---

## Deep Dive Prompts

- How does Geohash index enable fast proximity queries?
- How do you calculate accurate distance using Haversine formula?
- How do you handle cache invalidation for location-based data?
- How do you scale to 100M+ venue searches per day?

---

## Key Techniques & Patterns
The recurring techniques and patterns this design applies, mapped to where they are used:

| Technique | Description | Used In |
| ----------- | ------------- | ---------- |
| Geohash Indexing | Applied in this system | Architecture + LLD |
| Quadtree for Spatial Queries | Applied in this system | Architecture + LLD |
| Redis GEO Commands | Applied in this system | Architecture + LLD |
| Geofencing | Applied in this system | Architecture + LLD |
| Haversine Distance | Applied in this system | Architecture + LLD |
| Geospatial Sharding | Applied in this system | Architecture + LLD |

## Common Interview Follow-ups

**Q: How do you handle geohash edge cases?**
A: Search 8 neighboring cells, Haversine fallback, bounding box query

**Q: How do you scale to 100K+ queries/sec?**
A: Redis GEO O(log N), CDN cache popular areas, read replicas

**Q: How do you keep venue data fresh?**
A: TTL invalidation, periodic re-indexing, crowd-sourced updates

---

## Low-Level Design (LLD) - Algorithms & Data Structures

### 1. Geohash Algorithm

```text
class GeoService {
  // Find nearby venues using Redis GEO
  // Time Complexity: O(log N + M) where M = results
  constructor(redisClient) {
    this.r = redisClient;
  }

  async findNearby(lat, lon, radiusKm = 5) {
    const results = await this.r.georadius(
      'venues:locations', lon, lat, radiusKm, 'km', 'WITHDIST', 'ASC'
    );

    const venues = [];
    for (const [venueId, distance] of results.slice(0, 50)) {
      const details = await this.r.hgetall('venue:' + venueId);
      if (details && Object.keys(details).length > 0) {
        venues.push({ venueId, distance: parseFloat(distance), ...details });
      }
    }
    return venues;
  }

  async addVenue(venueId, lat, lon, metadata) {
    await this.r.geoadd('venues:locations', lon, lat, venueId);
    await this.r.hset('venue:' + venueId, metadata);
  }

  async getDistance(venue1, venue2) {
    return this.r.geodist('venues:locations', venue1, venue2, 'km');
  }
}

const geo = new GeoService(); console.log("Geo service ready");
```

### 2. Haversine Distance Formula

```text
const math = require('math');

function haversine_distance(lat1, lng1, lat2, lng2) {
    // Calculate distance between two points on Earth
    // Returns distance in kilometers

```

### 3. Quadtree (Spatial Index)

```text
class Quadtree {
    // Quadtree for efficient spatial queries
    // - Recursively subdivides space into 4 quadrants

```

### 4. S2 Cell ID (Google's Spatial Index)

```text
function get_s2_cell(lat, lng, level=15) {

```
