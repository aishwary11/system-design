<div align="center">

# System Design: Airbnb (Property Rental Marketplace)

</div>

> [!TIP]
> **TL;DR** — Two-sided marketplace connecting hosts and guests with search, booking, payments, reviews, and trust/safety systems.

## Overview

Two-sided marketplace connecting hosts and guests with search, booking, payments, reviews, and trust/safety systems.

### Key Numbers

| Metric | Value |
| :--- | :--- |
| **users, 7M+ listings, 190+ countries** | 150M+ |
| **guest arrivals, Sub-500ms search** | 500M+ |

---

## Requirements

### Functional Requirements

- Search properties by location, dates, price, amenities
- Book property with calendar availability check
- Host listing management with pricing tools
- Two-way review system (guest + host)
- Secure payment with escrow hold
- Messaging between host and guest

### Non-Functional Requirements

| Attribute | Target |
| :--- | :--- |
| **Latency** | Search < 500ms, Booking < 2s |
| **Availability** | 99.99% |
| **Consistency** | Strong for bookings (no double-book) |
| **Scale** | 150M+ users, 7M+ listings |

---

## High-Level Architecture

### Architecture Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1762" width="900" role="img" aria-label="Airbnb — System Architecture">
<rect x="0.5" y="0.5" width="959" height="1761" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
<rect x="52" y="288" width="742" height="1374" rx="14" fill="none" stroke="#cbd5e1" stroke-width="1.3" stroke-dasharray="7 5"/>
<rect x="64" y="296" width="63.2" height="20" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
<text x="95.6" y="310" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" fill="#475569">Airbnb</text>
<path d="M423 132 L423 156 L440 156 L440 298 L424 298 L424 322" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-airbnb)"/>
<path d="M424 384 L424 574" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-airbnb)"/>
<path d="M404 636 L404 731 L165 731 L165 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-airbnb)"/>
<path d="M424 636 L424 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-airbnb)"/>
<path d="M444 636 L444 731 L681 731 L681 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-airbnb)"/>
<path d="M165 888 L165 912 L181 912 L181 1054 L160 1054 L160 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-airbnb)"/>
<path d="M423 888 L423 983 L439 983 L439 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-airbnb)"/>
<path d="M681 888 L681 983 L702 983 L702 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-airbnb)"/>
<path d="M160 1140 L160 1235 L403 1235 L403 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-airbnb)"/>
<path d="M439 1140 L439 1235 L423 1235 L423 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-airbnb)"/>
<path d="M702 1140 L702 1235 L443 1235 L443 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-airbnb)"/>
<path d="M403 1392 L403 1487 L165 1487 L165 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-airbnb)"/>
<path d="M423 1392 L423 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-airbnb)"/>
<path d="M443 1392 L443 1487 L681 1487 L681 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-airbnb)"/>
<rect x="337" y="73" width="172" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="337" y="70" width="172" height="62" rx="12" fill="#ecfdf5" stroke="#10b981" stroke-width="1.4"/>
<rect x="340" y="73" width="166" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="423" y="106" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#064e3b">Guest App / Host App</text>
<rect x="343" y="325" width="161" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="343" y="322" width="161" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="346" y="325" width="155" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="423.5" y="358" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">WAF / API Gateway</text>
<rect x="341" y="577" width="165" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="341" y="574" width="165" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="344" y="577" width="159" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="423.5" y="610" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Load Balancer (ALB)</text>
<rect x="91" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="91" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="94" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="165" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Search Svc</text>
<rect x="349" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="349" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="352" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="423" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Booking Svc</text>
<rect x="607" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="607" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="610" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="681" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Payment Svc</text>
<rect x="91" y="1585" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="91" y="1582" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="94" y="1585" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="165" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Pricing Workers</text>
<rect x="349" y="1585" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="349" y="1582" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="352" y="1585" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="423" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Analytics</text>
<rect x="607" y="1585" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="607" y="1582" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="610" y="1585" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="681" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Notifications</text>
<rect x="70" y="1081" width="180" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="70" y="1078" width="180" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="73" y="1081" width="174" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="160" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Elasticsearch + Redis</text>
<rect x="360" y="1081" width="158" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="360" y="1078" width="158" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="363" y="1081" width="152" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="439" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">PostgreSQL + Redis</text>
<rect x="628" y="1081" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="628" y="1078" width="148" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="631" y="1081" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="702" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Stripe + Ledger</text>
<rect x="349" y="1333" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="349" y="1330" width="148" height="62" rx="12" fill="#fff7ed" stroke="#f97316" stroke-width="1.4"/>
<rect x="352" y="1333" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="423" y="1366" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#7c2d12">Kafka</text>
<defs><marker id="arr-airbnb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker><marker id="arrEm-airbnb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#10b981"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/system-design/airbnb.architecture.html](diagrams/system-design/airbnb.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


*Solid = data flow, dashed = control plane / monitoring.*

### Data Flow

1. Guest searches - Search Service filters by location, dates, price
2. Pricing ML: dynamic pricing based on demand, season, events
3. Guest requests booking - Booking Service holds (48h TTL)
4. Host confirms - Payment Service charges (split payment)
5. Review system: bilateral reviews after checkout
6. Kafka events: booking, cancellation, review - Analytics
7. Notifications: booking request, confirmation, check-in reminder

## Microservices
How the system is decomposed into independently deployed services:

| Service | Responsibility | Tech Stack | Pattern |
| --------- | --------------- | ------------ | --------- |
| Search Service | Property search with filters | Elasticsearch, Redis | Geo Search |
| Booking Service | Reservation management | Java, PostgreSQL | Saga Pattern |
| Payment Service | Multi-currency payments, escrow | Java, PostgreSQL | Double-entry |
| Review Service | Two-way reviews, trust score | Node.js, PostgreSQL | Event Sourcing |
| Pricing Service | Dynamic pricing, Smart Pricing | Python, ML | ML Inference |
| Messaging Service | Host-guest communication | Node.js, Cassandra | WebSocket |

---

## Database Design
The data stores, schemas, and access patterns behind each service:

```sql
CREATE TABLE listings (
    listing_id UUID PRIMARY KEY, host_id UUID,
    title VARCHAR(255), price_per_night DECIMAL(10,2),
    lat DOUBLE PRECISION, lng DOUBLE PRECISION,
    amenities JSONB, created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bookings (
    booking_id UUID PRIMARY KEY, listing_id UUID,
    guest_id UUID, check_in DATE, check_out DATE,
    total_price DECIMAL(10,2), status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Scaling Tiers

### 1K - 10K Users ($500/mo)

- Single PostgreSQL, 2 Redis, S3 for images

### 10K - 1M Users ($20K/mo)

- PostgreSQL read replicas, Redis cluster, Elasticsearch

### 1M - 10M+ Users ($800K/mo)

- Cassandra for messaging, multi-region, ML pricing

---

## Key Techniques & Patterns
The recurring techniques and patterns this design applies, mapped to where they are used:

| Technique | Description | Used In |
| ----------- | ------------- | ---------- |
| Geospatial Indexing | PostGIS + Elasticsearch geo queries | Search Service |
| Saga Pattern | Distributed booking transactions | Booking Service |
| Redis Locking | Prevent double-bookings with atomic locks | Booking Service |
| Escrow Payment | Hold funds until check-in confirmed | Payment Service |
| ML Dynamic Pricing | Adjust prices based on demand/season | Pricing Service |
| Elasticsearch | Full-text search with geo + filters | Search Service |
| CDN Image Caching | Property photos served from edge | All services |
| SOLID Principles | Single Responsibility per microservice | All services |

---

## Key Design Decisions
The choices that shape this architecture, and why each was made:

| Decision | Choice | Why |
| ---------- | -------- | ----- |
| Booking Lock | Redis atomic SET NX | Prevent double-bookings |
| Payment Flow | Escrow with hold | Protect both guest and host |
| Search Engine | Elasticsearch with geo | Full-text + location queries |
| Pricing | ML dynamic pricing | Maximize host revenue |

---

## Failure Modes & Recovery
What can go wrong in production, and how the system detects and recovers:

| Failure | Impact | Recovery |
| --------- | -------- | ---------- |
| Booking lock failure | Possible double-book | Database constraint as fallback |
| Payment gateway down | Cannot process payments | Queue payments, retry later |
| Search index corrupt | No search results | Rebuild from PostgreSQL |

---

## Cost Estimation (1M Users)
Rough monthly cost of running this design for one million users:

| Component | Monthly Cost |
| ----------- | ------------- |
| Compute (6 microservices) | $8,000 |
| PostgreSQL cluster | $3,000 |
| Elasticsearch cluster | $2,500 |
| Redis cluster (50GB) | $2,500 |
| S3 (images, 10TB) | $230 |
| ML inference (pricing) | $2,000 |
| Monitoring | $1,000 |
| Total | ~$19,230 |

---

## Trade-off Analysis
The alternatives considered, and which one won and why:

| Trade-off | Option A | Option B | Winner | Why |
| ----------- | ---------- | ---------- | -------- | ----- |
| Booking Lock | Pessimistic (DB) | Optimistic (Redis) | Redis | Faster |
| Payment | Direct charge | Escrow | Escrow | Protects both parties |
| Pricing | Fixed | Dynamic ML | Dynamic | Maximizes revenue |
| Search | SQL LIKE | Elasticsearch | Elasticsearch | Full-text + geo |

---

## Key Metrics to Monitor
The metrics that signal system health, with alert thresholds:

| Metric | Target | Alert Threshold |
| -------- | -------- | ----------------- |
| Search Latency P99 | < 500ms | > 1s |
| Booking Success Rate | > 99% | < 98% |
| Payment Success Rate | > 99.9% | < 99% |
| Double-Book Rate | 0% | > 0% |

---

## Deep Dive Prompts

1. **How do you prevent double-bookings during high concurrency?**
2. **Design the escrow payment flow for multi-day stays.**
3. **How does the ML dynamic pricing algorithm work?**
4. **Explain the two-way review system and trust scoring.**
5. **How would you implement the calendar availability system?**
6. **Design the search ranking algorithm (relevance + price + reviews).**

---

## Common Interview Follow-ups

**Q: How do you prevent double-bookings?**
A: Use Redis atomic SET NX to acquire a lock on listing+dates before booking. If lock fails, dates are already booked. Database UNIQUE constraint as final guard.

**Q: How does escrow payment work?**
A: Guest pays at booking time. Funds held in escrow. On check-in, funds released to host minus commission. On cancellation, refund policy determines payout.

---

## Low-Level Design (LLD)

### 1. Booking Lock with Redis

```text
class BookingLock {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async tryLock(listingId, checkIn, checkOut, userId, ttl = 30) {
    const lockKey = `lock:${listingId}:${checkIn}:${checkOut}`;
    const acquired = await this.redis.set(lockKey, userId, {
      NX: true, EX: ttl
    });
    return acquired === "OK";
  }

  async releaseLock(listingId, checkIn, checkOut) {
    const lockKey = `lock:${listingId}:${checkIn}:${checkOut}`;
    await this.redis.del(lockKey);
  }
}
```

### 2. Calendar Availability Checker

```text
class CalendarChecker {
  constructor(db) {
    this.db = db;
  }

  async isAvailable(listingId, checkIn, checkOut) {
    const result = await this.db.query(
      "SELECT COUNT(*) as c FROM bookings WHERE listing_id = ? AND status IN (confirmed, pending) AND check_in < ? AND check_out > ?",
      [listingId, checkOut, checkIn]
    );
    return result.rows[0].c === 0;
  }
}

const search = new SearchService(); console.log("Search service ready");
```
