#!/usr/bin/env node
/**
 * build-pages.mjs — builds the GitHub Pages site into ./site
 *
 * 1. Copies diagrams/ (interactive HTML + specs) and simulator/ into site/
 * 2. Scans diagrams/json/*.architecture.json for diagram metadata
 * 3. Renders a static index.html grouping every diagram by category,
 *    with the system designs grouped by the topics authored in README.md
 *
 * Zero dependencies. Run: node tools/build-pages.mjs
 */
import {
  readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync, cpSync,
} from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SITE = join(ROOT, 'site');
const CATEGORIES = [
  { dir: 'system-design', label: 'System Designs', icon: '🏗️', blurb: 'End-to-end designs: feed ranking, delivery routing, leaderboards, search, ads, and more' },
  { dir: 'features',      label: 'Technology Guides', icon: '🧰', blurb: 'At-a-glance architecture of Redis, Kafka, PostgreSQL, Kubernetes, agentic AI, and the cloud' },
  { dir: 'concepts',      label: 'Core Concepts', icon: '🧠', blurb: 'Foundational patterns: caching, consistency, distribution' },
  { dir: 'reference',     label: 'Reference', icon: '📐', blurb: 'Reusable architecture templates and reference diagrams' },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const lc = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// ── 1. clean output + copy assets ───────────────────────────────────────────
rmSync(SITE, { recursive: true, force: true });
mkdirSync(SITE, { recursive: true });
cpSync(join(ROOT, 'diagrams'), join(SITE, 'diagrams'), { recursive: true });
cpSync(join(ROOT, 'simulator'), join(SITE, 'simulator'), { recursive: true });
writeFileSync(join(SITE, '.nojekyll'), ''); // skip Jekyll processing on Pages

// ── 2. collect diagram metadata from specs ──────────────────────────────────
const specs = readdirSync(join(ROOT, 'diagrams', 'json')).filter((f) => f.endsWith('.architecture.json'));
const groups = new Map(CATEGORIES.map((c) => [c.dir, []]));
let unmapped = 0;

for (const file of specs) {
  const spec = JSON.parse(readFileSync(join(ROOT, 'diagrams', 'json', file), 'utf8'));
  const out = spec.meta?.output;
  if (!out) continue;
  const isTemplate = file === 'template.architecture.json';
  const cat = isTemplate
    ? CATEGORIES.find((c) => c.dir === 'reference')
    : CATEGORIES.find((c) => existsSync(join(ROOT, 'diagrams', c.dir, out)));
  if (!cat) { unmapped += 1; continue; }
  groups.get(cat.dir).push({
    title: spec.meta.title || file.replace('.architecture.json', ''),
    href: isTemplate ? `diagrams/${out}` : `diagrams/${cat.dir}/${out}`,
    slug: out.replace(/\.architecture\.html$/, ''),
  });
}

for (const [, items] of groups) items.sort((a, b) => lc(a.title).localeCompare(lc(b.title)));
const total = [...groups.values()].reduce((n, g) => n + g.length, 0);

// ── 3. topics come from README's "System Designs by Topic" tables ───────────
// README is the single source for the grouping; the index never re-authors it.
const readme = readFileSync(join(ROOT, 'README.md'), 'utf8').replace(/\r\n/g, '\n');
const README_TOPICS = [...readme.matchAll(/<summary><b>([^<]+)<\/b> · \d+ docs?<\/summary>([\s\S]*?)<\/details>/g)]
  .map(([, label, body]) => ({
    label: label.trim(),
    slugs: [...body.matchAll(/\[View\]\(system-design-([a-z0-9-]+)\.md\)/g)].map((m) => m[1]),
  }))
  .filter((topic) => topic.slugs.length);

const designCards = new Map(groups.get('system-design').map((item) => [item.slug, item]));
const placed = new Set();
const topicBlocks = README_TOPICS.map((topic) => {
  const items = topic.slugs
    .map((slug) => {
      const item = designCards.get(slug);
      if (item) placed.add(slug);
      return item;
    })
    .filter(Boolean);
  return { label: topic.label, items };
}).filter((topic) => topic.items.length);

// Anything the README does not place stays visible instead of silently vanishing.
const orphans = [...designCards.values()].filter((item) => !placed.has(item.slug));
const missingDiagrams = README_TOPICS.flatMap((topic) => topic.slugs.filter((slug) => !designCards.has(slug)));

// ── 4. render index.html ────────────────────────────────────────────────────
const card = (d) => `        <a class="card" href="${d.href}">
          <h3>${esc(d.title)}</h3>
          <span class="open">Open diagram ↗</span>
        </a>`;

const cardGrid = (items) => `      <div class="grid">
${items.map(card).join('\n')}
      </div>`;

const topicHeading = (label, count) => `      <h3 class="topic">${esc(label)} <span class="count">${count}</span></h3>`;

const topicSections = [
  ...topicBlocks.map((topic) => `${topicHeading(topic.label, topic.items.length)}\n${cardGrid(topic.items)}`),
  ...(orphans.length ? [`${topicHeading('Other designs', orphans.length)}\n${cardGrid(orphans)}`] : []),
].join('\n');

const planningTools = `    <section>
      <h2>🧮 Planning Tools <span class="count">1</span></h2>
      <p class="blurb">Interactive estimates for capacity, monthly cost and unit economics</p>
      <div class="grid">
        <a class="card" href="simulator/">
          <h3>Capacity &amp; Cost Simulator</h3>
          <span class="open">Open simulator ↗</span>
        </a>
      </div>
    </section>`;

const sectionFor = (c) => {
  const items = groups.get(c.dir);
  if (!items.length) return '';
  const body = c.dir === 'system-design' ? topicSections : cardGrid(items);
  return `    <section>
      <h2>${c.icon} ${c.label} <span class="count">${items.length}</span></h2>
      <p class="blurb">${esc(c.blurb)}</p>
${body}
    </section>`;
};

const sections = CATEGORIES.map(sectionFor).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>System Design — Interactive Diagrams</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; }
  body { font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; background: #0d1117; color: #e6edf3; }
  header { text-align: center; padding: 56px 16px 24px; }
  h1 { font-size: 2rem; letter-spacing: -.02em; }
  header p { color: #8b949e; margin-top: 8px; }
  header p b { color: #e6edf3; }
  .meta { display: flex; flex-wrap: wrap; justify-content: center; align-items: baseline; gap: 4px 20px; }
  .meta a { white-space: nowrap; }
  main { max-width: 1080px; margin: 0 auto; padding: 16px 20px 64px; }
  section { margin-top: 40px; }
  h2 { font-size: 1.25rem; border-bottom: 1px solid #21262d; padding-bottom: 10px; }
  .count { color: #8b949e; font-weight: 400; font-size: .9rem; margin-left: 6px; }
  .blurb { color: #8b949e; font-size: .95rem; margin: 6px 0 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 14px; }
  .card { display: flex; flex-direction: column; background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 16px 18px; text-decoration: none; color: inherit; transition: border-color .15s, transform .15s; }
  .card:hover { border-color: #58a6ff; transform: translateY(-2px); }
  .card h3 { font-size: .98rem; font-weight: 600; line-height: 1.4; }
  .card .open { display: inline-block; margin-top: auto; padding-top: 10px; font-size: .8rem; color: #58a6ff; }
  .topic { font-size: .95rem; font-weight: 600; color: #e6edf3; margin: 26px 0 10px; }
  .topic:first-of-type { margin-top: 0; }
  footer { text-align: center; color: #8b949e; font-size: .85rem; padding: 24px 16px 48px; }
  footer a { color: #58a6ff; text-decoration: none; }
</style>
</head>
<body>
<header>
  <h1>📚 System Design — Interactive Diagrams</h1>
  <p class="meta"><span><b>${total}</b> interactive architecture diagrams</span><a href="simulator/">capacity &amp; cost simulator ↗</a><a href="https://github.com/aishwary11/system-design">source on GitHub ↗</a></p>
</header>
<main>
${planningTools}
${sections}
</main>
<footer>Generated by <code>tools/build-pages.mjs</code> · hosted on GitHub Pages</footer>
</body>
</html>
`;

writeFileSync(join(SITE, 'index.html'), html);
console.log(`site: ${total} diagrams (${specs.length} specs, ${unmapped} unmapped) -> ${SITE}`);
for (const c of CATEGORIES) console.log(`  ${c.dir}: ${groups.get(c.dir).length}`);
console.log(`  topics: ${topicBlocks.length} from README, ${placed.size} designs mapped, ${orphans.length} unplaced`);
if (missingDiagrams.length) console.warn(`  warn: README topics without a diagram: ${missingDiagrams.join(', ')}`);
if (orphans.length) console.warn(`  warn: designs without a README topic: ${orphans.map((o) => o.slug).join(', ')}`);
