<div align="center">

# System Design: Fraud Detection (Real-Time Risk Platform)

</div>

## Overview

Design a real-time fraud-detection platform for a payments / fintech company (Stripe Radar / PayPal / Zomato-promo-abuse class): every transaction or user action is scored in milliseconds against velocity rules, device fingerprints, and ML models; confirmed fraud feeds back into training data; and linked accounts are clustered into **fraud rings** using graph algorithms. The hard problem is running deep, stateful analysis (hundreds of features per event) within a strict milliseconds budget, while cutting off confirmed fraud instantly.

### Key Numbers

| Metric | Value |
| ------ | ----- |
| Transactions scored | 30K/sec peak (25B/day events incl. logins, signups) |
| Scoring latency budget | p99 < 150 ms end-to-end, < 50 ms feature fetch |
| Accounts monitored | 300M+ |
| Feature lookups per event | 100-500 features |
| False-positive budget | < 0.5% of legitimate transactions blocked |
| Model retraining | Daily; shadow deploy weekly |
| Event data | ~8 TB/day (feature events, decisions, review artifacts) |
| Fraud loss target | < 7 bps of volume |

## Requirements

### Functional Requirements

- Score every transaction/login in real time: APPROVE, REVIEW (step-up / 3DS / OTP), or DENY
- Velocity rules: per-card/per-account/per-device counters over sliding windows (1m → 30d)
- Device & behavioral fingerprints: device ID, IP reputation, typing cadence, geo-velocity (impossible travel)
- **Fraud-ring detection**: link accounts via shared devices, cards, IPs; cluster into rings (connected components)
- Analyst case management: investigation queues, evidence bundle, approve/deny, feedback loop to labels
- Model management: shadow deployments, champion/challenger, drift monitoring
- Chargeback & confirmation ingestion to close the label loop

### Non-Functional Requirements

| Attribute | Target |
| :--- | :--- |
| **p** | 99 scoring < 150 ms; ingest path separates from scoring path (backpressure, no drop) |
| **Availability** | 99.99% — **fail-open** (approve + alert) or **fail-closed** per rule tier, decided explicitly |
| **False-positive rate <** | 0.5% of good traffic; every decision fully explainable for disputes |
| **Rules deploy in <** | 1 min without deploy; models deploy without downtime |
| **Event immutability for compliance (PCI-DSS adjacent audit);** | 7-year decision retention |

## High-Level Architecture

### Architecture Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1762" width="900" role="img" aria-label="Fraud Detection — System Architecture">
<rect x="0.5" y="0.5" width="959" height="1761" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
<title>Fraud Detection — System Architecture</title>
<rect x="52" y="288" width="713" height="1374" rx="14" fill="none" stroke="#cbd5e1" stroke-width="1.3" stroke-dasharray="7 5"/>
<rect x="64" y="296" width="192.8" height="20" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
<text x="160.4" y="310" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" fill="#475569">Fraud Detection Platform</text>
<path d="M409 132 L409 156 L425 156 L425 298 L409 298 L409 322" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-fraud-detection)"/>
<path d="M409 384 L409 574" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-fraud-detection)"/>
<path d="M389 636 L389 731 L151 731 L151 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-fraud-detection)"/>
<path d="M409 636 L409 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-fraud-detection)"/>
<path d="M429 636 L429 731 L667 731 L667 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-fraud-detection)"/>
<path d="M151 888 L151 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-fraud-detection)"/>
<path d="M409 888 L409 912 L430 912 L430 1054 L414 1054 L414 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-fraud-detection)"/>
<path d="M667 888 L667 912 L688 912 L688 1054 L672 1054 L672 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-fraud-detection)"/>
<path d="M151 1140 L151 1235 L389 1235 L389 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-fraud-detection)"/>
<path d="M409 1140 L409 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-fraud-detection)"/>
<path d="M672 1140 L672 1235 L429 1235 L429 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-fraud-detection)"/>
<path d="M389 1392 L389 1487 L146 1487 L146 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-fraud-detection)"/>
<path d="M409 1392 L409 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-fraud-detection)"/>
<path d="M429 1392 L429 1487 L668 1487 L668 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-fraud-detection)"/>
<rect x="335" y="73" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="335" y="70" width="148" height="62" rx="12" fill="#ecfdf5" stroke="#10b981" stroke-width="1.4"/>
<rect x="338" y="73" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="409" y="106" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#064e3b">Apps / POS / Web</text>
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
<text x="151" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Event Ingest Svc</text>
<rect x="335" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="335" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="338" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="409" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Scoring Svc</text>
<rect x="593" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="593" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="596" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="667" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Case Mgmt Svc</text>
<rect x="70" y="1585" width="151" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="70" y="1582" width="151" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="73" y="1585" width="145" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="145.5" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Model Trainer</text>
<rect x="331" y="1585" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="331" y="1582" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="334" y="1585" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="405" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Ring Detector</text>
<rect x="589" y="1585" width="158" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="589" y="1582" width="158" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="592" y="1585" width="152" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="668" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Review Queue Workers</text>
<rect x="72" y="1081" width="158" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="72" y="1078" width="158" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="75" y="1081" width="152" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="151" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Feature Store (Redis)</text>
<rect x="340" y="1081" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="340" y="1078" width="148" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="343" y="1081" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="414" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Cassandra (Events)</text>
<rect x="598" y="1081" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="598" y="1078" width="148" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="601" y="1081" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="672" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Graph DB (Rings)</text>
<rect x="335" y="1333" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="335" y="1330" width="148" height="62" rx="12" fill="#fff7ed" stroke="#f97316" stroke-width="1.4"/>
<rect x="338" y="1333" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="409" y="1366" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#7c2d12">Kafka (Event Bus)</text>
<defs><marker id="arr-fraud-detection" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker><marker id="arrEm-fraud-detection" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#10b981"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/system-design/fraud-detection.architecture.html](diagrams/system-design/fraud-detection.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


*Solid = transaction/event flow, dashed = control plane / monitoring.*

### Data Flow

1. Payments service emits a transaction event to the **API Gateway**; the sync path scores it, the async path logs it to **Kafka**
2. **Event Ingest Svc** validates and enriches (geo, BIN, device) then produces to Kafka topics partitioned by account
3. **Scoring Svc** fetches velocity counters and profiles from the **Feature Store (Redis)** in one MGET round-trip (~50 features), runs the rules DAG, then the ML model (gRPC to a GPU/CPU pool), and emits a decision + reason codes
4. DENY → block instantly; REVIEW → enqueue to the case queue with an evidence bundle
5. Async workers maintain the Feature Store (event-driven counter increments + periodic reconciliation), run the **Ring Detector** (streaming union-find + nightly graph refresh), and a trainer rebuilds models on labels
6. Chargebacks/confirmed-fraud labels stream back to the feature store (`fraud_history` counter) and the training set — the loop closes

## Microservices

| Service | Responsibility | Scaling |
| :--- | :--- | :--- |
| Event Ingest Svc | Validate, enrich, produce to Kafka | Stateless, N replicas |
| Scoring Svc | Rules DAG + model inference per event | Stateless, N replicas, regional |
| Feature Store Svc | Online features (Redis), offline parity | Redis cluster + Spark/Trino backfills |
| Case Management Svc | Analyst queues, evidence, verdicts | Stateless + Postgres |
| Ring Detector | Streaming union-find, nightly graph clustering | Stream consumers |
| Model Trainer | Daily retraining, shadow eval | Batch/GPU workers |
| Decision Log Svc | Immutable decision + reason codes | Kafka → ClickHouse |

## Database Design

### Feature Store (Redis online, Parquet/Trino offline)

```
HSET feat:{account_id} txn_1h 3 txn_24h 11 avg_amt_30d 82.40 risk_country_ratio_7d 0.02
ZINCRBY vel:{card}:merchant_1h 1 "2026-09-14T12:00"
SET denylist:{device_hash} 1 EX 7776000
```

- Online: Redis cluster, 30-day TTL, sub-millisecond MGET; in-flight eviction tuned for hot accounts
- Offline: same feature definitions materialized to Parquet → guarantees train/serve parity

### Decision & Event Store (Cassandra + ClickHouse)

```sql
CREATE TABLE decisions (
  txn_id       UUID PRIMARY KEY,
  account_id   BIGINT,
  score        DOUBLE,
  decision     TEXT,            -- APPROVE / REVIEW / DENY
  reason_codes SET<TEXT>,
  model_ver    TEXT,
  features     MAP<TEXT, TEXT>,
  decided_at   TIMESTAMP
) WITH CLUSTERING ORDER BY (decided_at DESC);
```

- Cassandra: 25B/day writes, account-partitioned queries for disputes (2 TB/day hot)
- ClickHouse: decisions + labels for drift dashboards and training-set extraction

### Graph Store (fraud rings)

- Nodes: accounts, devices, cards, IPs, addresses. Edges: "used_by", "shared_with" (weighted by rarity)
- Streaming edge ingestion → incremental union-find for the hot path; nightly full refresh in Neo4j/graph engine for ranking; rings ≥ 3 accounts escalate automatically

## Scaling Tiers

How the platform grows with transaction volume:

| Tier | Users | Infrastructure | Monthly Cost |
| ------ | ------- | --------------- | ------------- |
| 1K-10K | 10K txns/day | 2 scoring pods + Redis + Postgres + Kafka single | $1,500 |
| 10K-1M | 50K txns/min | 12 scoring pods + Redis cluster + Cassandra 6 + Kafka 3 | $18,000 |
| 1M-10M+ | 30K txns/sec | 60 scoring pods + 18-node Redis + Cassandra 24 + GPU inference pool + graph cluster | $150,000 |

## Key Techniques & Patterns

- **Two-phase scoring**: cheap velocity rules first (99% of events exit here), ML only for the gray zone — cuts inference cost 10×
- **Feature store with train/serve parity**: one feature definition, materialized both online (Redis) and offline (Parquet)
- **Streaming union-find for fraud rings**: merge clusters as shared-attribute edges arrive; amortized O(α(n)) per edge
- **Bloom filter pre-screen**: deny-lists and known-bad devices checked against a Bloom filter before hitting Redis
- **Fail-open vs fail-closed tiers**: low-risk rules fail open with alerting; sanctions/AML checks fail closed
- **Champion/challenger + shadow scoring**: new models score a mirrored slice without affecting decisions
- **Human-in-the-loop**: REVIEW queue with evidence bundles feeds analyst verdicts back as labels

## Key Design Decisions

| Decision | Rationale | Trade-off |
| :--- | :--- | :--- |
| Sync rules, async ML enrichment | Sub-150 ms budget forces feature prefetch + budgeted inference | Complex two-phase pipeline |
| Redis for online features | Single-digit-ms MGET of 100+ fields | Memory-heavy; TTL + reconciliation jobs |
| Cassandra for decisions | 25B/day writes, no joins needed | Eventual consistency per account — acceptable |
| Streaming union-find for rings | O(α) merges, always-current clusters | Tracks connectivity only; ranking needs the nightly graph pass |
| Fail-open default | Fraud loss < revenue loss from blocking good customers | Explicit fail-closed list for AML/sanctions |

## Failure Modes & Recovery

| Failure | Detection | Recovery |
| :--- | :--- | :--- |
| Feature Store down | MGET timeouts at p99 | Cached per-account snapshot in scoring pods; rules degrade to coarse buckets; fail-open alert |
| Model server down | gRPC health checks | Rules-only fallback (circuit breaker), queue gray-zone events for async verdict |
| Kafka consumer lag | Lag alarms per consumer group | Backpressure via partition pause; scoring unaffected (separate path) |
| Redis hot key (whale account) | Per-key ops metrics | Local L1 cache in pods + key sharding by hash slot |
| Bad model deploy | Shadow-eval divergence alarm | Instant rollback to champion; decisions tagged for re-scoring |
| Duplicate events | Idempotency on txn_id | Exactly-once effects: dedup at ingest, decisions keyed by txn_id |

## Cost Estimation (1M users)

| Component | Spec | Monthly |
| ------ | ------ | ------ |
| Scoring fleet | 40 pods × 4 vCPU | $8,000 |
| Redis cluster | 9 nodes × 60 GB + replicas | $6,000 |
| Kafka | 6 brokers, 30-day retention | $9,000 |
| Cassandra + ClickHouse | 12 + 6 nodes, 800 TB | $22,000 |
| GPU inference pool | 4 × L4 (gray-zone models) | $2,500 |
| Case tooling + graph + ops | 10 nodes + licenses | $7,500 |
| **Total** | | **~$55,000** |

## Trade-off Analysis

| Decision | Gain | Cost |
| :--- | :--- | :--- |
| Rules-first, ML-second | 10× cheaper, explainable | Gray-zone boundary needs tuning |
| Online/offline feature parity | No train/serve skew | Double materialization to maintain |
| Union-find rings | Real-time cluster awareness | No ring "quality" — needs graph pass |
| Fail-open | Fraud < false-block revenue loss | Manual review exposure grows |
| Cassandra decisions | Massive write throughput | Cross-account analytics needs ClickHouse |

## Key Metrics to Monitor

- **Business**: fraud bps, chargeback rate, false-positive rate, REVIEW queue SLA, manual-review hit rate
- **Model**: AUC/PR-AUC drift, score distribution drift (PSI), shadow-vs-champion divergence
- **Rules**: per-rule hit rate, deny rate by rule tier
- **Infra**: scoring p99 (target < 150 ms), feature-fetch p99 (< 50 ms), Kafka lag, Redis hit rate & evictions

## Production Readiness Checklist

- [ ] **HA** — scoring pods multi-AZ; Redis cluster with replicas + auto-failover; cached-snapshot degradation mode tested
- [ ] **DR** — decisions replayable from Kafka (7-day retention) + ClickHouse LTS; RPO = 0 for decisions, RTO < 10 min
- [ ] **Security** — PII field-level encryption; least-privilege feature-store access; PCI-DSS-aligned audit trails
- [ ] **Model governance** — champion/challenger with automatic rollback; drift monitors + label-leakage checks in the training pipeline
- [ ] **Risk tiering** — explicit fail-open/fail-closed per rule tier signed off by compliance; sanctions/AML enforced fail-closed
- [ ] **False-positive control** — FP budget < 0.5% tracked weekly; analyst feedback loop SLA < 24 h
- [ ] **Adversarial readiness** — threshold jitter + rule rotation tested; probe-detection alarms wired to the review queue

## Deep Dive Prompts

- Design geo-velocity ("impossible travel") — how do you compute distance at decision time cheaply?
- How do you prevent the Feature Store from becoming a bottleneck on mega-accounts?
- Adversarial adaptation: fraudsters probe your thresholds. How do you rotate rules and thresholds safely?
- How would you do online model updates without restarting scoring pods?
- Design the reviewer feedback loop: how do analyst verdicts become training labels without leakage?

## Common Interview Follow-ups (with answers)

**Q1. Why not run the ML model on every transaction?**
Cost and latency. A rules DAG on Redis features costs ~5 ms and fractions of a cent on CPU; a deep model adds 30-80 ms and GPU cost per call. Velocity rules resolve 95-99% of events decisively; the gray zone (say 3-5%) goes to the model. This also keeps decisions explainable — disputes need reason codes, which rules provide directly.

**Q2. How do fraud rings get detected in real time?**
Every shared attribute (device, card, IP, bank account) is an edge between accounts. Streaming union-find merges components as edges arrive; ring = connected component. When a component exceeds a size/risk threshold, all its accounts get flagged and their scores lifted. The nightly graph pass then ranks rings by combined loss exposure using real graph analytics. Union-find gives you the always-current cluster; the graph DB gives you the forensics.

**Q3. Fail-open or fail-closed when the Feature Store dies?**
It's a per-tier business decision, not a technical one. Blocking legitimate customers costs revenue and trust, so default rules fail open (approve + raise an alert + tag for retro-scoring). But AML/sanctions and known-fraud-list checks fail closed by law. The important interview point: make the failure mode explicit per rule tier, and tag decisions made during degradation so they're re-scored when service recovers.

**Q4. How do you keep train/serve skew out of the system?**
One feature definition, two materializations. Features are declared once in code; the same transformation runs streaming into Redis (online) and batch into Parquet (offline). Automated parity checks sample live events, compute features both ways, and alarm on divergence. Without this, the model trains on `avg_amt_30d` as of yesterday but serves on "since 00:00 UTC" — silent accuracy rot.

**Q5. Fraudsters discover and probe your thresholds. What do you do?**
Multiple defenses: (1) jitter thresholds slightly per cohort so probing gets noisy answers; (2) rotate/decay rule weights automatically; (3) monitor probe signatures — bursts of tiny test transactions near a boundary; (4) keep some rules unobservable (different cohorts see different subsets); (5) fast feedback loop — chargebacks and analyst verdicts retrain within a day. Detection systems decay without the label loop; treat the loop as the core feature, not plumbing.

## Low-Level Design (LLD) - Algorithms & Data Structures

### Fraud-Ring Detector (streaming union-find)

Accounts are nodes; shared devices/cards/IPs are edges. Union-find with path compression + union by size merges rings in near-constant amortized time. The watchlist is every component above threshold.

```javascript
// Streaming fraud-ring clustering with union-find (path compression + union by size).
class FraudRingDetector {
  constructor(ringThreshold = 3) {
    this.parent = new Map();       // account -> parent
    this.size = new Map();         // root -> component size
    this.edgeCount = 0;
    this.ringThreshold = ringThreshold;
    this.flaggedRings = new Set(); // roots above threshold
  }
  #find(x) {
    if (!this.parent.has(x)) { this.parent.set(x, x); this.size.set(x, 1); return x; }
    let root = x;
    while (this.parent.get(root) !== root) root = this.parent.get(root);
    while (this.parent.get(x) !== root) { const nx = this.parent.get(x); this.parent.set(x, root); x = nx; } // compress
    return root;
  }
  link(accountA, accountB, evidence) {
    this.edgeCount++;
    let ra = this.#find(accountA), rb = this.#find(accountB);
    if (ra === rb) return { merged: false, ringSize: this.size.get(ra), root: ra };
    if (this.size.get(ra) < this.size.get(rb)) [ra, rb] = [rb, ra]; // union by size
    this.parent.set(rb, ra);
    this.size.set(ra, this.size.get(ra) + this.size.get(rb));
    if (this.size.get(ra) >= this.ringThreshold) this.flaggedRings.add(ra);
    return { merged: true, root: ra, ringSize: this.size.get(ra), evidence };
  }
  ringOf(account) { return this.size.get(this.#find(account)); }
  isFlagged(account) { return this.flaggedRings.has(this.#find(account)); }
}

// --- demo: shared devices knit accounts into a ring (deterministic output) ---
const det = new FraudRingDetector(3);
console.log(det.link('acc_1', 'acc_2', { device: 'dev_A' }));   // pair, not yet a ring
console.log(det.link('acc_3', 'acc_2', { device: 'dev_A' }));   // ring of 3 formed
console.log(det.link('acc_4', 'acc_1', { card: 'card_X' }));    // ring grows to 4
console.log(det.link('acc_9', 'acc_8', { device: 'dev_B' }));   // separate pair
console.log('ring(4):', det.ringOf('acc_4'), '| flagged(4):', det.isFlagged('acc_4'));
console.log('ring(9):', det.ringOf('acc_9'), '| flagged(9):', det.isFlagged('acc_9'));
```

Expected: the first link is a pair; linking `acc_3` forms a ring of 3 (flagged); `acc_4` merges it to 4; `acc_9/acc_8` stay an unflagged pair. Runs in O(α(n)) per shared-attribute edge.
