import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';import{execFileSync}from'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url)),catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'))),theme=JSON.parse(fs.readFileSync(path.join(root,'../theme/theme.json')));
const ids=new Set(catalog.entries.map(e=>e.id));let captures=0;
const versionParts=value=>String(value).match(/\d+/g)?.map(Number)??[];
const compareVersions=(a,b)=>{const av=versionParts(a),bv=versionParts(b);for(let i=0;i<Math.max(av.length,bv.length);i++){const delta=(av[i]??0)-(bv[i]??0);if(delta)return delta;}return 0;};
if(ids.size!==catalog.entries.length)throw Error('Duplicate catalog entry');
const exists=(id,file,kind)=>{if(!fs.existsSync(path.resolve(root,file)))throw Error(`${id}: missing ${kind} ${file}`);};
for(const e of catalog.entries){
 const r=JSON.parse(fs.readFileSync(path.join(root,e.file)));
 for(const k of ['id','kind','title','aliases','sources','consumers','guidance','decisions','parameters','status','evidence','history'])if(!Object.hasOwn(r,k))throw Error(`${e.id}: missing ${k}`);
 if(r.id!==e.id||r.kind!==e.kind)throw Error(`${e.id}: catalog/record mismatch`);
 for(const id of r.parents??[])if(!ids.has(id))throw Error(`${e.id}: missing related record ${id}`);
 for(const file of r.sources)exists(e.id,file,'source');
 for(const file of r.reviews??[])exists(e.id,file,'review');
 for(const file of r.reviewAssets??[])exists(e.id,file,'review asset');
 for(const h of r.history)if(h.evidence)exists(e.id,h.evidence,'history evidence');
 for(const p of r.parameters){if(p.source)exists(e.id,p.source,'parameter source');for(const key of p.tokens??[])if(!theme.shared[key]&&!theme.themes.light[key]&&!theme.themes.dark[key])throw Error(`${e.id}: unknown token ${key}`);}
 const captureIds=new Set();
 for(const c of r.evidence){
  for(const k of ['id','file','subject','kind','state','theme','viewport','textScale','revision','sourceHashes'])if(!Object.hasOwn(c,k))throw Error(`${e.id}: capture missing ${k}`);
  if(captureIds.has(c.id))throw Error(`${e.id}: duplicate capture ${c.id}`);captureIds.add(c.id);
  exists(e.id,c.file,'capture');if(c.parent)exists(e.id,c.parent,'parent image');if(c.page)exists(e.id,c.page,'page image');captures++;
 }
 const available=r.evidence.filter(c=>c.disposition!=='superseded'),inspected=available.filter(c=>c.inspectionStatus!=='captured only');
 const latest=(inspected.length?inspected:available).map(c=>c.revision).sort(compareVersions).at(-1);
 if(latest&&r.evidenceRevision!==latest)throw Error(`${e.id}: evidenceRevision must identify the latest scoped revision ${latest}, not insertion order (${r.evidenceRevision})`);
}
execFileSync(process.execPath,[path.join(root,'../tools/ui/cli.cjs'),'ui:check'],{windowsHide:true,stdio:'pipe'});
execFileSync(process.execPath,[path.join(root,'build-index.mjs'),'--check'],{windowsHide:true,stdio:'pipe'});
console.log(`${ids.size} searchable records; ${captures} linked capture references; sources, tokens, reviews, context links and consumer index agree.`);
