// R5-B3 offline fixtures only. No database/storage/application imports.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const require = createRequire(import.meta.url);
const tool = require('../../docs/architecture/generate-asset-evidence.cjs');
const policy = {
  scope: { publicRoots: ['client/public'], sourceAssetRoots: ['client/src/assets'], fontLicensePaths: [] },
  protectedAssets: [], operationalProtectionSources: ['client/public/index.html', 'client/public/manifest.json'],
  referencePlan: { cmsModels: ['SiteSettings'], richTextFields: ['body', 'description', 'notes'] },
};
const asset = (p, contents = p) => ({ path: p, size: Buffer.byteLength(contents), sha256: tool.digest(contents), type: tool.assetType(p) });
const assets = [asset('client/public/one.png'), asset('client/public/nested/two.webp'), asset('client/public/Some Image.png'), asset('client/src/assets/mark.svg')];
const resolve = (value, source = 'client/src/Page.jsx', form = 'literal', items = assets) => tool.resolveReference(value, { source, form, assetPaths: items.map(a => a.path), policy });
const analyse = (sources = {}, items = assets, p = policy, models = []) => tool.analyse({ assets: items, sources, policy: p, models });
const codes = report => report.integrityFindings.map(i => i.code);

test('B3 scope: public downloadable text and font licenses are assets; source/config/build/dependency files are not candidates', () => {
  const p = { ...policy, scope: { ...policy.scope, excludedOperationalSources: ['client/public/robots.txt'] } };
  assert.equal(tool.isAsset('client/public/brochure.txt', p), true);
  assert.equal(tool.assetType('client/public/brochure.txt'), 'static-document');
  assert.equal(tool.assetType('client/public/Barlow/OFL.txt'), 'font-license');
  assert.equal(tool.isAsset('client/public/robots.txt', p), false);
  for (const f of ['client/src/Page.jsx','client/build/one.png','node_modules/pkg/one.png','docs/design/one.png']) assert.equal(tool.isAsset(f,p),false);
});
test('B3 paths: public root, nested exact path, module import, CSS relative, encoded space and query/fragment normalization', () => {
  assert.equal(resolve('/one.png').path, 'client/public/one.png');
  assert.equal(resolve('nested/two.webp').path, 'client/public/nested/two.webp');
  assert.equal(resolve('../assets/mark.svg', 'client/src/pages/Page.jsx', 'import').path, 'client/src/assets/mark.svg');
  assert.equal(resolve('../one.png', 'client/public/css/site.css', 'css-url').path, 'client/public/one.png');
  assert.equal(resolve('%PUBLIC_URL%/Some%20Image.png?cache=1#x').path, 'client/public/Some Image.png');
});
test('B3 paths: basename collisions never bind nested assets; case mismatches are findings, never silent repairs', () => {
  const items = [asset('client/public/a/logo.png'), asset('client/public/b/logo.png')];
  assert.equal(resolve('logo.png', undefined, undefined, items).status, 'NOT_IN_TRACKED_ASSETS');
  assert.equal(resolve('/ONE.PNG').status, 'CASE_MISMATCH');
  const r = analyse({}, items);
  assert.equal(r.duplicates.sameBasename[0].distinctHashes, 2);
  assert.equal(r.duplicates.sameBasename[0].paths.length, 2);
});
test('B3 paths: reject escapes, malformed percent encodings, encoded separators, backslashes and credential URLs', () => {
  assert.equal(resolve('../../private.png', 'client/public/site.css', 'css-url').status, 'PATH_OUTSIDE_ASSET_ROOT');
  assert.equal(resolve('/../public/one.png').status, 'PATH_OUTSIDE_ASSET_ROOT');
  assert.equal(resolve('/%2e%2e/public/one.png').status, 'PATH_OUTSIDE_ASSET_ROOT');
  assert.equal(resolve('/nested%2ftwo.webp').status, 'ENCODED_SEPARATOR_OR_NUL');
  assert.equal(resolve('/%zz.png').status, 'MALFORMED_PERCENT_ENCODING');
  assert.equal(resolve('nested\\two.webp').status, 'MALFORMED_PATH');
  assert.equal(resolve('https://synthetic:sentinel@example.test/one.png').status, 'CREDENTIAL_URL_REFUSED');
});
test('B3 paths: external/CDN URLs and upload namespaces cannot become local references by suffix', () => {
  assert.equal(resolve('https://cdn.example.test/one.png?sig=sentinel').status, 'EXTERNAL_URL_NOT_MAPPED');
  assert.equal(resolve('/uploads/one.png').status, 'RUNTIME_UPLOAD_NAMESPACE');
  assert.equal(resolve('data:image/png;base64,AA').status, 'INLINE_OR_FRAGMENT');
  const r = analyse({ 'client/src/Page.jsx': 'const image = "https://cdn.example.test/one.png?sig=sentinel";' });
  assert.equal(r.records[0].staticEvidence.runtimeSites, 0);
  assert.equal(JSON.stringify(r).includes('sentinel'), false, 'query strings never retained');
});
test('B3 JS/JSX: imports, require, object values, lexical constants, concatenations and resolvable templates', () => {
  const code = 'import m from "./assets/mark.svg"; const root="/nested/"; const name="two"; const x={src:root+name+".webp"}; const r=require("./assets/mark.svg"); const image=`/nested/${name}.webp`; const ui=<img src={image}/>;';
  const refs = tool.extractReferences('client/src/Page.jsx', code).references;
  assert.ok(refs.some(r => r.form === 'import'));
  assert.ok(refs.some(r => r.form === 'require'));
  assert.ok(refs.some(r => r.raw === '/nested/two.webp' && r.form === 'static-expression'));
  assert.ok(refs.some(r => r.raw === '/nested/two.webp' && r.form === 'jsx-attribute'));
  assert.ok(tool.extractReferences('client/src/Page.jsx', 'const style={backgroundImage:"url(/one.png)"};').references.some(r => r.raw === '/one.png' && r.form === 'css-url'));
});
test('B3 lexical values: a shadowing parameter is dynamic, never substituted with an unrelated module constant', () => {
  const result = tool.extractReferences('client/src/Page.jsx', 'const name="one"; function Page(name) { return <img src={`/${name}.png`}/>; }');
  assert.ok(result.dynamic.some(d => d.form === 'jsx-dynamic'));
  assert.equal(result.references.some(r => r.raw === '/one.png'), false);
  const destructured = tool.extractReferences('client/src/Page.jsx', 'const name="one";function Page({name}){return <img src={`/${name}.png`}/>;}');
  assert.equal(destructured.references.some(r => r.raw === '/one.png'), false);
  const mutable = tool.extractReferences('client/src/Page.jsx', 'let name="one";name="two";const ui=<img src={`/${name}.png`}/>;');
  assert.equal(mutable.references.some(r => r.raw === '/one.png'), false);
});
test('B3 TS/TSX and srcSet: statically resolvable attributes are parsed without importing code', () => {
  const result = tool.extractReferences('client/src/Page.tsx', 'const image: string="/one.png"; const ui=<img src={image} srcSet="/one.png 1x, /nested/two.webp 2x"/>;');
  assert.equal(result.problems.length, 0);
  assert.ok(result.references.some(r => r.raw === '/one.png'));
  assert.ok(result.references.some(r => r.raw === '/nested/two.webp'));
});
test('B3 CSS/HTML/JSON/Markdown: relative URLs, attributes and content values normalize by their source context', () => {
  assert.ok(tool.extractReferences('client/public/styles/site.css', 'a{background:url("../one.png")}').references.some(r => r.form === 'css-url'));
  assert.ok(tool.extractReferences('client/public/index.html', '<img src="one.png"><a href="/nested/two.webp">x</a>').references.length >= 2);
  assert.ok(tool.extractReferences('client/public/manifest.json', '{"icons":[{"src":"one.png"}]}').references.some(r => r.form === 'manifest-src'));
  assert.ok(tool.extractReferences('docs/example.md', '![image](../client/public/one.png)').references.some(r => r.provenance === 'DOCUMENTATION'));
});
test('B3 configuration: YAML scalars and XML asset values are recorded; aliases/interpolation remain dynamic', () => {
  const yaml = tool.extractReferences('client/config.yml', 'image: /one.png\nhero: ${IMAGE}/two.webp\nother: *assetAlias');
  assert.ok(yaml.references.some(r => r.raw === '/one.png'));
  assert.ok(yaml.dynamic.some(r => r.form === 'yaml-dynamic'));
  assert.ok(tool.extractReferences('client/public/images.xml', '<image>/one.png</image>').references.some(r => r.raw === '/one.png'));
});
test('B3 provenance: tests, comments, docs and UI placeholders cannot count as runtime evidence', () => {
  const r = analyse({
    'client/src/Page.test.jsx': 'const fixture="/one.png";',
    'docs/example.md': '![x](../client/public/one.png)',
    'client/src/Page.jsx': '// uses one.png\nconst row={placeholder:"/nested/two.webp"};',
  });
  assert.equal(r.summary.staticRuntime.assets, 0);
  assert.ok(r.records.find(a => a.path.endsWith('/one.png')).referenceEvidence.some(e => e.provenance === 'COMMENT'));
  assert.ok(r.records.find(a => a.path.endsWith('/two.webp')).referenceEvidence.some(e => e.provenance === 'UI_PLACEHOLDER'));
});
test('B3 provenance: an unreachable module has static source evidence but no runtime-module claim', () => {
  const r = tool.analyse({ assets, sources: { 'client/src/Old.jsx': 'const p="/one.png";' }, policy, models: [], unreachable: ['client/src/Old.jsx'] });
  assert.equal(r.summary.staticRuntime.assets, 0);
  assert.equal(r.summary.staticCodeIncludingUnreachableAndOperator.assets, 1);
});
test('B3 integrity: test fixtures and runtime missing paths have separate evidence roles', () => {
  const r = analyse({ 'client/src/Page.jsx': 'const image="/missing.webp";', 'client/src/Page.test.jsx': 'const image="/fake.webp";' });
  assert.equal(r.summary.runtimeIntegritySites, 1);
  assert.equal(r.summary.nonRuntimeIntegritySites, 1);
});
test('B3 protection: explicit approval wins without static references; changed bytes and missing protected paths are detected', () => {
  const p = { ...policy, protectedAssets: [{ path: assets[0].path, sha256: assets[0].sha256, reason: 'approved synthetic fixture' }] };
  const r = analyse({}, assets, p);
  assert.equal(r.records.find(a => a.path === assets[0].path).primaryClassification, 'PROTECTED');
  assert.ok(codes(analyse({}, [asset(assets[0].path, 'changed')], p)).includes('PROTECTED_ASSET_CONTENT_CHANGED'));
  assert.ok(codes(analyse({}, [], p)).includes('PROTECTED_ASSET_MISSING'));
});
test('B3 protection: current entry HTML/PWA icon configuration protects exactly the resolved paths', () => {
  const r = analyse({ 'client/public/index.html': '<link rel="icon" href="/one.png">' });
  assert.equal(r.records.find(a => a.path.endsWith('/one.png')).primaryClassification, 'PROTECTED');
  assert.equal(r.summary.protected.assets, 1);
});
test('B3 duplicate evidence: equal bytes are distinct paths, never a deletion or consolidation authorization', () => {
  const r = analyse({}, [asset('client/public/a.png', 'same'), asset('client/public/b.png', 'same'), asset('client/public/a.webp', 'different')]);
  assert.equal(r.duplicates.exactContent.length, 1);
  assert.equal(r.duplicates.possibleLegacyVariants.length, 1);
  assert.ok(r.records.every(a => a.deletionAuthorized === false && a.evidenceCompleteness.complete === false));
  assert.equal(r.summary.deletionAuthorized, 0);
  assert.equal(r.summary.candidateBytesByClassification.EXTERNAL_CONSUMER_POSSIBLE.assets, 3);
  assert.equal(r.summary.candidateBytesByClassification.PROTECTED.assets, 0);
});
test('B3 schema inventory: nested schemas, array descriptors, ObjectIds, Mixed/Object/Map and helper-returned fields', () => {
  const code = `const OID=mongoose.Schema.Types.ObjectId; function imgField(){return {url:{type:String},mediaId:{type:OID,ref:"Media"}};} const Nested=new Schema({url:String}); const S=new Schema({hero:imgField(),files:{type:[Schema.Types.Mixed]},items:[Nested],opaque:Object,metadata:{type:Map,of:String},file:{type:OID,ref:"File"}}); export default mongoose.model("Synthetic",S);`;
  const fields = tool.schemaInventory(code, { name: 'Synthetic', collection: 'synthetics', file: 'schema.model.js' }).fields;
  assert.ok(fields.some(f => f.path === 'hero.url' && f.type === 'String'));
  assert.ok(fields.some(f => f.path === 'hero.mediaId' && f.ref === 'Media'));
  assert.ok(fields.some(f => f.path === 'files[]' && f.opaque));
  assert.ok(fields.some(f => f.path === 'items[].url'));
  assert.ok(fields.some(f => f.path === 'opaque' && f.opaque));
  assert.ok(fields.some(f => f.path === 'metadata.*'));
  assert.ok(fields.some(f => f.path === 'file' && f.ref === 'File'));
  const plan = tool.referencePlan([{ name: 'Synthetic', collection: 'synthetics', file: 'schema.model.js' }], { 'schema.model.js': code }, policy);
  assert.ok(plan.surfaces.some(s => s.fieldPath === 'metadata.*' && s.referenceKind === 'OPAQUE_REFERENCE_CONTAINER'));
});
test('B3 schema inventory: unresolved schema construction fails closed instead of silently omitting fields', () => {
  assert.throws(() => tool.schemaInventory('const S=new Schema({});S.add({imageUrl:String});mongoose.model("Synthetic",S);', { name: 'Synthetic', collection: 'synthetics', file: 'schema.model.js' }), /schema fields need review/);
  assert.throws(() => tool.schemaInventory('const S=unknownFactory();mongoose.model("Synthetic",S);', { name: 'Synthetic', collection: 'synthetics', file: 'schema.model.js' }), /schema fields need review/);
});
test('B3 capture plan: override keys, private CV keys, opaque containers, ownership and PII exclusion are explicit', () => {
  const models = [
    { name: 'SiteSettings', collection: 'sitesettings', file: 'settings.model.js' },
    { name: 'JobApplication', collection: 'jobapplications', file: 'application.model.js' },
    { name: 'File', collection: 'files', file: 'file.model.js' },
  ];
  const code = {
    'settings.model.js': 'const S=new Schema({websiteImages:{images:[{key:String,url:String}]},blocks:Schema.Types.Mixed});mongoose.model("SiteSettings",S);',
    'application.model.js': 'const S=new Schema({fullName:String,email:String,passwordHash:String,cvKey:{type:String,select:false}});mongoose.model("JobApplication",S);',
    'file.model.js': 'const S=new Schema({filename:String,isPrivate:Boolean,productionId:{type:Schema.Types.ObjectId,ref:"Production"}});mongoose.model("File",S);',
  };
  const p = tool.referencePlan(models, code, policy);
  assert.ok(p.surfaces.some(f => f.fieldPath === 'websiteImages.images[].key'));
  assert.equal(p.surfaces.find(f => f.fieldPath === 'websiteImages.images[].key').referenceKind, 'OVERRIDE_SELECTOR_KEY');
  assert.equal(p.surfaces.find(f => f.model === 'File' && f.fieldPath === 'filename').normalization, 'file-filename-by-isPrivate');
  assert.ok(p.surfaces.some(f => f.fieldPath === 'cvKey'));
  assert.ok(p.surfaces.some(f => f.referenceKind === 'OPAQUE_REFERENCE_CONTAINER'));
  assert.ok(p.surfaces.some(f => f.fieldPath === 'productionId' && f.referenceKind === 'OWNERSHIP_CONTEXT' && f.legacyProductionEvidence));
  assert.ok(!p.surfaces.some(f => ['fullName', 'email', 'passwordHash'].includes(f.fieldPath)));
  assert.ok(p.models.find(m => m.model === 'File').futureProjection.fields.includes('isPrivate'));
  assert.equal(p.captureContract.executionAuthorized, false);
  assert.ok(p.surfaceSets.CMS_FIELDS_AND_OVERRIDES.includes('sitesettings:websiteImages.images[].key'));
  assert.ok(p.surfaceSets.MEDIA_FILE_INDIRECTION.includes('files:filename'));
});
test('B3 drift: asset additions/removals/content, reference changes and schema surfaces alter evidence', () => {
  const original = analyse({ 'client/src/Page.jsx': 'const image="/one.png";' });
  assert.notEqual(tool.digest(original), tool.digest(analyse({}, assets)));
  assert.notEqual(tool.digest(original), tool.digest(analyse({ 'client/src/Page.jsx': 'const image="/one.png";' }, assets.slice(1))));
  assert.notEqual(tool.digest(original), tool.digest(analyse({ 'client/src/Page.jsx': 'const image="/one.png";' }, [...assets, asset('client/public/new.png')])));
  assert.notEqual(tool.digest(original), tool.digest(analyse({ 'client/src/Page.jsx': 'const image="/one.png";' }, [asset(assets[0].path, 'new bytes'), ...assets.slice(1)])));
  const m = [{ name: 'Synthetic', collection: 'synthetics', file: 'schema.model.js' }];
  const p = code => tool.referencePlan(m, { 'schema.model.js': code }, policy);
  assert.notEqual(tool.digest(p('const S=new Schema({title:String});mongoose.model("Synthetic",S);')), tool.digest(p('const S=new Schema({title:String,imageUrl:String});mongoose.model("Synthetic",S);')));
  assert.notEqual(tool.digest(p('const S=new Schema({type:{type:String,enum:["image"]}});mongoose.model("Synthetic",S);')), tool.digest(p('const S=new Schema({type:{type:String,enum:["image","video"]}});mongoose.model("Synthetic",S);')));
});
test('B3 drift: dynamic source bindings and asset payload fields cannot change silently without literal filenames', () => {
  assert.notEqual(tool.digest(analyse({'client/src/Page.jsx':'const ui=<img src={item.first}/>;'})), tool.digest(analyse({'client/src/Page.jsx':'const ui=<img src={item.second}/>;'})));
  assert.notEqual(tool.digest(analyse({'portal-api/src/example.js':'const payload={imageUrl:body.first};'})), tool.digest(analyse({'portal-api/src/example.js':'const payload={imageUrl:body.second};'})));
});
test('B3 drift: unrelated source logic, comments and line shifts do not stale semantic evidence', () => {
  const a = analyse({ 'client/src/Page.jsx': 'const image="/one.png";const unrelated=1;' });
  const b = analyse({ 'client/src/Page.jsx': '\n// unrelated comment\nconst image="/one.png";const unrelated=2;' });
  assert.deepEqual(a, b);
});
test('B3 parse gaps: unsupported source is explicit partial evidence, never a complete negative scan', () => {
  const r = analyse({ 'client/src/Page.jsx': 'export const broken = <' });
  assert.equal(r.summary.unresolvedSourceParses, 1);
  assert.ok(r.records.every(a => a.evidenceCompleteness.staticRepository === 'PARTIAL_PARSE_GAPS' && a.classification.includes('UNRESOLVED')));
});
test('B3 check mode: detects stale register, field plan and summary independently without writing', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'b3-output-test-'));
  try {
    const folder = path.join(dir, 'docs/architecture'); mkdirSync(folder, { recursive: true });
    const built = { register: { a: 1 }, plan: { b: 2 }, report: 'summary\n' };
    tool.OUTPUTS.forEach((f, i) => writeFileSync(path.join(folder, f), i === 2 ? built.report : JSON.stringify(i === 0 ? built.register : built.plan, null, 2) + '\n'));
    assert.deepEqual(tool.checkOutputs(built, dir), []);
    for (const file of tool.OUTPUTS) {
      const current = readFileSync(path.join(folder, file)); writeFileSync(path.join(folder, file), 'stale');
      assert.deepEqual(tool.checkOutputs(built, dir), [file]); writeFileSync(path.join(folder, file), current);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('B3 safety: offline Git-only child with PATH; no application imports/network/asset mutations; fixed report writes only', () => {
  const code = readFileSync(new URL('../../docs/architecture/generate-asset-evidence.cjs', import.meta.url), 'utf8');
  assert.match(code, /execFileSync\('git', \['-C', root, 'ls-files', '-z'\], \{[^\n]+env: \{ PATH: process\.env\.PATH \} \}\)/);
  assert.equal([...code.matchAll(/\bexecFileSync\(/g)].length, 1);
  assert.doesNotMatch(code, /\b(?:spawn|execSync|exec)\(|\bfetch\(|https?\.request|MongoClient|S3Client|\.connect\(|\b(?:unlinkSync|renameSync|rmSync|rmdirSync)\(/);
  assert.doesNotMatch(code, /require\(['"](?:mongoose|@aws-sdk|dotenv)|import\(/);
  assert.equal([...code.matchAll(/fs\.writeFileSync\(/g)].length, 1);
  assert.match(code, /OUTPUTS\.forEach\(\(f, i\) => fs\.writeFileSync\(path\.join\(ROOT, 'docs\/architecture', f\), values\[i\]\)\)/);
});
test('B3 repository: deterministic, fresh, every model inventoried, protected approvals and no deletion authorization', () => {
  const a = tool.build(); const b = tool.build();
  assert.deepEqual(a, b);
  assert.deepEqual(tool.checkOutputs(a), []);
  assert.equal(a.plan.models.length, 45);
  assert.match(a.register.excludedTrackedAssetLikeFiles.find(f => f.path === 'client/public/robots.txt').reason, /Operational source/);
  assert.ok(a.plan.surfaces.some(s => s.model === 'SiteSettings' && s.fieldPath === 'about.missionImageUrl'));
  assert.ok(a.plan.surfaces.some(s => s.model === 'Production' && s.fieldPath === 'gallery[]'));
  assert.equal(a.register.records.filter(r => r.protection.some(p => p.evidence?.commit)).length, 4);
  assert.ok(a.register.records.every(r => r.deletionAuthorized === false));
});
