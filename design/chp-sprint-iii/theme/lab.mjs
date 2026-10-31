import source from './source.mjs';
import {artifacts} from './engine.mjs';
import {lifecycleBadge,esc,icon,action,backLink,banner,feedbackBlock,badge,navItem,brand,roleBirds,headerBar,menuItem,bottomBar,positionNavigationTile,observeNavigationTile,observeCompactNavigation} from './components.mjs';
import {readDraft,saveDraft,resetDraft,applyDraft,subscribeDraft,compileDraft} from './tuning.mjs';
const $=s=>document.querySelector(s);
const destinations=[['Home','home'],['Services','services'],['Jobs','jobs'],['Invites','invites'],['Profile','profile']];
$('.gallery-toolbar').after($('#lab-event'));
$('.version').textContent=source.meta.version;
let draft=readDraft().draft;
let stopTileObservation=()=>{};
let stopCompactObservations=[];
function notify(text){$('#lab-event').textContent=text;}
function feedbackExamples(){
 return `<section class="sample-card"><h3>Feedback messages</h3><div class="feedback-examples">${banner({tone:'success',title:'Changes saved',body:'The local preview is up to date.'})}${feedbackBlock({tone:'warning',title:'Latest details could not refresh',body:'Showing the last confirmed information. Refresh before continuing.',actions:[{label:'Refresh',icon:'refresh',attrs:'data-lab="refresh"'}]})}${banner({tone:'info',body:'This preview uses fictional data.'})}${banner({tone:'info',body:'Checking for updates…',pending:true})}${banner({tone:'neutral',title:'No new activity'})}</div></section><section class="sample-card"><h3>Lifecycle status badges</h3><div class="sample-statuses">${lifecycleBadge('Accepted')}${lifecycleBadge('In Progress')}${lifecycleBadge('Completed')}${lifecycleBadge('Cancelled')}</div></section>`;
}
function preview(mode){
 return `<article class="sample cu-surface" data-density="compact" data-cu-theme="${mode}" data-mode="${mode}">${headerBar({theme:mode,material:$('#material').value,menuId:'sample-menu-'+mode,brandAttrs:'data-lab="home"',roleLabel:'Switch to Creator, current Marketer',themeAttrs:'data-lab="theme"',roleAttrs:'data-lab="role"',menuAttrs:'data-lab="menu"',items:['Workspace','Settings','Sign out'].map(label=>menuItem(label,{attrs:`data-lab="${label==='Sign out'?'signout':label.toLowerCase()}"`})).join('')})}<div class="sample-body"><div class="sample-label"><span>${mode} mode</span><span>Shared defaults</span></div>${backLink('Back to workspace',{href:'#gallery-title',attrs:'data-lab="back-page"'})}<section class="sample-card"><header class="sample-card-heading"><h3>Action hierarchy</h3>${action('More options',{variant:'outline',format:'compact',icon:'more',attrs:'data-lab="more"'})}</header><div class="action-row">${action('Start job',{emphasis:'primary',attrs:'data-lab="start"'})}${action('Open proof',{variant:'secondary',attrs:'data-lab="activity"'})}${action('Refresh job',{variant:'utility',icon:'refresh',attrs:'data-lab="refresh"'})}</div><div class="action-row">${action('View activity',{variant:'tonal',attrs:'data-lab="activity"'})}${action('Keep job',{variant:'outline',attrs:'data-lab="activity"'})}${action('Dismiss',{variant:'quiet',attrs:'data-lab="activity"'})}${action('Delete draft',{emphasis:'primary',intent:'destructive',attrs:'data-lab="delete"'})}</div><p class="action-description">Commitment · secondary task · tonal task · outlined alternative · utility · quiet dismissal.</p></section><section class="sample-card"><h3>Recovery stays first</h3>${feedbackBlock({title:'Couldn’t load content',body:'Check your connection and try again. No request was sent.',actions:[{label:'Try again',icon:'refresh',attrs:'data-lab="retry"'}]})}<p class="action-description">Recovery is outside the feedback banner. Return links keep the same treatment inside cards.</p>${backLink('Back to workspace',{inside:true,attrs:'data-lab="back-card"'})}</section>${feedbackExamples()}<section class="sample-card"><h3>Interaction states</h3><div class="action-row">${action('Starting…',{emphasis:'primary',busy:true})}${action('Unavailable',{disabled:true})}</div><p class="action-description">Busy keeps its base fill, readable label and a smooth arc. It prevents duplicate activation. Disabled paint is a provisional reference.</p></section><div class="cu-action-tray sample-tray">${action('Main action',{emphasis:'primary',attrs:'data-lab="tray"'})}</div><p class="action-description">Tray appearance only; the story demo shows its actual floating behavior and measured scroll clearance.</p></div>${bottomBar(destinations.map(([label,glyph])=>navItem(label,glyph,{active:label==='Jobs',attrs:`data-nav="${glyph}"`})).join(''),{material:$('#material').value,attrs:'aria-label="Sample bottom navigation"'})}<footer class="sample-footer" data-effect-readout></footer></article>`;
}
function renderSamples(){
 const mode=$('#preview-mode').value;
 $('#samples').innerHTML=(mode==='both'?['light','dark']:[mode]).map(preview).join('')+`<section class="preview-desktop" data-cu-theme="${$('#edit-mode').value}"><h3>Desktop navigation · reserved geometry</h3><nav class="cu-nav--desktop" data-moving-tile="true" aria-label="Sample desktop navigation"><span class="cu-nav-tile" aria-hidden="true"></span>${destinations.map(([label,glyph])=>navItem(label==='Jobs'?'My Jobs':label,glyph,{active:label==='Jobs',attrs:`data-nav="${glyph}"`})).join('')}</nav><p>Same filled glyph family as mobile. The soft tile moves inside reserved targets; neighbors do not shift.</p></section>`;
 paint();stopTileObservation();for(const stop of stopCompactObservations)stop();
 stopTileObservation=observeNavigationTile($('.preview-desktop nav'));stopCompactObservations=[...document.querySelectorAll('.sample .cu-bottom-nav')].map(observeCompactNavigation);
 requestAnimationFrame(()=>{measureTile();measureHeaders();});
}
function measureHeaders(){for(const sample of document.querySelectorAll('.sample'))sample.style.setProperty('--lab-header-height',sample.querySelector('header').offsetHeight+'px');}
function measureTile({animate=false}={}){
 positionNavigationTile($('.preview-desktop nav'),{animate});
}
function paint(){
 document.documentElement.dataset.motion=$('#motion').value;
 const state=readDraft();draft=state.draft;
 for(const root of document.querySelectorAll('[data-cu-theme]'))applyDraft(root,root.dataset.cuTheme);
 for(const sample of document.querySelectorAll('.sample')){
  sample.dataset.motion=$('#motion').value;
  const css=getComputedStyle(sample),v=k=>css.getPropertyValue('--cu-'+k).trim();
  sample.querySelector('[data-effect-readout]').textContent=`Primary depth ${Number(v('opacity-depth-primary'))*100}% · Utility ${Number(v('opacity-depth-utility'))*100}% · Header glass ${Number(v('opacity-chrome-header'))*100}% / ${v('blur-header')} · Top rim 0px / lower rim ${v('rim-highlight')} + ${v('rim-seam')} seam`;
 }
 const count=Object.keys(draft.shared).length+Object.values(draft.themes).reduce((n,x)=>n+Object.keys(x).length,0);
 $('#draft-status').textContent=state.error|| (state.active?`${count} draft override${count===1?'':'s'} · base ${source.meta.version}`:`Canonical defaults · ${source.meta.version}`);
 $('#draft-status').classList.toggle('draft-active',state.active);
}
function includesGroup(key,group){
 if(group==='all')return true;
 if(group==='surface')return /^(color.surface|opacity.chrome|blur\.)/.test(key);
 if(group==='action')return /^(color.action|weight\.)/.test(key);
 if(group==='feedback')return /^(color.error|color.warning|color.status|border.banner|radius.banner|space.banner|space.feedback|size.banner)/.test(key);
 if(group==='depth')return /^(color.depth|depth\.|opacity.depth|opacity.contact)/.test(key);
 if(group==='motion')return /^(motion\.|size.*Icon|stroke\.|scale\.)/.test(key);
 return /^(rim\.|radius\.|space\.|size\.|text\.|font\.|focus\.|border\.)/.test(key);
}
function renderParameters(){
 const mode=$('#edit-mode').value,compiled=compileDraft(draft),definitions={...source.shared,...source.themes[mode]},filter=$('#search').value.toLowerCase();
 const entries=Object.entries(definitions).filter(([key,token])=>includesGroup(key,$('#group').value)&&(!filter||(key+' '+token.$description).toLowerCase().includes(filter)));
 $('#parameters').innerHTML=entries.map(([key,token])=>{
  const shared=Object.hasOwn(source.shared,key),value=compiled.resolved[mode][key],override=Object.hasOwn(shared?draft.shared:draft.themes[mode],key),readonly=token.$type==='string'||key==='rim.headerTop';
  const number=['number','duration'].includes(token.$type),type=token.$type==='color'?'color':number?'number':'text';
  const field=readonly?`<output>${esc(value)}</output>`:`<input aria-label="${esc(key)}" data-token="${esc(key)}" data-shared="${shared}" type="${type}" value="${esc(value)}"${number?` min="0" max="${key.startsWith('opacity.')||key.startsWith('weight.')?'1':'10000'}" step="${key.startsWith('opacity.')||key.startsWith('weight.')?'.005':token.$type==='duration'?'10':'.1'}"`:''}>`;
  const formatted=(key.startsWith('opacity.')||key.startsWith('weight.'))?`${(Number(value)*100).toFixed(1).replace('.0','')}%`:(token.$type==='duration'?value+'ms':value);
  return `<article class="parameter"><div class="parameter-title"><code>${esc(key)}</code><span class="status">${token.$status}</span></div><div class="parameter-editor">${field}${type==='color'?`<output>${esc(value)}</output>`:''}${number?`<output>${esc(formatted)}</output>`:''}</div><p>${esc(token.$description)}</p><p class="source-value">${shared?'Shared':'Theme / '+mode} · ${override?'Draft literal override':'Inherited'} · Source: ${esc(typeof token.$value==='object'?JSON.stringify(token.$value):token.$value)}</p>${override?`<button data-reset-token="${esc(key)}" data-shared="${shared}">Reset to inherited</button>`:''}</article>`;
 }).join('')||'<p class="parameter">No matching parameters.</p>';
}
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#parameters').addEventListener('change',event=>{
 const input=event.target.closest('[data-token]');if(!input)return;
 const next=structuredClone(draft),scope=input.dataset.shared==='true'?next.shared:next.themes[$('#edit-mode').value];
 scope[input.dataset.token]=input.type==='number'?Number(input.value):input.value;
 try{saveDraft(next);$('#import-status').textContent='Draft updated. Open story previews inherit it.';renderParameters();}catch(error){$('#import-status').textContent=error.message;renderParameters();}
});
$('#parameters').addEventListener('click',event=>{const button=event.target.closest('[data-reset-token]');if(!button)return;const next=structuredClone(draft),scope=button.dataset.shared==='true'?next.shared:next.themes[$('#edit-mode').value];delete scope[button.dataset.resetToken];saveDraft(next);renderParameters();});
$('#samples').addEventListener('click',event=>{
 const nav=event.target.closest('[data-nav]');if(nav){event.preventDefault();for(const a of nav.parentElement.querySelectorAll('[data-nav]'))a.removeAttribute('aria-current');nav.setAttribute('aria-current','page');measureTile({animate:true});notify('Selected '+nav.textContent.trim()+'. Target geometry stays reserved.');return;}
 const target=event.target.closest('[data-lab]');if(!target)return;event.preventDefault();const sample=target.closest('.sample');
 if(target.dataset.lab==='menu'){const menu=sample.querySelector('.cu-header-menu'),head=sample.querySelector('header');menu.hidden=!menu.hidden;head.dataset.menuOpen=String(!menu.hidden);target.setAttribute('aria-expanded',String(!menu.hidden));target.setAttribute('aria-label',menu.hidden?'Open sample navigation':'Close sample navigation');target.querySelector('.cu-icon').outerHTML=icon(menu.hidden?'menu':'close');if(!menu.hidden)menu.querySelector('button').focus();}
 else if(target.dataset.lab==='theme'){const next=sample.dataset.cuTheme==='light'?'dark':'light';sample.dataset.cuTheme=next;sample.dataset.mode=next;sample.querySelector('.cu-brand').outerHTML=brand(next);sample.querySelector('.cu-header-role .cu-role-birds').outerHTML=roleBirds(next);target.querySelector('.cu-icon').outerHTML=icon(next==='light'?'sun':'moon');target.setAttribute('aria-label',next==='light'?'Switch to dark theme':'Switch to light theme');sample.querySelector('.sample-label span').textContent=next+' mode';paint();notify('Sample theme changed; use Preview to restore the comparison.');}
 else notify(target.textContent.trim()+' · local component preview. No application request.');
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){for(const sample of document.querySelectorAll('.sample')){const menu=sample.querySelector('.cu-header-menu');if(!menu.hidden){menu.hidden=true;sample.querySelector('header').dataset.menuOpen='false';const trigger=sample.querySelector('[data-lab="menu"]');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-label','Open sample navigation');trigger.querySelector('.cu-icon').outerHTML=icon('menu');trigger.focus();}}}});
for(const id of ['preview-mode','material','motion'])$('#'+id).addEventListener('change',renderSamples);
for(const id of ['edit-mode','group'])$('#'+id).addEventListener('change',()=>{renderParameters();if(id==='edit-mode')renderSamples();});
$('#search').addEventListener('input',renderParameters);
$('#export-json').onclick=()=>download(`cuways-theme-draft-${source.meta.version}.json`,JSON.stringify({...draft,exportedAt:new Date().toISOString()},null,2),'application/json');
$('#export-css').onclick=()=>download('cuways-theme-preview.css',artifacts(compileDraft(draft).document)['tokens.css'],'text/css');
$('#reset-draft').onclick=()=>{resetDraft();renderParameters();$('#import-status').textContent='Reset to canonical inherited values.';};
$('#import-draft').onclick=()=>{try{if($('#import-json').value.length>150000)throw Error('Draft too large');saveDraft(JSON.parse($('#import-json').value));renderParameters();$('#import-status').textContent='Valid draft applied.';}catch(error){$('#import-status').textContent='Draft not applied: '+error.message;}};
subscribeDraft(()=>{paint();});
window.addEventListener('resize',()=>{measureTile();measureHeaders();});document.fonts?.ready.then(()=>{measureTile();measureHeaders();});
renderSamples();renderParameters();
