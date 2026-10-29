#!/usr/bin/env node
/* R5-B3: offline asset evidence only. Reads tracked assets/current source/Git metadata;
 * writes exactly three evidence documents, or performs no writes with --check.
 * Never imports application code, reads .env, contacts a database/storage/CMS,
 * or removes, moves, renames or repairs any asset. No deletion authorization.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const ROOT = path.resolve(__dirname, '../..');
const parser = createRequire(path.join(ROOT, 'client/package.json'))('@babel/parser');
const OUTPUTS = ['asset-evidence.json', 'asset-reference-plan.json', 'ASSET-RECONCILIATION-B3.md'];
const EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg', '.ico', '.bmp', '.tif', '.tiff', '.mp4', '.webm', '.mov', '.m4v', '.mp3', '.wav', '.ogg', '.ttf', '.otf', '.woff', '.woff2', '.eot', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.txt']);
const TEXT_EXTENSIONS = new Set(['.js', '.jsx', '.cjs', '.mjs', '.ts', '.tsx', '.svg', '.json', '.html', '.css', '.scss', '.sass', '.less', '.md', '.mdx', '.xml', '.yaml', '.yml', '.txt']);
const SELF = new Set([...OUTPUTS.map(f => `docs/architecture/${f}`), 'docs/architecture/asset-evidence-policy.json', 'docs/architecture/ASSET-EVIDENCE-PLAN.md', 'docs/architecture/generate-asset-evidence.cjs', 'portal-api/test/asset-evidence.test.js', 'docs/architecture/source-inventory.json', 'docs/architecture/endpoint-evidence.json']);
const CLASSES = ['STATICALLY_REFERENCED', 'PROTECTED', 'DYNAMIC_REFERENCE_POSSIBLE', 'DATABASE_EVIDENCE_REQUIRED', 'CMS_EVIDENCE_REQUIRED', 'STORAGE_EVIDENCE_REQUIRED', 'EXTERNAL_CONSUMER_POSSIBLE', 'UNRESOLVED'];
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const ordered = value => JSON.stringify(value);
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value;
const digest = value => sha256(JSON.stringify(stable(value)));
const sort = list => list.sort((a, b) => ordered(a).localeCompare(ordered(b), 'en'));
const unique = list => sort([...new Map(list.map(v => [ordered(v), v])).values()]);
const key = n => n?.key?.name ?? n?.key?.value;
const property = (n, name) => n?.properties?.find(p => key(p) === name)?.value;
const memberName = n => n?.type === 'Identifier' ? n.name : /MemberExpression$/.test(n?.type || '') ? `${memberName(n.object)}.${n.property?.name ?? n.property?.value}` : '';
function walk(n, fn, parent = null) {
  if (!n || typeof n !== 'object' || !n.type) return;
  fn(n, parent);
  for (const [k, v] of Object.entries(n)) {
    if (['loc', 'extra', 'comments', 'leadingComments', 'trailingComments', 'innerComments', 'tokens'].includes(k)) continue;
    if (Array.isArray(v)) v.forEach(c => walk(c, fn, n));
    else if (v?.type) walk(v, fn, n);
  }
}
const astOf = (code, file) => parser.parse(code, { sourceType: 'unambiguous', plugins: ['jsx', ...(/\.tsx?$/.test(file) ? ['typescript'] : [])] });
function cleanAst(n) {
  if (Array.isArray(n)) return n.map(cleanAst);
  if (n && typeof n === 'object') return Object.fromEntries(Object.entries(n).filter(([k]) => !['loc', 'start', 'end', 'extra', 'comments', 'leadingComments', 'trailingComments', 'innerComments'].includes(k)).map(([k, v]) => [k, cleanAst(v)]));
  return n;
}
function inRoot(file, root) { return file.startsWith(root + '/'); }
function isAsset(file, policy) {
  if ((policy.scope.excludedOperationalSources || []).includes(file)) return false;
  return policy.scope.fontLicensePaths.includes(file) || (EXTENSIONS.has(path.posix.extname(file).toLowerCase()) && [...policy.scope.publicRoots, ...policy.scope.sourceAssetRoots].some(root => inRoot(file, root)));
}
function assetType(file) {
  const ext = path.posix.extname(file).toLowerCase();
  if (/\.(ttf|otf|woff2?|eot)$/.test(ext)) return 'font';
  if (/\.(mp4|webm|mov|m4v)$/.test(ext)) return 'video';
  if (/\.(mp3|wav|ogg)$/.test(ext)) return 'audio';
  if (/\.(svg|ico)$/.test(ext)) return 'icon';
  if (/\.(pdf|docx?|xlsx?|pptx?|zip)$/.test(ext)) return 'static-document';
  if (ext === '.txt') return /(?:^|\/)(?:OFL|LICENSE)(?:\.[^/]*)?$/i.test(file) ? 'font-license' : 'static-document';
  return 'image';
}
const looksLikeAsset = s => typeof s === 'string' && !/^\.[a-z0-9]+$/i.test(s) && /[^/\s]+\.(png|jpe?g|webp|gif|avif|svg|ico|bmp|tiff?|mp4|webm|mov|m4v|mp3|wav|ogg|ttf|otf|woff2?|eot|pdf|docx?|xlsx?|pptx?|zip|txt)(?:[?#].*)?$/i.test(s.trim());

/** No basename search: only explicit public-root or source-relative candidates.
 * Absolute URLs are NOT equated to local files by their pathname. Future
 * capture must obtain an owner-approved origin/CDN/prefix mapping first.
 */
function resolveReference(raw, { source, form = 'literal', assetPaths, policy }) {
  if (typeof raw !== 'string') return { status: 'UNRESOLVED_VALUE' };
  let value = raw.trim().replace(/^(?:%PUBLIC_URL%|\$\{PUBLIC_URL\})/, '');
  if (!value || /^(?:data:|blob:|#)/i.test(value)) return { status: 'INLINE_OR_FRAGMENT' };
  if (/^https?:\/\/|^\/\//i.test(value)) {
    try {
      const u = new URL(value.startsWith('//') ? `https:${value}` : value);
      if (u.username || u.password) return { status: 'CREDENTIAL_URL_REFUSED' };
      return { status: 'EXTERNAL_URL_NOT_MAPPED', origin: u.origin, path: u.pathname };
    } catch { return { status: 'MALFORMED_URL' }; }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return { status: 'UNSUPPORTED_SCHEME' };
  value = value.split(/[?#]/, 1)[0];
  if (/%(?:2f|5c|00)/i.test(value)) return { status: 'ENCODED_SEPARATOR_OR_NUL' };
  try { value = decodeURIComponent(value); } catch { return { status: 'MALFORMED_PERCENT_ENCODING' }; }
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return { status: 'MALFORMED_PATH' };
  if (value.startsWith('/') && value.split('/').includes('..')) return { status: 'PATH_OUTSIDE_ASSET_ROOT' };
  if (/^\/?uploads(?:\/|$)/i.test(value)) return { status: 'RUNTIME_UPLOAD_NAMESPACE' };
  if (/\$\{|\{[^}]+\}/.test(value)) return { status: 'DYNAMIC_VALUE' };
  const publicRoot = policy.scope.publicRoots[0];
  let candidate;
  let confidence;
  if (value.startsWith('/')) { candidate = publicRoot + value; confidence = 'HIGH_PUBLIC_ROOT'; }
  else if (value.startsWith('client/') || value.startsWith('portal-api/')) { candidate = value; confidence = 'HIGH_REPOSITORY_PATH'; }
  else if (value.startsWith('public/') && source.startsWith('client/')) { candidate = 'client/' + value; confidence = 'MEDIUM_PUBLIC_CONVENTION'; }
  else if (/^\.{1,2}\//.test(value) || ['import', 'require', 'css-url', 'html-attribute', 'markdown-link', 'manifest-src'].includes(form)) { candidate = path.posix.join(path.posix.dirname(source), value); confidence = 'HIGH_SOURCE_RELATIVE'; }
  else { candidate = publicRoot + '/' + value; confidence = 'MEDIUM_PUBLIC_CONVENTION'; }
  candidate = path.posix.normalize(candidate);
  if (![...policy.scope.publicRoots, ...policy.scope.sourceAssetRoots].some(root => inRoot(candidate, root))) return { status: 'PATH_OUTSIDE_ASSET_ROOT', candidate };
  if ((policy.scope.excludedOperationalSources || []).includes(candidate)) return { status: 'OPERATIONAL_SOURCE_NOT_ASSET', path: candidate };
  const exact = assetPaths.includes(candidate);
  if (exact) return { status: 'RESOLVED', path: candidate, confidence };
  const caseMatches = assetPaths.filter(p => p.toLowerCase() === candidate.toLowerCase());
  if (caseMatches.length) return { status: 'CASE_MISMATCH', candidate, matches: caseMatches };
  return { status: 'NOT_IN_TRACKED_ASSETS', candidate };
}

// Lexical bindings prevent a local variable/parameter from borrowing an
// unrelated module constant of the same name. No eval or application imports.
function lexicalValues(ast) {
  const scopes = new WeakMap();
  const byNode = new WeakMap();
  const namesInPattern = n => !n ? [] : n.type === 'Identifier' ? [n.name] : n.type === 'ObjectPattern' ? n.properties.flatMap(p => namesInPattern(p.value || p.argument)) : n.type === 'ArrayPattern' ? n.elements.flatMap(namesInPattern) : n.type === 'AssignmentPattern' ? namesInPattern(n.left) : n.type === 'RestElement' ? namesInPattern(n.argument) : [];
  function descend(n, scope, parent = null) {
    if (!n?.type) return;
    const creates = ['Program', 'BlockStatement', 'ArrowFunctionExpression', 'FunctionExpression', 'FunctionDeclaration'].includes(n.type);
    if (creates) { scope = { parent: scope, vars: new Map() }; scopes.set(n, scope); }
    byNode.set(n, scope);
    if (/Function/.test(n.type)) for (const p of n.params || []) for (const name of namesInPattern(p)) scope.vars.set(name, null);
    if (n.type === 'VariableDeclarator') for (const name of namesInPattern(n.id)) scope.vars.set(name, n.id.type === 'Identifier' && parent?.kind === 'const' ? n.init : null);
    for (const [k, v] of Object.entries(n)) {
      if (['loc', 'extra', 'comments', 'leadingComments', 'trailingComments', 'innerComments'].includes(k)) continue;
      if (Array.isArray(v)) v.forEach(c => descend(c, scope, n)); else if (v?.type) descend(v, scope, n);
    }
  }
  descend(ast.program, null);
  function evaluate(n, seen = new Set()) {
    if (!n) return undefined;
    if (['StringLiteral', 'NumericLiteral', 'BooleanLiteral'].includes(n.type)) return n.value;
    if (n.type === 'Identifier') {
      let s = byNode.get(n);
      while (s && !s.vars.has(n.name)) s = s.parent;
      const bound = s?.vars.get(n.name);
      if (!bound || seen.has(bound)) return undefined;
      return evaluate(bound, new Set([...seen, bound]));
    }
    if (memberName(n) === 'process.env.PUBLIC_URL') return '';
    if (n.type === 'BinaryExpression' && n.operator === '+') {
      const a = evaluate(n.left, seen), b = evaluate(n.right, seen);
      return a === undefined || b === undefined ? undefined : String(a) + String(b);
    }
    if (n.type === 'TemplateLiteral') {
      let out = n.quasis[0].value.cooked;
      for (let i = 0; i < n.expressions.length; i++) { const v = evaluate(n.expressions[i], seen); if (v === undefined) return undefined; out += String(v) + n.quasis[i + 1].value.cooked; }
      return out;
    }
    if (n.type === 'MemberExpression' && n.object.type === 'ObjectExpression') {
      const name = n.computed ? evaluate(n.property, seen) : n.property.name;
      return evaluate(property(n.object, name), seen);
    }
    return undefined;
  }
  return evaluate;
}
function provenance(file, unreachable) {
  if (/\.(?:test|spec)\.|(?:^|\/)test(?:s)?\//.test(file)) return 'TEST';
  if (file.startsWith('docs/') || /\.mdx?$/.test(file)) return 'DOCUMENTATION';
  if (file.startsWith('client/public/')) return 'PUBLIC_CONFIGURATION';
  if (unreachable.has(file)) return 'UNREACHABLE_SOURCE';
  if (file.includes('/scripts/')) return 'OPERATOR_SOURCE';
  if (file.startsWith('client/src/') || file.startsWith('portal-api/src/')) return 'RUNTIME_SOURCE';
  return 'CONFIGURATION_OR_CONTENT';
}
function extractReferences(file, code, unreachable = new Set()) {
  const found = [];
  const dynamic = [];
  const problems = [];
  const operations = [];
  const assetKey = name => /(?:urls?|href|src|srcset|poster|s3key|cvkey|mediaids?|fileids?|mediarefs|coverimageid)$|^(?:images?|media|files?|filename|uploads?|attachments?|avatar|logo|receipt|covermedia|gallery|thumbnail|thumbimage|blocks|eventMeta)$/i.test(name || '');
  const prov = provenance(file, unreachable);
  const add = (value, form, context, override) => {
    if (typeof value !== 'string') return;
    if ((value.includes('<') && /<(?:img|source|video|a)\b/i.test(value)) || /\burl\(/i.test(value)) markup(value, override || prov);
    if (looksLikeAsset(value)) found.push({ raw: value, source: file, form, context, provenance: override || prov });
  };
  const markup = (text, p) => {
    for (const m of text.matchAll(/\b(src|href|poster)\s*=\s*["']([^"']+)["']/gi)) add(m[2], 'html-attribute', m[1], p);
    for (const m of text.matchAll(/\burl\(\s*["']?([^)'"\n]+)["']?\s*\)/gi)) add(m[1], 'css-url', 'url', p);
    for (const m of text.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) for (const item of m[1].split(',')) add(item.trim().split(/\s+/)[0], 'html-attribute', 'srcset', p);
  };
  const comment = text => {
    const unquoted = text.replace(/["'`]([^"'`\n]+)["'`]/g, (all, value) => { add(value, 'comment', 'comment', 'COMMENT'); return ' '; });
    for (const m of unquoted.matchAll(/(?:\/|\b)(?:[A-Za-z0-9_.%-]+\/)*[A-Za-z0-9_.%-]+\.(?:png|jpe?g|webp|gif|svg|ico|ttf|woff2?|pdf)\b/gi)) add(m[0], 'comment', 'comment', 'COMMENT');
  };
  const ext = path.posix.extname(file).toLowerCase();
  if (/\.[cm]?[jt]sx?$/.test(file)) {
    let ast;
    try { ast = astOf(code, file); } catch { return { references: [], dynamic: [], problems: [{ source: file, code: 'SOURCE_PARSE_UNRESOLVED' }] }; }
    const evaluate = lexicalValues(ast);
    for (const c of ast.comments || []) comment(c.value);
    walk(ast.program, (n, parent) => {
      if (prov === 'RUNTIME_SOURCE' || prov === 'UNREACHABLE_SOURCE' || prov === 'OPERATOR_SOURCE') {
        const field = n.type === 'ObjectProperty' ? key(n) : /MemberExpression$/.test(n.type) ? (n.computed ? n.property?.value : n.property?.name) : n.type === 'JSXAttribute' ? n.name?.name : null;
        if (assetKey(field)) operations.push({ source: file, field, context: parent?.type || n.type, expressionDigest: digest(cleanAst(n.type === 'MemberExpression' && parent ? parent : n)) });
      }
      if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(n.type) && n.source) add(n.source.value, 'import', 'module');
      if (n.type === 'CallExpression' && n.callee.name === 'require') add(evaluate(n.arguments[0]), 'require', 'module');
      if (n.type === 'JSXAttribute') {
        const name = n.name?.name;
        if (['src', 'href', 'poster', 'srcSet'].includes(name)) {
          const value = n.value?.type === 'JSXExpressionContainer' ? evaluate(n.value.expression) : n.value?.value;
          if (value === undefined) dynamic.push({ source: file, form: 'jsx-dynamic', context: name, provenance: prov, scope: 'PUBLIC_PATH_OR_URL_POSSIBLE', expressionDigest: digest(cleanAst(n.value?.expression)) });
          else if (name === 'srcSet') for (const item of String(value).split(',')) add(item.trim().split(/\s+/)[0], 'jsx-attribute', name);
          else add(value, 'jsx-attribute', name);
        }
      }
      if (n.type === 'TemplateLiteral' || (n.type === 'BinaryExpression' && n.operator === '+')) {
        if (parent?.type === 'BinaryExpression' || parent?.type === 'TemplateLiteral') return;
        const value = evaluate(n);
        if (value !== undefined) add(value, 'static-expression', 'expression');
        else {
          const literals = [];
          walk(n, x => { if (x.type === 'StringLiteral') literals.push(x.value); if (x.type === 'TemplateElement') literals.push(x.value.cooked); });
          if (literals.some(v => /\.(png|jpe?g|webp|svg|ttf|woff2?)\b|\/(?:images|assets|uploads)\//i.test(v))) dynamic.push({ source: file, form: 'partial-expression', context: 'computed-path', provenance: prov, scope: 'PUBLIC_PATH_OR_URL_POSSIBLE', patternDigest: digest(literals), expressionDigest: digest(cleanAst(n)) });
        }
      }
      if (n.type === 'StringLiteral' && !['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration', 'BinaryExpression', 'JSXAttribute'].includes(parent?.type)) add(n.value, 'string-literal', parent?.type === 'ObjectProperty' ? `property:${key(parent)}` : parent?.type || 'literal', parent?.type === 'ObjectProperty' && key(parent) === 'placeholder' ? 'UI_PLACEHOLDER' : undefined);
    });
  } else if (ext === '.json') {
    try {
      const visit = (value, at) => {
        if (typeof value === 'string') add(value, file.endsWith('/manifest.json') && at.endsWith('.src') ? 'manifest-src' : 'json-value', at);
        else if (Array.isArray(value)) value.forEach((v, i) => visit(v, at + '[]'));
        else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) visit(v, at ? at + '.' + k : k);
      };
      visit(JSON.parse(code), '');
    } catch { problems.push({ source: file, code: 'CONTENT_PARSE_UNRESOLVED' }); }
  } else {
    const p = prov;
    const withoutComments = code.replace(/\/\*[\s\S]*?\*\//g, m => { comment(m); return ''; }).replace(/<!--[\s\S]*?-->/g, m => { comment(m); return ''; });
    markup(withoutComments, p);
    if (['.yaml', '.yml'].includes(ext)) for (const line of withoutComments.split('\n')) {
      const m = line.match(/^\s*(?:-\s*)?(?:[\w.-]+:\s*)?(.+?)\s*$/);
      if (!m) continue;
      const scalar = m[1].replace(/\s+#.*$/, '').replace(/^["']|["']$/g, '');
      add(scalar, 'yaml-scalar', 'config-value', p);
      if (/\$\{|^\*|^&/.test(scalar)) dynamic.push({ source: file, form: 'yaml-dynamic', context: 'interpolation-or-alias', provenance: p, scope: 'PUBLIC_PATH_OR_URL_POSSIBLE', expressionDigest: digest(scalar) });
    }
    if (ext === '.xml') for (const m of withoutComments.matchAll(/<[^>]+>([^<>]+)<\/[^>]+>/g)) add(m[1], 'xml-content', 'text', p);
    if (/\.mdx?$/.test(file)) for (const m of withoutComments.matchAll(/\]\(([^)]+)\)/g)) add(m[1].split(/\s+"/)[0], 'markdown-link', 'link', p);
    if (/\.s[ac]ss$/.test(file) && /#\{/.test(withoutComments)) dynamic.push({ source: file, form: 'scss-interpolation', context: 'stylesheet', provenance: p, scope: 'PUBLIC_PATH_OR_URL_POSSIBLE' });
  }
  return { references: unique(found), dynamic: unique(dynamic), operations: unique(operations), problems };
}

/** Parse schema declarations, nested schemas, arrays, maps and no-argument
 * object-returning helpers (notably SiteSettings.imgField). No model import.
 */
function schemaInventory(code, model) {
  const ast = astOf(code, model.file);
  const vars = new Map();
  const funcs = new Map();
  walk(ast.program, n => {
    if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier') vars.set(n.id.name, n.init);
    if (n.type === 'FunctionDeclaration' && n.id) funcs.set(n.id.name, n);
  });
  function resolve(n, seen = new Set()) {
    if (!n || seen.has(n)) return n;
    const next = new Set([...seen, n]);
    if (n.type === 'Identifier' && vars.has(n.name)) return resolve(vars.get(n.name), next);
    if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && !n.arguments.length) {
      const fn = funcs.get(n.callee.name);
      if (fn && !fn.params.length) return resolve(fn.body.body.find(s => s.type === 'ReturnStatement')?.argument, next);
    }
    return n;
  }
  let root;
  walk(ast.program, n => { if (n.type === 'CallExpression' && n.callee.property?.name === 'model' && n.arguments[0]?.value === model.name && n.arguments[1]) root = n.arguments[1]; });
  if (!root) throw new Error(`model schema not resolved: ${model.name}`);
  const fields = [];
  const unresolved = [];
  walk(ast.program, n => { if (n.type === 'CallExpression' && ['add', 'discriminator'].includes(n.callee.property?.name)) unresolved.push('(schema extension requires explicit review)'); });
  function object(n, prefix = '', depth = 0) {
    n = resolve(n);
    if (n?.type === 'NewExpression' && /(?:^|\.)Schema$/.test(memberName(n.callee))) n = resolve(n.arguments[0]);
    if (!n || depth > 20 || n.type !== 'ObjectExpression') { unresolved.push(prefix || '(root)'); return; }
    for (const p of n.properties) {
      if (p.type === 'SpreadElement') { object(p.argument, prefix, depth + 1); continue; }
      if (p.type !== 'ObjectProperty' || p.computed) { unresolved.push(prefix + '(computed field)'); continue; }
      const name = prefix + key(p);
      const v = resolve(p.value);
      const t = property(v, 'type');
      if (v?.type === 'ObjectExpression' && !t && !property(v, 'ref') && v.properties.length) { object(v, name + '.', depth + 1); continue; }
      field(t || v, name, v, depth + 1);
    }
  }
  function field(actual, at, descriptor, depth) {
    actual = resolve(actual);
    if (actual?.type === 'ArrayExpression') {
      if (!actual.elements[0]) { fields.push({ path: at + '[]', type: 'Mixed', ref: null, opaque: true, enumConstrained: false }); return; }
      const inner = resolve(actual.elements[0]);
      const innerType = property(inner, 'type');
      if (inner?.type === 'ObjectExpression' && innerType) field(innerType, at + '[]', inner, depth + 1);
      else if (inner?.type === 'NewExpression' || inner?.type === 'ObjectExpression') object(inner, at + '[].', depth + 1);
      else field(inner, at + '[]', descriptor, depth + 1);
      return;
    }
    if (actual?.type === 'NewExpression' && /Schema$/.test(memberName(actual.callee))) { object(actual, at + '.', depth + 1); return; }
    const typeName = memberName(actual).split('.').pop() || (actual?.type === 'ObjectExpression' ? 'Object' : 'Unresolved');
    if (typeName === 'Map') { field(property(descriptor, 'of') || { type: 'Identifier', name: 'Mixed' }, at + '.*', descriptor, depth + 1); return; }
    const f = { path: at, type: typeName, ref: property(descriptor, 'ref')?.value || null, opaque: ['Mixed', 'Object', 'Unresolved'].includes(typeName), enumConstrained: Boolean(property(descriptor, 'enum')) };
    if (property(descriptor, 'enum')) f.enumShape = digest(cleanAst(resolve(property(descriptor, 'enum'))));
    if (property(descriptor, 'select')?.value === false) f.selectFalse = true;
    fields.push(f);
  }
  object(root);
  if (unresolved.length) throw new Error(`schema fields need review: ${model.name} (${unresolved.join(', ')})`);
  return { model: model.name, collection: model.collection, source: model.file, fields: unique(fields) };
}
const OWNERSHIP = new Set(['File.productionId', 'File.customerId', 'File.projectId', 'File.jobId', 'Job.productionId']);
function captureRule(model, f, policy) {
  const name = f.path.replace(/\[\]|\.\*/g, '').split('.').pop();
  let kind;
  let target;
  let normalization;
  if (f.ref === 'Media' || f.ref === 'File') { kind = 'OBJECT_ID_REFERENCE'; target = f.ref; normalization = 'object-id-join'; }
  else if (OWNERSHIP.has(`${model}.${f.path}`)) { kind = 'OWNERSHIP_CONTEXT'; target = f.ref; normalization = 'capture-local-hmac-join'; }
  else if (f.opaque || f.path.includes('.*')) { kind = 'OPAQUE_REFERENCE_CONTAINER'; target = 'Media/File/path/URL/key/legacy'; normalization = 'bounded-local-recursive-reference-extraction'; }
  else if (model === 'BrandAsset' && name === 'value') { kind = 'TYPE_DEPENDENT_VALUE'; target = 'path/URL/font-token/color'; normalization = 'brand-value-by-type'; }
  else if (model === 'SiteSettings' && f.path === 'websiteImages.images[].key') { kind = 'OVERRIDE_SELECTOR_KEY'; target = 'websiteImageRegistry selector, not an asset path or storage key'; normalization = 'exact-registry-key-context'; }
  else if (model === 'Media' && name === 'filename') { kind = 'MEDIA_FILENAME_METADATA'; target = 'original-name metadata only, never sufficient asset identity'; normalization = 'metadata-only-no-path-resolution'; }
  else if (model === 'File' && name === 'filename') { kind = 'PRIVATE_STORAGE_KEY_OR_LEGACY_NAME'; target = 'private storage key when isPrivate=true; legacy name otherwise'; normalization = 'file-filename-by-isPrivate'; }
  else if ((/url|uri|href|src|image|thumbnail|avatar|logo|receipt|attachment|^cvKey$|s3Key|filename|fileKey|storageKey|^icon$|^website$/i.test(name) || model === 'SiteSettings' && f.path === 'websiteImages.images[].key') && f.type === 'String') {
    kind = /key$|filename/i.test(name) ? 'STORAGE_KEY_OR_LEGACY_NAME' : 'URL_OR_PATH_OR_SYMBOL'; target = kind.startsWith('STORAGE') ? 'storage-key; Media.filename is metadata only' : 'public-path/URL/legacy/symbol'; normalization = 'origin-aware-path-or-key';
  } else if (f.type === 'String' && !f.enumConstrained && (policy.referencePlan.richTextFields.includes(name) || /description|html|markdown|content|excerpt|notes|caption|story|script/i.test(name))) { kind = 'TEXT_REFERENCE_POSSIBLE'; target = 'embedded-path/URL'; normalization = 'local-html-markdown-css-token-extraction'; }
  if (!kind) return null;
  return {
    referenceKind: kind,
    expectedValueType: f.type + (f.path.includes('[]') ? ' (array element)' : ''),
    target,
    normalization,
    nested: /\.|\[\]/.test(f.path),
    htmlOrRichTextParsing: kind === 'TEXT_REFERENCE_POSSIBLE' || f.opaque,
    contextFields: model === 'Media' ? ['type'] : model === 'BrandAsset' && name === 'value' ? ['type'] : model === 'File' && name === 'filename' ? ['isPrivate'] : [],
    malformedOrUnresolved: 'code + source field + capture-local HMAC; no raw value, document, credential, query string or PII',
    exposure: kind === 'OWNERSHIP_CONTEXT' ? 'HMAC identifier only; no owner profile' : 'local extraction only; export matched repository path or HMAC of unresolved/private locator',
  };
}
function referencePlan(models, codeByPath, policy) {
  const inventory = models.map(m => schemaInventory(codeByPath[m.file], m)).sort((a, b) => a.model.localeCompare(b.model, 'en'));
  const surfaces = [];
  for (const m of inventory) {
    m.referenceSurfaceIds = [];
    for (const f of m.fields) {
      const rule = captureRule(m.model, f, policy);
      f.captureDisposition = rule ? rule.referenceKind : 'NOT_AN_IDENTIFIED_ASSET_SURFACE';
      if (!rule) continue;
      const id = `${m.collection}:${f.path}`;
      m.referenceSurfaceIds.push(id);
      surfaces.push({ id, model: m.model, collection: m.collection, fieldPath: f.path, source: m.source, ...rule, requiresExplicitSelection: f.selectFalse === true, cms: policy.referencePlan.cmsModels.includes(m.model), legacyProductionEvidence: m.model === 'Production' || ['File.productionId', 'Job.productionId'].includes(`${m.model}.${f.path}`), evidenceState: 'NOT_COLLECTED' });
    }
  }
  for (const m of inventory) m.futureProjection = { authorized: false, identifierHandling: '_id read locally for capture-local HMAC joins only; never export raw identifier', fields: [...new Set(surfaces.filter(s => s.model === m.model).flatMap(s => [s.fieldPath, ...s.contextFields]))].sort(), opaqueHandling: 'No raw object projection/export; bounded extraction within separately authorized capture process' };
  return {
    schemaVersion: 'expresso.lifecycle.asset-reference-plan/1',
    method: 'AST only; all registered models and leaf fields inventoried; helper-returned image fields expanded; no model/application import or database capture',
    models: inventory,
    surfaces: sort(surfaces),
    surfaceSets: {
      PUBLIC_PATH_OR_URL: surfaces.filter(s => ['URL_OR_PATH_OR_SYMBOL', 'TEXT_REFERENCE_POSSIBLE', 'OPAQUE_REFERENCE_CONTAINER', 'TYPE_DEPENDENT_VALUE'].includes(s.referenceKind)).map(s => s.id).sort(),
      MEDIA_FILE_INDIRECTION: surfaces.filter(s => s.referenceKind === 'OBJECT_ID_REFERENCE' || ['Media', 'File'].includes(s.model)).map(s => s.id).sort(),
      CMS_FIELDS_AND_OVERRIDES: surfaces.filter(s => s.cms).map(s => s.id).sort(),
      BRAND_OR_ATTACHMENT_FIELDS: surfaces.filter(s => ['BrandAsset', 'File', 'Message', 'Invoice', 'RFQ', 'Quotation', 'JobApplication'].includes(s.model)).map(s => s.id).sort(),
    },
    fieldExtractionLimits: ['Opaque Mixed/Object/Map containers require bounded recursive extraction in a separately authorized process; never export their raw content.', 'Text fields require local HTML/Markdown/CSS/URL token parsing. Values and customer/applicant/staff identifiers never leave that process.', 'Historical/unknown collections and out-of-schema legacy fields remain an evidence gap; current schemas cannot prove them absent.'],
    captureContract: {
      executionAuthorized: false,
      requiredScope: 'Separate read-only target/profile authorization, explicit collection/field allowlist, complete-capture metadata, bounded scans and a capture-local join key.',
      resultFields: ['model', 'collection', 'fieldPath', 'sourceRecordHmac (only if necessary)', 'referenceType', 'matchedRepositoryPath OR privateLocatorHmac', 'resolutionStatus', 'sanitizedErrorCode'],
      excluded: ['full documents', 'names', 'emails', 'phones', 'passwords/hashes/tokens', 'signed URL queries', 'raw HTML/Markdown/JSON', 'private keys/URLs/filenames', 'application/user ownership profiles'],
      coverage: 'Every selected field/collection must declare complete/partial/not-collected; malformed, bounded-out, unsupported and unknown values remain unresolved. No absence conclusion from partial evidence.',
      opaqueFields: 'Future capture may read an allowlisted opaque field inside the authorized process to extract only reference tokens; if that cannot be bounded or minimized, leave it NOT_COLLECTED rather than exporting the object.',
      mediaJoinFields: ['Media._id (HMAC)', 'Media.url', 'Media.thumbnailUrl', 'Media.mediumUrl', 'Media.s3Key', 'Media.thumbnailS3Key', 'Media.mediumS3Key', 'Media.filename (metadata, never basename resolution)'],
      fileJoinFields: ['File._id (HMAC)', 'File.url', 'File.filename (private storage key)', 'File.isPrivate', 'File.productionId (HMAC)', 'File.jobId (HMAC)', 'File.projectId (HMAC)', 'File.customerId (HMAC)'],
    },
  };
}

function analyse({ assets, sources, policy, models, unreachable = [], storageSemantics = {} }) {
  const assetPaths = assets.map(a => a.path).sort();
  const refs = new Map(assetPaths.map(p => [p, []]));
  const integrity = [];
  const dynamic = [];
  const external = [];
  const parseProblems = [];
  const sourceOperations = [];
  for (const [file, code] of Object.entries(sources).sort(([a], [b]) => a.localeCompare(b, 'en'))) {
    const result = extractReferences(file, code, new Set(unreachable));
    dynamic.push(...result.dynamic); parseProblems.push(...result.problems); sourceOperations.push(...(result.operations || []));
    for (const r of result.references) {
      const resolved = resolveReference(r.raw, { source: file, form: r.form, assetPaths, policy });
      const evidence = { source: file, form: r.form, context: r.context, provenance: r.provenance };
      if (resolved.status === 'RESOLVED') refs.get(resolved.path).push({ ...evidence, resolvedAssetPath: resolved.path, confidence: resolved.confidence });
      else if (['EXTERNAL_URL_NOT_MAPPED', 'RUNTIME_UPLOAD_NAMESPACE', 'OPERATIONAL_SOURCE_NOT_ASSET', 'INLINE_OR_FRAGMENT'].includes(resolved.status)) external.push({ ...evidence, status: resolved.status, ...(resolved.origin ? { origin: resolved.origin, path: resolved.path } : {}) });
      else integrity.push({ ...evidence, code: resolved.status, ...(resolved.candidate ? { candidate: resolved.candidate } : {}), ...(resolved.matches ? { matches: resolved.matches } : {}), evidenceRole: ['RUNTIME_SOURCE', 'PUBLIC_CONFIGURATION'].includes(r.provenance) ? 'RUNTIME_REFERENCE_REVIEW' : 'NON_RUNTIME_EXAMPLE_OR_COMMENT' });
    }
  }
  const plan = referencePlan(models, sources, policy);
  const protectedMap = new Map(policy.protectedAssets.map(p => [p.path, [p]]));
  for (const file of policy.operationalProtectionSources) for (const p of assetPaths) {
    const configured = refs.get(p).filter(r => r.source === file && ['html-attribute', 'manifest-src'].includes(r.form));
    if (configured.length) protectedMap.set(p, [...(protectedMap.get(p) || []), { path: p, reason: 'Current public entry HTML/PWA icon configuration', evidence: configured }]);
  }
  for (const p of policy.protectedAssets) {
    const a = assets.find(a => a.path === p.path);
    if (!a) integrity.push({ code: 'PROTECTED_ASSET_MISSING', candidate: p.path });
    else if (a.sha256 !== p.sha256) integrity.push({ code: 'PROTECTED_ASSET_CONTENT_CHANGED', candidate: p.path });
  }
  const records = assets.map(a => {
    const evidence = unique(refs.get(a.path));
    const runtime = evidence.filter(e => ['RUNTIME_SOURCE', 'PUBLIC_CONFIGURATION'].includes(e.provenance));
    const code = evidence.filter(e => ['RUNTIME_SOURCE', 'PUBLIC_CONFIGURATION', 'UNREACHABLE_SOURCE', 'OPERATOR_SOURCE'].includes(e.provenance));
    const protection = protectedMap.get(a.path) || [];
    const image = ['image', 'icon', 'video'].includes(a.type);
    const classifications = [ ...(runtime.length ? ['STATICALLY_REFERENCED'] : []), ...(protection.length ? ['PROTECTED'] : []), 'DYNAMIC_REFERENCE_POSSIBLE', 'DATABASE_EVIDENCE_REQUIRED', ...(image ? ['CMS_EVIDENCE_REQUIRED'] : []), 'STORAGE_EVIDENCE_REQUIRED', 'EXTERNAL_CONSUMER_POSSIBLE', ...(!runtime.length && !protection.length || parseProblems.length ? ['UNRESOLVED'] : []) ];
    return {
      ...a,
      publicPath: a.path.startsWith('client/public/') ? '/' + a.path.slice('client/public/'.length) : null,
      referenceEvidence: evidence,
      staticEvidence: { runtimeSites: runtime.length, codeSitesIncludingUnreachableAndOperator: code.length, testsAndDocsOnly: !code.length && evidence.length > 0 },
      buildEvidence: { state: 'NOT_COLLECTED', publicCopyExpected: a.path.startsWith('client/public/'), method: 'Tracked entry HTML/PWA manifest and module imports only; ignored build output is not independent evidence' },
      protection,
      dynamicReferenceSurfaces: { catalog: 'asset-reference-plan.json', sets: ['PUBLIC_PATH_OR_URL', 'MEDIA_FILE_INDIRECTION', ...(image ? ['CMS_FIELDS_AND_OVERRIDES'] : ['BRAND_OR_ATTACHMENT_FIELDS'])], binding: 'POSSIBLE_ONLY; no persisted reference observed' },
      storageRepresentation: ['repository-public-or-source-path', 'origin/CDN URL (mapping required)', 'Media/File indirection or storage copy (unobserved)'],
      classification: CLASSES.filter(c => classifications.includes(c)),
      primaryClassification: protection.length ? 'PROTECTED' : runtime.length ? 'STATICALLY_REFERENCED' : 'UNRESOLVED',
      evidenceCompleteness: { staticRepository: parseProblems.length ? 'PARTIAL_PARSE_GAPS' : 'BOUNDED_ANALYSIS_COMPLETE', database: 'NOT_COLLECTED', cms: 'NOT_COLLECTED', storage: 'NOT_COLLECTED', externalConsumers: 'NOT_COLLECTED', build: 'NOT_COLLECTED', complete: false },
      cleanupBlocker: protection.length ? 'PROTECTED; no deletion authorization' : runtime.length ? 'STATIC_REFERENCE_PRESENT; no deletion authorization' : 'CANDIDATE_PENDING_EVIDENCE; absence of a static reference is not proof of non-use',
      requiredNextEvidence: ['authorized minimized complete DB reference scan + Media/File joins', ...(image ? ['CMS settings/blocks/overrides, including opaque/nested content'] : []), 'owner-approved storage/origin/CDN alias reconciliation', 'external-consumer/archive decision and separate deletion approval'],
      deletionAuthorized: false,
    };
  }).sort((a, b) => a.path.localeCompare(b.path, 'en'));
  const byHash = new Map(), byBase = new Map(), byCase = new Map(), byNormalized = new Map();
  for (const a of records) {
    for (const [map, k] of [[byHash, a.sha256], [byBase, path.posix.basename(a.path).toLowerCase()], [byCase, a.path.toLowerCase()], [byNormalized, a.path.normalize('NFC')]]) map.set(k, [...(map.get(k) || []), a]);
    if (/[\s%#?]/.test(a.path)) integrity.push({ code: 'PATH_REQUIRES_URL_ENCODING', candidate: a.path });
    if (/[\u0000-\u001f\u007f\\]/.test(a.path)) integrity.push({ code: 'MALFORMED_TRACKED_ASSET_NAME', candidate: a.path });
  }
  const duplicateContent = [...byHash].filter(([, a]) => a.length > 1).map(([hash, a]) => ({ sha256: hash, paths: a.map(x => x.path).sort(), bytesPerCopy: a[0].size, duplicateBytes: a[0].size * (a.length - 1), deletionAuthorized: false }));
  const sameBasename = [...byBase].filter(([, a]) => a.length > 1).map(([basename, a]) => ({ basename, paths: a.map(x => x.path).sort(), distinctHashes: new Set(a.map(x => x.sha256)).size }));
  const sameStem = new Map();
  for (const a of records) { const stem = a.path.replace(/\.[^.]+$/, '').toLowerCase(); sameStem.set(stem, [...(sameStem.get(stem) || []), a]); }
  const possibleLegacyVariants = [...sameStem].filter(([, a]) => a.length > 1 && new Set(a.map(x => x.sha256)).size > 1).map(([stem, a]) => ({ stem, paths: a.map(x => x.path).sort(), conclusion: 'DIFFERENT_BYTES; format/visual equivalence not established; no deletion approval' }));
  for (const [, a] of byCase) if (a.length > 1) integrity.push({ code: 'CASE_COLLIDING_TRACKED_PATHS', paths: a.map(x => x.path).sort() });
  for (const [, a] of byNormalized) if (a.length > 1) integrity.push({ code: 'UNICODE_NORMALIZATION_COLLISION', paths: a.map(x => x.path).sort() });
  const total = list => ({ assets: list.length, bytes: list.reduce((n, a) => n + a.size, 0) });
  const publicMedia = records.filter(a => !['font-license', 'static-document'].includes(a.type));
  return {
    schemaVersion: 'expresso.lifecycle.asset-evidence/1',
    policy: 'Repository evidence only. Classifications overlap. No asset is authorized for deletion.',
    scope: policy.scope,
    methodology: { matching: 'Explicit public-root / module-relative paths, lexical constants and statically evaluable templates; no basename-only resolution; external origins never collapsed into local paths', provenance: 'Runtime modules/public config separated from unreachable/operator source, tests, documentation and comments; static declaration is not deployed-use proof', locations: 'Stable source/context anchors instead of line numbers so unrelated line shifts do not stale evidence', build: 'Ignored build/dependency outputs excluded; no build run or remote resource retrieval', dynamic: 'Generic surfaces are possibilities shared by a set, never claims that a specific record references a particular asset' },
    summary: {
      total: total(records), publicMediaFontCompatibilityScope: total(publicMedia),
      staticRuntime: total(records.filter(a => a.staticEvidence.runtimeSites)), staticCodeIncludingUnreachableAndOperator: total(records.filter(a => a.staticEvidence.codeSitesIncludingUnreachableAndOperator)),
      protected: total(records.filter(a => a.protection.length)), withoutRuntimeReference: total(records.filter(a => !a.staticEvidence.runtimeSites)), candidatePendingEvidence: total(records.filter(a => !a.staticEvidence.runtimeSites && !a.protection.length)),
      byClassification: Object.fromEntries(CLASSES.map(c => [c, total(records.filter(a => a.classification.includes(c)))])),
      candidateBytesByClassification: Object.fromEntries(CLASSES.map(c => [c, total(records.filter(a => !a.staticEvidence.runtimeSites && !a.protection.length && a.classification.includes(c)))])),
      byPrimaryClassification: Object.fromEntries(['PROTECTED', 'STATICALLY_REFERENCED', 'UNRESOLVED'].map(c => [c, total(records.filter(a => a.primaryClassification === c))])),
      duplicateContentGroups: duplicateContent.length, duplicateContentBytes: duplicateContent.reduce((n, g) => n + g.duplicateBytes, 0), sameBasenameGroups: sameBasename.length, possibleLegacyVariantGroups: possibleLegacyVariants.length,
      referenceSurfaces: plan.surfaces.length, modelsInventoried: plan.models.length, fieldsInventoried: plan.models.reduce((n, m) => n + m.fields.length, 0),
      integrityFindings: unique(integrity).length, runtimeIntegritySites: unique(integrity.filter(i => i.evidenceRole === 'RUNTIME_REFERENCE_REVIEW')).length, nonRuntimeIntegritySites: unique(integrity.filter(i => i.evidenceRole === 'NON_RUNTIME_EXAMPLE_OR_COMMENT')).length, unresolvedSourceParses: parseProblems.length, deletionAuthorized: 0,
    },
    dynamicSourceEvidence: unique(dynamic), sourceOperationEvidence: unique(sourceOperations), externalOrRuntimeNamespaceReferences: unique(external), unresolvedSourceParses: unique(parseProblems), integrityFindings: unique(integrity),
    duplicates: { exactContent: sort(duplicateContent), sameBasename: sort(sameBasename), possibleLegacyVariants: sort(possibleLegacyVariants) },
    storageSemantics,
    referencePlan: { path: 'asset-reference-plan.json', schemaVersion: plan.schemaVersion, evidenceState: 'NOT_COLLECTED' },
    records,
    _plan: plan,
  };
}

function build(root = ROOT) {
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const tracked = execFileSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], env: { PATH: process.env.PATH } }).split('\0').filter(Boolean).sort();
  const policy = JSON.parse(read('docs/architecture/asset-evidence-policy.json'));
  if (policy.schemaVersion !== 'expresso.lifecycle.asset-policy/1' || policy.deletionAuthorized !== false) throw new Error('unsupported asset policy or deletion authorization');
  const inv = JSON.parse(read('docs/architecture/source-inventory.json'));
  const sources = {};
  // Review-before-commit includes new application modules. Keep the asset set
  // Git-tracked, but inspect current source too, as generate-inventory does.
  // No ignored builds, dependencies, environment files or symlinks are read.
  const sourceFiles = new Set(tracked);
  function collectSource(dir) {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (entry.name.startsWith('.') || ['node_modules', 'build', 'dist', 'coverage'].includes(entry.name)) continue;
      const file = `${dir}/${entry.name}`;
      if (entry.isDirectory()) collectSource(file);
      else if (entry.isFile() && /\.(?:[cm]?[jt]sx?|json|css|scss|sass|less)$/.test(entry.name)) sourceFiles.add(file);
    }
  }
  for (const dir of ['client/src', 'portal-api/src']) collectSource(dir);
  for (const f of [...sourceFiles].sort()) {
    if (!TEXT_EXTENSIONS.has(path.posix.extname(f).toLowerCase()) || SELF.has(f) || /(?:^|\/)(?:node_modules|build|dist|coverage)\/|package-lock\.json$|(?:^|\/)\.env(?:\.|$)/.test(f)) continue;
    if (!fs.lstatSync(path.join(root, f)).isFile()) throw new Error(`reference source is not a regular file: ${f}`);
    sources[f] = read(f);
  }
  const assets = tracked.filter(f => isAsset(f, policy)).map(f => {
    if (!fs.lstatSync(path.join(root, f)).isFile()) throw new Error(`tracked asset is not a regular file: ${f}`);
    const bytes = fs.readFileSync(path.join(root, f));
    return { path: f, size: bytes.length, sha256: sha256(bytes), type: assetType(f) };
  });
  // Inventory mapping cannot silently omit a newly registered tracked model.
  const registered = [];
  for (const [file, code] of Object.entries(sources).filter(([f]) => f.endsWith('.model.js'))) walk(astOf(code, file).program, n => {
    if (n.type === 'CallExpression' && n.callee.property?.name === 'model' && n.arguments.length >= 2 && n.arguments[0]?.type === 'StringLiteral') registered.push(n.arguments[0].value);
  });
  if (ordered([...new Set(registered)].sort()) !== ordered(inv.models.map(m => m.name).sort())) throw new Error('model inventory drift: regenerate source-inventory.json first');
  const semanticFiles = Object.fromEntries(policy.storageEvidenceSources.map(f => [f, digest(cleanAst(astOf(read(f), f).program))]));
  const storage = {
    evidenceSources: policy.storageEvidenceSources,
    evidenceKind: 'CODE_ONLY_NOT_LIVE_CONFIGURATION',
    representations: [
      { kind: 'PUBLIC_PATH', rules: 'Exact case-sensitive path below client/public; relative paths resolved by source context. Query/fragment removed for local comparison only; percent decoding once; traversal, encoded separators and ambiguous case are unresolved.' },
      { kind: 'WEBSITE_OVERRIDE', rules: 'websiteImageRegistry defaultUrl/key -> SiteSettings.websiteImages.images[].key/defaultUrl/url/imageUrl/mediaId; a fallback path in code does not prove which image CMS currently serves.' },
      { kind: 'PUBLIC_OBJECT_OR_UPLOAD_URL', rules: 'Media has original/thumbnail/medium URL and s3Key variants. s3.js can emit S3 URLs or development /uploads paths. Client helpers remap /uploads to API origin. Do not map an arbitrary URL pathname or basename to a repository file.' },
      { kind: 'PRIVATE_OBJECT_KEY', rules: 'File.filename stores a private key when isPrivate=true; ServiceTemplate.files.uploads[].key and JobApplication.cvKey are private keys. privateStorage creates private/ keys; local private uploads are not statically served. Issued URLs are temporary and must never be retained as identity.' },
      { kind: 'MEDIA_FILE_OBJECT_ID', rules: 'Join locally to the complete allowlisted Media/File reference projection using capture-local HMAC identifiers; no customer/user profiles. Media.filename alone cannot identify a repository asset.' },
      { kind: 'SIGNED_OR_CDN_URL', rules: 'Discard credentials/query/fragment before any identity handling; unknown/private locators exported as HMAC only. Origin/CDN/prefix aliases require explicit owner evidence; never guess from suffix or same basename.' },
      { kind: 'NESTED_OR_LEGACY_VALUE', rules: 'Typed nested fields, arrays, Mixed/Object/Map blobs and text/HTML/Markdown require bounded local extraction. Unknown shapes and historical collections remain unresolved, not empty.' },
    ],
    liveStorageOrCmsAccess: false,
  };
  const result = analyse({ assets, sources, policy, models: inv.models, unreachable: inv.unreachableFrontendCandidates, storageSemantics: storage });
  const legacyAssets = assets.filter(a => !['font-license', 'static-document'].includes(a.type));
  const legacyText = Object.entries(sources).filter(([f]) => f.startsWith('client/') || f.startsWith('portal-api/src/')).map(([, code]) => code).join('\n');
  const legacyMatched = legacyAssets.filter(a => legacyText.includes(path.posix.basename(a.path)));
  const legacyNoMatch = legacyAssets.filter(a => !legacyText.includes(path.posix.basename(a.path)));
  result.previousStudyReconciliation = {
    method: 'Compatibility recount: filename substring anywhere in tracked client text (including public HTML/manifest) or API source; includes tests/comments/unreachable declarations, so it is not runtime usage evidence.',
    assets: legacyAssets.length, bytes: legacyAssets.reduce((n, a) => n + a.size, 0), textualBasenameMatches: legacyMatched.length, withoutTextualBasenameMatch: legacyNoMatch.length, withoutTextualBasenameMatchBytes: legacyNoMatch.reduce((n, a) => n + a.size, 0),
    legacySubstringOnlyPaths: legacyMatched.filter(a => !result.records.find(r => r.path === a.path).staticEvidence.runtimeSites).map(a => a.path),
    protectedHomepageWithoutLegacyMatch: policy.protectedAssets.filter(p => p.evidence.commit && legacyNoMatch.some(a => a.path === p.path)).map(p => p.path),
    difference: 'B3 also inventories the font-license companion; strict resolved paths/provenance and basename substring counts measure different evidence. Neither is a deletion decision.',
  };
  result.excludedTrackedAssetLikeFiles = tracked.filter(f => EXTENSIONS.has(path.posix.extname(f).toLowerCase()) && !isAsset(f, policy)).map(f => ({ path: f, reason: policy.scope.excludedOperationalSources.includes(f) ? 'Operational source/configuration, retained as reference input; not a cleanup candidate' : 'Outside deployable public/source asset roots (design screenshots/reference documentation); not a cleanup candidate' }));
  const plan = result._plan; delete result._plan;
  result.provenance = {
    generator: 'docs/architecture/generate-asset-evidence.cjs',
    schemaVersion: 'expresso.lifecycle.asset-evidence/1',
    digests: { generator: sha256(fs.readFileSync(__filename)), policy: digest(policy), assets: digest(assets), referenceEvidence: digest({ records: result.records.map(a => [a.path, a.referenceEvidence]), dynamic: result.dynamicSourceEvidence, assetOperations: result.sourceOperationEvidence, external: result.externalOrRuntimeNamespaceReferences, integrity: result.integrityFindings, parseGaps: result.unresolvedSourceParses }), modelFields: digest(plan.models), storageSemantics: digest(semanticFiles) },
    method: 'No timestamp/HEAD id. Git-tracked assets plus current application source (including uncommitted modules), semantic references, all schema field shapes and storage-code AST digests. Unrelated source text/comments/line shifts without reference evidence do not change outputs.',
    excludedDerivedSources: [...SELF].sort(),
  };
  plan.provenance = { generator: result.provenance.generator, modelFields: result.provenance.digests.modelFields, policy: result.provenance.digests.policy, storageSemantics: semanticFiles };
  result.referencePlan.digest = digest(plan);
  return { register: result, plan, report: renderReport(result, plan) };
}
const mib = bytes => (bytes / 1048576).toFixed(2);
const md = value => String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
function renderReport(register, plan) {
  const s = register.summary;
  const compatibility = register.previousStudyReconciliation;
  const table = rows => rows.map(r => `| ${r.map(md).join(' | ')} |`).join('\n');
  const protections = register.records.filter(a => a.protection.length);
  const issues = register.integrityFindings;
  return `# R5-B3 — asset reconciliation evidence\n\nStatus: **CLOSED — offline evidence foundation**. [Blueprint closure](BLUEPRINT-CLOSURE.md) is authoritative. Asset cleanup, legacy Production retirement, evidence-dependent endpoint retirement and persisted cleanup are DEFERRED; no such operation is authorized. No asset is authorized for deletion. This B3 report uses repository evidence only; no real database/CMS/storage/deployed API/log evidence was collected.\n\nGenerated offline by \`node docs/architecture/generate-asset-evidence.cjs\`; freshness: \`node docs/architecture/generate-asset-evidence.cjs --check\`. Sources: [asset register](asset-evidence.json), [complete field inventory/capture plan](asset-reference-plan.json), [reviewed policy](asset-evidence-policy.json), [evidence procedure](ASSET-EVIDENCE-PLAN.md).\n\n## Scope and totals\n\nPublic/source asset roots and supported media/font/document extensions are explicit in policy. Ordinary source/configuration, dependencies and ignored builds are not cleanup candidates. The ${register.excludedTrackedAssetLikeFiles.length} tracked files with supported asset extensions excluded by policy are operational text or reference documentation/design files outside deployable roots; their exact paths and exclusion reasons are recorded in the JSON. Entry HTML/PWA configuration is reference evidence, not a removable asset. The Barlow font license is a separately protected companion. No in-scope tracked video/audio/downloadable binary documents currently exist.\n\n| Measure | Assets | Bytes | MiB |\n|---|---:|---:|---:|\n${table([['B3 total',s.total.assets,s.total.bytes,mib(s.total.bytes)],['Historical media/font scope',compatibility.assets,compatibility.bytes,mib(compatibility.bytes)],['Historical basename/text comparison',compatibility.textualBasenameMatches,'—','—'],['Historical without basename/text match',compatibility.withoutTextualBasenameMatch,compatibility.withoutTextualBasenameMatchBytes,mib(compatibility.withoutTextualBasenameMatchBytes)],['Resolved runtime-module/public-config references',s.staticRuntime.assets,s.staticRuntime.bytes,mib(s.staticRuntime.bytes)],['Resolved code incl. unreachable/operator',s.staticCodeIncludingUnreachableAndOperator.assets,s.staticCodeIncludingUnreachableAndOperator.bytes,mib(s.staticCodeIncludingUnreachableAndOperator.bytes)],['Protected',s.protected.assets,s.protected.bytes,mib(s.protected.bytes)],['Candidate pending evidence (no runtime reference/protection)',s.candidatePendingEvidence.assets,s.candidatePendingEvidence.bytes,mib(s.candidatePendingEvidence.bytes)]])}\n\nThe prior 325/180/145 count is ${compatibility.assets === 325 && compatibility.textualBasenameMatches === 180 && compatibility.withoutTextualBasenameMatch === 145 ? 'reproduced' : 'not reproduced'} by its coarse filename-substring comparison. The four W4 homepage assets are still protected independently of that detector; subtracting them leaves ${compatibility.withoutTextualBasenameMatch - compatibility.protectedHomepageWithoutLegacyMatch.length} historical candidates, with no deletion authority. B3's extra font license and stricter path/provenance rules explain its different totals. Coarse substring-only matches without resolved runtime evidence: ${compatibility.legacySubstringOnlyPaths.join(', ') || 'none'}. These are not silently counted as references. A declaration in a reachable module is static evidence, not proof of current rendered/deployed use.\n\n## Classifications and candidate bytes\n\nClassifications overlap; byte columns must not be summed across rows. Primary classifications are mutually exclusive and available in the JSON summary. Every record has deletionAuthorized=false and complete=false. Dynamic surface sets denote possible binding, never an observed database relationship.\n\n| Classification | All assets | All bytes | Candidate assets | Candidate bytes |\n|---|---:|---:|---:|---:|\n${table(Object.entries(s.byClassification).map(([c,v])=>[c,v.assets,v.bytes,s.candidateBytesByClassification[c].assets,s.candidateBytesByClassification[c].bytes]))}\n\n## Protected paths\n\n| Path | Evidence / reason |\n|---|---|\n${table(protections.map(a=>[a.path,a.protection.map(p=>p.reason).join('; ')]))}\n\nThe four homepage paths and exact bytes were confirmed against W4 commit 3d0fd785 and its roadmap content-entry instruction. Public entry HTML/PWA icon references protect only existing configured assets; missing configured assets are integrity findings. The font license remains with the retained font package. Protection is not expanded to every static declaration.\n\n## Reference method and gaps\n\nAssets remain Git-tracked. Reference inputs include tracked text plus current application source below client/src and portal-api/src, including review-before-commit modules; ignored builds, dependencies, hidden files and symlinks are excluded from that source walk. This keeps offline evidence consistent with source-inventory.json without staging files.\n\nJS/JSX/TS/TSX are parsed without execution; lexical constants, concatenations and resolvable templates, imports/require, JSX/HTML attributes, CSS URLs, JSON values and Markdown links are normalized. Bare names resolve only to an exact public-root path under a documented convention; nested assets are never matched by basename. Tests, comments, documentation, unreachable modules and operator sources have separate provenance. Stable source/context anchors avoid unrelated line-number churn. Public URLs can be used by bookmarks, search, emails, social links, external websites or CDNs even with no repository reference. External origins never become local paths without an approved alias map. No ignored build is counted as independent evidence; tracked entry configuration/imports describe expected build behavior only.\n\nThere are ${register.dynamicSourceEvidence.length} dynamic source sites and ${register.unresolvedSourceParses.length} unresolved source parses. Finite computed paths, cross-module values, generated content and opaque runtime values can exceed this bounded static analysis. No absence conclusion is permitted.\n\n## Integrity (separate from unused candidates)\n\nFindings describe repository resolution, not a proven deployed 404. Runtime upload namespaces and unmapped external URLs are separately retained in JSON. No repair was made.\n\n| Code | Provenance | Source | Candidate / context |\n|---|---|---|---|\n${table(issues.map(i=>[i.code,i.provenance||'TRACKED_ASSET',i.source||'tracked asset',i.candidate||i.paths?.join(', ')||i.context||'unresolved']))}\n\n## Duplicate evidence\n\nExact duplicate groups: **${s.duplicateContentGroups}**; repeated bytes after one copy per group: **${s.duplicateContentBytes}**. Same-basename groups: **${s.sameBasenameGroups}**. Same-stem/different-format-or-bytes groups: **${s.possibleLegacyVariantGroups}** (not proof of visual equivalence). Neither duplication nor a smaller representation authorizes consolidation/deletion. All exact groups, hashes and paths are in the JSON.\n\n| Exact duplicate paths | Bytes per copy |\n|---|---:|\n${table(register.duplicates.exactContent.map(g=>[g.paths.join(' ; '),g.bytesPerCopy]))}\n\n## Persisted field inventory and future capture\n\nAll **${s.modelsInventoried} models**, **${s.fieldsInventoried} schema leaf fields** and **${s.referenceSurfaces} selected reference/context surfaces** are inventoried in asset-reference-plan.json. SiteSettings helper-returned image URL/Media fields are expanded. Generic Mixed/Object/Map values, arrays, rich text/HTML/Markdown and unknown legacy fields require bounded local token extraction; never export complete documents or raw blobs. Each selected surface defines its expected type, normalization, target kind, nesting, rich-text requirement, context and sanitized unresolved reporting. No future capture command is implemented or authorized by B3.\n\n| Model / collection | Exact fields requiring later evidence |\n|---|---|\n${table(plan.models.map(m=>[m.model+' / '+m.collection,plan.surfaces.filter(f=>f.model===m.model).map(f=>f.fieldPath).join('; ')||'No currently identified asset-bearing field; schema inventory retained for drift detection']))}\n\nProduction.coverMedia/gallery, File.productionId and Job.productionId remain legacy ownership evidence requiring B4 and real-data approval. Production models/routes/permissions/assets are untouched. Additional current surfaces include Enrollment scope URLs/instructions, Ticket comments.eventMeta, Audit.meta, and CRM/content text/URLs. Private CV/application and customer/user references must be minimized locally; output matched known repository paths or HMAC handles, never names/emails, raw private keys or signed URL queries.\n\n## Deferred follow-up\n\nThis offline foundation is closed. Only if later prioritized and separately authorized, consider a minimized read-only capture of the listed fields and Media/File joins in an explicitly approved environment. Reconcile storage/CDN aliases and obtain an external-consumer/archive decision. All asset deletion remains unauthorized until complete evidence and explicit separate approval. B4, C2+, D4/D5, R5-E, Operating Model and Portal Implementation are not started here.\n`;
}
function checkOutputs(built, root = ROOT) {
  const values = [JSON.stringify(built.register, null, 2) + '\n', JSON.stringify(built.plan, null, 2) + '\n', built.report];
  return OUTPUTS.filter((f, i) => !fs.existsSync(path.join(root, 'docs/architecture', f)) || fs.readFileSync(path.join(root, 'docs/architecture', f), 'utf8') !== values[i]);
}
function main(argv) {
  if (argv.some(a => a !== '--check') || argv.length > 1) throw new Error('Usage: node docs/architecture/generate-asset-evidence.cjs [--check]');
  const built = build();
  const values = [JSON.stringify(built.register, null, 2) + '\n', JSON.stringify(built.plan, null, 2) + '\n', built.report];
  if (argv.includes('--check')) {
    const stale = checkOutputs(built);
    if (stale.length) throw new Error(`asset evidence is stale: ${stale.join(', ')}; run node docs/architecture/generate-asset-evidence.cjs`);
  } else OUTPUTS.forEach((f, i) => fs.writeFileSync(path.join(ROOT, 'docs/architecture', f), values[i]));
  console.log(JSON.stringify(built.register.summary, null, 2));
}
module.exports = { build, analyse, extractReferences, resolveReference, schemaInventory, referencePlan, renderReport, checkOutputs, isAsset, assetType, digest, OUTPUTS, CLASSES };
if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(`asset-evidence: ${error.message}`); process.exitCode = 1; }
}
