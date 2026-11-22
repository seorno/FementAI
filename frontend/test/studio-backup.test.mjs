import test from 'node:test';
import assert from 'node:assert/strict';
import {makeBackup,inspectBackup,restoreBackup,captureRestoreBaseline} from '../src/lib/studio-backup.mjs';
import {JOURNAL_KEY} from '../src/lib/batch-journal.mjs';
import {MEMORY_KEY} from '../src/lib/taste-memory.mjs';
const batch={version:1,id:'b1',name:'Cider',beverage:'cider',startedOn:'2026-11-20',stage:'finished',entries:[{id:'e1',date:'2026-11-20',stage:'finished',note:'Recorded',gravity:1.01}]};
const scores={sweetness:2,acidity:3,body:2,fruit:4,aroma:3};
const memory={version:1,id:'m1',batchId:'b1',date:'2026-11-20',intent:scores,observed:scores,nextTime:'same',notes:'Subjective'};
const backup=()=>makeBackup([batch],[memory],'2026-11-20T12:00:00.000Z');
test('roundtrips linked journal and taste reflections',()=>{const x=inspectBackup(backup());assert.equal(x.summary.observations,1);assert.equal(x.entries[0].batchId,x.batches[0].id);});
test('rejects malformed, unsupported and oversized backup',()=>{assert.throws(()=>inspectBackup('{'));assert.throws(()=>inspectBackup('x'.repeat(2000001)));assert.throws(()=>inspectBackup(JSON.stringify({...JSON.parse(backup()),version:2})));});
test('rejects orphaned memory rather than silently discarding',()=>{const x=JSON.parse(backup());x.memory.entries[0].batchId='missing';assert.throws(()=>inspectBackup(JSON.stringify(x)),/invalid/);});
test('rejects invalid observations rather than silently discarding',()=>{const x=JSON.parse(backup());x.journal.batches[0].entries[0].gravity=900;assert.throws(()=>inspectBackup(JSON.stringify(x)),/invalid/);});
test('restores both stores after validation',()=>{const m=new Map();const storage={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};restoreBackup(storage,inspectBackup(backup()),captureRestoreBaseline(storage));assert.equal(JSON.parse(m.get(JOURNAL_KEY)).batches.length,1);assert.equal(JSON.parse(m.get(MEMORY_KEY)).entries.length,1);});
test('rolls back both stores when second write fails',()=>{const m=new Map([[JOURNAL_KEY,'old-journal'],[MEMORY_KEY,'old-memory']]);let fail=true;const storage={getItem:k=>m.get(k)??null,setItem:(k,v)=>{if(k===MEMORY_KEY&&fail){fail=false;throw Error('quota');}m.set(k,v);},removeItem:k=>m.delete(k)};assert.throws(()=>restoreBackup(storage,inspectBackup(backup()),captureRestoreBaseline(storage)),/previous/);assert.equal(m.get(JOURNAL_KEY),'old-journal');assert.equal(m.get(MEMORY_KEY),'old-memory');});
test('never treats backup contents as verified safety or ABV',()=>{const x=inspectBackup(backup());assert.equal(x.batches[0].recipeStatus,'unverified');assert.equal('abv' in x.batches[0],false);});

test('rejects non-canonical reflection fields without silently rewriting backup evidence',()=>{
 for(const change of [
  entry=>{entry.notes='  padded note  ';},
  entry=>{entry.id=' m1 ';},
  entry=>{entry.intent.extra=1;},
  entry=>{entry.observed.sweetness='2';},
  entry=>{entry.extra='unknown field';}
 ]){
  const file=JSON.parse(backup());
  change(file.memory.entries[0]);
  assert.throws(()=>inspectBackup(JSON.stringify(file)),/non-canonical|invalid/);
 }
});
test('a rejected non-canonical backup cannot alter existing local evidence',()=>{
 const file=JSON.parse(backup());file.memory.entries[0].notes='  altered  ';
 const m=new Map([[JOURNAL_KEY,'original-journal'],[MEMORY_KEY,'original-memory']]);
 assert.throws(()=>inspectBackup(JSON.stringify(file)),/non-canonical/);
 assert.equal(m.get(JOURNAL_KEY),'original-journal');
 assert.equal(m.get(MEMORY_KEY),'original-memory');
});
