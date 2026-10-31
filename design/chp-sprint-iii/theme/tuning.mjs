/* Browser-only, validated draft proposals. This never edits canonical source. */
import source from './source.mjs';
import {resolveTheme,effects,variable} from './engine.mjs';
export const draftKey='cuways.theme-draft.'+source.meta.version;
export function emptyDraft(){return {schemaVersion:1,kind:'cuways-theme-draft',baseVersion:source.meta.version,shared:{},themes:{light:{},dark:{}}};}
export function compileDraft(draft) {
 if (!draft || draft.kind!=='cuways-theme-draft' || draft.schemaVersion!==1 || draft.baseVersion!==source.meta.version) throw Error('Draft must match theme version '+source.meta.version);
 const doc=structuredClone(source),sections=[['shared',draft.shared,doc.shared],['light',draft.themes?.light,doc.themes.light],['dark',draft.themes?.dark,doc.themes.dark]];
 for (const [name,values,tokens] of sections) {
  if (!values || typeof values!=='object' || Array.isArray(values)) throw Error('Invalid draft section: '+name);
  for (const [key,value] of Object.entries(values)) {
   const token=tokens[key]; if (!token || token.$type==='string') throw Error('Unknown or non-editable token: '+key);
   if (key==='rim.headerTop' && value!=='0px') throw Error('Header top rim is fixed at 0px by the current preference');
   if (typeof value!=='string' && typeof value!=='number') throw Error('Draft values must be literals');
   if (['number','duration'].includes(token.$type) && (typeof value!=='number' || value<0 || value>10000)) throw Error('Invalid numeric draft value: '+key);
   token.$value=value;
  }
 }
 const resolved={light:resolveTheme(doc,'light'),dark:resolveTheme(doc,'dark')};
 return {document:doc,resolved,effects:{light:effects(resolved.light,false),dark:effects(resolved.dark,true)}};
}
export function readDraft() {
 try {const text=localStorage.getItem(draftKey);if(!text)return {draft:emptyDraft(),active:false,error:null};if(text.length>150000)throw Error('Draft too large');const draft=JSON.parse(text);compileDraft(draft);return {draft,active:true,error:null};}
 catch(error){return {draft:emptyDraft(),active:false,error:'Saved draft ignored: '+error.message};}
}
export function saveDraft(draft){compileDraft(draft);localStorage.setItem(draftKey,JSON.stringify(draft));window.dispatchEvent(new CustomEvent('cu-theme-draft'));}
export function resetDraft(){localStorage.removeItem(draftKey);window.dispatchEvent(new CustomEvent('cu-theme-draft'));}
export function applyDraft(root,mode='light') {
 const state=readDraft(),compiled=compileDraft(state.draft),tokens=compiled.resolved[mode==='dark'?'dark':'light'],fx=compiled.effects[mode==='dark'?'dark':'light'];
 const definitions={...source.shared,...source.themes[mode==='dark'?'dark':'light']};
 for (const [key,value] of Object.entries(tokens)) root.style.setProperty(variable(key),value+(definitions[key].$type==='duration'?'ms':''));
 for (const [key,value] of Object.entries(fx)) root.style.setProperty(variable(key),value);
 return {active:state.active,error:state.error};
}
export function subscribeDraft(callback){const storage=e=>{if(!e.key||e.key===draftKey)callback();};window.addEventListener('storage',storage);window.addEventListener('cu-theme-draft',callback);return()=>{window.removeEventListener('storage',storage);window.removeEventListener('cu-theme-draft',callback);};}
