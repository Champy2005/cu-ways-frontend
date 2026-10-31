import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as completion from '../US-027/demo/state-machine.mjs';
import * as cancellation from '../US-028/demo/state-machine.mjs';
import * as profile from '../US-034/demo/state-machine.mjs';
import {newStories,handoffStories,handoffStateCount} from './scope.mjs';

test('handoff contains exactly Chp stories and their 94 canonical states',()=>{
 assert.deepEqual(newStories,['027','028','034']);
 assert.deepEqual(handoffStories,['025','026','027','028','034']);
 const count=handoffStories.reduce((sum,n)=>sum+JSON.parse(fs.readFileSync(new URL(`../US-${n}/model/scenarios.json`,import.meta.url))).scenarios.length,0);
 assert.equal(count,handoffStateCount);assert.equal(count,94);
});
test('completion independently guards proof, payment, selected offer and lifecycle',()=>{
 for(const id of ['A01','B01','B02','B03','B04']){const s=completion.reduce(completion.seed(id),{type:'complete'});assert.equal(s.modal,'blocked');assert.equal(completion.reduce(s,{type:'confirm'}).pending,null);}
 assert.deepEqual(completion.blockers(completion.seed('A03')),[]);
 let s=completion.reduce(completion.seed('A03'),{type:'complete'});s=completion.reduce(s,{type:'confirm'});assert.equal(s.pending,'complete');assert.equal(completion.reduce(s,{type:'confirm'}),s);const hidden=completion.reduce(s,{type:'dismiss'});assert.equal(hidden.pending,'complete');assert.equal(hidden.modal,null);assert.equal(completion.reduce(hidden,{type:'reopen'}).modal,'confirm');
 s=completion.reduce(s,{type:'resolve',outcome:'proof-missing'});assert.equal(s.status,'In Progress');assert.equal(s.modal,'blocked');assert.equal(s.proof,0);
});
test('only unpaid incomplete contracts cancel and confirmed related records change once',()=>{
 for(const status of ['Pending','Accepted','In Progress'])assert.equal(cancellation.eligible({...cancellation.seed('A03'),status}),true);
 for(const id of ['B01','B02','B03','B04'])assert.equal(cancellation.reduce(cancellation.seed(id),{type:'cancel-job'}).modal,null);
 let s=cancellation.reduce(cancellation.seed('A04'),{type:'confirm'});const hidden=cancellation.reduce(s,{type:'dismiss'});assert.equal(hidden.pending,'cancel');assert.equal(hidden.modal,null);assert.equal(cancellation.reduce(hidden,{type:'reopen'}).modal,'confirm');
 s=cancellation.reduce(s,{type:'resolve',outcome:'success'});assert.equal(s.status,'Cancelled');assert.equal(s.requests,0);assert.equal(s.offers,0);assert.equal(cancellation.reduce(s,{type:'confirm'}),s);
});
test('Paid and Completed cancellation races do not close requests or reject offers',()=>{
 for(const outcome of ['paid','completed']){const s=cancellation.reduce(cancellation.seed('A05'),{type:'resolve',outcome});assert.equal(cancellation.eligible(s),false);assert.equal(s.requests,2);assert.equal(s.offers,3);assert.notEqual(s.status,'Cancelled');}
});
test('unknown completion/cancellation outcomes reconcile without duplicate operations',()=>{
 for(const[m,attempt]of [[completion,'complete'],[cancellation,'cancel-job']]){
  let s=m.reduce(m.seed('A05'),{type:'resolve',outcome:'unknown'});assert.equal(s.message,'unknown');assert.equal(m.reduce(s,{type:attempt}),s);
  for(let i=0;i<2;i++){s=m.reduce(s,{type:'check'});s=m.reduce(s,{type:'resolve',read:'failed'});assert.match(s.message,/unknown/);assert.equal(m.reduce(s,{type:attempt}),s);}
  s=m.reduce(s,{type:'check'});s=m.reduce(s,{type:'resolve',read:'missing'});assert.equal(s.message,'unchanged');assert.equal(s.pending,null);
 }
});
test('profile cards and aggregates exclude invalid or nonqualifying records and use null when empty',()=>{
 const s=profile.seed('B01');assert.equal(profile.qualifying(s.rows).length,7);assert.equal(profile.summary(s.rows).count,7);assert.equal(profile.qualifying(s.rows).some(r=>r.id>=97),false);assert.equal(profile.summary([]).average,null);assert.equal(profile.summary([]).count,0);
});
test('profile pagination stays bounded and a rating filter resets the page',()=>{
 let s=profile.seed('A01');for(let i=0;i<10;i++)s=profile.reduce(s,{type:'next'});assert.equal(s.page,3);
 s=profile.reduce(s,{type:'filter',filter:'1'});assert.equal(s.page,1);assert.equal(profile.qualifying(s.rows).filter(r=>r.rating===1).length,0);
 s=profile.reduce(s,{type:'previous'});assert.equal(s.page,1);
});
