import test from 'node:test';
import assert from 'node:assert/strict';
import * as completion from '../US-027/demo/state-machine.mjs';
import * as cancellation from '../US-028/demo/state-machine.mjs';
import * as payment from '../US-029/demo/state-machine.mjs';
import * as history from '../US-032/demo/state-machine.mjs';
import * as review from '../US-033/demo/state-machine.mjs';
import * as profile from '../US-034/demo/state-machine.mjs';

test('completion checks proof, payment, accepted offer and lifecycle independently',()=>{
 for(const id of ['A01','B01','B02','B03','B04']){const s=completion.reduce(completion.seed(id),{type:'complete'});assert.equal(s.modal,'blocked');assert.equal(completion.reduce(s,{type:'confirm'}).pending,null);}
 const ready=completion.seed('A03');assert.deepEqual(completion.blockers(ready),[]);
 let s=completion.reduce(ready,{type:'complete'});s=completion.reduce(s,{type:'confirm'});assert.equal(s.pending,'complete');assert.equal(completion.reduce(s,{type:'confirm'}),s);assert.equal(completion.reduce(s,{type:'dismiss'}),s);
 s=completion.reduce(s,{type:'resolve',outcome:'proof-missing'});assert.equal(s.status,'In Progress');assert.equal(s.modal,'blocked');assert.equal(s.proof,0);
});
test('cancellation is limited to unpaid incomplete contracts and updates related records once',()=>{
 for(const status of ['Pending','Accepted','In Progress'])assert.equal(cancellation.eligible({...cancellation.seed('A03'),status}),true);
 for(const id of ['B01','B02','B03','B04'])assert.equal(cancellation.reduce(cancellation.seed(id),{type:'cancel-job'}).modal,null);
 let s=cancellation.reduce(cancellation.seed('A04'),{type:'confirm'});assert.equal(cancellation.reduce(s,{type:'dismiss'}),s);
 s=cancellation.reduce(s,{type:'resolve',outcome:'success'});assert.equal(s.status,'Cancelled');assert.equal(s.requests,0);assert.equal(s.offers,0);assert.equal(cancellation.reduce(s,{type:'confirm'}),s);
});
test('cancellation handles Paid and Completed races without a false cancellation',()=>{
 for(const outcome of ['paid','completed']){const s=cancellation.reduce(cancellation.seed('A05'),{type:'resolve',outcome});assert.equal(cancellation.eligible(s),false);assert.equal(s.requests,2);assert.equal(s.offers,3);assert.notEqual(s.status,'Cancelled');}
});
test('payment compares exact integer cents and rejects malformed or unsupported values',()=>{
 for(const x of ['2500','2500.0','2500.00'])assert.equal(payment.cents(x),250000);
 for(const x of ['2500.001','2.5e3','2,500','Infinity','-2500','0x9c4','NaN'])assert.equal(payment.cents(x),null);
 for(const amount of ['2499.99','2500.01','2500.000'])assert.equal(payment.reduce(payment.seed('A01'),{type:'pay',amount,method:'PromptPay'}).errorField,'amount');
 assert.equal(payment.reduce(payment.seed('A01'),{type:'pay',amount:'2500',method:'Cash'}).errorField,'payment-method');
 let s=payment.reduce(payment.seed('A04'),{type:'confirm'});s=payment.reduce(s,{type:'resolve',outcome:'success'});assert.ok(s.paidAt);assert.equal(s.status,'Accepted');assert.equal(payment.reduce(s,{type:'pay'}),s);
});
test('review requires completed-job ownership, integer 1–5 rating, and permits no comment',()=>{
 for(const id of ['B02','B03','B04']){const s=review.seed(id);assert.equal(review.reduce(s,{type:'submit',rating:'5'}),s);}
 for(const rating of ['','0','6','1.5','NaN'])assert.equal(review.reduce(review.seed('A01'),{type:'submit',rating}).errorField,'rating');
 let s=review.reduce(review.seed('A01'),{type:'submit',rating:'5',comment:'   '});s=review.reduce(s,{type:'confirm'});s=review.reduce(s,{type:'resolve',outcome:'success'});assert.equal(s.review.rating,5);assert.equal(s.review.comment,null);assert.equal(review.reduce(s,{type:'submit',rating:'1'}),s);
});
test('review duplicate race displays existing record and never replaces it',()=>{
 let s=review.reduce(review.seed('A05'),{type:'resolve',outcome:'duplicate'});const existing=s.review;s=review.reduce(s,{type:'submit',rating:'1',comment:'overwrite'});assert.equal(s.review,existing);assert.equal(s.review.rating,4);
});
test('unknown mutation outcomes require a read, failed reads remain uncertain, and missing results allow explicit retry',()=>{
 for(const[m,id,attempt]of [[completion,'A05','complete'],[cancellation,'A05','cancel-job'],[payment,'A05','pay'],[review,'A05','submit']]){
  let s=m.reduce(m.seed(id),{type:'resolve',outcome:'unknown'});assert.equal(s.message,'unknown');assert.equal(m.reduce(s,{type:attempt}),s);
  for(let i=0;i<2;i++){s=m.reduce(s,{type:'check'});s=m.reduce(s,{type:'resolve',read:'failed'});assert.match(s.message,/unknown/);assert.equal(m.reduce(s,{type:attempt}),s);}
  s=m.reduce(s,{type:'check'});s=m.reduce(s,{type:'resolve',read:'missing'});assert.equal(s.message,'unchanged');assert.equal(s.pending,null);
 }
});
test('access loss clears sensitive review drafts and prevents operations',()=>{
 const s=review.reduce(review.seed('A05'),{type:'resolve',outcome:'access'});assert.equal(s.comment,'');assert.equal(s.rating,'');assert.equal(s.review,null);assert.equal(s.access,false);assert.equal(review.reduce(s,{type:'submit',rating:'5'}),s);
});
test('editing a field cannot bypass a failed-read prerequisite',()=>{
 for(const[m,name,value]of [[payment,'amount','2500'],[review,'rating','5']]){const s=m.seed('R05');assert.equal(m.reduce(s,{type:'draft',name,value}),s);}
});
test('profile qualification controls cards, average and counts; no ratings is null',()=>{
 const s=profile.seed('B01');assert.equal(profile.qualifying(s.rows).length,7);assert.equal(profile.summary(s.rows).count,7);assert.equal(profile.summary([]).average,null);assert.equal(profile.summary([]).count,0);
 assert.equal(profile.qualifying(s.rows).some(r=>r.id>=97),false);
});
test('financial history excludes unrelated records and direct breakdown access',()=>{
 const s=history.seed('B01');assert.equal(history.visible(s).some(t=>t.id===999),false);assert.equal(history.reduce(s,{type:'view-999'}),s);
 for(const role of ['creator','marketer']){const f=history.reduce(s,{type:'filter',filter:role});assert.ok(history.visible(f).every(t=>role==='creator'?t.creatorId===1:t.marketerId===1));}
});
test('filtered pagination stays bounded and resets after filter changes',()=>{
 for(const m of [history,profile]){let s=m.seed('A01');for(let i=0;i<10;i++)s=m.reduce(s,{type:'next'});assert.equal(s.page,3);s=m.reduce(s,{type:'filter',filter:'all'});assert.equal(s.page,1);s=m.reduce(s,{type:'previous'});assert.equal(s.page,1);}
});
