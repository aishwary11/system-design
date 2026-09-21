#!/usr/bin/env node
/**
 * Embed GitHub-safe diagram references + interactive-diagram links into the markdown.
 *
 * `--export` mode: writes every spec's VALIDATED layout (archify validate
 * --layout-json) as a standalone .svg file next to its interactive HTML
 * (diagrams/system-design|concepts|features|template) so markdown, IDEs and the
 * Pages site can all reference real image files.
 *
 * Default mode: rewrites the markdown so each diagram is a plain image
 * reference (`![Title](diagrams/....svg)`) followed by the interactive-HTML
 * link line. GitHub's markdown sanitizer strips inline <svg> elements (leaving
 * their text content as a flattened paragraph with a visible <title>), so
 * markdown must reference images instead of inlining SVG markup.
 *
 * Usage: node tools/embed-svg.mjs [--export]
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, dirname, basename } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = join(homedir(), '.agents', 'skills', 'archify');
const EXPORT = process.argv.includes('--export');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- component-type palette (light theme, matches the delivered HTML) -------
const TYPE = {
  external:   { fill: '#ecfdf5', stroke: '#10b981', text: '#064e3b' },
  backend:    { fill: '#eef2ff', stroke: '#6366f1', text: '#312e81' },
  database:   { fill: '#f5f3ff', stroke: '#8b5cf6', text: '#4c1d95' },
  messagebus: { fill: '#fff7ed', stroke: '#f97316', text: '#7c2d12' },
  cloud:      { fill: '#f0f9ff', stroke: '#0ea5e9', text: '#0c4a6e' },
};
const FONT = 'font-family="JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"';

function layoutFor(specPath) {
  const out = execFileSync('node',
    [join(SKILL, 'bin', 'archify.mjs'), 'validate', 'architecture', specPath, '--quality', 'showcase', '--layout-json', '--json'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const start = out.indexOf('{');
  return JSON.parse(out.slice(start));
}

function svgMarkupFor(specPath, title) {
  const stem = basename(specPath).replace(/\.architecture\.json$/, '').replace(/[^A-Za-z0-9_-]/g, '');
  const L = layoutFor(specPath);
  const [vw, vh] = L.viewBox;
  const byId = new Map((L.components ?? []).map(c => [c.id, c]));
  const out = [];

  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" width="${Math.min(vw, 900)}" role="img" aria-label="${esc(title)}">`);
  out.push(`<title>${esc(title)}</title>`);
  out.push(`<rect x="0.5" y="0.5" width="${vw - 1}" height="${vh - 1}" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>`);

  // ---- boundaries
  for (const b of L.boundaries ?? []) {
    const boxes = (b.wraps ?? []).map(w => byId.get(w)).filter(Boolean);
    if (!boxes.length) continue;
    const x0 = Math.min(...boxes.map(b2 => b2.x)) - 18, y0 = Math.min(...boxes.map(b2 => b2.y)) - 34;
    const x1 = Math.max(...boxes.map(b2 => b2.x + b2.width)) + 18, y1 = Math.max(...boxes.map(b2 => b2.y + b2.height)) + 18;
    out.push(`<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="14" fill="none" stroke="#cbd5e1" stroke-width="1.3" stroke-dasharray="7 5"/>`);
    const blw = String(b.label).length * 7.2 + 20;
    out.push(`<rect x="${x0 + 12}" y="${y0 + 8}" width="${blw}" height="20" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>`);
    out.push(`<text x="${x0 + 12 + blw / 2}" y="${y0 + 22}" text-anchor="middle" ${FONT} font-size="11" fill="#475569">${esc(b.label)}</text>`);
  }

  // ---- connections (routes + labels under the nodes)
  for (const c of L.connections ?? []) {
    const pts = c.points ?? [];
    if (pts.length < 2) continue;
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
    const dashed = c.variant === 'dashed' ? ' stroke-dasharray="5 4"' : '';
    const emph = c.variant === 'emphasis'
      ? ` stroke="#10b981" stroke-width="2.2" marker-end="url(#arrEm-${stem})"`
      : ` stroke="#64748b" stroke-width="1.5" marker-end="url(#arr-${stem})"`
    out.push(`<path d="${d}" fill="none"${emph}${dashed}/>`);
    if (c.labelAt && c.label) {
      const [lx, ly] = c.labelAt;
      const w = Math.max(...String(c.label).split(' ').map(t => t.length)) * 6.6 + 10;
      out.push(`<rect x="${lx - w / 2}" y="${ly - 10}" width="${w}" height="20" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>`);
      out.push(`<text x="${lx}" y="${ly + 4}" text-anchor="middle" ${FONT} font-size="10.5" fill="#475569">${esc(c.label)}</text>`);
    }
  }

  // ---- components
  for (const c of L.components ?? []) {
    const t = TYPE[c.type] ?? TYPE.backend;
    out.push(`<rect x="${c.x}" y="${c.y + 3}" width="${c.width}" height="${c.height}" rx="12" fill="#0f172a" fill-opacity="0.08"/>`);
    out.push(`<rect x="${c.x}" y="${c.y}" width="${c.width}" height="${c.height}" rx="12" fill="${t.fill}" stroke="${t.stroke}" stroke-width="1.4"/>`);
    out.push(`<rect x="${c.x + 3}" y="${c.y + 3}" width="${c.width - 6}" height="${c.height - 6}" rx="9" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>`);
    const cx = c.x + c.width / 2;
    if (c.sublabel) {
      out.push(`<text x="${cx}" y="${c.y + 27}" text-anchor="middle" ${FONT} font-size="13" font-weight="bold" fill="${t.text}">${esc(c.label)}</text>`);
      out.push(`<text x="${cx}" y="${c.y + 45}" text-anchor="middle" ${FONT} font-size="10.5" fill="#475569">${esc(c.sublabel)}</text>`);
    } else {
      out.push(`<text x="${cx}" y="${c.y + 36}" text-anchor="middle" ${FONT} font-size="13" font-weight="bold" fill="${t.text}">${esc(c.label)}</text>`);
    }
  }

  out.push(`<defs><marker id="arr-${stem}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#64748b"/></marker><marker id="arrEm-${stem}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#10b981"/></marker></defs>`);
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

// ---- standalone .svg file target (sits beside its interactive HTML) ----------
function svgTarget(stem) {
  if (stem === 'template') return 'diagrams/template.svg';
  if (stem.startsWith('concept-')) return `diagrams/concepts/${stem}.svg`;
  if (stem.endsWith('-at-a-glance')) return `diagrams/features/${stem}.svg`;
  if (stem === 'redis-ai-context-layer' || stem === 'langcache-semantic-cache') return `diagrams/features/${stem}.svg`;
  return `diagrams/system-design/${stem}.svg`;
}

// ---- diagram stem -> doc title (spec's meta.title is the source of truth) ---
function specTitle(stem, file) {
  try {
    const j = JSON.parse(readFileSync(join(ROOT, 'diagrams', 'json', `${stem}.architecture.json`), 'utf8'));
    if (j.meta?.title) return j.meta.title;
  } catch { /* fall through to derived title */ }
  return titleFor(stem, file);
}

const titleFor = (stem, file) =>
  ({ 'template': 'Reference Architecture Template' }[stem])
  ?? (file === 'system-design-concepts.md'
    ? ['Sharding — Data Partitioning', 'Replication Topologies', 'Quorum Reads & Writes'][['concept-sharding', 'concept-replication', 'concept-quorum'].indexOf(stem)] ?? 'Concept'
    : null)
  ?? (/^system-design-/.test(file)
    ? stem.replace(/(^|-)(\w)/g, (_, a, b) => (a ? ' ' : '') + b.toUpperCase()) + ' — System Architecture'
    : stem.replace(/-at-a-glance$/, '').replace(/(^|-)(\w)/g, (_, a, b) => (a ? ' ' : '') + b.toUpperCase()) + ' at a Glance');

// ---- --export: write every spec's diagram as a standalone .svg file ----------
if (EXPORT) {
  const specsDir = join(ROOT, 'diagrams', 'json');
  const specs = readdirSync(specsDir).filter(f => f.endsWith('.architecture.json') && f !== 'template.architecture.json');
  specs.push('template.architecture.json'); // README embeds it; still export a real file
  let exported = 0;
  const problems = [];
  for (const f of specs) {
    const stem = f.replace(/\.architecture\.json$/, '');
    const title = titleFor(stem, stem.startsWith('concept-') ? 'system-design-concepts.md' : stem === 'template' ? 'README.md' : stem.endsWith('-at-a-glance') ? stem.replace(/-at-a-glance$/, '') + '-features.md' : 'system-design-' + stem + '.md');
    try {
      const svg = svgMarkupFor(join(specsDir, f), title);
      const target = svgTarget(stem);
      mkdirSync(dirname(join(ROOT, target)), { recursive: true });
      writeFileSync(join(ROOT, target), svg + '\n');
      exported++;
    } catch (e) {
      problems.push(`${stem}: ${e.message}`);
    }
  }
  console.log(`exported ${exported} standalone svg files${problems.length ? '\nPROBLEMS:\n' + problems.join('\n') : ''}`);
  if (problems.length) process.exit(1);
  process.exit(0);
}

// ---- walk the markdown: image reference + interactive link -------------------
const files = readdirSync(ROOT).filter(f => /\.md$/.test(f)).sort();
let converted = 0;
const problems = [];

const STEM_BY_FILE_BLOCK = (file, blockIdx) => {
  if (file === 'system-design-concepts.md') return 'concept-' + ['sharding', 'replication', 'quorum'][blockIdx];
  if (/^system-design-/.test(file)) return file.replace(/^system-design-/, '').replace(/\.md$/, '');
  if (file === 'README.md') return 'template';
  if (file === 'cloud.md') return 'cloud-at-a-glance';
  return file.replace(/-features\.md$/, '') + '-at-a-glance';
};

for (const file of files) {
  const src = readFileSync(join(ROOT, file), 'utf8');
  if (!src.includes('<svg') && !src.includes('```mermaid') && !/!\[[^\]]*\]\(diagrams\/[^)]+\.svg\)/.test(src)) continue;
  let blockIdx = 0;
  let out = src;

  // Pass 1 (historical): swap mermaid fences for an image ref + standard link.
  out = out.replace(/```mermaid\r?\n[\s\S]*?```/g, () => {
    const stem = STEM_BY_FILE_BLOCK(file, blockIdx++);
    const title = titleFor(stem, file);
    try {
      const svgPath = svgTarget(stem);
      const target = htmlTarget(stem);
      const title = specTitle(stem, file);
      const svg = svgMarkupFor(join(ROOT, 'diagrams', 'json', `${stem}.architecture.json`), title);
      writeFileSync(join(ROOT, svgPath), svg + '\n');
      converted++;
      return `![${title}](${svgPath})\n\n**Interactive diagram:** [${target}](${target}) — pan/zoom, search, dark/light theme, PNG/SVG export.\n`;
    } catch (e) {
      problems.push(`${file} [${stem}]: ${e.message}`);
      return '```mermaid (conversion failed)```';
    }
  });

  // Pass 2 (legacy): convert previously-inlined <svg>…</svg> blocks into image
  // references (GitHub strips inline SVGs from markdown, flattening them into
  // visible text). Keyed by the link target; regenerates the .svg file too.
  out = out.replace(/<svg\b[\s\S]*?<\/svg>\s*\n?\s*\*\*Interactive diagram:\*\* \[[^\]]*\]\((diagrams\/[^)\s]+)\)[^\n]*(\r?\n)?/g, (m, target) => {
    const stem = target.split('/').pop().replace(/(\.architecture)?\.html$/, '');
    const title = specTitle(stem, file);
    try {
      const svgPath = svgTarget(stem);
      const svg = svgMarkupFor(join(ROOT, 'diagrams', 'json', `${stem}.architecture.json`), title);
      writeFileSync(join(ROOT, svgPath), svg + '\n');
      converted++;
      return `![${title}](${svgPath})\n\n**Interactive diagram:** [${target}](${target}) — pan/zoom, search, dark/light theme, PNG/SVG export.\n`;
    } catch (e) {
      problems.push(`${file} [${stem}]: ${e.message}`);
      return m;
    }
  });

  // Pass 3 (idempotent): refresh existing image embeds — keep alt text in sync
  // with the spec's meta.title (paths and link lines unchanged).
  out = out.replace(/!\[([^\]]*)\]\((diagrams\/[^)]+\.svg)\)/g, (m, alt, svgPath) => {
    const stem = svgPath.split('/').pop().replace(/\.svg$/, '');
    const title = specTitle(stem, file);
    if (alt === title) return m;
    converted++;
    return m.replace(/^!\[[^\]]*\]/, `![${title}]`);
  });

  if (out !== src) writeFileSync(join(ROOT, file), out);
}
console.log(`refreshed ${converted} markdown embeds${problems.length ? '\nPROBLEMS:\n' + problems.join('\n') : ''}`);
if (problems.length) process.exit(1);
