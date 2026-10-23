#!/usr/bin/env node
/**
 * bit-layout-svg.mjs — Snowflake id bit layout for
 * system-design-unique-id-generator.md.
 *
 * The whole argument for Snowflake is arithmetic on the field widths, which a
 * table states but a bar makes obvious: 41 bits of milliseconds is ~69 years,
 * 10 bits of machine is 1024 generators, 12 bits of sequence is 4096 ids per
 * millisecond per machine.
 *
 * Output: diagrams/system-design/snowflake-layout.svg
 */
import { writeFileSync } from 'node:fs';

const W = 1000;
const H = 310;
const FONT = 'font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"';
const out = [];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="900" role="img">`);
out.push(`<title>Snowflake id layout — sign, 41-bit timestamp, 10-bit machine, 12-bit sequence</title>`);
out.push(`<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="#f8fafc" stroke="#e2e8f0"/>`);
out.push(`<text x="40" y="40" ${FONT} font-size="13" font-weight="bold" fill="#312e81">Snowflake — 64 bits, sortable by time, generated without coordination</text>`);

const x0 = 40;
const y = 66;
const h = 58;
const fields = [
  { w: 62, label: 'sign', bits: '1 bit', fill: '#f8fafc', stroke: '#cbd5e1', ink: '#64748b', note: 'always 0' },
  { w: 358, label: 'timestamp (ms since custom epoch)', bits: '41 bits', fill: '#eef2ff', stroke: '#6366f1', ink: '#312e81', note: '≈ 69 years' },
  { w: 218, label: 'machine id', bits: '10 bits', fill: '#f5f3ff', stroke: '#8b5cf6', ink: '#4c1d95', note: '1,024 generators' },
  { w: 282, label: 'sequence', bits: '12 bits', fill: '#ecfdf5', stroke: '#10b981', ink: '#064e3b', note: '4,096 ids / ms / machine' },
];
let cx = x0;
for (const f of fields) {
  out.push(`<rect x="${cx}" y="${y}" width="${f.w}" height="${h}" rx="6" fill="${f.fill}" stroke="${f.stroke}" stroke-width="1.6"/>`);
  out.push(`<text x="${cx + f.w / 2}" y="${y + 24}" text-anchor="middle" ${FONT} font-size="11" font-weight="bold" fill="${f.ink}">${esc(f.label)}</text>`);
  out.push(`<text x="${cx + f.w / 2}" y="${y + 40}" text-anchor="middle" ${FONT} font-size="9.5" fill="#64748b">${esc(f.bits)}</text>`);
  out.push(`<text x="${cx + f.w / 2}" y="${y + h + 18}" text-anchor="middle" ${FONT} font-size="9" fill="#94a3b8">${esc(f.note)}</text>`);
  cx += f.w;
}

// worked example
const ey = 152;
const ex = [
  { w: 62, t: '0' },
  { w: 358, t: '0001 0111 0010 … 1010 (ms)' },
  { w: 218, t: '0000001011 (node 11)' },
  { w: 282, t: '0000 0010 1001 (seq 41)' },
];
let exx = x0;
for (const e of ex) {
  out.push(`<rect x="${exx}" y="${ey + 10}" width="${e.w}" height="34" rx="5" fill="#ffffff" stroke="#e2e8f0"/>`);
  out.push(`<text x="${exx + e.w / 2}" y="${ey + 32}" text-anchor="middle" ${FONT} font-size="9.5" fill="#475569">${esc(e.t)}</text>`);
  exx += e.w;
}

const bullets = [
  'Sortable by time inside one machine; across machines it is only roughly ordered (clock skew).',
  'Throughput ceiling is 4,096 ids/ms/generator — 4.096M/s per node.',
  'A backwards clock step is the failure to guard: refuse to emit, or borrow the next millisecond.',
];
bullets.forEach((b, i) => {
  out.push(`<text x="${x0}" y="${232 + i * 20}" ${FONT} font-size="9.5" fill="#64748b">· ${esc(b)}</text>`);
});

out.push('</svg>');
const target = 'diagrams/system-design/snowflake-layout.svg';
writeFileSync(target, out.join('\n') + '\n');
console.log('wrote', target);
