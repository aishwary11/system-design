<div align="center">

# System Design: Unique ID Generator (Snowflake-style)

</div>

> [!TIP]
> **TL;DR** — Generate ~64-bit, roughly sorted, globally unique IDs at scale without a coordinating database sequence — the primitive behind order IDs, tweet IDs, and every primary key that must be minted thousands of times per second.

## Overview

A service that hands out unique 64-bit IDs to any caller (services, edge nodes) at very high rates. Twitter's Snowflake is the canonical design: timestamp + machine ID + per-machine sequence, so thousands of nodes mint IDs independently with no coordination.

### Key Numbers

| Metric | Value |
| :--- | :--- |
| **IDs generated** | 10K–100K per second, per cluster |
| **Per node** | 4,096 IDs/ms (12-bit sequence) |
| **ID width** | 64 bits (fits BIGINT) |
| **Ordering** | k-monotonic (roughly time-sorted) |

---

## Requirements

### Functional Requirements

- Issue globally unique 64-bit IDs
- IDs roughly sort by creation time (so B-tree inserts stay append-mostly)
- Support many independent issuing nodes
- Optional: reserved bits for shard/route hints

### Non-Functional Requirements

| Attribute | Target |
| :--- | :--- |
| **Latency** | < 1ms per ID (no network hop in the happy path) |
| **Availability** | 100% for issuance — ID generation must never be the bottleneck |
| **Uniqueness** | Absolute: a duplicate ID breaks every downstream FK |
| **Lifetime** | ~69 years of timestamps before bit exhaustion |

---

## High-Level Architecture

### Architecture Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1762" width="900" role="img" aria-label="Unique Id Generator — System Architecture">
<rect x="0.5" y="0.5" width="959" height="1761" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
<rect x="52" y="288" width="713" height="1374" rx="14" fill="none" stroke="#cbd5e1" stroke-width="1.3" stroke-dasharray="7 5"/>
<rect x="64" y="296" width="156.8" height="20" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
<text x="142.4" y="310" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" fill="#475569">Unique ID Generator</text>
<path d="M409 132 L409 156 L425 156 L425 298 L409 298 L409 322" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-unique-id-generator)"/>
<path d="M409 384 L409 574" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-unique-id-generator)"/>
<path d="M389 636 L389 731 L151 731 L151 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-unique-id-generator)"/>
<path d="M409 636 L409 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-unique-id-generator)"/>
<path d="M429 636 L429 731 L667 731 L667 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-unique-id-generator)"/>
<path d="M151 888 L151 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-unique-id-generator)"/>
<path d="M409 888 L409 912 L430 912 L430 1054 L414 1054 L414 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-unique-id-generator)"/>
<path d="M667 888 L667 912 L688 912 L688 1054 L672 1054 L672 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-unique-id-generator)"/>
<path d="M151 1140 L151 1235 L389 1235 L389 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-unique-id-generator)"/>
<path d="M409 1140 L409 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-unique-id-generator)"/>
<path d="M672 1140 L672 1235 L429 1235 L429 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-unique-id-generator)"/>
<path d="M389 1392 L389 1487 L146 1487 L146 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-unique-id-generator)"/>
<path d="M409 1392 L409 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-unique-id-generator)"/>
<path d="M429 1392 L429 1487 L668 1487 L668 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-unique-id-generator)"/>
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
<text x="151" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">ID Service</text>
<rect x="335" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="335" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="338" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="409" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Coordinator</text>
<rect x="593" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="593" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="596" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="667" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Range Allocator</text>
<rect x="72" y="1081" width="158" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="72" y="1078" width="158" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="75" y="1081" width="152" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="151" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">etcd (Raft)</text>
<rect x="340" y="1081" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="340" y="1078" width="148" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="343" y="1081" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="414" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">PostgreSQL Ranges</text>
<rect x="598" y="1081" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="598" y="1078" width="148" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="601" y="1081" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="672" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Redis Buffers</text>
<rect x="335" y="1333" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="335" y="1330" width="148" height="62" rx="12" fill="#fff7ed" stroke="#f97316" stroke-width="1.4"/>
<rect x="338" y="1333" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="409" y="1366" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#7c2d12">Monitoring Events</text>
<rect x="70" y="1585" width="151" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="70" y="1582" width="151" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="73" y="1585" width="145" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="145.5" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Buffer Pre-mint</text>
<rect x="331" y="1585" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="331" y="1582" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="334" y="1585" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="405" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Skew Monitor</text>
<rect x="589" y="1585" width="158" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="589" y="1582" width="158" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="592" y="1585" width="152" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="668" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Range GC Workers</text>
<defs><marker id="arr-unique-id-generator" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker><marker id="arrEm-unique-id-generator" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#10b981"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/system-design/unique-id-generator.architecture.html](diagrams/system-design/unique-id-generator.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


**Interactive diagram:** [diagrams/system-design/unique-id-generator.architecture.html](diagrams/system-design/unique-id-generator.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.

### Data Flow

1. Each ID node boots with a unique `machine_id` (assigned by a coordinator or derived from instance metadata)
2. Node reads its wall clock; if it equals the last millisecond, increment the 12-bit sequence
3. If sequence overflows (4,096 IDs in one ms), spin/stall until the next ms
4. If clock moves **backwards** (NTP correction), refuse to mint until it catches up — or hand out from a pre-generated buffer
5. Assemble: `(timestamp << 22) | (machine_id << 12) | sequence`
6. Caller gets the ID inline — no DB, no lock, no network

## Microservices

| Service | Tech Stack | Database | Pattern |
| --------- | ------------ | ---------- | ---------- |
| ID Service | Go / Rust (no GC pauses) | none (stateless) | Snowflake |
| Coordinator (machine-ID lease) | Java | ZooKeeper / etcd | Leases |
| Range Allocator (UUIDv7 / DB option) | Java | PostgreSQL (ranges) | Segment allocation |

---

## Database Design

### No database for minting (that's the point)

```
Snowflake 64-bit layout
  1 bit  sign (always 0)
  41 bit timestamp_ms since custom epoch   (~69 years)
  10 bit machine_id                        (1024 nodes)
  12 bit sequence per ms                   (4096 IDs/ms/node)
```

### Coordinator store (only for machine-ID assignment)

```
znode: /ids/nodes/node-<instance-id>  -> ephemeral lease with machine_id
table: id_ranges (only for the range-based variant)
  allocator | range_start | range_end | assigned_at
```

---

## Scaling Tiers

| Tier | Users | Infrastructure | Monthly Cost |
| ------ | ------- | --------------- | ------------- |
| 1K-10K | 10K | UUIDv4/UUIDv7 in app code, no service | $0 |
| 10K-1M | 1M | 2 ID nodes + one-time coordinator | $50 |
| 1M-10M+ | 10M+ | 32 ID nodes + 3-node etcd for leases | $500 |

---

## Key Techniques & Patterns

- **Snowflake bit-packing**: timestamp + machine + sequence in one 64-bit word
- **Machine-ID leases**: ephemeral znodes/etcd leases guarantee node uniqueness
- **Clock-skew guard**: refuse/stall on backwards clock; NTP in "slew" mode
- **Pre-generated buffers**: each node pre-mints a block on startup to absorb spikes
- **Base62/Snowflake IDs**: encoding for URLs (`concepts` §70)
- **Optimistic Concurrency**: range allocator hands out segments without 2PC

---

## Key Design Decisions

1. **No coordination in minting path**: uniqueness from bit layout, not from a lock
2. **41-bit timestamp**: 69-year lifetime beats 64-bit microseconds (294K years but harder to sort)
3. **10-bit machine ID**: 1,024 nodes is plenty; re-leasing after recycling needs care (IDs from a restarted node with stale clock must be rejected)
4. **Roughly-sorted IDs**: B-tree inserts stay right-most, avoiding page splits and write amplification
5. **Stateless nodes**: scale issuance by adding nodes, never shard data

---

## Failure Modes & Recovery

| Failure | Impact | Mitigation |
| --------- | -------- | ----------- |
| Clock skew backwards | Duplicate/unordered risk | Refuse to mint until catch-up; alert |
| Machine-ID lease expires | Two nodes mint same machine_id | Fencing token; coordinator double-checks |
| Coordinator down | No NEW nodes can join | Existing nodes unaffected; run 3-node quorum |
| Node crash mid-ms | Lost IDs (gaps) — fine | Gaps are harmless; no caller retries by ID |
| NTP step after drift | Sequence gaps | Accept monotonic-with-gaps guarantee |

---

## Cost Estimation (1M Users)

| Component | Configuration | Monthly Cost |
| ----------- | -------------- | ------------- |
| ID Nodes (2) | t4g.nano | $10 |
| etcd (3) | t4g.micro | $45 |
| Monitoring | Prometheus | $20 |
| **Total** | | **~$75** |

---

## Trade-off Analysis

| Decision | Option A | Option B | Choice | Why |
| ---------- | ---------- | ---------- | -------- | ----- |
| Uniqueness source | Central sequence (DB) | Bit-packing (Snowflake) | Snowflake | No coordination, no hotspot |
| Ordering | Strictly monotonic | Roughly monotonic | Roughly | Strict needs consensus per ID |
| Node identity | Static config | Coordinator lease | Lease | Autoscaling-safe |
| Overflow policy | Wait next ms | Steal bits from timestamp | Wait | Simpler; bursts < 1ms are rare |
| 128-bit option | UUIDv7 | Snowflake 64 | Snowflake | Fits BIGINT indexes |

---

## Key Metrics to Monitor

1. IDs minted / second per node
2. Sequence overflow events per ms (capacity alarm)
3. Clock skew events (any occurrence is an incident)
4. Machine-ID lease renewal failures
5. Mint latency P99 (< 1ms)
6. Gap density in minted IDs (should be tiny)
7. Coordinator availability

---

## Deep Dive Prompts

1. How would you guarantee *strictly* increasing IDs across nodes? (Vector-clock / consensus trade-off)
2. How would you migrate 10B existing auto-increment rows to Snowflake IDs?
3. Design an ID scheme that encodes the shard number for routing-free lookups.
4. What breaks if two datacenters mint IDs independently? (machine-id partitioning per region)
5. How do you handle the 2038/2069 bit exhaustion — rolling epochs?

---

## Common Interview Follow-ups

1. Why not just use UUIDv4? (128 bits, unsortable, wrecks B-tree locality)
2. What happens during a leap second or NTP step?
3. How many IDs can 1,024 nodes mint before the 41-bit epoch runs out?
4. How do you prevent ID prediction/enumeration for public URLs? (Blow off low bits, or use a separate secret-mixed variant)
5. Compare with Firestore-style push IDs and ULIDs.

---

## Low-Level Design (LLD) - Algorithms & Data Structures

### Snowflake ID Minting with Clock-Skew Guard

```text
class Snowflake {
  constructor(machineId, epoch = 1704067200000) { // 2024-01-01
    this.machineId = BigInt(machineId) & 1023n;   // 10 bits
    this.epoch = BigInt(epoch);
    this.lastMs = 0n;
    this.seq = 0n;
  }

  next() {
    let now = BigInt(Date.now()) - this.epoch;
    if (now < this.lastMs) throw new Error("clock went backwards by " + (this.lastMs - now) + "ms");
    if (now === this.lastMs) {
      this.seq = (this.seq + 1n) & 4095n;         // 12-bit sequence
      if (this.seq === 0n) {                       // overflow: busy-wait next ms
        while (BigInt(Date.now()) - this.epoch <= this.lastMs) {}
        now = BigInt(Date.now()) - this.epoch;
      }
    } else this.seq = 0n;
    this.lastMs = now;
    return (now << 22n) | (this.machineId << 12n) | this.seq;
  }
}

const sf = new Snowflake(7);
const a = sf.next(), b = sf.next();
console.log("IDs:", a.toString(), b.toString(), "sorted:", a < b);
```

### Clock-Drift Guard (production Snowflake hardening)

A real Snowflake deployment sits on NTP-synced VMs, and clocks **do** step backwards (leap smears, VM migration, bad NTP peer). An ID minted *before* an earlier ID breaks the monotonic guarantee every sort-by-id depends on.

```js
class DriftGuardedIdMinter {
  constructor(workerId, epoch = 1288834974657) {
    this.workerId = workerId;        // 10 bits
    this.epoch = epoch;
    this.lastTs = -1;
    this.seq = 0;                    // 12 bits
  }
  next() {
    let ts = Date.now();
    if (ts < this.lastTs) {
      // clock stepped back: refuse to go backwards — stall until we re-reach lastTs
      // real deployments also ALERT here (NTP jumped) and stop the mint loop
      const drift = this.lastTs - ts;
      if (drift > 50) throw new Error(`clock drift ${drift}ms — halting mint (check NTP)`);
      ts = this.lastTs;
    }
    if (ts === this.lastTs) {
      this.seq = (this.seq + 1) & 0xFFF;          // 4096 ids per ms per worker
      if (this.seq === 0) {                        // rollover: busy-wait the remainder ms
        while (Date.now() <= this.lastTs) { /* spin <= 1ms */ }
        ts = Date.now();
      }
    } else {
      this.seq = 0;
    }
    this.lastTs = ts;
    return ((ts - this.epoch) << 22) | (this.workerId << 12) | this.seq;
  }
}
const m = new DriftGuardedIdMinter(7);
const ids = Array.from({ length: 5000 }, () => m.next());
console.log(ids.every((v, i) => i === 0 || v > ids[i - 1])); // true — strictly monotonic
```

The guard converts "clock went backwards" from silent duplicate/unordered IDs into an explicit, alertable stall — the difference between a *weird bug* and an *incident with a dashboard*.
