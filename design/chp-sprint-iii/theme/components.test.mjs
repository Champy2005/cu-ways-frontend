import {test} from 'node:test';
import assert from 'node:assert/strict';
import source from './source.mjs';
import {resolveTheme,effects,artifacts} from './engine.mjs';
import {banner,feedbackBlock,backLink,action,icon,navItem,headerBar,menuItem} from './components.mjs';
import {compileDraft,emptyDraft} from './tuning.mjs';
test('feedback copy is neutral; signal and outer border stay separate in both themes',()=>{
 for(const mode of ['light','dark']){const t=resolveTheme(source,mode);assert.equal(t['color.error.ink'],t['color.text.body']);assert.equal(t['color.error.border'],t['color.border.default']);assert.notEqual(t['color.error.signal'],t['color.error.ink']);}
 const html=banner({title:'<button>Retry</button>',body:'<a href="#">Back</a>'});assert.doesNotMatch(html,/<(?:button|a)\b/);assert.match(html,/&lt;button&gt;/);assert.match(html,/role="alert"/);
});
test('header top reflection is absent while lower and bottom rims remain',()=>{
 for(const mode of ['light','dark']){const t=resolveTheme(source,mode),fx=effects(t,mode==='dark');assert.equal(t['rim.headerTop'],'0px');assert.equal(t['rim.highlight'],'2px');assert.doesNotMatch(fx['effect.bar.header'],/inset 0 var\(--cu-rim-highlight\)/);assert.match(fx['effect.bar.header'],/calc\(-1 \* \(var\(--cu-rim-highlight\)/);assert.match(fx['effect.bar.bottom'],/inset 0 calc\(var\(--cu-rim-highlight\)/);}
});
test('navigation appearance follows explicit context and keeps anchor semantics',()=>{
 const page=backLink('Back to My Jobs'),card=backLink('Back to My Jobs',{inside:true});assert.match(page,/<a /);assert.match(page,/class="cu-back-link"/);assert.doesNotMatch(page,/class="cu-action"/);assert.match(card,/<a /);assert.match(card,/class="cu-back-link"/);assert.doesNotMatch(card,/class="cu-action"/);assert.match(card,/data-navigation-context="card"/);
 assert.throws(()=>backLink('bad',{href:'javascript:alert(1)'}),/Unsafe/);
});
test('pending cannot activate and spinner is a continuous shared path',()=>{
 const busy=action('Starting…',{emphasis:'primary',busy:true});assert.match(busy,/ disabled/);assert.match(busy,/aria-busy="true"/);assert.match(busy,/cu-icon-spinner/);assert.doesNotMatch(icon('spinner'),/stroke-dasharray/);assert.match(action('Refresh',{icon:'refresh'}),/M21 10a9/);assert.throws(()=>icon('unknown'),/Unknown/);assert.match(navItem('Jobs','jobs',{active:true}),/aria-current="page"/);
});
test('drafts recompute dependent paints, round trip and never mutate canonical source',()=>{
 const before=JSON.stringify(source),draft=emptyDraft(),original=resolveTheme(source,'light')['color.action.utility.fill'];draft.themes.light['weight.utility.fill']=.9;
 const compiled=compileDraft(JSON.parse(JSON.stringify(draft)));assert.notEqual(compiled.resolved.light['color.action.utility.fill'],original);assert.equal(JSON.stringify(source),before);assert.ok(artifacts(compiled.document)['tokens.css']);
 assert.throws(()=>compileDraft({...draft,baseVersion:'0.0.1'}),/version/);const invalid=emptyDraft();invalid.shared['page.position.x']=30;assert.throws(()=>compileDraft(invalid),/Unknown/);invalid.shared={'radius.card':'url(https://example.test)'};assert.throws(()=>compileDraft(invalid),/dimension/);
});
test('shared shell preserves native controls, unique menu targets and host role semantics',()=>{
 const first=headerBar({roleLabel:'Switch to Marketer, current Creator',items:menuItem('Workspace',{href:'/workspace'})});
 const second=headerBar({items:menuItem('Sign out')});
 const id=first.match(/aria-controls="([^"]+)"/)[1];
 assert.match(first,new RegExp('id="'+id+'"'));
 assert.notEqual(id,second.match(/aria-controls="([^"]+)"/)[1]);
 assert.match(first,/aria-label="Switch to Marketer, current Creator"/);
 assert.doesNotMatch(first,/data-emphasis|class="cu-action/);
 assert.match(first,/<a class="cu-menu-item" href="\/workspace"/);
 assert.match(second,/<button class="cu-menu-item" type="button"/);
 assert.throws(()=>menuItem('Unsafe',{href:'javascript:alert(1)'}),/Unsafe/);
 const message=banner({tone:'info',body:'Check the latest status.'});
 assert.doesNotMatch(message,/<strong><\/strong>/);
 assert.match(message,/cu-banner-copy/);
});
test('recovery groups keep native controls outside message live regions',()=>{
 const html=feedbackBlock({tone:'warning',title:'Status not confirmed',body:'Read the current status first.',actions:[{label:'Refresh',icon:'refresh'},{label:'My jobs',href:'/jobs'}]});
 const end=html.indexOf('</section>'),message=html.slice(0,end);
 assert.ok(end>0);assert.doesNotMatch(message,/<(?:button|a)\b/);
 assert.match(html.slice(end),/^<\/section><div class="cu-feedback-actions">/);
 assert.match(html,/<button[^>]*type="button"/);assert.match(html,/<a[^>]*href="\/jobs"/);
 assert.match(html,/data-secondary="recovery"/);
 assert.throws(()=>feedbackBlock({body:'Message',actions:'<button>Retry</button>'}),/array/);
 assert.throws(()=>feedbackBlock({body:'Message',actions:[{label:''}]}),/labels/);
});
test('all message shapes retain one copy column and no empty title gap',()=>{
 for(const content of [{title:'Heading only'},{body:'Body only'},{title:'Heading',body:'Long explanation'}]){
  const html=banner({...content,id:'feedback',focusable:true});
  assert.equal((html.match(/<svg /g)||[]).length,1);assert.equal((html.match(/cu-banner-copy/g)||[]).length,1);
  assert.doesNotMatch(html,/<strong[^>]*><\/strong>|<p><\/p>/);
  assert.match(html,/id="feedback" tabindex="-1"/);
 }
 assert.throws(()=>banner({title:' ',body:''}),/message/);
 assert.match(banner({tone:'info',body:'Checking status…',pending:true}),/role="status"[\s\S]*cu-icon-spinner/);
 assert.throws(()=>banner({tone:'error',body:'Failed',pending:true}),/informational/);
});
