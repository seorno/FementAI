import test from 'node:test';
import assert from 'node:assert/strict';
import {MEMORY_KEY,readMemoryStrict,recordMemory} from '../src/lib/taste-memory.mjs';
const scores={sweetness:2,acidity:2,body:2,fruit:2,aroma:2};
const entry=(id='one')=>({version:1,id,batchId:'batch',date:'2026-11-22',intent:scores,observed:scores,nextTime:'same',notes:''});
function storage(initial=null){
 const data=new Map(initial===null?[]:[[MEMORY_KEY,initial]]);
 return {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,value),data};
}
test('record commits before returning and keeps independent tab additions',()=>{
 const s=storage();
 recordMemory(s,entry('one'),['batch']);
 recordMemory(s,entry('two'),['batch']);
 assert.deepEqual(readMemoryStrict(s,['batch']).map(x=>x.id),['one','two']);
});
test('invalid or orphaned stored reflections cannot be silently discarded',()=>{
 for(const raw of ['{broken',JSON.stringify({version:2,entries:[]}),JSON.stringify({version:1,entries:[entry('one'),entry('one')]}),JSON.stringify({version:1,entries:[entry('one')]})]){
  const s=storage(raw);
  const allowed=raw.includes('one')&&raw.includes('"version":1')?[]:['batch'];
  assert.throws(()=>recordMemory(s,entry('new'),allowed));
  assert.equal(s.getItem(MEMORY_KEY),raw);
 }
});
test('failed storage write leaves original data unchanged',()=>{
 const s=storage(JSON.stringify({version:1,entries:[entry('one')]}));
 const old=s.getItem(MEMORY_KEY);
 s.setItem=()=>{throw Error('quota');};
 assert.throws(()=>recordMemory(s,entry('two'),['batch']),/quota/);
 assert.equal(s.getItem(MEMORY_KEY),old);
});
test('noncanonical stored text is preserved and requires explicit recovery',()=>{
 const raw=JSON.stringify({version:1,entries:[{...entry('one'),notes:' padded '}]});
 const s=storage(raw);
 assert.throws(()=>recordMemory(s,entry('two'),['batch']),/non-canonical/);
 assert.equal(s.getItem(MEMORY_KEY),raw);
});
