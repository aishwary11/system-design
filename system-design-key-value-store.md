# System Design: Key-Value Store (DynamoDB)

## Overview

Distributed key-value store providing eventually consistent reads/writes with high availability.

### Key Numbers

- 10M+ ops/sec
- < 10ms P99 latency
- 99.99% availability
- Multi-region replication

---

## Requirements

### Functional Requirements

- put(key, value) - Store value with key
- get(key) - Retrieve value by key
- delete(key) - Remove key-value pair
- Support TTL for automatic expiration

### Non-Functional Requirements

- Latency: < 10ms P99
- Throughput: 10M+ ops/sec
- Availability: 99.99% (AP system)
- Consistency: Eventually consistent

---

## High-Level Architecture

### Architecture Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1762" width="900" role="img" aria-label="Key Value Store — System Architecture">
<rect x="0" y="0" width="960" height="1762" fill="#ffffff"/>
<title>Key Value Store — System Architecture</title>
<rect x="52" y="288" width="742" height="1374" rx="10" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6 4"/>
<text x="66" y="308" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="12" fill="#475569">Key-Value Store</text>
<path d="M423 132 L423 156 L440 156 L440 298 L424 298 L424 322" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\key-value-store)"/>
<path d="M424 384 L424 408 L440 408 L440 550 L423 550 L423 574" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\key-value-store)"/>
<path d="M409 636 L409 731 L165 731 L165 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\key-value-store)"/>
<path d="M423 636 L423 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\key-value-store)"/>
<path d="M437 636 L437 731 L681 731 L681 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\key-value-store)"/>
<path d="M165 888 L165 912 L181 912 L181 1054 L160 1054 L160 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\key-value-store)"/>
<path d="M423 888 L423 912 L450 912 L450 1054 L434 1054 L434 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\key-value-store)"/>
<path d="M681 888 L681 983 L697 983 L697 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\key-value-store)"/>
<path d="M160 1140 L160 1235 L409 1235 L409 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\key-value-store)"/>
<path d="M423 1140 L423 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\key-value-store)"/>
<path d="M697 1140 L697 1235 L437 1235 L437 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\key-value-store)"/>
<path d="M409 1392 L409 1487 L153 1487 L153 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\key-value-store)"/>
<path d="M423 1392 L423 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\key-value-store)"/>
<path d="M437 1392 L437 1487 L686 1487 L686 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\key-value-store)"/>
<rect x="349" y="70" width="148" height="62" rx="9" fill="#ecfdf5" stroke="#059669" stroke-width="1.6"/>
<text x="423" y="106" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#065f46">Web / Mobile</text>
<rect x="343" y="322" width="161" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="423.5" y="358" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">WAF / API Gateway</text>
<rect x="349" y="574" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="423" y="610" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Load Balancer</text>
<rect x="91" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="165" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">KV Store</text>
<rect x="349" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="423" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Replication Svc</text>
<rect x="607" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="681" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Partition Svc</text>
<rect x="74" y="1582" width="158" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="153" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Compaction Workers</text>
<rect x="342" y="1582" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="416" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Analytics</text>
<rect x="600" y="1582" width="172" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="686" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Anti-entropy Workers</text>
<rect x="70" y="1078" width="180" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="160" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">Custom Storage Engine</text>
<rect x="360" y="1078" width="148" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="434" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">Quorum R+W</text>
<rect x="618" y="1078" width="158" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="697" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">Consistent Hashing</text>
<rect x="349" y="1330" width="148" height="62" rx="9" fill="#fff7ed" stroke="#ea580c" stroke-width="1.6"/>
<text x="423" y="1366" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#9a3412">Kafka</text>
<defs><marker id="arr-D:\Aish\Coding\System-Design\diagrams\json\key-value-store" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/system-design/key-value-store.architecture.html](diagrams/system-design/key-value-store.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


*Solid = data flow, dashed = control plane / monitoring.*

### Data Flow

1. Client puts/gets key - Partition Service hashes to node
2. Consistent hashing determines shard placement
3. Write: replicate to N nodes, wait for W acknowledgments
4. Read: query R nodes, return latest by vector clock
5. Conflict resolution: vector clocks detect concurrent writes
6. Anti-entropy: Merkle trees sync replicas in background
7. Compaction: merge SSTables to reclaim space

## Microservices
How the system is decomposed into independently deployed services:

| Service | Responsibility | Tech Stack | Pattern |
| --------- | --------------- | ------------ | --------- |
| Coordinator | Request routing, quorum logic | Go | Consistent Hashing |
| Storage Engine | LSM Tree / B-Tree persistence | C++ | Write-Ahead Log |
| Replication Mgr | Replicate writes across nodes | Go | Quorum Consensus |
| Failure Detector | Detect node failures | Go | Phi Accrual |
| Anti-Entropy | Repair inconsistencies | Go | Merkle Tree Diff |
| Membership Service | Cluster membership, gossip | Go | Gossip Protocol |

---

## Database Design
The data stores, schemas, and access patterns behind each service:

```sql
CREATE TABLE nodes (
    node_id VARCHAR(50) PRIMARY KEY, datacenter VARCHAR(50),
    rack VARCHAR(50), status VARCHAR(20) DEFAULT active,
    joined_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE key_ranges (
    range_id BIGSERIAL PRIMARY KEY, start_hash BIGINT NOT NULL,
    end_hash BIGINT NOT NULL, owner_node VARCHAR(50),
    replica_nodes TEXT[]
);
```

---

## Scaling Tiers

### 1K - 10K Users ($500/mo)

- Single node, replication factor 1, SSD storage

### 10K - 1M Users ($20K/mo)

- 3-node cluster, replication factor 3, Quorum W=2 R=2

### 1M - 10M+ Users ($800K/mo)

- Multi-datacenter cluster (9+ nodes), Merkle tree anti-entropy

---

## Key Design Decisions
The choices that shape this architecture, and why each was made:

| Decision | Choice | Why |
| ---------- | -------- | ----- |
| Consistency | Eventual (AP) | High availability for reads/writes |
| Replication | Quorum (W+R > N) | Tunable consistency levels |
| Failure Detection | Phi Accrual | Adaptive thresholds, fewer false positives |
| Anti-Entropy | Merkle Trees | Efficient inconsistency detection |
| Storage | LSM Tree | Optimized for write-heavy workloads |

---

## Failure Modes & Recovery
What can go wrong in production, and how the system detects and recovers:

| Failure | Impact | Recovery |
| --------- | -------- | ---------- |
| Node failure | Partial unavailability | Gossip detects, hint-handed-off writes |
| Network partition | Split-brain writes | Vector clocks detect conflicts |
| Datacenter failure | Regional outage | Cross-datacenter replication continues |
| Hot partition | Single node overload | Range splitting, virtual nodes |

---

## Cost Estimation (1M Users)
Rough monthly cost of running this design for one million users:

| Component | Monthly Cost |
| ----------- | ------------- |
| Storage nodes (9x) | $6,000 |
| Coordinator nodes (3x) | $2,000 |
| Cross-DC bandwidth | $1,000 |
| Monitoring | $500 |
| Total | ~$9,500 |

---

## Trade-off Analysis
The alternatives considered, and which one won and why:

| Trade-off | Option A | Option B | Winner | Why |
| ----------- | ---------- | ---------- | -------- | ----- |
| Consistency | Strong (CP) | Eventual (AP) | AP | Higher availability |
| Replication | Sync | Quorum | Quorum | Tunable consistency |
| Conflict Resolution | Vector Clocks | LWW | Vector Clocks | Detect true conflicts |
| Storage | LSM Tree | B-Tree | LSM Tree | Better write throughput |

---

## Key Metrics to Monitor
The metrics that signal system health, with alert thresholds:

| Metric | Target | Alert Threshold |
| -------- | -------- | ----------------- |
| Read Latency P99 | < 10ms | > 50ms |
| Write Latency P99 | < 15ms | > 50ms |
| Replication Lag | < 100ms | > 1s |
| Anti-Entropy Rate | > 99% | < 95% |
| Node Availability | > 99.9% | < 99% |

---

## Deep Dive Prompts

1. **How does consistent hashing handle node failures?**
2. **Explain quorum reads/writes and tunable consistency.**
3. **How do vector clocks detect causal conflicts?**
4. **Design the Merkle tree anti-entropy process.**
5. **How does gossip protocol propagate membership?**
6. **Explain CAP theorem trade-offs in a KV store.**

---

## Key Techniques & Patterns
The recurring techniques and patterns this design applies, mapped to where they are used:

| Technique | Description | Used In |
| ----------- | ------------- | ---------- |
| Consistent Hash Ring | Applied in this system | Architecture + LLD |
| Vector Clocks | Applied in this system | Architecture + LLD |
| Quorum Consensus | Applied in this system | Architecture + LLD |
| Merkle Tree Anti-Entropy | Applied in this system | Architecture + LLD |
| Gossip Protocol | Applied in this system | Architecture + LLD |
| LSM Tree Storage | Applied in this system | Architecture + LLD |

## Common Interview Follow-ups

**Q: How do you handle concurrent write conflicts?**
A: Use vector clocks to track causal ordering. When two versions are concurrent, return both to the client for resolution. For simpler cases, use last-writer-wins.

**Q: How does quorum consensus work?**
A: With N replicas, set W write and R read replicas. If W + R > N, you get strong consistency. Common: W=N (durable writes), R=1 (fast reads).

---

## Low-Level Design (LLD)

### 1. Consistent Hash Ring

```text
class ConsistentHashRing {
  constructor() {
    this.ring = new Map();
    this.sortedKeys = [];
  }

  addNode(node, vnodes = 150) {
    for (let i = 0; i < vnodes; i++) {
      const hash = this.hash(node + ":" + i);
      this.ring.set(hash, node);
      this.sortedKeys.push(hash);
    }
    this.sortedKeys.sort((a, b) => a - b);
  }

  getNode(key) {
    const hash = this.hash(key);
    for (const k of this.sortedKeys) {
      if (k >= hash) return this.ring.get(k);
    }
    return this.ring.get(this.sortedKeys[0]);
  }

  hash(key) {
    let h = 0;
    for (let i = 0; i < key.length; i++) {
      h = (h * 31 + key.charCodeAt(i)) & 0xffffffff;
    }
    return h;
  }
}
```

### 2. Vector Clock

```text
class VectorClock {
  constructor() {
    this.clock = new Map();
  }

  increment(nodeId) {
    this.clock.set(nodeId, (this.clock.get(nodeId) || 0) + 1);
  }

  merge(other) {
    for (const [node, time] of other.clock) {
      this.clock.set(node, Math.max(this.clock.get(node) || 0, time));
    }
  }

  happensBefore(other) {
    let dominated = false;
    for (const [node, time] of this.clock) {
      if (time > (other.clock.get(node) || 0)) return false;
      if (time < (other.clock.get(node) || 0)) dominated = true;
    }
    return dominated;
  }

  isConcurrent(other) {
    return !this.happensBefore(other) && !other.happensBefore(this);
  }
}

const kv = new KeyValueStore(); console.log("KV store ready");
```
