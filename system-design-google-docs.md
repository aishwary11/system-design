# System Design: Google Docs

## Overview

Real-time collaborative document editor with OT/CRDT conflict resolution.

### Key Numbers

- 1B+ users, 500M+ docs/day, <100ms sync, 50+ concurrent editors

---

## Requirements

### Functional Requirements

- Create/edit rich-text documents with formatting
- Real-time collaboration with multiple cursors
- Offline editing with sync on reconnect
- Comments, suggestions, track changes
- Version history and rollback
- Export to PDF, DOCX, HTML

### Non-Functional Requirements

- Sync latency < 100ms, doc open < 500ms
- 10M+ concurrent documents, 99.99% availability

---

## High-Level Architecture

### Architecture Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1762" width="900" role="img" aria-label="Google Docs — System Architecture">
<rect x="0" y="0" width="960" height="1762" fill="#ffffff"/>
<title>Google Docs — System Architecture</title>
<rect x="52" y="288" width="727" height="1374" rx="10" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6 4"/>
<text x="66" y="308" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="12" fill="#475569">Google Docs</text>
<path d="M416 132 L416 156 L432 156 L432 298 L416 298 L416 322" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\google-docs)"/>
<path d="M416 384 L416 408 L432 408 L432 550 L416 550 L416 574" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\google-docs)"/>
<path d="M402 636 L402 731 L156 731 L156 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\google-docs)"/>
<path d="M416 636 L416 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\google-docs)"/>
<path d="M430 636 L430 731 L675 731 L675 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\google-docs)"/>
<path d="M156 888 L156 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\google-docs)"/>
<path d="M416 888 L416 912 L444 912 L444 1054 L428 1054 L428 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\google-docs)"/>
<path d="M675 888 L675 912 L703 912 L703 1054 L687 1054 L687 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\google-docs)"/>
<path d="M156 1140 L156 1235 L402 1235 L402 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\google-docs)"/>
<path d="M416 1140 L416 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\google-docs)"/>
<path d="M687 1140 L687 1235 L430 1235 L430 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\google-docs)"/>
<path d="M402 1392 L402 1487 L158 1487 L158 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\google-docs)"/>
<path d="M416 1392 L416 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\google-docs)"/>
<path d="M430 1392 L430 1487 L674 1487 L674 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\google-docs)"/>
<rect x="342" y="70" width="148" height="62" rx="9" fill="#ecfdf5" stroke="#059669" stroke-width="1.6"/>
<text x="416" y="106" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#065f46">Web App</text>
<rect x="335" y="322" width="161" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="415.5" y="358" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">WAF / API Gateway</text>
<rect x="342" y="574" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="416" y="610" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Load Balancer</text>
<rect x="82" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="156" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Document Svc</text>
<rect x="340" y="826" width="151" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="415.5" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Collaboration Svc</text>
<rect x="601" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="675" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Presence Svc</text>
<rect x="84" y="1582" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="158" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Index Workers</text>
<rect x="342" y="1582" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="416" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Analytics</text>
<rect x="600" y="1582" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="674" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Export Workers</text>
<rect x="70" y="1078" width="172" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="156" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">Google Cloud Spanner</text>
<rect x="352" y="1078" width="151" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="427.5" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">OT Engine + Redis</text>
<rect x="613" y="1078" width="148" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="687" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">Redis (cursors)</text>
<rect x="342" y="1330" width="148" height="62" rx="9" fill="#fff7ed" stroke="#ea580c" stroke-width="1.6"/>
<text x="416" y="1366" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#9a3412">Kafka</text>
<defs><marker id="arr-D:\Aish\Coding\System-Design\diagrams\json\google-docs" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/system-design/google-docs.architecture.html](diagrams/system-design/google-docs.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


*Solid = data flow, dashed = control plane / monitoring.*

### Data Flow

1. User opens document - Document Service loads from Spanner
2. WebSocket to Collaboration Service (OT/CRDT engine)
3. User types operation - OT transforms against concurrent ops
4. Server applies operation, broadcasts to all connected users
5. Presence Service tracks cursors, selections in real-time
6. Version history stored as operation log (append-only)
7. Kafka events: edit, share, comment - Analytics + indexing

## Microservices
How the system is decomposed into independently deployed services:

| Service | Responsibility | Tech Stack | Pattern |
| --------- | --------------- | ------------ | --------- |
| Document Service | CRUD, version history | Node.js, PostgreSQL | Event Sourcing |
| Sync Service | Real-time OT/CRDT sync | Go, WebSocket | Operational Transform |
| Presence Service | Cursors, online users | Redis, WebSocket | Pub/Sub |
| Comment Service | Threaded comments | Node.js, PostgreSQL | CQRS |
| Export Service | PDF, DOCX, HTML export | Python, Puppeteer | Worker Queue |
| Storage Service | Document blob storage | GCS, CDN | Object Storage |

---

## Database Design
The data stores, schemas, and access patterns behind each service:

```sql
CREATE TABLE documents (
    doc_id UUID PRIMARY KEY, owner_id BIGINT NOT NULL,
    title VARCHAR(500), content JSONB, version BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE operations (
    op_id BIGSERIAL PRIMARY KEY, doc_id UUID REFERENCES documents(doc_id),
    user_id BIGINT NOT NULL, op_type VARCHAR(20), position INT,
    content TEXT, version BIGINT, created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE comments (
    comment_id UUID PRIMARY KEY, doc_id UUID REFERENCES documents(doc_id),
    user_id BIGINT NOT NULL, parent_id UUID, content TEXT,
    resolved BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Scaling Tiers

### 1K - 10K Users ($500/mo)

- Single PostgreSQL, 2 Redis, GCS for storage, single sync server

### 10K - 1M Users ($20K/mo)

- PostgreSQL read replicas, Redis cluster, OT sharded by doc, CDN

### 1M - 10M+ Users ($800K/mo)

- PG cluster sharded, 100+ Redis, multi-region OT servers, GCS multi-region

---

## Key Design Decisions
The choices that shape this architecture, and why each was made:

| Decision | Choice | Why |
| ---------- | -------- | ----- |
| Conflict Resolution | Operational Transformation | Proven for text editing, deterministic |
| Storage Format | JSON operations log | Enables version history and undo |
| Sync Protocol | WebSocket + heartbeat | Bidirectional real-time sync |
| Offline Support | Local op queue + merge | Never lose user edits |
| Cursor Presence | Redis pub/sub | Low-latency cursor sharing |

---

## Failure Modes & Recovery
What can go wrong in production, and how the system detects and recovers:

| Failure | Impact | Recovery |
| --------- | -------- | ---------- |
| OT Server crash | Sync stops | Save-only mode, queue locally |
| Database failure | State lost | Restore from op log replay |
| Redis failure | Presence lost | Rebuild from client heartbeats |
| Network partition | Split-brain | OT guarantees convergence |
| Op log overflow | Slow lookups | Archive old ops to cold storage |

---

## Cost Estimation (1M Users)
Rough monthly cost of running this design for one million users:

| Component | Monthly Cost |
| ----------- | ------------- |
| Compute (OT + Doc servers) | $8,000 |
| PostgreSQL cluster | $3,000 |
| Redis cluster (50GB) | $2,500 |
| GCS (10TB) + CDN | $285 |
| Monitoring | $1,500 |
| Total | ~$15,285 |

---

## Trade-off Analysis
The alternatives considered, and which one won and why:

| Trade-off | Option A | Option B | Winner | Why |
| ----------- | ---------- | ---------- | -------- | ----- |
| Conflict Resolution | OT | CRDT | OT | Proven for text editing |
| Storage Model | Snapshot | Op Log | Op Log | Version history + undo |
| Sync Protocol | WebSocket | SSE | WebSocket | Bidirectional, lower latency |
| Offline Strategy | Conflict-free | LWW | Conflict-free | Never lose edits |

---

## Key Metrics to Monitor
The metrics that signal system health, with alert thresholds:

| Metric | Target | Alert Threshold |
| -------- | -------- | ----------------- |
| Sync Latency P99 | < 100ms | > 200ms |
| Document Open Time | < 500ms | > 2s |
| Conflict Resolution Rate | < 0.1% | > 1% |
| Offline Sync Success | > 99.9% | < 99% |

---

## Deep Dive Prompts

1. **How does OT handle 50 concurrent editors on the same line?**
2. **Explain OT vs CRDTs for collaborative editing.**
3. **How to implement offline editing with sync on reconnect?**
4. **Design version history and rollback system.**
5. **How to handle large documents without perf degradation?**
6. **Explain cursor presence system for showing other users cursors.**

---

## Key Techniques & Patterns
The recurring techniques and patterns this design applies, mapped to where they are used:

| Technique | Description | Used In |
| ----------- | ------------- | ---------- |
| Operational Transformation (OT) | Applied in this system | Architecture + LLD |
| CRDT for Offline | Applied in this system | Architecture + LLD |
| WebSocket for Real-time Sync | Applied in this system | Architecture + LLD |
| Version History (Op Log) | Applied in this system | Architecture + LLD |
| Cursor Presence | Applied in this system | Architecture + LLD |
| Conflict Resolution | Applied in this system | Architecture + LLD |

## Common Interview Follow-ups

**Q: How does OT handle conflicting edits on the same position?**
A: The OT server receives operations in causal order. When two users edit the same position, transformation functions reconcile the operations. Regardless of arrival order, the final document state is identical.

**Q: How do you handle offline editing?**
A: Operations are queued locally using the same OT engine. On reconnect, pending operations are sent to the server, transformed against concurrent edits, and broadcast to other clients.

**Q: How do you prevent edit conflicts in formatting?**
A: Formatting operations are represented as spans with start/end positions. Concurrent overlapping spans are merged, and both formats are applied.

---

## Low-Level Design (LLD)

### 1. Operational Transformation Engine

```text
class OTEngine {
  constructor(docId) {
    this.docId = docId;
    this.version = 0;
    this.operations = [];
  }

  apply(operation) {
    let transformed = { ...operation };

    for (const prev of this.operations) {
      if (prev.version >= (transformed.baseVersion ?? 0)) {
        transformed = this.transform(transformed, prev);
      }
    }

    transformed.version = ++this.version;
    this.operations.push(transformed);
    return transformed;
  }

  transform(op1, op2) {
    if (op1.type === "insert" && op2.type === "insert") {
      if (op1.position <= op2.position) return { ...op1 };
      return { ...op1, position: op1.position + op2.content.length };
    }

    if (op1.type === "delete" && op2.type === "insert") {
      if (op1.position < op2.position) return { ...op1 };
      return { ...op1, position: op1.position + op2.content.length };
    }

    return { ...op1 };
  }
}
```

### 2. Document Sync Manager

```text
class SyncManager {
  constructor(ws, docId, userId) {
    this.ws = ws;
    this.docId = docId;
    this.userId = userId;
    this.pendingOps = [];
    this.version = 0;
    this.doc = [];
  }

  sendOperation(op) {
    const operation = {
      ...op,
      baseVersion: this.version,
      userId: this.userId,
    };

    this.pendingOps.push(operation);
    this.ws.send(JSON.stringify({ type: "op", operation }));
  }

  receiveOperation(op) {
    let transformed = { ...op };

    for (const pending of this.pendingOps) {
      transformed = this.transform(transformed, pending);
    }

    this.version = Math.max(this.version, transformed.version ?? this.version + 1);
    this.applyToDocument(transformed);
    this.pendingOps = this.pendingOps.filter((pending) => pending.id !== transformed.id);
  }

  transform(op1, op2) {
    if (op1.type === "insert" && op2.type === "insert") {
      if (op1.position <= op2.position) return { ...op1 };
      return { ...op1, position: op1.position + op2.content.length };
    }

    if (op1.type === "delete" && op2.type === "insert") {
      if (op1.position < op2.position) return { ...op1 };
      return { ...op1, position: op1.position + op2.content.length };
    }

    return { ...op1 };
  }

  applyToDocument(op) {
    if (op.type === "insert") {
      this.doc.splice(op.position, 0, ...op.content.split(""));
    } else if (op.type === "delete") {
      this.doc.splice(op.position, op.length);
    }
  }
}

const ws = {
  send(payload) {
    console.log("Sent:", payload);
  },
};

const sync = new SyncManager(ws, "doc-42", "user-7");
sync.sendOperation({ id: "op-1", type: "insert", position: 0, content: "Hello" });
console.log("Document sync ready");
```
