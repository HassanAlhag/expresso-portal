/* Documentation validator. Read-only: checks the architecture docs against the
 * source inventory. Never imports the application, reads .env or opens a DB.
 * Run from the repository root:  node docs/architecture/validate.cjs */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const dir = __dirname;
const fail = [];
const ok = (cond, msg) => { if (!cond) fail.push(msg); };
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');

// 1. Inventory is fresh against the current source.
try {
  execFileSync(process.execPath, [path.join(dir, 'generate-inventory.cjs'), '--check'], { stdio: 'pipe' });
} catch (e) { fail.push('source-inventory.json is stale: run node docs/architecture/generate-inventory.cjs'); }
// 1b. Endpoint evidence register (R5-C1) is fresh against the same source.
try {
  execFileSync(process.execPath, [path.join(dir, 'generate-endpoint-evidence.cjs'), '--check'], { stdio: 'pipe' });
} catch (e) { fail.push('endpoint-evidence.json is stale: run node docs/architecture/generate-endpoint-evidence.cjs'); }
// 1c. R5-B3 asset evidence is offline and must track asset/reference/schema drift.
try {
  execFileSync(process.execPath, [path.join(dir, 'generate-asset-evidence.cjs'), '--check'], { stdio: 'pipe', env: { PATH: process.env.PATH } });
} catch { fail.push('asset evidence is stale: run node docs/architecture/generate-asset-evidence.cjs'); }
const inv = JSON.parse(read('source-inventory.json'));
const c = inv.counts;

// 2. Required deliverables exist.
const required = ['README.md', 'SYSTEM-ARCHITECTURE.md', 'PUBLIC-WEBSITE-MAP.md', 'PORTAL-MODULE-MAP.md', 'DATABASE-MAP.md',
  'RBAC-MAP.md', 'API-MAP.md', 'API-ENDPOINTS.md', 'USER-FLOWS.md', 'CODE-CLEANUP-AUDIT.md', 'DATABASE-RESET-PLAN.md',
  'EXPRESSO-SYSTEM-BLUEPRINT.html', 'collection-classification.json', 'module-catalog.json', 'REMEDIATION-PLAN.md', 'ASSET-RECONCILIATION-B3.md', 'ASSET-EVIDENCE-PLAN.md'];
for (const f of required) ok(fs.existsSync(path.join(dir, f)), `missing ${f}`);

// 3. Headline counts quoted in the summary match the code.
const readme = read('README.md');
for (const [label, n] of [['portal feature areas', c.portalFeatureAreas], ['backend domains', c.backendDomains],
  ['routers', c.mountedRouters], ['routes', c.apiRoutes], ['roles', c.defaultRoles], ['API keys', c.permissionKeys]])
  ok(readme.includes(`**${n}**`), `README does not state ${label} = ${n}`);
ok(readme.includes(`**${c.models} / ${c.models}**`), `README does not state ${c.models} models`);
// Since R2 the API catalog is the only one: the portal must not ship its own copy.
ok(c.frontendCatalogKeys === 0, 'a frontend copy of the permission catalog has reappeared (client/src/portal/config/permissions.js)');
const modules = JSON.parse(read('module-catalog.json')).modules;
ok(modules.length === c.portalFeatureAreas, `module-catalog has ${modules.length} modules, expected ${c.portalFeatureAreas}`);

// 4. Every model is classified exactly once, and totals agree with the database map and reset plan.
const cls = JSON.parse(read('collection-classification.json'));
const names = inv.models.map((m) => m.name).sort();
ok(JSON.stringify(Object.keys(cls).sort()) === JSON.stringify(names), 'collection-classification.json does not cover exactly the registered models');
const totals = {};
Object.values(cls).forEach((v) => (totals[v] = (totals[v] || 0) + 1));
const dbmap = read('DATABASE-MAP.md');
for (const [k, n] of Object.entries(totals)) {
  ok(dbmap.includes(`**${k}: ${n}**`), `DATABASE-MAP totals disagree for ${k} (${n})`);
  ok(new RegExp(`\\| ${k.replace('/', '\\/')} \\| ${n} \\|`).test(read('DATABASE-RESET-PLAN.md')), `DATABASE-RESET-PLAN totals disagree for ${k} (${n})`);
}
for (const m of inv.models) ok(new RegExp(`\\| ${m.name} → \`${m.collection}\` \\| ${cls[m.name].replace('/', '\\/')} \\|`).test(dbmap), `DATABASE-MAP row missing or misclassified: ${m.name}`);
ok(readme.includes(`${totals.SYSTEM} SYSTEM`) && readme.includes(`${totals.BUSINESS} BUSINESS`), 'README classification totals are stale');

// 5. Endpoint index lists every route once.
const rows = read('API-ENDPOINTS.md').split('\n').filter((l) => /^\| (GET|POST|PUT|PATCH|DELETE) \|/.test(l));
ok(rows.length === c.apiRoutes, `API-ENDPOINTS.md lists ${rows.length} routes, expected ${c.apiRoutes}`);
for (const r of inv.apiRoutes) ok(rows.some((l) => l.startsWith(`| ${r.method} | \`${r.path}\` |`)), `API-ENDPOINTS.md missing ${r.method} ${r.path}`);

// 6. Relative links in markdown resolve.
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md'))) {
  for (const m of read(f).matchAll(/\]\(([^)#\s]+)(#[^)]*)?\)/g)) {
    if (/^[a-z]+:/i.test(m[1])) continue;
    ok(fs.existsSync(path.resolve(dir, m[1])), `${f}: broken link ${m[1]}`);
  }
}

// 7. Blueprint works offline and carries the current counts.
const html = read('EXPRESSO-SYSTEM-BLUEPRINT.html');
ok(!/<(script|link|img|iframe)[^>]+(src|href)=["']https?:/i.test(html), 'blueprint loads an external resource');
ok(!/url\(["']?https?:/i.test(html), 'blueprint CSS references an external URL');
const data = JSON.parse(html.match(/<script type="application\/json" id="data">([\s\S]*?)<\/script>/)[1]);
ok(JSON.stringify(data.counts) === JSON.stringify(c), 'blueprint counts differ from the inventory');
ok(data.models.length === c.models, 'blueprint model list incomplete');
ok(data.tiles.reduce((s, t) => s + t.routes, 0) + data.opsRoutes.length === c.apiRoutes, 'blueprint route totals do not add up');
for (const m of data.models) ok(m.cls === cls[m.name], `blueprint class for ${m.name} differs`);
for (const href of [...html.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1])) ok(fs.existsSync(path.join(dir, href)), `blueprint links to missing ${href}`);

// 8. Every blueprint element carries one lifecycle status, and every remediation ID it cites exists in the plan.
const LIFE = ['CURRENT', 'NEEDS FIX', 'PLANNED', 'FUTURE'];
const plan = read('REMEDIATION-PLAN.md');
const planIds = new Set([...plan.matchAll(/^\| (P[0-4]-\d+) \|/gm)].map((m) => m[1]));
for (const id of [...data.tiles.map((t) => t.id), ...data.surfaces.map((s) => s.id), ...data.external.map((e) => e.id), 'rbac', 'mongodb', 'storage'])
  ok(LIFE.includes(data.life[id]), `blueprint element ${id} has no lifecycle status`);
for (const L of data.target) for (const it of L.items) {
  ok(LIFE.includes(it.life), `target item ${it.name} has an invalid status`);
  ok(it.life !== 'CURRENT' || it.today !== '—', `target item ${it.name} is CURRENT but describes nothing existing`);
}
for (const f of data.flows) ok(LIFE.includes(f.life), `flow ${f.name} has no lifecycle status`);
const cited = new Set([...Object.values(data.fixes).flat(), ...data.target.flatMap((L) => L.items.flatMap((i) => i.fixes)), ...data.flows.flatMap((f) => f.fixes)]);
for (const id of cited) ok(planIds.has(id) && data.rem[id], `blueprint cites ${id}, which is not in REMEDIATION-PLAN.md`);
ok(html.includes('id="view-current"') && html.includes('id="view-target"'), 'blueprint must keep separate current and target views');

// 9. The QC endpoint sheet (P3-9) covers exactly the routes in the code.
{
  try {
    execFileSync(process.execPath, [path.join(dir, 'generate-endpoint-csv.cjs'), '--check'], { stdio: 'pipe' });
  } catch (e) { fail.push('docs/qc/API_ENDPOINT_COVERAGE_COMPLETE.csv is stale: run node docs/architecture/generate-endpoint-csv.cjs'); }
}

// 10. No credentials in the documentation.
const secretish = /(mongodb(\+srv)?:\/\/[^\s`<"]+@|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|(?:SMTP_PASS|JWT_SECRET|AWS_SECRET_ACCESS_KEY|SUPER_ADMIN_PASSWORD)\s*=\s*\S+)/;
for (const f of fs.readdirSync(dir).filter((x) => /\.(md|html|json)$/.test(x))) ok(!secretish.test(read(f)), `${f} contains something that looks like a credential`);

// 11. Job statuses (P3-7, R4-D). The API's JOB_STATUSES is authoritative; the
// client is deployed separately and keeps its own copies, so they are compared
// here (read-only, no application import): every API status has a Jobs board
// column and a client label, and the client names no status the API lacks.
// The staff dashboard summary and the Productions pages are intentionally not
// checked (different presentation / Jobs-Productions migration).
{
  const vm = require('node:vm');
  const repo = path.resolve(dir, '../..');
  const load = (rel, names) => {
    const src = fs.readFileSync(path.join(repo, rel), 'utf8');
    if (/^\s*import\s/m.test(src)) { fail.push(`${rel} now has imports; update the job status check`); return {}; }
    try { return vm.runInNewContext(`${src.replace(/^export\s+/gm, '')}\n;({ ${names.join(', ')} })`, {}); }
    catch (e) { fail.push(`${rel} could not be read for the job status check: ${e.message}`); return {}; }
  };
  const api = load('portal-api/src/modules/content/jobs/job.constants.js', ['JOB_STATUSES']);
  const board = load('client/src/portal/features/jobs/pipeline.js', ['STATUS_TO_COLUMN', 'JOB_STAGES']);
  const labels = load('client/src/portal/features/jobs/constants.js', ['JOB_STATUSES']);
  if (api.JOB_STATUSES && board.STATUS_TO_COLUMN && labels.JOB_STATUSES) {
    const statuses = new Set(api.JOB_STATUSES);
    const columns = new Map(board.JOB_STAGES.map((st) => [st.key, st]));
    for (const st of statuses) {
      ok(Object.prototype.hasOwnProperty.call(board.STATUS_TO_COLUMN, st), `job status ${st} has no Jobs board column (pipeline.js)`);
      ok(board.JOB_STAGES.filter((c) => c.statuses.includes(st)).length === 1, `job status ${st} is not in exactly one JOB_STAGES column`);
      ok(labels.JOB_STATUSES.some((o) => o.value === st), `job status ${st} has no client label (jobs/constants.js)`);
    }
    for (const [st, col] of Object.entries(board.STATUS_TO_COLUMN)) {
      ok(statuses.has(st), `pipeline.js maps ${st}, which is not an API job status`);
      ok(columns.has(col) && columns.get(col).statuses.includes(st), `pipeline.js maps ${st} to ${col}, but that column does not list it`);
    }
    for (const c of board.JOB_STAGES) ok(statuses.has(c.moveStatus) && board.STATUS_TO_COLUMN[c.moveStatus] === c.key, `board column ${c.key} moves jobs to a status outside it`);
    for (const o of labels.JOB_STATUSES) ok(o.value === '' || statuses.has(o.value), `client job status label ${o.value} is not an API job status`);
  }
  // The old dashboard copy of the stages (P3-7) stays gone.
  const dash = fs.readFileSync(path.join(repo, 'client/src/portal/features/dashboard/pages/DashboardPage.jsx'), 'utf8');
  ok(!/\bconst STAGES\s*=/.test(dash), 'DashboardPage.jsx defines its own job STAGES again');
}

if (fail.length) { console.error('FAILED\n- ' + fail.join('\n- ')); process.exit(1); }
console.log(`OK: ${required.length} documents, ${c.apiRoutes} routes, ${c.models} models (${Object.entries(totals).map(([k, n]) => `${k} ${n}`).join(', ')}), blueprint offline.`);
