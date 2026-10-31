import{esc}from'../theme/components.mjs';
const catalog=await fetch('./catalog.json').then(r=>r.json());
const records=await Promise.all(catalog.entries.map(async e=>({...e,record:await fetch(e.file).then(r=>r.json())})));
const theme=await fetch('../theme/theme.json').then(r=>r.json());
const list=document.querySelector('#entries'),panel=document.querySelector('#record'),search=document.querySelector('#search');
const pathLink=(file,label=file)=>`<a href="${esc(file)}">${esc(label)}</a>`;
// Captures retain their original URL as provenance. Live navigation follows the
// current local server so the extracted portable handoff works on another port.
const liveUrl=value=>{try{const url=new URL(value);return ['127.0.0.1','localhost'].includes(url.hostname)?url.pathname+url.search+url.hash:value;}catch{return value;}};
const links=values=>`<ul>${values.map(v=>`<li>${pathLink(v)}</li>`).join('')}</ul>`;
function parameter(p){
 if(typeof p==='string')return `<li>${esc(p)}</li>`;
 const tokens=(p.tokens??[]).map(key=>{
  const shared=theme.shared[key],light=theme.themes.light[key],dark=theme.themes.dark[key];
  const value=node=>typeof node?.$value==='object'?JSON.stringify(node.$value):node?.$value??'See generated reference';
  return `<li><code>${esc(key)}</code> · ${shared?esc(value(shared)):`Light ${esc(value(light))} / Dark ${esc(value(dark))}`}</li>`;
 }).join('');
 return `<li><strong>${esc(p.name)}</strong>${p.description?`<p>${esc(p.description)}</p>`:''}${tokens?`<ul class="tokens">${tokens}</ul>`:''}${p.source?pathLink(p.source,'Source definition'):''}</li>`;
}
function historyItem(h){if(typeof h==='string')return esc(h);return `${h.date?esc(h.date)+' · ':''}${esc(h.text??h.title??'')}${h.reason?`<p>${esc(h.reason)}</p>`:''}${h.evidence?` ${pathLink(h.evidence,'Evidence')}`:''}`;}
const normalize=value=>String(value).toLowerCase().replace(/us[- ]?0*(\d+)/g,'us$1').replace(/[-_]/g,' ').replace(/\s+/g,' ').trim();
function searchScore(r,query){
 if(!query)return 1;
 const names=[r.id,r.title,...r.aliases].map(normalize),words=query.split(' '),matches=text=>words.every(word=>text.includes(word));
 if(names.some(name=>name===query))return 100;
 if(names.some(name=>name.includes(query)))return 80;
 if(names.some(matches))return 60;
 const metadata=normalize(JSON.stringify({guidance:r.guidance,decisions:r.decisions,parameters:r.parameters,sources:r.sources,consumers:r.consumers,coverage:r.coverage?.map(({state,title})=>({state,title}))}));
 return matches(metadata)?20:0;
}
function markCurrent(id){list.querySelectorAll('a').forEach(a=>{if(a.hash===`#${id}`)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});}
function revealRecord(id){show(id);const heading=panel.querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});panel.scrollIntoView({block:'start'});}
function gallery(r){
 const mode=panel.querySelector('#evidence-mode').value,themeFilter=panel.querySelector('#evidence-theme').value,kind=panel.querySelector('#evidence-kind').value;
 const evidenceRevision=r.evidenceRevision??catalog.revision;
 const captures=r.evidence.filter(c=>(themeFilter==='all'||c.theme===themeFilter)&&(kind==='all'||c.kind===kind)&&(mode==='reviewed'?c.revision===evidenceRevision&&c.disposition!=='superseded'&&c.inspectionStatus!=='captured only':mode==='current'?c.revision===evidenceRevision&&c.disposition!=='superseded':true));
 panel.querySelector('#capture-count').textContent=`${captures.length} matching captures. Evidence revision ${evidenceRevision}; design revision ${catalog.revision}. Inspection applies only to each stated image and scope.${evidenceRevision!==catalog.revision?' Earlier scoped evidence; this record has no new image inspection.':''}`;
 panel.querySelector('.gallery').innerHTML=captures.map(c=>`<figure><a href="${esc(c.file)}" target="_blank" rel="noopener"><img loading="lazy" src="${esc(c.file)}" alt="${esc(c.subject+' '+c.kind+' '+c.state+' '+c.theme)}"></a><figcaption><strong>${esc(c.kind+' · '+c.state)}</strong><br>${esc(c.theme+' · '+c.viewport.width+'×'+c.viewport.height+' · '+c.textScale+'% text · '+c.revision)}<br>${esc(c.inspectionStatus??c.inspection??'capture only')} ${c.disposition==='superseded'?'· Superseded finding':''}<br>${esc(c.context??'')}<div class="capture-links">${pathLink(c.file,'Full image')}${c.parent?pathLink(c.parent,'Parent'):''}${c.page?pathLink(c.page,'Page'):''}${c.url?pathLink(liveUrl(c.url),'Live state'):''}</div><details><summary>Source fingerprints</summary><pre>${esc(JSON.stringify(c.sourceHashes,null,2))}</pre></details></figcaption></figure>`).join('')||'<p>No captures match these filters. Unvisited combinations remain awaiting review.</p>';
}
function show(id){
 const e=records.find(e=>e.id===id)??records[0],r=e.record;
 history.replaceState(null,'',`#${e.id}`);markCurrent(e.id);
 panel.innerHTML=`<p class="meta">${esc(r.kind)} · <code>${esc(r.id)}</code></p><h2>${esc(r.title)}</h2><p class="meta">Search aliases: ${r.aliases.filter(Boolean).map(esc).join(', ')}</p><dl class="status">${Object.entries(r.status).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><h3>Human guidance</h3><ul>${r.guidance.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><h3>Current decisions</h3>${r.decisions.map(d=>`<div class="decision"><strong>${esc(d.title??d)}</strong>${d.reason?`<p>${esc(d.reason)}</p>`:''}</div>`).join('')||'<p>Awaiting implementation and rendered judgment.</p>'}<h3>Parameters and composition</h3><p class="meta">Token values below are read from the canonical theme at runtime; this book does not own another palette.</p><ul class="parameters">${r.parameters.map(parameter).join('')||'<li>See the linked shared component records.</li>'}</ul><h3>Source and consumers</h3>${links(r.sources)}<p>${r.consumers.map(esc).join(' · ')}</p>${r.parents?.length?`<p>Related composition: ${r.parents.map(id=>pathLink('#'+id,records.find(e=>e.id===id)?.title??id)).join(' · ')}</p>`:''}${r.reviews?.length?links(r.reviews):''}${r.coverage?`<h3>Scenario coverage</h3><p class="meta">Automated layout checks are separate from image inspection and human review.</p><div class="table-scroll"><table><thead><tr><th>State</th><th>Human review</th><th>Rendered inspection</th></tr></thead><tbody>${r.coverage.map(c=>`<tr><td>${esc(c.state)} · ${esc(c.title)}</td><td>${esc(c.human)}</td><td>${esc(c.visual)}</td></tr>`).join('')}</tbody></table></div>`:''}<h3>Evidence</h3>${r.evidence.length?`<div class="evidence-filters"><label>Scope<select id="evidence-mode"><option value="reviewed">Current inspected captures</option><option value="current">All current captures</option><option value="all">Include history / findings</option></select></label><label>Theme<select id="evidence-theme"><option value="all">Both themes</option><option value="light">Light</option><option value="dark">Dark</option></select></label><label>View<select id="evidence-kind"><option value="all">All views</option><option value="component">Component</option><option value="parent">Parent / siblings</option><option value="page">Page</option></select></label></div><p id="capture-count" class="meta" role="status"></p><div class="gallery"></div>`:'<p>Unvisited in this revision. No image inspection is implied.</p>'}<h3>History and remaining review</h3><ul>${r.history.map(h=>`<li>${historyItem(h)}</li>`).join('')}</ul>`;
 panel.querySelectorAll('a[href^="#"]').forEach(a=>a.onclick=e=>{e.preventDefault();revealRecord(a.hash.slice(1));});
 if(r.evidence.length){panel.querySelectorAll('.evidence-filters select').forEach(select=>select.onchange=()=>gallery(r));gallery(r);}
}
function renderList(){const q=normalize(search.value);list.innerHTML=records.map((e,index)=>({e,index,score:searchScore(e.record,q)})).filter(e=>e.score>0).sort((a,b)=>b.score-a.score||a.index-b.index).map(({e})=>`<a href="#${e.id}">${esc(e.title)}<span class="meta"> · ${esc(e.kind)}</span></a>`).join('')||'<p>No matching record.</p>';markCurrent(location.hash.slice(1)||records[0].id);list.querySelectorAll('a').forEach(a=>a.onclick=e=>{e.preventDefault();revealRecord(a.hash.slice(1));});}
search.oninput=renderList;document.querySelector('#theme').onclick=()=>document.documentElement.dataset.cuTheme=document.documentElement.dataset.cuTheme==='dark'?'light':'dark';renderList();show(location.hash.slice(1));
window.addEventListener('hashchange',()=>revealRecord(location.hash.slice(1)));
