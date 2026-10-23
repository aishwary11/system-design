#!/usr/bin/env node
/**
 * inline-svg.mjs — static SVG renderers for the archify sequence and lifecycle
 * specs that sit beside the architecture specs.
 *
 * `archify validate --layout-json` only resolves architecture/workflow layouts,
 * so these two types are drawn here from the spec itself: the sequence schema
 * already carries message Y positions, and lifecycle states carry lane/col
 * grid slots. Output uses the same palette and monospace stack as
 * `embed-svg.mjs`'s architecture export so every inline figure in the docs
 * looks like it came from the same tool.
 */

const TYPE = {
  external:   { fill: '#ecfdf5', stroke: '#10b981', text: '#064e3b' },
  frontend:   { fill: '#eff6ff', stroke: '#3b82f6', text: '#1e3a8a' },
  backend:    { fill: '#eef2ff', stroke: '#6366f1', text: '#312e81' },
  database:   { fill: '#f5f3ff', stroke: '#8b5cf6', text: '#4c1d95' },
  messagebus: { fill: '#fff7ed', stroke: '#f97316', text: '#7c2d12' },
  cloud:      { fill: '#f0f9ff', stroke: '#0ea5e9', text: '#0c4a6e' },
  security:   { fill: '#fef2f2', stroke: '#ef4444', text: '#7f1d1d' },
};

const STATE = {
  start:    { fill: '#ecfdf5', stroke: '#10b981', text: '#064e3b' },
  active:   { fill: '#eef2ff', stroke: '#6366f1', text: '#312e81' },
  waiting:  { fill: '#fffbeb', stroke: '#f59e0b', text: '#78350f' },
  decision: { fill: '#ecfeff', stroke: '#06b6d4', text: '#164e63' },
  success:  { fill: '#ecfdf5', stroke: '#059669', text: '#064e3b' },
  failure:  { fill: '#fef2f2', stroke: '#ef4444', text: '#7f1d1d' },
  neutral:  { fill: '#f8fafc', stroke: '#94a3b8', text: '#334155' },
};

const FONT = 'font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// rough monospace width; labels get a white mask so they stay readable on lifelines
const textW = (s, size = 10.5) => String(s).length * size * 0.62;

function chip(x, y, text, size = 10, fill = '#ffffff', ink = '#475569') {
  const w = textW(text, size) + 12;
  return [
    `<rect x="${(x - w / 2).toFixed(1)}" y="${(y - size).toFixed(1)}" width="${w.toFixed(1)}" height="${(size + 8).toFixed(1)}" rx="${((size + 8) / 2).toFixed(1)}" fill="${fill}" stroke="#e2e8f0" stroke-width="0.8"/>`,
    `<text x="${x.toFixed(1)}" y="${(y + 3.5).toFixed(1)}" text-anchor="middle" ${FONT} font-size="${size}" fill="${ink}">${esc(text)}</text>`,
  ].join('\n');
}

function frame(viewBox) {
  const [w, h] = viewBox;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${Math.min(w, 900)}" role="img">`,
    `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>`,
  ];
}

const MARKER = (id, color) =>
  `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${color}"/></marker>`;

// ── sequence ────────────────────────────────────────────────────────────────
export function sequenceSvg(spec) {
  const [W, H] = spec.meta.viewBox ?? [1040, 720];
  const ps = spec.participants;
  const margin = 26;
  const gap = ps.length > 7 ? 12 : 20;
  const boxW = (W - margin * 2 - gap * (ps.length - 1)) / ps.length;
  const cx = ps.map((_, i) => margin + boxW / 2 + i * (boxW + gap));
  const index = new Map(ps.map((p, i) => [p.id, i]));
  const out = frame(spec.meta.viewBox ?? [1040, 720]);

  out.push(`<title>${esc(spec.meta.title)}</title>`);

  // segment bands
  for (const s of spec.segments ?? []) {
    const y = s.from;
    out.push(`<line x1="${margin - 10}" y1="${y}" x2="${W - margin + 10}" y2="${y}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3 5"/>`);
    out.push(`<text x="${margin - 14}" y="${y + 4}" ${FONT} font-size="9.5" fill="#94a3b8" text-anchor="start">${esc(s.label.toUpperCase())}</text>`);
  }

  // lifelines
  for (let i = 0; i < ps.length; i++) {
    out.push(`<line x1="${cx[i].toFixed(1)}" y1="76" x2="${cx[i].toFixed(1)}" y2="${H - 20}" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="5 5"/>`);
  }

  // activations
  for (const a of spec.activations ?? []) {
    const i = index.get(a.participant);
    if (i === undefined) continue;
    const t = TYPE[a.type] ?? TYPE.backend;
    const x = cx[i] - 4.5;
    out.push(`<rect x="${x.toFixed(1)}" y="${a.from}" width="9" height="${Math.max(10, a.to - a.from)}" rx="3" fill="${t.fill}" stroke="${t.stroke}" stroke-width="1.1" opacity="0.95"/>`);
  }

  // messages
  for (const m of spec.messages) {
    const a = index.get(m.from);
    const b = index.get(m.to);
    if (a === undefined || b === undefined) continue;
    const x1 = cx[a], x2 = cx[b];
    const dir = x2 > x1 ? 1 : -1;
    const startX = x1 + dir * 5;
    const endX = x2 - dir * 5;
    const variant = m.variant ?? 'default';
    const stroke = variant === 'emphasis' ? '#10b981' : variant === 'security' ? '#ef4444' : variant === 'return' ? '#94a3b8' : '#64748b';
    const width = variant === 'emphasis' ? 2.2 : variant === 'security' ? 1.8 : 1.4;
    const dash = variant === 'dashed' || variant === 'return' ? ' stroke-dasharray="5 4"' : '';
    out.push(`<line x1="${startX.toFixed(1)}" y1="${m.y}" x2="${endX.toFixed(1)}" y2="${m.y}" stroke="${stroke}" stroke-width="${width}"${dash} marker-end="url(#arr-${variant === 'emphasis' ? 'em' : variant === 'security' ? 'sec' : 'base'})"/>`);
    if (m.label) out.push(chip((x1 + x2) / 2, m.y - 10, m.label));
  }

  // participant headers (drawn last so lifelines never bleed through)
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    const t = TYPE[p.type] ?? TYPE.backend;
    const x = cx[i] - boxW / 2;
    const label = p.label.length > 18 ? p.label.slice(0, 17) + '…' : p.label;
    out.push(`<rect x="${x.toFixed(1)}" y="18" width="${boxW.toFixed(1)}" height="56" rx="12" fill="${t.fill}" stroke="${t.stroke}" stroke-width="1.4"/>`);
    out.push(`<text x="${cx[i].toFixed(1)}" y="${p.sublabel ? 42 : 52}" text-anchor="middle" ${FONT} font-size="12" font-weight="bold" fill="${t.text}">${esc(label)}</text>`);
    if (p.sublabel) out.push(`<text x="${cx[i].toFixed(1)}" y="58" text-anchor="middle" ${FONT} font-size="9" fill="#475569">${esc(p.sublabel)}</text>`);
  }

  out.push(`<defs>${MARKER('arr-base', '#64748b')}${MARKER('arr-em', '#10b981')}${MARKER('arr-sec', '#ef4444')}</defs>`);
  out.push('</svg>');
  return out.join('\n');
}

// ── lifecycle ───────────────────────────────────────────────────────────────
export function lifecycleSvg(spec) {
  const [W, specH] = spec.meta.viewBox ?? [1040, 640];
  const lanes = spec.lanes;
  const main = lanes[0].id;
  const out = [];

  // Bands, not rows: `main` is the top band, `terminal` the bottom one, and
  // every other lane shares the single middle band (archify's contract).
  const bandOf = (lane) => (lane === main ? 0 : lanes.length === 1 ? 0 : lane === 'terminal' ? 2 : 1);
  const top = 34;
  const left = 26;
  const colW = (W - left * 2) / 5;
  const boxW = Math.min(158, colW - 22);
  const boxH = 60;
  const bandY = [top, top + 150, top + 300];
  const H = Math.min(specH, bandY[2] + boxH + 74);
  out.push(...frame([W, H]));
  out.push(`<title>${esc(spec.meta.title)}</title>`);

  for (let b = 0; b < 3; b++) {
    const bandLanes = lanes.filter((l) => bandOf(l.id) === b);
    if (!bandLanes.length) continue;
    const y = bandY[b];
    if (b > 0) out.push(`<line x1="${left - 8}" y1="${y - 34}" x2="${W - left + 8}" y2="${y - 34}" stroke="#e2e8f0" stroke-width="1"/>`);
    out.push(`<text x="${left - 10}" y="${y - 22}" ${FONT} font-size="9" fill="#94a3b8" text-anchor="start">${esc(bandLanes.map((l) => l.label).join(' + ').toUpperCase())}</text>`);
  }

  const geo = new Map();
  for (const s of spec.states) {
    const band = bandOf(s.lane);
    // lower band col 0..2 sits under main col 2..4
    const col = band === 0 ? s.col : s.col + 2;
    const x = left + col * colW + (colW - boxW) / 2;
    const y = bandY[band] + (s.yOffset ?? 0);
    geo.set(s.id, { x, y, w: boxW, h: boxH, cx: x + boxW / 2, cy: y + boxH / 2, band });
  }

  // transitions first (under the boxes); reciprocal pairs are offset so the
  // return path stays visible instead of hiding under the forward one
  const pairs = new Set((spec.transitions ?? []).map((t) => `${t.from}->${t.to}`));
  for (const t of spec.transitions ?? []) {
    const a0 = geo.get(t.from);
    const b0 = geo.get(t.to);
    if (!a0 || !b0) continue;
    const reciprocal = pairs.has(`${t.to}->${t.from}`);
    const shift = reciprocal && Math.abs(a0.cx - b0.cx) < 4 ? (pairs.has(`${t.to}->${t.from}`) && t.from < t.to ? -9 : 9) : 0;
    const a = shift ? { ...a0, cx: a0.cx + shift } : a0;
    const b = shift ? { ...b0, cx: b0.cx + shift } : b0;
    const stroke = t.variant === 'emphasis' ? '#10b981' : t.variant === 'security' ? '#ef4444' : '#94a3b8';
    const dash = t.variant === 'security' ? ' stroke-dasharray="5 4"' : '';
    let path;
    const sameX = Math.abs(a.cx - b.cx) < 4;
    if (Math.abs(a.cy - b.cy) < 6) {
      const dir = b.cx > a.cx ? 1 : -1;
      path = `M${a.cx + dir * (a.w / 2)} ${a.cy} L${b.cx - dir * (b.w / 2 + 6)} ${b.cy}`;
    } else if (sameX) {
      const down = b.cy > a.cy;
      path = `M${a.cx} ${down ? a.y + a.h : a.y} L${b.cx} ${down ? b.y - 6 : b.y + b.h + 6}`;
    } else if (b.cy > a.cy) {
      const midY = (a.y + a.h + b.y) / 2;
      path = `M${a.cx} ${a.y + a.h} L${a.cx} ${midY} L${b.cx} ${midY} L${b.cx} ${b.y - 6}`;
    } else {
      const midY = (b.y + b.h + a.y) / 2;
      path = `M${a.cx} ${a.y} L${a.cx} ${midY} L${b.cx} ${midY} L${b.cx} ${b.y + b.h + 6}`;
    }
    out.push(`<path d="${path}" fill="none" stroke="${stroke}" stroke-width="${t.variant === 'emphasis' ? 2 : 1.4}"${dash} marker-end="url(#lc-${t.variant === 'security' ? 'sec' : t.variant === 'emphasis' ? 'em' : 'base'})"/>`);
    if (t.label) out.push(chip((a.cx + b.cx) / 2, (a.cy + b.cy) / 2, t.label, 9));
  }

  // states
  for (const s of spec.states) {
    const g = geo.get(s.id);
    const t = STATE[s.type] ?? STATE.neutral;
    out.push(`<rect x="${g.x.toFixed(1)}" y="${(g.y + 3).toFixed(1)}" width="${g.w}" height="${g.h}" rx="12" fill="#0f172a" fill-opacity="0.07"/>`);
    out.push(`<rect x="${g.x.toFixed(1)}" y="${g.y.toFixed(1)}" width="${g.w}" height="${g.h}" rx="12" fill="${t.fill}" stroke="${t.stroke}" stroke-width="1.5"/>`);
    const label = s.label.length > 20 ? s.label.slice(0, 19) + '…' : s.label;
    out.push(`<text x="${g.cx.toFixed(1)}" y="${(g.y + (s.sublabel ? 26 : 35)).toFixed(1)}" text-anchor="middle" ${FONT} font-size="12" font-weight="bold" fill="${t.text}">${esc(label)}</text>`);
    if (s.sublabel) out.push(`<text x="${g.cx.toFixed(1)}" y="${(g.y + 42).toFixed(1)}" text-anchor="middle" ${FONT} font-size="9" fill="#475569">${esc(s.sublabel)}</text>`);
    if (s.tag) out.push(chip(g.cx, g.y + g.h + 11, s.tag, 8.5, '#ffffff', '#64748b'));
  }

  out.push(`<defs>${MARKER('lc-base', '#94a3b8')}${MARKER('lc-em', '#10b981')}${MARKER('lc-sec', '#ef4444')}</defs>`);
  out.push('</svg>');
  return out.join('\n');
}
