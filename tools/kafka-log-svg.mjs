#!/usr/bin/env node
/**
 * kafka-log-svg.mjs — Kafka partition anatomy for kafka-features.md.
 *
 * "A topic is a log" is the sentence everyone repeats and the picture that
 * almost nobody draws: partitions are independent logs, a log is a directory
 * of segment files, and the interesting numbers are three offsets — the high
 * watermark, the log end offset, and where each consumer group has committed.
 *
 * Output: diagrams/system-design/kafka-partition.svg
 */
import { writeFileSync } from 'node:fs';

const W = 1000;
const H = 500;
const FONT = 'font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"';
const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="900" role="img">`];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const text = (x, y, s, size = 10, fill = '#475569', bold = false, anchor = 'start') =>
  out.push(`<text x="${x}" y="${y}" ${anchor === 'middle' ? 'text-anchor="middle"' : ''} ${FONT} font-size="${size}" ${bold ? 'font-weight="bold"' : ''} fill="${fill}">${esc(s)}</text>`);

out.push(`<title>Kafka topic, partitions and the anatomy of one partition log</title>`);
out.push(`<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="#f8fafc" stroke="#e2e8f0"/>`);
text(40, 38, 'Kafka — a topic is N independent logs; a log is a directory of segments', 13, '#7c2d12', true);

// ── topic / partitions ─────────────────────────────────────────────────────
text(40, 68, 'topic: orders   (3 partitions, replication factor 3)', 9.5, '#94a3b8');
const parts = [
  { id: 'P0', leader: 'B1', replicas: 'B2, B3', x: 40 },
  { id: 'P1', leader: 'B2', replicas: 'B1, B3', x: 300 },
  { id: 'P2', leader: 'B3', replicas: 'B1, B2', x: 560 },
];
for (const p of parts) {
  const on = p.id === 'P1';
  out.push(`<rect x="${p.x}" y="80" width="200" height="52" rx="10" fill="${on ? '#fff7ed' : '#ffffff'}" stroke="${on ? '#f97316' : '#e2e8f0'}" stroke-width="${on ? 2 : 1.2}"/>`);
  text(p.x + 14, 100, p.id, 11, on ? '#7c2d12' : '#475569', true);
  text(p.x + 14, 116, `leader ${p.leader} · ISR ${p.replicas}`, 8.5, '#64748b');
}
text(790, 100, 'key → partition', 9.5, '#64748b');
text(790, 116, 'hash(key) % 3', 9.5, '#94a3b8');

// ── one partition in detail ────────────────────────────────────────────────
text(40, 176, 'partition P1 — segment files on disk', 10, '#7c2d12', true);
const segs = [
  { name: '000000000000.log', from: 0, to: 4095, x: 60, w: 300, active: false },
  { name: '000000004096.log', from: 4096, to: 8191, x: 372, w: 280, active: false },
  { name: '000000008192.log', from: 8192, to: '…', x: 664, w: 270, active: true },
];
for (const s of segs) {
  out.push(`<rect x="${s.x}" y="196" width="${s.w}" height="54" rx="6" fill="${s.active ? '#fff7ed' : '#ffffff'}" stroke="${s.active ? '#f97316' : '#e2e8f0'}" stroke-width="1.4"/>`);
  text(s.x + 10, 214, s.name, 8.5, '#475569');
  text(s.x + 10, 232, `offsets ${s.from}–${s.to}`, 8.5, '#94a3b8');
  if (s.active) text(s.x + s.w - 40, 232, 'active', 8.5, '#c2410c', false, 'middle');
}
// index files
segs.forEach((s, i) => {
  out.push(`<rect x="${s.x}" y="258" width="${s.w}" height="18" rx="4" fill="#fdf2f8" stroke="#f9a8d4" stroke-width="1"/>`);
  text(s.x + 8, 271, i === 0 ? '000000000000.index (sparse, every 4 KB)' : '  .index + .timeindex', 7.5, '#9d174d');
});

// offsets on the active tail
const wmX = 884;
const leoX = 930;
out.push(`<line x1="${wmX}" y1="186" x2="${wmX}" y2="288" stroke="#10b981" stroke-width="1.8"/>`);
out.push(`<line x1="${leoX}" y1="186" x2="${leoX}" y2="288" stroke="#ef4444" stroke-width="1.8" stroke-dasharray="4 3"/>`);
text(wmX - 12, 176, 'HW 1 042', 8.5, '#047857', true, 'middle');
text(leoX - 2, 156, 'LEO 1 050', 8.5, '#b91c1c', true, 'end');

// consumer positions
out.push(`<path d="M820 196 L820 178 L836 184 Z" fill="#6366f1"/>`);
text(800, 166, 'group A committed 1 042', 8.5, '#4338ca');

text(40, 322, 'Replication: followers fetch the same bytes and append them in order; a record is committed once it is on every in-sync replica (ISR).', 9.5, '#94a3b8');

// ── consumer group row ─────────────────────────────────────────────────────
text(40, 366, 'consumer group offsets — the number that decides replay and lag', 10, '#7c2d12', true);
const cons = [
  { id: 'C1', part: 'P1', committed: '1 042', lag: '8', x: 60, color: '#6366f1' },
  { id: 'C2', part: 'P0', committed: '2 118', lag: '0', x: 300, color: '#10b981' },
  { id: 'C3', part: 'P2', committed: '1 907', lag: '21', x: 540, color: '#8b5cf6' },
];
for (const c of cons) {
  out.push(`<rect x="${c.x}" y="380" width="200" height="46" rx="9" fill="#ffffff" stroke="#e2e8f0"/>`);
  text(c.x + 12, 398, `${c.id} → ${c.part}`, 10, '#334155', true);
  text(c.x + 12, 414, `committed ${c.committed} · lag ${c.lag}`, 8.5, '#64748b');
  out.push(`<circle cx="${c.x + 188}" cy="392" r="4" fill="${c.color}"/>`);
}
text(770, 398, 'retention: delete after 7 d', 9, '#64748b');
text(770, 414, 'compaction: keep last per key', 9, '#64748b');

const notes = [
  'Offsets are per partition and monotonic — global ordering only exists inside one partition.',
  'HW is what consumers may read; LEO is where the leader is writing. The gap is replication lag.',
  'A consumer’s committed offset is its replay point: reset it backwards and you reprocess, not corrupt.',
];
notes.forEach((n, i) => text(40, 456 + i * 18, `· ${n}`, 9.5, '#64748b'));

out.push('</svg>');
const target = 'diagrams/system-design/kafka-partition.svg';
writeFileSync(target, out.join('\n') + '\n');
console.log('wrote', target);
