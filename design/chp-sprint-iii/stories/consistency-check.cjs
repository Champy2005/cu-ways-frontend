/* Rendered shared-contract checks. Complements the generated consumer index and
   image review; no claim of visual acceptance from a green geometry gate. */
const fs=require('node:fs'),path=require('node:path');
const{chromium}=require(require.resolve('@playwright/test',{paths:[__dirname,path.resolve(__dirname,'../../cu-ways-frontend')]}));
const origin=process.env.CUWAYS_STORY_ORIGIN||'http://127.0.0.1:4187',root=path.resolve(__dirname,'..'),output=process.env.CUWAYS_CONSISTENCY_OUTPUT||path.resolve('.artifacts/work/iteration4-20261030/consistency.json');
const checks=[],errors=[],routesVisited=new Set(),assert=(ok,label,detail)=>{checks.push({label,passed:!!ok,...detail?{detail}:{}});if(!ok)errors.push({label,detail});};
const jobs=[];for(const id of ['025','026','027','028','034']){const model=JSON.parse(fs.readFileSync(path.join(root,`US-${id}/model/scenarios.json`)));for(const s of model.scenarios)for(const theme of ['light','dark'])for(const width of [390,1440])jobs.push({id,state:s.id,theme,width});}
(async()=>{const browser=await chromium.launch();let cursor=0;
try{await Promise.all(Array.from({length:4},async()=>{const context=await browser.newContext(),page=await context.newPage();const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'no-preference'}]});
while(cursor<jobs.length){const j=jobs[cursor++],tag=`US${j.id}/${j.state}/${j.theme}/${j.width}`;
try{await page.setViewportSize({width:j.width,height:844});await page.goto(`${origin}/US-${j.id}/demo/screen.html?scenario=${j.state}&theme=${j.theme}&textScale=100&fixture=standard&responseMode=${j.id==='026'?'manual':'hold'}&timing=hold`);await page.locator('h1').waitFor();if(j.id==='025') {await page.evaluate(id=>postMessage({type:'cuways-demo-settings',settings:{scenarioId:id}},location.origin),j.state);await page.waitForFunction(id=>document.documentElement.dataset.selectedScenario===id,j.state); }
 const result=await page.evaluate(()=>{
 const style=e=>getComputedStyle(e),rect=e=>e.getBoundingClientRect();const dialogs=[...document.querySelectorAll('dialog[open]')];
 return{actual:document.documentElement.dataset.selectedScenario,overflow:document.documentElement.scrollWidth>innerWidth+1,header:style(document.querySelector('.cu-header')).position,
 dialogs:dialogs.map(d=>({modal:d.matches(':modal'),bounded:rect(d).left>=12&&rect(d).right<=innerWidth-12,close:[...d.querySelectorAll('button')].filter(b=>/close/i.test(b.getAttribute('aria-label')||b.innerText)).map(b=>({atom:b.classList.contains('cu-close'),border:style(b).borderTopWidth,fill:style(b).backgroundColor})),blur:getComputedStyle(d,'::backdrop').backdropFilter,pending:d.getAttribute('aria-busy')==='true',focusedTitle:d.contains(document.activeElement)&&document.activeElement.matches('.cu-dialog-topline>h2,.dialog-topline>h2'),titleOutline:d.contains(document.activeElement)?style(document.activeElement).outlineStyle:null,panelOutline:style(d).outlineStyle,duplicateDismiss:[...d.querySelectorAll('[data-action="dismiss"],[data-action="cancel-confirm"],[data-screen-action="close-form"]')].length})),
 pagination:[...document.querySelectorAll('.pagination .cu-action,.list-pagination .cu-action')].map(e=>({border:style(e).borderTopColor,shadow:style(e).boxShadow})),
 banners:[...document.querySelectorAll('.cu-banner')].map(e=>({tone:e.dataset.tone,rail:style(e).borderInlineStartWidth,body:e.querySelector('.cu-banner-copy')?.children.length,actions:e.querySelectorAll('button,a').length})),
 loading:document.querySelectorAll('.cu-loading-layout').length,operation:document.documentElement.dataset.operation,
 jobButtons:document.querySelectorAll('.review-record a,.review-record button').length};});
 routesVisited.add(new URL(page.url()).pathname.slice(1));assert(result.actual===j.state,tag+' actual named state',result.actual);assert(!result.overflow,tag+' no document overflow');assert(result.header==='sticky',tag+' sticky normal header',result.header);
 for(const d of result.dialogs){assert(d.modal&&d.bounded,tag+' modal is bounded top layer',d);assert(d.close.length===1&&d.close.every(c=>c.atom&&c.border==='0px'),tag+' one shared borderless close',d.close);assert(d.blur==='blur(6px)',tag+' content backdrop blur',d.blur);if(d.pending)assert(d.duplicateDismiss===1,tag+' no duplicate pending dismissal',d.duplicateDismiss);if(d.focusedTitle)assert(d.titleOutline==='none'&&d.panelOutline==='solid',tag+' programmatic title focus uses shared panel ring',d);}
 for(const p of result.pagination)assert(p.border==='rgba(0, 0, 0, 0)'&&p.shadow==='none',tag+' quiet pagination',p);
 for(const b of result.banners)assert(b.rail==='1px'&&b.body>0&&b.actions===0,tag+' shared message composition',b);
 if(j.id==='034')assert(result.jobButtons===0,tag+' public job references have no unsupported destination');
 if(['027','028','034'].includes(j.id)&&result.operation==='read')assert(result.loading===1,tag+' initial read uses destination scaffold');
}catch(e){errors.push({label:tag,error:e.stack});}}
await context.close();}));
}finally{await browser.close();fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({layouts:jobs.length,routesVisited:[...routesVisited].sort(),checks,errors,passed:!errors.length},null,2));console.log(JSON.stringify({layouts:jobs.length,routesVisited:[...routesVisited].sort(),checks:checks.length,errors:errors.slice(0,12),errorCount:errors.length,output}));if(errors.length)process.exitCode=1;}})();
