#!/usr/bin/env node
/**
 * Modernize the presentation of all root markdown docs (content untouched):
 *  1. Centered H1 header banner
 *  2. "TL;DR" GitHub TIP callout under the H1 (verbatim first Overview sentence)
 *  3. "### Key Numbers" bullet dump -> | Metric | Value | table
 *  4. "### Non-Functional Requirements" bullets -> | Attribute | Target | table
 *  5. "## Table of Contents" list wrapped in a collapsible <details>
 *  6. Collapse stray repeated "---" separator runs into one
 * Idempotent: re-running produces no further changes.
 * Usage: node tools/modernize-docs.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TIPMARK = '> [!TIP]';

function rowsFromBullets(bullets) {
  const rows = [];
  for (const b of bullets) {
    let metric = null, value = null;
    const ci = b.indexOf(':');
    if (ci > 0 && ci < 40) { metric = b.slice(0, ci).trim(); value = b.slice(ci + 1).trim(); }
    else {
      const m = b.match(/^([\d.,]+\s*(?:billion|million|trillion|thousand|hundred|[KMB])?\+?)\s+(.*)$/i);
      if (m) { value = m[1].trim(); metric = m[2].trim(); }
      else { const d = b.search(/\d/); if (d > 0) { metric = b.slice(0, d).trim(); value = b.slice(d).trim(); } }
    }
    if (!metric || !value) return null; // conservative: leave section untouched
    rows.push([metric, value]);
  }
  return rows.length ? rows : null;
}

function modernize(src) {
  const EOL = eolOf(src);
  let L = src.split(/\r?\n/);
  const changes = [];

  // 6. collapse repeated separator runs: --- (blank) --- -> one ---
  for (let i = 0; i < L.length; i++) {
    if (/^---\s*$/.test(L[i])) {
      let j = i + 1;
      while (j < L.length && L[j].trim() === '') j++;
      if (j > i + 1 && j < L.length && /^---\s*$/.test(L[j])) {
        L.splice(i + 1, j - i); // remove blanks + the second '---'
        changes.push('collapsed separator run');
        i--; // re-check the same position for longer runs
      }
    }
  }

  const h1 = L.findIndex(l => /^# /.test(l));
  if (h1 >= 0) {
    // 1. center the H1 (skip if already inside a centering div)
    const before = L.slice(Math.max(0, h1 - 3), h1).join('\n');
    if (!/align="center"/.test(before)) {
      L[h1] = `<div align="center">\n\n${L[h1]}\n\n</div>`;
      changes.push('centered H1');
    }
    // 2. TL;DR callout from the first Overview sentence (verbatim)
    if (!L.some(l => l === TIPMARK)) {
      const ov = L.findIndex(l => /^## Overview\s*$/.test(l));
      if (ov >= 0) {
        const para = L.slice(ov + 1).find(l => l.trim() && !/^#/.test(l)) || '';
        const m = para.match(/^([\s\S]{20,320}?[.!?])(\s|$)/);
        if (m) {
          let ins = h1;
          if (L[h1].startsWith('<div align="center">')) {
            const close = L.indexOf('</div>', h1);
            ins = (close >= 0 ? close : h1) + 1;
          }
          L.splice(ins, 0, '', `${TIPMARK}\n> **TL;DR** — ${m[1]}`);
          changes.push('TL;DR callout');
        }
      }
    }
  }

  // 3/4. bullet sections -> tables
  const sections = [
    { h: '### Key Numbers', head: ['Metric', 'Value'] },
    { h: '### Non-Functional Requirements', head: ['Attribute', 'Target'] },
  ];
  for (const sec of sections) {
    const i = L.findIndex(l => l.trim() === sec.h);
    if (i < 0) continue;
    let j = i + 1;
    while (j < L.length && L[j].trim() === '') j++;
    const bullets = [];
    while (j < L.length && /^- /.test(L[j])) { bullets.push(L[j].slice(2).trim()); j++; }
    if (bullets.length < 2) continue;
    const rows = rowsFromBullets(bullets);
    if (!rows) continue;
    const table = [
      `| ${sec.head[0]} | ${sec.head[1]} |`,
      '| :--- | :--- |',
      ...rows.map(([a, b]) => `| **${a}** | ${b} |`),
    ];
    L.splice(i + 1, j - i - 1, '', ...table);
    changes.push(sec.h.replace(/^### /, '') + ' -> table');
  }

  // 5. wrap TOC list in <details>
  const t = L.findIndex(l => /^## Table of Contents\s*$/.test(l));
  if (t >= 0 && !L.slice(t, t + 4).some(l => l.includes('<details>'))) {
    let s = t + 1, e = s;
    while (e < L.length && L[e].trim() === '') e++;              // skip blank
    while (e < L.length && /^(\d+\.|- |  |\t)/.test(L[e])) e++;  // list body
    if (e > s + 1) {
      L.splice(e, 0, '', '</details>');
      L.splice(s, 0, '', '<details>', '<summary><b>📑 Jump to a section</b></summary>');
      changes.push('TOC collapsed');
    }
  }

  return { out: L.join(EOL), changes };
}

const eolOf = (s) => (s.includes('\r\n') ? '\r\n' : '\n');

let touched = 0;
for (const f of readdirSync(ROOT).filter(f => f.endsWith('.md')).sort()) {
  const src = readFileSync(join(ROOT, f), 'utf8');
  const { out, changes } = modernize(src);
  if (changes.length) {
    writeFileSync(join(ROOT, f), out.endsWith('\n') ? out : out + '\n');
    touched++;
    console.log(`${f}: ${changes.join(', ')}`);
  }
}
console.log(`modernized ${touched} docs`);
