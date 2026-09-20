<div align="center">

# System Design: Discord (Community Chat, Massive Rooms & Voice)

</div>

> [!TIP]
> **TL;DR** — Group chat at Discord scale: servers with hundreds of thousands of members, millions of concurrent WebSocket sessions, voice/video over UDP — where naive fan-out breaks the moment a 100K-member room receives one message.

## Overview

Unlike WhatsApp (1:1 and small groups), Discord rooms (channels in servers) routinely have 100K+ members with only a few hundred active speakers. That asymmetry breaks naive fan-out: delivering one message to 100K sockets is not "send 100K times." Discord's real design (Elixir/Go gateway + separate voice servers) is the reference architecture.

### Key Numbers

| Metric | Value |
| :--- | :--- |
| **Concurrent sessions** | 5M+ WebSockets per gateway cluster |
| **Room size** | 100K–1M members, <1K typing at once |
| **Messages** | 4B+ messages/day across rooms |
| **Voice** | 25M+ concurrent UDP participants |

---

## Requirements

### Functional Requirements

- Servers (guilds) with text channels; join/leave; roles & permissions
- Send/receive messages; typing indicators; read state (unread counts)
- Presence (online/idle/DND) for massive member lists
- Voice channels: join, speak, mute, video
- History with pagination; pinning; reactions

### Non-Functional Requirements

| Attribute | Target |
| :--- | :--- |
| **Message delivery** | < 200ms P99 (typed → delivered) |
| **Presence** | eventual (seconds), batched — never per-user fan-out |
| **Session recovery** | resume after reconnect without message loss |
| **Scale per room** | 1M members, 100K concurrent viewers |

---

## High-Level Architecture

### Architecture Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1762" width="900" role="img" aria-label="Discord — System Architecture">
<rect x="0.5" y="0.5" width="959" height="1761" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
<rect x="52" y="288" width="713" height="1374" rx="14" fill="none" stroke="#cbd5e1" stroke-width="1.3" stroke-dasharray="7 5"/>
<rect x="64" y="296" width="70.4" height="20" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
<text x="99.2" y="310" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" fill="#475569">Discord</text>
<path d="M409 132 L409 156 L425 156 L425 298 L409 298 L409 322" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-discord)"/>
<path d="M409 384 L409 574" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-discord)"/>
<path d="M389 636 L389 731 L151 731 L151 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-discord)"/>
<path d="M409 636 L409 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-discord)"/>
<path d="M429 636 L429 731 L667 731 L667 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-discord)"/>
<path d="M151 888 L151 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-discord)"/>
<path d="M409 888 L409 912 L430 912 L430 1054 L414 1054 L414 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-discord)"/>
<path d="M667 888 L667 912 L688 912 L688 1054 L672 1054 L672 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-discord)"/>
<path d="M151 1140 L151 1235 L389 1235 L389 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-discord)"/>
<path d="M409 1140 L409 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-discord)"/>
<path d="M672 1140 L672 1235 L429 1235 L429 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-discord)"/>
<path d="M389 1392 L389 1487 L146 1487 L146 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-discord)"/>
<path d="M409 1392 L409 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-discord)"/>
<path d="M429 1392 L429 1487 L668 1487 L668 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-discord)"/>
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
<text x="151" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Gateway (WS)</text>
<rect x="335" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="335" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="338" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="409" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Message Svc</text>
<rect x="593" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="593" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="596" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="667" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Voice SFU</text>
<rect x="72" y="1081" width="158" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="72" y="1078" width="158" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="75" y="1081" width="152" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="151" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Cassandra</text>
<rect x="340" y="1081" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="340" y="1078" width="148" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="343" y="1081" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="414" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Redis Sessions</text>
<rect x="598" y="1081" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="598" y="1078" width="148" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="601" y="1081" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="672" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">PostgreSQL Perms</text>
<rect x="335" y="1333" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="335" y="1330" width="148" height="62" rx="12" fill="#fff7ed" stroke="#f97316" stroke-width="1.4"/>
<rect x="338" y="1333" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="409" y="1366" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#7c2d12">Kafka</text>
<rect x="70" y="1585" width="151" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="70" y="1582" width="151" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="73" y="1585" width="145" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="145.5" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Fan-out Workers</text>
<rect x="331" y="1585" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="331" y="1582" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="334" y="1585" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="405" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Presence Workers</text>
<rect x="589" y="1585" width="158" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="589" y="1582" width="158" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="592" y="1585" width="152" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="668" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Voice Signaling</text>
<defs><marker id="arr-discord" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker><marker id="arrEm-discord" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#10b981"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/system-design/discord.architecture.html](diagrams/system-design/discord.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


**Interactive diagram:** [diagrams/system-design/discord.architecture.html](diagrams/system-design/discord.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.

### Data Flow

1. Client connects to the **Gateway** (WebSocket) — session state in Redis (session id, subscriptions, cursor)
2. Message sent → Message Service → Cassandra (partitioned by channel_id + time bucket) → Kafka
3. Gateway fan-out workers consume Kafka; each worker holds only the sockets on its node
4. **Hierarchical fan-out**: room → subscribed gateway nodes → local sockets (not member-by-member)
5. Typing/presence events are **lossy**: dropped under load, no persistence, batched per room
6. Voice: signaling over gateway; media flows peer-to-**UDP voice server** (SFU), never through the chat path

## Microservices

| Service | Tech Stack | Database | Pattern |
| --------- | ------------ | ---------- | ---------- |
| Gateway | Elixir | Redis (sessions) | WS connection hub |
| Message Service | Rust/Go | Cassandra | Log storage |
| Presence Service | Go | Redis (bitmap sets) | Lossy broadcast |
| Voice Service (SFU) | C++/Go | none (stateless media) | UDP relay |
| Permission Service | Go | PostgreSQL | Role evaluation |

---

## Database Design

### Cassandra

```
messages:      PK (channel_id, bucket, message_id) bucket by day
user_channels: PK (user_id, channel_id)  -> last_read_message_id, settings
guild_members: PK (guild_id, user_id)    -> roles, joined_at
```

### Redis

```bash
session:{session_id}       -> gateway node, subscriptions, resume cursor
guild:{guild_id}:online    -> SET / roaring bitmap of online user_ids
channel:{channel_id}:typing -> SET with 8s TTLs (lossy, no persistence)
```

---

## Scaling Tiers

| Tier | Users | Infrastructure | Monthly Cost |
| ------ | ------- | -------------- | ------------- |
| 1K-10K | 10K | 2 gateway + PostgreSQL + Redis | $400 |
| 10K-1M | 1M | 8 gateway + Cassandra 3 + Redis + Kafka + SFU pool | $8,000 |
| 1M-10M+ | 10M+ | 60 gateway + Cassandra 12 + Redis cluster + Kafka + 100 SFU | $120,000 |

---

## Key Techniques & Patterns

- **Hierarchical fan-out**: room → nodes → sockets; never O(members) work per message
- **Lossy delivery for ephemeral events**: typing/presence dropped under load, never queued
- **Session resume cursor**: reconnect replays from last received message id
- **Event-Driven Architecture**: Kafka as the fan-out bus, per-node consumer groups
- **WebSockets** at millions of concurrent sessions (gateway = stateful, deliberate)
- **Backpressure**: per-room rate limiting; slow rooms never block fast rooms

---

## Key Design Decisions

1. **Stateful gateway over stateless LB**: sticky WS sessions with session store; resumable, cheaper than re-handshake storms
2. **Separate voice plane**: UDP media never touches chat infra (different failure domains, latency budgets)
3. **Cassandra bucketed by time**: message history reads are range scans; writes append
4. **Elixir/BEAM for gateway**: millions of cheap lightweight processes per node
5. **Presence as bitmaps, batched**: presence for a 1M-member server must cost ~nothing when idle

---

## Failure Modes & Recovery

| Failure | Impact | Mitigation |
| --------- | -------- | ----------- |
| Gateway node crash | 50K sockets drop | Clients auto-resume via cursor; sessions rebalance |
| Kafka partition lag | Delayed delivery | Per-room priority; lag alerting; shed typing events first |
| Redis down | Sessions lost | Clients reconnect fresh; resume best-effort |
| Voice SFU failure | Call drops | Region failover; client rejoins in <2s |
| Thundering reconnect (network event) | Reconnect storm | Exponential backoff + jitter; connection admission control |

---

## Cost Estimation (1M Users)

| Component | Configuration | Monthly Cost |
| ----------- | -------------- | ------------- |
| Gateway (12) | c7g.4xlarge | $4,500 |
| Cassandra (6) | i4i.2xlarge | $3,000 |
| Kafka (3) | m7g.large | $900 |
| Redis cluster | cache.r7g.large ×6 | $1,200 |
| SFU pool (20) | c7g.2xlarge | $1,600 |
| **Total** | | **~$11,200** |

---

## Trade-off Analysis

| Decision | Option A | Option B | Choice | Why |
| ---------- | ---------- | ---------- | -------- | ----- |
| Fan-out | Per member | Hierarchical via Kafka | Hierarchical | 1M-member rooms impossible otherwise |
| Typing events | Reliable queue | Lossy, TTL'd | Lossy | A 3s-old typing event is worthless |
| Voice | Relay via chat infra | Separate UDP SFU | SFU | Latency + failure isolation |
| Sessions | Stateless behind LB | Sticky + resume | Sticky + resume | Cheap reconnects |
| Presence | Per-user events | Bitmap + batching | Bitmap | 1M-member server presence ≈ free |

---

## Key Metrics to Monitor

1. Concurrent WS sessions per gateway
2. Message delivery latency P99 (send → remote socket)
3. Kafka fan-out lag per partition
4. Typing/presence drop rate (expected > 0 under load)
5. Resume success rate after reconnect
6. Voice: packet loss, jitter, RTT per region
7. Per-room event rate (abuse detection)

---

## Deep Dive Prompts

1. Design the permission system so checking a message send is O(1) (permission overfetch cache)
2. How would you implement slow mode / anti-spam per channel?
3. Design read-state/unread counts for a user in 500 servers.
4. How does Discord handle 1M-member "one-time" announcements (stage channels)?
5. How would you add end-to-end encryption for group DMs without breaking search?

---

## Common Interview Follow-ups

1. Why not MQTT or NATS instead of a custom gateway?
2. How do you deliver to a room whose members span 50 gateway nodes with one Kafka partition?
3. How do you keep voice out of the chat failure domain?
4. Why is "just use Firebase" not an answer at 1M-member rooms?
5. How do you test fan-out under 10× normal load?

---

## Low-Level Design (LLD) - Algorithms & Data Structures

### Hierarchical Fan-Out (room → nodes → sockets)

```text
// Gateway nodes register the guilds/channels their sockets subscribe to.
// Delivering one message = O(subscribed nodes), never O(members).
class FanOutRouter {
  constructor() { this.nodeByChannel = new Map(); this.socketsByNode = new Map(); }

  register(nodeId, channels) {
    for (const ch of channels) {
      if (!this.nodeByChannel.has(ch)) this.nodeByChannel.set(ch, new Set());
      this.nodeByChannel.get(ch).add(nodeId);
    }
  }
  route(channelId, message) {
    const nodes = this.nodeByChannel.get(channelId) ?? new Set();
    const deliveries = [];
    for (const n of nodes) deliveries.push({ node: n, sockets: (this.socketsByNode.get(n) ?? []).length });
    return deliveries; // e.g. a 1M-member room touches ~40 nodes, not 1M sockets
  }
}

const router = new FanOutRouter();
router.register("gw-1", ["general"]);
router.register("gw-2", ["general", "memes"]);
router.register("gw-3", ["memes"]);
console.log(router.route("general"));   // 2 nodes
console.log(router.route("memes"));     // 2 nodes

// Lossy typing indicator: keep only last 8s of events, drop under load
class TypingBuffer {
  constructor() { this.events = []; }
  add(userId) { this.events.push({ userId, t: Date.now() }); }
  current(maxEvents = 50) {
    const cutoff = Date.now() - 8000;
    this.events = this.events.filter(e => e.t >= cutoff);
    return this.events.slice(-maxEvents).map(e => e.userId); // drop, never queue
  }
}
```

### Consistent-Hash Ring for Gateway→Session Routing

A Discord-scale gateway fleet holds millions of live WebSocket sessions; every "send to user X" must find the gateway instance owning X's session. A hash ring with vnodes keeps that lookup O(1) and re-maps only K/N sessions when a gateway dies.

```js
class SessionRing {
  constructor(nodes = [], vnodes = 160) {
    this.ring = [];                                   // [{hash, node}]
    this.vnodes = vnodes;
    nodes.forEach(n => this.addNode(n));
  }
  _hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  addNode(node) {
    for (let i = 0; i < this.vnodes; i++)
      this.ring.push({ hash: this._hash(`${node}#${i}`), node });
    this.ring.sort((a, b) => a.hash - b.hash);
  }
  removeNode(node) { this.ring = this.ring.filter(p => !p.node.startsWith(node)); }
  route(sessionKey) {                                 // "user:42:device:3"
    const h = this._hash(sessionKey);
    let lo = 0, hi = this.ring.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; (this.ring[mid].hash < h) ? lo = mid + 1 : hi = mid; }
    return this.ring[lo % this.ring.length].node;     // clockwise successor
  }
}
const ring = new SessionRing(['gw-1', 'gw-2', 'gw-3']);
ring.route('user:42:device:3');            // always the same gateway while the ring is stable
ring.removeNode('gw-2');                   // only ~1/3 of sessions re-home (1/N with vnodes)
```

This is the same primitive as the sharding section (§2 concepts) applied to *connections instead of data* — and why the pub/sub layer fans out by session-ownership rather than broadcasting to every gateway.
