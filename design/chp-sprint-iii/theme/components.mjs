/* Shared DOM markup recipes. Labels/copy are escaped; attrs is trusted author markup,
   never page/user input. Navigation keeps anchor semantics regardless of appearance. */
import artwork from './artwork.mjs';
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {
  refresh:'M21 10a9 9 0 1 0-2.3 8M21 4v6h-6',
  spinner:'M12 3a9 9 0 1 1-9 9', chevron:'m14 6-6 6 6 6',
  home:'m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9',
  services:'M3 7h18v14H3zM8 7V3h8v4M3 12h18M10 11v3h4v-3',
  jobs:'M8 4H4v18h16V4h-4M8 2h8v5H8zM8 12h8M8 17h8',
  invites:'M3 4h18v14H8l-5 4z', profile:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 22v-2a8 8 0 0 1 16 0v2z',
  menu:'M3 6h18M3 12h18M3 18h18', close:'m5 5 14 14M5 19 19 5',
  sun:'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
  moon:'M21 13A9 9 0 0 1 11 3 9 9 0 1 0 21 13Z',
  warning:'m12 3 10 18H2zM12 9v5M12 17h.01', check:'m5 12 4 4L19 6',
  info:'M12 8h.01M12 11v6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  clock:'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  more:'M5 12h.01M12 12h.01M19 12h.01',
  external:'M14 3h7v7M21 3 10 14M10 3H3v18h18v-7'
};
paths['person-check']='M9 11a4 4 0 1 0 0-8 4 4 0 1 0 0 8M2 21v-2c0-5 14-5 14 0v2M16 10l2 2 4-5';
paths['sealed-check']='M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18M7 12l3 3 7-7';
const solid = {
 home:'<path d="M3 10.5 12 2.5l9 8V22h-7v-8h-4v8H3z"/>',
 services:'<path d="M3 6h18v16H3z"/><path d="M8 6V3h8v3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M10 12v3h4v-3" fill="none" stroke="var(--cu-nav-cutout)" stroke-width="1.8"/>',
 jobs:'<path d="M4 5h16v18H4z"/><path d="M8 2h8v6H8z" stroke="var(--cu-nav-cutout)" stroke-width="1.4"/><path d="M8 12h8M8 17h8" stroke="var(--cu-nav-cutout)" stroke-width="1.8"/>',
 invites:'<path d="M2 3h20v16H9l-7 4z"/><path d="M6 8h12M6 13h8" stroke="var(--cu-nav-cutout)" stroke-width="1.6"/>',
 profile:'<circle cx="12" cy="7" r="4.5"/><path d="M3 22c0-11 18-11 18 0z"/>'
};

export function icon(name,{className=''}={}) {
 if (!Object.hasOwn(paths,name)) throw new Error('Unknown shared icon: '+name);
 return `<svg class="cu-icon ${name==='spinner'?'cu-icon-spinner ':''}${esc(className)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${name==='more'?'<g fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></g>':`<path d="${paths[name]}"/>`}</svg>`;
}
const hrefValue = value => {
 const s=String(value??'#');
 if (/^(?:javascript|data|vbscript):/i.test(s.trim()) || /[\u0000-\u001f]/.test(s)) throw Error('Unsafe navigation target');
 return esc(s);
};
export function action(label,{emphasis='secondary',secondary='utility',intent,href,attrs='',disabled=false,busy=false,icon:iconName,format,variant,type='button'}={}) {
 if (!['primary','secondary','tertiary'].includes(emphasis) || !['utility','entry','recovery'].includes(secondary)) throw Error('Unknown action role');
 const resolvedVariant=variant??(emphasis==='primary'?'primary':emphasis==='tertiary'?'quiet':secondary==='entry'?'tonal':'utility');
 if(!['primary','secondary','tonal','outline','utility','quiet'].includes(resolvedVariant))throw Error('Unknown action variant');
 const effectiveEmphasis=resolvedVariant==='primary'?'primary':resolvedVariant==='quiet'?'tertiary':'secondary';
 const inert=disabled||busy, tag=href===undefined?'button':'a';
 if(!['button','submit','reset'].includes(type))throw Error('Unknown button type');
 const target=tag==='a'?(inert?' role="link" aria-disabled="true" tabindex="-1"':` href="${hrefValue(href)}"`):` type="${type}"${inert?' disabled':''}`;
 return `<${tag} class="cu-action" data-emphasis="${effectiveEmphasis}" data-variant="${resolvedVariant}" data-secondary="${secondary}"${intent?` data-intent="${esc(intent)}"`:''}${format?` data-format="${esc(format)}"`:''}${target}${busy?' aria-busy="true"':''}${disabled?' data-disabled="true"':''} ${attrs}>${busy?icon('spinner'):iconName?icon(iconName):''}<span${format==='compact'?' class="cu-sr-only"':''}>${esc(label)}</span></${tag}>`;
}
/* One borderless close atom for content dialogs; hit area stays visible to keyboard. */
export function closeControl(label='Close',{attrs=''}={}) {
 return `<button type="button" class="cu-close" aria-label="${esc(label)}" ${attrs}>${icon('close')}<span class="cu-sr-only">${esc(label)}</span></button>`;
}
export function loadingScaffold(kind,title,actions=[]) {
 if(kind==='reviews'){
  const lines='<div class="cu-loading-lines" aria-hidden="true"><span></span><span></span><span></span></div>';
  return `<div class="cu-loading-layout" data-loading-kind="reviews"><div class="cu-loading-context"><section class="cu-loading-card" data-loading-shape="profile">${operationNotice({title,actions})}${lines}</section><section class="cu-loading-card" data-loading-shape="ratings" aria-hidden="true">${lines}</section></div><section class="cu-loading-card" data-loading-shape="history" aria-hidden="true">${lines}${lines}${lines}</section></div>`;
 }
 const shapes=kind==='reviews'?['profile','history']:kind==='proof'?['proof']:['summary','task','context'];
 return `<div class="cu-loading-layout" data-loading-kind="${esc(kind)}">${shapes.map((shape,i)=>`<section class="cu-loading-card" data-loading-shape="${shape}">${i===0?operationNotice({title,actions}):''}<div class="cu-loading-lines" aria-hidden="true"><span></span><span></span><span></span></div></section>`).join('')}</div>`;
}
export function backLink(label,{inside=false,href='#',attrs=''}={}) {
 return `<a href="${hrefValue(href)}" class="cu-back-link" data-navigation-context="${inside?'card':'page'}" ${attrs}>${icon('chevron')}<span>${esc(label)}</span></a>`;
}
export function attachmentTag(label='Proof') {
 return `<span class="cu-attachment">${icon('jobs')}<span>${esc(label)}</span></span>`;
}
export function evidenceLink(value) {
 let url;try{url=new URL(value);}catch{return `<span>${esc(value)}</span>`;}
 if(!['http:','https:'].includes(url.protocol))return `<span>${esc(value)}</span>`;
 const path=(url.pathname+url.search+url.hash).replace(/^\/$/,'');
 const wrapped=esc(path).replaceAll('/','/<wbr>').replaceAll('-','-<wbr>').replaceAll('?','?<wbr>').replaceAll('&amp;','&amp;<wbr>');
 return `<a class="cu-evidence-link" href="${hrefValue(url.href)}" title="${esc(url.href)}" aria-label="${esc(url.href)} (opens in a new tab)" target="_blank" rel="noopener noreferrer"><span class="cu-evidence-host">${esc(url.protocol+'//'+url.host)}</span>${icon('external')}${path?`<span class="cu-evidence-path">${wrapped}</span>`:''}</a>`;
}
export function operationNotice({title,actions=[]}={}) {
 return `<section class="cu-operation"><div class="cu-operation-message" role="status">${icon('spinner')}<strong>${esc(title)}</strong></div>${actions.length?`<div class="cu-operation-actions">${actions.map(({label,...options})=>action(label,{variant:'utility',...options})).join('')}</div>`:''}</section>`;
}
export function banner({tone='error',title='',body='',id,focusable=false,pending=false}={}) {
 if (!['error','info','success','neutral','warning'].includes(tone)) throw Error('Unknown feedback tone');
 if (!String(title).trim()&&!String(body).trim()) throw Error('Feedback needs a message');
 if (pending&&!['info','neutral'].includes(tone)) throw Error('Pending feedback uses an informational tone');
 const signal=icon(pending?'spinner':tone==='error'||tone==='warning'?'warning':tone==='success'?'check':'info');
 const message=`<div class="cu-banner-copy">${title?`<strong class="cu-banner-heading">${esc(title)}</strong>`:''}${body?`<p>${esc(body)}</p>`:''}</div>`;
 return `<section class="cu-banner" data-tone="${tone}" role="${tone==='error'?'alert':'status'}"${id?` id="${esc(id)}"`:''}${focusable?' tabindex="-1"':''}>${signal}${message}</section>`;
}
/* Recovery controls belong to the message but never to its painted live region.
   Structured descriptors use the same native action renderer as other controls. */
export function feedbackBlock({actions=[],...message}={}) {
 if (!Array.isArray(actions)) throw Error('Feedback actions must be an array');
 const controls=actions.map(({label,...options})=>{
  if (!String(label??'').trim()) throw Error('Feedback actions need labels');
  return action(label,{secondary:'recovery',...options});
 }).join('');
 return `<div class="cu-feedback">${banner(message)}${controls?`<div class="cu-feedback-actions">${controls}</div>`:''}</div>`;
}
export function badge(label,tone='neutral',{icon:iconName,attrs=''}={}) {
 if (!['info','progress','success','neutral'].includes(tone)) throw Error('Unknown status tone');
 return `<span class="cu-status" data-tone="${tone}" ${attrs}>${icon(iconName??(tone==='success'?'sealed-check':tone==='progress'?'clock':tone==='neutral'?'close':'info'))}<span>${esc(label)}</span></span>`;
}
/* Lifecycle meaning is canonical; callers may not override icon/tone. */
export const lifecycleDefinitions=Object.freeze({
 Pending:{tone:'neutral',icon:'clock'},Accepted:{tone:'info',icon:'person-check'},
 'In Progress':{tone:'progress',icon:'clock'},Completed:{tone:'success',icon:'sealed-check'},
 Cancelled:{tone:'neutral',icon:'close'},Paid:{tone:'success',icon:'sealed-check'},
 Unverified:{tone:'neutral',icon:'warning'},'Status unavailable':{tone:'neutral',icon:'warning'}
});
export function verificationBadge(label='Verified',{attrs=''}={}){return badge(label,'success',{attrs:'data-verification="true" '+attrs});}
export function lifecycleBadge(value,{attrs=''}={}) {
 const label=Object.hasOwn(lifecycleDefinitions,value)?value:'Status unavailable',definition=lifecycleDefinitions[label];
 return badge(label,definition.tone,{icon:definition.icon,attrs:('data-lifecycle="'+esc(label)+'" '+attrs)});
}
export function navItem(label,iconName,{href='#',active=false,attrs=''}={}) {
 if (!solid[iconName]) throw Error('Unknown navigation icon');
 const glyph=`<svg class="cu-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g class="cu-icon-solid" fill="currentColor" stroke="none">${solid[iconName]}</g><path class="cu-icon-outline" d="${paths[iconName]}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
 return `<a class="cu-nav-item" href="${hrefValue(href)}"${active?' aria-current="page"':''} ${attrs}>${glyph}<span>${esc(label)}</span></a>`;
}
let artworkId=0;
export function brand(theme='light') {
 let svg=artwork[theme==='dark'?'logo-dark':'logo-light'];const prefix='cu-brand-'+(++artworkId)+'-';
 svg=svg.replace(/id="([^"]+)"/g,(_,id)=>`id="${prefix+id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${prefix+id})`);
 return svg.replace('<svg ','<svg class="cu-brand" role="img" aria-label="CU Ways" ');
}
export function roleBirds(theme='light') {
 let svg=artwork[theme==='dark'?'birds-dark':'birds-light'];const prefix='cu-birds-'+(++artworkId)+'-';
 svg=svg.replace(/id="([^"]+)"/g,(_,id)=>`id="${prefix+id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${prefix+id})`);
 return svg.replace('<svg ','<svg class="cu-role-birds" aria-hidden="true" focusable="false" ');
}

/* Shell controls are not emphasis-tier actions. Keep this markup shared by the
   workbench and stories so hit targets never turn into bordered action cards. */
export function headerControl(label,{icon:iconName,content,attrs='',role=false,kind=''}={}) {
 return `<button class="cu-header-control${role?' cu-header-role':''}" type="button" aria-label="${esc(label)}"${kind?` data-header-control="${esc(kind)}"`:''} ${attrs}>${content??icon(iconName)}<span class="cu-sr-only">${esc(label)}</span></button>`;
}
export function menuItem(label,{href,attrs=''}={}) {
 const tag=href===undefined?'button':'a';
 return `<${tag} class="cu-menu-item"${tag==='button'?' type="button"':` href="${hrefValue(href)}"`} ${attrs}>${esc(label)}</${tag}>`;
}
let headerId=0;
export function headerBar({theme='light',material='opaque',menuOpen=false,menuId='cu-menu-'+(++headerId),brandHref='#',brandAttrs='',nav='',themeAttrs='',roleAttrs='',menuAttrs='',roleLabel='Switch workspace role',items='',attrs='',className=''}={}) {
 const next=theme==='light'?'dark':'light';
 return `<header class="cu-bar cu-bar--top cu-header ${esc(className)}" data-material="${esc(material)}" data-menu-open="${menuOpen}" ${attrs}>
   <div class="cu-header-row"><a class="cu-header-brand" href="${hrefValue(brandHref)}" aria-label="CU Ways" ${brandAttrs}>${brand(theme)}</a>${nav}
   <div class="cu-header-tools">${headerControl(`Switch to ${next} theme`,{icon:theme==='light'?'sun':'moon',kind:'theme',attrs:themeAttrs})}${headerControl(roleLabel,{content:roleBirds(theme),role:true,kind:'role',attrs:roleAttrs})}${headerControl(menuOpen?'Close menu':'Menu',{icon:menuOpen?'close':'menu',kind:'menu',attrs:`aria-expanded="${menuOpen}" aria-controls="${esc(menuId)}" ${menuAttrs}`})}</div></div>
   <nav id="${esc(menuId)}" class="cu-attached-menu cu-header-menu" aria-label="Workspace menu" ${menuOpen?'':'hidden'}>${items}</nav>
 </header>`;
}
export function bottomBar(items,{material='opaque',attrs='',className=''}={}) {
 return `<nav class="cu-bar cu-bar--bottom cu-nav--compact cu-bottom-nav ${esc(className)}" data-material="${esc(material)}" ${attrs}>${items}</nav>`;
}
export function positionNavigationTile(nav,{animate=false}={}) {
 const current=nav?.querySelector('[aria-current="page"]'),tile=nav?.querySelector('.cu-nav-tile');
 if (!current||!tile) return;
 const rect=current.getBoundingClientRect(),parent=nav.getBoundingClientRect();
 if(!rect.width||!parent.width){tile.style.inlineSize='';tile.style.transform='';tile.dataset.positioned='false';return;}
 const motion=animate&&tile.dataset.positioned==='true';
 if(!motion)tile.style.transition='none';
 tile.style.inlineSize=rect.width+'px';
 tile.style.transform=`translateX(${rect.left-parent.left+nav.scrollLeft-nav.clientLeft}px)`;
 if(!motion){void tile.offsetWidth;tile.style.removeProperty('transition');}
 tile.dataset.positioned='true';
}
export function observeNavigationTile(nav) {
 if(!nav)return()=>{};
 const update=()=>positionNavigationTile(nav),observer=new ResizeObserver(update);
 update();
 observer.observe(nav);
 for(const item of nav.querySelectorAll('.cu-nav-item'))observer.observe(item);
 return()=>observer.disconnect();
}
/* Fit captions, not just the document width. A no-overflow page can still have
   overlapping labels inside five fixed columns at enlarged text. */
export function fitCompactNavigation(nav) {
 if(!nav)return;
 const items=[...nav.querySelectorAll('.cu-nav-item')];
 if(!items.length)return;
 const style=getComputedStyle(nav),available=nav.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
 const caption=Math.max(...items.map(item=>item.querySelector('span')?.getBoundingClientRect().width??0));
 const target=parseFloat(getComputedStyle(items[0]).minInlineSize)||44;
 const maximum=Math.max(1,Math.min(items.length,Math.floor(available/Math.max(target,caption+2))));
 const rows=Math.ceil(items.length/maximum),columns=Math.ceil(items.length/rows);
 nav.style.setProperty('--cu-nav-columns',columns);
 nav.dataset.rows=String(rows);
}
export function observeCompactNavigation(nav) {
 if(!nav)return()=>{};
 const update=()=>fitCompactNavigation(nav),observer=new ResizeObserver(update);
 update();observer.observe(nav);
 for(const item of nav.querySelectorAll('.cu-nav-item>span'))observer.observe(item);
 return()=>observer.disconnect();
}
// Native focus scrolling does not always account for a floating action tray or
// fixed navigation. Keep ordinary page focus clear of actual rendered chrome.
export function keepFocusVisible(root) {
 const onFocus=event=>{const target=event.target;if(!(target instanceof HTMLElement)||target.closest('dialog'))return;
  requestAnimationFrame(()=>{
   if(document.activeElement!==target||!target.isConnected)return;
   const bars=[...document.querySelectorAll('.cu-header,.cu-bottom-nav,.cu-action-tray')].filter(el=>el.getClientRects().length&&['fixed','sticky'].includes(getComputedStyle(el).position));
   if(bars.some(el=>el.contains(target)))return;
   let top=0,bottom=innerHeight;
   for(const bar of bars){const r=bar.getBoundingClientRect();if(bar.classList.contains('cu-header')&&r.top<=1)top=Math.max(top,r.bottom);else if(!bar.classList.contains('cu-header'))bottom=Math.min(bottom,r.top);}
   const r=target.getBoundingClientRect(),clear=8,available=bottom-top-2*clear;
   // Native centering also applies CSS scroll-padding. At enlarged text that
   // padding can be larger than the real header and place focus under the nav.
   // Scroll by the actual missing clearance in this document's visible band.
   let delta=0;
   if(r.height>available||r.top<top+clear)delta=r.top-top-clear;
   else if(r.bottom>bottom-clear)delta=r.bottom-bottom+clear;
   if(Math.abs(delta)>1)window.scrollBy({top:delta,left:0,behavior:'instant'});
  });
 };
 root.addEventListener('focusin',onFocus);return()=>root.removeEventListener('focusin',onFocus);
}
