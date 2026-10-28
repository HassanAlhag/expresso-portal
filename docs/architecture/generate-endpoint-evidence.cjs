#!/usr/bin/env node
/* R5-C1 — offline endpoint / caller evidence register.
 *
 * Documentation only. Reads tracked repository source and the existing
 * source inventory; never imports the application, opens a database, reads
 * .env, calls a service, touches storage, or reads access logs.
 *
 * Route source of truth: docs/architecture/source-inventory.json (apiRoutes,
 * produced by generate-inventory.cjs). This file adds caller EVIDENCE only.
 *
 * What it can establish: whether the REPOSITORY contains a caller for each
 * route, and what kind. What it cannot establish: whether anything calls the
 * route in production. Every record therefore says
 *   usageEvidence: "NOT_COLLECTED", externalConsumerStatus: "UNKNOWN"
 * and no record is ever marked safe to delete.
 *
 * Usage:
 *   node docs/architecture/generate-endpoint-evidence.cjs           write endpoint-evidence.json
 *   node docs/architecture/generate-endpoint-evidence.cjs --check   fail if it is stale (no writes)
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');

const ROOT = path.resolve(__dirname, '../..');
const parser = createRequire(path.join(ROOT, 'client/package.json'))('@babel/parser');

const SCHEMA_VERSION = 'expresso.endpoint-evidence/1';
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const DYN = '\u0000';
const CLASSES = [
  'ACTIVE_TRACKED_CALLER', 'BROWSER_GENERATED_PATH', 'SERVER_INTERNAL_CALLER', 'UNUSED_EXPORT', 'UNREACHABLE_CALLER',
  'TEST_ONLY', 'OPERATOR_RETAIN', 'NO_TRACKED_ACTIVE_CALLER', 'EXTERNAL_CONSUMER_POSSIBLE', 'UNKNOWN',
];
const ANNOTATION_CLASSES = ['OPERATOR_RETAIN'];
const SELF_TEST = 'portal-api/test/endpoint-evidence.test.js';

/* ------------------------------------------------------------------ AST */
const parse = (code) => parser.parse(code, { sourceType: 'unambiguous', plugins: ['jsx'] });
const SKIP_KEYS = new Set(['loc', 'start', 'end', 'extra', 'leadingComments', 'trailingComments', 'innerComments']);
function walk(n, fn, parent = null) {
  if (!n || typeof n !== 'object' || !n.type) return;
  if (fn(n, parent) === false) return;
  for (const [k, v] of Object.entries(n)) {
    if (SKIP_KEYS.has(k)) continue;
    if (Array.isArray(v)) v.forEach((x) => walk(x, fn, n));
    else if (v && typeof v === 'object' && v.type) walk(v, fn, n);
  }
}
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const isFnNode = (n) => Boolean(n) && ['ArrowFunctionExpression', 'FunctionExpression', 'FunctionDeclaration', 'ClassExpression', 'ClassDeclaration'].includes(n.type);
const keyName = (p) => p?.key?.name ?? p?.key?.value;

/* ------------------------------------------------------- module analysis */
// Per file: top-level declarations, exports, imports, the code that runs when
// the module loads, and the source range of each declaration.
function analyseModule(file, code, has) {
  const ast = parse(code);
  const resolve = (spec) => {
    if (typeof spec !== 'string' || !spec.startsWith('.')) return null;
    const base = path.posix.normalize(path.posix.join(path.posix.dirname(file), spec));
    return [base, `${base}.js`, `${base}.jsx`, `${base}/index.js`, `${base}/index.jsx`].find(has) || null;
  };
  const m = { file, ast, decls: new Map(), ranges: [], exports: new Map(), starExports: [], imports: new Map(), dynamicImports: [], loadNodes: [], resolve };
  const addDecl = (name, node, range) => {
    if (!m.decls.has(name)) m.decls.set(name, []);
    m.decls.get(name).push(node);
    m.ranges.push({ name, start: range.start, end: range.end });
  };
  const declare = (d, outer) => {
    if (d.type === 'FunctionDeclaration' || d.type === 'ClassDeclaration') {
      addDecl(d.id ? d.id.name : 'default', d, outer);
    } else if (d.type === 'VariableDeclaration') {
      for (const v of d.declarations) {
        if (v.id.type !== 'Identifier') { m.loadNodes.push(v); continue; }
        addDecl(v.id.name, v, v);
        if (v.init && !isFnNode(v.init)) m.loadNodes.push(v.init); // initialisers run when the module loads
      }
    }
  };
  for (const st of ast.program.body) {
    if (st.type === 'ImportDeclaration') {
      const target = resolve(st.source.value);
      for (const s of st.specifiers) {
        const imported = s.type === 'ImportDefaultSpecifier' ? 'default' : s.type === 'ImportNamespaceSpecifier' ? '*' : (s.imported.name ?? s.imported.value);
        m.imports.set(s.local.name, { target, source: st.source.value, imported });
      }
    } else if (st.type === 'ExportNamedDeclaration') {
      if (st.declaration) {
        const d = st.declaration;
        declare(d, st);
        const names = d.type === 'VariableDeclaration' ? d.declarations.filter((x) => x.id.type === 'Identifier').map((x) => x.id.name) : [d.id?.name].filter(Boolean);
        for (const n of names) m.exports.set(n, { local: n });
      }
      const target = st.source ? resolve(st.source.value) : null;
      for (const s of st.specifiers || []) {
        const exported = s.exported.name ?? s.exported.value;
        if (st.source) m.exports.set(exported, { reexport: target, name: s.local?.name ?? 'default' });
        else m.exports.set(exported, { local: s.local.name });
      }
    } else if (st.type === 'ExportAllDeclaration') {
      m.starExports.push(resolve(st.source.value));
    } else if (st.type === 'ExportDefaultDeclaration') {
      const d = st.declaration;
      if (d.type === 'FunctionDeclaration' || d.type === 'ClassDeclaration') {
        declare(d, st);
        m.exports.set('default', { local: d.id ? d.id.name : 'default' });
      } else if (d.type === 'Identifier') {
        m.exports.set('default', { local: d.name });
      } else {
        addDecl('default', d, st);
        m.exports.set('default', { local: 'default' });
        if (!isFnNode(d)) m.loadNodes.push(d);
      }
    } else if (st.type === 'FunctionDeclaration' || st.type === 'ClassDeclaration' || st.type === 'VariableDeclaration') {
      declare(st, st);
    } else {
      m.loadNodes.push(st); // module-level statements run on import
    }
  }
  walk(ast, (n) => {
    if (n.type === 'CallExpression' && n.callee.type === 'Import' && n.arguments[0]?.type === 'StringLiteral') {
      m.dynamicImports.push({ target: resolve(n.arguments[0].value) });
    }
  });
  return m;
}

/** Name of the innermost top-level declaration containing `pos`, or "<module>". */
function enclosing(m, pos) {
  let best = null;
  for (const r of m.ranges) if (pos >= r.start && pos < r.end && (!best || r.end - r.start < best.end - best.start)) best = r;
  return best ? best.name : '<module>';
}

/* ------------------------------------------------------- reference graph */
// Nodes are "file#decl" (decl may be "<module>"). An edge A→B means A's code
// references B. A request inside B is ACTIVE only if B is reachable from the
// module-load code of a reachable file. Module reachability alone, or a call
// from a sibling helper that is itself unused, does not make B active.
function buildGraph(mods) {
  const edges = new Map();
  const add = (from, to) => {
    if (!edges.has(from)) edges.set(from, new Set());
    edges.get(from).add(to);
  };
  let importTargets;
  const exportTargets = (file, name, seen = new Set()) => {
    const k = `${file}:${name}`;
    if (!file || seen.has(k)) return [];
    seen.add(k);
    const m = mods.get(file);
    if (!m) return [];
    if (name === '*') return [...m.exports.keys(), ...m.starExports.length ? ['__star__'] : []].flatMap((n) => (n === '__star__' ? m.starExports.flatMap((t) => exportTargets(t, '*', seen)) : exportTargets(file, n, seen)));
    const e = m.exports.get(name);
    if (e?.local) {
      if (m.decls.has(e.local)) return [`${file}#${e.local}`];
      if (m.imports.has(e.local)) return importTargets(m, e.local, seen);
      return [];
    }
    if (e?.reexport) return exportTargets(e.reexport, e.name, seen);
    return m.starExports.flatMap((t) => exportTargets(t, name, seen));
  };
  importTargets = (m, local, seen = new Set(), member = null) => {
    const imp = m.imports.get(local);
    if (!imp?.target) return [];
    if (imp.imported === '*') return exportTargets(imp.target, member || '*', seen);
    return exportTargets(imp.target, imp.imported, seen);
  };
  const refsOf = (m, node) => {
    const out = new Set();
    walk(node, (n, parent) => {
      if (n.type === 'Identifier' || n.type === 'JSXIdentifier') {
        if (parent && (parent.type === 'MemberExpression' || parent.type === 'OptionalMemberExpression') && parent.property === n && !parent.computed) return;
        if (parent && parent.type === 'ObjectProperty' && parent.key === n && !parent.computed && !parent.shorthand) return;
        if (parent && (parent.type === 'JSXAttribute' || (parent.type === 'JSXMemberExpression' && parent.property === n))) return;
        const name = n.name;
        if (m.decls.has(name)) out.add(`${m.file}#${name}`);
        else if (m.imports.has(name)) {
          let member = null;
          if (parent && (parent.type === 'MemberExpression' || parent.type === 'JSXMemberExpression') && parent.object === n && !parent.computed) member = parent.property.name;
          for (const t of importTargets(m, name, new Set(), member)) out.add(t);
        }
      }
      if (n.type === 'CallExpression' && n.callee.type === 'Import' && n.arguments[0]?.type === 'StringLiteral') {
        // import("./x") — conservatively every export of x, plus its load code.
        const t = m.resolve(n.arguments[0].value);
        if (t) { out.add(`${t}#<module>`); for (const x of exportTargets(t, '*')) out.add(x); }
      }
      return undefined;
    });
    return out;
  };
  for (const m of mods.values()) {
    const load = `${m.file}#<module>`;
    add(load, load);
    for (const n of m.loadNodes) for (const r of refsOf(m, n)) add(load, r);
    // Importing a file runs that file's load code.
    for (const imp of m.imports.values()) if (imp.target) add(load, `${imp.target}#<module>`);
    for (const e of m.exports.values()) if (e.reexport) add(load, `${e.reexport}#<module>`);
    for (const t of m.starExports) if (t) add(load, `${t}#<module>`);
    for (const [name, nodes] of m.decls) for (const node of nodes) for (const r of refsOf(m, node)) add(`${m.file}#${name}`, r);
  }
  return edges;
}
function closure(edges, roots) {
  const seen = new Set(roots);
  const stack = [...roots];
  while (stack.length) {
    const x = stack.pop();
    for (const y of edges.get(x) || []) if (!seen.has(y)) { seen.add(y); stack.push(y); }
  }
  return seen;
}
/** Files reachable from the entry through static imports, re-exports and import(). */
function reachableFiles(mods, entry) {
  const seen = new Set();
  const visit = (f) => {
    if (!f || seen.has(f) || !mods.has(f)) return;
    seen.add(f);
    const m = mods.get(f);
    for (const i of m.imports.values()) visit(i.target);
    for (const e of m.exports.values()) visit(e.reexport);
    m.starExports.forEach(visit);
    m.dynamicImports.forEach((d) => visit(d.target));
  };
  visit(entry);
  return seen;
}

/* ------------------------------------------------------- URL resolution */
// A URL resolves to parts: literal text, DYN for a runtime value, or
// { param } for a parameter of the enclosing function. Module constants and
// local variables are followed; `process.env.X || "/api"` resolves to its
// default (no environment value is ever read). Parameters are substituted
// from the same-file call sites of the enclosing function.
function makeResolver(m) {
  const fnOf = new Map();
  for (const [name, nodes] of m.decls) {
    const n = nodes[0];
    const fn = n.type === 'VariableDeclarator' ? n.init : n;
    if (fn && /Function/.test(fn.type)) fnOf.set(name, fn);
  }
  const findLocal = (scopeNode, name, before) => {
    let found = null;
    walk(scopeNode, (n) => {
      if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.id.name === name && n.start < before && n.init) found = n.init;
    });
    return found;
  };
  const resolveParts = (node, scope, depth = 0) => {
    if (!node || depth > 12) return [DYN];
    switch (node.type) {
      case 'StringLiteral': return [node.value];
      case 'TemplateLiteral': {
        const out = [];
        node.quasis.forEach((q, i) => {
          out.push(q.value.cooked ?? q.value.raw);
          if (i < node.expressions.length) out.push(...resolveParts(node.expressions[i], scope, depth + 1));
        });
        return out;
      }
      case 'BinaryExpression':
        return node.operator === '+' ? [...resolveParts(node.left, scope, depth + 1), ...resolveParts(node.right, scope, depth + 1)] : [DYN];
      case 'LogicalExpression': {
        const l = node.left;
        const isEnv = l.type === 'MemberExpression' && l.object?.type === 'MemberExpression' && l.object.object?.name === 'process' && l.object.property?.name === 'env';
        return isEnv && (node.operator === '||' || node.operator === '??') ? resolveParts(node.right, scope, depth + 1) : [DYN];
      }
      case 'Identifier': {
        if (scope) {
          if (scope.params.some((p) => p.type === 'Identifier' && p.name === node.name)) return [{ param: node.name }];
          const local = findLocal(scope.body, node.name, node.start);
          if (local) return resolveParts(local, scope, depth + 1);
        }
        const d = m.decls.get(node.name)?.[0];
        if (d?.type === 'VariableDeclarator' && d.init && !isFnNode(d.init)) return resolveParts(d.init, null, depth + 1);
        return [DYN];
      }
      default: return [DYN];
    }
  };
  const flatten = (parts) => parts.map((p) => (typeof p === 'object' ? DYN : p));
  /** All URL variants for `node` inside the top-level function `fn` (or null). */
  const resolveUrl = (node, fn) => {
    const parts = resolveParts(node, fn, 0);
    if (!parts.some((p) => typeof p === 'object')) return [parts];
    const fnName = [...fnOf.entries()].find(([, f]) => f === fn)?.[0];
    if (!fnName) return [flatten(parts)];
    const variants = [];
    walk(m.ast, (n) => {
      if (n.type !== 'CallExpression' || n.callee.type !== 'Identifier' || n.callee.name !== fnName) return;
      const callerFn = fnOf.get(enclosing(m, n.start)) || null;
      const out = [];
      for (const p of parts) {
        if (typeof p !== 'object') { out.push(p); continue; }
        const idx = fn.params.findIndex((x) => x.type === 'Identifier' && x.name === p.param);
        const arg = idx >= 0 ? n.arguments[idx] : null;
        out.push(...(arg ? flatten(resolveParts(arg, callerFn, 0)) : [DYN]));
      }
      variants.push(out);
    });
    return variants.length ? variants : [flatten(parts)];
  };
  return { resolveParts, resolveUrl, fnOf };
}

/** URL parts → path segments (query and fragment dropped). null if not an /api path. */
function toSegments(parts, base = '') {
  let s = base + parts.map((p) => (typeof p === 'string' ? p : DYN)).join('');
  const q = s.search(/[?#]/);
  if (q !== -1) s = s.slice(0, q);
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
  if (!s.startsWith('/api/')) return null;
  return s.split('/').slice(1).map((seg) => (seg.includes(DYN) ? DYN : seg));
}
const segmentsLabel = (segs) => `/${segs.map((x) => (x === DYN ? ':runtime' : x)).join('/')}`;

/* ----------------------------------------------------------- routes */
// Express serves the FIRST registered match. Order: the app.js line of the
// router mount (or of the app-level route), then the line in the router file.
function routeOrder(routes, mounts) {
  const mountLine = new Map(mounts.map((x) => [x.file, x.line]));
  return routes.map((r, i) => {
    const appLevel = r.file.endsWith('/app.js');
    return { ...r, segs: r.path.split('/').slice(1), order: [appLevel ? r.line : (mountLine.get(r.file) ?? 1e9), appLevel ? 0 : r.line, i] };
  }).sort((a, b) => a.order[0] - b.order[0] || a.order[1] - b.order[1] || a.order[2] - b.order[2]);
}
function matchRoute(ordered, method, segs) {
  for (const r of ordered) {
    if (r.method !== method || r.segs.length !== segs.length) continue;
    // A parameter takes any one segment; a runtime value never equals a static segment.
    if (r.segs.every((rs, i) => rs.startsWith(':') || (segs[i] !== DYN && rs === segs[i]))) return r;
  }
  return null;
}

/* ------------------------------------------------------- guards */
const AUTH_GUARDS = {
  requireAuth: 'required', optionalAuth: 'optional', requireInternalUser: 'required (internal user)',
  requireStaffOrApprovedVendor: 'required (internal user or approved vendor)', requireApprovedVendor: 'required (approved vendor)',
};
function guardInfo(route) {
  const labels = [...route.globalGuards.map((g) => (typeof g === 'string' ? g : g.label)), ...route.handlers.slice(0, -1).map((h) => h.label)];
  const permissions = [];
  const guards = [];
  let auth = 'none';
  for (const l of labels) {
    const name = l.replace(/\(.*$/s, '');
    const args = [...l.matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    if (name === 'requirePermission') permissions.push(...args);
    else if (name === 'requireAnyPermission') permissions.push(args.join(' | '));
    else if (AUTH_GUARDS[name]) {
      guards.push(name);
      if (auth === 'none' || auth === 'optional') auth = AUTH_GUARDS[name];
    } else if (name === 'requireRole') guards.push(`requireRole(${args.join(',')})`);
    else if (/^[A-Za-z]+$/.test(name)) guards.push(name);
  }
  const handler = route.handlers[route.handlers.length - 1];
  return { auth, guards: [...new Set(guards)], permissions, handler: handler ? { label: handler.label, source: handler.source } : null };
}

/* ------------------------------------------------------- analysis */
/**
 * Pure analysis over in-memory inputs (used by the generator and the tests).
 * inputs: { routes, mounts, client: { files, entry }, server: { files, entry }, tests: { files }, annotations: { entries } }
 */
function analyse(inputs) {
  const ordered = routeOrder(inputs.routes, inputs.mounts);
  const rkey = (r) => `${r.method} ${r.path}`;
  const evidence = new Map(inputs.routes.map((r) => [rkey(r), { active: [], unusedExport: [], unreachable: [], browser: [], server: [], tests: [], testPathRefs: 0 }]));
  const unresolved = [];
  const record = (bucket, method, segs, site) => {
    const route = matchRoute(ordered, method, segs);
    if (route) evidence.get(rkey(route))[bucket].push(site);
    return Boolean(route);
  };

  /* ---- client ---- */
  const cFiles = inputs.client.files;
  const cmods = new Map(Object.keys(cFiles).sort().map((f) => [f, analyseModule(f, cFiles[f], (x) => Object.hasOwn(cFiles, x))]));
  const reach = reachableFiles(cmods, inputs.client.entry);
  const graph = buildGraph(cmods);
  const active = closure(graph, [...reach].map((f) => `${f}#<module>`));
  const unreachableRoots = [...cmods.keys()].filter((f) => !reach.has(f)).flatMap((f) => [`${f}#<module>`, ...[...cmods.get(f).decls.keys()].map((d) => `${f}#${d}`)]);
  const fromUnreachable = closure(graph, unreachableRoots);
  const resolvers = new Map([...cmods.values()].map((m) => [m.file, makeResolver(m)]));

  // HTTP clients: `axios` itself, or a binding to axios.create({ baseURL }).
  const instances = new Map();
  for (const m of cmods.values()) {
    for (const [name, nodes] of m.decls) {
      const init = nodes[0].type === 'VariableDeclarator' ? nodes[0].init : null;
      if (init?.type === 'CallExpression' && init.callee.type === 'MemberExpression' && init.callee.object.name === 'axios' && init.callee.property.name === 'create') {
        const baseNode = init.arguments[0]?.properties?.find((p) => keyName(p) === 'baseURL')?.value;
        const parts = baseNode ? resolvers.get(m.file).resolveParts(baseNode, null) : [''];
        instances.set(`${m.file}#${name}`, parts.every((p) => typeof p === 'string') ? parts.join('') : null);
      }
    }
  }
  const clientBase = (m, ident) => {
    if (m.imports.get(ident)?.source === 'axios') return '';
    if (instances.has(`${m.file}#${ident}`)) return instances.get(`${m.file}#${ident}`);
    const imp = m.imports.get(ident);
    const target = imp && cmods.get(imp.target);
    const local = target?.exports.get(imp.imported)?.local;
    if (local && instances.has(`${target.file}#${local}`)) return instances.get(`${target.file}#${local}`);
    return undefined; // not an HTTP client (e.g. Map#get, URLSearchParams#get)
  };

  // A file that binds its own `fetch` (e.g. a component's local loader) does
  // not call the global fetch through that name.
  const shadowsFetch = (m) => {
    let found = false;
    walk(m.ast, (n) => {
      if ((n.type === 'VariableDeclarator' || n.type === 'FunctionDeclaration') && n.id?.type === 'Identifier' && n.id.name === 'fetch') found = true;
    });
    return found;
  };
  const requestArgs = new Set();
  for (const m of cmods.values()) {
    const res = resolvers.get(m.file);
    const localFetch = shadowsFetch(m);
    walk(m.ast, (n) => {
      if (n.type !== 'CallExpression') return;
      let method;
      let base;
      if (n.callee.type === 'Identifier' && n.callee.name === 'fetch') {
        if (localFetch) return;
        base = '';
        const opts = n.arguments[1];
        const mp = opts?.type === 'ObjectExpression' ? opts.properties.find((p) => keyName(p) === 'method') : null;
        method = mp ? (mp.value.type === 'StringLiteral' ? mp.value.value.toUpperCase() : null) : 'GET';
      } else if (n.callee.type === 'MemberExpression' && n.callee.object.type === 'Identifier' && HTTP_METHODS.includes(n.callee.property.name)) {
        base = clientBase(m, n.callee.object.name);
        if (base === undefined) return;
        method = n.callee.property.name.toUpperCase();
      } else return;
      const urlNode = n.arguments[0];
      if (!urlNode) return;
      requestArgs.add(urlNode);
      const decl = enclosing(m, n.start);
      const site = { file: m.file, line: n.loc.start.line, function: decl };
      const state = !reach.has(m.file) ? 'unreachable'
        : active.has(`${m.file}#${decl}`) ? 'active'
          : fromUnreachable.has(`${m.file}#${decl}`) ? 'unreachable' : 'unusedExport';
      for (const parts of res.resolveUrl(urlNode, res.fnOf.get(decl) || null)) {
        if (base === null) { unresolved.push({ ...site, state, reason: 'HTTP client base URL is not statically resolvable' }); continue; }
        if (parts[0] === DYN && !base) { unresolved.push({ ...site, state, reason: 'URL is not statically resolvable' }); continue; }
        const segs = toSegments(parts, base);
        if (!segs) continue; // not an API URL (external site, asset, etc.)
        if (!method) { unresolved.push({ ...site, state, url: segmentsLabel(segs), reason: 'HTTP method is not statically resolvable' }); continue; }
        const ok = record(state, method, segs, { ...site, url: segmentsLabel(segs) });
        if (!ok) unresolved.push({ ...site, state, method, url: segmentsLabel(segs), reason: 'no registered route matches' });
      }
    });
  }
  // Active client code that builds an API URL for the browser (links, images, windows).
  for (const m of cmods.values()) {
    const res = resolvers.get(m.file);
    walk(m.ast, (n, parent) => {
      if (!['StringLiteral', 'TemplateLiteral'].includes(n.type) || requestArgs.has(n)) return;
      if (parent && ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(parent.type)) return;
      if (parent && parent.type === 'TemplateLiteral') return;
      const parts = res.resolveParts(n, null);
      if (typeof parts[0] !== 'string' || !parts[0].startsWith('/api/')) return;
      const decl = enclosing(m, n.start);
      if (!reach.has(m.file) || !active.has(`${m.file}#${decl}`)) return;
      const segs = toSegments(parts);
      if (segs) record('browser', 'GET', segs, { file: m.file, line: n.loc.start.line, function: decl, origin: 'client', url: segmentsLabel(segs) });
    });
  }

  /* ---- server: URLs the API builds for the browser, or calls itself ---- */
  const sFiles = inputs.server.files;
  const smods = new Map(Object.keys(sFiles).sort().map((f) => [f, analyseModule(f, sFiles[f], (x) => Object.hasOwn(sFiles, x))]));
  const sReach = reachableFiles(smods, inputs.server.entry);
  for (const m of smods.values()) {
    if (!sReach.has(m.file)) continue;
    const res = makeResolver(m);
    walk(m.ast, (n, parent) => {
      if (!['StringLiteral', 'TemplateLiteral'].includes(n.type)) return;
      if (parent && parent.type === 'TemplateLiteral') return;
      // Route registration itself is not a caller: app.use("/api/x", …), app.get(…), router.get(…).
      if (parent && parent.type === 'CallExpression' && parent.arguments[0] === n && parent.callee.type === 'MemberExpression' && ['app', 'router'].includes(parent.callee.object.name)) return;
      const text = res.resolveParts(n, null).map((p) => (typeof p === 'string' ? p : DYN)).join('');
      const at = text.indexOf('/api/');
      if (at === -1 || (at > 0 && text.slice(0, at).replace(new RegExp(DYN, 'g'), '') !== '')) return; // "/api/…" or "<origin>/api/…" only
      const segs = toSegments([text.slice(at)]);
      if (!segs) return;
      const site = { file: m.file, line: n.loc.start.line, function: enclosing(m, n.start), origin: 'server', url: segmentsLabel(segs) };
      const callee = parent && parent.type === 'CallExpression' && parent.arguments[0] === n ? parent.callee : null;
      if (callee && callee.type === 'Identifier' && callee.name === 'fetch') record('server', 'GET', segs, site);
      else if (callee && callee.type === 'MemberExpression' && HTTP_METHODS.includes(callee.property?.name)) record('server', callee.property.name.toUpperCase(), segs, site);
      else record('browser', 'GET', segs, site); // a URL handed to the browser (browsers fetch with GET)
    });
  }

  /* ---- tests: expected behaviour, never deployed usage ---- */
  for (const [file, code] of Object.entries(inputs.tests.files).sort()) {
    const m = analyseModule(file, code, () => false);
    const res = makeResolver(m);
    walk(m.ast, (n, parent) => {
      if ((n.type === 'StringLiteral' || n.type === 'TemplateLiteral') && !(parent && parent.type === 'TemplateLiteral')) {
        const parts = res.resolveParts(n, null).map((p) => (typeof p === 'string' ? p : DYN));
        if (typeof parts[0] === 'string' && parts[0].startsWith('/api/')) {
          const segs = toSegments(parts);
          if (segs) for (const r of ordered) if (r.segs.length === segs.length && r.segs.every((s, i) => s.startsWith(':') || s === segs[i])) evidence.get(rkey(r)).testPathRefs++;
        }
      }
      if (n.type !== 'CallExpression') return;
      let method = null;
      let urlArg = null;
      const a = n.arguments;
      const mi = a.findIndex((x) => x.type === 'StringLiteral' && /^(GET|POST|PUT|PATCH|DELETE)$/.test(x.value));
      if (mi !== -1 && a[mi + 1]) { method = a[mi].value; urlArg = a[mi + 1]; }
      else if (n.callee.type === 'MemberExpression' && HTTP_METHODS.includes(n.callee.property?.name) && a[0]) { method = n.callee.property.name.toUpperCase(); urlArg = a[0]; }
      if (!method) return;
      const segs = toSegments(res.resolveParts(urlArg, null));
      if (segs) record('tests', method, segs, { file, line: n.loc.start.line });
    });
  }

  /* ---- annotations: explicit, reviewed owner intent only ---- */
  const annotations = new Map();
  for (const x of inputs.annotations.entries) {
    const k = `${x.method} ${x.path}`;
    if (!ANNOTATION_CLASSES.includes(x.classification)) throw new Error(`annotation for ${k} uses an unsupported classification`);
    if (!evidence.has(k)) throw new Error(`annotation names an unregistered route: ${k}`);
    if (typeof x.reason !== 'string' || !x.reason.trim()) throw new Error(`annotation for ${k} needs a reason`);
    if (annotations.has(k)) throw new Error(`duplicate annotation: ${k}`);
    annotations.set(k, x);
  }

  /* ---- records ---- */
  const sortSites = (xs) => [...new Map(xs.map((x) => [`${x.file}:${x.line}:${x.url ?? ''}:${x.reason ?? ''}`, x])).values()]
    .sort((p, q) => p.file.localeCompare(q.file) || p.line - q.line || String(p.url ?? '').localeCompare(String(q.url ?? '')));
  const records = inputs.routes.map((r) => {
    const e = evidence.get(rkey(r));
    const g = guardInfo(r);
    const ann = annotations.get(rkey(r));
    const tracked = e.active.length + e.browser.length + e.server.length > 0;
    const cls = new Set();
    if (e.active.length) cls.add('ACTIVE_TRACKED_CALLER');
    if (e.browser.length) cls.add('BROWSER_GENERATED_PATH');
    if (e.server.length) cls.add('SERVER_INTERNAL_CALLER');
    if (e.unusedExport.length) cls.add('UNUSED_EXPORT');
    if (e.unreachable.length) cls.add('UNREACHABLE_CALLER');
    if (!tracked && e.tests.length) cls.add('TEST_ONLY');
    if (ann) cls.add(ann.classification);
    if (!tracked) cls.add('NO_TRACKED_ACTIVE_CALLER');
    if (!tracked || g.auth === 'none' || g.auth === 'optional') cls.add('EXTERNAL_CONSUMER_POSSIBLE');
    const review = !tracked && !ann;
    return {
      method: r.method,
      path: r.path,
      domain: r.domain,
      route: { file: r.file, line: r.line },
      handler: g.handler,
      auth: g.auth,
      guards: g.guards,
      permissions: g.permissions,
      evidence: {
        activeTrackedCallers: sortSites(e.active),
        browserGeneratedPaths: sortSites(e.browser),
        serverInternalCallers: sortSites(e.server),
        unusedExportCallers: sortSites(e.unusedExport),
        unreachableCallers: sortSites(e.unreachable),
        testReferences: sortSites(e.tests),
        testPathReferences: e.testPathRefs,
      },
      classifications: CLASSES.filter((c) => cls.has(c)),
      operatorRetain: ann ? { reason: ann.reason } : null,
      externalConsumerStatus: 'UNKNOWN',
      usageEvidence: 'NOT_COLLECTED',
      ownerReviewRequired: review,
      retirementStatus: review ? 'EVIDENCE_REQUIRED' : 'NOT_AUTHORIZED',
    };
  }).sort((p, q) => p.path.localeCompare(q.path) || p.method.localeCompare(q.method));

  const count = (c) => records.filter((r) => r.classifications.includes(c)).length;
  return {
    records,
    summary: {
      totalApiRegistrations: records.length,
      activeTrackedCaller: count('ACTIVE_TRACKED_CALLER'),
      browserGeneratedPath: count('BROWSER_GENERATED_PATH'),
      serverInternalCaller: count('SERVER_INTERNAL_CALLER'),
      testOnly: count('TEST_ONLY'),
      unusedExport: count('UNUSED_EXPORT'),
      unreachableCaller: count('UNREACHABLE_CALLER'),
      noTrackedActiveCaller: count('NO_TRACKED_ACTIVE_CALLER'),
      operatorRetain: count('OPERATOR_RETAIN'),
      externalConsumerUnknown: records.filter((r) => r.externalConsumerStatus === 'UNKNOWN').length,
      externalConsumerPossible: count('EXTERNAL_CONSUMER_POSSIBLE'),
      reviewRequired: records.filter((r) => r.ownerReviewRequired).length,
      usageEvidenceCollected: records.filter((r) => r.usageEvidence !== 'NOT_COLLECTED').length,
      unresolvedCallSites: unresolved.length,
      note: 'Counts overlap: a route can carry several classifications.',
    },
    unresolvedCallSites: sortSites(unresolved),
    clientUnreachableFiles: [...cmods.keys()].filter((f) => !reach.has(f)).sort(),
  };
}

/* ------------------------------------------------------- repository I/O */
function listFiles(dir, pred) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  const visit = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') visit(p); } else out.push(path.relative(ROOT, p).split(path.sep).join('/'));
    }
  };
  visit(abs);
  return out.filter(pred);
}
const readAll = (list) => Object.fromEntries(list.map((f) => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]));
const isSource = (f) => /\.(js|jsx)$/.test(f) && !/\.(test|spec)\./.test(f);

function loadRepository() {
  const inventoryText = fs.readFileSync(path.join(__dirname, 'source-inventory.json'), 'utf8');
  const inventory = JSON.parse(inventoryText);
  const annotationsText = fs.readFileSync(path.join(__dirname, 'endpoint-evidence-annotations.json'), 'utf8');
  const client = readAll(listFiles('client/src', isSource));
  const server = readAll(listFiles('portal-api/src', isSource));
  // The register's own test names routes as data, not as calls; it is not evidence.
  const tests = readAll(listFiles('portal-api/test', (f) => /\.js$/.test(f) && f !== SELF_TEST));
  const digestFiles = (o) => sha256(JSON.stringify(Object.entries(o).map(([f, c]) => [f, sha256(c)])));
  return {
    inventory,
    inputs: {
      routes: inventory.apiRoutes,
      mounts: inventory.mounts,
      client: { files: client, entry: 'client/src/index.js' },
      server: { files: server, entry: 'portal-api/src/server.js' },
      tests: { files: tests },
      annotations: JSON.parse(annotationsText),
    },
    digests: {
      sourceInventory: sha256(inventoryText),
      annotations: sha256(annotationsText),
      clientSources: digestFiles(client),
      serverSources: digestFiles(server),
      apiTests: digestFiles(tests),
    },
  };
}

function build() {
  const { inventory, inputs, digests } = loadRepository();
  const result = analyse(inputs);
  if (result.records.length !== inventory.counts.apiRoutes || result.records.length !== inventory.apiRoutes.length) {
    throw new Error('evidence records do not reconcile with the source inventory');
  }
  if (JSON.stringify(result.clientUnreachableFiles) !== JSON.stringify(inventory.unreachableFrontendCandidates)) {
    throw new Error('client reachability disagrees with the source inventory; regenerate it first');
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    generator: 'docs/architecture/generate-endpoint-evidence.cjs',
    provenance: {
      routeSource: 'docs/architecture/source-inventory.json (apiRoutes)',
      annotations: 'docs/architecture/endpoint-evidence-annotations.json',
      digests,
      note: 'Content digests rather than a commit id, so the register is reproducible from the commit that contains it. No timestamp is recorded.',
    },
    meaning: {
      scope: 'Repository evidence only: which routes have a tracked caller in this repository. It does not show which routes are used in production.',
      categoriesAreNonExclusive: true,
      usageEvidence: 'NOT_COLLECTED for every route. No deployment or access-log evidence has been gathered (R5-C2 onwards). Retiring an endpoint requires 90 days of production access-log evidence and owner review.',
      externalConsumerStatus: 'UNKNOWN for every route. Repository evidence cannot prove that no external consumer exists.',
      retirementStatus: 'EVIDENCE_REQUIRED: no tracked active caller and no operator-retain annotation; needs access-log evidence and owner review before any decision. NOT_AUTHORIZED: no retirement is authorised. No record is ever marked safe to delete.',
      classifications: {
        ACTIVE_TRACKED_CALLER: 'A request site in reachable client code whose enclosing function is itself used, not merely located in a reachable module.',
        BROWSER_GENERATED_PATH: 'The API (or active client code) builds this URL for the browser to load directly, e.g. a signed private-file link; there is no axios/fetch call.',
        SERVER_INTERNAL_CALLER: 'The API calls this route itself.',
        UNUSED_EXPORT: 'A request site in a reachable module whose function nothing active uses, including helpers called only by unused siblings.',
        UNREACHABLE_CALLER: 'A request site in client code not reachable from client/src/index.js, or used only from such code. Not an active caller.',
        TEST_ONLY: 'Only automated tests call it. Tests show expected behaviour, not deployed consumption.',
        OPERATOR_RETAIN: 'Explicit reviewed annotation: an operator or security endpoint kept regardless of frontend callers.',
        NO_TRACKED_ACTIVE_CALLER: 'No active client caller, browser-generated path or server caller in the repository. Not evidence that production does not use it.',
        EXTERNAL_CONSUMER_POSSIBLE: 'Public or optional-auth route, or no tracked caller: an external consumer cannot be ruled out from the repository.',
        UNKNOWN: 'Reserved for evidence the analysis cannot attribute; call sites it cannot resolve are listed under unresolvedCallSites.',
      },
      matching: 'Client URLs are resolved through module constants, local variables, API base constants (process.env.X || "/api" resolves to its literal default; no environment value is read) and the same-file call sites of wrapper functions. A runtime value fills one path segment and matches only a route parameter, never a static segment such as /public or /tree. The first route registered in Express order wins. Each HTTP method is a separate record. Browser-generated URLs are GET.',
      ordering: 'Records sorted by path, then method. Evidence sites sorted by file, then line.',
    },
    summary: result.summary,
    unresolvedCallSites: result.unresolvedCallSites,
    records: result.records,
  };
}

if (require.main === module) {
  const output = `${JSON.stringify(build(), null, 2)}\n`;
  const dest = path.join(__dirname, 'endpoint-evidence.json');
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== output) {
      console.error('endpoint-evidence.json is stale: run node docs/architecture/generate-endpoint-evidence.cjs');
      process.exit(1);
    }
  } else fs.writeFileSync(dest, output);
  console.log(JSON.stringify(JSON.parse(output).summary, null, 2));
}

module.exports = { analyse, build, toSegments, matchRoute, routeOrder, guardInfo, SCHEMA_VERSION, CLASSES, DYN };
