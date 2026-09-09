#!/usr/bin/env node
/**
 * convert-mermaid.mjs
 * Extract ```mermaid flowchart blocks from the repo's markdown files and emit
 * draft Archify architecture JSON specs (nodes, edges, labels, types).
 *
 * Mapping (matches the repo's C4-ish classDef convention):
 *   stadium ([..]) actor            -> external
 *   rectangle [..] service          -> backend
 *   rectangle [..] control (dashed) -> cloud (dashed edges carry the variant)
 *   cylinder [(..)] store           -> database
 *   hexagon {{..}} broker           -> messagebus
 *   diamond {...} service           -> backend
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'diagrams', 'json');
mkdirSync(OUT_DIR, { recursive: true });

const WORDS = { irctc: 'IRCTC', url: 'URL', lld: 'LLD', api: 'API', cdn: 'CDN', llm: 'LLM' };

// validator-detected verbose labels -> compact forms (keep semantics)
const SHORTEN = {
  'value (acked the write)': 'value',
  'value (may be stale)': 'value (stale)',
  'write to W=2 of N=3': 'write W=2/N=3',
  'read from R=2 of N=3': 'read R=2/N=3',
  'asynchronous replication': 'async repl',
  'synchronous replication': 'sync repl',
  'GET / SET / INCR / XADD': 'GET/SET ops',
  'GET / SET / INCR / XADD (cache, locks, rate limits, streams)': 'GET/SET ops',
};

// Per-spec fixes for topologies the generic pipeline can't planarize:
//   tagEdges: fold a dashed edge into a tag on its target (info kept, route gone)
//   merge:    collapse duplicate sibling nodes (asyncR1+asyncR2 -> one box)
//   edge:     pin an explicit route for a non-planar wrap-around edge (fn gets
//             the post-layout box map so vias are computed from real geometry)
const OVERRIDES = {
  'concept-quorum': {
    tagEdges: { 'writer>rC': true },            // 'down' marker -> tag on rC
  },
  'concept-replication': {
    labels: { 'leader>syncR': { labelDy: 24, labelDx: 60 } },
    merge: { asyncR1: { ids: ['asyncR2'], label: 'Async replicas x2' } },
    edge: {
      // lb -> syncR is the non-planar pair (crosses leader -> async); wrap it
      // under the replica row through clear space instead
      'lb>syncR': (box, conn) => {
        const lb = box.get('lb'), syncR = box.get('syncR');
        const laneY = syncR.y + syncR.h + 44;
        const outerX = Math.max(lb.x + lb.w, 700) + 60;
        conn.fromSide = 'right'; conn.toSide = 'bottom'; delete conn.route;
        conn.via = [[outerX, lb.y + lb.h / 2], [outerX, laneY], [syncR.x + syncR.w / 2, laneY]];
      },
    },
  },
  'postgresql-at-a-glance': {
    edge: {
      // asyncRep -> svc return lane wraps left+below the grid, clear of pool and
      // of the pg->cdc right corridor, so the two can never cross
      'asyncRep>svc': (box, conn) => {
        const ar = box.get('asyncRep'), svc = box.get('svc');
        const laneX = 40;
        const belowY = ar.y + ar.h + 60;
        conn.fromSide = 'bottom'; conn.toSide = 'left'; delete conn.route;
        conn.via = [[ar.x + ar.w / 2, belowY], [laneX, belowY], [laneX, svc.y + svc.h / 2]];
      },
      // pg -> cdc (Debezium) spans the whole column; route it around the right
      'pg>cdc': (box, conn) => {
        const pg = box.get('pg'), cdc = box.get('cdc');
        const outerX = Math.max(...[...box.values()].map(b => b.x + b.w)) + 80;
        conn.fromSide = 'right'; conn.toSide = 'right'; delete conn.route;
        conn.via = [[outerX, pg.y + pg.h / 2], [outerX, cdc.y + cdc.h / 2]];
      },
    },
  },
  'redis-at-a-glance': {
    tagEdges: { 'redis>svc': true },            // keyspace notifications -> tag on svc
  },
};

// compact name for control-plane tags (full detail stays in the markdown)
const TAG_NAMES = {
  'Metrics / Logs / Traces / Alerts / SLOs': 'Observability',
  'Service Mesh / mTLS / Discovery / Health Checks': 'Service Mesh',
  'DLQ / Replay / Schema Registry': 'DLQ',
  'Multi-AZ Replica / Backup / Restore': 'Backup / DR',
};
function shortName(label) {
  if (TAG_NAMES[label]) return TAG_NAMES[label];
  const s = label.split(' / ')[0].split(' (')[0].split(' - ')[0].split(' \u2014 ')[0].trim();
  return s.length > 20 ? s.slice(0, 18) + '\u2026' : s;
}

// ---- CLI -------------------------------------------------------------------

// ---- discover files ---------------------------------------------------------
const files = readdirSync(ROOT).filter(f => /\.md$/.test(f)).sort();

let total = 0;
const problems = [];

for (const file of files) {
  const src = readFileSync(join(ROOT, file), 'utf8');
  if (!src.includes('```mermaid')) continue;

  const blocks = src.split(/```mermaid\r?\n/).slice(1).map(b => b.split(/```/)[0]);
  blocks.forEach((block, blockIdx) => {
    total++;
    try {
      const spec = convertBlock(file, block, blockIdx);
      const outPath = spec.__out;
      delete spec.__out;
      writeFileSync(join(OUT_DIR, outPath), JSON.stringify(spec, null, 2) + '\n');
      console.log(`ok  ${outPath.replace(/\.json$/, '.html').padEnd(44)} ${spec.components.length} nodes, ${spec.connections.length} edges  (${file})`);
    } catch (e) {
      problems.push(`${file} [block ${blockIdx}]: ${e.message}`);
    }
  });
}

console.log(`\n${total - problems.length}/${total} blocks converted${problems.length ? ':\n' + problems.join('\n') : ''}`);

// ---- conversion --------------------------------------------------------------
function convertBlock(file, block, blockIdx) {
  const lines = block.split(/\r?\n/).map(l => l.replace(/\r$/, ''));
  const isSystemDesign = /^system-design-/.test(file);
  const slug = file.replace(/\.md$/, '').replace(/^system-design-/, '');

  // ---- title / output name
  let title, outName;
  if (file === 'system-design-concepts.md') {
    const titles = ['Sharding — Data Partitioning', 'Replication Topologies', 'Quorum Reads & Writes'];
    const slugs = ['sharding', 'replication', 'quorum'];
    title = titles[blockIdx] ?? `Concept ${blockIdx + 1}`;
    outName = `concept-${slugs[blockIdx] ?? blockIdx}.architecture.json`;
  } else if (isSystemDesign) {
    title = titleCase(slug) + ' — System Architecture';
    outName = `${slug}.architecture.json`;
  } else if (file === 'README.md') {
    title = 'Reference Architecture Template';
    outName = 'template.architecture.json';
  } else {
    const tech = file.replace(/-features\.md$/, '');
    title = titleCase(tech) + ' at a Glance';
    outName = `${tech}-at-a-glance.architecture.json`;
  }

  // ---- scan lines: subgraphs, classes, edge lines ---------------------------
  const nodes = new Map();          // id -> {label, shape, cls, subgraph}
  const edgeLines = [];
  const subgraphs = [];             // ordered
  let currentSubgraph = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('%%')) continue;
    if (/^(flowchart|graph)\b/.test(line)) continue;

    if (line.startsWith('subgraph')) {
      const m = line.match(/^subgraph\s+([A-Za-z0-9_]+)(?:\["([^"]*)"\])?/);
      currentSubgraph = { id: m?.[1] ?? 'sub', label: m?.[2] ?? m?.[1] ?? 'Subgraph' };
      subgraphs.push(currentSubgraph);
      continue;
    }
    if (line === 'end') { currentSubgraph = null; continue; }
    if (/^classDef\b/.test(line)) continue;

    if (/^class\s/.test(line)) {
      const m = line.match(/^class\s+([\w,\s]+)\s+(\w+)$/);
      if (m) {
        for (const id of m[1].split(',').map(s => s.trim()).filter(Boolean)) {
          if (nodes.has(id)) nodes.get(id).cls = m[2];
          else nodes.set(id, { label: id, shape: 'rect', cls: m[2], subgraph: currentSubgraph });
        }
      }
      continue;
    }

    edgeLines.push({ raw, sub: currentSubgraph });
  }

  // ---- node declarations (inline in edge lines) ------------------------------
  const SHAPE_RE = String.raw`\[\((?<cq>"(?:[^"\\]|\\.)*")\)\]|\(\[(?<sq>"(?:[^"\\]|\\.)*")\]\)|\[\((?<cy>[^\][]*)\)\]|\(\[(?<st>[^\][]*)\]\)|\((?<rd>"(?:[^"\\]|\\.)*")\)|\{\{(?<hq>"(?:[^"\\]|\\.)*")\}\}|\{(?<dq>"(?:[^"\\]|\\.)*")\}|\[(?<nq>[^\][]*)\]|\(\((?<cp>[^\][]*)\)\)|\(\((?<st2>[^\][]*)\)\)|\{\{(?<hp>[^}]*)\}\}|\{(?<dp>[^}]*)\}|\((?<ru>[^\][]*)\)`;
  const DECL_RE = new RegExp(String.raw`(?<![A-Za-z0-9_])(?<id>[A-Za-z0-9_]+)(?:` + SHAPE_RE + String.raw`)?(?![A-Za-z0-9_])`, 'g');

  for (const { raw, sub } of edgeLines) {
    // compute quoted-string ranges so words inside labels never register as nodes
    const quotedRanges = [];
    for (const qm of raw.matchAll(/"(?:[^"\\]|\\.)*"/g)) {
      quotedRanges.push([qm.index, qm.index + qm[0].length]);
    }
    const insideQuotes = (idx) => quotedRanges.some(([s, e]) => idx >= s && idx < e);

    for (const m of raw.matchAll(DECL_RE)) {
      if (insideQuotes(m.index)) continue;
      const id = m.groups.id;
      let label, shape;
      if (m.groups.cq !== undefined) { label = m.groups.cq; shape = 'cylinder'; }
      else if (m.groups.sq !== undefined) { label = m.groups.sq; shape = 'stadium'; }
      else if (m.groups.cy !== undefined) { label = m.groups.cy; shape = 'cylinder'; }
      else if (m.groups.st !== undefined) { label = m.groups.st; shape = 'stadium'; }
      else if (m.groups.rd !== undefined) { label = m.groups.rd; shape = 'rect'; }
      else if (m.groups.hq !== undefined) { label = m.groups.hq; shape = 'hexagon'; }
      else if (m.groups.dq !== undefined) { label = m.groups.dq; shape = 'diamond'; }
      else if (m.groups.nq !== undefined) { label = m.groups.nq; shape = 'rect'; }
      else if (m.groups.cp !== undefined) { label = m.groups.cp; shape = 'cylinder'; }
      else if (m.groups.st2 !== undefined) { label = m.groups.st2; shape = 'stadium'; }
      else if (m.groups.hp !== undefined) { label = m.groups.hp; shape = 'hexagon'; }
      else if (m.groups.dp !== undefined) { label = m.groups.dp; shape = 'diamond'; }
      else if (m.groups.ru !== undefined) { label = m.groups.ru; shape = 'rect'; }
      if (!nodes.has(id)) {
        nodes.set(id, { label: label !== undefined ? cleanLabel(label) : id, shape: shape ?? 'rect', cls: null, subgraph: sub });
      } else if (label !== undefined) {
        const n = nodes.get(id);
        n.label = cleanLabel(label);
        n.shape = shape ?? n.shape;
        if (!n.subgraph) n.subgraph = sub;
      }
    }
  }

  if (nodes.size === 0) throw new Error('no nodes found');

  // ---- parse edges (tokenize, mask quoted labels) -----------------------------
  const TOKEN_RE = /(?<![A-Za-z0-9_])([A-Za-z0-9_]+)(?:\[[^\][]*\]|\([^()]*\)|\{[^}]*\})?(?![A-Za-z0-9_])/g;

  function parseEdgeLine(line) {
    const masked = line.replace(/"(?:[^"\\]|\\.)*"/g, mm => ' '.repeat(mm.length));
    const tokens = [];
    TOKEN_RE.lastIndex = 0;
    let m;
    while ((m = TOKEN_RE.exec(masked)) !== null) {
      tokens.push({ id: m[1], start: m.index, end: m.index + m[0].length });
    }
    const out = [];
    for (let i = 0; i + 1 < tokens.length; i++) {
      const segMasked = masked.slice(tokens[i].end, tokens[i + 1].start);
      if (!segMasked.includes('->')) continue;
      const segOrig = line.slice(tokens[i].end, tokens[i + 1].start);
      const lbl = segOrig.match(/"((?:[^"\\]|\\.)*)"/);
      out.push({
        from: tokens[i].id,
        to: tokens[i + 1].id,
        label: lbl ? lbl[1].replace(/\\"/g, '"') : null,
        dashed: segMasked.includes('-.'),
      });
    }
    return out;
  }

  const edges = [];
  for (const { raw } of edgeLines) {
    const line = raw.trim();
    const parsed = parseEdgeLine(line);
    if (parsed.length === 0 && !/^[A-Za-z0-9_]+(\[|\(|\{)/.test(line)) {
      throw new Error('no edges parsed from: ' + line);
    }
    edges.push(...parsed);
  }

  // ---- classify nodes ----------------------------------------------------------
  const components = [];
  const compByOrigId = new Map();
  for (const [id, n] of nodes) {
    const label = cleanLabel(n.label);
    let type;
    if (n.cls === 'actor') type = 'external';
    else if (n.cls === 'store') type = 'database';
    else if (n.cls === 'broker') type = 'messagebus';
    else if (n.cls === 'service') type = 'backend';
    else if (n.cls === 'control') type = 'cloud';
    else type = n.shape === 'hexagon' ? 'messagebus' : (n.shape === 'stadium' ? 'external' : (n.shape === 'cylinder' ? 'database' : 'backend'));

    const comp = { id: safeId(id), type, label };
    const parts = splitLabel(label) ?? splitSlash(label);
    if (parts) { comp.label = parts[0]; comp.sublabel = parts[1]; }
    components.push(comp);
    compByOrigId.set(id, comp.id);
  }

  // ---- boundaries from subgraphs -------------------------------------------------
  const boundaries = [];
  const platformSg = subgraphs.find(s => s.id === 'platform');
  if (platformSg) {
    const wraps = [];
    for (const [id, n] of nodes) {
      if (n.subgraph && n.subgraph.id === 'platform') wraps.push(safeId(id));
    }
    if (wraps.length) boundaries.push({ kind: 'region', label: platformSg.label, wraps });
  } else {
    for (const sg of subgraphs) {
      const wraps = [];
      for (const [id, n] of nodes) {
        if (n.subgraph && n.subgraph.id === sg.id) wraps.push(safeId(id));
      }
      if (wraps.length) boundaries.push({ kind: 'region', label: sg.label, wraps });
    }
  }

  // ---- connections -----------------------------------------------------------------
  const connections = [];
  const seen = new Set();
  for (const e of edges) {
    const from = compByOrigId.get(e.from);
    const to = compByOrigId.get(e.to);
    if (!from || !to) continue;
    const key = `${from}>${to}>${e.label ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const conn = { id: `e${connections.length + 1}-${from}-${to}`.slice(0, 60), from, to };
    if (e.label) conn.label = SHORTEN[e.label] ?? (e.label.length > 30 ? e.label.split(' (')[0] : e.label);
    if (e.dashed) conn.variant = 'dashed';
    connections.push(conn);
  }

  // fold opposing pairs (A->B + B->A, e.g. write/ack or read/value): the return
  // edge becomes part of the forward edge's label. Opposite-direction corridors
  // between the same two nodes are the #1 source of route conflicts.
  const pairSeen = new Set();
  const foldedConnections = [];
  for (const conn of connections) {
    const revKey = conn.to + '>' + conn.from;
    const fwdKey = conn.from + '>' + conn.to;
    if (pairSeen.has(revKey)) {
      // only fold solid return edges (acks/values); dashed returns are
      // control-plane and stay separate so they route independently
      if (!conn.variant) {
        const fwd = foldedConnections.find(c => c.from === conn.to && c.to === conn.from);
        if (fwd) {
          const ret = SHORTEN[conn.label] ?? conn.label ?? 'reply';
          fwd.label = (fwd.label ? fwd.label + ' / ' : '') + ret;
        }
        continue;
      }
    } else pairSeen.add(fwdKey);
    foldedConnections.push(conn);
  }
  connections.length = 0;
  connections.push(...foldedConnections);

  // ---- split control-plane subgraph (cloud-classified + dashed edges) ----------
  // Control nodes and the dashed edges touching them route through dedicated
  // outside lanes; solid data-path edges stay inside the clean layered grid.
  // ---- fold control-plane nodes into tags on their data-path peers --------------
  // The C4 templates attach mesh/ops/dlq/backup boxes to everything via dashed
  // edges. As Archify nodes that fans out into dozens of crossing routes; as
  // tags on the peers they touch, the information survives without the noise.
  // a node is control-plane if cloud-classed OR every edge touching it is dashed
  const hasSolid = new Map(components.map(c => [c.id, false]));
  for (const c of connections) {
    if (!c.variant || c.variant !== 'dashed') {
      if (hasSolid.has(c.from)) hasSolid.set(c.from, true);
      if (hasSolid.has(c.to)) hasSolid.set(c.to, true);
    }
  }
  const controlIds = new Set(components.filter(c => c.type === 'cloud' || !hasSolid.get(c.id)).map(c => c.id));
  const ov = OVERRIDES[outName.replace(/\.architecture\.json$/, '')] ?? {};
  const tagEdgeSet = new Set(Object.keys(ov.tagEdges ?? {}));
  const tagText = new Map();   // solidId -> array of tag strings
  const keptConnections = [];
  for (const conn of connections) {
    const aC = controlIds.has(conn.from), bC = controlIds.has(conn.to);
    if (!aC && !bC) {
      // per-spec override: fold a dashed edge into a tag on its target
      if (tagEdgeSet.has(conn.from + '>' + conn.to) && conn.variant === 'dashed') {
        if (!tagText.has(conn.to)) tagText.set(conn.to, []);
        const src = components.find(c => c.id === conn.from);
        tagText.get(conn.to).push(conn.label ?? ('← ' + shortName(src?.label ?? conn.from)));
        continue;
      }
      keptConnections.push(conn);
      continue;
    }
    if (aC && bC) continue;     // control-to-control edges fold away entirely
    const solidId = aC ? conn.to : conn.from;
    const ctrl = components.find(c => c.id === (aC ? conn.from : conn.to));
    if (!ctrl) continue;
    const verb = conn.from === solidId ? '→' : '←';
    if (!tagText.has(solidId)) tagText.set(solidId, []);
    tagText.get(solidId).push(verb + ' ' + shortName(ctrl.label));
  }
  for (const c of components) {
    if (controlIds.has(c.id)) continue;
    const tags = tagText.get(c.id);
    if (tags && tags.length) c.tag = tags.slice(0, 2).join(' · ');
  }
  let dataComponents = components.filter(c => !controlIds.has(c.id));
  const dataBoundaries = boundaries
    .map(b => ({ ...b, wraps: b.wraps.filter(id => !controlIds.has(id)) }))
    .filter(b => b.wraps.length >= 2);

  // per-spec merge: collapse duplicate sibling nodes (asyncR1+asyncR2 -> one)
  const mergedInto = new Map();
  if (ov.merge) {
    for (const [keepId, m] of Object.entries(ov.merge)) {
      const kc = dataComponents.find(c => c.id === keepId);
      for (const dropId of m.ids) {
        if (!dataComponents.some(c => c.id === dropId)) continue;
        mergedInto.set(dropId, keepId);
        dataComponents = dataComponents.filter(c => c.id !== dropId);
        for (const b of dataBoundaries) b.wraps = b.wraps.map(w => w === dropId ? keepId : w);
      }
      if (kc) { kc.label = m.label; delete kc.sublabel; }
    }
    for (const b of dataBoundaries) b.wraps = [...new Set(b.wraps)];
    for (const c of keptConnections) {
      c.from = mergedInto.get(c.from) ?? c.from;
      c.to = mergedInto.get(c.to) ?? c.to;
    }
    const seenC = new Set();
    for (let i = keptConnections.length - 1; i >= 0; i--) {
      const k = keptConnections[i].from + '>' + keptConnections[i].to + '>' + (keptConnections[i].label ?? '');
      if (seenC.has(k)) keptConnections.splice(i, 1);
      else seenC.add(k);
    }
  }

  // ---- layered layout on the clean data path ------------------------------------
  // Bidirectional pairs (A->B plus B->A, e.g. write/ack): the SECOND-declared
  // direction is the return edge — excluded from depth/barycenter and left to
  // the auto router, so the layered structure reflects the declared flow.
  const seenPairs = new Set();
  for (const c of keptConnections) {
    const fwd = c.from + '>' + c.to;
    const rev = c.to + '>' + c.from;
    if (seenPairs.has(rev)) c.__back = true;
    else seenPairs.add(fwd);
    // dashed control/feedback edges never drive layered depth
    if (c.variant === 'dashed') c.__back = true;
  }
  const layoutConnections = keptConnections.filter(c => !c.__back);
  const laidOut = autoLayout(dataComponents, layoutConnections, dataBoundaries);

  // anchor sides from post-layout geometry so the auto router honors them.
  // Vertical contract (bottom->top) when the boxes' x-ranges overlap enough
  // for port spread AND the rows differ; horizontal contract + orthogonal-h
  // otherwise (first/final segments stay horizontal, as the validator expects).
  const boxes = new Map(laidOut.components.map(c => [c.id, { x: c.pos[0], y: c.pos[1], w: c.size[0], h: c.size[1] }]));
  const occupied = (x0, x1, y0, y1, skipA, skipB) => laidOut.components.some(c => {
    if (c.id === skipA || c.id === skipB) return false;
    const b = boxes.get(c.id);
    return b.x + b.w > x0 && b.x < x1 && b.y + b.h > y0 && b.y < y1;
  });
  for (const conn of keptConnections) {
    const ab = boxes.get(conn.from), bb = boxes.get(conn.to);
    if (!ab || !bb) continue;
    const acy = ab.y + ab.h / 2, bcy = bb.y + bb.h / 2;
    const sameRow = Math.abs(bcy - acy) < ab.h * 0.75;
    if (!sameRow) {
      // cross-row: direction-consistent vertical contract only. The auto router
      // owns corridors/port-spread from here (specifying vias here collides with
      // its lane assignment and label placement).
      const down = bcy > acy;
      conn.fromSide = down ? 'bottom' : 'top';
      conn.toSide = down ? 'top' : 'bottom';
      delete conn.route;
      delete conn.via;
      continue;
    }
    // same row: straight horizontal only when the corridor is clear
    const acx = ab.x + ab.w / 2, bcx = bb.x + bb.w / 2;
    const x0 = Math.min(acx, bcx), x1 = Math.max(acx, bcx);
    const y0 = Math.min(acy, bcy) - 8, y1 = Math.max(acy, bcy) + 8;
    if (!occupied(x0, x1, y0, y1, conn.from, conn.to)) {
      conn.fromSide = bcx >= acx ? 'right' : 'left';
      conn.toSide = bcx >= acx ? 'left' : 'right';
      conn.route = 'straight';
    } else {
      conn.fromSide = bcx >= acx ? 'bottom' : 'bottom';
      conn.toSide = bcx >= acx ? 'bottom' : 'bottom';
      delete conn.route;
    }
  }

  // per-spec label fixes (validator diagnostics: labels overlapping boxes)
  if (ov.labels) {
    for (const [pairKey, patch] of Object.entries(ov.labels)) {
      const conn = keptConnections.find(c => (c.from + '>' + c.to).startsWith(pairKey) || c.id.startsWith('e') && c.from + '>' + c.to === pairKey);
      if (conn) Object.assign(conn, patch);
    }
  }

  // per-spec pinned routes for non-planar edges (computed from final geometry)
  if (ov.edge) {
    for (const [pair, fn] of Object.entries(ov.edge)) {
      const conn = keptConnections.find(c => c.from + '>' + c.to === pair);
      if (conn && !mergedInto.has(conn.to) && !mergedInto.has(conn.from)) fn(boxes, conn);
    }
  }

  const meta = { title, output: outName.replace(/\.json$/, '.html'), quality_profile: 'showcase' };
  if (laidOut.viewBox) meta.viewBox = laidOut.viewBox;
  for (const c of keptConnections) {
    if (!c.via) continue;
    meta.viewBox = [
      Math.max(meta.viewBox[0], Math.ceil(Math.max(...c.via.map(v => v[0])) + 60)),
      Math.max(meta.viewBox[1], Math.ceil(Math.max(...c.via.map(v => v[1])) + 40)),
    ];
  }
  const finalConnections = keptConnections.map(c => {
    const rest = { ...c };
    delete rest.__back;   // strip the internal layout flag from the emitted spec
    return rest;
  });
  const spec = { schema_version: 1, diagram_type: 'architecture', meta, components: laidOut.components, boundaries: laidOut.boundaries, connections: finalConnections };
  spec.__out = outName;
  return spec;
}

/**
 * Layered layout: rows by longest-path depth from sources, barycenter ordering
 * per row (weighted by upstream neighbors), control-plane nodes pushed to the
 * bottom rows. Emits explicit pos/size per component and adjusts boundaries.
 */
function autoLayout(components, connections, boundaries) {
  const H = 62, GAP_X = 110, GAP_Y = 190, MARGIN = 70;
  // node widths sized to their text (label 7.2px/char, sublabel 5.4, tag 3.8)
  const textW = (s, per) => Math.max(0, String(s).length) * per + 28;
  const widthOf = new Map();
  for (const c of components) {
    const wLabel = textW(c.label, 7.2);
    const wSub = c.sublabel ? textW(c.sublabel, 5.4) + 8 : 0;
    const wTag = c.tag ? textW(c.tag, 3.8) : 0;
    widthOf.set(c.id, Math.min(420, Math.max(148, Math.ceil(wLabel), Math.ceil(wSub), Math.ceil(wTag))));
  }
  const ids = components.map(c => c.id);
  const idSet = new Set(ids);
  const out = new Map(ids.map(id => [id, []]));
  const inc = new Map(ids.map(id => [id, []]));
  for (const c of connections) {
    if (idSet.has(c.from) && idSet.has(c.to)) {
      out.get(c.from).push(c.to);
      inc.get(c.to).push(c.from);
    }
  }

  // depth = longest path from any source (node with no incoming solid edge)
  const depth = new Map(ids.map(id => [id, 0]));
  {
    // Kahn topological walk; when cycles stall the queue, force-release the
    // unreleased node with the fewest remaining inputs (minimum-indeg break)
    const indeg = new Map(ids.map(id => [id, inc.get(id).length]));
    const queue = ids.filter(id => indeg.get(id) === 0);
    const released = new Set();
    const forceRelease = () => {
      let best = null;
      for (const id of ids) {
        if (released.has(id)) continue;
        if (best === null || indeg.get(id) < indeg.get(best)) best = id;
      }
      if (best !== null) queue.push(best);
    };
    while (queue.length) {
      const n = queue.shift();
      if (released.has(n)) continue;
      released.add(n);
      for (const m of out.get(n)) {
        if (released.has(m)) continue;
        depth.set(m, Math.max(depth.get(m) ?? 0, (depth.get(n) ?? 0) + 1));
        indeg.set(m, indeg.get(m) - 1);
        if (indeg.get(m) === 0) queue.push(m);
      }
      if (!queue.length && released.size < ids.length) forceRelease();
    }
  }

  // rows: depth -> ordered ids; isolated nodes (no edges) go to a trailing row
  const isolated = ids.filter(id => out.get(id).length === 0 && inc.get(id).length === 0);
  const connected = ids.filter(id => !isolated.includes(id));
  const maxDepth = Math.max(...connected.map(id => depth.get(id) ?? 0), 0);
  const rows = Array.from({ length: maxDepth + 1 }, () => []);
  for (const id of connected) rows[depth.get(id) ?? 0].push(id);
  if (isolated.length) rows.push(isolated);

  // barycenter pass: order each row by mean upstream column, two sweeps
  const col = new Map();
  for (let r = 0; r < rows.length; r++) rows[r].forEach((id, i) => col.set(id, i));
  for (let sweep = 0; sweep < 3; sweep++) {
    for (let r = 1; r < rows.length; r++) {
      const scored = rows[r].map((id, i) => {
        const ups = inc.get(id).filter(u => (depth.get(u) ?? 0) < r);
        const bc = ups.length ? ups.reduce((s, u) => s + (col.get(u) ?? 0), 0) / ups.length : i;
        return { id, bc, i };
      }).sort((a, b) => a.bc - b.bc || a.i - b.i);
      rows[r] = scored.map(s => s.id);
      scored.forEach((s, i) => col.set(s.id, i));
    }
  }

  // place - center each row within the content width (gaps included)
  const rowGapW = rows.map(row => row.reduce((s2, id) => s2 + widthOf.get(id), 0) + (row.length - 1) * GAP_X);
  const rowWidths = rowGapW;
  const maxRow = Math.max(...rowWidths, 1);
  const totalW = MARGIN * 2 + maxRow;
  let y = MARGIN;
  const pos = new Map();
  const size = new Map();
  for (let r = 0; r < rows.length; r++) {
    const rowW = rowWidths[r];
    const startX = Math.round((totalW - rowW) / 2);
    let x = startX;
    rows[r].forEach((id) => {
      const w = widthOf.get(id);
      pos.set(id, [x, y]);
      size.set(id, [w, H]);
      x += w + GAP_X;
    });
    y += H + GAP_Y;
  }
  const totalH = y - GAP_Y + MARGIN;

  for (const c of components) {
    c.pos = pos.get(c.id);
    c.size = size.get(c.id);
  }

  // boundaries: pad boxes around their wrapped nodes
  const newBoundaries = [];
  for (const b of boundaries) {
    const boxes = b.wraps.map(id => ({ x: pos.get(id)[0], y: pos.get(id)[1], w: size.get(id)[0], h: size.get(id)[1] })).filter(Boolean);
    if (!boxes.length) continue;
    newBoundaries.push(b);
  }

  // meta.viewBox must cover everything incl. boundary labels (schema min 320x240)
  const pad = 24;
  const vbW = Math.max(totalW + pad * 2, 960);
  const vbH = Math.max(totalH + pad * 2, 320);

  return { components, boundaries: newBoundaries, viewBox: [Math.ceil(vbW), Math.ceil(vbH)] };
}

// ---- helpers --------------------------------------------------------------------
function titleCase(slug) {
  return slug.split('-').map(w => WORDS[w] ?? (WORDS[w.toLowerCase()]
    ? WORDS[w.toLowerCase()]
    : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
}

function cleanLabel(s) {
  return (s ?? '').replace(/^"|"$/g, '').replace(/\\"/g, '"').replace(/\s+/g, ' ').trim();
}

// split "Main - detail" / "Main — detail" into label + sublabel
function splitLabel(label) {
  const m = label.match(/^(.{2,60}?)\s+[-\u2014\u2013]\s+(.{1,})$/);
  if (!m) return null;
  return [m[1], m[2]];
}

// split "A / B / C / D" into label (first 1-2 segments) + sublabel (rest)
function splitSlash(label) {
  const segs = label.split(' / ');
  if (segs.length < 2) return null;
  const nLabel = Math.min(2, segs.length - 1);
  return [segs.slice(0, nLabel).join(' / '), segs.slice(nLabel).join(' / ')];
}

function safeId(id) {
  let s = id.replace(/[^A-Za-z0-9_-]/g, '_');
  if (/^[0-9]/.test(s)) s = 'n' + s;
  return s;
}
