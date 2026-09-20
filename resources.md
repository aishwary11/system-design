<div align="center">

# System Design Resources — Curated Articles, Repos & Papers

</div>

A curated map of the best **GitHub repositories, engineering-blog deep dives, Medium articles, interview platforms, and classic papers** — each entry says *what it teaches* and *which doc in this repo it pairs with*. Modern-first: AI-era design resources sit alongside the classics.

**In one line:** this repo gives you the designs; this file tells you where to go deeper for every topic — and which "modern solution" each source represents.

---

## Table of Contents

<details>
<summary><b>📑 Jump to a section</b></summary>

1. [GitHub Repositories — The Canon](#1-github-repositories--the-canon)
2. [Engineering Blog Deep Dives (by topic)](#2-engineering-blog-deep-dives-by-topic)
3. [Medium & Newsletter Articles Worth Reading](#3-medium--newsletter-articles-worth-reading)
4. [Interview Platforms & Courses](#4-interview-platforms--courses)
5. [Classic Papers Every Engineer Should Read](#5-classic-papers-every-engineer-should-read)
6. [AI-Era Design Resources (LLM/Agents/RAG)](#6-ai-era-design-resources-llmagentsrag)
7. [Topic → Best Modern Resource Map](#7-topic--best-modern-resource-map)
8. [How to Use This List](#8-how-to-use-this-list)

</details>

---

## 1. GitHub Repositories — The Canon

| Repo | What it is | Pair with |
| :--- | :--- | :--- |
| [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | Most-starred prep repo: topic summaries (CAP, sharding, caching, proxies), worked solutions, back-of-envelope appendix, Anki flashcards | `system-design-concepts.md` |
| [ByteByteGoHq/system-design-101](https://github.com/ByteByteGoHq/system-design-101) | Visual explanations of protocols, DB internals, caching, consensus — one giant illustrated walkthrough | every design doc's diagram sections |
| [ashishps1/awesome-system-design-resources](https://github.com/ashishps1/awesome-system-design-resources) | Best-organized per-topic link collection: concepts, easy/medium/hard questions with videos, must-read articles + papers | this file's structure mirrors it |
| [karanpratapsingh/system-design](https://github.com/karanpratapsingh/system-design) | A full free course in repo form: fundamentals → primitives → real-world designs, well-written prose | the whole repo, as a companion textbook |
| [InterviewReady/system-design-resources](https://github.com/InterviewReady/system-design-resources) | Curated papers + engineering blogs with diagrams | §2 and §5 below |
| [madd86/awesome-system-design](https://github.com/madd86/awesome-system-design) | The original awesome-list: videos, articles, books | broad browsing |
| [ombharatiya/ai-system-design-guide](https://github.com/ombharatiya/ai-system-design-guide) | Continuously-updated AI system design: RAG architectures, LLM engineering, agentic AI, MCP/A2A | `agentic-ai-features.md`, `system-design-llm-inference.md` |
| [alexeygrigorev/ai-engineering-field-guide](https://github.com/alexeygrigorev/ai-engineering-field-guide) | Practical AI engineering incl. the emerging "AI system design" interview category | `agentic-ai-features.md` §10 |

---

## 2. Engineering Blog Deep Dives (by topic)

The articles where companies explain what they actually shipped — read these like papers.

### Messaging & Chat
| Article | Teaches | Pair with |
| :--- | :--- | :--- |
| [How Discord stores trillions of messages](https://discord.com/blog/how-discord-stores-trillions-of-messages) | Cassandra data modeling, time-bucketing, TTL compaction | `system-design-discord.md`, `system-design-messaging-app.md` |
| [How Discord Scaled Elixir to 5,000,000 Concurrent Users](https://discord.com/blog/how-discord-scaled-elixir-to-5000000-concurrent-users) | BEAM processes, fan-out at millions of WS sessions | `system-design-discord.md` §3 |
| [Real-time Messaging at Slack](https://slack.engineering/real-time-messaging/) | WebSocket fleets, message ordering, reconnect semantics | `system-design-messaging-app.md` |
| [Slack flannel: application-level edge cache](https://slack.engineering/flannel-an-application-level-edge-cache-to-make-slack-scale/) | Edge fan-out layer in Go, connection ownership | `system-design-discord.md` hierarchical fan-out |

### Feeds & Social
| Article | Teaches | Pair with |
| :--- | :--- | :--- |
| [Instagram: background jobs with Redis](https://instagram-engineering.com/improving-performance-of-background-jobs-with-redis-24f4d75b5bd0) | fan-out economics, Redis job queues | `system-design-instagram.md`, `system-design-twitter.md` |
| [Twitter: timeline scaling](https://blog.x.com/engineering/en_us/topics/infrastructure/2023/timeline-scaling) | hybrid fan-out, Redis clusters | `system-design-twitter.md` |

### Payments & Money
| Article | Teaches | Pair with |
| :--- | :--- | :--- |
| [Stripe's payments APIs — the first ten years](https://stripe.com/blog/payment-api-design) | API design as product, idempotency keys, versioning discipline | `system-design-payment-system.md` |
| [Airbnb: avoiding double payments](https://medium.com/airbnb-engineering/avoiding-double-payments-in-a-distributed-payments-system-2981f6b070bb) | idempotency + reconciliation as the money-safety pattern | `system-design-payment-system.md` §7 |

### Storage, Data & Streams
| Article | Teaches | Pair with |
| :--- | :--- | :--- |
| [Canva: 50M uploads/day](https://www.canva.dev/blog/engineering/from-zero-to-50-million-uploads-per-day-scaling-media-at-canva/) | S3 multipart, presigned URLs, queue-based ingestion | `system-design-file-storage.md` |
| [Netflix: building in-video search](https://netflixtechblog.com/building-in-video-search-936766f0017c) | embeddings + multimodal retrieval pipelines | `system-design-search-engine.md`, `system-design-recommendation-system.md` |
| [Uber: H3 hexagonal spatial index](https://www.uber.com/blog/h3-a-hexagonal-hierarchical-spatial-index/) | why hexagons beat squares for geo | `system-design-route-reconstruction.md`, `system-design-proximity-service.md` |
| [Cloudflare: HTTP analytics for 6M req/s on ClickHouse](https://blog.cloudflare.com/http-analytics-for-6m-requests-per-second-using-clickhouse/) | high-cardinality analytics on commodity hardware | `system-design-alerting.md`, `system-design-google-ads.md` analytics tier |

### Platform & Infra
| Article | Teaches | Pair with |
| :--- | :--- | :--- |
| [GitHub Actions: CI for monorepos](https://github.blog/2019-08-08-continuous-integration-solutions-for-monorepos/) | CI at monorepo scale | `devops-features.md`, `system-design-code-deployment.md` |
| [Zepto: Route IQ — reconstructing delivery paths from noisy GPS](https://blog.zepto.com/route-iq-how-we-reconstruct-delivery-paths-from-noisy-gps-at-scale-6898d3260ed2) | anomaly scoring → Kalman → OSRM → HMM consensus (this repo's doc is built from it) | `system-design-route-reconstruction.md` |

---

## 3. Medium & Newsletter Articles Worth Reading

| Article | Why |
| :--- | :--- |
| [System Design was HARD until I learned these 30 concepts (AlgoMaster)](https://blog.algomaster.io/p/30-system-design-concepts) | fastest concept sweep before reading this repo |
| [System Design: Top 15 Trade-offs (AlgoMaster)](https://blog.algomaster.io/p/system-design-top-15-trade-offs) | the trade-off muscle every doc's §11 exercises |
| [Ultimate System Design Interview Guide for 2026 (Fahim ul Haq)](https://medium.com/@fahimulhaq/ultimate-system-design-interview-guide-for-2025-c5dfa0ca6557) | what interviewers actually score |
| [The Only Pattern-Based Reading List (DesignGurus)](https://designgurus.substack.com/p/the-only-system-design-interview) | study by *pattern*, not by problem — the basis of this repo's topic audit |
| [ByteByteGo vs Educative vs DesignGurus (2026)](https://medium.com/@mockingbird_71808/bytebytego-vs-educative-vs-design-gurus-best-interview-prep-platform-for-2026-5966cc526442) | picking your prep platform |
| [Martin Kleppmann: How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) | the fencing-token argument — required before `system-design-distributed-lock-manager.md` |
| [Consensus in Distributed Systems](https://medium.com/@sourabhatta1819/consensus-in-distributed-system-ac79f8ba2b8c) | Raft/Paxos intuition |
| [Gossip Protocol Explained (High Scalability)](http://highscalability.com/blog/2023/7/16/gossip-protocol-explained.html) | epidemic dissemination |
| [8 Must-Read Company Blog Posts (Uber, Discord, Notion, Anthropic)](https://medium.com/@vaishnavikale/8-must-read-company-blog-posts-from-uber-discord-notion-and-anthropic-deep-dives-into-scale-df2babcfa7f3) | a taste of the deep-dive genre |
| [How DNS actually works (AlgoMaster)](https://blog.algomaster.io/p/how-dns-actually-works) | pairs with concepts §50 |
| [Proxy vs Reverse Proxy (AlgoMaster)](https://blog.algomaster.io/p/proxy-vs-reverse-proxy-explained) | the gateway story |
| [Load Balancing Algorithms with code (AlgoMaster)](https://blog.algomaster.io/p/load-balancing-algorithms-explained-with-code) | pairs with concepts §13 |
| [15 Types of Databases (AlgoMaster)](https://blog.algomaster.io/p/15-types-of-databases) | choosing stores per workload |

---

## 4. Interview Platforms & Courses

| Platform | Strength |
| :--- | :--- |
| [Hello Interview](https://www.hellointerview.com/) | free staff-level writeups of every classic question; interactive guided practice |
| [ByteByteGo](https://bytebytego.com/) | Alex Xu's books + courses; the canonical visual system-design library |
| [DesignGurus (Grokking)](https://www.designgurus.io/) | pattern-based walkthroughs |
| [Educative Grokking](https://www.educative.io/courses/grokking-the-system-design-interview) | text-based classic |
| [System Design Handbook](https://www.systemdesignhandbook.com/) | free reference incl. generative-AI design guide |
| [Exponent 2026 guide](https://www.tryexponent.com/blog/system-design-interview-guide) | interview mechanics + rubric |
| [iGotAnOffer: GenAI system design](https://igotanoffer.com/en/advice/generative-ai-system-design-interview) | the AI-era interview variant |
| YouTube: [System Design Interview](https://www.youtube.com/@SystemDesignInterview), [ByteByteGo](https://www.youtube.com/@ByteByteGo), [Gaurav Sen](https://www.youtube.com/@gkcs), [codeKarle](https://www.youtube.com/@codeKarle) | watch-along walkthroughs of the exact questions in this repo |

---

## 5. Classic Papers Every Engineer Should Read

| Paper | Year | Teaches | Pair with |
| :--- | :--- | :--- | :--- |
| [Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) | 2007 | consistent hashing, quorum, vector clocks, hinted handoff | `system-design-key-value-store.md` |
| [The Google File System](https://static.googleusercontent.com/media/research.google.com/en//archive/gfs-sosp2003.pdf) | 2003 | chunked storage, replication, append semantics | `system-design-file-storage.md` |
| [MapReduce](https://research.google.com/archive/mapreduce-osdi04.pdf) | 2004 | batch computation over distributed data | `system-design-route-reconstruction.md` (Spark lineage) |
| [Bigtable](https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf) | 2006 | wide-column storage, LSM lineage | `system-design-concepts.md` §32 |
| [Spanner](https://static.googleusercontent.com/media/research.google.com/en//archive/spanner-osdi2012.pdf) | 2012 | TrueTime, global consistency | `system-design-concepts.md` §29 |
| [Kafka paper](https://notes.stephenholiday.com/Kafka.pdf) | 2011 | the log abstraction | `kafka-features.md` |
| [ZooKeeper: Wait-free coordination](https://www.usenix.org/legacy/event/usenix10/tech/full_papers/Hunt.pdf) | 2010 | coordination service design | `system-design-distributed-lock-manager.md` |
| [The Chubby lock service](https://research.google/pubs/pub27879/) | 2006 | locks, leases, sessions | `system-design-distributed-lock-manager.md` |
| [Paxos Made Simple](https://lamport.azurewebsites.net/pubs/paxos-simple.pdf) | 2001 | consensus | `system-design-concepts.md` §23 |
| [The Log-Structured Merge-Tree](https://www.cs.umb.edu/~poneil/lsmtree.pdf) | 1996 | LSM storage engines | `system-design-concepts.md` §32 |
| [Raft: In Search of an Understandable Consensus Algorithm](https://raft.github.io/raft.pdf) | 2014 | the consensus you can explain in an interview | `system-design-concepts.md` §23 |
| [CRDTs: Conflict-free Replicated Data Types](https://hal.inria.fr/file/index/docid/555588/filename/techreport.pdf) | 2011 | mergeable state | `system-design-google-docs.md`, `system-design-concepts.md` §25 |

---

## 6. AI-Era Design Resources (LLM/Agents/RAG)

| Resource | What it covers | Pair with |
| :--- | :--- | :--- |
| [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol) | the tool-integration standard + server catalog | `agentic-ai-features.md` §3 |
| [Agent2Agent (A2A) protocol](https://github.com/a2aproject/A2A) | agent discovery cards, task lifecycle | `agentic-ai-features.md` §4 |
| [Anthropic: Building effective agents](https://www.anthropic.com/research/building-effective-agents) | workflows vs agents, when NOT to add agency | `agentic-ai-features.md` §8 |
| [OpenAI: A practical guide to building agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf) | orchestration + guardrails playbook | `agentic-ai-features.md` §9 |
| [LangGraph docs](https://langchain-ai.github.io/langgraph/) | graph-based agent orchestration | `agentic-ai-features.md` §8 |
| [ombharatiya/ai-system-design-guide](https://github.com/ombharatiya/ai-system-design-guide) | RAG architectures, LLM engineering, evals — continuously updated | `agentic-ai-features.md` (whole) |
| [System Design Handbook: GenAI guide](https://www.systemdesignhandbook.com/guides/generative-ai-system-design-interview/) | 9-step GenAI design framework | `system-design-llm-inference.md` |
| [Chip Huyen: Designing Machine Learning Systems](https://huyenchip.com/machine-learning-systems-design/toc.html) | the ML-systems canon (feature stores, training loops) | `system-design-recommendation-system.md` |
| [vLLM docs](https://docs.vllm.ai/en/latest/) | PagedAttention, continuous batching — the serving stack | `system-design-llm-inference.md` |
| [OpenTelemetry GenAI conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) | tracing LLM calls as first-class telemetry | `agentic-ai-features.md` §10 |

---

## 7. Topic → Best Modern Resource Map

The single table to consult before an interview: each row = a topic this repo covers, the *modern* source that goes deepest, and the local doc.

| Topic | Best deep source | Local doc |
| :--- | :--- | :--- |
| URL shortener | Hello Interview: TinyURL breakdown | `system-design-url-shortener.md` |
| Rate limiter | AlgoMaster: algorithms with code | `system-design-rate-limiter.md` |
| Feed design | Twitter timeline scaling | `system-design-twitter.md` |
| Chat at scale | Discord: trillions of messages | `system-design-discord.md` |
| Collaborative editing | Figma: realtime editing of ordered sequences | `system-design-google-docs.md` |
| Payments | Stripe API design | `system-design-payment-system.md` |
| Distributed locking | Kleppmann: how to do distributed locking | `system-design-distributed-lock-manager.md` |
| Geo systems | Uber H3 | `system-design-uber.md`, `system-design-route-reconstruction.md` |
| Search | Netflix in-video search | `system-design-search-engine.md` |
| Recommendations | Chip Huyen's MLSys book | `system-design-recommendation-system.md` |
| LLM serving | vLLM docs | `system-design-llm-inference.md` |
| Agents & MCP/A2A | Anthropic effective agents + MCP spec | `agentic-ai-features.md` |
| Cloud services | daily.dev: best engineering blogs 2026 | `cloud.md` |
| DevOps/CI-CD | GitHub Actions docs + `devops-features.md` | `system-design-code-deployment.md` |

---

## 8. How to Use This List

1. **Before an interview week:** read §7 top-to-bottom — one deep source per topic, then the local doc's Key Numbers and Trade-offs.
2. **For depth on one topic:** pick the §2 engineering article + the §5 paper behind it; both, in that order.
3. **For AI-era roles:** §6 is the track — MCP/A2A specs are short and worth reading raw.
4. **To contribute a doc here:** find the topic's deep source in §7, build the design against it, and cite both in the doc's "Deep Dive Prompts".
