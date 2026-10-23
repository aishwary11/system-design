#!/usr/bin/env node
/**
 * Markdown content audit for all .md files at the repo root.
 *
 * Structure
 * - balanced code fences, closed at EOF
 * - exactly one H1 per doc (outside fences)
 * - no empty sections, no duplicate headings (levels 1-3)
 * - relative links resolve to existing files
 * - in-page and cross-file anchors resolve (explicit <a id="..."> + heading slugs)
 * - stale "verified <Month> <Year>" version stamps are warned about (> 60 days)
 *
 * Code blocks
 * - every ```js / ```javascript block parses AND executes; use the `no-run`
 *   fence flag (```js no-run) for snippets that need a real npm package/service
 * - injected-global ReferenceErrors are warnings; SyntaxError / TypeError /
 *   module-not-found stay hard issues
 * - ```text / untyped fences that are valid JavaScript are reported (they were
 *   invisible to this audit before)
 * - truncated stub blocks (a class/function header with no body) are reported
 * - require() of a Python stdlib name (time, math, heapq, ...) is reported
 *
 * Repo truth
 * - README headline / "What's Inside" counts match the filesystem
 * - every design doc appears in the README topic tables
 * - STUDY-ROADMAP.md links every other doc at the repo root
 * - every guide in the README table ends with Hidden Tips & Tricks and Do's & Don'ts
 * - every "§N" cross-reference resolves in concepts (or interview-qa)
 *
 * Exit code 1 on any failure. Usage: node tools/audit-docs.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = readdirSync(ROOT).filter(f => f.endsWith('.md')).sort();
const issues = [];
const warnings = [];
let jsBlocks = 0, jsFailed = 0, jsWarned = 0;

// Blocks may start async work they never await (fire-and-forget demos). Those
// rejections must not kill the audit — record them and carry on.
process.on('unhandledRejection', reason => {
  jsWarned++;
  warnings.push(`js block has an unawaited async chain — ${String((reason && reason.message) || reason).slice(0, 80)}`);
});


const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'];

/** GitHub-style heading slug: strip HTML/markdown markup, drop punctuation, spaces -> hyphens. */
const slugify = s => s
  .replace(/<[^>]*>/g, '')
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/[^\w\s-]/g, '')
  .replace(/ /g, '-')
  .toLowerCase();

/** Python stdlib names that must never appear as require() targets in JS examples. */
const PY_REQUIRES = /require\(\s*['"](time|math|hmac|heapq|collections|urllib\.parse|threading|random|enum)['"]\s*\)/g;

const docs = new Map();

// Pass 1: parse each doc, run per-file checks, collect anchors + version stamps.
for (const f of files) {
  const lines = readFileSync(join(ROOT, f), 'utf8').split(/\r?\n/);
  let inFence = false;
  const prose = [], nums = [];
  const blocks = [];
  let buf = [], lang = '';

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^```/.test(l)) {
      if (inFence) { blocks.push({ lang, code: buf.join('\n') }); inFence = false; buf = []; }
      else { inFence = true; lang = l.slice(3).trim(); buf = []; }
      continue;
    }
    if (inFence) buf.push(l); else { prose.push(l); nums.push(i + 1); }
  }
  if (inFence) issues.push(`${f}: unclosed code fence at EOF`);

  const h1 = prose.filter(l => /^# /.test(l)).length;
  if (h1 !== 1) issues.push(`${f}: ${h1} H1 headings (expected 1)`);

  for (let i = 0; i < prose.length - 1; i++) {
    if (/^#{1,3} /.test(prose[i]) && /^#{1,3} /.test(prose[i + 1]))
      issues.push(`${f}: empty section "${prose[i].replace(/^#+ /, '').slice(0, 50)}"`);
  }

  const seen = new Map();
  for (const l of prose) {
    const m = l.match(/^(#{1,3}) (.+)$/);
    if (m) { const k = m[1] + '|' + m[2].trim(); seen.set(k, (seen.get(k) || 0) + 1); }
  }
  for (const [k, c] of seen) if (c > 1)
    issues.push(`${f}: duplicate heading x${c}: ${k.split('|')[1].slice(0, 60)}`);

  for (const m of prose.join('\n').matchAll(/\]\(([^)#\s]+)\)/g)) {
    const t = m[1];
    if (/^https?:/.test(t)) continue;
    if (!existsSync(join(ROOT, t))) issues.push(`${f}: broken link ${t}`);
  }

  // Anchors: explicit <a id="..."> plus GitHub heading slugs (duplicates get -1, -2 suffixes).
  const anchors = new Set();
  for (const m of prose.join('\n').matchAll(/<a\s[^>]*\bid=["']([^"']+)["']/gi)) anchors.add(m[1]);
  const slugCount = new Map();
  for (const l of prose) {
    const m = l.match(/^#{1,6}\s+(.+?)\s*$/);
    if (!m) continue;
    const base = slugify(m[1]);
    if (!base) continue;
    const n = slugCount.get(base) || 0;
    slugCount.set(base, n + 1);
    anchors.add(n === 0 ? base : `${base}-${n}`);
  }
  docs.set(f, { anchors, prose, nums });

  // Version stamps older than ~60 days: re-verify against upstream.
  for (let i = 0; i < prose.length; i++) {
    for (const m of prose[i].matchAll(/\bverified\s+([A-Za-z]{3,9})\.?\s+(\d{4})\b/g)) {
      const mi = MONTHS.findIndex(x => x.startsWith(m[1].toLowerCase().slice(0, 3)));
      if (mi < 0) continue;
      const age = Math.floor((Date.now() - new Date(+m[2], mi, 1).getTime()) / 86400000);
      if (age > 60)
        warnings.push(`${f}: version stamp "${m[0]}" is ${age} days old — re-verify (line ${nums[i]})`);
    }
  }

  for (const b of blocks) {
    const [kind, ...flags] = b.lang.split(/\s+/);
    const noRun = flags.includes('no-run');
    const isJS = ['js', 'javascript'].includes(kind);
    const isPlain = ['', 'text', 'txt', 'plaintext'].includes(kind);
    const looksJS = /\b(class|function|const|let|await|async|=>)\b/.test(b.code);

    // --- mis-tagged JavaScript: a plain fence that is valid JS, not pseudo-code.
    if (isPlain && looksJS) {
      try {
        new Function('return async function(){\n' + b.code + '\n}');
        issues.push(`${f}: ${kind || 'untyped'} fence is valid JavaScript — tag it as javascript (or javascript no-run)`);
      } catch { /* genuinely not JavaScript — fine */ }
    }
    if (!isJS) continue;

    jsBlocks++;
    let promise;
    try {
      promise = new Function('return async function(){\n' + b.code + '\n}')();
    } catch (e) {
      jsFailed++;
      issues.push(`${f}: js block failed to parse: ${String(e.message).slice(0, 90)}`);
      continue;
    }
    if (noRun) continue;
    try {
      await promise();
    } catch (e) {
      const msg = String((e && e.message) || e);
      if (e instanceof ReferenceError && /is not defined/.test(msg)) {
        jsWarned++;
        warnings.push(`${f}: js block needs an injected global — ${msg.slice(0, 70)}`);
      } else if (/Cannot find module/.test(msg)) {
        jsFailed++;
        issues.push(`${f}: js block needs a missing module — ${msg.slice(0, 80)} (add the no-run flag or use a real dependency)`);
      } else {
        jsFailed++;
        issues.push(`${f}: js block failed: ${msg.slice(0, 90)}`);
      }
    }
  }

  // Python stdlib require() in any block: the example cannot run.
  for (const b of blocks) {
    for (const m of b.code.matchAll(PY_REQUIRES))
      issues.push(`${f}: require('${m[1]}') is not a Node module (Python stdlib name)`);
  }

  // Truncated stub blocks: a class/function header, no body, unbalanced braces.
  for (const b of blocks) {
    if (!/\b(class\s+\w+|function\s+\w+\s*\()/.test(b.code)) continue;
    const opens = (b.code.match(/\{/g) || []).length;
    const closes = (b.code.match(/\}/g) || []).length;
    const codeLines = b.code.split('\n').filter(l => l.trim() && !/^\s*(\/\/|\/\*|\*)/.test(l)).length;
    if (opens > closes && codeLines <= 4)
      issues.push(`${f}: truncated code block — "${b.code.split('\n')[0].trim().slice(0, 50)}" has no body`);
  }

    // Content-quality backlog: generated-looking filler rows in the technique tables.
  for (const m of prose.join('\n').matchAll(/^\| [^|]+ \| Applied in this system \|/gm))
    warnings.push(`${f}: technique-table row is filler ("Applied in this system") — replace with the real use`);

  // Fence hygiene: an empty fenced block.
  for (const b of blocks) {
    const [kind] = b.lang.split(/\s+/);
    if (['', 'text', 'txt', 'plaintext'].includes(kind) && !b.code.trim())
      issues.push(`${f}: empty code block`);
  }
}

// Pass 2: validate anchor links now that every doc's anchor set is known.
const deadSeen = new Set();
const checkAnchor = (fromFile, lineNum, target) => {
  if (/^https?:/.test(target)) return;
  const [filePart, frag] = target.split('#');
  if (frag === undefined) return;
  const key = `${fromFile}|${target}`;
  if (deadSeen.has(key)) return;
  if (filePart && !existsSync(join(ROOT, filePart))) {
    deadSeen.add(key);
    issues.push(`${fromFile}: broken link ${filePart} (line ${lineNum})`);
    return;
  }
  const doc = docs.get(filePart || fromFile);
  if (!doc) return; // non-markdown target (e.g. diagrams/*.html) — not validated here
  let anchor;
  try { anchor = decodeURIComponent(frag); } catch { anchor = frag; }
  if (doc.anchors.has(anchor)) return;
  deadSeen.add(key);
  issues.push(`${fromFile}: dead anchor ${target} (line ${lineNum})`);
};

for (const [f, doc] of docs) {
  for (let i = 0; i < doc.prose.length; i++) {
    for (const m of doc.prose[i].matchAll(/\]\(([^)\s]*#[^)\s]*)\)/g))
      checkAnchor(f, doc.nums[i], m[1]);
    for (const m of doc.prose[i].matchAll(/<a\s[^>]*\bhref=["']([^"']*#[^"']*)["']/gi))
      checkAnchor(f, doc.nums[i], m[1]);
  }
}

// Pass 3: repo-truth checks (counts, coverage, guide endings, section refs).
const designDocs = files.filter(f => /^system-design-/.test(f) && f !== 'system-design-concepts.md');
const countSvg = dir => {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) n += countSvg(p);
    else if (e.name.endsWith('.svg')) n++;
  }
  return n;
};
const diagramCount = countSvg(join(ROOT, 'diagrams'));
const specCount = readdirSync(join(ROOT, 'diagrams', 'json')).filter(f => /\.(architecture|sequence|lifecycle)\.json$/.test(f)).length;

const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
const tableRows = (text, anchorId) => {
  const start = text.indexOf(`<a id="${anchorId}"></a>`);
  if (start < 0) return 0;
  const rest = text.slice(start);
  const end = rest.search(/\n<p align/);
  const body = end < 0 ? rest : rest.slice(0, end);
  return (body.match(/^\| /gm) || []).length - 2; // header + separator rows
};
const algoRows = tableRows(readme, 'algorithms-library');
const patternRows = tableRows(readme, 'techniques--patterns');
const guideRows = tableRows(readme, 'feature-guides');

const headline = readme.match(/\*\*(\d+) system designs · (\d+) technology & reference guides · (\d+) diagrams \((\d+) interactive\) · (\d+) JS algorithm/);
if (!headline) issues.push('README.md: headline count line not found');
else {
  const [designs, guides, diagrams, interactive, algos] = headline.slice(1).map(Number);
  if (designs !== designDocs.length) issues.push(`README.md: headline says ${designs} system designs, found ${designDocs.length}`);
  if (guides !== guideRows) issues.push(`README.md: headline says ${guides} guides, table lists ${guideRows}`);
  if (diagrams !== diagramCount) issues.push(`README.md: headline says ${diagrams} diagrams, found ${diagramCount} SVGs`);
  if (interactive !== specCount) issues.push(`README.md: headline says ${interactive} interactive, found ${specCount} Archify specs`);
  if (algos !== algoRows) issues.push(`README.md: headline says ${algos} algorithms, table lists ${algoRows} rows`);
}
const inside = [
  [/^\| .*\*\*(\d+) system designs\*\*/m, designDocs.length, 'system designs'],
  [/^\| .*\*\*(\d+) feature & reference guides\*\*/m, guideRows, 'feature & reference guides'],
  [/\*\*(\d+) diagrams\*\*/, diagramCount, 'diagrams'],
  [/\*\*(\d+) algorithms\*\*/, algoRows, 'algorithms'],
  [/\*\*(\d+) patterns\*\*/, patternRows, 'patterns'],
  [/<summary><b>(\d+) patterns<\/b>/, patternRows, 'patterns (summary)'],
];
for (const [re, expected, label] of inside) {
  const m = readme.match(re);
  if (!m) { issues.push(`README.md: "${label}" count row not found`); continue; }
  if (Number(m[1]) !== expected) issues.push(`README.md: says ${m[1]} ${label}, found ${expected}`);
}
// Topic tables must reference every design doc.
for (const f of designDocs) {
  const n = (readme.match(new RegExp(`\\(${f.replace(/\./g, '\\.')}\\)`, 'g')) || []).length;
  if (n === 0) issues.push(`README.md: ${f} is missing from the topic tables`);
}
// Each topic section's summary label ("· N docs") must match its table rows.
for (const m of readme.matchAll(/<summary><b>([^<]+)<\/b> · (\d+) docs<\/summary>\n([\s\S]*?)<\/details>/g)) {
  const label = m[1].replace(/[^\w &-]/g, '').trim();
  const rows = (m[3].match(/^\| \d+ \|/gm) || []).length;
  if (Number(m[2]) !== rows) issues.push(`README.md: "${label}" says ${m[2]} docs but lists ${rows} rows`);
}

// STUDY-ROADMAP must bank every other doc at the repo root.
const roadmap = readFileSync(join(ROOT, 'STUDY-ROADMAP.md'), 'utf8');
const roadmapLinks = new Set([...roadmap.matchAll(/\]\(([^)#\s]+)\)/g)].map(m => m[1]));
for (const f of files) {
  if (f === 'README.md' || f === 'STUDY-ROADMAP.md') continue;
  if (!roadmapLinks.has(f)) issues.push(`STUDY-ROADMAP.md: ${f} is not scheduled (no link)`);
}

// Every guide in the README table ends with Hidden Tips & Tricks + Do's & Don'ts.
const guideSection = readme.slice(readme.indexOf('<a id="feature-guides"></a>'));
const guideTargets = [...guideSection.matchAll(/\]\((?!https?:)([a-z0-9-]+\.md)\)/g)].map(m => m[1]);
for (const g of new Set(guideTargets)) {
  if (!docs.has(g)) continue;
  const text = readFileSync(join(ROOT, g), 'utf8');
  if (!/^##+ .*Hidden Tips/im.test(text)) issues.push(`${g}: no "Hidden Tips & Tricks" section (README promises one)`);
  if (!/^##+ .*Do.?s & Don'?t/im.test(text)) issues.push(`${g}: no "Do's & Don'ts" section (README promises one)`);
}

// "§N" cross-references must resolve in concepts or interview-qa.
const conceptsText = readFileSync(join(ROOT, 'system-design-concepts.md'), 'utf8');
const maxConcept = Math.max(...[...conceptsText.matchAll(/^## (\d+)\./gm)].map(m => +m[1]));
const iqSections = new Set([...readFileSync(join(ROOT, 'interview-qa.md'), 'utf8').matchAll(/^## (\d+)\./gm)].map(m => +m[1]));
for (const [f, doc] of docs) {
  for (let i = 0; i < doc.prose.length; i++) {
    for (const m of doc.prose[i].matchAll(/§(\d+)/g)) {
      const n = +m[1];
      if (n > maxConcept && !iqSections.has(n))
        issues.push(`${f}: dangling section reference §${n} (line ${doc.nums[i]})`);
    }
  }
}

console.log(`audited ${files.length} markdown files, ${jsBlocks} js blocks (${jsFailed} failed, ${jsWarned} need injected globals)`);
if (warnings.length) {
  const shown = warnings.slice(0, 30);
  console.log(`WARNINGS (${warnings.length}):\n` + shown.join('\n') + (warnings.length > shown.length ? `\n... +${warnings.length - shown.length} more` : ''));
}
if (issues.length) { console.log(`ISSUES (${issues.length}):\n` + issues.join('\n')); process.exit(1); }
console.log('ALL CLEAN');
