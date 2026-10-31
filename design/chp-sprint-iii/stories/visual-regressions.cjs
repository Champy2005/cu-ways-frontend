/* Focused protection for repeated, rendered manual-review defects.
   Run against the local HTML server; this is geometry/behavior evidence, not
   visual acceptance. Uses the existing frontend Playwright installation. */
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const workspace=path.resolve(__dirname,'../..');
const {chromium}=require(require.resolve('@playwright/test',{paths:[__dirname,path.resolve(__dirname,'../../cu-ways-frontend')]}));
const origin=process.env.CUWAYS_STORY_ORIGIN||'http://127.0.0.1:4187';
const output=process.env.CUWAYS_VISUAL_REPORT||path.join(workspace,'.artifacts/work/uxui-visual-regressions.json');
const result={origin,started:new Date().toISOString(),checks:[],errors:[]};
const check=(ok,label,detail)=>{result.checks.push({label,passed:!!ok,...(detail?{detail}:{})});if(!ok)throw Error(label);};
(async()=>{const browser=await chromium.launch(),page=await browser.newPage();page.on('pageerror',e=>result.errors.push(e.message));
 const go=async(story,state,theme,scale=100)=>{await page.goto(`${origin}/US-${story}/demo/screen.html?scenario=${state}&theme=${theme}&textScale=${scale}&responseMode=hold&timing=hold`);await page.locator('h1').first().waitFor();await page.evaluate(()=>document.fonts.ready);};
 try{
  for(const theme of ['light','dark']){
   for(const width of [320,390]){
    await page.setViewportSize({width,height:568});await go('025','L02',theme,200);
    const rightGaps=await page.locator('.job-card-heading').evaluateAll(headings=>headings.map(h=>h.getBoundingClientRect().right-h.querySelector('.cu-status').getBoundingClientRect().right));
    check(rightGaps.every(n=>Math.abs(n)<2),`job lifecycle stays upper-right ${theme}/${width}/200`,rightGaps);
    await page.locator('#job-filter').focus();await page.keyboard.press('Tab');
    await page.waitForFunction(()=>{const e=document.activeElement,r=e.getBoundingClientRect(),nav=document.querySelector('.cu-bar--bottom').getBoundingClientRect();return e.textContent.trim()==='View job'&&r.bottom<nav.top-3;},{},{timeout:2000});
    const focus=await page.evaluate(()=>{const e=document.activeElement,r=e.getBoundingClientRect(),nav=document.querySelector('.cu-bar--bottom').getBoundingClientRect(),header=document.querySelector('.cu-bar--top').getBoundingClientRect();return{text:e.textContent.trim(),top:r.top,bottom:r.bottom,navTop:nav.top,headerBottom:header.bottom};});
    check(focus.text==='View job'&&focus.top>=focus.headerBottom&&focus.bottom<focus.navTop-3,`actual Tab reveals full View job above chrome ${theme}/${width}`,focus);
    await page.keyboard.press('Enter');await page.locator('.detail-layout').waitFor();check(await page.locator('h1').innerText().then(t=>t.includes('61')),`focused entry opens the same job ${theme}/${width}`);
   }
   await page.setViewportSize({width:1440,height:1000});const gaps=[];
   for(const state of ['A01','A04','B02']){await go('034',state,theme);gaps.push(await page.locator('.review-context').evaluate(e=>e.children[1].getBoundingClientRect().top-e.children[0].getBoundingClientRect().bottom));}
   check(Math.max(...gaps)-Math.min(...gaps)<1,`profile/Ratings gap is independent of history height ${theme}`,gaps);
   await go('034','A04',theme);const summary=page.locator('.review-comment summary').first();await summary.focus();await page.keyboard.press('Enter');
   check(await page.locator('.review-comment details').first().getAttribute('open')!==null,`keyboard opens original long review ${theme}`);
   const full=await page.locator('.review-comment details .review-comment-text').first().innerText();
   check(full.length>420&&full.includes('ส่งงานครบถ้วน'),`full Unicode review remains available ${theme}`);
   await page.keyboard.press('Space');check(await page.locator('.review-comment details').first().getAttribute('open')===null,`keyboard collapses long review ${theme}`);
   await page.getByRole('combobox',{name:'Filter by rating',exact:true}).selectOption('1');await page.getByText('No reviews match this rating',{exact:true}).waitFor();
   check(await page.locator('.pagination').count()===0,`no redundant pager for one-page empty result ${theme}`);
   await page.getByRole('button',{name:'Show all ratings',exact:true}).click();await page.locator('.review-card').first().waitFor();
   check(await page.getByRole('combobox',{name:'Filter by rating',exact:true}).inputValue()==='all',`clear no-match filter restores reviews ${theme}`);
   await page.setViewportSize({width:320,height:420});await go('034','A04',theme,200);
   const bounds=await page.evaluate(()=>({document:document.documentElement.scrollWidth<=innerWidth+1,stars:[...document.querySelectorAll('.review-rating-row .rating')].every(e=>e.scrollWidth<=e.parentElement.clientWidth+1),pager:[...document.querySelectorAll('.pagination>span')].every(e=>{const t=e.firstChild;const range=document.createRange();range.setStart(t,0);range.setEnd(t,4);return range.getClientRects().length===1;})}));
   check(bounds.document&&bounds.stars&&bounds.pager,`enlarged narrow history fits stars and Page word ${theme}`,bounds);
  }
 }catch(e){result.errors.push(e.stack);}finally{await browser.close();result.finished=new Date().toISOString();fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2));console.log(JSON.stringify({checks:result.checks.length,errors:result.errors,report:output}));if(result.errors.length)process.exitCode=1;}
})();
