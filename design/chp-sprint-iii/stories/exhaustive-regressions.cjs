/* Actual UX outcomes for defects found by exhaustive review. Requires the
   existing frontend Playwright install and a running local HTML server. */
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const root=path.resolve(__dirname,'../..'),{chromium}=require(require.resolve('@playwright/test',{paths:[__dirname,path.resolve(__dirname,'../../cu-ways-frontend')]}));
const origin=process.env.CUWAYS_STORY_ORIGIN||'http://127.0.0.1:4187',out={checks:[],errors:[]};
const check=(ok,label)=>{out.checks.push({label,passed:!!ok});if(!ok)throw Error(label);};
(async()=>{const b=await chromium.launch(),p=await b.newPage();p.on('pageerror',e=>out.errors.push(e.message));
const go=async(n,s,theme,scale=100,extra='')=>{await p.goto(`${origin}/US-${n}/demo/screen.html?scenario=${n==='025'?'L02':s}&theme=${theme}&textScale=${scale}&responseMode=${n==='025'?'hold':'manual'}&timing=hold&${extra}`);await p.locator('h1').first().waitFor();if(n==='025'&&s!=='L02'){await p.evaluate(s=>postMessage({type:'cuways-demo-settings',settings:{scenarioId:s}},location.origin),s);await p.waitForFunction(s=>document.documentElement.dataset.selectedScenario===s,s);}await p.evaluate(()=>document.fonts.ready);};
const resolve=async s=>{await p.evaluate(()=>postMessage({namespace:'us026-demo',type:'resolve'},location.origin));await p.waitForFunction(s=>document.documentElement.dataset.selectedScenario===s&&!document.documentElement.dataset.operation,s);};
try{for(const theme of['light','dark']){
 await p.setViewportSize({width:390,height:844});await go('025','D09',theme);
 const context=await p.locator('.context-card').innerText();check(context.includes('No brief attached')&&context.includes('Target not specified')&&(context.match(/Not specified/g)||[]).length>=2,`D09 default shows genuine missing optional metadata ${theme}`);
 await p.locator('[data-action="start"]').filter({visible:true}).first().click();await p.locator('[data-action="cancel-confirm"]').first().click();check((await p.locator('.context-card').innerText()).includes('No brief attached'),`D09 retains missing context through confirmation dismissal ${theme}`);
 await p.setViewportSize({width:320,height:568});for(const[s,selector]of[['L02','#job-filter'],['L03','.empty-state a,.empty-state button'],['C05','.cu-operation button']]){
  await go('025',s,theme,200,'responseMode=hold');
  const target=p.locator(selector).first();const initial=await target.evaluate(e=>({target:e.getBoundingClientRect().bottom,nav:document.querySelector('.mobile-bottom-navigation').getBoundingClientRect().top}));check(initial.nav>=initial.target,`navigation follows meaningful ${s} content at enlarged short size ${theme}`);
  await target.focus();await p.waitForFunction(()=>{const r=document.activeElement.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;});check(true,`${s} focused control fits viewport ${theme}`);
 }
 await p.setViewportSize({width:390,height:300});for(const[n,s]of[['027','R04'],['034','R01']]){
  await go(n,s,theme);const stop=p.getByRole('button',{name:'Stop waiting',exact:true});await stop.focus();await p.waitForFunction(()=>{const r=document.activeElement.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;});
  const clear=await stop.evaluate(e=>e.getBoundingClientRect().bottom<=document.querySelector('.cu-bottom-nav').getBoundingClientRect().top);check(clear,`${n} short loading recovery stays clear of navigation ${theme}`);
 }
 await p.setViewportSize({width:390,height:844});await go('026','B03',theme);
 await p.locator('[data-screen-action="check"]').click();await resolve('B04');check(await p.evaluate(()=>document.activeElement.id==='proof-feedback'),`check miss focuses its result ${theme}`);check(await p.locator('#proof-url').isVisible()&&await p.locator('#proof-url').inputValue()!=='',`check miss exposes retained draft for explicit retry ${theme}`);
 await go('026','A05',theme);await p.locator('#proof-url').fill('https://example.com/second-proof');await p.keyboard.press('Enter');await resolve('A06');check(await p.evaluate(()=>document.activeElement.id==='proof-feedback'),`second save focuses confirmed result ${theme}`);
 await go('026','C02',theme);await p.locator('[data-screen-action="refresh-status"]').click();await resolve('A06');check(await p.locator('#proof-feedback').count()===0,`status refresh never claims a proof save ${theme}`);check(!(await p.locator('main').innerText()).includes('Add your first delivery link'),`completed readonly empty state gives no impossible add instruction ${theme}`);
}}catch(e){out.errors.push(e.stack);}finally{await b.close();const file=process.env.CUWAYS_EXHAUSTIVE_REPORT||path.join(root,'.artifacts/work/exhaustive-20261030/regressions.json');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(out,null,2));console.log(JSON.stringify({checks:out.checks.length,errors:out.errors,report:file}));if(out.errors.length)process.exitCode=1;}})();
