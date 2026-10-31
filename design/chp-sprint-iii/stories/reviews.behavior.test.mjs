import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,reduce,reviewPreview,summary} from '../US-034/demo/state-machine.mjs';

test('long Unicode reviews retain the original while providing a shorter well-formed preview',()=>{
 const s=seed('A04'),comment=s.rows[0].comment,preview=reviewPreview(comment);
 assert.ok(comment.startsWith(preview.slice(0,-1)));assert.ok(preview.length<comment.length);assert.ok(preview.endsWith('…'));assert.ok(preview.isWellFormed());
 assert.equal(s.rows[0].comment,comment);
});
test('review disclosure is scoped to a qualifying long review and survives unrelated presentation/filter state',()=>{
 let s=seed('A04');s=reduce(s,{type:'review-expansion',id:1,open:true});assert.deepEqual(s.expanded,[1]);
 assert.equal(reduce(s,{type:'review-expansion',id:999,open:true}),s);
 s=reduce(s,{type:'filter',filter:'5'});assert.deepEqual(s.expanded,[1]);
 s=reduce(s,{type:'review-expansion',id:1,open:false});assert.deepEqual(s.expanded,[]);
});
test('clearing a no-match filter resets the page without changing the true rating or qualified records',()=>{
 let s=seed('B02'),before=summary(s.rows);s={...s,page:3};s=reduce(s,{type:'clear-filter'});
 assert.equal(s.filter,'all');assert.equal(s.page,1);assert.deepEqual(summary(s.rows),before);
});
