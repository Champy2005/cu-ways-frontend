const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module'),{spawn}=require('node:child_process');
const workspace=path.resolve(__dirname,'../..'),{chromium}=require(require.resolve('@playwright/test',{paths:[__dirname,path.resolve(__dirname,'../../cu-ways-frontend')]}));
const origin=process.env.CUWAYS_STORY_ORIGIN||'http://127.0.0.1:4180',evidence=path.join(workspace,'.artifacts/work/uxui-chp-scope-20261029');
const report={checks:[],errors:[],screenshots:[],startedAt:new Date().toISOString()};
const assert=(ok,label)=>{if(!ok)throw Error(label);report.checks.push(label);};
(async()=>{const browser=await chromium.launch(),p=await browser.newPage({viewport:{width:1280,height:900}});let child;
 p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
 try{
  for(const[n,scene,open,confirm,done]of [['027','A03','Run completion check','Confirm completion','Job completed']]){
   await p.goto(`${origin}/US-${n}/demo/index.html?timing=hold&scenario=${scene}`);const f=p.frameLocator('#screen');await f.getByRole('button',{name:open,exact:true}).click();
   for(let i=0;i<5;i++){await p.keyboard.press('Tab');assert(await f.locator('dialog').evaluate(d=>d.contains(document.activeElement)),`US${n} dialog traps keyboard focus ${i+1}`);}
   await f.getByRole('button',{name:confirm,exact:true}).click();await p.getByRole('button',{name:'Resolve pending step',exact:true}).click();await f.getByText(done,{exact:true}).waitFor();assert((await p.locator('#request-log').textContent()).split('POST').length-1===1,`US${n} explicit confirmed journey sends one simulated POST`);
   await p.selectOption('#theme','dark');await f.getByText(done,{exact:true}).waitFor();assert(await f.getByText(done,{exact:true}).isVisible(),`US${n} presentation change retains confirmed journey`);
  }
  for(const n of ['027','028','034']){
   await p.setViewportSize({width:320,height:568});await p.goto(`${origin}/US-${n}/demo/screen.html?fixture=long&textScale=200&theme=dark&timing=hold`);await p.locator('h1').waitFor();await p.evaluate(()=>document.fonts.ready);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`US${n} long Unicode fixture fits narrow enlarged text`);
   for(const theme of ['light','dark']){await p.setViewportSize({width:390,height:844});await p.goto(`${origin}/US-${n}/demo/screen.html?theme=${theme}&timing=hold`);await p.locator('h1').waitFor();await p.evaluate(()=>document.fonts.ready);await p.getByRole('button',{name:'Menu',exact:true}).click();assert(await p.getByRole('navigation',{name:'Workspace menu',exact:true}).isVisible(),`US${n} ${theme} mobile menu opens`);await p.keyboard.press('Escape');assert(await p.getByRole('button',{name:'Menu',exact:true}).evaluate(e=>e===document.activeElement),`US${n} ${theme} menu Escape restores focus`);const file=path.join(evidence,`us${n}-${theme}-390.png`);await p.screenshot({path:file,fullPage:true});report.screenshots.push(file);}
  }
  const portable=path.join(evidence,'portable');child=spawn(process.execPath,[path.join(portable,'serve.mjs'),'--port','4181'],{cwd:portable,windowsHide:true,stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Portable server did not become ready')),5000);child.stdout.once('data',()=>{clearTimeout(timer);resolve();});child.once('error',reject);child.once('exit',c=>{clearTimeout(timer);reject(Error('Portable server exited '+c));});});
  for(const n of ['025','026','027','028','034']){await p.goto(`http://127.0.0.1:4181/US-${n}/demo/index.html`);await p.locator('iframe').waitFor();await p.frameLocator('iframe').locator('h1').first().waitFor();assert(true,`extracted portable US${n} studio and product module load`);}
  assert(report.errors.length===0,'no journey or extracted-package browser errors');
 }catch(e){report.failure=e.stack;process.exitCode=1;}
 finally{if(child&&!child.killed)child.kill();await browser.close();report.completedAt=new Date().toISOString();fs.writeFileSync(path.join(evidence,'journey-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks.length,errors:report.errors,failure:report.failure,evidence},null,2));}
})();
