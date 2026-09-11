#!/usr/bin/env node
/**
 * Markdown content audit for all .md files at the repo root.
 * - balanced code fences, closed at EOF
 * - exactly one H1 per doc (outside fences)
 * - no empty sections, no duplicate headings (levels 1-3)
 * - relative links resolve to existing files
 * - every ```js / ```javascript block parses AND executes
 * Exit code 1 on any failure. Usage: node tools/audit-docs.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = readdirSync(ROOT).filter(f => f.endsWith('.md')).sort();
const issues = [];
let jsBlocks = 0, jsFailed = 0;

for (const f of files) {
  const lines = readFileSync(join(ROOT, f), 'utf8').split(/\r?\n/);
  let inFence = false;
  const prose = [];
  const blocks = [];
  let buf = [], lang = '';

  for (const l of lines) {
    if (/^```/.test(l)) {
      if (inFence) { blocks.push({ lang, code: buf.join('\n') }); inFence = false; buf = []; }
      else { inFence = true; lang = l.slice(3).trim(); buf = []; }
      continue;
    }
    if (inFence) buf.push(l); else prose.push(l);
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

  for (const b of blocks) {
    if (!['js', 'javascript'].includes(b.lang)) continue;
    jsBlocks++;
    try { new Function(b.code)(); }
    catch (e) { jsFailed++; issues.push(`${f}: js block failed: ${e.message.slice(0, 90)}`); }
  }
}

console.log(`audited ${files.length} markdown files, ${jsBlocks} js blocks (${jsFailed} failed)`);
if (issues.length) { console.log('ISSUES:\n' + issues.join('\n')); process.exit(1); }
console.log('ALL CLEAN');
