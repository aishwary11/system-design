#!/usr/bin/env node
/**
 * Markdown content audit for all .md files at the repo root.
 * - balanced code fences, closed at EOF
 * - exactly one H1 per doc (outside fences)
 * - no empty sections, no duplicate headings (levels 1-3)
 * - relative links resolve to existing files
 * - in-page and cross-file anchors resolve (explicit <a id="..."> + heading slugs)
 * - stale "verified <Month> <Year>" version stamps are warned about (> 60 days)
 * - every ```js / ```javascript block parses AND executes
 * Exit code 1 on any failure. Usage: node tools/audit-docs.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = readdirSync(ROOT).filter(f => f.endsWith('.md')).sort();
const issues = [];
const warnings = [];
let jsBlocks = 0, jsFailed = 0;

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'];

/** GitHub-style heading slug: strip HTML/markdown markup, drop punctuation, spaces -> hyphens. */
const slugify = s => s
  .replace(/<[^>]*>/g, '')
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/[^\w\s-]/g, '')
  .replace(/ /g, '-')
  .toLowerCase();

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
    if (!['js', 'javascript'].includes(b.lang)) continue;
    jsBlocks++;
    try { new Function(b.code)(); }
    catch (e) { jsFailed++; issues.push(`${f}: js block failed: ${e.message.slice(0, 90)}`); }
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

console.log(`audited ${files.length} markdown files, ${jsBlocks} js blocks (${jsFailed} failed)`);
if (warnings.length) console.log('WARNINGS:\n' + warnings.join('\n'));
if (issues.length) { console.log('ISSUES:\n' + issues.join('\n')); process.exit(1); }
console.log('ALL CLEAN');
