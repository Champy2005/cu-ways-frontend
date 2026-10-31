import {action,backLink,esc} from './components.mjs';
/* Declarative shell markers use the same canonical renderers as product screens.
   Only known geometry classes are preserved; no page-owned paint/style injection. */
export function mountStaticComponents(root=document){
 for(const marker of root.querySelectorAll('[data-cu-component]')){
  const label=marker.textContent.trim(),kind=marker.dataset.cuComponent;
  const attrs=[...marker.attributes].filter(a=>a.name==='id'||a.name==='title'||a.name.startsWith('aria-')||a.name.startsWith('data-lab')).map(a=>`${a.name}="${esc(a.value)}"`).join(' ');
  const html=kind==='back'?backLink(label,{href:marker.getAttribute('href')??'#',attrs}):kind==='action'?action(label,{href:marker.hasAttribute('href')?marker.getAttribute('href'):undefined,variant:marker.dataset.variant??'utility',disabled:marker.dataset.disabled==='true',attrs}):null;
  if(!html)throw Error('Unknown static component marker '+kind);const template=document.createElement('template');template.innerHTML=html;const element=template.content.firstElementChild;
  const layout=marker.dataset.layoutClass;if(layout){if(!['control-button','author-theme-link'].includes(layout))throw Error('Unregistered shell geometry class '+layout);element.classList.add(layout);}
  marker.replaceWith(element);
 }
}
