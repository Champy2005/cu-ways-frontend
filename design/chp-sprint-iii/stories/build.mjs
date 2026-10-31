import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {newStories} from './scope.mjs';
export const stories=newStories;
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const n of stories){
 const model=JSON.parse(fs.readFileSync(path.join(root,`US-${n}/model/scenarios.json`),'utf8'));
 if(model.story!==`US-${n}`||!model.canonical||!model.criteria.length||!model.scenarios.length)throw Error('Invalid model '+n);
 const ids=new Set();for(const s of model.scenarios){if(ids.has(s.id)||!s.title||!s.trigger||!s.expected)throw Error('Invalid scenario '+n+' '+s.id);ids.add(s.id);}
 const text='// GENERATED from ../model/scenarios.json by ../../stories/build.mjs.\nexport default '+JSON.stringify(model,null,2)+';\n';
 const target=path.join(root,`US-${n}/demo/scenarios.mjs`);
 if(process.argv.includes('--check')){if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==text)throw Error('Stale generated model '+n);}else fs.writeFileSync(target,text);
 console.log(`${model.story}: ${ids.size} canonical scenarios ${process.argv.includes('--check')?'current':'generated'}`);
}
