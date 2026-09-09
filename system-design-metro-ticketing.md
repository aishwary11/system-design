# System Design: Metro Ticketing System

## Overview

A metro transit ticketing system supporting smart cards, QR code tickets, fare calculation, and real-time passenger tracking.

### Key Numbers

- 10M+ daily passengers
- 500+ metro stations
- 1M+ smart card transactions per day
- 99.99% uptime required (critical infrastructure)

---

## Requirements

### Functional Requirements

- Tap NFC/QR at entry gate
- Tap at exit to deduct fare
- Calculate fare by distance
- Daily/weekly/monthly pass
- Real-time train schedules

### Non-Functional Requirements

- Latency: Gate < 500ms
- Throughput: 100K+ taps/sec
- Availability: 99.99% uptime
- Consistency: Strong for balance
- Scale: 10M+ passengers, 500+ stations

---

---

---

## High-Level Architecture

### Architecture Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1762" width="900" role="img" aria-label="Metro Ticketing — System Architecture">
<rect x="0" y="0" width="960" height="1762" fill="#ffffff"/>
<title>Metro Ticketing — System Architecture</title>
<rect x="52" y="288" width="739" height="1374" rx="10" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6 4"/>
<text x="66" y="308" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="12" fill="#475569">Metro Ticketing</text>
<path d="M422 132 L422 156 L438 156 L438 298 L422 298 L422 322" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M422 384 L422 408 L438 408 L438 550 L422 550 L422 574" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M408 636 L408 731 L164 731 L164 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M422 636 L422 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M436 636 L436 731 L680 731 L680 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M164 888 L164 912 L180 912 L180 1054 L159 1054 L159 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M422 888 L422 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M680 888 L680 912 L701 912 L701 1054 L685 1054 L685 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M159 1140 L159 1235 L408 1235 L408 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M422 1140 L422 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M685 1140 L685 1235 L436 1235 L436 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M408 1392 L408 1487 L164 1487 L164 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M422 1392 L422 1487 L441 1487 L441 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M436 1392 L436 1487 L699 1487 L699 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<rect x="348" y="70" width="148" height="62" rx="9" fill="#ecfdf5" stroke="#059669" stroke-width="1.6"/>
<text x="422" y="106" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#065f46">Mobile App</text>
<rect x="341" y="322" width="161" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="421.5" y="358" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">WAF / API Gateway</text>
<rect x="348" y="574" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="422" y="610" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Load Balancer</text>
<rect x="90" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="164" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Ticket Svc</text>
<rect x="348" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="422" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Gate Controller</text>
<rect x="606" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="680" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Fare Calc Svc</text>
<rect x="70" y="1582" width="187" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="163.5" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Reconciliation Workers</text>
<rect x="367" y="1582" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="441" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Analytics</text>
<rect x="625" y="1582" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="699" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Notifications</text>
<rect x="80" y="1078" width="158" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="159" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">PostgreSQL + Redis</text>
<rect x="348" y="1078" width="148" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="422" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">IoT + MQTT</text>
<rect x="606" y="1078" width="158" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="685" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">Redis + PostgreSQL</text>
<rect x="348" y="1330" width="148" height="62" rx="9" fill="#fff7ed" stroke="#ea580c" stroke-width="1.6"/>
<text x="422" y="1366" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#9a3412">Kafka</text>
<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/system-design/metro-ticketing.architecture.html](diagrams/system-design/metro-ticketing.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


*Solid = data flow, dashed = control plane / monitoring.*

### Data Flow

1. User books ticket - Ticket Service generates QR/NFC token
2. Entry gate: scanner validates token - stores entry in Redis
3. Exit gate: scanner reads exit station - Fare Calc computes charge
4. Fare deducted from wallet/account (ACID transaction)
5. Kafka events: entry, exit, fare - Reconciliation pipeline
6. Analytics: peak hours, station traffic, revenue reports
7. Dynamic pricing: peak vs off-peak fare adjustment

## Microservices

### 1. Ticket Service

- **Responsibility**: Ticket generation, validation, QR code/NFC handling
- **Tech**: Go
- **DB**: PostgreSQL (tickets), Redis (validation cache)

### 2. Fare Service

- **Responsibility**: Fare calculation, zone-based pricing, daily caps
- **Tech**: Go
- **DB**: PostgreSQL (fare rules), Redis (cached fares)

### 3. Card Service

- **Responsibility**: Smart card management, balance tracking, recharging
- **Tech**: Java / Go
- **DB**: PostgreSQL (card accounts)

### 4. Gate Controller Service

- **Responsibility**: Entry/exit validation, anti-passback, real-time status
- **Tech**: Go (embedded systems)
- **DB**: Redis (real-time validation)

### 5. Settlement Service

- **Responsibility**: Daily settlement, revenue sharing, reconciliation
- **Tech**: Java
- **DB**: PostgreSQL (settlement records)

---

## Database Design

### PostgreSQL

```sql
-- Smart Cards
CREATE TABLE cards (
    card_id         UUID PRIMARY KEY,
    card_number     VARCHAR(20) UNIQUE NOT NULL,
    user_id         UUID,
    balance         DECIMAL(10,2) DEFAULT 0.00,
    status          VARCHAR(20) DEFAULT 'active',
    last_used_at    TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Transactions (Entry/Exit)
CREATE TABLE transactions (
    transaction_id  UUID PRIMARY KEY,
    card_id         UUID REFERENCES cards(card_id),
    station_id      UUID NOT NULL,
    entry_station   UUID,
    exit_station    UUID,
    entry_time      TIMESTAMP,
    exit_time       TIMESTAMP,
    fare            DECIMAL(10,2),
    status          VARCHAR(20), -- entry, exit, completed
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Fare Rules
CREATE TABLE fare_rules (
    rule_id         UUID PRIMARY KEY,
    from_zone       INT,
    to_zone         INT,
    base_fare       DECIMAL(10,2),
    per_km_rate     DECIMAL(10,2),
    peak_multiplier DECIMAL(3,2) DEFAULT 1.5,
    daily_cap       DECIMAL(10,2),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Stations
CREATE TABLE stations (
    station_id      UUID PRIMARY KEY,
    name            VARCHAR(255),
    zone            INT,
    latitude        DECIMAL(10,8),
    longitude       DECIMAL(11,8),
    line            VARCHAR(50),
    is_active       BOOLEAN DEFAULT TRUE
);
```

---

## Scaling Tiers

### Tier 1: 1K - 10K Users

| Component | Choice |
| ----------- | -------- |
| **Compute** | 2 EC2 (t3.large) |
| **Database** | PostgreSQL RDS |
| **Cache** | Redis (single) |
| **Gate** | Simple NFC readers |

### Tier 2: 10K - 1M Users

| Component | Choice |
| ----------- | -------- |
| **Compute** | ECS (10-20 containers) |
| **Database** | PostgreSQL (read replicas) |
| **Cache** | Redis Cluster (6 nodes) |
| **Gate** | Smart gate controllers |

### Tier 3: 1M - 10M+ Users

| Component | Choice |
| ----------- | -------- |
| **Compute** | Multi-region K8s (100+ pods) |
| **Database** | PostgreSQL (sharded) + Cassandra |
| **Cache** | Redis Cluster (30+ nodes) |
| **Gate** | Edge computing at each station |

---

## Key Design Decisions

### 1. Why Redis for Gate Validation?

- Sub-millisecond reads (< 10ms required)
- Gate must open in < 500ms
- DB fallback for cold cards

### 2. Why Zone-Based Pricing?

- Simple to implement and understand
- Easy to adjust prices per zone
- Daily caps prevent overcharging

### 3. Why Anti-Passback?

- Prevents card sharing
- Ensures accurate passenger counting
- Required for revenue integrity

### 4. Why QR Codes + NFC?

- QR codes: Cheaper hardware, works with phones
- NFC: Faster, works with smart cards
- Both: Redundancy for reliability

---

---

## Failure Modes & Recovery
What can go wrong in production, and how the system detects and recovers:

| Failure | Impact | Recovery |
| --------- | -------- | ---------- |
| NFC gate reader offline | Passengers cannot tap in/out | Offline mode: cache balance locally, sync when back online |
| Anti-passback state corrupted | Wrong fare charged, stuck passengers | Manual override by station staff + state reconciliation |
| Redis cache failure | Balance check slow, gates delay | Fallback to PostgreSQL with connection pooling |
| Fare calculation error | Over/under charging passengers | Audit log + automated refund for discrepancies |
| Kafka consumer lag | Analytics dashboard stale | Auto-scale consumers + alert on lag > threshold |
| Wallet balance race condition | Double-spend possible | Distributed lock + idempotency key on transactions |

## Cost Estimation (1M Users)
Rough monthly cost of running this design for one million users:

| Component | Specification | Monthly Cost |
| ----------- | -------------- | ------------- |
| Gate Controllers | 500x edge devices | $25,000 |
| NFC Readers | 1000x hardware | $50,000 (amortized) |
| API Servers | 10x c5.xlarge | $1,400 |
| PostgreSQL | db.r5.xlarge + 3 replicas | $4,800 |
| Redis Cluster | 6x cache.r5.xlarge | $4,800 |
| Kafka Cluster | 6x kafka.m5.large | $2,400 |
| QR Code Service | 3x c5.large | $420 |
| Real-time Displays | 500x screens | $15,000 (amortized) |
| **Total** | | **~$103,820/month** |

---

## Trade-off Analysis
The alternatives considered, and which one won and why:

| Approach A | Approach B | Winner | Reason |
| ----------- | ----------- | -------- | -------- |
| NFC | QR Code | Both | NFC for speed, QR for backup |
| Redis state | Database state | Redis | Sub-ms anti-passback checks |
| Zone fare | Distance fare | Zone fare | Simpler, more predictable |
| HMAC | UUID for tickets | HMAC | Tamper-proof, verifiable offline |
| MQTT | HTTP for gates | MQTT | Lightweight, better for IoT |

---

## Key Metrics to Monitor
The metrics that signal system health, with alert thresholds:

| Metric | Description | Target |
| -------- | ------------- | -------- |
| **Gate Tap Latency** | Time from tap to gate open | < 500ms |
| **Fare Calculation Time** | Time to compute fare | < 50ms |
| **Anti-Passback Violations** | Invalid taps blocked | Monitored |
| **QR Code Validation Rate** | Successful QR scans | > 99% |
| **Daily Cap Accuracy** | Correctly applied spending limits | 100% |
| **Gate Availability** | % of time gates are operational | > 99.9% |
| **Peak Hour Throughput** | Taps per second during rush hour | > 50/sec/gate |
| **Balance Deduction Accuracy** | Correct fare charged | 100% |
| **Card Read Failure Rate** | Failed NFC/QR reads | < 1% |
| **Offline Mode Usage** | Taps processed while offline | Monitored |

## Deep Dive Prompts

- How does anti-passback prevent fare evasion?
- How do you handle offline gate operation during network outages?
- How does zone-based fare calculation work?
- How do you validate NFC/QR tickets in under 500ms?

---

## Key Techniques & Patterns
The recurring techniques and patterns this design applies, mapped to where they are used:

| Technique | Description | Used In |
| ----------- | ------------- | ---------- |
| QR Code Generation | Applied in this system | Architecture + LLD |
| Tap-In/Tap-Out State Machine | Applied in this system | Architecture + LLD |
| Fare Calculation by Distance | Applied in this system | Architecture + LLD |
| Real-time Train Tracking | Applied in this system | Architecture + LLD |
| Dynamic Seat Allocation | Applied in this system | Architecture + LLD |
| Payment Gateway Integration | Applied in this system | Architecture + LLD |

## Common Interview Follow-ups

**Q: How does anti-passback prevent evasion?**
A: State machine tracks entry/exit, prevents re-entry without exit, Redis state

**Q: How do you calculate zone-based fare?**
A: Entry/exit zones, distance matrix in Redis, daily cap auto-applied

**Q: How do you handle gate validation < 500ms?**
A: Local Redis cache on gate, async sync, offline mode with last-known balance

---

## Low-Level Design (LLD) - Algorithms & Data Structures

### 1. Anti-Passback State Machine

```text
class GateController {
  constructor(nfcReader, dbClient) { this.nfc = nfcReader; this.db = dbClient; }
  async tapIn(cardId, gateId) {
    const card = await this.db.getCard(cardId);
    if (!card || card.balance <= 0) return { allowed: false, reason: 'insufficient_balance' };
    const lastEntry = await this.db.getLastEntry(cardId);
    if (lastEntry && !lastEntry.exited) return { allowed: false, reason: 'already_inside' };
    await this.db.recordEntry({ cardId, gateId, entryTime: Date.now() });
    return { allowed: true, station: gateId };
  }
  async tapOut(cardId, gateId) {
    const entry = await this.db.getUnexitedEntry(cardId);
    if (!entry) return { allowed: false, reason: 'no_entry_found' };
    const fare = this.calcFare(entry.station, gateId);
    await this.db.deductBalance(cardId, fare);
    await this.db.recordExit({ cardId, gateId, exitTime: Date.now(), fare });
    return { allowed: true, fare, newBalance: await this.db.getBalance(cardId) };
  }
  calcFare(from, to) { return Math.abs(from.charCodeAt(0) - to.charCodeAt(0)) + 10; }
}

const event = new EventService(); console.log("Event service ready");
```

### 2. Zone-Based Fare Calculation

```text
class FareCalculator {
    // Calculate metro fare based on entry/exit zones.
    // Fare validation steps:
    // Fare Matrix:
    // - Zone 1 -> Zone 1: $1.00
    // - Zone 1 -> Zone 2: $1.50
    // - Zone 1 -> Zone 3: $2.00
    // - Daily cap: $5.00

```

### 3. QR Code Generation (HMAC-Secured)

```text
const hmac = require('hmac');
const hashlib = require('crypto');
const time = require('time');
const qrcode = require('qrcode');

class QRCodeGenerator {
    // QR Payload:
    // - card_id
    // - timestamp

```

### 4. Daily Cap Algorithm

```text
class DailyCap {
    // Apply daily spending cap to prevent overcharging.
    // Daily cap enforcement is applied here.
    // Algorithm:
    // 1. Track daily total per card
    // 2. On each tap-out, check if cap reached
    // 3. If cap reached, remaining rides are free

```

---

### Key Algorithms

### 1. Fare Calculation (Zone-Based)

```text
function calculate_fare(entry_station_id, exit_station_id, card_id, travel_time) {
    // Metro fare calculation:
    // 1. Determine zones (entry && exit)
    // 2. Calculate zone-based fare
    // 3. Apply peak/off-peak multiplier
    // 4. Apply daily cap
    // // Step 1: Zone distance
    // // Step 2: Base fare from fare rules
    // // Step 3: Peak/off-peak
    // // Step 4: Daily cap

```

### 2. Anti-Passback (Prevent Tailgating)

```text
function validate_entry(card_id, station_id) {
    // Anti-passback: Prevent using the same card at the same station twice
    // - Check the last transaction for that card
    // - If the last action was not an exit, reject entry
    // - Otherwise allow the new entry and record the transaction

    last = get_last_transaction(card_id);
    if (last && last.station_id == station_id && last.type != "exit") {
        return "deny";
    }
    return "allow";
}
```

### 3. QR Code Ticket Generation

```text
function generate_qr_ticket(user_id, journey_type) {
    // Generate a QR code ticket:
    // - Build payload with user_id, timestamp, journey_type
    // - Sign payload with private key
    // - Encode signed payload as QR code

    payload = {
        user_id: user_id,
        journey_type: journey_type,
        timestamp: now()
    };
    signed = sign(payload);
    return generate_qr(signed);
}
```

### 4. Real-Time Validation (Gate Controller)

```text
function validate_at_gate(card_id, gate_type) {
    // Validate the fare and opening state for the gate
    // 1. Check if the card is active and valid
    // 2. Record the entry/exit event
    // 3. Open the gate if validation passes
    // 4. Fall back to the DB if cache is stale

    if (cache_has_valid_state(card_id)) {
        return open_gate(gate_type);
    }
    return validate_from_db(card_id, gate_type);
}
```

---
