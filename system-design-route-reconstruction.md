<div align="center">

# System Design: Route Reconstruction from Noisy GPS (Route IQ)

</div>

> [!TIP]
> **TL;DR** — An end-to-end spatial pipeline that turns millions of chaotic last-mile GPS traces into high-fidelity ground truth: joint anomaly scoring → Kalman smoothing → OSRM map-matching with confidence labels → H3 + Hidden-Markov-Model consensus paths → real-time deviation scoring. Based on Zepto's Route IQ architecture.

## Overview

A rider's phone emits a GPS ping every few seconds, but in narrow alleys, flyovers, and dense tech parks the trace "spatters": pings lag, vanish for minutes, bounce off glass facades, or teleport a rider into a lake. Computing Haversine distance over raw coordinates runs **30–40% off** actual distance — and rider distance feeds rider compensation, ETA models, and geofence optimization, so the error cascades across the business. Route IQ answers four questions: *what route did the rider take, are they stalled, what route should they have taken, and did they deviate?*

### Key Numbers

| Metric | Value |
| :--- | :--- |
| **Trips processed** | millions per pipeline run |
| **Ping frequency** | one every few seconds, accuracy 5m → 200m |
| **Raw distance error** | 30–40% off ground truth |
| **Speed sanity bound** | 60 km/h for two-wheelers |
| **Consensus granularity** | H3 res-10 (~76m) origin, res-9 (~201m) destination |

---

## Requirements

### Functional Requirements

- Reconstruct each trip's route from raw pings (clean → match → confidence)
- Detect stalls (signal degradation vs actual stops) and compress them
- Learn **consensus paths** per (store, destination) from historical trips
- Score live rider deviation against consensus (catch distance padding, find shortcuts)
- Label every trip High/Medium/Low confidence; bad matches must never degrade output

### Non-Functional Requirements

| Attribute | Target |
| :--- | :--- |
| **Pipeline throughput** | millions of trips per run (batch, Spark-scale) |
| **Distance accuracy** | ±5% on High-confidence trips |
| **Fallback safety** | Low-confidence trips fall back to cleaned polyline, never a wrong road |
| **Cost control** | OSRM is the bottleneck — distributed rate limiting mandatory |

---

## High-Level Architecture

### Architecture Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1762" width="900" role="img" aria-label="Route Reconstruction — System Architecture">
<rect x="0.5" y="0.5" width="959" height="1761" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
<rect x="52" y="288" width="713" height="1374" rx="14" fill="none" stroke="#cbd5e1" stroke-width="1.3" stroke-dasharray="7 5"/>
<rect x="64" y="296" width="243.20000000000002" height="20" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
<text x="185.60000000000002" y="310" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" fill="#475569">Route Reconstruction (Route IQ)</text>
<path d="M409 132 L409 156 L425 156 L425 298 L409 298 L409 322" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-route-reconstruction)"/>
<path d="M409 384 L409 574" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-route-reconstruction)"/>
<path d="M389 636 L389 731 L151 731 L151 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-route-reconstruction)"/>
<path d="M409 636 L409 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-route-reconstruction)"/>
<path d="M429 636 L429 731 L667 731 L667 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-route-reconstruction)"/>
<path d="M151 888 L151 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-route-reconstruction)"/>
<path d="M409 888 L409 912 L430 912 L430 1054 L414 1054 L414 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-route-reconstruction)"/>
<path d="M667 888 L667 912 L688 912 L688 1054 L672 1054 L672 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-route-reconstruction)"/>
<path d="M151 1140 L151 1235 L389 1235 L389 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-route-reconstruction)"/>
<path d="M409 1140 L409 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-route-reconstruction)"/>
<path d="M672 1140 L672 1235 L429 1235 L429 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-route-reconstruction)"/>
<path d="M389 1392 L389 1487 L146 1487 L146 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-route-reconstruction)"/>
<path d="M409 1392 L409 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-route-reconstruction)"/>
<path d="M429 1392 L429 1487 L668 1487 L668 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-route-reconstruction)"/>
<rect x="335" y="73" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="335" y="70" width="148" height="62" rx="12" fill="#ecfdf5" stroke="#10b981" stroke-width="1.4"/>
<rect x="338" y="73" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="409" y="106" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#064e3b">Rider Phones</text>
<rect x="328" y="325" width="161" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="328" y="322" width="161" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="331" y="325" width="155" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="408.5" y="358" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Ping Ingest</text>
<rect x="326" y="577" width="165" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="326" y="574" width="165" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="329" y="577" width="159" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="408.5" y="610" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Trip Closer</text>
<rect x="77" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="77" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="80" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="151" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Cleaning Svc</text>
<rect x="335" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="335" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="338" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="409" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Map-Match Svc</text>
<rect x="593" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="593" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="596" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="667" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Confidence Tagger</text>
<rect x="72" y="1081" width="158" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="72" y="1078" width="158" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="75" y="1081" width="152" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="151" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Delta Lake</text>
<rect x="340" y="1081" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="340" y="1078" width="148" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="343" y="1081" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="414" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">OSRM Road Graph</text>
<rect x="598" y="1081" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="598" y="1078" width="148" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="601" y="1081" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="672" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Redis Consensus</text>
<rect x="335" y="1333" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="335" y="1330" width="148" height="62" rx="12" fill="#fff7ed" stroke="#f97316" stroke-width="1.4"/>
<rect x="338" y="1333" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="409" y="1366" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#7c2d12">Kafka</text>
<rect x="70" y="1585" width="151" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="70" y="1582" width="151" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="73" y="1585" width="145" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="145.5" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Consensus Builder</text>
<rect x="331" y="1585" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="331" y="1582" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="334" y="1585" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="405" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Deviation Scorer</text>
<rect x="589" y="1585" width="158" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="589" y="1582" width="158" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="592" y="1585" width="152" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="668" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">ETA Feature Jobs</text>
<defs><marker id="arr-route-reconstruction" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker><marker id="arrEm-route-reconstruction" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#10b981"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/system-design/route-reconstruction.architecture.html](diagrams/system-design/route-reconstruction.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


*Solid = data flow, dashed = control plane / monitoring.*

### Data Flow

1. Rider pings stream to Kafka (keyed by trip_id); trip "closed" event triggers processing
2. **Cleaning Svc** (Spark, `mapInPandas`): synthetic first ping anchored at the store → iterative greedy anomaly removal until no segment exceeds 60 km/h → stall compression (30m/240s clusters → one centroid) → interpolation of gaps > 4s → **Kalman smoothing** (constant-velocity state `[lat, lon, v_lat, v_lon]`)
3. **Map-Match Svc**: cleaned pings → OSRM `match` (smart downsampling to ~100 points, first/last kept); best matching chosen by distance-closeness to the cleaned trace
4. **Confidence Tagger**: 4 signals (OSRM confidence, DTW deviation, max timestamp gap, start/end lag) → High/Medium/Low; Low ⇒ discard road match, use cleaned polyline + Haversine
5. **Consensus Builder**: trips bucketed by H3 (origin res-10, dest res-9); route = ordered res-10 cell sequence; per OD-pair HMM learned from transition counts (floor < 0.02); Viterbi decodes each trip's MAP path
6. **Deviation Scorer** (online): live trip scored against its OD-pair consensus — divergence feeds fraud/distance-padding alerts and ETA features; outputs land in Delta Lake tables for ML training

## Microservices

| Service | Tech Stack | Database | Pattern |
| --------- | ------------ | ---------- | ---------- |
| Ping Ingest | Go | Kafka | Event-driven |
| Cleaning Service | Spark (PySpark) | Delta Lake | Distributed batch, mapInPandas |
| Map-Match Service | Go + OSRM pool | Redis (rate limit) | Distributed rate limiting |
| Confidence Tagger | Python | Delta Lake | Multi-signal gating |
| Consensus Builder | Python (HMM) | Delta Lake + Redis (hot OD pairs) | Offline learning |
| Deviation Scorer | Rust | Redis (consensus cache) | Real-time scoring |

---

## Database Design

### Delta Lake tables (the lakehouse backbone)

```sql
trips_cleaned (
  trip_id, rider_id, store_h3_r10, dest_h3_r9,
  cleaned_polyline ARRAY<STRUCT<lat, lng, ts>>,
  cleaned_distance_m DOUBLE, kalman_applied BOOLEAN
)
trip_matches (
  trip_id, osrm_confidence DOUBLE, dtw_deviation_pct DOUBLE,
  max_gap_s INT, start_lag_s INT, end_lag_s INT,
  matched_polyline ARRAY<STRUCT<lat, lng>>, matched_distance_m DOUBLE,
  confidence_label TEXT            -- HIGH | MEDIUM | LOW
)
od_consensus (
  origin_h3_r10 TEXT, dest_h3_r9 TEXT,
  transition_matrix MAP<TEXT, MAP<TEXT, DOUBLE>>,   -- cell -> cell -> prob
  cell_frequencies MAP<TEXT, BIGINT>, updated_at TIMESTAMP
)
```

### Redis (online path)

```bash
consensus:{origin}:{dest}  -> cached transition graph (JSON, TTL 1d)
osrm:rl:{executor}         -> distributed rate-limit tokens
trip:{trip_id}:live        -> last N pings for online deviation scoring
```

---

## Scaling Tiers

| Tier | Users | Infrastructure | Monthly Cost |
| ------ | ------- | -------------- | ------------- |
| 1K-10K | 10K trips/day | Single Python worker + Postgres + OSRM container | $300 |
| 10K-1M | 1M | Spark job cluster + OSRM pool ×4 + Delta on S3 | $4,000 |
| 1M-10M+ | 10M+ | Spark autoscaled + OSRM pool ×20 + Delta + Redis + streaming scorer | $35,000 |

---

## Key Techniques & Patterns

- **Joint anomaly scoring**: weighted combination of kinematic + spatial features per ping — no single rule suffices
- **Iterative greedy removal**: remove one worst ping at a time and *recompute* (removals change neighbors' features — batch removal misses cascades)
- **Kalman filter smoothing**: constant-velocity model handles irregular gaps naturally (state transition scales with dt)
- **Dynamic Time Warping**: alignment-based deviation between ping polyline and road polyline, robust to sampling differences
- **Hidden Markov Model + Viterbi**: consensus path learning — hidden true route inferred from noisy H3-cell observations
- **H3 spatial indexing**: Uber's hexagonal index at two resolutions (see `system-design-concepts.md` §48)
- **Distributed rate limiting**: Spark executors share OSRM token budgets (Redis)
- **Graceful degradation**: confidence labels gate every downstream use — a bad match never beats cleaned data

---

## Key Design Decisions

1. **Anchor the trip with a synthetic first ping** at the store's coordinates + dispatch timestamp — first real GPS fix can be seconds late and hundreds of meters off
2. **Speed features dominate the anomaly score**: 200 km/h over a 3s interval is unambiguous — highest signal-to-noise ratio
3. **Greedy one-at-a-time removal over batch**: correctness of the cascade beats speed
4. **Best OSRM match = distance-closeness, not OSRM's own confidence**: avoids partial/fragmented matches
5. **Consensus from observed behavior, not OSM routing**: riders' real shortcuts, service lanes, and avoided turns are the ground truth OSM lacks
6. **Two H3 resolutions**: fine at origin (store is precise), coarse at destination (nearby customers share routes)

---

## Failure Modes & Recovery

| Failure | Impact | Mitigation |
| --------- | -------- | ----------- |
| OSRM returns garbage match | Wrong route stored | Confidence < 0.05 discarded → cleaned-polyline fallback |
| DTW deviation > 10% of path length | Mismatch flagged | Trip downgraded; fallback polyline used |
| Ping gap > 180s | Unreconstructable interval | Trip labeled Low confidence |
| OSRM pool saturation | Pipeline stalls | Distributed token buckets; executor backpressure |
| HMM overfit to noise | Odd consensus paths | Transition floor (aᵢⱼ < 0.02 → 0); minimum trip count per OD pair |
| Spark partition failure | Partial batch | Delta transactional writes; idempotent re-run per trip_id |

---

## Cost Estimation (1M Users)

| Component | Configuration | Monthly Cost |
| ----------- | -------------- | ------------- |
| Spark cluster (autoscaled) | 50 vCPU spot | $1,200 |
| OSRM pool (8 containers) | c7g.xlarge | $1,000 |
| Delta Lake storage | 5TB S3 | $120 |
| Redis (consensus cache) | cache.m7g.large ×2 | $400 |
| Streaming scorer (6) | c7g.large | $600 |
| Kafka | m7g.large ×3 | $900 |
| **Total** | | **~$4,220** |

---

## Trade-off Analysis

| Decision | Option A | Option B | Choice | Why |
| ---------- | ---------- | ---------- | -------- | ----- |
| Noise removal | Batch filter | Iterative greedy | Greedy | Cascading feature changes handled |
| Smoothing | Moving average | Kalman | Kalman | Irregular dt + velocity momentum |
| Map matching | Raw pings to OSRM | Downsampled (~100) | Downsampled | OSRM limit; first/last preserved |
| Consensus source | OSM shortest path | Learned HMM paths | HMM | Real behavior beats map assumptions |
| Confidence | Single OSRM score | 4 independent signals | 4 signals | Each catches a different failure mode |
| Batch engine | Single-node Python | Spark + Delta | Spark | Millions of trips per run |

---

## Key Metrics to Monitor

1. % trips by confidence label (High should dominate; rising Medium/Low = data-quality alarm)
2. Distance correction delta (raw vs cleaned vs matched)
3. OSRM pool latency, rejection rate, token saturation
4. DTW deviation distribution
5. Stall-compression savings (phantom meters removed)
6. Consensus coverage (OD pairs with ≥N trips)
7. Deviation-scorer alert precision (padding caught vs false accusations)

---

## Deep Dive Prompts

1. How would you turn consensus paths into *prescriptive* routing (what the rider should take) rather than descriptive?
2. Design the online variant: deviation scoring on the live ping stream with <1s latency.
3. How would you handle multi-stop trips (batch delivery) in the OD-pair model?
4. Design the ML feature store fed by Route IQ outputs (ETA model features).
5. How would you bootstrap consensus for a brand-new store with zero trips?

---

## Common Interview Follow-ups

1. Why does Haversine over raw pings overestimate? (jitter adds phantom segments; 50 pings circling a red light)
2. Why Viterbi and not Dijkstra on the cell graph? (probability maximization vs shortest path; transitions learned from data)
3. When do you fall back to the cleaned polyline? (Low confidence — never let a bad road match win)
4. How does this relate to the google-maps design? (that routes *ahead of time* on clean map data; this reconstructs *after the fact* from noisy telemetry)
5. Why Spark for cleaning but Rust for online scoring? (batch throughput vs per-ping latency)

---

## Low-Level Design (LLD) - Algorithms & Data Structures

### Joint Anomaly Removal + HMM/Viterbi Consensus

```text
// Part 1 — iterative greedy ping removal (speed dominates the score)
function anomalyScore(prev, ping, next) {
  const hav = (a, b) => {
    const R = 6371e3, toR = d => d * Math.PI / 180;
    const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  const dt = (p, q) => Math.max((q.ts - p.ts) / 1000, 0.001);
  const speedIn = hav(prev, ping) / dt(prev, ping);      // m/s
  const speedOut = hav(ping, next) / dt(ping, next);
  const accel = Math.abs(speedOut - speedIn) / dt(ping, next);
  return 3.0 * (speedIn + speedOut) / 16.7               // speed vs 60km/h ≈ 16.7 m/s
       + 1.5 * accel / 5                                  // acceleration anomaly
       + 0.5 * hav(ping, { lat: (prev.lat + next.lat) / 2, lng: (prev.lng + next.lng) / 2 }) / 200; // spatial
}

function cleanTrace(pings, vMax = 60 / 3.6) {
  const pts = [...pings];
  while (true) {
    let worst = -1, worstScore = 0, violating = false;
    for (let i = 1; i < pts.length - 1; i++) {
      const s1 = haversineSpeed(pts[i - 1], pts[i]), s2 = haversineSpeed(pts[i], pts[i + 1]);
      if (s1 > vMax || s2 > vMax) {
        violating = true;
        const sc = anomalyScore(pts[i - 1], pts[i], pts[i + 1]);
        if (sc > worstScore) { worstScore = sc; worst = i; }
      }
    }
    if (!violating || pts.length <= 2) break;
    pts.splice(worst, 1);          // remove ONE ping, recompute next loop
  }
  return pts;
}
const haversineSpeed = (a, b) => {
  const R = 6371e3, toR = d => d * Math.PI / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h)) / Math.max((b.ts - a.ts) / 1000, 0.001);
};

// Part 2 — HMM consensus: Viterbi over H3-cell states (toy 3-cell fork)
// cells are numeric ids: 0=store, 1=fork, 2=shortcut (real impl: H3 cell indexes)
function viterbi(cells, observations, transition, emit, startCell) {
  const V = [cells.map((c) => (c === startCell ? 0 : -Infinity))], back = [];
  for (let t = 1; t < observations.length; t++) {
    V[t] = []; back[t] = [];
    cells.forEach((cur, j) => {
      let best = -Infinity, arg = 0;
      cells.forEach((prevC, i) => {
        const p = transition[prevC]?.[cur] ?? 0;
        if (p <= 0) return;                       // floored transition (a_ij < 0.02)
        const cand = V[t - 1][i] + Math.log(p);
        if (cand > best) { best = cand; arg = i; }
      });
      V[t][j] = best + Math.log(emit(cur, observations[t]));
      back[t][j] = arg;
    });
  }
  // backtrack the MAP path
  let j = V.at(-1).indexOf(Math.max(...V.at(-1)));
  const path = [cells[j]];
  for (let t = V.length - 1; t > 0; t--) { j = back[t][j]; path.unshift(cells[j]); }
  return path;
}
const cells = [0, 1, 2];                          // store, fork, shortcut
const transition = { 0: { 1: 0.5, 2: 0.5 }, 1: { 2: 1.0 }, 2: { 2: 1.0 } };
const emit = (state, obs) => Math.exp(-Math.abs(state - obs) / 50); // Gaussian on cell distance
const startCell = 0;                              // π concentrated on the store's cell

// t=0 uses the initial distribution π (store cell only), not the emission
console.log(viterbi(cells, [0, 2, 2], transition, emit, startCell).join("->")); // 0->2->2 (took the shortcut)
console.log(cleanTrace([{ lat: 0, lng: 0, ts: 0 }, { lat: 0.5, lng: 0, ts: 3000 }, { lat: 1, lng: 0, ts: 6000 }]).length); // teleports removed
```
