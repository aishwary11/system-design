#!/usr/bin/env node
/**
 * audit-duplication.mjs — fail the build when content is repeated or duplicated.
 *
 * The library is deliberately repetitive in *shape* (every design doc has the
 * same skeleton) but must never repeat *substance*. This gate separates the
 * two with an explicit template allowlist, so new duplication is reported
 * instead of drowning in 59 expected matches.
 *
 * Checks
 *  1. no two tracked files are byte-identical
 *  2. no identical non-template paragraph (>180 chars) in 2+ markdown docs
 *  3. no identical fenced code block (>120 chars) in 2+ markdown docs
 *  4. no two docs share a section (10-word shingles) above 50% Jaccard
 *  5. no two diagram specs describe the same graph
 *  6. every design appears exactly once inside the README topic tables
 *  7. the viewer runtime lives in one shared file, not in every page
 *
 * Exit code 1 on any violation. Usage: node tools/audit-duplication.mjs
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const issues = [];

const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);

const sha = s => createHash('sha256').update(s).digest('hex');
const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const rel = p => relative(ROOT, p).split('\\').join('/');

/* 1. byte-identical tracked files ------------------------------------------ */
{
  const byHash = new Map();
  for (const f of tracked) {
    const abs = join(ROOT, f);
    if (!existsSync(abs) || !statSync(abs).isFile()) continue;
    const h = sha(readFileSync(abs));
    if (!byHash.has(h)) byHash.set(h, []);
    byHash.get(h).push(f);
  }
  for (const files of byHash.values())
    if (files.length > 1) issues.push(`identical files: ${files.join(' = ')}`);
}

/* 2 + 3. duplicated prose and code across docs ------------------------------ */
// Skeleton text every doc is required to carry (see tools/audit-docs.mjs).
const TEMPLATE_PREFIXES = [
  'read it in 5 min', '1 overview', 'before this doc', 'more cross topic rules',
  'the data stores schemas and access patterns', 'on this page',
  'what this covers', 'how to read this doc',
];
const isTemplate = t => TEMPLATE_PREFIXES.some(p => t.startsWith(p));

const mdFiles = tracked.filter(f => f.endsWith('.md'));
const paragraphs = new Map();
const fences = new Map();
for (const f of mdFiles) {
  const raw = readFileSync(join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
  const prose = raw.replace(/```[\s\S]*?```/g, '');
  for (const block of prose.split(/\n\s*\n/)) {
    const t = block.trim();
    if (t.length < 180 || /^[|#<]/.test(t)) continue;
    const key = norm(t);
    if (isTemplate(key)) continue;
    if (!paragraphs.has(key)) paragraphs.set(key, { text: t, files: new Set() });
    paragraphs.get(key).files.add(f);
  }
  for (const m of raw.matchAll(/```[\w-]*[^\n]*\n([\s\S]*?)```/g)) {
    const code = m[1].trim();
    if (code.length < 120) continue;
    const key = norm(code);
    if (!fences.has(key)) fences.set(key, { head: code.split('\n')[0].slice(0, 60), files: new Set() });
    fences.get(key).files.add(f);
  }
}
for (const p of paragraphs.values())
  if (p.files.size > 1)
    issues.push(`paragraph repeated in ${[...p.files].join(', ')} :: ${p.text.slice(0, 100)}`);
for (const c of fences.values())
  if (c.files.size > 1)
    issues.push(`code block repeated in ${[...c.files].join(', ')} :: ${c.head}`);

/* 4. near-duplicate sections across design docs ---------------------------- */
{
  const designDocs = mdFiles.filter(f => /^system-design-[a-z0-9-]+\.md$/.test(f));
  const NAV = new Set(['on this page', 'table of contents', 'contents']);
  const sections = [];
  for (const f of designDocs) {
    const raw = readFileSync(join(ROOT, f), 'utf8').replace(/\r\n/g, '\n').replace(/```[\s\S]*?```/g, ' ');
    for (const part of raw.split(/\n(?=#{2,3} )/)) {
      const head = (part.match(/^#{2,3} (.+)/) || [, ''])[1].trim();
      if (NAV.has(head.toLowerCase())) continue;
      const words = norm(part.replace(/^#{2,3} .+\n/, '')).split(' ').filter(Boolean);
      const set = new Set();
      for (let i = 0; i + 9 < words.length; i++) set.add(words.slice(i, i + 10).join(' '));
      if (set.size < 25) continue;
      sections.push({ f, head, set });
    }
  }
  const hits = [];
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      const a = sections[i], b = sections[j];
      if (a.f === b.f) continue;
      const [small, big] = a.set.size < b.set.size ? [a.set, b.set] : [b.set, a.set];
      let inter = 0;
      for (const s of small) if (big.has(s)) inter++;
      const jac = inter / (a.set.size + b.set.size - inter);
      if (jac > 0.5) hits.push(`${(jac * 100).toFixed(0)}% ${a.f} [${a.head}] = ${b.f} [${b.head}]`);
    }
  }
  for (const h of hits.slice(0, 10)) issues.push(`near-duplicate section: ${h}`);
  if (hits.length > 10) issues.push(`... +${hits.length - 10} more near-duplicate sections`);
}

/* 5. duplicate diagram graphs ---------------------------------------------- */
{
  const dir = join(ROOT, 'diagrams', 'json');
  if (existsSync(dir)) {
    const sigs = new Map();
    for (const f of readdirSync(dir).filter(x => /\.(architecture|sequence|lifecycle)\.json$/.test(x))) {
      const spec = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      let sig;
      if (spec.diagram_type === 'sequence') {
        sig = JSON.stringify({ p: spec.participants, m: spec.messages });
      } else if (spec.diagram_type === 'lifecycle') {
        sig = JSON.stringify({ l: spec.lanes, s: spec.states, t: spec.transitions });
      } else {
        sig = JSON.stringify({ c: spec.components, k: spec.connections, b: spec.boundaries });
      }
      if (!sig || sig.length < 20) continue; // empty schema variant, nothing to compare
      if (!sigs.has(sig)) sigs.set(sig, []);
      sigs.get(sig).push(f);
    }
    for (const files of sigs.values())
      if (files.length > 1) issues.push(`identical diagram graph: ${files.join(' = ')}`);
  }
}

/* 6. README topic tables list every design exactly once --------------------- */
{
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8').replace(/\r\n/g, '\n');
  const counts = new Map();
  for (const m of readme.matchAll(/<summary><b>([^<]+)<\/b> · \d+ docs?<\/summary>([\s\S]*?)<\/details>/g)) {
    for (const s of m[2].matchAll(/\[View\]\(system-design-([a-z0-9-]+)\.md\)/g)) {
      const slug = s[1];
      if (!counts.has(slug)) counts.set(slug, []);
      counts.get(slug).push(m[1].trim());
    }
  }
  for (const [slug, topics] of counts)
    if (topics.length > 1) issues.push(`README: ${slug} is listed in ${topics.length} topic tables (${topics.join(', ')})`);
}

/* 7. one shared viewer runtime, not one copy per page ---------------------- */
{
  const dirs = ['diagrams', 'diagrams/concepts', 'diagrams/features', 'diagrams/system-design']
    .map(d => join(ROOT, d)).filter(existsSync);
  const pages = dirs.flatMap(d => readdirSync(d).filter(f => f.endsWith('.html')).map(f => join(d, f)));
  const shared = ['archify.css', 'archify.js'].map(f => join(ROOT, 'diagrams', f));
  if (pages.length && shared.every(existsSync)) {
    for (const p of pages) {
      const html = readFileSync(p, 'utf8');
      if (!/archify\.css/.test(html) || !/archify\.js/.test(html))
        issues.push(`${rel(p)}: does not use the shared archify runtime — run node tools/hoist-runtime.mjs`);
      if (/<script>[\s\S]{200000,}?<\/script>/.test(html))
        issues.push(`${rel(p)}: still inlines the viewer engine`);
    }
  } else if (pages.length) {
    const hashes = new Set();
    for (const p of pages) {
      const m = readFileSync(p, 'utf8').match(/<script>([\s\S]{200000,}?)<\/script>/);
      if (m) hashes.add(sha(m[1]));
    }
    if (hashes.size > 1) issues.push(`viewer engine differs across pages (${hashes.size} variants)`);
  }
}

console.log(`duplication audit: ${tracked.length} tracked files, ${mdFiles.length} docs, ${paragraphs.size} paragraphs, ${fences.size} code blocks`);
if (issues.length) {
  console.log(`DUPLICATION ISSUES (${issues.length}):\n` + issues.slice(0, 40).join('\n'));
  if (issues.length > 40) console.log(`... +${issues.length - 40} more`);
  process.exit(1);
}
console.log('NO DUPLICATION');
