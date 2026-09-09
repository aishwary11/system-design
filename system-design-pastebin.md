# System Design: Pastebin (Text Sharing Service)

## Overview

Text sharing service allowing users to paste code/text snippets and share via unique URLs.
Handles 500M+ monthly views, 10M+ pastes/day, write-heavy workload.

### Key Numbers

- 10M+ pastes/day, 500M+ page views/month
- Write:Read ratio = 1:10
- Average paste size: 10KB, max 10MB

---

## Requirements

### Functional Requirements

- Create paste with title, content, expiry, visibility
- Retrieve paste by short URL
- Set expiration (10 min to forever)
- Public or private (unlisted) pastes
- Syntax highlighting for code
- Raw view and download

### Non-Functional Requirements

- Latency: < 100ms for paste retrieval
- Availability: 99.99%
- Durability: Never lose a paste
- Scale: 10M pastes/day, 100M reads/day

---

## High-Level Architecture

### Architecture Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1762" width="900" role="img" aria-label="Pastebin — System Architecture">
<rect x="0" y="0" width="960" height="1762" fill="#ffffff"/>
<title>Pastebin — System Architecture</title>
<rect x="52" y="288" width="713" height="1374" rx="10" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6 4"/>
<text x="66" y="308" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="12" fill="#475569">Pastebin</text>
<path d="M409 132 L409 156 L425 156 L425 298 L409 298 L409 322" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\pastebin)"/>
<path d="M409 384 L409 574" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\pastebin)"/>
<path d="M395 636 L395 731 L151 731 L151 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\pastebin)"/>
<path d="M409 636 L409 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\pastebin)"/>
<path d="M423 636 L423 731 L667 731 L667 826" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\pastebin)"/>
<path d="M151 888 L151 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\pastebin)"/>
<path d="M409 888 L409 912 L430 912 L430 1054 L414 1054 L414 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\pastebin)"/>
<path d="M667 888 L667 912 L688 912 L688 1054 L672 1054 L672 1078" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\pastebin)"/>
<path d="M151 1140 L151 1235 L395 1235 L395 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\pastebin)"/>
<path d="M409 1140 L409 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\pastebin)"/>
<path d="M672 1140 L672 1235 L423 1235 L423 1330" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\pastebin)"/>
<path d="M395 1392 L395 1487 L146 1487 L146 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\pastebin)"/>
<path d="M409 1392 L409 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\pastebin)"/>
<path d="M423 1392 L423 1487 L668 1487 L668 1582" fill="none" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr-D:\Aish\Coding\System-Design\diagrams\json\pastebin)"/>
<rect x="335" y="70" width="148" height="62" rx="9" fill="#ecfdf5" stroke="#059669" stroke-width="1.6"/>
<text x="409" y="106" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#065f46">Web / Mobile</text>
<rect x="328" y="322" width="161" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="408.5" y="358" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">WAF / API Gateway</text>
<rect x="326" y="574" width="165" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="408.5" y="610" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Load Balancer (ALB)</text>
<rect x="77" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="151" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Paste Svc</text>
<rect x="335" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="409" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">URL Svc</text>
<rect x="593" y="826" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="667" y="862" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Analytics Svc</text>
<rect x="70" y="1582" width="151" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="145.5" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Analytics Workers</text>
<rect x="331" y="1582" width="148" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="405" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Cache Warmer</text>
<rect x="589" y="1582" width="158" height="62" rx="9" fill="#eef2ff" stroke="#6366f1" stroke-width="1.6"/>
<text x="668" y="1618" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#3730a3">Expiration Workers</text>
<rect x="72" y="1078" width="158" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="151" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">PostgreSQL + Redis</text>
<rect x="340" y="1078" width="148" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="414" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">Base62 Generator</text>
<rect x="598" y="1078" width="148" height="62" rx="9" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.6"/>
<text x="672" y="1114" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#5b21b6">ClickHouse</text>
<rect x="335" y="1330" width="148" height="62" rx="9" fill="#fff7ed" stroke="#ea580c" stroke-width="1.6"/>
<text x="409" y="1366" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13" font-weight="bold" fill="#9a3412">Kafka</text>
<defs><marker id="arr-D:\Aish\Coding\System-Design\diagrams\json\pastebin" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/system-design/pastebin.architecture.html](diagrams/system-design/pastebin.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.


*Solid = data flow, dashed = control plane / monitoring.*

### Data Flow

1. User creates paste - Paste Service generates unique short URL
2. URL from pre-generated Base62 pool (Distributed ID Generator)
3. Paste content stored in S3, metadata in PostgreSQL + Redis
4. User visits short URL - URL Service redirects (301/302)
5. Cache hit: sub-ms redirect, miss: PostgreSQL fallback
6. Expiration Worker deletes pastes past their TTL
7. Analytics: views, referrers, language distribution

## Microservices
How the system is decomposed into independently deployed services:

| Service | Tech Stack | Database | Pattern |
| --------- | ------------ | ---------- | ---------- |
| Paste Service | Node.js + Express | DynamoDB | CRUD |
| URL Service | Go | Redis Counter | Base62 |
| Storage Service | Node.js | S3 + DynamoDB | Content Store |
| Expiration Service | Go | Redis TTL | Scheduled Cleanup |
| Analytics Service | Python | ClickStream | Event Tracking |

---

## Database Design

### DynamoDB

```
Table: pastes
  PK: paste_id (String) - 7-char Base62
  SK: user_id (String)
  Attributes: title, content_url (S3 key), language,
              visibility, created_at, expires_at

Table: users
  PK: user_id (String)
  Attributes: email, name, api_key, created_at
```

### Redis

```bash
paste:{paste_id}     -> Hash (cached paste metadata)
counter:{date}       -> Atomic counter for ID generation
rate_limit:{user_id} -> Hash (sliding window)
```

---

## Scaling Tiers
How the architecture grows from MVP to global scale:

| Tier | Users | Infrastructure | Monthly Cost |
| ------ | ------- | --------------- | ------------- |
| 1K-10K | 10K | 2 Node.js + DynamoDB + S3 | $200 |
| 10K-1M | 1M | 6 app + DynamoDB + S3 + Redis + CDN | $5,000 |
| 1M-10M+ | 10M+ | 20+ app + DynamoDB On-Demand + S3 + ES | $50,000 |

---

## Key Techniques & Patterns

- **Base62 Encoding**: 7-char short URLs (62^7 = 3.5 trillion unique URLs)
- **CDN Caching**: CloudFront caches public pastes at edge
- **Redis Caching**: Hot pastes cached, LRU eviction
- **SOLID Principles**: Single responsibility per microservice
- **Consistent Hashing**: Distribute paste storage across nodes
- **DynamoDB Auto-scaling**: On-demand capacity for write spikes
- **S3 Lifecycle**: Move old pastes to IA/Glacier for cost savings
- **Read-Heavy Optimization**: CDN + Redis cache for 99% read hits

---

## Key Design Decisions

1. **Base62 Short URLs**: 7 chars = 3.5T unique URLs, collision-resistant
2. **DynamoDB over RDS**: Serverless, auto-scaling, no DB management
3. **S3 for Content**: Cheap, durable, unlimited scale for paste text
4. **CDN for Reads**: 99% read traffic served from edge, <50ms
5. **Redis TTL for Expiry**: Native TTL support, no polling needed

---

## Failure Modes & Recovery
What can go wrong in production, and how the system detects and recovers:

| Failure | Impact | Mitigation |
| --------- | -------- | ----------- |
| DynamoDB Throttling | Paste creation fails | On-demand + backoff |
| S3 Outage | Pastes unreadable | Multi-region replication |
| Redis Cache Miss | Slower reads | DynamoDB fallback |
| CDN Down | Higher latency | Origin servers handle traffic |
| URL Collision | Duplicate URL | Atomic counter + retry |

---

## Cost Estimation (1M Users)
Rough monthly cost of running this design for one million users:

| Component | Configuration | Monthly Cost |
| ----------- | -------------- | ------------- |
| App Servers (6x) | t3.medium | $300 |
| DynamoDB | On-Demand | $1,500 |
| S3 (1TB stored) | Standard | $23 |
| Redis (2 nodes) | t3.medium | $150 |
| CloudFront | 100GB transfer | $85 |
| Lambda (Expiration) | 10M invocations | $20 |
| **Total** | | **~$2,078** |

---

## Trade-off Analysis
The alternatives considered, and which one won and why:

| Decision | Option A | Option B | Choice | Why |
| ---------- | ---------- | ---------- | -------- | ----- |
| URL Scheme | Hash (MD5) | Counter (Base62) | Base62 | No collisions, sequential |
| Storage | PostgreSQL | DynamoDB + S3 | DynamoDB + S3 | Serverless, auto-scale |
| Expiry | DB Cleanup Job | Redis TTL | Redis TTL | Native, no polling |
| Read Cache | App-level cache | CDN | CDN | Edge caching, <50ms |
| Content | DB BLOB | S3 | S3 | Unlimited scale, cheap |

---

## Key Metrics to Monitor

1. Paste creation latency (P99 < 500ms)
2. Paste retrieval latency (P99 < 100ms)
3. Cache hit rate (Redis + CDN)
4. S3 read/write latency
5. DynamoDB read/write capacity utilization
6. URL collision rate (should be 0)
7. Expired paste cleanup latency
8. CDN cache hit ratio
9. Error rate (4xx + 5xx)
10. Pastes created per second

---

## Deep Dive Prompts

1. How would you design a URL shortener that handles 1B URLs with zero collisions?
2. How would you implement syntax highlighting for 50+ languages at scale?
3. How would you handle paste expiration across distributed systems?
4. How would you design paste versioning (edit history)?
5. How would you implement real-time collaboration on a paste?

---

## Common Interview Follow-ups

1. How would you handle a viral paste that gets 1M views in an hour?
2. How would you detect and prevent malicious content in pastes?
3. How would you implement paste analytics (views, unique visitors)?
4. How would you handle rate limiting for API users vs web users?
5. How would you implement paste sharing with access control?

---

## Low-Level Design (LLD) - Algorithms & Data Structures

### Base62 URL Generator

```text
class URLGenerator {
  constructor() {
    this.charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    this.base = this.charset.length;
    this.counter = 0;
  }

  encode(num) {
    if (num === 0) return this.charset[0];
    let result = "";
    while (num > 0) {
      result = this.charset[num % this.base] + result;
      num = Math.floor(num / this.base);
    }
    return result.padStart(7, "a");
  }

  decode(shortUrl) {
    let result = 0;
    for (const char of shortUrl) {
      result = result * this.base + this.charset.indexOf(char);
    }
    return result;
  }

  generate() {
    return this.encode(this.counter++);
  }
}

const url = new URLGenerator(); console.log("URL generator:", url.generate());
```
