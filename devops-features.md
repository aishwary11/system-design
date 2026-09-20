<div align="center">

# DevOps & Kubernetes — Features Guide with Basic Examples

</div>

A quick-reference catalog of the DevOps toolchain behind every design in this repo: containers, Kubernetes objects (pods, deployments, services, probes, HPA, RBAC), CI systems (Jenkins vs GitHub Actions vs GitLab CI), GitOps CD (ArgoCD/Flux), quality gates (SonarQube, Trivy), infrastructure-as-code (Terraform), and observability — each with a small, concrete example.

**DevOps in one line:** make shipping changes **boring** — declarative infrastructure, automated gates on the way in, self-healing runtime on the way out, and observability to prove it all works.

### DevOps toolchain at a glance

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 996 1150" width="900" role="img" aria-label="Devops at a Glance">
<rect x="0.5" y="0.5" width="995" height="1149" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
<title>Devops at a Glance</title>
<rect x="68" y="288" width="824" height="722" rx="14" fill="none" stroke="#cbd5e1" stroke-width="1.3" stroke-dasharray="7 5"/>
<rect x="80" y="296" width="142.4" height="20" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
<text x="151.2" y="310" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" fill="#475569">Delivery Platform</text>
<path d="M480 132 L480 227 L181 227 L181 322" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-devops-at-a-glance)"/>
<path d="M276 353 L385 353" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-devops-at-a-glance)"/>
<path d="M575 353 L684 353" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-devops-at-a-glance)"/>
<path d="M779 384 L779 505 L181 505 L181 626" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-devops-at-a-glance)"/>
<path d="M276 657 L385 657" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-devops-at-a-glance)"/>
<path d="M575 657 L684 657" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-devops-at-a-glance)"/>
<path d="M779 688 L779 809 L330 809 L330 930" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-devops-at-a-glance)"/>
<path d="M235 961 L211 961 L211 712 L480 712 L480 688" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-devops-at-a-glance)"/>
<path d="M425 961 L535 961" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-devops-at-a-glance)"/>
<rect x="396" y="73" width="168" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="396" y="70" width="168" height="62" rx="12" fill="#ecfdf5" stroke="#10b981" stroke-width="1.4"/>
<rect x="399" y="73" width="162" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="480" y="106" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#064e3b">Developer PR</text>
<rect x="86" y="325" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="86" y="322" width="190" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="89" y="325" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="181" y="358" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">CI Pipeline</text>
<rect x="385" y="325" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="385" y="322" width="190" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="388" y="325" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="480" y="358" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Registry</text>
<rect x="684" y="325" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="684" y="322" width="190" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="687" y="325" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="779" y="358" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Quality Gates</text>
<rect x="86" y="629" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="86" y="626" width="190" height="62" rx="12" fill="#fff7ed" stroke="#f97316" stroke-width="1.4"/>
<rect x="89" y="629" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="181" y="662" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#7c2d12">GitOps Repo</text>
<rect x="385" y="629" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="385" y="626" width="190" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="388" y="629" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="480" y="662" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">ArgoCD</text>
<rect x="684" y="629" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="684" y="626" width="190" height="62" rx="12" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.4"/>
<rect x="687" y="629" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="779" y="662" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#4c1d95">Kubernetes</text>
<rect x="235" y="933" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="235" y="930" width="190" height="62" rx="12" fill="#eef2ff" stroke="#6366f1" stroke-width="1.4"/>
<rect x="238" y="933" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="330" y="966" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#312e81">Observability</text>
<rect x="535" y="933" width="190" height="62" rx="12" fill="#0f172a" fill-opacity="0.08"/>
<rect x="535" y="930" width="190" height="62" rx="12" fill="#ecfdf5" stroke="#10b981" stroke-width="1.4"/>
<rect x="538" y="933" width="184" height="56" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>
<text x="630" y="966" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="bold" fill="#064e3b">SLOs &amp; Error Budgets</text>
<defs><marker id="arr-devops-at-a-glance" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker><marker id="arrEm-devops-at-a-glance" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#10b981"/></marker></defs>
</svg>

**Interactive diagram:** [diagrams/features/devops-at-a-glance.architecture.html](diagrams/features/devops-at-a-glance.architecture.html) — pan/zoom, search, dark/light theme, PNG/SVG export.

---

## Table of Contents

<details>
<summary><b>📑 Jump to a section</b></summary>

1. [Containers & Images (Docker)](#1-containers--images-docker)
2. [Kubernetes Core — Pods, Deployments, Services](#2-kubernetes-core--pods-deployments-services)
3. [Scheduling & Scaling — Requests, Limits, HPA](#3-scheduling--scaling--requests-limits-hpa)
4. [ConfigMaps, Secrets & RBAC](#4-configmaps-secrets--rbac)
5. [Probes & Self-Healing](#5-probes--self-healing)
6. [Ingress, Service Mesh & Traffic Splitting](#6-ingress-service-mesh--traffic-splitting)
7. [CI — Jenkins vs GitHub Actions vs GitLab CI](#7-ci--jenkins-vs-github-actions-vs-gitlab-ci)
8. [CD & GitOps — ArgoCD / Flux](#8-cd--gitops--argocd--flux)
9. [Quality & Security Gates — SonarQube, Trivy, SAST](#9-quality--security-gates--sonarqube-trivy-sast)
10. [Infrastructure as Code — Terraform](#10-infrastructure-as-code--terraform)
11. [Observability — Prometheus, Grafana, Loki, OpenTelemetry](#11-observability--prometheus-grafana-loki-opentelemetry)
12. [SRE Practice — SLOs, Error Budgets, Postmortems](#12-sre-practice--slos-error-budgets-postmortems)
13. [The Golden Pipeline (Reference Flow)](#13-the-golden-pipeline-reference-flow)
14. [DevOps in This Repo's Designs](#14-devops-in-this-repos-designs)
15. [Key Takeaways](#15-key-takeaways)
17. [Hidden Tips & Tricks](#17-hidden-tips--tricks)
18. [Do's & Don'ts](#18-dos--donts)
16. [Version Matrix (verified September 2026)](#16-version-matrix-verified-september-2026)

</details>

---


## 1. Containers & Images (Docker)

A container packages an app with its dependencies into an isolated, immutable unit. An **image** is a layered template; a **container** is a running instance; layers are cached and shared, which is what makes builds and pulls fast.

```dockerfile
# Multi-stage build: compiler toolchain stays OUT of the final image
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app .
USER node                          # never run as root
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://localhost:3000/healthz || exit 1
CMD ["node", "server.js"]
```

```bash
docker build -t api:1.4.2 .            # tag immutably — deploy tags, never :latest
docker run -p 3000:3000 api:1.4.2
```

Production rules: one process per container; pin base images by digest; scan every image (`trivy image api:1.4.2`); keep images <200 MB (smaller = faster pull = faster scale-out).

## 2. Kubernetes Core — Pods, Deployments, Services

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }   # zero-downtime default
  selector:
    matchLabels: { app: api }
  template:
    metadata:
      labels: { app: api }
    spec:
      containers:
        - name: api
          image: registry.example.com/api:1.4.2
          ports: [{ containerPort: 3000 }]
          resources:
            requests: { cpu: 250m, memory: 256Mi }
            limits:   { cpu: "1",  memory: 512Mi }
---
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector: { app: api }
  ports: [{ port: 80, targetPort: 3000 }]
```

The mental model: a **pod** is the unit of scheduling (containers sharing localhost), a **Deployment** keeps N replicas alive and rolls them forward revision by revision, and a **Service** is the stable virtual IP fronting the ever-changing pod set. `kubectl rollout undo deployment/api` is your panic button — revisions are kept for exactly this.

> **Latest stable (Sep 2026): Kubernetes 1.37** (Aug 2026; 1.34 went EOL Oct 2026 — plan upgrades yearly, 3 releases supported at a time). 1.35 leaned into "Kubernetes as AI's OS" (coordinated placement, DRA maturity). All manifests here use stable APIs and run unmodified on current EKS/GKE/AKS channels.

## 3. Scheduling & Scaling — Requests, Limits, HPA

**Requests** are what the scheduler reserves; **limits** are the ceiling. CPU over-limit → throttled (slow); memory over-limit → OOMKilled (dead).

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: api }
  minReplicas: 3
  maxReplicas: 30
  metrics:
    - type: Pods
      pods:
        metric: { name: http_requests_per_second }   # scale on the signal users feel
        target: { type: AverageValue, averageValue: "500" }
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300                # don't flap down after a spike
```

HorizontalPodAutoscaler scales replica count; the **Cluster Autoscaler / Karpenter** scales nodes when pods are unschedulable; **VPA** recommends (or applies) right-sized requests/limits. Scale on application signals (RPS, queue depth, p99) — CPU is a lagging proxy.

## 4. ConfigMaps, Secrets & RBAC

```yaml
apiVersion: v1
kind: ConfigMap
metadata: { name: api-config }
data:
  LOG_LEVEL: info
---
apiVersion: v1
kind: Secret
metadata: { name: api-secrets }
type: Opaque
stringData:
  DB_PASSWORD: "set-via-sealed-secrets-or-external-secrets"   # never plain git
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: { namespace: prod, name: deployer }
rules:
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "watch", "patch", "update"]
```

Secrets in Git must be encrypted: **SealedSecrets** (asymmetric — only the cluster can decrypt) or the **External Secrets Operator** (sync from Vault/AWS SM/GCP SM). RBAC principle: CI deploys via ServiceAccounts with the *minimum* verbs — a pipeline that can `patch deployments` but not `delete namespaces`.


## 5. Probes & Self-Healing

```yaml
containers:
  - name: api
    startupProbe:                       # slow-boot apps: no other probe fires until this passes
      httpGet: { path: /healthz, port: 3000 }
      failureThreshold: 30
      periodSeconds: 5
    readinessProbe:                     # failed → pod removed from Service endpoints (no traffic)
      httpGet: { path: /readyz, port: 3000 }
      periodSeconds: 5
    livenessProbe:                      # failed → container RESTARTED (use sparingly!)
      httpGet: { path: /healthz, port: 3000 }
      periodSeconds: 10
      timeoutSeconds: 3
```

The rules that prevent the liveness death spiral (see `interview-qa.md` §76): **readiness** checks *can I serve* (dependencies OK, warmed up); **liveness** checks only *is the process wedged* — never probe a database in liveness, or a DB blip restarts your whole fleet; `startupProbe` buys slow boots their own budget.

## 6. Ingress, Service Mesh & Traffic Splitting

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "5"      # 5% to the canary
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend: { service: { name: api-canary, port: { number: 80 } } }
```

An Ingress (nginx/HAProxy/Envoy) is the L7 front door: TLS termination, host/path routing, header-based canary weights. A **service mesh** (Istio/Linkerd) pushes that into per-pod sidecars — mTLS everywhere, retries/outlier ejection, and precise traffic splitting (1→5→25→100%) that canary deployments (Argo Rollouts/Flagger) automate. Rule of thumb: start with ingress only; adopt a mesh when you need mTLS + fine-grained routing across many services, not before — sidecars cost memory and ops maturity.

## 7. CI — Jenkins vs GitHub Actions vs GitLab CI

| | GitHub Actions | Jenkins | GitLab CI |
| :--- | :--- | :--- | :--- |
| **Model** | Hosted runners, YAML in-repo | Self-hosted masters + agents, Groovy pipelines | Built into GitLab, YAML in-repo |
| **Setup cost** | ~zero for small/medium teams | You own patching, plugins, agents | Zero if SCM is GitLab |
| **Strength** | Marketplace of reusable actions; tight GitHub integration | Infinite plugins, on-prem compliance, GPU/self-hosted fleets | `include:` composition, environments, built-in registries |
| **Watch out** | Minutes bills at scale; runner limits | Plugin upgrade pain ("Jenkins avalanche") | Ecosystem smaller than Actions |
| **2026 pattern** | CI (build/test/SAST) | Legacy-integration workhorse | All-in-one GitLab shops |

```yaml
# .github/workflows/ci.yml — the canonical modern CI
name: ci
on: { pull_request: {} }
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint && npm test
      - run: npx sonarqube-scanner -Dsonar.qualitygate.wait=true   # gate on the result
      - run: docker build -t api:${{ github.sha }} .
      - run: trivy image --exit-code 1 --severity CRITICAL,HIGH api:${{ github.sha }}
```

## 8. CD & GitOps — ArgoCD / Flux

GitOps inverts deployment: instead of CI *pushing* to the cluster, an in-cluster controller **pulls** the declared state from Git and reconciles — continuously. The wins: Git is the audit trail; drift is auto-corrected; rollback is `git revert`; deploy credentials never leave the cluster.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout                              # Argo Rollouts: canary as a CRD
metadata: { name: api }
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 5
        - pause: { duration: 5m }          # analysis gates between steps
        - analysis: { templates: [ { templateName: error-rate } ] }
        - setWeight: 25
        - pause: { duration: 5m }
        - setWeight: 100
  selector: { matchLabels: { app: api } }
  template:
    metadata: { labels: { app: api } }
    spec:
      containers: [ { name: api, image: registry.example.com/api:1.4.2 } ]
```

Flow: CI builds + pushes image → CI bumps the tag in the **manifests repo** → ArgoCD syncs → Rollout ramps 5% → analysis (error rate, p99) passes → 100%. Promotion between environments is a PR; rollback is a revert.


## 9. Quality & Security Gates — SonarQube, Trivy, SAST

```yaml
# SonarQube quality gate (configured in UI, enforced in CI)
#   New coverage            >= 80%
#   New duplicated lines    <  3%
#   New security hotspots   =  0  (reviewed)
#   New blocker/critical    =  0
# Fail the PR, not production: -Dsonar.qualitygate.wait=true
```

The shift-left stack, cheapest catch first: **lint/format** (pre-commit) → **SAST** (SonarQube, Semgrep — code patterns) → **dependency scanning** (Dependabot/Snyk — CVEs in libraries) → **image scanning** (Trivy) → **secrets scanning** (gitleaks, so no key ships in a commit) → **DAST** (ZAP against staging). Gates belong on *new* code ("no new blockers") — gating the entire legacy codebase at once just trains people to override the gate.

## 10. Infrastructure as Code — Terraform

```hcl
resource "aws_eks_cluster" "main" {
  name     = "prod-cluster"
  role_arn = aws_iam_role.eks.arn
  vpc_config { subnet_ids = var.subnet_ids }
}

resource "kubernetes_deployment" "api" {
  metadata { name = "api" }
  spec {
    replicas = 3
    selector { match_labels = { app = "api" } }
    template {
      metadata { labels = { app = "api" } }
      spec {
        container {
          image = "registry.example.com/api:1.4.2"
          name  = "api"
        }
      }
    }
  }
}
```

`terraform plan` is the review artifact — every PR shows the exact infra diff before it happens. **State** is the one foot-gun: keep it remote (S3 + DynamoDB locking, or Terraform Cloud), never edit by hand, and split state per environment/component so a bad apply can't nuke everything. Terraform provisions the *platform* (VPC, EKS/GKE/AKS, RDS); Kubernetes manifests (or Helm/Kustomize) run *on* it; ArgoCD reconciles those — three clean layers, no overlap. Modern alternates: Pulumi (real languages), OpenTofu (open-source Terraform fork), Crossplane (infra as Kubernetes CRDs).

## 11. Observability — Prometheus, Grafana, Loki, OpenTelemetry

```yaml
# ServiceMonitor (Prometheus Operator): scrape /metrics every 15s
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata: { name: api }
spec:
  selector: { matchLabels: { app: api } }
  endpoints: [{ port: metrics, interval: 15s }]
```

The three pillars, concretely: **metrics** (Prometheus — cheap to store, great for alerting: RED rates: *rate*, *errors*, *duration* per service), **logs** (Loki — label-indexed, queries like `app="api" | json | level="error"`), **traces** (OpenTelemetry → Tempo/Jaeger — the *why is p99 bad* answer across service hops). Grafana stitches all three into one pane. Alert on **symptoms users feel** (SLO burn rate, §45), never on causes alone ("CPU > 90%" pages nobody).

## 12. SRE Practice — SLOs, Error Budgets, Postmortems

- **SLI** the measurement (p99 latency, success rate); **SLO** the target (99.9%); **error budget** the allowed failure (0.1% = 43 min/month).
- Burn-rate alerting: page when 5% of the 30-day budget burns in 1h (fast) *or* 10% in 6h (slow) — no static thresholds.
- Budget spent → feature work pauses, reliability work takes priority: the budget converts "reliability vs velocity" arguments into arithmetic.
- **Blameless postmortems**: timeline, root cause (5 whys), action items with owners and dates; punish the same root cause twice, never the human once.

## 13. The Golden Pipeline (Reference Flow)

```text
PR opened ──▶ lint+unit+SAST (SonarQube gate) ──▶ build image ──▶ Trivy scan ──▶ sign (cosign)
   ──▶ push to registry ──▶ bump tag in GitOps repo ──▶ ArgoCD syncs
   ──▶ canary 5% (analysis: error rate, p99) ──▶ 25% ──▶ 100%
   ──▶ rollback path at every step: kubectl rollout undo / git revert / halt ramp
```

Every gate answers one question: *what is the cheapest place this defect could have been caught?* Shift it left one more step.

## 14. DevOps in This Repo's Designs

| Design doc | Where the DevOps tooling appears |
| :--- | :--- |
| `system-design-code-deployment.md` | The CI/CD pipeline *is* the design: blue-green/canary (§47 concepts), artifact stores, rollback |
| `system-design-pastebin.md` + file storage | Object storage (cloud.md tiers), CDN, lifecycle rules |
| `system-design-serverless.md` | FaaS runtime, cold starts, scale-to-zero — k8s-alternative compute |
| `system-design-online-judge.md` | Sandboxed pods per submission — k8s as the isolation + queueing substrate |
| `cloud.md` | The AWS/GCP/Azure service mapping: EKS/GKE/AKS, registries, managed CI |
| `interview-qa.md` §76 | The failure vocabulary (OOMKilled, CrashLoopBackOff, PDBs) in battle dress |

## 15. Key Takeaways

- **Declarative beats imperative**: YAML in Git + a reconciler (GitOps) — the cluster converges to what you declared, drift included.
- **Requests/limits are the lease agreement**: requests schedule, limits cap; getting them right is 80% of "why is my cluster unhappy".
- **Probes are policy, not decoration**: readiness = traffic, liveness = restart, startup = boot budget. Wrong probe, wrong recovery.
- **Gates on new code**: SonarQube/Trivy/gitleaks fail PRs, not 3 a.m.; legacy gets a burn-down plan, not a wall.
- **Canary everything user-facing**: progressive delivery + automated analysis turns bad releases into 5% 10-minute stories.
- **Observability is a design input, not an afterthought**: metrics/logs/traces designed in from day one (§38 tracing, §45 SLOs).


## 16. Version Matrix (verified September 2026)

Pin your mental model to current releases — "which version?" is a real interview question, and stale versions in a design doc are a red flag. Verify against official release pages before quoting.

| Tool | Latest stable (Sep 2026) | What changed recently |
| :--- | :--- | :--- |
| Kubernetes | **1.37** (Aug 2026) | 1.35 leaned into "Kubernetes as AI's OS" (coordinated placement, DRA maturity); only 3 minors supported at once — 1.34 hit EOL Oct 2026 |
| Redis | **8.4** (Nov 2025; 8.6 line Feb 2026) | Vector search improvements, streams perf; tri-license AGPL since 8.0 |
| Apache Kafka | **4.3** (May 2026) | KRaft-only since 4.0; Kafka Queues production-ready in 4.2 |
| PostgreSQL | **18.6** (Aug 2026); 19 in beta for Sep 2026 | Async I/O subsystem, UUIDv7, OAuth 2.0 auth |
| MongoDB | **8.3** (May 2026) | Security hardening + expanded queries |
| Elasticsearch | **9.5** (Sep 2026) | AI-retrieval focus: vector/BM25 hybrid, ES|QL |
| RabbitMQ | **4.3** (4.3.6) | Quorum-queue enhancements, Khepri Raft metadata; 4.2 EOL Jul 2026 |
| Argo CD | **3.6** (Sep 15, 2026) | Quarterly minor cadence; Helm 4.2 in 3.5 |

*Rule of thumb: track N and N-1 majors for anything user-facing; upgrade managed services (EKS/GKE/AKS, Atlas, Elastic Cloud) within one minor of latest.*

## 17. Hidden Tips & Tricks

**1. `revisionHistoryLimit: 0` deletes your panic button.** `kubectl rollout undo` works because old ReplicaSets exist. Zero-history "clean" clusters roll back by re-deploying old YAML from memory.

**2. Requests schedule; limits throttle.** A pod with tiny requests and huge limits still gets starved at node pressure — the scheduler only sees requests. Sizing limits high and requests low "to be safe" produces exactly the noisy-neighbor p99 you were avoiding.

**3. ConfigMap env-vars don't update — mounted files do (eventually).** Env-backed config requires a rollout to change; volume-mounted ConfigMaps refresh on kubelet sync (~1 min) *if the app re-reads the file*. "I updated the ConfigMap" is not "the pods changed".

**4. `:latest` + `IfNotPresent` = the node runs the old image forever.** The pull policy sees the tag cached and skips — "works on the new node, stale on the old one" is the classic ghost deploy. Immutable tags + digest pinning kill the whole class.

**5. HPA floors and PDB ceilings are real constraints.** HPA never scales below minReplicas (idle money, by design); the cluster autoscaler won't remove a node holding a PDB-protected pod — a mis-set PDB quietly pins dead capacity.

**6. `maxUnavailable: 0` costs 2× memory *during* every rollout.** Zero-downtime rolling updates surge one extra replica per deployment — 50 deployments rolling simultaneously after a CVE = capacity incident. Stage rollouts or budget surge capacity.

## 18. Do's & Don'ts

| ✅ Do | ❌ Don't |
| :--- | :--- |
| Set requests on every pod; right-size with VPA in staging | Don't ship BestEffort pods or requests=limits everywhere blindly |
| Pin immutable image tags (or digests) | Don't deploy `:latest` — ghost deploys are guaranteed |
| Keep `revisionHistoryLimit` ≥ 5 so `rollout undo` works | Don't zero the history for a "clean" cluster and lose the panic button |
| Probe readiness honestly (dependencies), liveness narrowly (wedged process) | Don't probe the database in liveness — a DB blip restarts the whole fleet |
| Gate deploys with canary analysis + quality gates (Sonar/Trivy) | Don't push straight to prod because "it worked on my machine" |
| Manage infra with Terraform plan reviews + remote state locking | Don't `terraform apply` from a laptop with local state at 2 a.m. |
