import test from 'node:test';
import assert from 'node:assert/strict';
import {createDefaultDraft} from '../src/lib/taste-draft.mjs';
import {JOURNAL_KEY,loadJournal} from '../src/lib/batch-journal.mjs';
import {makePlannedBatch,saveDesignAsPlannedBatch} from '../src/lib/design-journal-handoff.mjs';
const date='2026-11-20';
const draft=()=>({...createDefaultDraft(),adultConfirmed:true});
function storage(initial){const data=new Map(initial||[]);return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v),read:()=>data};}
test('creates a planned, unverified concept with no claimed measurements',()=>{
 const d=draft();d.notes.orchard='love';const b=makePlannedBatch(d,{id:'design-1',date,beverage:'cider'});
 assert.equal(b.stage,'planned');assert.equal(b.recipeStatus,'unverified');assert.equal(b.entries[0].gravity,null);
 assert.match(b.entries[0].note,/DESIGN INTENT/);assert.match(b.entries[0].note,/No validated recipe/);
 assert.match(b.entries[0].note,/Orchard/);assert.equal(b.entries[0].note.length<=600,true);
});
test('does not allow missing adult acknowledgement or malformed identifiers',()=>{
 assert.throws(()=>makePlannedBatch(createDefaultDraft(),{id:'x',date}));
 assert.throws(()=>makePlannedBatch(draft(),{id:'',date}));
 assert.throws(()=>makePlannedBatch(draft(),{id:'x',date:'tomorrow'}));
});
test('appends without changing existing batches',()=>{
 const s=storage();saveDesignAsPlannedBatch(s,draft(),{id:'one',date});
 const before=JSON.parse(s.getItem(JOURNAL_KEY)).batches[0];
 saveDesignAsPlannedBatch(s,draft(),{id:'two',date});
 const batches=loadJournal(JSON.parse(s.getItem(JOURNAL_KEY)));
 assert.equal(batches.length,2);assert.deepEqual(batches[1],before);
});
test('rejects duplicate identifiers without overwriting data',()=>{
 const s=storage();saveDesignAsPlannedBatch(s,draft(),{id:'one',date});
 const before=s.getItem(JOURNAL_KEY);
 assert.throws(()=>saveDesignAsPlannedBatch(s,draft(),{id:'one',date}));
 assert.equal(s.getItem(JOURNAL_KEY),before);
});
test('rejects unreadable or unsupported existing storage',()=>{
 for(const value of ['{bad','{"version":2,"batches":[]}','{"version":1,"batches":[{"id":"bad"}]}']){
  const s=storage([[JOURNAL_KEY,value]]);
  assert.throws(()=>saveDesignAsPlannedBatch(s,draft(),{id:'x',date}));
  assert.equal(s.getItem(JOURNAL_KEY),value);
 }
});
test('storage failures do not produce a success result',()=>{
 const s={getItem:()=>null,setItem:()=>{throw Error('quota');}};
 assert.throws(()=>saveDesignAsPlannedBatch(s,draft(),{id:'x',date}),/quota/);
});
