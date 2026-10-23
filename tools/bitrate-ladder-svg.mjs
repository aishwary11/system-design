#!/usr/bin/env node
/**
 * bitrate-ladder-svg.mjs — encoding ladder + ABR policy for
 * system-design-youtube.md.
 *
 * Two different things get called "the ladder": the renditions the packager
 * produces (a fixed cost per title) and the rungs the player may switch
 * between at runtime (a control loop over buffer level). Drawing them together
 * makes the trade-off visible — more rungs mean smoother adaptation and more
 * encoding cost.
 *
 * Output: diagrams/system-design/bitrate-ladder.svg
 */
import { writeFileSync } from 'node:fs';

const W = 1000;
const H = 440;
const FONT = 'font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"';
const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="900" role="img">`];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const text = (x, y, s, size = 10, fill = '#475569', bold = false, anchor = 'start') =>
  out.push(`<text x="${x}" y="${y}" ${anchor === 'middle' ? 'text-anchor="middle"' : ''} ${FONT} font-size="${size}" ${bold ? 'font-weight="bold"' : ''} fill="${fill}">${esc(s)}</text>`);

out.push(`<title>Encoding ladder and ABR switching policy</title>`);
out.push(`<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="#f8fafc" stroke="#e2e8f0"/>`);
text(40, 38, 'One master playlist, six renditions, one control loop', 13, '#312e81', true);
text(40, 56, 'the ladder is produced once per title; the player picks a rung per segment', 9.5, '#94a3b8');

const rungs = [
  { r: '240p', kbps: 300, codec: 'H.264', h: '426×240' },
  { r: '360p', kbps: 700, codec: 'H.264', h: '640×360' },
  { r: '480p', kbps: 1400, codec: 'H.264', h: '854×480' },
  { r: '720p', kbps: 2800, codec: 'H.264', h: '1280×720' },
  { r: '1080p', kbps: 5000, codec: 'H.264', h: '1920×1080' },
  { r: '4K', kbps: 16000, codec: 'HEVC', h: '3840×2160' },
];

out.push(`<rect x="40" y="76" width="520" height="${rungs.length * 44 + 24}" rx="12" fill="#ffffff" stroke="#e2e8f0"/>`);
const maxW = 200;
for (let i = 0; i < rungs.length; i++) {
  const g = rungs[i];
  const y = 104 + i * 44;
  const w = Math.max(24, (Math.log10(g.kbps) / Math.log10(16000)) * maxW);
  text(58, y, g.r, 10.5, '#312e81', true);
  text(112, y, g.h, 8.5, '#94a3b8');
  out.push(`<rect x="200" y="${y - 11}" width="${w}" height="15" rx="4" fill="${i >= 4 ? '#c7d2fe' : '#e0e7ff'}" stroke="#818cf8" stroke-width="1"/>`);
  text(200 + w + 8, y, g.kbps >= 1000 ? `${(g.kbps / 1000).toFixed(1)} Mbps` : `${g.kbps} kbps`, 8.5, '#475569');
  text(484, y, g.codec, 8.5, '#94a3b8');
}

// ABR control loop
out.push(`<rect x="590" y="76" width="370" height="${rungs.length * 44 + 24}" rx="12" fill="#ffffff" stroke="#e2e8f0"/>`);
text(610, 100, 'player control loop', 10, '#312e81', true);

// buffer sawtooth
const bx = 612, by = 300, bw = 326, bh = 96;
out.push(`<line x1="${bx}" y1="${by}" x2="${bx + bw}" y2="${by}" stroke="#cbd5e1"/>`);
out.push(`<line x1="${bx}" y1="${by}" x2="${bx}" y2="${by - bh}" stroke="#cbd5e1"/>`);
text(bx - 4, by - bh - 4, 'buffer (s)', 8, '#94a3b8');
const pts = [];
for (let i = 0; i <= 12; i++) {
  const x = bx + (i / 12) * bw;
  const level = i < 4 ? 18 + i * 6 : i < 8 ? 42 - (i - 4) * 7 : 14 + (i - 8) * 6;
  pts.push(`${x.toFixed(1)},${(by - Math.min(level, 60) * 1.4).toFixed(1)}`);
}
out.push(`<polyline points="${pts.join(' ')}" fill="none" stroke="#f59e0b" stroke-width="2"/>`);
text(bx + bw, by + 14, 'time →', 8, '#94a3b8', false, 'end');

// thresholds
out.push(`<line x1="${bx}" y1="${by - 52 * 1.4}" x2="${bx + bw}" y2="${by - 52 * 1.4}" stroke="#10b981" stroke-dasharray="4 4"/>`);
text(bx + bw - 4, by - 52 * 1.4 - 5, 'up at 10 s', 8, '#047857', false, 'end');
out.push(`<line x1="${bx}" y1="${by - 20 * 1.4}" x2="${bx + bw}" y2="${by - 20 * 1.4}" stroke="#ef4444" stroke-dasharray="4 4"/>`);
text(bx + bw - 4, by - 20 * 1.4 - 5, 'down at 4 s', 8, '#b91c1c', false, 'end');

const rules = [
  'Measure throughput over a 10 s window, not per segment.',
  'Step up one rung only with 10 s of buffer; step down two on a stall.',
  'Cap at the display and at the plan’s max resolution.',
];
rules.forEach((r, i) => text(612, 122 + i * 18, `· ${r}`, 8.5, '#64748b'));

text(40, 400, 'More rungs → smoother adaptation, but every rung is a full encode and a separate object in the manifest.', 9.5, '#64748b');
text(40, 418, '4K at 16 Mbps is 32× the 240p bitrate: the ladder is a cost decision as much as a quality one.', 9.5, '#94a3b8');

out.push('</svg>');
const target = 'diagrams/system-design/bitrate-ladder.svg';
writeFileSync(target, out.join('\n') + '\n');
console.log('wrote', target);
