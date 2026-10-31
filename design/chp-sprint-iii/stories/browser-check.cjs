/* Local browser verification. Requires the existing frontend Playwright install.
   Starts no application API or database. The handoff server must already run. */
const fs=require('node:fs');
const path=require('node:path');
const {createRequire}=require('node:module');
const workspace=path.resolve(__dirname,'../..');
const {chromium}=require(require.resolve('@playwright/test',{paths:[__dirname,path.resolve(__dirname,'../../cu-ways-frontend')]}));
const origin=process.env.CUWAYS_STORY_ORIGIN||'http://127.0.0.1:4187';
const evidence=process.env.CUWAYS_BROWSER_REPORT_DIR||path.join(workspace,'.artifacts/work/iteration4-20261030/browser-final');fs.mkdirSync(evidence,{recursive:true});
const result={startedAt:new Date().toISOString(),origin,checks:[],errors:[],screenshots:[]};
const assert=(value,label)=>{if(!value)throw Error(label);result.checks.push(label);};
(async()=>{
 const browser=await chromium.launch({headless:true});const context=await browser.newContext();const page=await context.newPage();
 page.on('pageerror',e=>result.errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)result.errors.push(r.status()+' '+r.url());});
 const go=async(n,query='')=>{await page.goto(`${origin}/US-${n}/demo/screen.html?timing=hold&${query}`);await page.locator('h1').waitFor();await page.evaluate(()=>document.fonts.ready);};
 const take=async name=>{const filename=path.join(evidence,name+'.png');await page.screenshot({path:filename,fullPage:true});result.screenshots.push(filename);};
 try{
  const numbers=['027','028','034'];
  for(const n of numbers){const model=JSON.parse(fs.readFileSync(path.join(workspace,`UX UI/US-${n}/model/scenarios.json`),'utf8'));
   for(const variant of [{theme:'light',width:1280,height:900,scale:100},{theme:'dark',width:320,height:568,scale:200}]){
    await page.setViewportSize({width:variant.width,height:variant.height});
    for(const s of model.scenarios){await go(n,`scenario=${s.id}&theme=${variant.theme}&textScale=${variant.scale}&motion=true&transparency=true`);
     const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
     assert(!overflow,`US${n} ${s.id} ${variant.theme}/${variant.width}/${variant.scale}: no horizontal overflow`);
     assert((await page.locator('#story-content').innerText()).trim().length>20,`US${n} ${s.id}: rendered content`);
    }
    await go(n,`scenario=${n==='027'?'A02':n==='028'?'A04':n==='029'?'A04':n==='033'?'A04':'A01'}&theme=${variant.theme}&textScale=${variant.scale}`);await take(`us${n}-${variant.theme}-${variant.width}`);
   }
  }
  await page.setViewportSize({width:1280,height:900});
  await go('027','scenario=A01');await page.getByRole('button',{name:'Run completion check',exact:true}).click();assert(await page.getByRole('dialog').isVisible(),'missing proof opens completion-blocked modal');assert(await page.getByRole('link',{name:'Add delivery proof',exact:true}).isVisible(),'blocked completion offers proof route');await page.keyboard.press('Escape');assert(await page.getByRole('button',{name:'Run completion check',exact:true}).evaluate(e=>e===document.activeElement),'completion dialog restores focus');
  await go('028','scenario=A03');await page.getByRole('button',{name:'Cancel job',exact:true}).click();assert(await page.getByRole('button',{name:'Keep job',exact:true}).evaluate(e=>e===document.activeElement),'cancellation initially focuses Keep job');await page.getByRole('button',{name:'Confirm cancellation',exact:true}).click();await page.keyboard.press('Escape');assert(await page.getByRole('dialog').count()===0,'pending cancellation can close while its operation continues');await page.getByRole('button',{name:'View progress',exact:true}).click();assert(await page.getByRole('dialog').isVisible(),'pending cancellation progress can reopen');assert(await page.getByRole('button',{name:'Confirm cancellation',exact:true}).count()===0,'pending cancellation prevents resubmit');
  await page.goto(`${origin}/US-028/demo/index.html?scenario=A03&timing=hold&outcome=success`);await page.locator('iframe').waitFor();const frame=page.frameLocator('#screen');await frame.getByRole('button',{name:'Cancel job',exact:true}).click();await frame.getByRole('button',{name:'Confirm cancellation',exact:true}).click();await page.getByRole('button',{name:'Resolve pending step',exact:true}).click();await frame.getByText('Job cancelled',{exact:true}).waitFor();assert(await frame.getByRole('button',{name:'Cancel job',exact:true}).count()===0,'studio-driven cancellation confirms terminal state');assert((await page.locator('#request-log').textContent()).includes('POST'),'studio records explicit simulated mutation');
  await page.selectOption('#scenario','R01');await frame.getByRole('button',{name:'Check job status',exact:true}).click();await page.selectOption('#read','failed');await page.getByRole('button',{name:'Resolve pending step',exact:true}).click();await frame.getByText('Status check failed',{exact:true}).waitFor();assert(await frame.getByText('The cancellation result is still unknown.',{exact:true}).isVisible(),'failed reconciliation explicitly stays unknown');assert(await frame.getByRole('button',{name:'Cancel job',exact:true}).count()===0,'unknown cancellation cannot resubmit');await page.selectOption('#read','missing');await frame.getByRole('button',{name:'Check job status',exact:true}).click();await page.getByRole('button',{name:'Resolve pending step',exact:true}).click();await frame.getByRole('button',{name:'Cancel job',exact:true}).waitFor();assert(await frame.getByRole('button',{name:'Cancel job',exact:true}).isVisible(),'confirmed missing cancellation permits explicit retry');
  for(const scenario of ['B01','B02','B03','A06']){await go('028',`scenario=${scenario}`);assert(await page.getByRole('heading',{name:'Cancellation effects',exact:true}).count()===0,`US028 ${scenario}: guarded or terminal state omits cancellation task`);assert(await page.getByRole('button',{name:'Cancel job',exact:true}).count()===0,`US028 ${scenario}: no cancellation action`);}
  await go('028','scenario=B02');assert((await page.locator('#story-content').innerText()).includes('Paid'),'US028 completed fixture displays Paid');
  await go('034','scenario=A02');assert(await page.getByRole('heading',{name:'No reviews yet',exact:true}).isVisible(),'profile has genuine empty review state');assert(!(await page.locator('#story-content').innerText()).includes('0.00'),'empty profile never fabricates 0.00');
  await go('034','scenario=B01');assert(await page.locator('.review-card').count()===3,'profile renders bounded qualified records');await page.selectOption('select[name="filter"]','1');assert(await page.getByText('No reviews match this rating',{exact:true}).isVisible(),'rating filter excludes nonqualifying one-star fixtures');
  await go('034','job=41');assert(await page.locator('dialog[open]').count()===0,'unsupported public detail query cannot invent a job dialog');
  await go('034');assert(await page.locator('[data-action^=job-]').count()===0,'public review has no unsupported private destination');assert(await page.locator('.review-job-reference').first().innerText()==='Job #41','review retains job provenance');
  await page.setViewportSize({width:320,height:300});await go('028','scenario=A04&textScale=200&theme=dark&motion=true&transparency=true');await page.getByRole('button',{name:'Confirm cancellation',exact:true}).scrollIntoViewIfNeeded();assert(await page.getByRole('button',{name:'Confirm cancellation',exact:true}).isVisible(),'short-height enlarged-text dialog reaches final action');await take('us028-short-200-dark');
  for(const theme of ['light','dark']){
   await page.setViewportSize({width:390,height:300});
   for(const[n,scenario,trigger]of [['027','A01','Run completion check'],['028','A03','Cancel job']]){
    await go(n,`scenario=${scenario}&theme=${theme}&textScale=200`);await page.getByRole('button',{name:trigger,exact:true}).click();
    assert(await page.locator('dialog[open]').evaluate(d=>d.scrollTop===0&&document.activeElement===d.querySelector('h2')),`US${n} ${theme} short dialog opens at visible focused title`);
    await page.keyboard.press('Escape');assert(await page.getByRole('button',{name:trigger,exact:true}).evaluate(e=>e===document.activeElement),`US${n} ${theme} short dialog restores trigger focus`);
   }
   await page.setViewportSize({width:390,height:844});await go('034',`scenario=A01&theme=${theme}`);
   await page.selectOption('select[name=filter]','5');assert(await page.locator('.review-history h2').evaluate(e=>e===document.activeElement),`US034 ${theme} filter focuses refreshed results`);
   await page.getByRole('button',{name:'Next',exact:true}).focus();await page.keyboard.press('Enter');assert(await page.locator('.review-history h2').evaluate(e=>e===document.activeElement),`US034 ${theme} pagination focuses refreshed results`);
   await go('026',`scenario=A01&theme=${theme}`);const menu=page.locator('[data-screen-action="menu"]');await menu.click();await page.keyboard.press('Escape');assert(await menu.evaluate(e=>e.getAttribute('aria-expanded')==='false'&&document.activeElement===e),`US026 ${theme} Escape closes menu and restores focus`);
  }
  await page.goto(origin);await page.locator('#stories article').first().waitFor();assert(await page.locator('#stories article').count()===5,'library exposes all five Chp-assigned stories');assert(await page.getByRole('link',{name:'Explore story',exact:true}).count()===5,'library links only the five scoped studios');assert(await page.locator('a[href*="US-029"],a[href*="US-032"],a[href*="US-033"]').count()===0,'Tim draft stories are absent from the main handoff');assert(!(await page.locator('main').innerText()).match(/Ã|â€|â†/),'library Unicode copy is decoded correctly');await page.setViewportSize({width:1280,height:900});await take('story-library');
  assert(result.errors.length===0,'no browser exceptions or failed local requests');
 }catch(e){result.failure=e.stack;await take('failure');process.exitCode=1;}
 finally{result.completedAt=new Date().toISOString();fs.writeFileSync(path.join(evidence,'browser-report.json'),JSON.stringify(result,null,2));await browser.close();console.log(JSON.stringify({checks:result.checks.length,errors:result.errors,failure:result.failure,evidence},null,2));}
})();
