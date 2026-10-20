/* Documentation only. Reads source; never imports the application, opens a DB,
 * reads .env, calls a service, or runs a seed. --check performs no writes. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../..');
const clientRequire = createRequire(path.join(root, 'client/package.json'));
const apiRequire = createRequire(path.join(root, 'portal-api/package.json'));
const parser = clientRequire('@babel/parser');
const pluralize = apiRequire('mongoose').pluralize();
const baseline = '58b8f86c84fd2ca1f5abc94146623813f73954cb';
const rel = p => path.relative(root, p).split(path.sep).join('/');
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).sort((a,b)=>a.name.localeCompare(b.name))
    .flatMap(e => e.isDirectory() ? files(path.join(dir,e.name)) : [path.join(dir,e.name)]);
}
function walk(n, fn) {
  if (!n || typeof n !== 'object' || !n.type) return;
  fn(n);
  for (const v of Object.values(n)) {
    if (Array.isArray(v)) v.forEach(x=>walk(x,fn));
    else if (v && typeof v === 'object' && v.type) walk(v,fn);
  }
}
const sources = new Map();
for (const file of [...files(path.join(root,'portal-api/src')), ...files(path.join(root,'client/src'))]) {
  if (!/\.(js|jsx)$/.test(file) || /\.(test|spec)\./.test(file)) continue;
  const code = fs.readFileSync(file,'utf8');
  sources.set(rel(file), {code, ast:parser.parse(code,{sourceType:'unambiguous',plugins:['jsx']}), imports:[], vars:new Map()});
}
function resolveImport(file, spec) {
  if (!spec.startsWith('.')) return null;
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(file),spec));
  return [base,base+'.js',base+'.jsx',base+'/index.js',base+'/index.jsx'].find(p=>sources.has(p)) || null;
}
for (const [file,s] of sources) {
  walk(s.ast,n=>{
    if(n.type==='VariableDeclarator' && n.id.type==='Identifier') s.vars.set(n.id.name,n.init);
    if(n.type==='ImportDeclaration') s.imports.push({source:n.source.value,file:resolveImport(file,n.source.value),names:n.specifiers.map(x=>x.local.name)});
    if((n.type==='ExportNamedDeclaration'||n.type==='ExportAllDeclaration')&&n.source)
      s.imports.push({source:n.source.value,file:resolveImport(file,n.source.value),names:[]});
    if(n.type==='CallExpression' && n.callee.type==='Import' && n.arguments[0]?.type==='StringLiteral')
      s.imports.push({source:n.arguments[0].value,file:resolveImport(file,n.arguments[0].value),names:[]});
  });
}
const text = (s,n) => n ? s.code.slice(n.start,n.end).replace(/\s+/g,' ').trim() : '';
const literal = n => n?.type === 'StringLiteral' || n?.type==='NumericLiteral' || n?.type==='BooleanLiteral' ? n.value : null;
const key = n => n?.key?.name ?? n?.key?.value;
const prop = (n,k) => n?.properties?.find(p=>key(p)===k)?.value;
function resolveNode(s,n,seen=new Set()) {
  if(n?.type==='Identifier' && s.vars.has(n.name) && !seen.has(n.name)) {seen.add(n.name);return resolveNode(s,s.vars.get(n.name),seen);}
  return n;
}
function schemaFields(s,n,prefix='',depth=0) {
  if(depth>8 || !n) return [];
  n=resolveNode(s,n);
  if(n.type==='NewExpression' && /(?:^|\.)Schema$/.test(text(s,n.callee))) n=n.arguments[0];
  if(n?.type!=='ObjectExpression') return [];
  const out=[];
  for(const p of n.properties) {
    if(p.type!=='ObjectProperty') continue;
    const name=prefix+key(p), v=resolveNode(s,p.value), t=prop(v,'type');
    if(v?.type==='ObjectExpression' && !t && !prop(v,'ref')) {
      out.push(...schemaFields(s,v,name+'.',depth+1));continue;
    }
    const actual=t||v;
    const innerDescriptor=actual?.type==='ArrayExpression'?resolveNode(s,actual.elements[0]):null;
    const descriptor=innerDescriptor?.type==='ObjectExpression'&&(prop(innerDescriptor,'type')||prop(innerDescriptor,'ref'))?innerDescriptor:v;
    let type=text(s,actual).slice(0,100);
    if(actual?.type==='ArrayExpression') type='Array';
    const field={path:name,type,line:p.loc.start.line};
    for(const k of ['ref','refPath','enum']) {
      const value=prop(descriptor,k);
      if(value) {const r=resolveNode(s,value);field[k]=k==='enum'&&r.type==='ArrayExpression' ? r.elements.map(x=>literal(x)??text(s,x)) : literal(r)??text(s,r);}
    }
    if(prop(descriptor,'required'))field.required=text(s,prop(descriptor,'required'));
    if(prop(descriptor,'unique'))field.unique=text(s,prop(descriptor,'unique'));
    if(prop(descriptor,'index'))field.index=text(s,prop(descriptor,'index'));
    out.push(field);
    let inner=actual;
    if(inner?.type==='ArrayExpression') inner=inner.elements[0];
    if(innerDescriptor===descriptor)continue;
    const nested=schemaFields(s,inner,name+(actual?.type==='ArrayExpression'?'[].':'.'),depth+1);
    out.push(...nested);
  }
  return out;
}
const models=[];
for(const [file,s] of sources) {
  if(!file.startsWith('portal-api/'))continue;
  walk(s.ast,n=>{
    if(n.type!=='CallExpression'||n.callee.type!=='MemberExpression'||n.callee.property.name!=='model'||n.arguments.length<2||typeof literal(n.arguments[0])!=='string')return;
    const name=literal(n.arguments[0]), schema=resolveNode(s,n.arguments[1]);
    const options=schema?.arguments?.[1];
    const collection=literal(n.arguments[2])||literal(prop(options,'collection'))||pluralize(name);
    const indexes=[];walk(s.ast,x=>{if(x.type==='CallExpression'&&x.callee.property?.name==='index')indexes.push({line:x.loc.start.line,definition:text(s,x)});});
    models.push({name,collection,domain:file.split('/')[3],file,line:n.loc.start.line,fields:schemaFields(s,schema),indexes});
  });
}
const app=sources.get('portal-api/src/app.js'), mounts=[];
walk(app.ast,n=>{
  if(n.type!=='CallExpression'||n.callee.object?.name!=='app'||n.callee.property?.name!=='use')return;
  const prefix=literal(n.arguments[0]);if(typeof prefix!=='string')return;
  for(const a of n.arguments.slice(1)) {
    const imp=app.imports.find(i=>i.names.includes(a.name)&&i.file?.endsWith('.routes.js'));
    if(imp)mounts.push({prefix,file:imp.file,line:n.loc.start.line});
  }
});
function handler(s,file,n) {
  const label=text(s,n);
  const ident=n.type==='Identifier'?n.name:n.type==='MemberExpression'?n.object.name:null;
  const imported=s.imports.find(i=>i.names.includes(ident));
  return {label:label.length>450?'inline handler (see source)':label,source:imported?.file||file};
}
const apiRoutes=[];
for(const mount of [...mounts,{prefix:'',file:'portal-api/src/app.js'}]) {
  const s=sources.get(mount.file), globals=[];
  walk(s.ast,n=>{
    if(n.type!=='CallExpression'||n.callee.type!=='MemberExpression'||!['router','app'].includes(n.callee.object?.name))return;
    const method=n.callee.property.name;
    if(method==='use'&&n.callee.object.name==='router') {globals.push(...n.arguments.map(a=>handler(s,mount.file,a)));return;}
    if(!['get','post','put','patch','delete','all','head','options'].includes(method))return;
    const routePath=literal(n.arguments[0]);if(typeof routePath!=='string')return;
    const full=(mount.prefix+ (routePath==='/'?'':routePath))||'/';
    const handlers=n.arguments.slice(1).map(a=>handler(s,mount.file,a));
    apiRoutes.push({method:method.toUpperCase(),path:full,domain:mount.file.split('/')[3]||'system',file:mount.file,line:n.loc.start.line,globalGuards:[...globals],handlers});
  });
}
apiRoutes.sort((a,b)=>a.path.localeCompare(b.path)||a.method.localeCompare(b.method));
const frontendRoutes=[];
for(const file of ['client/src/App.js','client/src/portal/app/PortalRoutes.jsx']) {
  const s=sources.get(file);walk(s.ast,n=>{
    if(n.type!=='JSXOpeningElement'||n.name.name!=='Route')return;
    const attrs=n.attributes.filter(a=>a.type==='JSXAttribute');
    const p=attrs.find(a=>a.name.name==='path'), e=attrs.find(a=>a.name.name==='element');
    frontendRoutes.push({file,line:n.loc.start.line,path:p?.value?.value??'(index/layout)',element:e?text(s,e.value).slice(0,200):''});
  });
}
function pureConfig(file) {
  const s=sources.get(file).code.replace(/export\s+/g,'');
  return JSON.parse(vm.runInNewContext(s+'; JSON.stringify({catalog:PERMISSION_CATALOG, defaults:DEFAULT_ROLE_PERMISSIONS})',{}, {timeout:1000}));
}
const backendPermissions=pureConfig('portal-api/src/config/permissions.js');
const frontendPermissions=pureConfig('client/src/portal/config/permissions.js');
const permissionUsage={};
const known=backendPermissions.catalog.flatMap(x=>x.permissions.map(p=>p.key));
for(const k of known)permissionUsage[k]={api:[],ui:[]};
for(const [file,s] of sources) {
  if(file.includes('/scripts/')||file.endsWith('/config/permissions.js'))continue;
  walk(s.ast,n=>{if(n.type==='StringLiteral'&&permissionUsage[n.value]){
    const side=file.startsWith('portal-api/')?'api':'ui';permissionUsage[n.value][side].push({file,line:n.loc.start.line});
  }});
}
const reachable=new Set();
function visit(file){if(reachable.has(file)||!sources.has(file))return;reachable.add(file);for(const imp of sources.get(file).imports)if(imp.file)visit(imp.file);}
visit('client/src/index.js');
const unreachable=[...sources.keys()].filter(f=>f.startsWith('client/')&&!reachable.has(f)).sort();
const requests=[];
for(const [file,s] of sources) {
  if(!file.startsWith('client/'))continue;
  walk(s.ast,n=>{
    if(n.type!=='CallExpression')return;
    const called=text(s,n.callee), a=n.arguments[0];
    if(!/^(fetch|apiFetch|api\.(get|post|patch|put|delete)|apiRequest|request)$/.test(called)||!a)return;
    if(!['StringLiteral','TemplateLiteral'].includes(a.type))return;
    requests.push({file,line:n.loc.start.line,call:called,url:text(s,a),reachable:reachable.has(file)});
  });
}
const unresolvedLocalJs=[];
for(const [file,s] of sources)for(const imp of s.imports)
  if(imp.source.startsWith('.')&&!imp.file&&/\.(js|jsx)$/.test(imp.source))unresolvedLocalJs.push({file,import:imp.source});
const dependencies={};
for(const area of ['client','portal-api']){
  const pkg=JSON.parse(fs.readFileSync(path.join(root,area,'package.json'),'utf8'));
  dependencies[area]=Object.entries(pkg.dependencies||{}).map(([name,range])=>({name,range,importFiles:[...sources].filter(([file,s])=>file.startsWith(area+'/')&&s.imports.some(i=>i.source===name||i.source.startsWith(name+'/'))).map(([f])=>f)}));
}
const inventory={baseline,methodology:'Static source inventory, not live MongoDB contents or runtime authorization proof. No application imports; default collection names use Mongoose pluralization.',counts:{backendDomains:new Set(mounts.map(m=>m.file.split('/')[3])).size,portalFeatureAreas:fs.readdirSync(path.join(root,'client/src/portal/features'),{withFileTypes:true}).filter(d=>d.isDirectory()).length,mountedRouters:mounts.length,apiRoutes:apiRoutes.length,models:models.length,modelFiles:new Set(models.map(m=>m.file)).size,defaultRoles:Object.keys(backendPermissions.defaults).length,permissionKeys:known.length,frontendCatalogKeys:frontendPermissions.catalog.flatMap(d=>d.permissions).length},mounts,models,apiRoutes,frontendRoutes,backendPermissions,frontendPermissions,permissionUsage,frontendRequests:requests,unreachableFrontendCandidates:unreachable,unresolvedLocalJs,dependencies};
const output=JSON.stringify(inventory,null,2)+'\n', dest=path.join(__dirname,'source-inventory.json');
if(process.argv.includes('--check')) {if(fs.readFileSync(dest,'utf8')!==output)throw new Error('source-inventory.json is stale');}
else fs.writeFileSync(dest,output);
console.log(JSON.stringify(inventory.counts,null,2));
