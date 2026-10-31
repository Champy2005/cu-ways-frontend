/* Portable ZIP (stored entries), Node standard library only. Archives current
   HTML sources and local assets, never application repos or historical SVGs. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {newStories,handoffStories} from './stories/scope.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const version=JSON.parse(fs.readFileSync(path.join(root,'theme/theme.json'),'utf8')).meta.version;
const exhaustive=process.argv.includes('--exhaustive');
if(exhaustive&&version!=='1.7.0')throw Error('The exhaustive phase belongs to the preserved 1.7.0 review. Package the current revision without --exhaustive.');
const selected=['index.html','serve.mjs','package-handoff.mjs','README.md','WORKFLOW.md','REVIEW.md','theme','US-025/demo','US-025/model','US-025/README.md','US-025/01-requirements.md','US-025/02-flows-and-states.md','US-025/03-responsive-layouts.md','US-025/04-components-and-copy.md','US-025/05-integration-handoff.md','US-025/06-acceptance-and-frames.md','US-025/07-decisions-and-readiness.md','US-026/demo','US-026/model','US-026/design/manifest.json'];
const entries=[];
const comparisonAssets=new Set(['US-025/color-playground/round10-list-desktop.jpg','US-025/color-playground/round10-tray-overlay.jpg','US-025/sources/current-desktop-overview.png','US-025/sources/current-desktop-invitations.png','US-025/sources/current-desktop-confirmation.png','US-025/sources/current-mobile-invitations.png','US-025/sources/current-mobile-confirmation.png']);
selected.push('US-025/color-playground/ROUND-10.md','US-025/sources/research.md',...comparisonAssets);
// Ship evidence linked by the modular book, not uncurated capture matrices.
const bookCatalog=JSON.parse(fs.readFileSync(path.join(root,'book/catalog.json'),'utf8'));
const evidenceFiles=new Set();
for(const entry of bookCatalog.entries){
 const record=JSON.parse(fs.readFileSync(path.join(root,'book',entry.file),'utf8'));
 for(const capture of record.evidence)for(const file of [capture.file,capture.parent,capture.page])if(file)evidenceFiles.add('book/'+file.replaceAll('\\','/'));
 for(const file of record.reviewAssets??[])evidenceFiles.add('book/'+file.replaceAll('\\','/'));
 for(const history of record.history)if(history.evidence?.startsWith('evidence/'))evidenceFiles.add('book/'+history.evidence);
}
// Human-confirmed scope: Chp's three remaining stories plus US025/US026.
selected.push('stories','book','tools/ui');
for(const id of newStories)selected.push(`US-${id}/demo`,`US-${id}/model`,`US-${id}/README.md`);
// Readiness notes only: other story screen archives are deliberately excluded.
selected.push('US-026/README.md','US-026/HANDOFF.md');
function add(relative){if(['US-025/demo/assets','stories/behavior.test.mjs'].includes(relative))return;const absolute=path.join(root,relative),stat=fs.statSync(absolute);if(stat.isDirectory()){if(relative.startsWith('book/evidence/')&&![...evidenceFiles].some(file=>file.startsWith(relative+'/')))return;for(const child of fs.readdirSync(absolute).sort())if(!['qa','node_modules'].includes(child))add(relative+'/'+child);}else if((! /\.(png|jpg|zip)$/.test(relative)||evidenceFiles.has(relative)||comparisonAssets.has(relative))&&(!relative.endsWith('/verification.json')||relative==='book/reviews/'+version+'/verification.json'||(exhaustive&&relative==='book/reviews/exhaustive/verification.json')))entries.push({name:relative,data:fs.readFileSync(absolute)});}
for(const item of selected)add(item);
const manifest={name:'CU Ways HTML Handoff',version,scope:'Chp Sprint III UX/UI',stories:handoffStories,generated:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),entry:'index.html',designBook:'book/index.html',review:'book/reviews/'+version+'/root-judgment.md',humanReview:'Colors and complete-page acceptance await human judgment; named human feedback and all other unvisited states are distinguished in the book.',serve:'node serve.mjs',proofBoundary:'Local design simulation; no application API, auth or persistence proof. The US-026 SVG masters and legacy viewer remain in the workspace; only their small state inventory is included for model validation.',files:Object.fromEntries(entries.map(e=>[e.name,crypto.createHash('sha256').update(e.data).digest('hex')]))};
if(exhaustive){manifest.reviewPhase='exhaustive';manifest.review='book/reviews/exhaustive/root-judgment.md';}
entries.push({name:'HANDOFF-MANIFEST.json',data:Buffer.from(JSON.stringify(manifest,null,2)+'\n')});
const table=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc32=data=>{let crc=0xffffffff;for(const byte of data)crc=table[(crc^byte)&255]^(crc>>>8);return(crc^0xffffffff)>>>0;};
const local=[],central=[];let offset=0;
for(const entry of entries){
 const [year,month,day]=manifest.generated.split('-').map(Number),name=Buffer.from(entry.name),data=entry.data,crc=crc32(data),date=((year-1980)<<9)|(month<<5)|day;
 const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(date,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(data.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(name.length,26);
 const dir=Buffer.alloc(46);dir.writeUInt32LE(0x02014b50);dir.writeUInt16LE(20,4);dir.writeUInt16LE(20,6);dir.writeUInt16LE(0x800,8);dir.writeUInt16LE(date,14);dir.writeUInt32LE(crc,16);dir.writeUInt32LE(data.length,20);dir.writeUInt32LE(data.length,24);dir.writeUInt16LE(name.length,28);dir.writeUInt32LE(offset,42);
 local.push(header,name,data);central.push(dir,name);offset+=header.length+name.length+data.length;
}
const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
const target=path.join(root,`CU-Ways-HTML-Handoff-v${version}${exhaustive?'-exhaustive':''}.zip`);fs.writeFileSync(target,Buffer.concat([...local,directory,end]));fs.writeFileSync(path.join(root,'HANDOFF-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({archive:target,files:entries.length,bytes:fs.statSync(target).size}));
