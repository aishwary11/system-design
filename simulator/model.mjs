export const SECONDS_PER_MONTH = 30 * 86400;
export const HOURS_PER_MONTH = 730;

export const SCENARIOS = [
  {
    id: 'web-api',
    label: 'Web API',
    blurb: 'A general request/response service sized from traffic, compute, storage and egress.',
    groups: ['traffic', 'compute', 'storage', 'egress', 'fixed'],
  },
  {
    id: 'ai-gateway',
    label: 'AI Gateway',
    blurb: 'In-flight streams, gateway fleet and blended token spend, with cache savings.',
    groups: ['traffic', 'compute', 'ai', 'fixed'],
  },
  {
    id: 'observability',
    label: 'Observability',
    blurb: 'Metrics, logs and traces derived from series count, scrape interval and retention.',
    groups: ['observability', 'fixed'],
  },
  {
    id: 'llm-inference',
    label: 'LLM Inference',
    blurb: 'GPU pool size and serving cost from monthly token volume.',
    groups: ['llm', 'fixed'],
  },
  {
    id: 'webhook',
    label: 'Webhook Delivery',
    blurb: 'Delivery throughput and egress from deliveries, retries and payload size.',
    groups: ['webhook', 'compute', 'egress', 'fixed'],
  },
  {
    id: 'custom',
    label: 'Custom',
    blurb: 'Start from zero and compose your own traffic, storage, egress and AI assumptions.',
    groups: ['traffic', 'compute', 'storage', 'egress', 'ai', 'fixed'],
  },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

function merge(base, extra) {
  if (Array.isArray(base)) return extra === undefined ? clone(base) : clone(extra);
  if (base && typeof base === 'object') {
    const out = { ...base };
    for (const [key, value] of Object.entries(extra || {})) {
      out[key] = key in base ? merge(base[key], value) : clone(value);
    }
    return out;
  }
  return extra === undefined ? base : extra;
}

function emptyState() {
  return {
    scenario: 'custom',
    traffic: {
      requestsPerMonth: 0,
      peakFactor: 3,
      avgDurationSec: 0.2,
      monthlyUsers: 0,
    },
    compute: {
      rpsPerInstance: 500,
      targetUtilization: 0.7,
      minInstances: 0,
      redundancy: 1,
      hourlyUsd: 0.19,
    },
    storage: {
      dailyGb: 0,
      retentionDays: 30,
      replicas: 3,
      compression: 1,
      usdPerGbMonth: 0.023,
    },
    egress: {
      tbPerMonth: 0,
      usdPerGb: 0.08,
    },
    ai: {
      tokensPerRequest: 0,
      usdPerMillionTokens: 0,
      cacheableShare: 0,
      cacheHitRate: 0,
    },
    observability: {
      series: 0,
      scrapeSec: 15,
      bytesPerSample: 1.7,
      logTbPerDay: 0,
      logCompression: 8,
      spansPerDay: 0,
      traceSampleRate: 0.05,
      spanBytes: 2000,
      traceRetentionDays: 30,
      logRetentionDays: 30,
    },
    llm: {
      tokensPerMonth: 0,
      tokensPerGpuMonth: 6_666_666_667,
      gpuHourlyUsd: 6.85,
    },
    webhook: {
      deliveriesPerDay: 0,
      attemptsPerDelivery: 1,
      payloadKb: 0,
    },
    fixed: [],
    budget: 0,
  };
}

const webApi = merge(emptyState(), {
  scenario: 'web-api',
  traffic: { requestsPerMonth: 100_000_000, peakFactor: 5, avgDurationSec: 0.2, monthlyUsers: 1_000_000 },
  compute: { rpsPerInstance: 500, targetUtilization: 0.7, minInstances: 3, redundancy: 2, hourlyUsd: 0.19 },
  storage: { dailyGb: 20, retentionDays: 30, replicas: 3, compression: 1.5, usdPerGbMonth: 0.023 },
  egress: { tbPerMonth: 10, usdPerGb: 0.08 },
  fixed: [
    { label: 'Managed database + cache', monthly: 5000 },
  ],
  budget: 15000,
});

const aiGateway = merge(emptyState(), {
  scenario: 'ai-gateway',
  traffic: { requestsPerMonth: 400_000_000, peakFactor: 8, avgDurationSec: 21, monthlyUsers: 1_000_000 },
  compute: { rpsPerInstance: 100, targetUtilization: 0.7, minInstances: 60, redundancy: 1, hourlyUsd: 0.155 },
  ai: { tokensPerRequest: 1500, usdPerMillionTokens: 1.17, cacheableShare: 0.4, cacheHitRate: 0.2 },
  fixed: [
    { label: 'Redis Cluster', monthly: 2400 },
    { label: 'PostgreSQL', monthly: 2900 },
    { label: 'Kafka', monthly: 1900 },
    { label: 'Vector store', monthly: 3200 },
    { label: 'KMS + audit', monthly: 600 },
    { label: 'Observability', monthly: 1400 },
  ],
  budget: 800000,
});

const observability = merge(emptyState(), {
  scenario: 'observability',
  observability: {
    series: 20_000_000,
    scrapeSec: 15,
    bytesPerSample: 1.7,
    logTbPerDay: 50,
    logCompression: 8,
    spansPerDay: 1_500_000_000,
    traceSampleRate: 0.05,
    spanBytes: 2000,
    traceRetentionDays: 30,
    logRetentionDays: 30,
  },
  fixed: [
    { label: 'Collector fleet', monthly: 7400 },
    { label: 'Kafka ingest buffers', monthly: 5200 },
    { label: 'TSDB compute + SSD', monthly: 12600 },
    { label: 'Log object storage', monthly: 4900 },
    { label: 'Trace storage', monthly: 3100 },
    { label: 'Query compute', monthly: 6800 },
    { label: 'Alerting + control plane', monthly: 1600 },
  ],
  budget: 50000,
});

const llmInference = merge(emptyState(), {
  scenario: 'llm-inference',
  llm: {
    tokensPerMonth: 1_200_000_000_000,
    tokensPerGpuMonth: 6_666_666_667,
    gpuHourlyUsd: 6.85,
  },
  fixed: [
    { label: 'CPU serving tier', monthly: 45000 },
    { label: 'Storage + KV offload', monthly: 25000 },
    { label: 'Kafka + telemetry', monthly: 12000 },
    { label: 'GPU networking', monthly: 60000 },
  ],
  budget: 1200000,
});

const webhook = merge(emptyState(), {
  scenario: 'webhook',
  // Deliveries, not traffic.requestsPerMonth, drive request volume here.
  traffic: { peakFactor: 3, avgDurationSec: 0.2 },
  compute: { rpsPerInstance: 50, targetUtilization: 0.7, minInstances: 30, redundancy: 1, hourlyUsd: 0.19 },
  // Commodity origin egress (~$90/TB, cloud.md §17). The webhook doc's cost table
  // uses a conservative $3/GB reference estimate for the same bytes; see its note.
  egress: { tbPerMonth: 0, usdPerGb: 0.09 },
  webhook: { deliveriesPerDay: 1_000_000, attemptsPerDelivery: 1.2, payloadKb: 33.33 },
  fixed: [
    { label: 'Kafka', monthly: 3100 },
    { label: 'PostgreSQL', monthly: 1800 },
    { label: 'Redis Cluster', monthly: 900 },
    { label: 'Object storage', monthly: 400 },
    { label: 'Observability', monthly: 700 },
  ],
  budget: 20000,
});

export const PRESETS = {
  'web-api': webApi,
  'ai-gateway': aiGateway,
  observability,
  'llm-inference': llmInference,
  webhook,
  custom: merge(emptyState(), { scenario: 'custom' }),
};

export const DEFAULT_SCENARIO = 'web-api';

export function getPreset(id) {
  return clone(PRESETS[id] || PRESETS[DEFAULT_SCENARIO]);
}

const num = (value) => (Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0);

// Defaults come from an empty scenario, never from another preset, so a partial
// input cannot silently inherit that preset's fixed services or budget.
const normalize = (input) => merge(emptyState(), input || {});

export function calculate(input) {
  const state = normalize(input);
  const scenario = state.scenario;

  const requestsPerMonth = scenario === 'webhook'
    ? num(state.webhook.deliveriesPerDay) * 30
    : num(state.traffic.requestsPerMonth);
  const peakFactor = num(state.traffic.peakFactor) || 1;
  const durationSec = num(state.traffic.avgDurationSec);
  const avgRps = requestsPerMonth / SECONDS_PER_MONTH;
  const peakRps = avgRps * peakFactor;
  const concurrency = peakRps * durationSec;

  const rpsPerInstance = num(state.compute.rpsPerInstance);
  const targetUtilization = Math.min(1, Math.max(0.01, num(state.compute.targetUtilization) || 0.7));
  const neededInstances = rpsPerInstance > 0
    ? Math.ceil((peakRps / (rpsPerInstance * targetUtilization)) * (num(state.compute.redundancy) || 1))
    : 0;
  const instances = Math.max(num(state.compute.minInstances), neededInstances);
  const computeCost = instances * num(state.compute.hourlyUsd) * HOURS_PER_MONTH;
  const utilization = instances > 0 && rpsPerInstance > 0
    ? peakRps / (instances * rpsPerInstance)
    : 0;

  const retentionDays = num(state.storage.retentionDays);
  const replicas = Math.max(1, num(state.storage.replicas));
  const compression = Math.max(0.01, num(state.storage.compression) || 1);
  const retainedGB = (num(state.storage.dailyGb) * retentionDays * replicas) / compression;
  const storageCost = retainedGB * num(state.storage.usdPerGbMonth);

  const attemptsPerDelivery = Math.max(1, num(state.webhook.attemptsPerDelivery));
  const webhookEgressTb = (num(state.webhook.deliveriesPerDay) * attemptsPerDelivery
    * num(state.webhook.payloadKb) * 30) / 1e9;
  const egressTb = num(state.egress.tbPerMonth) + webhookEgressTb;
  const egressCost = egressTb * 1000 * num(state.egress.usdPerGb);

  const aiTokens = requestsPerMonth * num(state.ai.tokensPerRequest);
  const aiGross = (aiTokens / 1e6) * num(state.ai.usdPerMillionTokens);
  const aiCacheHits = requestsPerMonth * Math.min(1, num(state.ai.cacheableShare))
    * Math.min(1, num(state.ai.cacheHitRate));
  const aiSavings = (aiCacheHits * num(state.ai.tokensPerRequest) / 1e6) * num(state.ai.usdPerMillionTokens);
  const aiNet = Math.max(0, aiGross - aiSavings);

  const llmGpus = state.llm.tokensPerGpuMonth > 0
    ? Math.ceil(num(state.llm.tokensPerMonth) / num(state.llm.tokensPerGpuMonth))
    : 0;
  const llmCost = llmGpus * num(state.llm.gpuHourlyUsd) * HOURS_PER_MONTH;

  const fixedRows = (state.fixed || []).map((line, index) => ({
    key: `fixed-${index}`,
    label: line.label || `Fixed service ${index + 1}`,
    amount: num(line.monthly),
    kind: 'fixed',
  }));

  const costRows = [
    { key: 'compute', label: 'Compute', amount: computeCost, kind: 'compute' },
    { key: 'storage', label: 'Storage', amount: storageCost, kind: 'storage' },
    { key: 'egress', label: 'Egress', amount: egressCost, kind: 'egress' },
    { key: 'ai', label: 'AI inference (net)', amount: aiNet, kind: 'ai' },
    { key: 'llm', label: 'GPU serving', amount: llmCost, kind: 'llm' },
    ...fixedRows,
  ].filter((row) => row.amount > 0);

  const total = costRows.reduce((sum, row) => sum + row.amount, 0);
  const dominant = costRows.reduce((best, row) => (row.amount > (best?.amount || 0) ? row : best), null);

  const llm = {
    gpus: llmGpus,
    tokensPerDay: num(state.llm.tokensPerMonth) / 30,
  };

  const obsSamplesPerDay = (num(state.observability.series) * 86400)
    / (num(state.observability.scrapeSec) || 15);
  const obsLogStoredTbPerDay = num(state.observability.logTbPerDay)
    / Math.max(0.01, num(state.observability.logCompression) || 1);
  const obs = {
    series: num(state.observability.series),
    scrapeSec: num(state.observability.scrapeSec) || 15,
    samplesPerDay: obsSamplesPerDay,
    metricGbPerDay: (obsSamplesPerDay * num(state.observability.bytesPerSample)) / 1e9,
    logStoredTbPerDay: obsLogStoredTbPerDay,
    logRetainedTb: obsLogStoredTbPerDay * num(state.observability.logRetentionDays),
    traceTb: (num(state.observability.spansPerDay) * Math.min(1, num(state.observability.traceSampleRate))
      * num(state.observability.spanBytes) * num(state.observability.traceRetentionDays)) / 1e12,
  };

  const webhookMetrics = {
    deliveriesPerDay: num(state.webhook.deliveriesPerDay),
    attemptsPerDay: num(state.webhook.deliveriesPerDay) * attemptsPerDelivery,
    deliveriesPerSec: num(state.webhook.deliveriesPerDay) / 86400,
    peakPerSec: peakRps,
    egressTb: webhookEgressTb,
  };

  const unit = [];
  if (requestsPerMonth > 0) {
    unit.push({
      // Webhooks count deliveries as their request volume, so name it that way.
      label: scenario === 'webhook' ? 'per 1M deliveries' : 'per 1M requests',
      value: total / (requestsPerMonth / 1e6),
      kind: 'money',
    });
  }
  if (aiTokens > 0) unit.push({ label: 'per 1M AI tokens', value: total / (aiTokens / 1e6), kind: 'money' });
  if (num(state.llm.tokensPerMonth) > 0) unit.push({ label: 'per 1M LLM tokens', value: total / (num(state.llm.tokensPerMonth) / 1e6), kind: 'money' });
  if (retainedGB > 0) unit.push({ label: 'per TB stored', value: storageCost / (retainedGB / 1000), kind: 'money' });
  if (egressTb > 0) unit.push({ label: 'per TB egress', value: egressCost / egressTb, kind: 'money' });
  if (obs.series > 0) unit.push({ label: 'per 1M active series', value: total / (obs.series / 1e6), kind: 'money' });
  if (num(state.observability.logTbPerDay) > 0) {
    unit.push({ label: 'per TB logs ingested', value: total / (num(state.observability.logTbPerDay) * 30), kind: 'money' });
  }
  if (num(state.traffic.monthlyUsers) > 0) unit.push({ label: 'per monthly user', value: total / num(state.traffic.monthlyUsers), kind: 'money' });

  const risks = [];
  if (utilization > 0.7) {
    risks.push({
      kind: 'compute',
      message: `Compute is at ${pct(utilization)} of peak capacity — above the ~70% queue-cliff warning.`,
    });
  }
  if (num(state.budget) > 0 && total > num(state.budget)) {
    risks.push({
      kind: 'budget',
      message: `Estimate is ${pct(total / num(state.budget))} of the ${money(num(state.budget))} monthly budget.`,
    });
  }
  if (total > 0 && egressCost / total > 0.5) {
    risks.push({ kind: 'egress', message: `Egress is ${pct(egressCost / total)} of monthly spend.` });
  }
  if (total > 0 && aiNet / total > 0.7) {
    risks.push({ kind: 'ai', message: `AI inference is ${pct(aiNet / total)} of monthly spend.` });
  }
  if (total > 0 && llmCost / total > 0.7) {
    risks.push({ kind: 'llm', message: `GPU serving is ${pct(llmCost / total)} of monthly spend.` });
  }
  if (risks.length === 0) {
    risks.push({ kind: 'ok', message: 'No threshold crossed in this model. Validate with a load test and current provider pricing.' });
  }

  return {
    scenario,
    requestsPerMonth,
    avgRps,
    peakRps,
    concurrency,
    instances,
    utilization,
    computeCost,
    retainedGB,
    storageCost,
    egressTb,
    egressCost,
    aiTokens,
    aiGross,
    aiSavings,
    aiNet,
    llmGpus,
    llmCost,
    costRows,
    total,
    dominant,
    unit,
    risks,
    obs,
    llm,
    webhook: webhookMetrics,
  };
}

export function sensitivity(input) {
  const state = normalize(input);
  const base = calculate(state);
  const variants = [];
  const add = (label, mutate) => {
    const next = clone(state);
    mutate(next);
    const result = calculate(next);
    if (Math.abs(result.total - base.total) > 0.005) {
      variants.push({ label, total: result.total, delta: result.total - base.total });
    }
  };

  add('Volume +20%', (s) => {
    s.traffic.requestsPerMonth = num(s.traffic.requestsPerMonth) * 1.2;
    s.traffic.monthlyUsers = num(s.traffic.monthlyUsers) * 1.2;
    s.webhook.deliveriesPerDay = num(s.webhook.deliveriesPerDay) * 1.2;
    s.observability.series = num(s.observability.series) * 1.2;
    s.observability.logTbPerDay = num(s.observability.logTbPerDay) * 1.2;
    s.observability.spansPerDay = num(s.observability.spansPerDay) * 1.2;
    s.llm.tokensPerMonth = num(s.llm.tokensPerMonth) * 1.2;
  });
  add('Retention +20%', (s) => {
    s.storage.retentionDays = num(s.storage.retentionDays) * 1.2;
    s.observability.logRetentionDays = num(s.observability.logRetentionDays) * 1.2;
    s.observability.traceRetentionDays = num(s.observability.traceRetentionDays) * 1.2;
  });
  add('Egress +20%', (s) => {
    s.egress.tbPerMonth = num(s.egress.tbPerMonth) * 1.2;
    s.webhook.payloadKb = num(s.webhook.payloadKb) * 1.2;
  });
  add('AI token price +20%', (s) => {
    s.ai.usdPerMillionTokens = num(s.ai.usdPerMillionTokens) * 1.2;
  });
  add('GPU price +20%', (s) => {
    s.llm.gpuHourlyUsd = num(s.llm.gpuHourlyUsd) * 1.2;
  });

  return { base: base.total, variants };
}

export function encodeState(state) {
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeState(token) {
  try {
    const padded = token.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(token.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return hydrateState(parsed);
  } catch {
    return getPreset(DEFAULT_SCENARIO);
  }
}

export function hydrateState(input) {
  if (!input || typeof input !== 'object' || !PRESETS[input.scenario]) return getPreset(DEFAULT_SCENARIO);
  return merge(PRESETS[input.scenario], input);
}

export function money(value) {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const scaled = (amount, suffix) => {
    const digits = amount < 10 ? 2 : amount < 100 ? 1 : 0;
    return `$${trim(amount.toFixed(digits))}${suffix}`;
  };
  if (abs >= 1e9) return scaled(value / 1e9, 'B');
  if (abs >= 1e6) return scaled(value / 1e6, 'M');
  if (abs >= 1e3) return scaled(value / 1e3, 'K');
  if (abs > 0 && abs < 1) return `$${value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}`;
  if (abs < 10) return `$${value.toFixed(2)}`;
  return `$${Math.round(value)}`;
}

export function compact(value) {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${trim((value / 1e12).toFixed(1))}T`;
  if (abs >= 1e9) return `${trim((value / 1e9).toFixed(1))}B`;
  if (abs >= 1e6) return `${trim((value / 1e6).toFixed(1))}M`;
  if (abs >= 1e3) return `${trim((value / 1e3).toFixed(1))}K`;
  return trim(value.toFixed(1));
}

export function number(value) {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
}

export function pct(value) {
  if (!Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

function trim(value) {
  return String(value).replace(/\.0$/, '');
}
