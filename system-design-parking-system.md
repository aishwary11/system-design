# System Design: Smart Parking System

## Overview

A smart parking management system that enables real-time parking spot discovery, reservation, guided navigation, automated entry/exit, and payment processing. The system manages parking lots across multiple cities with IoT sensors for real-time occupancy tracking.

### Key Numbers

- 50K+ parking spots across 500+ lots
- 1M+ registered users
- 100K+ daily reservations
- Real-time sensor updates every 5 seconds

---

## Requirements

### Functional Requirements

- Search spots by location
- Reserve and pay for slots
- Navigation to reserved spot
- ANPR entry/exit
- Dynamic pricing

### Non-Functional Requirements

- Latency: Search < 200ms
- Throughput: 10K searches/sec
- Availability: 99.99% uptime
- Consistency: Strong for reservations
- Scale: 50K+ spots, 1M+ users

---

## High-Level Architecture

### Architecture Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1762" width="900" role="img" aria-label="Parking System — System Architecture">
<rect x="0" y="0" width="960" height="1762" fill="#ffffff"/>
<title>Parking System — System Architecture</title>
<rect x="52" y="288" width="710" height="1374" rx="10" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6 4"/>
<text x="66" y="308" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="12" fill="#475569">Parking System</text>
<path d="M407 132 L407 156 L424 156 L424 298 L408 298 L408 322" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M408 384 L408 408 L424 408 L424 550 L407 550 L407 574" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M393 636 L393 731 L149 731 L149 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M407 636 L407 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M421 636 L421 731 L665 731 L665 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M149 888 L149 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M407 888 L407 912 L428 912 L428 1054 L412 1054 L412 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M665 888 L665 912 L686 912 L686 1054 L670 1054 L670 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M149 1140 L149 1235 L393 1235 L393 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M407 1140 L407 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M670 1140 L670 1235 L421 1235 L421 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M393 1392 L393 1487 L149 1487 L149 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M407 1392 L407 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<path d="M421 1392 L421 1487 L665 1487 L665 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
<rect x="333" y="70" width="148" height="62" rx="9" fill="#ecfdf5" stroke="#059669" stroke-width="1.6"/>
<text x="407" y="106" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#065f46">Mobile / Web</text>
<rect x="327" y="322" width="161" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="407.5" y="358" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">WAF / API Gateway</text>
<rect x="333" y="574" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="407" y="610" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Load Balancer</text>
<rect x="75" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="149" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Booking Svc</text>
<rect x="333" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="407" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Slot Manager</text>
<rect x="591" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="665" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Payment Svc</text>
<rect x="75" y="1582" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="149" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">IoT Workers</text>
<rect x="333" y="1582" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="407" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Analytics</text>
<rect x="591" y="1582" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="665" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Notifications</text>
<rect x="70" y="1078" width="158" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="149" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">PostgreSQL + Redis</text>
<rect x="338" y="1078" width="148" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="412" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">Redis GEO + IoT</text>
<rect x="596" y="1078" width="148" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="670" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">Stripe</text>
<rect x="333" y="1330" width="148" height="62" rx="9" fill="#fff7ed" stroke="#ea580c" stroke-width="1.6"/>
<text x="407" y="1366" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#9a3412">Kafka</text>
<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/system-design/parking-system.architecture.html](diagrams/system-design/parking-system.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


*Solid = data flow, dashed = control plane / monitoring.*

### Data Flow

1. User searches for nearby parking - Proximity Service returns slots
2. Slot Manager holds slot temporarily (Redis TTL = 10 min)
3. User confirms booking - Payment Service processes transaction
4. IoT sensors detect vehicle entry/exit - update slot status
5. Kafka events: slot_status, entry, exit - Analytics dashboard
6. Auto-release: TTL expires without payment, slot returns to pool
7. Notifications: booking confirmation, reminders, receipt

## Microservices
How the system is decomposed into independently deployed services:

| Service | Responsibility | Tech Stack | Database |
| --------- | --------------- | ------------ | ---------- |
| Reservation Service | Book/cancel/extend slots | Node.js, Express | PostgreSQL |
| Slot Management | Real-time slot map, availability | Go, Redis GEO | Redis + PostGIS |
| IoT Gateway | Sensor ingestion, MQTT broker | EMQX, Kafka Connect | TimescaleDB |
| Payment Service | Process payments, refunds | Node.js, Stripe SDK | PostgreSQL |
| Navigation Service | Route to spot, indoor navigation | Python, Google Maps API | Redis GEO |
| Geofence Service | Entry/exit detection, ANPR | Python, OpenCV | PostgreSQL + PostGIS |
| Dynamic Pricing | Surge pricing, demand forecasting | Python, scikit-learn | Redis + PostgreSQL |
| Notification Service | Push/SMS/email alerts | Node.js, FCM/SNS | Redis |
| Analytics Service | Occupancy prediction, reporting | Python, TimescaleDB | TimescaleDB |
| Admin Service | Lot management, pricing config | React, Node.js | PostgreSQL |

---

## Database Design

### PostgreSQL (Reservation + Lot Data)

```sql
CREATE TABLE parking_lots (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  location GEOGRAPHY(POINT, 4326),
  total_spots INT NOT NULL,
  hourly_rate DECIMAL(10,2),
  operating_hours JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE parking_spots (
  id BIGSERIAL PRIMARY KEY,
  lot_id BIGINT REFERENCES parking_lots(id),
  spot_number VARCHAR(10) NOT NULL,
  floor INT,
  zone CHAR(1),
  spot_type VARCHAR(20),
  status VARCHAR(20) DEFAULT 'available',
  sensor_id VARCHAR(50),
  location GEOGRAPHY(POINT, 4326),
  UNIQUE(lot_id, spot_number)
);
CREATE INDEX idx_spot_location ON parking_spots USING GIST(location);
CREATE INDEX idx_spot_status ON parking_spots(lot_id, status);

CREATE TABLE reservations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  spot_id BIGINT REFERENCES parking_spots(id),
  lot_id BIGINT REFERENCES parking_lots(id),
  status VARCHAR(20) DEFAULT 'active',
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  actual_exit_time TIMESTAMP,
  amount_due DECIMAL(10,2),
  payment_id BIGINT,
  plate_number VARCHAR(20),
  version INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_res_user ON reservations(user_id, status);
CREATE INDEX idx_res_spot ON reservations(spot_id, status);

CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT REFERENCES reservations(id),
  user_id BIGINT REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  idempotency_key VARCHAR(64) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Redis (Real-time Slot Map)

```
GEOADD parking:spots:lot:101 73.8567 19.0760 "spot-A12"
GEORADIUS parking:spots:lot:101 73.857 19.076 2 km WITHCOORD COUNT 10 ASC
HSET parking:slot:101:A12 status occupied timestamp 1693555200
SET pricing:lot:101:peak 1.5 EX 300
```

---

## Scaling Tiers

### 1K - 10K Users

- 1 API server + 1 PostgreSQL + 1 Redis
- Single MQTT broker for sensor data
- Estimated cost: ~$500/month

### 10K - 1M Users

- 5-10 API servers behind ALB
- PostgreSQL primary + 2 read replicas, partitioned by lot_id
- Redis Cluster (3 nodes) for slot map
- Kafka (3 brokers) for sensor events
- 5-10 IoT gateways per region
- Estimated cost: ~$15,000/month

### 1M - 10M+ Users

- 50+ API servers across regions
- PostgreSQL sharded by region
- Redis Cluster per region with GEO
- Kafka (12+ brokers) with partitioning by lot_id
- Edge computing for ANPR processing
- Multi-region IoT gateways with local MQTT brokers
- CDN for static assets + map tiles
- Estimated cost: ~$150,000/month

---

## Key Design Decisions
The choices that shape this architecture, and why each was made:

| Decision | Choice | Why |
| ---------- | -------- | ----- |
| Slot availability | Redis GEO | Sub-millisecond geospatial queries for nearest-spot search |
| Sensor protocol | MQTT over TCP | Lightweight pub/sub ideal for low-power IoT sensors |
| Reservation concurrency | Optimistic locking | Prevents double-booking without distributed locks |
| Payment calculation | Event-driven via Kafka | Decouples sensor detection from billing |
| Dynamic pricing | ML + Redis cache | Demand forecasting with fast cache lookup |
| Entry/exit detection | ANPR + sensor fusion | Camera for plate recognition, magnetic as backup |

---

## Failure Modes & Recovery
What can go wrong in production, and how the system detects and recovers:

| Failure | Impact | Recovery |
| --------- | -------- | ---------- |
| IoT sensor offline | Stale spot status | Fallback to last-known + admin alert |
| Kafka broker down | Delayed sensor events | Replication factor 3 + consumer retry |
| PostgreSQL down | Reservations fail | Auto-failover via Patroni |
| Redis cluster split | Slot map inconsistency | Sentinel auto-failover + rebuild from PG |
| ANPR misreads plate | Wrong vehicle entry/exit | Manual override + sensor cross-validation |
| Payment gateway timeout | Unclear reservation state | Idempotency key + retry + reconciliation |

---

## Cost Estimation (1M Users)
Rough monthly cost of running this design for one million users:

| Component | Specification | Monthly Cost |
| ----------- | -------------- | ------------- |
| API Servers | 10x c5.large | $1,200 |
| PostgreSQL | db.r5.xlarge + 2 replicas | $3,000 |
| Redis Cluster | 6x cache.r5.large | $3,600 |
| Kafka | 6x kafka.m5.large | $2,400 |
| TimescaleDB | db.t3.xlarge | $800 |
| IoT Gateways | 50x edge devices | $2,500 |
| CDN | 5TB/month transfer | $400 |
| ANPR Cameras | Hardware amortized | $5,000 |
| **Total** | | **~$18,900/month** |

---

## Trade-off Analysis
The alternatives considered, and which one won and why:

| Approach A | Approach B | Winner | Reason |
| ----------- | ----------- | -------- | -------- |
| Redis GEO for slot search | PostGIS queries | Redis GEO | 10x faster for real-time spatial queries |
| MQTT for sensors | HTTP polling | MQTT | 90% less bandwidth, push-based, IoT-optimized |
| Optimistic locking | Pessimistic locks | Optimistic | Higher throughput, no lock contention at scale |
| ANPR cameras | Bluetooth beacons | ANPR | No user hardware needed, works with any vehicle |
| Static pricing | ML-based surge pricing | ML-based | Better revenue optimization, adapts to demand |

---

## Key Metrics to Monitor
The metrics that signal system health, with alert thresholds:

| Metric | Target | Alert Threshold |
| -------- | -------- | ---------------- |
| Spot search latency (p99) | < 200ms | > 500ms |
| Reservation success rate | > 99.9% | < 99.5% |
| Sensor data freshness | < 5s | > 15s |
| IoT gateway uptime | > 99.9% | < 99% |
| Double-booking incidents | 0 | > 0 |
| Payment processing time | < 3s | > 10s |
| ANPR accuracy | > 98% | < 95% |
| Kafka consumer lag | < 1000 | > 10000 |
| Dynamic pricing accuracy | > 90% prediction | < 80% |
| Active reservations/sec | track | spike detection |

---

## Deep Dive Prompts

- How would you handle a parking lot with 5,000 spots during a concert event?
- What happens when the Kafka cluster goes down mid-entry?
- How do you sync sensor data across multiple IoT gateways?
- How would you design surge pricing for a stadium parking lot?

---

## Key Techniques & Patterns
The recurring techniques and patterns this design applies, mapped to where they are used:

| Technique | Description | Used In |
| ----------- | ------------- | ---------- |
| Geospatial Query (PostGIS) | Applied in this system | Architecture + LLD |
| Real-time Availability (Redis) | Applied in this system | Architecture + LLD |
| License Plate OCR | Applied in this system | Architecture + LLD |
| Payment Processing | Applied in this system | Architecture + LLD |
| Slot Reservation with TTL | Applied in this system | Architecture + LLD |
| Dynamic Pricing | Applied in this system | Architecture + LLD |

## Common Interview Follow-ups

**Q: How do you prevent double-booking?**
A: Optimistic locking with version column, retry on conflict

**Q: How do you handle sensor failures?**
A: Sensor fusion, heartbeat monitoring, fallback to last-known state

**Q: How does indoor navigation work?**
A: BLE beacons for floor positioning, Redis GEO outdoor, BLE triangulation indoor

---

## Low-Level Design (LLD)

### 1. Redis GEO Slot Search Algorithm

```text
class ParkingSlotSearcher {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async findNearestSlots(lotId, lat, lng, radiusKm = 2, count = 10) {
    const key = `parking:spots:lot:${lotId}`;

    const spots = await this.redis.georadius(
      key, lng, lat, radiusKm * 1000, 'm',
      'WITHCOORD', 'WITHDIST', 'ASC', 'COUNT', count
    );

    const available = [];
    for (const spot of spots) {
      const status = await this.redis.hget(
        `parking:slot:${lotId}:${spot.name}`, 'status'
      );
      if (status === 'available') {
        available.push({
          spotId: spot.name,
          distance: parseFloat(spot.dist),
          coordinates: [parseFloat(spot.x), parseFloat(spot.y)]
        });
      }
    }
    return available;
  }

  async updateSpotStatus(lotId, spotId, status) {
    const slotKey = `parking:slot:${lotId}:${spotId}`;
    await this.redis.hset(slotKey, 'status', status, 'timestamp', Date.now());

    if (status !== 'available') {
      await this.redis.zrem(`parking:spots:lot:${lotId}`, spotId);
    } else {
      const coords = await this.redis.hget(slotKey, 'coords');
      if (coords) {
        const [lng, lat] = JSON.parse(coords);
        await this.redis.geoadd(`parking:spots:lot:${lotId}`, lng, lat, spotId);
      }
    }
  }
}
```

### 2. Reservation State Machine

```text
const TRANSITIONS = {
  available:  { reserve: 'reserved' },
  reserved:   { occupy: 'occupied', cancel: 'available', expire: 'available' },
  occupied:   { exit: 'exiting', extend: 'occupied' },
  exiting:    { payment_complete: 'available' },
};

function transition(currentState, action) {
  const next = TRANSITIONS[currentState]?.[action];
  if (!next) throw new Error(`Invalid: ${currentState} --${action}--> ?`);
  return next;
}

let state = 'available';
state = transition(state, 'reserve');          // reserved
state = transition(state, 'occupy');           // occupied
state = transition(state, 'exit');             // exiting
state = transition(state, 'payment_complete'); // available
```

### 3. Dynamic Pricing Algorithm

```text
function calculatePrice(baseRate, occupancy, hour, isWeekend, events) {
  let multiplier = 1.0;

  if (hour >= 8 && hour <= 18) multiplier *= 1.5;
  else if (hour >= 18 && hour <= 22) multiplier *= 1.2;
  else multiplier *= 0.8;

  if (occupancy > 0.9) multiplier *= 2.0;
  else if (occupancy > 0.7) multiplier *= 1.5;
  else if (occupancy > 0.5) multiplier *= 1.2;

  if (isWeekend) multiplier *= 1.3;
  if (events > 0) multiplier *= (1 + events * 0.2);

  return Math.round(baseRate * multiplier * 100) / 100;
}
```

### 4. Anti-Passback State Machine (Entry/Exit)

```text
class AntiPassback {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async checkEntry(plateNumber, lotId) {
    const last = await this.redis.hgetall(`vehicle:${plateNumber}:last`);

    if (last.lotId === lotId && last.action === 'enter') {
      return { allowed: false, reason: 'Already inside this lot' };
    }

    await this.redis.hset(`vehicle:${plateNumber}:last`,
      'lotId', lotId,
      'action', 'enter',
      'timestamp', Date.now()
    );
    return { allowed: true };
  }

  async checkExit(plateNumber, lotId) {
    const last = await this.redis.hgetall(`vehicle:${plateNumber}:last`);

    if (last.lotId !== lotId || last.action !== 'enter') {
      return { allowed: false, reason: 'Not inside this lot' };
    }

    await this.redis.hset(`vehicle:${plateNumber}:last`,
      'lotId', lotId,
      'action', 'exit',
      'timestamp', Date.now()
    );
    return { allowed: true };
  }
}
```

### 5. IoT Sensor Ingestion Pipeline

```text
class SensorIngestionPipeline {
  constructor(mqttClient, kafkaProducer) {
    this.mqtt = mqttClient;
    this.kafka = kafkaProducer;
  }

  start() {
    this.mqtt.subscribe('sensors/+/+/status', { qos: 1 });

    this.mqtt.on('message', async (topic, payload) => {
      const parts = topic.split('/');
      const [, lotId, spotId] = parts;
      const data = JSON.parse(payload.toString());

      await this.kafka.send({
        topic: 'sensor.occupied',
        messages: [{
          key: lotId,
          value: JSON.stringify({
            lotId, spotId,
            occupied: data.occupied,
            timestamp: Date.now(),
            sensorId: data.sensorId
          })
        }]
      });
    });
  }
}

const spot = new SpotService(); console.log("Spot service ready");
```
