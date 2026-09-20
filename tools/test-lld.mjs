#!/usr/bin/env node
/**
 * test-lld.mjs — extracts and executes every ```js block from the markdown docs.
 * Blocks within a file share one vm context (later blocks can use earlier
 * definitions), run with a 3s timeout each. Any throw/timout fails the run.
 *
 * Usage:
 *   node tools/test-lld.mjs              # all docs
 *   node tools/test-lld.mjs <file.md>    # one doc
 */
import { readFileSync, readdirSync } from 'fs';
import vm from 'vm';

const args = process.argv.slice(2);
const allMd = readdirSync('.').filter(f => f.endsWith('.md'));
const targets = args.length ? args.filter(a => allMd.includes(a))
  : allMd.filter(f => f !== 'README.md' && f !== 'STUDY-ROADMAP.md' && f !== 'resources.md');

let totalBlocks = 0, filesRun = 0;
const failures = [];
const quietConsole = new Proxy(console, {
  get: (t, k) => (k === 'log' || k === 'info' || k === 'warn' || k === 'error') ? (() => {}) : t[k]
});

for (const file of targets) {
  const src = readFileSync(file, 'utf8');
  const blocks = [...src.matchAll(/```js\n([\s\S]*?)```/g)].map(m => m[1]);
  if (!blocks.length) continue;
  filesRun++;
  const ctx = vm.createContext({ console: quietConsole, Date, Math, JSON, Map, Set, Promise, RegExp, Error, Number, String, Array, Object, Symbol, BigInt, parseInt, parseFloat, isNaN, setTimeout, clearTimeout });
  blocks.forEach((code, i) => {
    totalBlocks++;
    try {
      vm.runInContext(`"use strict";\n${code}`, ctx, { timeout: 3000, filename: `${file}#block${i + 1}` });
    } catch (err) {
      const msg = String(err && err.message || err).split('\n')[0];
      failures.push({ file, block: i + 1, msg });
    }
  });
}

console.log(`\n${totalBlocks} js blocks executed across ${filesRun} docs — ${failures.length} failure(s)`);
for (const f of failures) console.log(`  FAIL ${f.file} block#${f.block}: ${f.msg}`);
process.exit(failures.length ? 1 : 0);
