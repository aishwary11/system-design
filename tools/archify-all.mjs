#!/usr/bin/env node
/**
 * Batch-validate (or deliver) every Archify spec in diagrams/json against the
 * globally installed skill. Usage:
 *   node tools/archify-all.mjs validate
 *   node tools/archify-all.mjs deliver
 *
 * Deliver layout (topic folders):
 *   diagrams/system-design/<topic>.arch.html   (32 system-design docs)
 *   diagrams/concepts/concept-*.arch.html      (sharding / replication / quorum)
 *   diagrams/features/<tech>-*.arch.html       (kafka / redis / postgresql + redis AI set)
 *   diagrams/template.arch.html                (README reference diagram)
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = join(homedir(), '.agents', 'skills', 'archify');
const JSON_DIR = join(ROOT, 'diagrams', 'json');
const mode = process.argv[2] ?? 'validate';

// spec stem -> html path (relative to repo root)
function htmlTarget(jsonFile) {
  const out = JSON.parse(readFileSync(join(JSON_DIR, jsonFile), 'utf8')).meta?.output;
  if (!out) throw new Error(`${jsonFile}: missing meta.output`);
  const stem = jsonFile.replace(/\.architecture\.json$/, '');
  if (stem === 'template') return 'diagrams/template.html';
  if (stem.startsWith('concept-')) return `diagrams/concepts/${out}`;
  if (stem.endsWith('-at-a-glance')) return `diagrams/features/${out}`;
  if (stem === 'redis-ai-context-layer' || stem === 'langcache-semantic-cache') return `diagrams/features/${out}`;
  return `diagrams/system-design/${out}`;
}

const files = readdirSync(JSON_DIR).filter(f => f.endsWith('.json')).sort();
let pass = 0, fail = 0;
const failures = [];

for (const f of files) {
  const specPath = join(JSON_DIR, f);
  try {
    if (mode === 'validate') {
      const out = execFileSync('node', [join(SKILL, 'bin', 'archify.mjs'), 'validate', 'architecture', specPath, '--quality', 'showcase', '--json'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
      const r = JSON.parse(out);
      if (r.ok) { pass++; console.log('OK    ' + f); }
      else {
        fail++;
        failures.push(f);
        console.log(`FAIL  ${f}  (${r.diagnostics.length})`);
        r.diagnostics.slice(0, 5).forEach(d => console.log('      -', d.code, '::', d.message.slice(0, 160)));
      }
    } else {
      const target = htmlTarget(f);
      const absTarget = join(ROOT, target);
      mkdirSync(dirname(absTarget), { recursive: true });
      const out = execFileSync('node', [join(SKILL, 'bin', 'archify.mjs'), 'deliver', 'architecture', specPath, absTarget, '--quality', 'showcase', '--json'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
      const r = JSON.parse(out);
      if (r.ok) { pass++; console.log('DONE  ' + target); }
      else {
        fail++;
        failures.push(f);
        console.log(`FAIL  ${f} -> ${target}  (${(r.diagnostics || []).length})`);
        (r.diagnostics || []).slice(0, 5).forEach(d => console.log('      -', d.code, '::', d.message.slice(0, 160)));
      }
    }
  } catch (e) {
    fail++;
    failures.push(f);
    console.log('ERR   ' + f + ' :: ' + String(e.message).slice(0, 200));
  }
}

console.log(`\n${pass}/${files.length} ${mode} ok${fail ? '; failing: ' + failures.join(', ') : ''}`);
process.exit(fail ? 1 : 0);
