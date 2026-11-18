#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  PRESETS,
  calculate,
  sensitivity,
  encodeState,
  decodeState,
  money,
} from '../simulator/model.mjs';

const close = (actual, expected, tolerance, label) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected} ± ${tolerance}, got ${actual}`,
  );
};

// AI gateway capacity model from system-design-ai-gateway.md.
const ai = calculate(PRESETS['ai-gateway']);
close(ai.avgRps, 400e6 / (30 * 86400), 1e-6, 'AI average RPS');
close(ai.peakRps, (400e6 / (30 * 86400)) * 8, 1e-6, 'AI peak RPS');
close(ai.concurrency, (400e6 / (30 * 86400)) * 8 * 21, 1e-6, 'AI concurrent streams');
assert.equal(ai.instances, 60, 'AI gateway fleet seed');
close(ai.aiTokens, 600e9, 1, 'AI tokens per month');
close(ai.aiGross, 702000, 1, 'AI gross inference spend');
close(ai.aiSavings, 56160, 1, 'AI cache savings');
close(ai.total, 665029, 5, 'AI total');

// Observability capacity model from system-design-observability-pipeline.md.
const obs = calculate(PRESETS.observability);
close(obs.obs.samplesPerDay, 115.2e9, 1, 'observability samples/day');
close(obs.obs.metricGbPerDay, 195.84, 0.01, 'observability metric GB/day');
close(obs.obs.logStoredTbPerDay, 6.25, 0.001, 'observability stored logs/day');
close(obs.obs.logRetainedTb, 187.5, 0.01, 'observability retained logs');
close(obs.obs.traceTb, 4.5, 0.001, 'observability retained traces');
close(obs.total, 41600, 1, 'observability total');
assert.ok(obs.unit.some((unit) => unit.label === 'per 1M active series'), 'observability series unit economics');
assert.ok(obs.unit.some((unit) => unit.label === 'per TB logs ingested'), 'observability log unit economics');

// LLM inference cost model from system-design-llm-inference.md.
const llm = calculate(PRESETS['llm-inference']);
assert.equal(llm.llmGpus, 180, 'LLM GPU count');
close(llm.llmCost, 900090, 10, 'LLM GPU cost');
close(llm.total, 1042090, 10, 'LLM total');
const llmPerToken = llm.unit.find((unit) => unit.label === 'per 1M LLM tokens');
assert.ok(llmPerToken, 'LLM per-token unit economics');
close(llmPerToken.value, 1042090 / 1.2e6, 0.001, 'LLM cost per 1M tokens');
close(llm.llm.tokensPerDay, 40e9, 1, 'LLM tokens/day');

// Generic storage and egress math.
const web = calculate(PRESETS['web-api']);
close(web.retainedGB, 1200, 0.001, 'web retained GB');
close(web.storageCost, 27.6, 0.001, 'web storage cost');
close(web.egressCost, 800, 0.001, 'web egress cost');

// Webhook egress is derived from deliveries, attempts and payload size.
const hook = calculate(PRESETS.webhook);
close(hook.webhook.egressTb, 1.19988, 0.00001, 'webhook egress TB');
// Commodity egress (~$0.09/GB), not the document's $3/GB reference estimate.
close(hook.egressCost, 107.99, 0.01, 'webhook egress cost');
close(hook.total, 11168.99, 1, 'webhook total');
assert.ok(
  hook.unit.some((unit) => unit.label === 'per 1M deliveries'),
  'webhook unit economics are per delivery, not per request',
);

// A delivery attempt can never be cheaper than one attempt of payload bytes.
const retryFloor = calculate({
  ...PRESETS.webhook,
  webhook: { deliveriesPerDay: 1_000_000, attemptsPerDelivery: 0.4, payloadKb: 33.33 },
});
assert.equal(retryFloor.webhook.attemptsPerDay, 1_000_000, 'below-one attempts clamp to a single attempt');
close(retryFloor.webhook.egressTb, 1_000_000 * 33.33 * 30 / 1e9, 1e-9, 'clamped attempts match one attempt');

// Partial input must not inherit another preset's fixed services or budget.
assert.equal(calculate({}).total, 0, 'partial input starts from an empty scenario');
assert.equal(calculate({}).risks.length, 1, 'empty input reports the no-threshold risk only');

// Sensitivity returns only variants that actually move the total.
const sens = sensitivity(PRESETS['web-api']);
assert.ok(sens.variants.length >= 2, 'sensitivity should find moving assumptions');
assert.ok(sens.variants.every((variant) => variant.total > sens.base), 'web sensitivity variants increase cost');

// Share state round-trips exactly.
const encoded = encodeState(PRESETS.observability);
const decoded = decodeState(encoded);
assert.deepEqual(decoded, PRESETS.observability, 'state round-trip');
assert.equal(decodeState('not-valid-base64').scenario, 'web-api', 'invalid state falls back');

assert.equal(money(0.8684), '$0.868', 'sub-dollar money formatting');
assert.equal(money(665029), '$665K', 'compact money formatting');

console.log('simulator: all model tests passed');
