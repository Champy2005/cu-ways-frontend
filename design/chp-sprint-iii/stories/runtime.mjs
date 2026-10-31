import {OPERATION_WAIT_MS,operationJournal,restoreMutation} from '../theme/operations.mjs';
import {verificationBadge,lifecycleBadge,closeControl,loadingScaffold,esc,action,backLink,badge,banner,feedbackBlock,icon,headerBar,menuItem,navItem,bottomBar,observeCompactNavigation,observeNavigationTile,attachmentTag,evidenceLink,operationNotice,keepFocusVisible} from '../theme/components.mjs';
export {verificationBadge,esc,action,badge,banner,feedbackBlock,icon,attachmentTag,evidenceLink,operationNotice};
export const control=(label,id,options={})=>action(label,{attrs:`data-action="${esc(id)}"`,...options});
export const card=(title,body)=>`<section class="card"><h2>${esc(title)}</h2>${body}</section>`;
export const facts=rows=>`<dl class="facts">${rows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
export const money=cents=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'THB'}).format(cents/100);
export const dateTime=value=>new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Bangkok'}).format(new Date(value))+' ICT';
export const date=value=>new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeZone:'Asia/Bangkok'}).format(new Date(value));
export const status=lifecycleBadge;
export const jobFacts=(s)=>facts([['Job',`#${s.jobId??41}`],['Surveys',esc(s.long?'Campus dining, accessibility and student wellbeing — แบบสำรวจประสบการณ์นิสิตและพื้นที่การเรียนรู้':'Campus dining survey')],['Creator',esc(s.long?'Narin Chulalongkorn · Student Experience Research Group':'Narin C.')],['Marketer','Mali S.'],['Agreed price',money(250000)],['Status',status(s.status)]]);
export const jobSummary=s=>`<section class="card job-summary" aria-labelledby="job-summary-title"><div class="job-summary-heading cu-status-heading"><div class="cu-status-copy"><p class="eyebrow">Job #${s.jobId??41}</p><h2 id="job-summary-title">${esc(s.long?'Campus dining, accessibility and student wellbeing — แบบสำรวจประสบการณ์นิสิตและพื้นที่การเรียนรู้':'Campus dining survey')}</h2></div>${status(s.status)}</div>${facts([['Creator',esc(s.long?'Narin Chulalongkorn · Student Experience Research Group':'Narin C.')],['Marketer','Mali S.'],['Agreed price',money(250000)]])}</section>`;
export const dialog=(title,body,actions,{pending=false}={})=>`<dialog class="story-dialog cu-content-dialog" aria-labelledby="dialog-title" aria-busy="${pending}"><div class="cu-dialog-topline"><h2 id="dialog-title" tabindex="-1">${esc(title)}</h2>${closeControl('Close',{attrs:'data-action="dismiss"'})}</div>${body}<div class="actions cu-dialog-actions">${actions}</div></dialog>`;
export const feedback=(title,body,tone='error',controls=[])=>`<div class="notice">${feedbackBlock({title,body,tone,actions:controls})}</div>`;
export const unavailable=()=>card('Job unavailable',`<p>You no longer have access to this job.</p>`);
export function startStory({model,seed,reduce,view,readOnly=false}){
 const root=document.querySelector('#screen-root'),params=new URLSearchParams(location.search);
keepFocusVisible(root);
 document.title=model.title+' · CU Ways';
 const scenarioIds=new Set(model.scenarios.map(s=>s.id));
 const config={theme:'light',material:'glass',textScale:'100',motion:false,transparency:false,timing:'auto',outcome:'success',read:'success',fixture:'standard'};
 const allowed={theme:['light','dark'],material:['glass','opaque'],textScale:['100','150','200'],timing:['auto','hold'],outcome:model.outcomes.map(o=>o[0]),read:['success','missing','failed','access'],fixture:['standard','long']};
 for(const[k,values]of Object.entries(allowed))if(values.includes(params.get(k)))config[k]=params.get(k);
 for(const k of ['motion','transparency'])config[k]=params.get(k)==='true';
 let scene=scenarioIds.has(params.get('scenario'))?params.get('scenario'):model.scenarios[0].id;
 let state=seed(scene),menu=false,cleanup=[],returnFocus=null,scheduled=null,timer,deadline,operationRevision=0;
 const journal=operationJournal(model.story);let journalActive=false;
 function restoreJournal(force=false){
  if(readOnly)return;
  const record=journal.read({fixture:config.fixture,explicitScenario:params.has('scenario'),navigationType:performance.getEntriesByType('navigation')[0]?.type,force});
  if(!record)return;
  clearOperation();state=restoreMutation(record);scene=scenarioIds.has(record.scene)?record.scene:scene;journalActive=true;
 }
 function persistJournal(){
  if(readOnly)return;
  if(state.pending&&state.pending!=='read')journalActive=true;
  if(!journalActive)return;
  journal.write({scene,fixture:config.fixture,phase:state.pending&&state.pending!=='read'?'pending':state.message?.startsWith('unknown')?'unknown':'settled',snapshot:state});
 }
 restoreJournal();
 const log=[];
 const post=(type,data={})=>{if(parent!==window)parent.postMessage({channel:'cu-story-v1',story:model.story,type,...data},location.origin);};
 const logRequest=kind=>{log.push({kind,at:new Date().toISOString(),operation:state.pending});post('log',{log:log.slice(-30)});};
 function clearOperation(){clearTimeout(timer);clearTimeout(deadline);scheduled=null;operationRevision++;}
 function syncOperation(){
  if(!state.pending){if(scheduled)clearOperation();return;}
  if(scheduled===state.pending)return;
  clearOperation();scheduled=state.pending;const revision=operationRevision;
  if(config.timing==='auto')timer=setTimeout(()=>{if(revision===operationRevision&&state.pending)send('resolve');},650);
  deadline=setTimeout(()=>{if(revision===operationRevision&&state.pending)send('timeout');},OPERATION_WAIT_MS);
 }
 function appearance(){Object.assign(document.documentElement.dataset,{cuTheme:config.theme,textScale:config.textScale,motion:config.motion?'reduce':'full',transparency:config.transparency?'reduce':'full',selectedScenario:scene,operation:state.pending??'',jobStatus:state.status??''});}
 function navigation(compact=false){const items=[['My Jobs','jobs','../../US-025/demo/screen.html'],['Proof','services','../../US-026/demo/screen.html'],['Completion','invites','../../US-027/demo/screen.html'],['Reviews','profile','../../US-034/demo/screen.html']].map(([label,glyph,href])=>navItem(label,glyph,{href,active:(model.story==='US-034'?label==='Reviews':model.story==='US-027'?label==='Completion':label==='My Jobs')})).join('');return compact?bottomBar(items,{material:config.material}):`<nav class="cu-nav cu-nav--desktop" aria-label="Workspace navigation"><span class="cu-nav-tile" aria-hidden="true"></span>${items}</nav>`;}
 function measureChrome(){
  const nav=root.querySelector('.cu-bottom-nav'),header=root.querySelector('.cu-header');if(!nav)return;
  document.documentElement.dataset.chromeLayout='fixed';
  const height=getComputedStyle(nav).display==='none'?0:nav.getBoundingClientRect().height;
  const font=parseFloat(getComputedStyle(document.documentElement).fontSize);
  const main=root.querySelector('.story-main'),content=root.querySelector('#story-content');
  const leadIn=height&&content?.firstElementChild?Math.max(0,content.getBoundingClientRect().top-main.getBoundingClientRect().top):0;
  const flow=(header?.getBoundingClientRect().height??0)+height+leadIn+font*8>innerHeight;
  document.documentElement.dataset.chromeLayout=flow?'flow':'fixed';
  document.documentElement.style.setProperty('--story-nav-clearance',flow?'0px':height+'px');
 }
 function render(focus){
  cleanup.forEach(fn=>fn());cleanup=[];appearance();state.long=config.fixture==='long';
  const pendingTitle=state.pending==='read'?(readOnly?'Loading reviews':'Loading job information'):state.pending==='complete'?'Completing job':'Cancelling job';
  const progress=state.pending&&!state.modal?operationNotice({title:pendingTitle,actions:state.pending==='read'?[{label:'Stop waiting',attrs:'data-action="timeout"'}]:[{label:'View progress',attrs:'data-action="reopen"'}]}):'';
  root.innerHTML=`<a class="skip-link" href="#main">Skip to content</a>${headerBar({theme:config.theme,material:config.material,nav:navigation(),menuOpen:menu,brandHref:'../../index.html',themeAttrs:'data-shell="theme"',roleAttrs:'disabled',roleLabel:model.role+' · fixed story role',menuAttrs:'data-shell="menu"',items:menuItem('Story library',{href:'../../index.html'})+menuItem('Theme workbench',{href:'../../theme/lab.html'})})}<main id="main" class="story-main cu-workspace" tabindex="-1"><div class="page-return">${backLink('Story library',{href:'../../index.html'})}</div><header class="story-heading"><h1>${esc(model.title)}</h1></header><div id="story-content">${state.pending==='read'?loadingScaffold(readOnly?'reviews':model.story==='US-028'?'cancellation':'completion',pendingTitle,[{label:'Stop waiting',attrs:'data-action="timeout"'}]):progress+view(state,config)}</div></main>${navigation(true)}`;
  cleanup.push(observeNavigationTile(root.querySelector('.cu-nav--desktop')),observeCompactNavigation(root.querySelector('.cu-nav--compact')));
  const observer=new ResizeObserver(measureChrome);observer.observe(root.querySelector('.cu-header'));observer.observe(root.querySelector('.cu-bottom-nav'));cleanup.push(()=>observer.disconnect());measureChrome();
  const d=root.querySelector('dialog');
  if(d){
   d.showModal();d.addEventListener('cancel',e=>{e.preventDefault();send('dismiss');});
   d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.target===d&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))send('dismiss');});
   d.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const stops=[...d.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length);const first=stops[0],last=stops.at(-1);if(!first){e.preventDefault();d.querySelector('h2').focus();}else if(e.shiftKey&&(document.activeElement===first||!stops.includes(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!stops.includes(document.activeElement))){e.preventDefault();first.focus();}});
   const title=d.querySelector('h2'),overflow=d.scrollHeight>d.clientHeight+1;
   const initial=state.pending||overflow?title:d.querySelector('.cu-dialog-actions [data-action="dismiss"]:not(:disabled)')??title;
   initial.focus({preventScroll:overflow});if(overflow)d.scrollTop=0;
  }else if(focus){let target=root.querySelector(focus);if(!target||target.disabled)target=root.querySelector('[data-action="reopen"]')??root.querySelector('h1');if(target.tabIndex<0)target.setAttribute('tabindex','-1');target.focus();}
  post('state',{scenario:scene,pending:state.pending??null,status:state.status??null});persistJournal();syncOperation();
 }
 function send(type,fields={}){
  if(type==='resolve'&&!state.pending)return;
  const previous=state,pendingBefore=state.pending;
  state=reduce(state,{type,...fields,outcome:config.outcome,read:config.read});if(state===previous)return;
  if((!previous.modal&&!previous.selected&&!previous.jobModal)&&(state.modal||state.selected||state.jobModal))returnFocus=`[data-action="${type}"]`;
  if(state.pending&&!pendingBefore)logRequest(state.pending==='read'?'GET · simulated read':'POST · explicit simulated '+state.pending);
  if(type==='resolve')post('resolved',{outcome:config.outcome,read:config.read});
  render(type==='dismiss'?returnFocus:state.errorField?`#${state.errorField}`:['resolve','timeout'].includes(type)?'.cu-banner, #story-content h2':['filter','clear-filter','previous','next'].includes(type)?'.review-history h2':null);
 }
 root.addEventListener('click',e=>{const shell=e.target.closest('[data-shell]');if(shell){if(shell.dataset.shell==='theme'){config.theme=config.theme==='light'?'dark':'light';post('appearance',{theme:config.theme});}else menu=!menu;render(`[data-shell="${shell.dataset.shell}"]`);return;}const b=e.target.closest('[data-action]');if(b&&!b.disabled){if(b.tagName==='A'&&(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey))return;e.preventDefault();const form=b.closest('form');send(b.dataset.action,form?Object.fromEntries(new FormData(form)):{});}});
 root.addEventListener('submit',e=>{e.preventDefault();send(e.target.dataset.submit??'submit',Object.fromEntries(new FormData(e.target)));});
 root.addEventListener('input',e=>{if(e.target.name)state=reduce(state,{type:'draft',name:e.target.name,value:e.target.value});});
 root.addEventListener('change',e=>{const form=e.target.closest('form[data-auto-submit]');if(form)send(form.dataset.submit??'submit',Object.fromEntries(new FormData(form)));});
 root.addEventListener('toggle',e=>{const detail=e.target;if(detail.matches?.('details[data-review-id]'))state=reduce(state,{type:'review-expansion',id:detail.dataset.reviewId,open:detail.open});},true);
 root.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu){menu=false;render('[data-shell="menu"]');}});
 window.addEventListener('resize',measureChrome);
 window.addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin||e.data?.channel!=='cu-story-v1'||e.data.story!==model.story)return;const{type,settings}=e.data;if(type==='configure'&&settings&&typeof settings==='object'){
   const oldTiming=config.timing,oldFixture=config.fixture;for(const[k,values]of Object.entries(allowed))if(values.includes(settings[k]))config[k]=settings[k];
   for(const k of ['motion','transparency'])if(typeof settings[k]==='boolean')config[k]=settings[k];
   if(scenarioIds.has(settings.scenario)||oldFixture!==config.fixture){journal.clear();journalActive=false;if(scenarioIds.has(settings.scenario))scene=settings.scenario;state=seed(scene);clearOperation();log.length=0;}else if(oldTiming!==config.timing)clearOperation();
   render();
  }else if(type==='resolve')send('resolve');else if(type==='reset'){journal.clear();journalActive=false;state=seed(scene);clearOperation();log.length=0;post('log',{log:[]});render();}});
 window.addEventListener('pagehide',persistJournal);
 window.addEventListener('pageshow',e=>{if(e.persisted){restoreJournal(true);render();}});
 logRequest('GET · simulated initial read');render();post('ready');return{send,getState:()=>state};
}
