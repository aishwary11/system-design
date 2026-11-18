import {
  SCENARIOS,
  getPreset,
  calculate,
  sensitivity,
  encodeState,
  decodeState,
  money,
  compact,
  number,
  pct,
} from './model.mjs';

const $ = (selector) => document.querySelector(selector);
const form = $('#inputs');
const scenarioNav = $('#scenarios');
const scenarioBlurb = $('#scenario-blurb');

const GROUPS = {
  traffic: {
    title: 'Traffic',
    fields: [
      { path: 'traffic.requestsPerMonth', label: 'Requests per month', step: '1000000' },
      { path: 'traffic.peakFactor', label: 'Peak factor', step: '0.5' },
      { path: 'traffic.avgDurationSec', label: 'Average request duration', unit: 'seconds', step: '0.1' },
      { path: 'traffic.monthlyUsers', label: 'Monthly active users', step: '1000000' },
    ],
  },
  compute: {
    title: 'Compute',
    fields: [
      { path: 'compute.rpsPerInstance', label: 'Requests/sec per instance', step: '10' },
      { path: 'compute.targetUtilization', label: 'Target utilization', unit: '0–1', step: '0.05', max: '1' },
      { path: 'compute.minInstances', label: 'Minimum instances', step: '1' },
      { path: 'compute.redundancy', label: 'Redundancy multiplier', step: '0.1' },
      { path: 'compute.hourlyUsd', label: 'Instance price', unit: '$/hour', step: '0.001' },
    ],
  },
  storage: {
    title: 'Storage',
    fields: [
      { path: 'storage.dailyGb', label: 'New data per day', unit: 'GB', step: '1' },
      { path: 'storage.retentionDays', label: 'Retention', unit: 'days', step: '1' },
      { path: 'storage.replicas', label: 'Replicas', step: '1' },
      { path: 'storage.compression', label: 'Compression ratio', step: '0.1' },
      { path: 'storage.usdPerGbMonth', label: 'Storage price', unit: '$/GB-month', step: '0.001' },
    ],
  },
  egress: {
    title: 'Egress',
    fields: [
      { path: 'egress.tbPerMonth', label: 'Egress volume', unit: 'TB/month', step: '0.1' },
      { path: 'egress.usdPerGb', label: 'Egress price', unit: '$/GB', step: '0.001' },
    ],
  },
  ai: {
    title: 'AI inference',
    fields: [
      { path: 'ai.tokensPerRequest', label: 'Blended tokens per request', step: '100' },
      { path: 'ai.usdPerMillionTokens', label: 'Blended token price', unit: '$/1M tokens', step: '0.01' },
      { path: 'ai.cacheableShare', label: 'Cacheable share', unit: '0–1', step: '0.05', max: '1' },
      { path: 'ai.cacheHitRate', label: 'Cache hit rate', unit: '0–1', step: '0.05', max: '1' },
    ],
  },
  observability: {
    title: 'Observability volume',
    fields: [
      { path: 'observability.series', label: 'Active series', step: '1000000' },
      { path: 'observability.scrapeSec', label: 'Scrape interval', unit: 'seconds', step: '1' },
      { path: 'observability.bytesPerSample', label: 'Bytes per sample', step: '0.1' },
      { path: 'observability.logTbPerDay', label: 'Raw logs per day', unit: 'TB', step: '1' },
      { path: 'observability.logCompression', label: 'Log compression ratio', step: '0.5' },
      { path: 'observability.logRetentionDays', label: 'Log retention', unit: 'days', step: '1' },
      { path: 'observability.spansPerDay', label: 'Spans per day', step: '1000000' },
      { path: 'observability.traceSampleRate', label: 'Trace sample rate', unit: '0–1', step: '0.01', max: '1' },
      { path: 'observability.spanBytes', label: 'Bytes per span', step: '100' },
      { path: 'observability.traceRetentionDays', label: 'Trace retention', unit: 'days', step: '1' },
    ],
  },
  llm: {
    title: 'LLM serving',
    fields: [
      { path: 'llm.tokensPerMonth', label: 'Output tokens per month', step: '1000000000' },
      { path: 'llm.tokensPerGpuMonth', label: 'Tokens per GPU-month', step: '100000000' },
      { path: 'llm.gpuHourlyUsd', label: 'GPU price', unit: '$/GPU-hour', step: '0.01' },
    ],
  },
  webhook: {
    title: 'Delivery volume',
    fields: [
      { path: 'webhook.deliveriesPerDay', label: 'Deliveries per day', step: '100000' },
      { path: 'webhook.attemptsPerDelivery', label: 'Attempts per delivery', step: '0.1' },
      { path: 'webhook.payloadKb', label: 'Payload size', unit: 'KB', step: '1' },
      { path: 'traffic.peakFactor', label: 'Peak factor', step: '0.5' },
      { path: 'traffic.avgDurationSec', label: 'Average delivery duration', unit: 'seconds', step: '0.05' },
    ],
  },
};

let state = readHash() || getPreset('web-api');
let saveTimer = 0;

function get(obj, path) {
  return path.split('.').reduce((value, key) => value?.[key], obj);
}

function set(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts.slice(0, -1)) current = current[part];
  current[parts.at(-1)] = value;
}

function readHash() {
  const token = new URLSearchParams(location.hash.replace(/^#/, '')).get('s');
  return token ? decodeState(token) : null;
}

function scheduleHash() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    history.replaceState(null, '', `#s=${encodeState(state)}`);
  }, 120);
}

function renderScenarios() {
  scenarioNav.replaceChildren();
  for (const scenario of SCENARIOS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scenario';
    button.textContent = scenario.label;
    button.dataset.scenario = scenario.id;
    button.setAttribute('aria-pressed', String(state.scenario === scenario.id));
    button.addEventListener('click', () => selectScenario(scenario.id));
    scenarioNav.append(button);
  }
}

function selectScenario(id) {
  state = getPreset(id);
  renderAll();
  scheduleHash();
}

function fieldControl(field) {
  const wrap = document.createElement('div');
  wrap.className = 'field';
  const id = `f-${field.path.replace(/\./g, '-')}`;
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = field.label;
  if (field.unit) {
    const unit = document.createElement('span');
    unit.className = 'unit';
    unit.textContent = ` (${field.unit})`;
    label.append(unit);
  }
  const input = document.createElement('input');
  input.id = id;
  input.type = 'number';
  input.inputMode = 'decimal';
  input.min = field.min ?? '0';
  input.step = field.step ?? 'any';
  input.value = get(state, field.path) ?? 0;
  input.dataset.path = field.path;
  if (field.max) input.max = field.max;
  wrap.append(label, input);
  return wrap;
}

function renderFixed(container) {
  const head = document.createElement('div');
  head.className = 'fixed-head';
  const copy = document.createElement('span');
  copy.textContent = 'Editable component estimates from the source cost table.';
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'add';
  add.style.width = 'auto';
  add.style.margin = '0';
  add.dataset.action = 'add-fixed';
  add.textContent = '+ Add line';
  head.append(copy, add);
  container.append(head);

  if (!state.fixed.length) {
    const empty = document.createElement('p');
    empty.className = 'scenario-blurb';
    empty.textContent = 'No fixed services yet. Add one for managed data, queue or platform costs.';
    container.append(empty);
    return;
  }

  state.fixed.forEach((line, index) => {
    const row = document.createElement('div');
    row.className = 'fixed-row';

    const label = document.createElement('input');
    label.type = 'text';
    label.value = line.label;
    label.placeholder = 'Service name';
    label.dataset.fixedIndex = String(index);
    label.dataset.fixedField = 'label';
    label.setAttribute('aria-label', `Fixed service ${index + 1} name`);

    const amount = document.createElement('input');
    amount.type = 'number';
    amount.inputMode = 'decimal';
    amount.min = '0';
    amount.step = '100';
    amount.value = line.monthly;
    amount.dataset.fixedIndex = String(index);
    amount.dataset.fixedField = 'monthly';
    amount.setAttribute('aria-label', `${line.label || `Fixed service ${index + 1}`} monthly cost`);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove';
    remove.dataset.action = 'remove-fixed';
    remove.dataset.index = String(index);
    remove.setAttribute('aria-label', `Remove ${line.label || `fixed service ${index + 1}`}`);
    remove.textContent = '×';

    row.append(label, amount, remove);
    container.append(row);
  });
}

function renderInputs() {
  form.replaceChildren();
  const scenario = SCENARIOS.find((item) => item.id === state.scenario) || SCENARIOS[0];
  for (const groupName of scenario.groups) {
    if (groupName === 'fixed') continue;
    const group = GROUPS[groupName];
    if (!group) continue;
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = group.title;
    const grid = document.createElement('div');
    grid.className = 'field-grid';
    for (const field of group.fields) grid.append(fieldControl(field));
    fieldset.append(legend, grid);
    form.append(fieldset);
  }

  const fixed = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = 'Fixed monthly services';
  fixed.append(legend);
  renderFixed(fixed);
  form.append(fixed);
}

function card(label, value) {
  const element = document.createElement('div');
  element.className = 'metric';
  const name = document.createElement('span');
  name.textContent = label;
  const amount = document.createElement('strong');
  amount.textContent = value;
  element.append(name, amount);
  return element;
}

function renderCards(result) {
  const container = $('#cards');
  container.replaceChildren();
  const cards = [];

  if (state.scenario === 'observability') {
    cards.push(
      ['Active series', compact(result.obs.series)],
      ['Samples / day', compact(result.obs.samplesPerDay)],
      ['Metric GB / day', number(result.obs.metricGbPerDay)],
      ['Logs stored / day', `${number(result.obs.logStoredTbPerDay)} TB`],
      ['Logs retained', `${number(result.obs.logRetainedTb)} TB`],
      ['Traces retained', `${number(result.obs.traceTb)} TB`],
    );
  } else if (state.scenario === 'llm-inference') {
    cards.push(
      ['GPUs', number(result.llm.gpus)],
      ['Tokens / day', compact(result.llm.tokensPerDay)],
      ['GPU serving', money(result.llmCost)],
    );
  } else if (state.scenario === 'webhook') {
    cards.push(
      ['Deliveries / day', compact(result.webhook.deliveriesPerDay)],
      ['Attempts / day', compact(result.webhook.attemptsPerDay)],
      ['Delivery RPS', number(result.webhook.deliveriesPerSec)],
      ['Peak RPS', number(result.webhook.peakPerSec)],
      ['Egress', `${number(result.webhook.egressTb)} TB`],
      ['Instances', number(result.instances)],
    );
  } else {
    cards.push(
      ['Average RPS', number(result.avgRps)],
      ['Peak RPS', number(result.peakRps)],
      ['In flight', compact(result.concurrency)],
      ['Instances', number(result.instances)],
    );
    if (result.retainedGB > 0) cards.push(['Storage retained', `${compact(result.retainedGB / 1000)} TB`]);
    if (result.egressTb > 0) cards.push(['Egress', `${compact(result.egressTb)} TB`]);
    if (result.aiTokens > 0) cards.push(['AI tokens / month', compact(result.aiTokens)]);
    if (result.aiSavings > 0) cards.push(['Cache savings', money(result.aiSavings)]);
  }

  for (const [label, value] of cards) container.append(card(label, value));
}

function costDetail(row, result) {
  if (row.kind === 'compute') {
    return `${number(result.instances)} instances × $${state.compute.hourlyUsd}/hr × 730h`;
  }
  if (row.kind === 'storage') {
    return `${number(result.retainedGB)} GB × $${state.storage.usdPerGbMonth}/GB-month`;
  }
  if (row.kind === 'egress') {
    return `${number(result.egressTb)} TB × $${state.egress.usdPerGb}/GB`;
  }
  if (row.kind === 'ai') {
    return `Gross ${money(result.aiGross)} − cache ${money(result.aiSavings)}`;
  }
  if (row.kind === 'llm') {
    return `${number(result.llmGpus)} GPUs × $${state.llm.gpuHourlyUsd}/hr × 730h`;
  }
  return 'Editable source estimate';
}

function renderBreakdown(result) {
  const container = $('#breakdown');
  container.replaceChildren();
  if (!result.costRows.length) {
    container.textContent = 'No costs yet — add traffic, storage or fixed services.';
    return;
  }
  const max = Math.max(...result.costRows.map((row) => row.amount));
  for (const row of result.costRows) {
    const line = document.createElement('div');
    line.className = 'bar-row';
    line.title = costDetail(row, result);

    const label = document.createElement('span');
    label.className = 'bar-label';
    label.textContent = row.label;

    const value = document.createElement('span');
    value.className = 'bar-value';
    value.textContent = money(row.amount);

    const track = document.createElement('div');
    track.className = 'bar-track';
    const fill = document.createElement('div');
    fill.className = 'bar-fill';
    fill.style.width = `${Math.max(2, (row.amount / max) * 100)}%`;
    track.append(fill);

    line.append(label, value, track);
    container.append(line);
  }
}

function renderRisks(result) {
  const list = $('#risks');
  list.replaceChildren();
  for (const risk of result.risks) {
    const item = document.createElement('li');
    item.dataset.kind = risk.kind;
    item.textContent = risk.message;
    list.append(item);
  }
}

function renderUnits(result) {
  const container = $('#units');
  container.replaceChildren();
  if (!result.unit.length) {
    container.textContent = 'No unit economics yet.';
    return;
  }
  for (const unit of result.unit) {
    const row = document.createElement('div');
    row.className = 'unit-row';
    const label = document.createElement('span');
    label.textContent = unit.label;
    const value = document.createElement('b');
    value.textContent = money(unit.value);
    row.append(label, value);
    container.append(row);
  }
}

function renderSensitivity() {
  const container = $('#sensitivity');
  container.replaceChildren();
  const data = sensitivity(state);
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Assumption</th><th>Monthly cost</th><th>Δ</th></tr>';
  const tbody = document.createElement('tbody');

  const baseRow = document.createElement('tr');
  baseRow.innerHTML = `<td>Baseline</td><td>${money(data.base)}</td><td>—</td>`;
  tbody.append(baseRow);

  for (const variant of data.variants) {
    const row = document.createElement('tr');
    const label = document.createElement('td');
    label.textContent = variant.label;
    const total = document.createElement('td');
    total.textContent = money(variant.total);
    const delta = document.createElement('td');
    delta.className = variant.delta > 0 ? 'up' : 'down';
    delta.textContent = `${variant.delta > 0 ? '+' : '−'}${money(Math.abs(variant.delta))}`;
    row.append(label, total, delta);
    tbody.append(row);
  }

  table.append(thead, tbody);
  container.append(table);
  if (!data.variants.length) {
    const note = document.createElement('p');
    note.className = 'scenario-blurb';
    note.style.margin = '8px 0 0';
    note.textContent = 'This preset is priced from fixed component estimates, so the dynamic assumptions do not move the total. Edit the fixed lines to test a different quote.';
    container.append(note);
  }
}

function updateOutputs() {
  const result = calculate(state);
  $('#total').textContent = money(result.total);
  $('#total-note').textContent = result.dominant
    ? `${result.dominant.label} is ${pct(result.dominant.amount / result.total)} of spend`
    : 'Add inputs to build an estimate';
  renderCards(result);
  renderBreakdown(result);
  renderRisks(result);
  renderUnits(result);
  renderSensitivity();
}

function renderAll() {
  const scenario = SCENARIOS.find((item) => item.id === state.scenario) || SCENARIOS[0];
  scenarioBlurb.textContent = scenario.blurb;
  for (const button of scenarioNav.querySelectorAll('.scenario')) {
    button.setAttribute('aria-pressed', String(button.dataset.scenario === state.scenario));
  }
  renderInputs();
  updateOutputs();
}

form.addEventListener('submit', (event) => event.preventDefault());

form.addEventListener('input', (event) => {
  const target = event.target;
  if (target.dataset.path) {
    set(state, target.dataset.path, target.value === '' ? 0 : Number(target.value));
    updateOutputs();
    scheduleHash();
    return;
  }
  if (target.dataset.fixedIndex !== undefined) {
    const index = Number(target.dataset.fixedIndex);
    const field = target.dataset.fixedField;
    if (!state.fixed[index]) return;
    state.fixed[index][field] = field === 'monthly'
      ? (target.value === '' ? 0 : Number(target.value))
      : target.value;
    updateOutputs();
    scheduleHash();
  }
});

form.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  if (button.dataset.action === 'add-fixed') {
    state.fixed.push({ label: 'New service', monthly: 0 });
  } else if (button.dataset.action === 'remove-fixed') {
    state.fixed.splice(Number(button.dataset.index), 1);
  }
  renderInputs();
  updateOutputs();
  scheduleHash();
});

$('#reset').addEventListener('click', () => {
  state = getPreset(state.scenario);
  renderAll();
  scheduleHash();
});

$('#share').addEventListener('click', async () => {
  history.replaceState(null, '', `#s=${encodeState(state)}`);
  try {
    await navigator.clipboard.writeText(location.href);
    const button = $('#share');
    const original = button.textContent;
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = original; }, 1500);
  } catch {
    window.prompt('Copy this scenario link:', location.href);
  }
});

window.addEventListener('hashchange', () => {
  const next = readHash();
  if (!next) return;
  state = next;
  renderAll();
});

renderScenarios();
renderAll();
