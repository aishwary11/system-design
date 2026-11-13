<a id="top"></a>

<div align="center">

<sub>SYSTEM DESIGN · TECHNOLOGY STACK</sub>

# Tools & Technology Selection

**Pick the tool by the constraint it removes — not by the logo on the conference slide.**

<sub>9 LAYERS · 40+ TOOLS · 1 DECISION TABLE</sub>

</div>

> [!TIP]
> **The thesis** — every tool is a trade. A managed service trades money for operations; a queue trades latency for decoupling; a warehouse trades write flexibility for scan speed. The interview answer is the constraint, the default, the alternative, and the failure mode.

---

## On this page

<details open>
<summary><b>11 sections</b></summary>

1. [How to Choose a Tool](#1-how-to-choose-a-tool)
2. [Edge & Delivery](#2-edge--delivery)
3. [Compute & Orchestration](#3-compute--orchestration)
4. [Data Stores](#4-data-stores)
5. [Caching](#5-caching)
6. [Messaging & Durable Workflows](#6-messaging--durable-workflows)
7. [Data Processing](#7-data-processing)
8. [Observability](#8-observability)
9. [CI/CD & Infrastructure as Code](#9-cicd--infrastructure-as-code)
10. [AI Serving & Retrieval](#10-ai-serving--retrieval)
11. [Which Tool When — Decision Table](#11-which-tool-when--decision-table)

</details>

---

## 1. How to Choose a Tool

Start with **six constraints**, in this order:

| Constraint | Question | What it eliminates |
| :--- | :--- | :--- |
| **Workload shape** | point reads, scans, writes, streams, or vectors? | storage engine and index |
| **Consistency** | can this read be stale? must a write be linearizable? | single-primary vs multi-leader vs quorum |
| **Latency** | p50 or p99 target? cross-region? | local cache vs regional replica vs edge |
| **Scale** | QPS, bytes/day, fan-out, retention | single node vs shard vs warehouse |
| **Operations** | who runs it at 3 a.m.? backup/restore? upgrades? | self-hosted vs managed |
| **Cost** | per-request, per-GB, per-seat, egress | the “free” open-source option usually has people cost |

**The default stack for a new product** is intentionally boring: PostgreSQL, Redis for cache/locks, S3-compatible object storage, one queue (SQS or Kafka), a CDN, and Prometheus/Grafana/OpenTelemetry. Add a specialist store only when a measured access pattern fails — not because the architecture diagram looks more impressive.

**The three questions that expose a bad tool choice:**

1. What happens when it is unavailable for 30 seconds?
2. How do you restore a backup, and how long does it take?
3. What is the migration path if it stops fitting?

If the answer to any is “we would rewrite the service”, the tool is a commitment, not a component.

---

## 2. Edge & Delivery

| Layer | Representative tools | Choose when | Watch out for |
| :--- | :--- | :--- | :--- |
| **DNS** | Route 53, Cloudflare DNS, NS1 | global failover, weighted/latency routing | TTL is a cache; failover is not instant |
| **CDN** | CloudFront, Cloudflare, Fastly, Akamai | static assets, video segments, cacheable APIs | cache keys, purge cost, origin shielding |
| **L4 load balancer** | AWS NLB, HAProxy (TCP), IPVS | raw TCP/UDP, extreme throughput | no HTTP-aware routing |
| **L7 load balancer** | ALB, Nginx, HAProxy, Envoy | path/host routing, TLS termination, retries | retry storms, sticky sessions |
| **API gateway** | Kong, AWS API Gateway, Apigee, Envoy Gateway | auth, quotas, versioning, request shaping | becomes a shared dependency; keep it thin |
| **WAF** | Cloudflare WAF, AWS WAF | bot/OWASP filtering at the edge | false positives; rule drift |
| **Service mesh** | Istio, Linkerd, Envoy | mTLS, retries, traffic splitting between services | sidecar cost and debugging complexity |

**Nginx vs HAProxy vs Envoy:** Nginx is a web server/reverse proxy with strong static-file and caching behavior; HAProxy is a focused, very fast TCP/HTTP load balancer; Envoy is a programmable L7 proxy built for service mesh and observability. For one ingress, Nginx or ALB is enough. Reach for Envoy when you need per-route policy across many services.

---

## 3. Compute & Orchestration

| Option | Representative tools | Best for | Trade-off |
| :--- | :--- | :--- | :--- |
| **VM** | EC2, GCE, Azure VM | predictable, stateful, lift-and-shift | you own patching and scaling |
| **Container** | Docker, ECS, Cloud Run | packaging, fast deploys, bursty services | image supply chain, cold starts |
| **Kubernetes** | EKS, GKE, AKS, self-managed | many services, autoscaling, ecosystem | control-plane complexity; not a default for 3 services |
| **Serverless** | Lambda, Cloud Functions, Cloud Run | spiky/event-driven, low ops | cold starts, execution limits, per-invocation cost |
| **Batch** | AWS Batch, Kubernetes Jobs, Slurm | offline jobs, data processing | queueing and retry semantics are yours |

**The rule:** use the least powerful execution model that meets the SLO. A cron job on a VM is a valid answer; Kubernetes is not a maturity badge.

---

## 4. Data Stores

| Store | Model | Strong at | Weak at | Default use |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL** | relational, JSONB, extensions | transactions, joins, constraints, geospatial (PostGIS), vectors (pgvector) | horizontal write scale; very large blobs | default OLTP store |
| **MySQL** | relational | mature ops, read replicas, wide hosting support | fewer extensions than Postgres | existing LAMP/MySQL estates |
| **MongoDB** | document | flexible documents, aggregate reads, change streams | cross-document joins/transactions at scale | catalogs, profiles, CMS |
| **Cassandra** | wide-column | write-heavy, multi-region, huge tables | ad-hoc queries, joins | messages, activity, time-series |
| **DynamoDB** | key-value/document | serverless scale, predictable single-digit ms | access-pattern-first modeling, costly scans | AWS-native KV at scale |
| **Redis** | in-memory structures | cache, counters, sorted sets, locks, streams | durable primary storage (unless configured) | cache, leaderboard, rate limit |
| **ClickHouse** | columnar OLAP | fast aggregations over billions of rows | point updates, transactions | product analytics, logs |
| **Snowflake / BigQuery** | managed warehouse | separated storage/compute, SQL analytics | cost per scan, latency | warehouse/lakehouse |
| **Elasticsearch** | inverted index + doc values | full-text, facets, fuzzy, geo | source-of-truth transactions | search and log search |
| **Neo4j** | graph | multi-hop relationship queries | bulk scans, sharding | fraud rings, social graph |
| **pgvector / Milvus** | vector index (HNSW/IVF) | semantic retrieval | exact filters, transactions | RAG, recommendations |
| **S3 / GCS** | object storage | durability, cheap capacity, lifecycle | latency, no partial updates | blobs, backups, data lake |

**SQL vs NoSQL in one line:** if the access pattern is unknown or the invariant spans rows, start relational. If the access pattern is known and the data is huge or sparse, choose the shape that makes the hot query a single key lookup.

---

## 5. Caching

| Layer | Tool | Use | Failure |
| :--- | :--- | :--- | :--- |
| Browser | HTTP cache, `Cache-Control`, ETag | repeat visits, conditional GET | stale content after deploy |
| Edge | CDN cache | static/media/API GETs | purge storms, cache-key mistakes |
| Application | Redis, Memcached | hot objects, sessions, counters | stampede, hot key, inconsistency |
| Local | Caffeine, Guava, in-process LRU | ultra-low latency, per-instance data | invalidation across instances |
| Database | buffer pool, materialized view | repeated query shapes | stale materialized view |

**Default:** cache-aside with a TTL and a single-flight lock on miss; add write-through only when the write path must not serve stale data. Never make the cache the only copy of a fact.

---

## 6. Messaging & Durable Workflows

| Tool | Model | Delivery | Best for | Watch out for |
| :--- | :--- | :--- | :--- | :--- |
| **Kafka** | partitioned log | at-least-once; transactions for exactly-once inside Kafka | event backbone, CDC, replay, high throughput | partition count, rebalance, operational weight |
| **RabbitMQ** | queue + exchanges | at-least-once with acks | task queues, routing, per-message priority | queue buildup, prefetch tuning |
| **SQS** | managed queue | at-least-once; FIFO adds deduplication and ordered processing | decoupling AWS services, simple workers | 256 KB messages, visibility timeout |
| **SNS** | pub/sub | at-least-once | fan-out to SQS/Lambda/HTTP | no replay, subscription fan-out limits |
| **Pulsar** | log + queue | at-least-once | multi-tenant, tiered storage | smaller ecosystem |
| **NATS** | lightweight pub/sub | at-most/at-least (JetStream) | low-latency control plane | durability depends on JetStream config |
| **Temporal** | durable workflow | replay-safe execution; activities are at-least-once, so idempotency is still required | long-running sagas, timers, human tasks | workflow versioning, determinism |

**Queue vs log vs workflow:**

- A **queue** deletes the message after ack; it is a work distributor.
- A **log** retains ordered events per partition; it is a replayable backbone.
- A **workflow** owns state across minutes or days, with retries and compensation; it is not a queue with a cron.

---

## 7. Data Processing

| Tool | Role | Choose when | Note |
| :--- | :--- | :--- | :--- |
| **Spark** | batch/stream processing | large joins, ML feature prep, SQL over files | micro-batch latency |
| **Flink** | stateful stream processing | event-time windows, exactly-once state, low latency | state backend and checkpoint tuning |
| **Kafka Streams** | embedded stream processing | Kafka-only pipelines, simple state | limited to Kafka ecosystem |
| **Airflow** | workflow orchestration | scheduled DAGs, dependency management | not a streaming engine |
| **dbt** | SQL transformations | warehouse modeling, tests, lineage | runs on the warehouse; not ingestion |
| **Debezium** | CDC | database changes to Kafka without dual writes | schema evolution and snapshot handling |

**Batch vs stream:** batch is simpler and cheaper for large backfills; stream is necessary when the business action depends on seconds-old data. Most companies need both: stream the hot path, batch the reconciliation.

---

## 8. Observability

| Signal | Tool | What it answers | Cost control |
| :--- | :--- | :--- | :--- |
| Metrics | Prometheus, CloudWatch, Datadog | rate, errors, duration, saturation | cardinality caps; pre-aggregate |
| Logs | Loki, ELK, CloudWatch Logs | what exactly happened to this request | structured logs, sampling, retention tiers |
| Traces | Jaeger, Tempo, Datadog APM | where the time went across services | head/tail sampling, span limits |
| Instrumentation | OpenTelemetry SDK + Collector | vendor-neutral traces/metrics/logs | one pipeline, not three agents |
| Alerts | Alertmanager, PagerDuty, Opsgenie | who is woken up and why | SLO burn-rate alerts, not every spike |

**RED** for services (rate, errors, duration); **USE** for resources (utilization, saturation, errors). Put `trace_id` in every log line; use exemplars to jump from a latency histogram to a slow trace.

---

## 9. CI/CD & Infrastructure as Code

| Tool | Role | Choose when |
| :--- | :--- | :--- |
| **GitHub Actions** | CI/CD | GitHub-hosted repo, simple matrix builds |
| **GitLab CI** | CI/CD | GitLab, integrated registry/security |
| **Jenkins** | CI/CD | existing plugins, on-prem control |
| **ArgoCD / Flux** | GitOps CD | Kubernetes desired-state sync |
| **Terraform / OpenTofu** | infrastructure as code | multi-cloud, reviewable infra changes |
| **Docker** | image build | consistent runtime packaging |
| **Trivy / SonarQube** | security/quality gates | shift-left scanning |

**Pipeline default:** build once → test → scan → sign → deploy the same artifact to staging and production. A rollback is a redeploy of the previous digest, not a rebuild.

---

## 10. AI Serving & Retrieval

| Need | Tool | Note |
| :--- | :--- | :--- |
| LLM serving | vLLM, TensorRT-LLM, TGI | continuous batching, KV cache, quantization |
| Managed model API | OpenAI, Anthropic, Bedrock, Vertex AI | no GPU ops; per-token cost and rate limits |
| Vector store | pgvector, Milvus, Qdrant, Pinecone | start with pgvector if Postgres is already there |
| RAG orchestration | LlamaIndex, LangChain, custom | keep retrieval and prompts testable |
| Evaluation | promptfoo, Ragas, custom harness | measure retrieval recall and answer faithfulness |

The AI layer changes fastest; isolate it behind an internal gateway so the model/provider can change without touching product code.

---

## 11. Which Tool When — Decision Table

| Problem | Default | Upgrade / alternative | Do not start with |
| :--- | :--- | :--- | :--- |
| Transactional app data | PostgreSQL | MySQL, Aurora, Spanner | a document store with unknown queries |
| Session/cache | Redis | Memcached for simple KV | the primary database |
| Full-text search | PostgreSQL FTS or Elasticsearch | Elasticsearch/OpenSearch at scale | `LIKE '%term%'` on a large table |
| Event backbone | Kafka | Pulsar, Kinesis | RabbitMQ for replayable event history |
| Task queue | SQS or RabbitMQ | Temporal for long workflows | Kafka as a per-task queue |
| Analytics | ClickHouse or BigQuery/Snowflake | Spark for huge transforms | OLTP primary |
| Object/blob storage | S3/GCS | MinIO for on-prem | database BLOBs at scale |
| Metrics | Prometheus + Grafana | Datadog/CloudWatch | per-user metric labels |
| Logs | Loki or ELK | cold S3 + query layer | logging everything forever |
| Traces | OpenTelemetry + Tempo/Jaeger | managed APM | custom trace IDs per service |
| CI/CD | GitHub Actions | GitLab CI, Jenkins | hand-rolled deploy scripts |
| Infra | Terraform | Pulumi, CloudFormation | console-only changes |
| Vector search | pgvector | Milvus/Qdrant at scale | a separate vector DB on day one |

**Lock-in check:** managed services are fine until the exit cost exceeds the value. Keep data in open formats (Parquet, Avro, PostgreSQL dump), keep the contract behind your API, and document the migration path before the incident.

---

## Hidden Tips & Tricks

- **Name the failure mode before the feature.** "Kafka gives replay; it also gives rebalance storms" is a stronger answer than a feature list.
- **Start with the boring default.** PostgreSQL + Redis + S3 + one queue covers most products; specialists are earned by a measured bottleneck.
- **Managed vs self-hosted is an operations decision.** The cheapest VM is expensive if nobody owns the backup restore.
- **A queue is not a workflow.** If the process spans hours, needs compensation, or waits for a human, use a durable workflow engine.
- **One observability pipeline beats three agents.** OpenTelemetry in, vendor-neutral out.
- **Cost is a design constraint.** Egress, cardinality, scan volume, and per-token pricing are architecture.

---

## Do's & Don'ts

| ✅ Do | ❌ Don't |
| :-- | :-- |
| Choose by workload, consistency, and operations | Choose by GitHub stars |
| Write the default and the exit path | Assume the managed service is forever |
| Keep data in an open format | Store the only copy in a proprietary index |
| Put the model/provider behind a gateway | Hard-code one LLM vendor in product code |
| Measure before adding a specialist store | Add a vector DB, graph DB, and warehouse on day one |
| Link the tool to the design doc that uses it | Duplicate a vendor manual in this repo |

---

<nav>← [Cloud map](cloud.md) · [DevOps guide](devops-features.md) · [README](README.md) →</nav>

---

<p align="right"><a href="#top">↑ Back to top</a></p>
