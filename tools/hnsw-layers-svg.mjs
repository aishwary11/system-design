#!/usr/bin/env node
/**
 * hnsw-layers-svg.mjs — HNSW index anatomy for system-design-search-engine.md.
 *
 * A vector index is the one part of a search stack that a component diagram
 * cannot explain: the cost model lives in the layer structure (sparse express
 * lanes on top, dense local graph at layer 0) and in the descent, not in the
 * boxes. This draws the layers, the links and one query walk.
 *
 * Output: diagrams/system-design/hnsw-layers.svg
 */
import { writeFileSync } from 'node:fs';

const W = 1000;
const H = 470;
const FONT = 'font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"';
const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="900" role="img">`];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

out.push(`<title>HNSW — sparse upper layers, dense layer 0, and a greedy descent</title>`);
out.push(`<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" fill="#f8fafc" stroke="#e2e8f0"/>`);
out.push(`<text x="40" y="38" ${FONT} font-size="13" font-weight="bold" fill="#312e81">HNSW — sparse layers for reach, dense layer 0 for recall</text>`);

const layers = [
  { id: 'L2', label: 'layer 2', y: 96, nodes: [268, 470, 640], edges: [[0, 1], [1, 2]] },
  { id: 'L1', label: 'layer 1', y: 186, nodes: [200, 330, 430, 560, 660, 780], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [1, 3]] },
  {
    id: 'L0',
    label: 'layer 0',
    y: 296,
    nodes: [170, 250, 330, 390, 460, 530, 590, 660, 730, 800, 860],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [1, 3], [4, 6], [6, 8], [8, 10]],
  },
];

const r = 13;
for (const l of layers) {
  out.push(`<line x1="40" y1="${l.y + 44}" x2="${W - 40}" y2="${l.y + 44}" stroke="#e2e8f0" stroke-dasharray="3 5"/>`);
  out.push(`<text x="40" y="${l.y - 26}" ${FONT} font-size="9.5" fill="#94a3b8">${l.label.toUpperCase()}</text>`);
  for (const [a, b] of l.edges) {
    out.push(`<line x1="${l.nodes[a]}" y1="${l.y}" x2="${l.nodes[b]}" y2="${l.y}" stroke="#c7d2fe" stroke-width="1.6"/>`);
  }
  l.nodes.forEach((x, i) => {
    const entry = l.id === 'L2' && i === 0;
    out.push(`<circle cx="${x}" cy="${l.y}" r="${r}" fill="${entry ? '#ecfdf5' : '#ffffff'}" stroke="${entry ? '#10b981' : '#818cf8'}" stroke-width="${entry ? 2.2 : 1.5}"/>`);
    if (entry) out.push(`<text x="${x}" y="${l.y - 22}" text-anchor="middle" ${FONT} font-size="8.5" fill="#059669">entry</text>`);
  });
}

// greedy descent: hop on L2, drop, hop on L1, drop, local search on L0
const path = [
  [268, 96], [470, 96], [470, 186], [560, 186], [560, 296], [590, 296],
];
out.push(`<path d="M${path.map((p) => p.join(' ')).join(' L')}" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-dasharray="6 4" marker-end="url(#hnsw-arrow)"/>`);
path.slice(1, -1).forEach(([x, y]) => out.push(`<circle cx="${x}" cy="${y}" r="3.5" fill="#f59e0b"/>`));

// query + result
out.push(`<rect x="${W - 132}" y="70" width="96" height="38" rx="9" fill="#fffbeb" stroke="#f59e0b"/>`);
out.push(`<text x="${W - 84}" y="88" text-anchor="middle" ${FONT} font-size="10" font-weight="bold" fill="#78350f">query</text>`);
out.push(`<text x="${W - 84}" y="101" text-anchor="middle" ${FONT} font-size="8.5" fill="#92400e">k=10, ef=64</text>`);
out.push(`<line x1="${W - 132}" y1="89" x2="${520}" y2="89" stroke="#f59e0b" stroke-width="1.6" stroke-dasharray="5 4"/>`);

out.push(`<path d="M604 302 L640 322 L660 330" fill="none" stroke="#10b981" stroke-width="1.8" marker-end="url(#hnsw-green)"/>`);
out.push(`<rect x="666" y="326" width="120" height="34" rx="8" fill="#ecfdf5" stroke="#10b981"/>`);
out.push(`<text x="726" y="347" text-anchor="middle" ${FONT} font-size="9.5" fill="#064e3b">10 nearest</text>`);

const notes = [
  'Each layer keeps M=16 links; upper layers are sampled subsets, so a hop there covers distance cheaply.',
  'Descent is greedy: keep the closest neighbour, drop a layer when no neighbour improves, refine at layer 0.',
  'Search cost is O(log N) hops plus ef·M distance computations at the base layer — recall is tuned by ef.',
];
notes.forEach((n, i) => out.push(`<text x="40" y="${404 + i * 20}" ${FONT} font-size="9.5" fill="#64748b">· ${esc(n)}</text>`));

out.push(`<defs><marker id="hnsw-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#f59e0b"/></marker><marker id="hnsw-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#10b981"/></marker></defs>`);
out.push('</svg>');

const target = 'diagrams/system-design/hnsw-layers.svg';
writeFileSync(target, out.join('\n') + '\n');
console.log('wrote', target);
