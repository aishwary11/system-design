<div align="center">

# Cloud Services Guide — Which Tool, Where, and Why

</div>

A vendor-neutral map of cloud services across **AWS, GCP, and Azure**, organized by what you're actually building: object storage and archive tiers, block/file storage, compute and Kubernetes, databases, messaging, networking, AI/ML platforms, and observability. Each section ends with **"use it when"** guidance tied to the system designs in this repo.

**In one line:** every major cloud ships the same ~30 primitives (object store, managed Postgres, queue, Kubernetes, CDN…) under different names — interviews and migrations are easier once you can translate fluently between them.

### Multi-cloud service map at a glance

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 996 1338" width="900" role="img" aria-label="Cloud at a Glance">
<rect x="0.5" y="0.5" width="995" height="1337" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
<title>Cloud at a Glance</title>
<rect x="68" y="288" width="824" height="950" rx="14" fill="none" stroke="#cbd5e1" stroke-width="1.3" stroke-dasharray="7 5"/>
<rect x="80" y="296" width="192.8" height="20" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
<text x="176.4" y="310" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" fill="#475569">One Cloud, Three Vendors</text>
<path d="M460 132 L460 227 L181 227 L181 322" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-cloud-at-a-glance)"/>
<path d="M480 132 L480 322" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-cloud-at-a-glance)"/>
<path d="M500 132 L500 227 L779 227 L779 322" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-cloud-at-a-glance)"/>
<path d="M181 384 L181 626" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-cloud-at-a-glance)"/>
<path d="M480 384 L480 626" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-cloud-at-a-glance)"/>
<path d="M779 384 L779 626" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-cloud-at-a-glance)"/>
<path d="M181 688 L181 795 L460 795 L460 902" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-cloud-at-a-glance)"/>
<path d="M480 688 L480 902" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-cloud-at-a-glance)"/>
<path d="M779 688 L779 795 L500 795 L500 902" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-cloud-at-a-glance)"/>
<path d="M460 964 L460 1061 L175 1061 L175 1158" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-cloud-at-a-glance)"/>
<path d="M480 964 L480 1158" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-cloud-at-a-glance)"/>
<path d="M500 964 L500 1061 L785 1061 L785 1158" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-cloud-at-a-glance)"/>
<rect x="396" y="73" width="168" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="396" y="70" width="168" height="62" rx="12" fill="#ecfdf5" stroke="#10b981" stroke-width="1.4"/>
<rect x="399" y="73" width="162" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="480" y="106" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#064e3b">Your Workload</text>
<rect x="86" y="325" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="86" y="322" width="190" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="89" y="325" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="181" y="358" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Compute Tier</text>
<rect x="385" y="325" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="385" y="322" width="190" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="388" y="325" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="480" y="358" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">App &amp; Data Tier</text>
<rect x="684" y="325" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="684" y="322" width="190" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="687" y="325" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="779" y="358" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">AI Tier</text>
<rect x="86" y="629" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="86" y="626" width="190" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="89" y="629" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="181" y="662" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Object + Block Storage</text>
<rect x="385" y="629" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="385" y="626" width="190" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="388" y="629" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="480" y="662" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Databases</text>
<rect x="684" y="629" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="684" y="626" width="190" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="687" y="629" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="779" y="662" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Warehouses + Lake</text>
<rect x="395" y="905" width="170" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="395" y="902" width="170" height="62" rx="12" fill="#fff7ed" stroke="#f97316" stroke-width="1.4"/>
<rect x="398" y="905" width="164" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="480" y="938" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#7c2d12">Eventing</text>
<rect x="86" y="1161" width="178" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="86" y="1158" width="178" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="89" y="1161" width="172" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="175" y="1194" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Networking Edge</text>
<rect x="391" y="1161" width="178" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="391" y="1158" width="178" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="394" y="1161" width="172" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="480" y="1194" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Identity + Secrets</text>
<rect x="696" y="1161" width="178" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="696" y="1158" width="178" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="699" y="1161" width="172" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="785" y="1194" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Observability</text>
<defs><marker id="arr-cloud-at-a-glance" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker><marker id="arrEm-cloud-at-a-glance" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#10b981"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/features/cloud-at-a-glance.architecture.html](diagrams/features/cloud-at-a-glance.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.

---

## Table of Contents

<details>
<summary><b>📑 Jump to a section</b></summary>

1. [Object Storage & Archive Tiers (S3 / GCS / Blob)](#1-object-storage--archive-tiers-s3--gcs--blob)
2. [Block & File Storage](#2-block--file-storage)
3. [Compute — VMs, Containers, Serverless](#3-compute--vms-containers-serverless)
4. [Kubernetes — EKS / GKE / AKS](#4-kubernetes--eks--gke--aks)
5. [Relational Databases](#5-relational-databases)
6. [NoSQL — Wide-Column, Document, Key-Value](#6-nosql--wide-column-document-key-value)
7. [Caching](#7-caching)
8. [Analytics Warehouses & Data Lakes](#8-analytics-warehouses--data-lakes)
9. [Messaging & Eventing](#9-messaging--eventing)
10. [Networking, CDN & DNS](#10-networking-cdn--dns)
11. [AI / ML Platforms & LLM APIs](#11-ai--ml-platforms--llm-apis)
12. [Identity, Secrets & Security](#12-identity-secrets--security)
13. [Observability](#13-observability)
14. [Which Tool When — Decision Table](#14-which-tool-when--decision-table)
15. [Mapping to This Repo's Designs](#15-mapping-to-this-repos-designs)
16. [Key Takeaways](#16-key-takeaways)
17. [Hidden Tips & Tricks](#17-hidden-tips--tricks)
18. [Do's & Don'ts](#18-dos--donts)

</details>

---

## 1. Object Storage & Archive Tiers (S3 / GCS / Blob)

The backbone primitive: infinite, 11-nines-durable blob storage with lifecycle tiering.

| Need | AWS | GCP | Azure |
| :--- | :--- | :--- | :--- |
| Standard object store | S3 Standard | Cloud Storage Standard | Blob Storage Hot |
| Infrequent access | S3 Standard-IA / One-Zone-IA | Nearline / Coldline | Cool |
| Archive (cheap, slow) | S3 Glacier Instant / Flexible | Archive | Cold / Archive |
| Deep archive | S3 Glacier Deep Archive (~$1/TB-mo) | Archive | Archive |
| Requester-pays / egress partner | S3 | Cloud Storage | Blob |
| Eventing on change | S3 Event Notifications → SQS/Lambda | Pub/Sub notifications | Event Grid |

```bash
# AWS: lifecycle to archive + instant restore semantics
aws s3api put-bucket-lifecycle-configuration --bucket media --lifecycle-configuration '{
  "Rules": [{"ID":"tier","Status":"Enabled","Filter":{"Prefix":"videos/"},
    "Transitions":[{"Days":30,"StorageClass":"STANDARD_IA"},
                   {"Days":90,"StorageClass":"GLACIER_IR"},
                   {"Days":365,"StorageClass":"DEEP_ARCHIVE"}]}]}'
```

**Use it when:** video/image/blob workloads (Netflix, YouTube, file-storage designs), data-lake floors (Route IQ's Delta tables), snapshot targets (ES searchable snapshots, Postgres PITR). Archive tiers trade retrieval time (minutes–hours) and retrieval cost for ~10–20× cheaper storage — perfect for compliance video, never for hot reads. See `system-design-file-storage.md`, `system-design-netflix.md`.

---

## 2. Block & File Storage

| Need | AWS | GCP | Azure |
| :--- | :--- | :--- | :--- |
| Block (disk for VMs) | EBS (gp3/io2) | Persistent Disk / Hyperdisk | Managed Disk (Premium/Ultra) |
| Shared POSIX file system | EFS | Filestore | Azure Files |
| High-performance parallel FS | FSx for Lustre | Filestore High Scale | Azure HPC Cache |
| NVMe-local (ephemeral) | Instance store / i-series | Local SSD | Local (ephemeral) disks |

**Use it when:** EBS/PD for databases (IOPS provisioning on io2/Ultra), EFS/Filestore for shared app state, local NVMe for LSM-heavy engines (Kafka, ClickHouse, TSDB head blocks). Remember: local disks die with the VM — replication (Kafka ISR, Cassandra RF) or snapshotting is mandatory.

---

## 3. Compute — VMs, Containers, Serverless

| Need | AWS | GCP | Azure |
| :--- | :--- | :--- | :--- |
| VMs | EC2 | Compute Engine | Virtual Machines |
| Containers (own orchestration) | ECS / EKS | GKE (+ Autopilot) | AKS / Container Apps |
| Serverless containers | Fargate / App Runner | Cloud Run | Container Apps |
| Functions (FaaS) | Lambda | Cloud Functions (gen2) | Azure Functions |
| Spot/batch | Spot Fleet / Batch | Spot VMs / Batch | Spot VMs / Batch |

**Use it when:** ECS/Fargate if you want containers without Kubernetes complexity; EKS/GKE/AKS for standardized ops and portability (§4); Lambda/Cloud Run for spiky, event-driven, scale-to-zero work (see `system-design-serverless.md` for what you'd be building by hand); Batch/Spot for Spark pipelines (Route IQ cleaning jobs, ML training).

---

## 4. Kubernetes — EKS / GKE / AKS

| Dimension | AWS EKS | GCP GKE | Azure AKS |
| :--- | :--- | :--- | :--- |
| Control plane | Managed, per-cluster $0.10/h | Managed, Autopilot mode bills per-pod | Managed, free control plane tier |
| Differentiator | Deepest AWS integration (IRSA, ALB controller) | **Autopilot** (fully managed nodes), best-in-class networking | Best AD/Arc integration, free tier |
| Node auto-provisioning | Karpenter (open source, very fast) | NAP (built into Autopilot) | Cluster Autoscaler / NAP (Karpenter preview) |
| Upgrade cadence | You drive, standard vs extended support | Autopilot handles most | You drive, LTS channels |
| When to pick | Already AWS-heavy, IAM-centric | Want least Kubernetes ops burden | Microsoft-shop, hybrid with Arc |

```bash
# EKS: pod gets AWS permissions without secrets (IRSA)
eksctl create iamserviceaccount --cluster prod --name s3-reader \
  --attach-policy-arn arn:aws:iam::123:policy/readonly-s3 --approve
# GKE Autopilot: just deploy — nodes, sizing, scaling are managed
kubectl apply -f deployment.yaml   # cluster was created with --enable-autopilot
```

**Use it when:** you run many microservices with HPA/KEDA autoscaling, sidecars, and GitOps (ArgoCD — the code-deployment design). For 1–3 services, ECS/Fargate or Cloud Run is cheaper ops-wise. Every "Scaling Tiers" table in this repo assumes one of these runtimes.

---

## 5. Relational Databases

| Need | AWS | GCP | Azure |
| :--- | :--- | :--- | :--- |
| Managed MySQL/Postgres | RDS | Cloud SQL | Azure Database for PostgreSQL/MySQL |
| High-performance Postgres | Aurora PostgreSQL | AlloyDB | Azure Flexible Server (Premium) |
| Scale-out relational | Aurora (up to 15 replicas) | AlloyDB + columnar engine | Hyperscale (Citus) |
| Global | Aurora Global Database | Cloud SQL cross-region replicas | Cosmos DB for PostgreSQL |

```sql
-- RDS/Aurora: the Postgres dialect from postgresql-features.md applies as-is
SELECT count(*) FROM orders WHERE created_at > now() - interval '1 hour';
```

**Use it when:** the default choice for transactional systems (payments, orders, calendars — every "PostgreSQL" in this repo's diagrams). Aurora/AlloyDB when you need replicas beyond ~5 with faster failover; Citus/Hyperscale when sharding Postgres but keeping SQL (e-commerce order tables). PITR and read replicas are table stakes everywhere.

---

## 6. NoSQL — Wide-Column, Document, Key-Value

| Need | AWS | GCP | Azure |
| :--- | :--- | :--- | :--- |
| Document DB | **DocumentDB** (Mongo-compatible) | **Firestore** (serverless doc) | **Cosmos DB** (multi-API) |
| Mongo wire-compatible | DocumentDB | (MongoDB Atlas on GCP) | Cosmos DB for MongoDB |
| Wide-column / Dynamo-style | **DynamoDB** | Bigtable | Cosmos DB (Table/Cassandra API) |
| Managed MongoDB (native) | MongoDB Atlas on AWS | MongoDB Atlas on GCP | MongoDB Atlas on Azure |
| Key-value cache-first | DynamoDB DAX | Memorystore | Table Storage |

```javascript
// DynamoDB single-table access pattern (key-value-store design)
await ddb.query({ TableName: "orders", KeyConditionExpression: "pk = :u AND begins_with(sk, :o)",
  ExpressionAttributeValues: { ":u": { S: "user#42" }, ":o": { S: "order#" } } });
```

**Use it when:** DynamoDB/Bigtable/Cosmos for write-heavy, partition-keyed systems (telemetry, carts, session stores, IRCTC-style booking with high write fan-in). Firestore for mobile-first apps with offline sync. For Mongo-shaped workloads, Atlas (native) usually beats the API-compatible emulators on feature parity — see `mongodb-features.md` §9 for why replica-set semantics matter.

---

## 7. Caching

| Need | AWS | GCP | Azure |
| :--- | :--- | :--- | :--- |
| Managed Redis | ElastiCache (Redis OSS/Valkey) | Memorystore for Redis | Azure Managed Redis |
| Managed Memcached | ElastiCache Memcached | — | — |
| Redis Enterprise features | ElastiCache for Redis (cluster mode) | Memorystore for Redis Cluster | Azure Cache for Redis (Enterprise) |
| Serverless edge cache | CloudFront Functions | Media CDN | CDN rules engine |

**Use it when:** every "Redis" box in this repo's diagrams — ElastiCache/Memorystore/Azure Cache are the managed forms (`redis-features.md` covers the engine itself). Cluster mode when >~25GB or >100K ops/s; Sentinel-style replication for HA. Memcached only for dead-simple string caching with no persistence needs.

---

## 8. Analytics Warehouses & Data Lakes

| Need | AWS | GCP | Azure |
| :--- | :--- | :--- | :--- |
| Data warehouse | Redshift | BigQuery | Synapse / Fabric |
| Data lake format | S3 + Iceberg | BigLake (Iceberg) | ADLS + Delta/Iceberg |
| Lakehouse processing | EMR (Spark) | Dataproc | Databricks / Fabric Spark |
| Stream analytics | Kinesis Analytics / Flink on EMR | Dataflow (Beam) | Stream Analytics |
| ClickHouse-style OLAP | Redshift Serverless | BigQuery | Synapse SQL |

```sql
-- BigQuery: pay per column scanned — partition + cluster or go broke
SELECT user_id, sum(amount) FROM prod.orders
WHERE _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
GROUP BY user_id;
```

**Use it when:** BigQuery is the least-ops warehouse (serverless, per-query billing); Redshift/Synapse when you want reserved-capacity economics. Spark-on-EMR/Dataproc/Databricks is the Route IQ pattern (mapInPandas over Delta/Iceberg tables). All three feed the offline training loop in `system-design-recommendation-system.md`.

---

## 9. Messaging & Eventing

| Need | AWS | GCP | Azure |
| :--- | :--- | :--- | :--- |
| Kafka (managed) | MSK | Managed Kafka (recently GA) | Event Hubs (Kafka protocol) |
| Simple queue | **SQS** (standard + FIFO) | Pub/Sub (pull/push) | Service Bus Queues |
| Pub/Sub topics | SNS | Pub/Sub | Event Grid / Service Bus Topics |
| RabbitMQ-compatible | Amazon MQ | — (RabbitMQ on GKE/Cloud Run) | — (or CloudAMQP partner) |
| Streaming + replay | Kinesis Data Streams | Pub/Sub (with ordering keys) | Event Hubs Capture |

```bash
# SQS: the "dumb queue" that just works — visibility timeout = lease
aws sqs send-message --queue-url tasks --message-body '{"job":"render","id":"7"}' \
  --message-deduplication-id 7 --message-group-id renders   # FIFO variant
```

**Use it when:** SQS/Pub/Sub/Service Bus for work queues (jobs, emails, webhooks); MSK/Event Hubs/managed-Kafka for event streaming with replay (event backbone in every architecture diagram here); Amazon MQ when you need actual RabbitMQ/ActiveMQ semantics — see `rabbitmq-features.md` §12 for the Kafka-vs-RabbitMQ decision and `kafka-features.md` for the streaming side.

---

## 10. Networking, CDN & DNS

| Need | AWS | GCP | Azure |
| :--- | :--- | :--- | :--- |
| VPC | VPC | VPC | VNet |
| DNS | Route 53 | Cloud DNS | Azure DNS |
| CDN | CloudFront | Cloud CDN / Media CDN | Azure Front Door / CDN |
| L7 load balancer | ALB | Global External LB (HTTPS) | Application Gateway / Front Door |
| L4 load balancer | NLB | External Passthrough LB | Load Balancer (Standard) |
| API management | API Gateway + (AppSync for GraphQL) | Apigee / API Gateway | API Management |
| Private service link | PrivateLink | Private Service Connect | Private Link |

**Use it when:** CloudFront/Cloud CDN/Front Door in front of every "CDN" box in this repo's diagrams; ALB-class L7 LBs with WAF for the "WAF / API Gateway" tier; PrivateLink/PSC to keep S3/databases off the public internet. Route 53 latency-based routing + health checks = the global entry point of every multi-tier design.

---

## 11. AI / ML Platforms & LLM APIs

| Need | AWS | GCP | Azure |
| :--- | :--- | :--- | :--- |
| Model training/serving platform | SageMaker | Vertex AI | Azure ML |
| Managed LLM APIs | Bedrock (Claude, Llama, Nova…) | Vertex AI Model Garden (Gemini…) | Azure OpenAI (GPT…) |
| Vector store | Aurora pgvector / OpenSearch / S3 Vectors | Vertex Vector Search / pgvector | AI Search (vectors) |
| Embeddings API | Bedrock / Titan | Vertex Embeddings | Azure OpenAI embeddings |
| Notebooks/GPUs | SageMaker Studio / EC2 P/G | Colab Enterprise / A100 pools | ML Studio / NC-series |

**Use it when:** Bedrock/Vertex/Azure OpenAI for LLM features without owning inference; SageMaker/Vertex/AML for custom training; pgvector inside managed Postgres for "good enough" RAG below ~10M vectors, dedicated vector search beyond (see `agentic-ai-features.md` and `system-design-llm-inference.md` for the self-hosted path).

---

## 12. Identity, Secrets & Security

| Need | AWS | GCP | Azure |
| :--- | :--- | :--- | :--- |
| IAM | IAM (users/roles/policies) | IAM (bindings/conditions) | Entra ID + RBAC |
| Workload identity (no keys) | IRSA / Instance profiles | Workload Identity Federation | Managed Identities |
| Secrets | Secrets Manager / Parameter Store | Secret Manager | Key Vault |
| KMS | KMS | Cloud KMS | Key Vault (keys) |
| WAF | AWS WAF | Cloud Armor | Front Door WAF |
| DDoS | Shield | Cloud Armor | DDoS Protection |

**Use it when:** workload identity everywhere — never long-lived keys in code (the #1 cloud security finding); Secrets Manager/KMS for the credential layer every design's "Security" section assumes; WAF at the edge (the "WAF / API Gateway" component).

---

## 13. Observability

| Need | AWS | GCP | Azure |
| :--- | :--- | :--- | :--- |
| Metrics/logs | CloudWatch | Cloud Monitoring/Logging | Monitor / Log Analytics |
| Tracing | X-Ray | Cloud Trace (OpenTelemetry native) | Application Insights |
| Managed Prometheus/Grafana | Amazon Managed Prometheus | GMP (Google Managed Prometheus) | Azure Managed Grafana |

**Use it when:** OpenTelemetry SDKs from day one — then CloudWatch/GMP/App Insights become backends you can swap (see `system-design-concepts.md` §38 and the alerting design for the architecture these plug into).

---

## 14. Which Tool When — Decision Table

| Requirement | Reach for | Avoid |
| :--- | :--- | :--- |
| Files/media with 11-nines | S3/GCS/Blob standard | EBS, filesystems |
| Compliance video kept 7 years | Glacier Deep Archive / Archive tier | Standard-IA (10× cost) |
| Postgres with HA + PITR | RDS/Cloud SQL/Flexible | Self-managed on VMs |
| Write 100K rows/s keyed by device | DynamoDB/Bigtable/Cosmos | Postgres without sharding |
| Hot cache < 5ms | ElastiCache/Memorystore | DynamoDB DAX only for item-cache |
| 50K background jobs/min | SQS FIFO / Pub/Sub | Lambda recursion "queues" |
| Event log, replay for 7 days | Kinesis/Event Hubs/Pub/Sub | SQS (delete-on-read) |
| 5 microservices, no k8s team | ECS Fargate / Cloud Run / Container Apps | EKS "because resume" |
| 50+ microservices, HPA + GitOps | EKS / GKE Autopilot / AKS | One giant EC2 fleet |
| Spark over petabytes weekly | EMR/Dataproc/Databricks + Delta/Iceberg | Lambda chunk-processing |
| LLM feature in one sprint | Bedrock/Vertex/Azure OpenAI | Self-hosting vLLM day one |
| RAG under 10M vectors | pgvector in managed Postgres | Dedicated vector DB + ops burden |

---

## 15. Mapping to This Repo's Designs

| Design doc | Cloud pieces it implies |
| :--- | :--- |
| `system-design-file-storage.md` | S3/GCS/Blob + lifecycle tiers + CloudFront |
| `system-design-alerting.md` | Managed Prometheus + object-store TSDB blocks |
| `system-design-netflix.md` / `youtube.md` | S3 + Glacier tiers + Media CDN + transcoding fleet |
| `system-design-ecommerce.md` | RDS/Aurora + ElastiCache + SQS/MSK + CloudFront |
| `system-design-key-value-store.md` | DynamoDB (the doc literally designs it) |
| `system-design-route-reconstruction.md` | EMR/Dataproc Spark + S3 Delta + OSRM on EKS |
| `system-design-llm-inference.md` | GPU node pools on EKS/GKE/AKS + S3 model weights |
| `agentic-ai-features.md` | Bedrock/Vertex/Azure OpenAI + pgvector + Lambda/FaaS |
| `system-design-code-deployment.md` | EKS + ArgoCD + ECR + CodeBuild-class CI |

---

## 16. Key Takeaways

1. **Learn primitives, not consoles** — object store, managed PG, queue, k8s, CDN exist on all three clouds with different names
2. **Tiers are the cost lever** — S3 IA/Glacier, Blob Cool/Archive: 10–20× storage savings for patience
3. **Managed first** — DynamoDB/SQS/BigQuery eliminate ops you'd otherwise own; self-host Kafka/Cassandra only when the managed form's limits bind
4. **Workload identity, never keys** — IRSA / Workload Identity Federation / Managed Identities
5. **Kubernetes is a commitment** — EKS/GKE/AKS pay off at scale; below that pick Fargate/Cloud Run/Container Apps
6. **Egress is the hidden bill** — multi-cloud looks cheap until data crosses providers
7. Related guides: `postgresql-features.md`, `redis-features.md`, `kafka-features.md`, `mongodb-features.md`, `elasticsearch-features.md`, `rabbitmq-features.md`, `agentic-ai-features.md`

## 17. Hidden Tips & Tricks

**1. Egress is the silent bill.** ~$90/TB out of AWS — a "cheap" $50 EC2 box streaming 5 TB/month is a $500 mistake. CDN egress is usually cheaper than raw origin egress; architect the bytes path before the compute.

**2. Cross-AZ traffic costs money *both* ways.** Chatty microservices spread across AZs can out-bill the compute running them. AZ-aware routing isn't just latency hygiene, it's line-item savings.

**3. One NAT Gateway = cross-AZ charges + a single point of failure.** Per-AZ NAT costs more upfront and less at scale — and survives an AZ outage.

**4. Spot isn't a discount, it's a contract: eviction with 2 minutes' notice.** Stateless, checkpointable, or shard-replicated workloads take the 60–90% off; anything stateful needs the eviction path *designed* (drain, checkpoint, rebalance).

**5. Object storage pricing is request-shaped, not just byte-shaped.** Millions of small GET/PUTs can out-bill the storage itself — batch, compress, cache at the edge; tier cold data (S3 Glacier ↔ GCS Archive ↔ Azure Archive) *with* the retrieval-cost table in hand.

**6. DR doesn't replicate by default.** Most managed services are regional — cross-region replication is an explicit enable per service (S3 CRR, Aurora Global, geo-DR). The first DR drill is where you learn which ones you forgot.

## 18. Do's & Don'ts

| ✅ Do | ❌ Don't |
| :--- | :--- |
| Budget egress before architecture; use CDNs for repeated bytes | Don't discover the egress line item on the first invoice |
| Spread NAT gateways per AZ; keep traffic AZ-local where possible | Don't funnel a whole region through one NAT Gateway |
| Use spot for stateless/checkpointable work with drain paths | Don't run an unreplicated stateful primary on spot instances |
| Tier cold data to archive classes deliberately (with retrieval costs) | Don't leave 500 TB of once-a-year data in Standard "just in case" |
| Enable cross-region replication explicitly per service; drill the DR runbook | Don't assume "it's in the cloud" means it survived a region outage |
| Tag everything (owner, cost-center, env) from day one | Don't build cost allocation as a forensic archaeology project later |
