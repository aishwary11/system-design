#!/usr/bin/env node
/**
 * Embed GitHub-safe inline SVGs + interactive-diagram links into the markdown.
 *
 * For each mermaid block (same discovery order as convert-mermaid.mjs) this
 * takes the spec's VALIDATED layout (`archify validate --layout-json`: exact
 * boxes, orthogonal route points, label positions, viewBox) and renders a
 * self-contained light-themed SVG that GitHub renders inline. The mermaid
 * block is replaced with the SVG plus one link line to the interactive HTML
 * in its topic folder (diagrams/system-design|concepts|features|template).
 *
 * Usage: node tools/embed-svg.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = join(homedir(), '.agents', 'skills', 'archify');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- component-type palette (light theme, matches the delivered HTML) -------
const TYPE = {
  external:   { fill: '#ecfdf5', stroke: '#059669', text: '#065f46', icon: '' },
  backend:    { fill: '#eef2ff', stroke: '#6366f1', text: '#3730a3', icon: '' },
  database:   { fill: '#f5f3ff', stroke: '#7c3aed', text: '#5b21b6', icon: '' },
  messagebus: { fill: '#fff7ed', stroke: '#ea580c', text: '#9a3412', icon: '' },
  cloud:      { fill: '#f0f9ff', stroke: '#0284c7', text: '#075985', icon: '' },
};
const FONT = 'font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace"';

function layoutFor(specPath) {
  const out = execFileSync('node',
    [join(SKILL, 'bin', 'archify.mjs'), 'validate', 'architecture', specPath, '--quality', 'showcase', '--layout-json', '--json'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const start = out.indexOf('{');
  return JSON.parse(out.slice(start));
}

function svgFor(specPath, title) {
  const stem = specPath.replace(/.*[\/]/, '').replace(/.architecture.json$/, '');
  const L = layoutFor(specPath);
  const [vw, vh] = L.viewBox;
  const byId = new Map((L.components ?? []).map(c => [c.id, c]));
  const out = [];

  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" width="${Math.min(vw, 900)}" role="img" aria-label="${esc(title)}">`);
  out.push(`<rect x="0" y="0" width="${vw}" height="${vh}" fill="#ffffff"/>`);
  out.push(`<title>${esc(title)}</title>`);

  // ---- boundaries
  for (const b of L.boundaries ?? []) {
    const boxes = (b.wraps ?? []).map(w => byId.get(w)).filter(Boolean);
    if (!boxes.length) continue;
    const x0 = Math.min(...boxes.map(b2 => b2.x)) - 18, y0 = Math.min(...boxes.map(b2 => b2.y)) - 34;
    const x1 = Math.max(...boxes.map(b2 => b2.x + b2.width)) + 18, y1 = Math.max(...boxes.map(b2 => b2.y + b2.height)) + 18;
    out.push(`<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="10" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6 4"/>`);
    out.push(`<text x="${x0 + 14}" y="${y0 + 20}" ${FONT} font-size="12" fill="#475569">${esc(b.label)}</text>`);
  }

  // ---- connections (routes + labels under the nodes)
  for (const c of L.connections ?? []) {
    const pts = c.points ?? [];
    if (pts.length < 2) continue;
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
    const dashed = c.variant === 'dashed' ? ' stroke-dasharray="5 4"' : '';
    const emph = c.variant === 'emphasis' ? ' stroke="#059669" stroke-width="2.4"' : ' stroke="#64748b" stroke-width="1.6"';
    out.push(`<path d="${d}" fill="none"${emph}${dashed} marker-end="url(#arr-${stem})"/>`);
    if (c.labelAt && c.label) {
      const [lx, ly] = c.labelAt;
      const w = Math.max(...String(c.label).split(' ').map(t => t.length)) * 6.6 + 10;
      out.push(`<rect x="${lx - w / 2}" y="${ly - 9}" width="${w}" height="18" rx="4" fill="#ffffff" stroke="#e2e8f0"/>`);
      out.push(`<text x="${lx}" y="${ly + 4}" text-anchor="middle" ${FONT} font-size="11" fill="#475569">${esc(c.label)}</text>`);
    }
  }

  // ---- components
  for (const c of L.components ?? []) {
    const t = TYPE[c.type] ?? TYPE.backend;
    out.push(`<rect x="${c.x}" y="${c.y}" width="${c.width}" height="${c.height}" rx="9" fill="${t.fill}" stroke="${t.stroke}" stroke-width="1.6"/>`);
    const cx = c.x + c.width / 2;
    if (c.sublabel) {
      out.push(`<text x="${cx}" y="${c.y + 27}" text-anchor="middle" ${FONT} font-size="13" font-weight="bold" fill="${t.text}">${esc(c.label)}</text>`);
      out.push(`<text x="${cx}" y="${c.y + 45}" text-anchor="middle" ${FONT} font-size="10" fill="#64748b">${esc(c.sublabel)}</text>`);
    } else {
      out.push(`<text x="${cx}" y="${c.y + 36}" text-anchor="middle" ${FONT} font-size="13" font-weight="bold" fill="${t.text}">${esc(c.label)}</text>`);
    }
  }

  out.push(`<defs><marker id="arr-${stem}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker></defs>`);
  out.push(`</svg>`);
  return out.join('\n');
}

// ---- html target for the interactive link (mirror of archify-all.mjs) --------
function htmlTarget(stem) {
  if (stem === 'template') return 'diagrams/template.html';
  if (stem.startsWith('concept-')) return `diagrams/concepts/${stem}.architecture.html`; // concept-sharding etc.
  if (stem.endsWith('-at-a-glance')) return `diagrams/features/${stem}.architecture.html`;
  if (stem === 'redis-ai-context-layer' || stem === 'langcache-semantic-cache') return `diagrams/features/${stem}.architecture.html`;
  return `diagrams/system-design/${stem}.architecture.html`;
}

// ---- walk the markdown, same order as the converter --------------------------
const files = readdirSync(ROOT).filter(f => /\.md$/.test(f)).sort();
let replaced = 0;
const problems = [];

const STEM_BY_FILE_BLOCK = (file, blockIdx) => {
  if (file === 'system-design-concepts.md') return 'concept-' + ['sharding', 'replication', 'quorum'][blockIdx];
  if (/^system-design-/.test(file)) return file.replace(/^system-design-/, '').replace(/\.md$/, '');
  if (file === 'README.md') return 'template';
  return file.replace(/-features\.md$/, '') + '-at-a-glance';
};

// diagram stem -> doc title (kept in sync with convert-mermaid.mjs naming)
const titleFor = (stem, file) =>
  ({ 'template': 'Reference Architecture Template' }[stem])
  ?? (file === 'system-design-concepts.md'
    ? ['Sharding — Data Partitioning', 'Replication Topologies', 'Quorum Reads & Writes'][['concept-sharding', 'concept-replication', 'concept-quorum'].indexOf(stem)] ?? 'Concept'
    : null)
  ?? (/^system-design-/.test(file)
    ? stem.replace(/(^|-)(\w)/g, (_, a, b) => (a ? ' ' : '') + b.toUpperCase()) + ' — System Architecture'
    : stem.replace(/-at-a-glance$/, '').replace(/(^|-)(\w)/g, (_, a, b) => (a ? ' ' : '') + b.toUpperCase()) + ' at a Glance');

for (const file of files) {
  const src = readFileSync(join(ROOT, file), 'utf8');
  if (!src.includes('<svg') && !src.includes('```mermaid')) continue;
  let blockIdx = 0;
  let out = src;

  // Pass 1 (historical): swap mermaid fences for svg + standard link.
  out = out.replace(/```mermaid\r?\n[\s\S]*?```/g, () => {
    const stem = STEM_BY_FILE_BLOCK(file, blockIdx++);
    const title = titleFor(stem, file);
    try {
      const target = htmlTarget(stem);
      const svg = svgFor(join(ROOT, 'diagrams', 'json', `${stem}.architecture.json`), title);
      replaced++;
      return svg + '\n' + `**Interactive diagram:** [${target}](${target}) — pan/zoom, search, dark/light theme, PNG/SVG export.\n`;
    } catch (e) {
      problems.push(`${file} [${stem}]: ${e.message}`);
      return '```mermaid (conversion failed)```';
    }
  });

  // Pass 2 (idempotent): refresh existing svg + link blocks, keyed by the link target.
  out = out.replace(/<svg\b[\s\S]*?<\/svg>\n+\*\*[^*]*\*\* \[[^\]]+\]\((diagrams\/[^)\s]+)\)[^\n]*\n/g, (m, target) => {
    const stem = target.split('/').pop().replace(/(\.architecture)?\.html$/, '');
    const title = titleFor(stem, file);
    try {
      const svg = svgFor(join(ROOT, 'diagrams', 'json', `${stem}.architecture.json`), title);
      replaced++;
      return svg + '\n\n' + m.slice(m.indexOf('**'));
    } catch (e) {
      problems.push(`${file} [${stem}]: ${e.message}`);
      return m;
    }
  });

  if (out !== src) writeFileSync(join(ROOT, file), out);
}
console.log(`embedded ${replaced} svg diagrams${problems.length ? '\nPROBLEMS:\n' + problems.join('\n') : ''}`);
