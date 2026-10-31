import test from 'node:test';
import assert from 'node:assert/strict';
import * as completion from '../US-027/demo/state-machine.mjs';
import * as cancellation from '../US-028/demo/state-machine.mjs';
import * as start from '../US-025/demo/state-machine.mjs';
import * as proof from '../US-026/demo/state-machine.mjs';
import {operationJournal,restoreMutation} from '../theme/operations.mjs';

test('same-tab return restores uncertainty without retaining write intent; author snapshots remain independent',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const journal=operationJournal('test',{storage,now:()=>100});
 journal.write({scene:'A03',fixture:'standard',phase:'pending',snapshot:completion.seed('A05')});
 assert.equal(journal.read({fixture:'standard',explicitScenario:true,navigationType:'navigate'}),null);
 assert.equal(journal.read({fixture:'long',navigationType:'back_forward'}),null);
 for(const navigationType of ['back_forward','reload']){
  const restored=restoreMutation(journal.read({fixture:'standard',explicitScenario:true,navigationType}));
  assert.equal(restored.pending,null);assert.equal(restored.modal,null);assert.equal(restored.message,'unknown');
  assert.equal(completion.reduce(restored,{type:'confirm'}),restored);
  assert.equal(completion.reduce(restored,{type:'complete'}),restored);
 }
 journal.write({scene:'A03',fixture:'standard',phase:'settled',snapshot:{...completion.seed('A06'),pending:null}});
 assert.equal(restoreMutation(journal.read({fixture:'standard'})).status,'Completed');
 journal.clear();assert.equal(journal.read({fixture:'standard'}),null);
});

test('storage denial and malformed local journals never trap the interface',()=>{
 const denied=operationJournal('test',{storage:{getItem(){throw Error('denied');},setItem(){throw Error('denied');},removeItem(){throw Error('denied');}}});
 assert.equal(denied.read({fixture:'standard'}),null);assert.doesNotThrow(()=>denied.write({}));assert.doesNotThrow(()=>denied.clear());
 const corrupt=operationJournal('test',{storage:{getItem:()=>'{broken'}});assert.equal(corrupt.read({fixture:'standard'}),null);
});

test('pending dialogs may close and reopen without cancelling or duplicating the operation',()=>{
 for(const model of [completion,cancellation]){
  let s=model.seed('A05');const pending=s.pending;
  s=model.reduce(s,{type:'dismiss'});assert.equal(s.modal,null);assert.equal(s.pending,pending);
  assert.equal(model.reduce(s,{type:'confirm'}),s);
  s=model.reduce(s,{type:'reopen'});assert.equal(s.modal,'confirm');assert.equal(s.pending,pending);
  s=model.reduce(s,{type:'dismiss'});s=model.reduce(s,{type:'resolve',outcome:'success'});
  assert.equal(s.modal,null);assert.equal(s.pending,null);assert.equal(s.status,model===completion?'Completed':'Cancelled');
  assert.equal(model.reduce(s,{type:'resolve',outcome:'success'}),s);
 }
});
test('a stalled mutation becomes unknown and failed reconciliation cannot enable a duplicate command',()=>{
 for(const[model,command]of [[completion,'complete'],[cancellation,'cancel-job']]){
  let s=model.reduce(model.seed('A05'),{type:'timeout'});assert.equal(s.pending,null);assert.equal(s.message,'unknown');assert.equal(model.reduce(s,{type:command}),s);
  s=model.reduce(s,{type:'check'});s=model.reduce(s,{type:'timeout'});assert.match(s.message,/unknown/);assert.equal(model.reduce(s,{type:command}),s);
 }
});
test('background completion rejection reports the missing requirement without reopening a modal',()=>{
 let s=completion.reduce(completion.seed('A05'),{type:'dismiss'});
 s=completion.reduce(s,{type:'resolve',outcome:'proof-missing'});
 assert.equal(s.modal,null);assert.equal(s.status,'In Progress');assert.equal(s.proof,0);assert.equal(s.message,'requirements-changed');
});
test('offline Start opens feedback and pending Start remains single-submit through dismissal',()=>{
 let offline=start.createDemoState({scenarioId:'R11'});let t=start.transitionDemo(offline,{type:'OPEN_CONFIRM'});
 assert.equal(t.state.offlineNotice,true);assert.equal(t.state.confirmationOpen,false);assert.deepEqual(t.effects,[]);
 assert.equal(start.transitionDemo(t.state,{type:'CONFIRM_START'}).state.startPostCount,0);
 let s=start.createDemoState({scenarioId:'C01'});s=start.transitionDemo(s,{type:'CONFIRM_START'}).state;s=start.transitionDemo(s,{type:'ESCAPE'}).state;
 assert.equal(s.confirmationOpen,false);assert.equal(s.pending,true);s=start.transitionDemo(s,{type:'REOPEN_PROGRESS'}).state;
 assert.equal(s.confirmationOpen,true);assert.deepEqual(start.transitionDemo(s,{type:'CONFIRM_START'}).effects,[]);assert.equal(s.startPostCount,1);
});
test('a timed-out proof save retains its draft and requires a read before another save',()=>{
 let s=proof.createDemoState('A03');const draft=s.draft;s=proof.reduceDemoState(s,{type:'timeout'});
 assert.equal(s.scenarioId,'B03');assert.equal(s.draft,draft);assert.equal(s.rows.length,0);assert.equal(proof.canSubmitProof(s),false);
 assert.equal(proof.reduceDemoState(s,{type:'submit'}),s);
 s=proof.reduceDemoState(s,{type:'check-saved'});s=proof.reduceDemoState(s,{type:'resolve-check',outcome:'available'});
 assert.equal(s.scenarioId,'B04');assert.equal(s.pending,null);
});
