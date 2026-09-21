<div align="center">

# Networking for System Design — From Packets to Planet Scale

</div>

> [!TIP]
> **TL;DR** — Every distributed system is a networking system wearing a costume. Latency budgets, consistency decisions, and failure modes all trace back to how packets move. This guide covers the interview-grade essentials: TCP/UDP, HTTP/1.1→2→3, TLS, DNS, load balancing, CDN, VPC topology, and the latencies that anchor every back-of-envelope estimate.

## Table of Contents

<details>
<summary><b>📑 Jump to a section</b></summary>

1. [The Layered Model — Why It Matters](#1-the-layered-model--why-it-matters)
2. [IP, TCP & UDP](#2-ip-tcp--udp)
3. [The Latencies Every Engineer Memorizes](#3-the-latencies-every-engineer-memorizes)
4. [HTTP Evolution — 1.1 → 2 → 3](#4-http-evolution--11--2--3)
5. [TLS & mTLS](#5-tls--mtls)
6. [DNS — The Internet's Phone Book](#6-dns--the-internets-phone-book)
7. [Load Balancing — L4 vs L7](#7-load-balancing--l4-vs-l7)
8. [CDNs & Edge Caching](#8-cdns--edge-caching)
9. [VPCs, Subnets & Cloud Networking](#9-vpcs-subnets--cloud-networking)
10. [Proxies — Forward, Reverse & API Gateways](#10-proxies--forward-reverse--api-gateways)
11. [API Protocols — REST, gRPC, WebSocket, SSE](#11-api-protocols--rest-grpc-websocket-sse)
12. [Interview Q&A](#12-interview-qa)
13. [Hidden Tips & Tricks](#13-hidden-tips--tricks)
14. [Do's & Don'ts](#14-dos--donts)

</details>

---

## 1. The Layered Model — Why It Matters

The OSI 7-layer model is a teaching tool; the real internet runs the 5-layer TCP/IP stack:

| Layer | OSI # | What it does | What lives here | You touch it when |
| :-- | :-- | :-- | :-- | :-- |
| Application | 5–7 | Semantics | HTTP, gRPC, DNS, TLS | Designing APIs, debugging 4xx/5xx |
| Transport | 4 | Host-to-host delivery | TCP, UDP, QUIC | Tuning timeouts, connection pools |
| Network | 3 | Routing between networks | IP, ICMP | Subnetting, VPC design, MTU issues |
| Data Link | 2 | Local delivery | Ethernet, ARP, VLANs | Rarely — cloud abstracts it |
| Physical | 1 | Bits on wire | Fiber, radio | Never (hopefully) |

**Why interviews care:** naming layers lets you reason about *where a failure can live*. "The API returns 504 but the pod is healthy" → application vs transport vs network — each layer gives you a different probe (curl vs TCP connect vs ICMP). Debugging is layer-hunting.

**Encapsulation:** each layer wraps the one below: `HTTP → TCP segment → IP packet → Ethernet frame`. The **MTU** (typically 1500 bytes) caps frame size; a payload larger than MTU fragments — or worse, silently black-holes with PMTUD broken. This is why **gRPC (HTTP/2) over VPN/overlay networks** mysteriously hangs: TLS + HTTP/2 + gRPC framing stacks ~100 bytes of overhead and hits MTU boundaries.

---

## 2. IP, TCP & UDP

### IP — best-effort delivery

IPv4 (32-bit, ~4.3B addresses, NAT-drowned) vs IPv6 (128-bit). IP gives you **unreliable, unordered, connectionless** packet delivery. Everything else is built on top.

**Key header fields:** TTL (decrements per hop — traceroute's mechanism), DSCP (QoS marking), fragmentation flags.

### TCP — reliability as a protocol

The workhorse. Guarantees **ordered, reliable, flow-controlled, congestion-controlled** byte streams.

**Connection lifecycle:**

```
Three-way handshake (connection setup — 1 RTT):
  Client ── SYN ────────────────▶ Server   (seq=x)
  Client ◀── SYN-ACK ─────────── Server   (seq=y, ack=x+1)
  Client ── ACK ────────────────▶ Server   (ack=y+1)

Teardown: FIN → ACK → FIN → ACK (half-close supported)
```

**Core mechanisms:**

| Mechanism | What it does | Why you care |
| :-- | :-- | :-- |
| **Sliding window** | Bytes in flight without ACK | Window too small = underutilized link |
| **Slow start + congestion avoidance** | Ramp until loss/ECN | New connections are slow — the reason for connection pooling and warm caches |
| **Fast retransmit** | 3 dup-ACKs → resend immediately | Loss recovery without waiting for RTO |
| **Nagle's algorithm** | Coalesce small writes | **Interacts badly with delayed ACK** → 40ms latency spikes. Disable with `TCP_NODELAY` for RPC |
| **Keepalive** | Idle probes | Defaults (2h) are useless for LBs — cloud LBs idle-timeout at 350–1000s; app keepalives must be shorter |
| **TIME_WAIT** | 2×MSL after close | Port exhaustion under load — the reason for `SO_REUSEPORT` and connection pools |

**TCP vs UDP — the interview table:**

| Property | TCP | UDP |
| :-- | :-- | :-- |
| Delivery | Reliable, ordered | Best-effort |
| Connection | Connection-oriented (state) | Connectionless |
| Speed | Setup RTT + congestion control | Fire-and-forget |
| Head-of-line blocking | Yes (stream-level) | No (per-datagram) |
| Use cases | HTTP, DB protocols, SSH | DNS, video/voice, gaming, QUIC base, telemetry |

**UDP's renaissance:** modern protocols (QUIC, WebRTC, HTTP/3) rebuild reliability *in user space* on UDP to escape TCP's kernel-level constraints (in-kernel connection state, hard-coded congestion control, head-of-line blocking).

---

## 3. The Latencies Every Engineer Memorizes

Back-of-envelope estimates live or die on these numbers (§Dean's "Numbers Every Programmer Should Know"):

| Operation | Latency | Scaled analogy (1ns = 1s) |
| :-- | :-- | :-- |
| L1 cache reference | 0.5 ns | — |
| Main memory reference | ~100 ns | 1 minute |
| SSD random read | 16–150 µs | 2–4 days |
| Datacenter round trip | ~0.5 ms | 6 days |
| Cross-continent RTT (US-EU) | ~80–120 ms | 3+ years |
| Disk seek | ~10 ms | 4 months |
| HTTPS GET (cold, full handshake) | 3–5 RTT | — |
| HTTPS GET (resumed/HTTP-3) | 1 RTT | — |

**Memory hooks:**
- **Intra-region cloud RTT: ~1 ms** (AWS same-AZ ~0.2 ms, cross-AZ ~1–2 ms, cross-region ~50–100 ms)
- **Human-perceived instant: 100 ms**; **conversation flow breaks: 1 s**
- A page load with 50 assets over HTTP/1.1 (6 connections) vs HTTP/2 (1 connection) vs HTTP/3 (0-RTT resume) — this is *why* protocol version matters

**Interview move:** when asked to estimate, anchor on RTT. "Sync replication across regions adds ~100 ms write latency" — that single sentence shows senior judgment.

---

## 4. HTTP Evolution — 1.1 → 2 → 3

| Feature | HTTP/1.1 (1997) | HTTP/2 (2015) | HTTP/3 (2022) |
| :-- | :-- | :-- | :-- |
| Transport | TCP | TCP | **QUIC over UDP** |
| Multiplexing | ❌ (pipelining broken) | ✅ streams | ✅ streams (no transport HOL) |
| Header format | Plaintext, verbose | **HPACK** compressed | **QPACK** (HPACK-aware of reorder) |
| Server push | — | ✅ (deprecated in practice) | Removed |
| Connection setup | TCP (1 RTT) + TLS (1–2 RTT) | TCP + TLS | **0/1-RTT resume** |
| Head-of-line blocking | Request-level AND transport-level | Request-level solved; **TCP-level HOL remains** | Transport HOL solved (independent streams) |
| Browser requirement | — | TLS de facto | TLS 1.3 mandatory |

**The HTTP/2 catch interviewers love:** multiplexing fixes *application*-layer HOL, but a single TCP packet loss stalls **all** streams on that connection (transport-level HOL). HTTP/3 fixes this by giving every QUIC stream independent loss recovery. On lossy networks (mobile), HTTP/3 shows real wins; on clean datacenter links, HTTP/2 ≈ HTTP/3.

**Practical notes:**
- HTTP/2 server push is deprecated (Chrome removed it) — use `103 Early Hints` instead
- gRPC **requires** HTTP/2 (streaming bidirectional, header compression semantics)
- Upgrading: `Alt-Svc` header advertises HTTP/3; browsers race both (Connection Coalescing)

---

## 5. TLS & mTLS

**TLS 1.3 handshake (1-RTT, vs TLS 1.2's 2-RTT):**

```
ClientHello (key share + supported ciphers + SNI)
  ──▶ Server: {cert, Finished} ◀──  (server auth + key agreement in one flight)
Client Finished ──▶   → application data can flow
0-RTT resumption: early data on resumption (with replay caveats!)
```

**What TLS actually gives you:** confidentiality (symmetric AES/ChaCha), integrity (AEAD), server authentication (cert chain → trust anchor), and optional client authentication.

**Concepts worth knowing:**

| Concept | What it is | Production note |
| :-- | :-- | :-- |
| **SNI** | Hostname sent in clear during handshake | The reason shared-IP hosting works — and the thing ECH now encrypts |
| **ALPN** | Protocol negotiation inside TLS | How HTTP/2 gets negotiated without extra RTT |
| **Session resumption** | Session tickets / PSK | Cuts handshake to 0/1-RTT; enable it before blaming "TLS is slow" |
| **OCSP stapling** | Revocation check piggybacked | Avoids client-side OCSP latency/failure |
| **HSTS** | Force-HTTPS policy header | Prevents first-request downgrade |
| **mTLS** | Both sides present certificates | The default for **service-to-service** auth in zero-trust meshes (Istio, SPIFFE) |

**mTLS in the microservices world:** inside a cluster, every workload gets a short-lived identity cert; the mesh (or the app) verifies both directions. This replaces network-perimeter trust ("we're inside the VPC so we're safe") with per-request cryptographic identity — the answer to "how do services authenticate each other?" in senior interviews.

---

## 6. DNS — The Internet's Phone Book

**Resolution chain (recursive resolver in the middle):**

```
Browser cache → OS cache → [Recursive Resolver (ISP/8.8.8.8/1.1.1.1)]
    → Root NS (gives .com NS) → .com NS (gives example.com NS)
    → Authoritative NS (returns A/AAAA record)  — each step cached per TTL
```

**Record types that matter for system design:**

| Record | Purpose | System-design use |
| :-- | :-- | :-- |
| **A / AAAA** | Name → IPv4/IPv6 | The basic lookup |
| **CNAME** | Alias → another name | `api.example.com → lb.example.com` (canonical name chains) |
| **ALIAS/ANAME** | Alias at zone apex (provider extension) | Apex can't CNAME — Route53/Cloudflare fake it |
| **TXT** | Arbitrary text | SPF/DKIM/verification; service discovery metadata |
| **SRV** | Service location (host+port) | Internal discovery (pre-Kubernetes style) |
| **NS** | Delegation | Who's authoritative for a zone |
| **MX** | Mail routing | Rare in system design, big in ops |

**TTL — the lever everything rides on:**
- Low TTL (30–60s): fast failover, more resolver load
- High TTL (3600s): fewer lookups, slow disaster recovery
- **Failover pattern:** health-checked DNS (Route 53 / Traffic Manager) + low TTL — but *respect client caches*: stale records linger up to TTL *and* clients may pin connections

**DNS gotchas worth name-dropping:**
- **Split-horizon DNS** — private zones resolve differently inside the VPC (service discovery basis)
- **DNS is UDP first** (with TCP fallback for truncation/DNSSEC) — why DNS amplification DDoS exists
- **Negative caching** — NXDOMAIN results cache too; a typo'd service discovery entry hurts longer than you'd think
- Cloud DNS limits: Route 53 1024 queries/s per IP — put resolver caching (CoreDNS, `nscd`) in front for pod-heavy fleets

---

## 7. Load Balancing — L4 vs L7

| | **L4 (transport)** | **L7 (application)** |
| :-- | :-- | :-- |
| Operates on | IP + port | HTTP headers, paths, cookies |
| Sees | "route :443 → backend" | "route `/api/v2 → pool-b`, sticky by cookie" |
| TLS | Passthrough or termination | Usually termination |
| Throughput | Higher (less inspection) | Lower per-conn, richer features |
| Examples | NLB (AWS), Google Network LB, Azure LB | ALB, Cloud HTTP(S) LB, Front Door, NGINX/Envoy |
| Health checks | TCP connect | HTTP probes with expected codes |

**Scheduling algorithms:**

| Algorithm | Behavior | Gotcha |
| :-- | :-- | :-- |
| Round robin | Rotate through pool | Ignores load differences |
| Least connections | Send to fewest active | Better for variable request cost |
| Weighted RR / LC | Capacity-proportional | Rollouts & heterogeneous fleets |
| **Consistent hashing** | Ring/hash — same key → same node | Minimal reshuffle on membership change; the default for caches (§`system-design-distributed-cache.md`) and gRPC LB |
| Sticky sessions | Cookie/IP affinity | Breaks stateless ideals; needed for in-memory session state |
| **Least outstanding requests** (Envoy) | Adaptive to real-time latency | Best default for mixed-cost RPC fleets |

**Health checks & failover:** active (LB probes `/healthz`) vs passive (failure detection from real traffic). Ejection policies, outlier detection (Envoy), and the **retry storm problem** — retries + health-check flapping = amplification. Always pair retries with budgets/circuit breakers (§`devops-features.md` §12).

**The interview-grade answer to "L4 or L7?":** both, layered — internet → Global LB (L7, TLS, WAF) → regional NLB (L4, fan-out) → pods. Azure calls this Front Door + Application Gateway; AWS ALB+NLB; GCP a single global HTTP(S) LB does both.

---

## 8. CDNs & Edge Caching

**What a CDN buys you:** edge PoPs close to users serve cached content, absorb DDoS, terminate TLS, and shield origin.

**Caching behavior:**

| Concept | Meaning |
| :-- | :-- |
| `Cache-Control: max-age` | Freshness window |
| `s-maxage` / `stale-while-revalidate` | Shared-cache freshness / serve-stale-then-refresh |
| `ETag` / `If-None-Match` | Conditional revalidation (304s) |
| `Vary` | Cache-key dimensions (careful: `Vary: *` disables caching) |
| Purge / invalidation | Pull CDN content early (CloudFront `CreateInvalidation` — first 1000 paths free) |
| Origin shielding | Middle tier limits origin stampedes on popular-miss |

**Push vs pull:** pull (origin-pull on miss) is the default and self-managing; push (prefill) for known-hot content (app releases, viral media).

**Modern additions:** edge compute (Cloudflare Workers, CloudFront Functions, Fastly Compute@Edge) — logic runs next to the cache: auth checks, A/B bucketing, personalization without origin round trips.

**Where this shows up in the repo:** URL shortener and video streaming designs lean on CDN edge caches; the cache-stampede discussion (`interview-qa.md` §73) applies directly to origin misses.

---

## 9. VPCs, Subnets & Cloud Networking

**The mental model (AWS-flavored, maps to GCP/Azure):**

```
VPC (10.0.0.0/16)
├── Public Subnet (10.0.1.0/24)   ← ALB, bastion (IGW route)
│     └── NAT Gateway             ← private subnets' egress
├── Private Subnet — app (10.0.10.0/24, AZ-a)
│     └── pods/instances — no inbound internet
├── Private Subnet — data (10.0.20.0/24)
│     └── DBs — reachable only from app subnets
└── Endpoints (S3/DynamoDB Gateway / Interface endpoints)
      └── private access to AWS services without NAT costs
```

**Security Groups vs Network ACLs:**

| | Security Group | Network ACL |
| :-- | :-- | :-- |
| Level | Instance/ENI | Subnet |
| State | **Stateful** (return traffic auto-allowed) | Stateless (must allow both directions) |
| Rules | Allow only | Allow + deny |
| Order | All evaluated | Numbered, first-match |

**NAT Gateway truth:** it exists so private subnets can **egress** (software updates, third-party APIs). It's per-AZ (deploy one per AZ for HA — a single-NAT design dies with the AZ), charges per hour **and per GB processed** — the silent bill line (§`cloud.md` §17).

**Routing primitives worth knowing:**
- **Route tables** — per-subnet; the 0.0.0.0/0 route decides "internet vs NAT vs firewall appliance"
- **Peering / Transit Gateway** — VPC-to-VPC; TGW is hub-and-spoke, peering is non-transitive
- **Private endpoints (PrivateLink/PSC)** — S3/DynamoDB via gateway endpoints are **free**; interface endpoints cost money but cover everything
- **Egress control** — the enterprise pattern: egress proxy (explicit allow-list) instead of open NAT

**The one-line architecture rule:** public subnets for entry points only; everything else private; data tiers get their own subnets + SG chains (app SG → data SG allow-list).

---

## 10. Proxies — Forward, Reverse & API Gateways

| | Forward proxy | Reverse proxy | API Gateway |
| :-- | :-- | :-- | :-- |
| Sits in front of | Clients (outbound) | Servers (inbound) | APIs specifically |
| Knows identity of | The client | The backend pool | The API contract |
| Typical jobs | Egress control, anonymity, filtering | TLS term, compression, routing, caching, LB | AuthN/Z, rate limiting, quotas, versioning, monetization |
| Examples | Squid, corporate proxies, AWS egress proxy | NGINX, Envoy, HAProxy, ALB | Kong, Apigee, API Gateway, Azure API Mgmt |

**X-Forwarded-For and friends:** reverse proxies append client IP; your app must trust *only* the proxy's hop — otherwise clients spoof headers (the classic auth-bypass bug).

**API Gateway vs reverse proxy in interviews:** the gateway owns *API semantics* (per-client keys, quotas, response shaping); the reverse proxy owns *transport semantics* (connections, TLS, static serving). Large systems have both.

---

## 11. API Protocols — REST, gRPC, WebSocket, SSE

| | REST/HTTP | gRPC | WebSocket | SSE |
| :-- | :-- | :-- | :-- | :-- |
| Model | Request/response | RPC over HTTP/2 | Full-duplex single socket | Server push over HTTP |
| Payload | JSON (text) | Protobuf (binary) | Any | Text events |
| Streaming | — (chunks) | ✅ uni/bi-directional | ✅ both ways | Server → client only |
| Browser support | Universal | Needs proxies (gRPC-Web) | ✅ | ✅ (auto-reconnect built in!) |
| Latency/overhead | Higher per call | Lowest | Lowest after upgrade | Low |
| Contract | OpenAPI | `.proto` (strict) | Often ad-hoc | Event format |
| Use when | Public APIs, CRUD | Internal microservice mesh, low latency, streaming | Chat, collab, games, trading | Feeds, notifications, LLM token streams |

**Decision shortcuts:**
- **Public + cacheable + boring** → REST
- **Internal + performance-critical + typed** → gRPC (see `agentic-ai-features.md` tool protocols)
- **True bidirectional with server-initiated** → WebSocket (see `system-design-messaging-app.md`)
- **One-way server push** → SSE (simpler, HTTP-native, auto-reconnect — LLM streaming's default, `system-design-llm-inference.md`)

**gRPC details worth knowing:** 4 modes (unary, server-stream, client-stream, bidi); deadlines propagate in metadata; load balancing is per-connection (HTTP/2 multiplexes) so client-side LB or proxy-based (Envoy) is required — naive L7 RR under-loads later backends.

---

## 12. Interview Q&A

**Q: Why is the first request to an API slow, then fast?**
TLS handshake + TCP slow start + cold connection. Resumption/HTTP-3 0-RTT and pooled keep-alive connections eliminate most of it. This is why latency percentiles (p99) tell the truth that averages hide.

**Q: A user in Singapore hits your US-east API. Walk the path.**
DNS (resolver → authoritative, maybe geo-DNS) → anycast/CDN edge (TLS terminates) → backbone transit (~80–120 ms RTT) → regional LB → service. Design implications: CDN for statics, regional deployments for dynamic latency, and *never* synchronous cross-region calls in the hot path without budgeting the RTT.

**Q: Why do microservices use mTLS instead of just VPC security?**
Perimeter trust fails to lateral movement — one compromised pod is inside the castle. mTLS gives workload identity per request, enabling zero-trust: every call authenticated + authorized regardless of network position.

**Q: What breaks when you put a load balancer in front of WebSockets?**
Idle timeouts (LBs kill idle conns — need keepalive pings below timeout), sticky sessions (connection must route to the same pod or you need a pub/sub backplane), and connection-drain semantics during deploys (see `system-design-messaging-app.md` connection-fan-out section).

**Q: Your service sees 40ms latency spikes every ~200ms under load. What is it?**
Nagle + delayed ACK interaction on small writes. Fix: `TCP_NODELAY`, batch app-level, or larger writes. The pattern to remember: *latency pathology hides in protocol interactions*.

**Q: Why does DNS TTL matter for blue-green deployments?**
Traffic shifts at TTL speed. 3600s TTL = up to an hour of split traffic — fine for progressive rollout, fatal for emergency cutover. Low TTL + health checks = fast global failover, at the cost of resolver QPS.

**Q: How would you debug "API returns 504 but pods are healthy"?**
Layer-hunt: LB health check path/code mismatch? → LB idle timeout < backend p99? → connection pool exhaustion (SYN queue, TIME_WAIT)? → backend-to-DB RTT spiked? Each layer has a different probe; check from edge inward with curl -w timing breakdown (DNS/connect/TLS/TTFB).

---

## 13. Hidden Tips & Tricks

| Tip | Why it matters |
| :-- | :-- |
| `curl -w` timing breakdown is the fastest network debug tool | Splits DNS/connect/TLS/TTFB — names the layer before you guess |
| Cloud LB idle timeouts (350–1000s) silently kill long-lived conns | gRPC streams and WebSockets need ping keepalives *below* the LB timeout |
| `TCP_NODELAY` on RPC paths | Disables Nagle — kills the 40ms delayed-ACK spike |
| Gateway endpoints (S3/DynamoDB) are free; interface endpoints aren't | Big NAT-egress savings for S3-heavy workloads |
| DNS TTL × connection reuse = your real failover time | Not the health-check interval — the TTL plus client pinning |
| `Vary: *` disables caching entirely | One bad header and your CDN is a passthrough |
| HTTP/3 helps mobile most | Lossy networks benefit from per-stream recovery; clean DC links barely notice |
| Anycast ≠ failover by itself | Anycast withdraws routes on PoP failure — but you still need health-based DNS for regional outages |
| SSE beats WebSocket for LLM streaming | HTTP-native, auto-reconnect, no sticky-session infra |
| PMTUD blackholes are why "works on VPN, breaks in prod" | MSS clamping on overlay networks prevents silent MTU hangs |

---

## 14. Do's & Don'ts

| ✅ Do | ❌ Don't |
| :-- | :-- |
| Terminate TLS at the edge; re-encrypt internally with mTLS | Don't run plaintext inside the VPC "because it's private" |
| Set explicit LB/app keepalive hierarchies (client > LB > app) | Don't let the LB idle-timeout be the shortest timer |
| Use low TTLs (60s) on failover records; high elsewhere | Don't run everything at 60s TTL and melt resolvers |
| Budget RTT explicitly in cross-region designs | Don't chain synchronous cross-region calls in hot paths |
| Pick L7 LB algorithms by request-cost variance (least-outstanding for mixed) | Don't round-robin a fleet of mixed-cost RPCs and wonder why p99 spikes |
| Use SG chains (app SG → data SG) for tier isolation | Don't open 0.0.0.0/0 on data-tier security groups |
| Cache at the edge with `stale-while-revalidate` for resilience | Don't purge-mass-invalidate on every deploy (origin stampede) |
| Enable HTTP/3 at the edge; keep HTTP/2 inside | Don't force HTTP/3 on lossless datacenter links for marginal wins |
| Set connection-pool limits per downstream + circuit breakers | Don't let one slow downstream drain the entire pool |
| Test MTU/PMTUD on overlay/VPN paths before launch | Don't ship gRPC-over-VPN assuming MTU is someone else's problem |

---

*Pairs with:* `cloud.md` (§10 networking services, §17 cloud costs) · `system-design-url-shortener.md` (CDN + aliasing) · `system-design-messaging-app.md` (WebSocket fan-out) · `system-design-rate-limiter.md` (edge limits) · `interview-qa.md` §81 (universal do's & don'ts) · `operating-systems.md` (sockets, epoll, zero-copy — the host side of this story).
