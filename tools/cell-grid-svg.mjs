#!/usr/bin/env node
/**
 * cell-grid-svg.mjs — the geohash-vs-H3 comparison figure used by
 * system-design-food-delivery.md.
 *
 * Both indexes answer "which cells are near this point", but their geometry
 * differs in a way prose keeps getting wrong: a geohash cell is a rectangle
 * whose parent is a string prefix, while an H3 cell is a hexagon with six
 * equidistant neighbours that refines through 16 resolutions. The figure is
 * hand-drawn because neither relation is a component graph, a sequence or a
 * state machine.
 *
 * Output: diagrams/system-design/geohash-h3.svg
 */
import { writeFileSync } from 'node:fs';

const W = 1000;
const H = 430;
const FONT = 'font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"';
const out = [];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="900" role="img">`);
out.push(`<title>Geohash cells versus H3 cells — parentage and neighbour distance</title>`);
out.push(`<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="#f8fafc" stroke="#e2e8f0"/>`);

// ── left: geohash grid ──────────────────────────────────────────────────────
out.push(`<text x="40" y="42" ${FONT} font-size="13" font-weight="bold" fill="#312e81">Geohash — rectangular cells, prefix is the parent</text>`);
out.push(`<text x="40" y="62" ${FONT} font-size="10" fill="#64748b">truncate the string one character and you move up one level</text>`);

const gx = 44, gy = 86, cell = 86;
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 4; c++) {
    const on = r === 1 && c === 1;
    out.push(`<rect x="${gx + c * cell}" y="${gy + r * cell}" width="${cell}" height="${cell}" fill="${on ? '#eef2ff' : '#ffffff'}" stroke="${on ? '#6366f1' : '#e2e8f0'}" stroke-width="${on ? 2 : 1}"/>`);
    if (on) {
      out.push(`<text x="${gx + c * cell + cell / 2}" y="${gy + r * cell + 30}" text-anchor="middle" ${FONT} font-size="11" font-weight="bold" fill="#312e81">9q8yy</text>`);
      out.push(`<text x="${gx + c * cell + cell / 2}" y="${gy + r * cell + 46}" text-anchor="middle" ${FONT} font-size="8.5" fill="#6366f1">res 5</text>`);
    }
  }
}
out.push(`<text x="${gx}" y="${gy + 3 * cell + 22}" ${FONT} font-size="9.5" fill="#94a3b8">8 neighbours share a prefix; the 4 corner cells only touch diagonally</text>`);

// prefix ladder
const chips = [['9q', 'country'], ['9q8', 'region'], ['9q8y', 'city'], ['9q8yy', 'block']];
chips.forEach(([p, role], i) => {
  const x = 44 + i * 104;
  const y = gy + 3 * cell + 42;
  const on = i === chips.length - 1;
  out.push(`<rect x="${x}" y="${y}" width="92" height="34" rx="8" fill="${on ? '#eef2ff' : '#ffffff'}" stroke="${on ? '#6366f1' : '#e2e8f0'}"/>`);
  out.push(`<text x="${x + 46}" y="${y + 15}" text-anchor="middle" ${FONT} font-size="10.5" font-weight="bold" fill="${on ? '#312e81' : '#475569'}">${p}</text>`);
  out.push(`<text x="${x + 46}" y="${y + 27}" text-anchor="middle" ${FONT} font-size="8" fill="#94a3b8">${role}</text>`);
});

// ── right: H3 hexagons ──────────────────────────────────────────────────────
out.push(`<text x="520" y="42" ${FONT} font-size="13" font-weight="bold" fill="#064e3b">H3 — hexagonal cells, six equidistant neighbours</text>`);
out.push(`<text x="520" y="62" ${FONT} font-size="10" fill="#64748b">16 resolutions; k-ring 1 always returns exactly 7 cells</text>`);

const cx = 690, cy = 210, R = 54;
const hex = (x, y, r) => {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i);
    pts.push(`${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
};
const dx = 1.5 * R;
const dy = Math.sqrt(3) / 2 * R;
const cells = [
  [0, 0, 'center'],
  [dx, dy, 'se'], [-dx, dy, 'sw'],
  [dx, -dy, 'ne'], [-dx, -dy, 'nw'],
  [0, 2 * dy, 's'], [0, -2 * dy, 'n'],
];
for (const [ox, oy, id] of cells) {
  const on = id === 'center';
  out.push(`<polygon points="${hex(cx + ox, cy + oy, R - 2)}" fill="${on ? '#ecfdf5' : '#ffffff'}" stroke="${on ? '#10b981' : '#cbd5e1'}" stroke-width="${on ? 2 : 1}"/>`);
  out.push(`<text x="${(cx + ox).toFixed(1)}" y="${(cy + oy + 4).toFixed(1)}" text-anchor="middle" ${FONT} font-size="${on ? 10 : 8.5}" font-weight="${on ? 'bold' : 'normal'}" fill="${on ? '#064e3b' : '#94a3b8'}">${on ? 'res 9' : 'k=1'}</text>`);
}
out.push(`<text x="520" y="${cy + 2 * dy + R + 18}" ${FONT} font-size="9.5" fill="#94a3b8">Every neighbour centre is the same distance away — no diagonal corner case.</text>`);
out.push(`<text x="520" y="${cy + 2 * dy + R + 36}" ${FONT} font-size="9.5" fill="#94a3b8">Child cells are <tspan font-weight="bold" fill="#475569">approximately</tspan> contained — H3 refines, it does not nest.</text>`);

out.push('</svg>');
const target = 'diagrams/system-design/geohash-h3.svg';
writeFileSync(target, out.join('\n') + '\n');
console.log('wrote', target);
