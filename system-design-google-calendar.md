<div align="center">

# System Design: Google Calendar (Scheduling & Free-Busy)

</div>

> [!TIP]
> **TL;DR** — A calendar platform: events with recurrence and time zones, cross-user free/busy queries, invites with RSVP state machines, and conflict resolution — deceptively hard because the data model (recurrence × timezones × invites) explodes quietly.

## Overview

Calendar looks like CRUD and isn't. The hard parts: recurring events (RRULE expansion over infinite horizons), time zones with DST shifting per-attendee, free/busy queries across organizations without leaking event details, and invite/RSVP state across guests' own calendars. This is a data-modeling interview more than a scaling one.

### Key Numbers

| Metric | Value |
| :--- | :--- |
| **Events/day** | 500M+ (mostly recurring instances) |
| **Free/busy queries** | 50K / second (meeting scheduling) |
| **Attendees/event** | 2–500 (company all-hands larger) |
| **Recurring events** | ~40% of all events |

---

## Requirements

### Functional Requirements

- Create/edit/delete events with attendees, location, conferencing, attachments
- Recurrence: daily/weekly/monthly patterns with exceptions ("skip Dec 25")
- Invitations with RSVP (yes/no/maybe) synced to each guest's calendar
- Free/busy lookup across domains (without revealing event content)
- Reminders (popup/email) and notifications on change
- Multi-calendar per user with per-calendar sharing granularity

### Non-Functional Requirements

| Attribute | Target |
| :--- | :--- |
| **Free/busy latency** | < 300ms P99 |
| **Consistency** | invitation state converges across guests |
| **Timezone correctness** | DST-safe per-attendee rendering |
| **Availability** | 99.99% (business runs on it) |

---

## High-Level Architecture

### Architecture Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1762" width="900" role="img" aria-label="Google Calendar — System Architecture">
<rect x="0.5" y="0.5" width="959" height="1761" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
<rect x="52" y="288" width="713" height="1374" rx="14" fill="none" stroke="#cbd5e1" stroke-width="1.3" stroke-dasharray="7 5"/>
<rect x="64" y="296" width="128" height="20" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
<text x="128" y="310" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" fill="#475569">Google Calendar</text>
<path d="M409 132 L409 156 L425 156 L425 298 L409 298 L409 322" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-google-calendar)"/>
<path d="M409 384 L409 574" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-google-calendar)"/>
<path d="M389 636 L389 731 L151 731 L151 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-google-calendar)"/>
<path d="M409 636 L409 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-google-calendar)"/>
<path d="M429 636 L429 731 L667 731 L667 826" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-google-calendar)"/>
<path d="M151 888 L151 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-google-calendar)"/>
<path d="M409 888 L409 912 L430 912 L430 1054 L414 1054 L414 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-google-calendar)"/>
<path d="M667 888 L667 912 L688 912 L688 1054 L672 1054 L672 1078" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-google-calendar)"/>
<path d="M151 1140 L151 1235 L389 1235 L389 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-google-calendar)"/>
<path d="M409 1140 L409 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-google-calendar)"/>
<path d="M672 1140 L672 1235 L429 1235 L429 1330" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-google-calendar)"/>
<path d="M389 1392 L389 1487 L146 1487 L146 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-google-calendar)"/>
<path d="M409 1392 L409 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-google-calendar)"/>
<path d="M429 1392 L429 1487 L668 1487 L668 1582" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-google-calendar)"/>
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
<text x="151" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Calendar API</text>
<rect x="335" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="335" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="338" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="409" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Invite Svc</text>
<rect x="593" y="829" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="593" y="826" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="596" y="829" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="667" y="862" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Free/Busy Svc</text>
<rect x="72" y="1081" width="158" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="72" y="1078" width="158" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="75" y="1081" width="152" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="151" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">PostgreSQL</text>
<rect x="340" y="1081" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="340" y="1078" width="148" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="343" y="1081" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="414" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Redis Busy Index</text>
<rect x="598" y="1081" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="598" y="1078" width="148" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="601" y="1081" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="672" y="1114" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Timing Wheels</text>
<rect x="335" y="1333" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="335" y="1330" width="148" height="62" rx="12" fill="#fff7ed" stroke="#f97316" stroke-width="1.4"/>
<rect x="338" y="1333" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="409" y="1366" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#7c2d12">Kafka</text>
<rect x="70" y="1585" width="151" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="70" y="1582" width="151" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="73" y="1585" width="145" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="145.5" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Invite Workers</text>
<rect x="331" y="1585" width="148" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="331" y="1582" width="148" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="334" y="1585" width="142" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="405" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Reminder Timers</text>
<rect x="589" y="1585" width="158" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="589" y="1582" width="158" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="592" y="1585" width="152" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="668" y="1618" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Index Rebuilders</text>
<defs><marker id="arr-google-calendar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker><marker id="arrEm-google-calendar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#10b981"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/system-design/google-calendar.architecture.html](diagrams/system-design/google-calendar.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


**Interactive diagram:** [diagrams/system-design/google-calendar.architecture.html](diagrams/system-design/google-calendar.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.

### Data Flow

1. Event write → Calendar API → PostgreSQL (event + recurrence rule) → outbox → Kafka
2. Invite service fans invites to guest calendars (each guest's calendar holds an "attendee copy" row pointing at the master)
3. Free/busy service maintains **per-user busy-interval index** (interval tree per user, updated from change stream)
4. Reminders are future-dated jobs in the delayed-job scheduler (timing wheels)
5. Timezone rendering: store UTC + IANA tz + recurrence in RRULE; render per-viewer
6. RSVP changes propagate master → attendee copies via events (conflict rules: organizer owns time, guest owns RSVP)

## Microservices

| Service | Tech Stack | Database | Pattern |
| --------- | ------------ | ---------- | ---------- |
| Calendar API | Java | PostgreSQL | CRUD + outbox |
| Invite Service | Go | PostgreSQL + Kafka | Saga (RSVP propagation) |
| Free/Busy Service | Go | In-memory interval trees + Redis | Index + serve |
| Reminder Service | Go | Timing wheel (Redis) | Scheduled jobs |
| Notification Service | Go | Kafka | Event-driven |

---

## Database Design

### PostgreSQL

```sql
CREATE TABLE calendars (
  id UUID PRIMARY KEY, owner_id BIGINT, timezone TEXT, sharing_scope TEXT
);
CREATE TABLE events (
  id UUID PRIMARY KEY, calendar_id UUID, creator_id BIGINT,
  title TEXT, location TEXT,
  start_utc TIMESTAMPTZ NOT NULL, end_utc TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',            -- IANA, for rendering
  recurrence TEXT,                         -- RRULE string, NULL if one-off
  recurrence_timezone TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE event_exceptions (           -- "skip Dec 25" overrides
  event_id UUID, original_date DATE, override JSONB,  -- NULL = cancelled instance
  PRIMARY KEY (event_id, original_date)
);
CREATE TABLE attendees (
  event_id UUID, user_id BIGINT,
  status TEXT CHECK (status IN ('invited','yes','no','maybe')),
  response_at TIMESTAMPTZ, PRIMARY KEY (event_id, user_id)
);
CREATE TABLE attendee_copies (            -- event on a guest's own calendar
  user_id BIGINT, master_event_id UUID, master_calendar_id UUID,
  status TEXT, PRIMARY KEY (user_id, master_event_id)
);
CREATE INDEX idx_busy ON events (calendar_id, start_utc, end_utc)
  WHERE recurrence IS NULL;               -- busy index base for one-offs
```

---

## Scaling Tiers

| Tier | Users | Infrastructure | Monthly Cost |
| ------ | ------- | -------------- | ------------- |
| 1K-10K | 10K | 2 app + PostgreSQL primary/replica | $250 |
| 10K-1M | 1M | 8 app + PostgreSQL shards + Redis + Kafka | $5,000 |
| 1M-10M+ | 10M+ | 30 app + 16 PG shards + Redis + Kafka + ES (search) | $45,000 |

---

## Key Techniques & Patterns

- **RRULE expansion on demand**: never materialize infinite recurrences; expand a window (e.g., 90 days) and cache
- **Interval trees for free/busy**: per-user balanced interval index, O(log n + k) overlap queries
- **Saga Pattern**: invite propagation master→copies, RSVP copy→master, with defined conflict rules
- **Outbox Pattern**: event changes published reliably to Kafka
- **Delayed Job Scheduler**: reminders as future jobs (reuse of the timing-wheel doc)
- **Idempotency**: RSVP updates keyed by (event, user, sequence) to survive retries

---

## Key Design Decisions

1. **Store RRULE + UTC + IANA tz, not expanded instances**: exceptions and DST handled at render; storage stays small
2. **Attendee copies as first-class rows**: each guest sees/edits their copy; organizer master stays authoritative for time
3. **Free/busy as derived index**: rebuilt from the change stream; serves without touching event details (privacy boundary)
4. **PostgreSQL over Cassandra**: events are strongly consistent, relational (calendars→events→attendees), and modest in size per user
5. **Busy intervals, not events, are the query unit**: cross-org scheduling only ever sees opaque intervals

---

## Failure Modes & Recovery

| Failure | Impact | Mitigation |
| --------- | -------- | ----------- |
| Free/busy index stale | Double-booked meetings | Rebuild from events; staleness alert; interval version checks |
| RRULE expansion bug | Wrong instance dates | Golden-file tests across DST transitions |
| Invite propagation loop | Ping-pong RSVP updates | Directed propagation only (master→copy, copy→master), sequence numbers |
| Clock/timezone drift | Shifted meetings | Store IANA tz per event; render-time conversion only |
| Reminder scheduler down | Missed reminders | Persisted timing wheels; catch-up scan on recovery |

---

## Cost Estimation (1M Users)

| Component | Configuration | Monthly Cost |
| ----------- | -------------- | ------------- |
| App (8) | c7g.xlarge | $1,100 |
| PostgreSQL (sharded ×4, HA) | db.r7g.2xlarge | $2,800 |
| Redis | cache.r7g.large ×3 | $700 |
| Kafka (3) | m7g.large | $900 |
| Elasticsearch (search) | r7g.large ×3 | $800 |
| **Total** | | **~$6,300** |

---

## Trade-off Analysis

| Decision | Option A | Option B | Choice | Why |
| ---------- | ---------- | ---------- | -------- | ----- |
| Recurrence storage | Pre-expand instances | RRULE + exceptions | RRULE | Infinite horizon, tiny storage |
| Free/busy | Query events directly | Derived interval index | Index | Fast, privacy-preserving |
| Invites | Shared event row | Per-guest copies | Copies | Guest autonomy; matches real semantics |
| Primary store | Cassandra | PostgreSQL | PostgreSQL | ACID invites, relational model |
| Reminders | Cron scan | Timing wheel | Timing wheel | Precise, no table scans |

---

## Key Metrics to Monitor

1. Free/busy latency P99 and index staleness
2. Invite propagation lag & failure rate
3. RRULE expansion cache hit ratio
4. Reminder fire punctuality (fire − target time)
5. RSVP convergence time across guests
6. Event CRUD error rates by calendar shard

---

## Deep Dive Prompts

1. Design "find a slot for 8 people across 3 time zones" (constraint intersection at scale).
2. How do you handle a meeting whose organizer is deleted as a user?
3. Design delegation — an assistant managing an exec's calendar.
4. How would you support calendar-level E2E encryption while keeping free/busy working?
5. Design natural-language event creation ("lunch with Ana next Thursday").

---

## Common Interview Follow-ups

1. Why is storing per-instance expanded events a scaling trap?
2. How do you keep 500-attendee meeting RSVPs from hot-looping the master event?
3. How do you merge a user's external iCal feed without melting the busy index?
4. What breaks when a country abolishes DST overnight?
5. How do you test recurrence code? (property tests across DST boundaries)

---

## Low-Level Design (LLD) - Algorithms & Data Structures

### RRULE Expansion + Free/Busy Intersection

```text
// Weekly RRULE with exceptions, expanded lazily over a window.
function expandWeekly(rrule, windowStartMs, windowEndMs) {
  const out = [];
  const { startMs, intervalWeeks, byDay, count, untilMs, except = [] } = rrule;
  let week = new Date(startMs);
  week.setUTCHours(0, 0, 0, 0);
  const startDay = week.getTime();
  let made = 0;
  for (let w = 0; made < count && startMs + w * intervalWeeks * 6048e5 <= (untilMs ?? windowEndMs); w++) {
    for (const day of byDay) {                    // e.g. [1,3] = Mon,Wed (0=Sun)
      const t = startDay + w * intervalWeeks * 6048e5 + day * 864e5 + (startMs % 864e5);
      if (t < windowStartMs || t > windowEndMs) continue;
      if (except.includes(t)) continue;           // cancelled instance
      out.push(t); made++;
      if (made >= count) break;
    }
  }
  return out;
}

// Interval tree node for free/busy: check if [s,e) is free
function isFree(intervals, s, e) {
  return !intervals.some(([a, b]) => s < b && a < e);
}

const r = { startMs: Date.UTC(2026, 8, 21, 10), intervalWeeks: 1, byDay: [1, 3], count: 6, except: [Date.UTC(2026, 8, 23, 10)] };
console.log(expandWeekly(r, Date.UTC(2026, 8, 1), Date.UTC(2026, 9, 31)));
console.log(isFree([[Date.UTC(2026, 8, 21, 9), Date.UTC(2026, 8, 21, 11)]], Date.UTC(2026, 8, 21, 11), Date.UTC(2026, 8, 21, 12))); // true
```

### Recurrence Expansion (RFC 5545 without the infinite loop)

A yearly rule ("Jan 1, forever") can't be stored as rows. Store the **rule**, expand a bounded window on read, and cache the expansion.

```js
function expandRRULE(dueTs, freq, interval, count, untilTs, windowStartTs, windowEndTs) {
  // bounded expansion: only materialize occurrences inside [windowStart, windowEnd]
  const out = [];
  const step = { daily: 864e5, weekly: 7 * 864e5, monthly: 30.44 * 864e5, yearly: 365.25 * 864e5 }[freq] * interval;
  let t = dueTs;
  if (count) { // bounded series: walk occurrences directly
    for (let i = 0; i < count && t <= untilTs; i++, t += step) if (t >= windowStartTs && t <= windowEndTs) out.push(t);
    return out;
  }
  // infinite series: jump straight into the window (no walking from 1970)
  if (t < windowStartTs) t = windowStartTs + ((t - windowStartTs) % step + step) % step;
  while (t <= windowEndTs) { out.push(t); t += step; }
  return out;   // caller writes back the expanded rows with a watermark = windowEnd
}
console.log(expandRRULE(Date.UTC(2026, 0, 1), 'monthly', 1, null, null,
                        Date.UTC(2026, 8, 1), Date.UTC(2026, 8, 30)).length); // ~1 (Sept 2026)
```

Production notes: real systems expand with a **materialized-occurrences cache** (expand 90 days ahead on write, background job extends the watermark before it lapses — same shape as the feed-materializer in §42); DST is handled by storing *local time + IANA zone* and re-localizing each occurrence (never store epoch-shifted recurring events); exceptions (single-instance edits/deletes) are stored as `EXDATE`/override rows keyed `(series_id, original_time)` and filtered at expansion.
