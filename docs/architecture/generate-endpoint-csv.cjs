#!/usr/bin/env node
// Regenerates docs/qc/API_ENDPOINT_COVERAGE_COMPLETE.csv from source-inventory.json
// (REMEDIATION-PLAN P3-9). Rows are matched to existing rows by method + path:
//   - matched rows keep their ID, module, screen, test design, priority and all
//     QC columns (QC Status, Actual Result, Defect ID / Notes); the code-derived
//     columns (Auth / Guard, Required Permission, Source File) are refreshed;
//   - endpoints new in the code get the next IDs, code-derived columns only and
//     "Not Run" (test design columns are left blank for QC to write);
//   - rows whose endpoint no longer exists in the code are dropped and listed.
// Usage: node docs/architecture/generate-endpoint-csv.cjs [--check]
'use strict';
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const csvPath = path.resolve(dir, '../qc/API_ENDPOINT_COVERAGE_COMPLETE.csv');
const inv = JSON.parse(fs.readFileSync(path.join(dir, 'source-inventory.json'), 'utf8'));

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || r[0] !== '');
}
const cell = (v) => (/[",\r\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

const GUARD_LABELS = {
  requireAuth: 'Auth token',
  optionalAuth: 'Optional auth token',
  requireInternalUser: 'Internal user',
  requireStaffOrApprovedVendor: 'Internal user or approved vendor',
  requireApprovedVendor: 'Approved vendor',
};
function codeColumns(route) {
  const labels = [
    ...route.globalGuards.map((g) => (typeof g === 'string' ? g : g.label)),
    ...route.handlers.slice(0, -1).map((h) => h.label),
  ];
  const guards = [];
  const perms = [];
  for (const l of labels) {
    const name = l.replace(/\(.*$/s, '');
    const args = [...l.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    if (name === 'requirePermission') perms.push(...args);
    else if (name === 'requireAnyPermission') perms.push(args.join(' or '));
    else if (GUARD_LABELS[name]) guards.push(GUARD_LABELS[name]);
    else if (name === 'requireRole') guards.push(`Role: ${args.join(', ')}`);
    else if (/upload/i.test(name)) guards.push('Multipart upload');
    else guards.push(name);
  }
  const unique = [...new Set(guards)];
  const authenticated = unique.some((g) => g !== 'Multipart upload' && g !== 'Optional auth token');
  return {
    'Auth / Guard': unique.length ? unique.join(', ') : 'None',
    'Required Permission': perms.length ? perms.join(' + ') : authenticated ? 'Authenticated' : 'Public',
    'Source File': route.file,
  };
}

const [header, ...body] = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const existing = body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
const key = (m, p) => `${String(m).toUpperCase()} ${String(p).replace(/\/+$/, '')}`;
const routes = new Map(inv.apiRoutes.map((r) => [key(r.method, r.path), r]));

// Module name for a new row: the module already used for that route file, else the API domain.
const moduleByFile = new Map();
for (const r of existing) if (!moduleByFile.has(r['Source File'])) moduleByFile.set(r['Source File'], r['Business Module']);

const out = [];
const dropped = [];
const seen = new Set();
for (const r of existing) {
  const k = key(r.Method, r.Path);
  const route = routes.get(k);
  if (!route) { dropped.push(`${r['Endpoint ID']} ${k}`); continue; }
  seen.add(k);
  out.push({ ...r, ...codeColumns(route) });
}
let next = Math.max(0, ...existing.map((r) => Number(String(r['Endpoint ID']).replace(/\D/g, '')) || 0)) + 1;
const added = [];
for (const route of inv.apiRoutes) {
  const k = key(route.method, route.path);
  if (seen.has(k)) continue;
  seen.add(k);
  const row = Object.fromEntries(header.map((h) => [h, '']));
  Object.assign(row, {
    'Endpoint ID': `API-${String(next++).padStart(3, '0')}`,
    'Business Module': moduleByFile.get(route.file) || route.domain,
    Method: route.method.toUpperCase(),
    Path: route.path,
    ...codeColumns(route),
    'QC Status': 'Not Run',
  });
  added.push(`${row['Endpoint ID']} ${k}`);
  out.push(row);
}

const text = [header, ...out.map((r) => header.map((h) => r[h] ?? ''))].map((r) => r.map(cell).join(',')).join('\n') + '\n';
if (process.argv.includes('--check')) {
  if (fs.readFileSync(csvPath, 'utf8') !== text) { console.error('API_ENDPOINT_COVERAGE_COMPLETE.csv is stale: run node docs/architecture/generate-endpoint-csv.cjs'); process.exit(1); }
  console.log(`endpoint CSV current (${out.length} endpoints)`);
} else {
  fs.writeFileSync(csvPath, text);
  console.log(`endpoints: ${out.length} (kept ${out.length - added.length}, added ${added.length}, dropped ${dropped.length})`);
  if (added.length) console.log(`added:\n  ${added.join('\n  ')}`);
  if (dropped.length) console.log(`dropped:\n  ${dropped.join('\n  ')}`);
}
