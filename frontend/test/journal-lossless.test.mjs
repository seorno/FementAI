import test from 'node:test';
import assert from 'node:assert/strict';
import {JOURNAL_KEY,readJournalStrict,mutateJournal,savePayload} from '../src/lib/batch-journal.mjs';
import {saveDesignAsPlannedBatch} from '../src/lib/design-journal-handoff.mjs';
import {inspectBackup} from '../src/lib/studio-backup.mjs';

const observation = (id='obs-1') => ({id,date:'2026-11-21',stage:'active',note:'Observed',gravity:1.04});
const batch = (entries=[observation()]) => ({version:1,id:'batch-1',name:'Cider',beverage:'cider',startedOn:'2026-11-20',stage:'active',entries});
const journal = batches => ({version:1,batches});
const storage = raw => {
 let value=JSON.stringify(raw),writes=0;
 return {getItem:()=>value,setItem:(_,next)=>{writes++;value=next;},get writes(){return writes;}};
};
const invalidCases=[
 ['malformed observation',batch([{...observation(),gravity:99}])],
 ['missing observations array',{...batch(),entries:undefined}],
 ['oversized history',batch(Array.from({length:301},(_,i)=>observation('entry-'+i)))],
 ['duplicate observation identifiers',batch([observation(),observation()])],
 ['blank observation identifier',batch([observation('')])],
 ['invalid stage',{...batch(),stage:'unknown'}],
];
for (const [label,record] of invalidCases) {
 test('read-only rejection preserves '+label,()=>{
  const s=storage(journal([record]));
  assert.throws(()=>mutateJournal(s,records=>[...records,batch([])]));
  assert.equal(s.writes,0);
  assert.throws(()=>readJournalStrict(s));
  assert.throws(()=>savePayload([record]));
 });
 test('backup import rejects '+label,()=>{
  const input=JSON.stringify({format:'ferment-ai-studio',version:1,createdAt:'2026-11-21T00:00:00Z',journal:journal([record]),memory:{version:1,entries:[]}});
  assert.throws(()=>inspectBackup(input));
 });
}
test('oversized batch collection is not truncated on save',()=>{
 const s=storage(journal(Array.from({length:101},(_,i)=>({...batch([]),id:'batch-'+i}))));
 assert.throws(()=>readJournalStrict(s));
 assert.equal(s.writes,0);
});
test('valid journal observations round-trip unchanged',()=>{
 const s=storage(journal([batch()]));
 const result=mutateJournal(s,records=>records);
 assert.deepEqual(result[0].entries,[observation()]);
 assert.equal(s.writes,1);
});
test('design handoff refuses damaged existing journal without writing',()=>{
 const s=storage(journal([batch([{...observation(),gravity:99}])]));
 assert.throws(()=>saveDesignAsPlannedBatch(s,{version:1,adultConfirmed:true},{id:'new',date:'2026-11-21'}));
 assert.equal(s.writes,0);
});

const lossyCases = [
 ['trimmed batch name',{...batch(),name:'  Cider  '}],
 ['truncated batch name',{...batch(),name:'C'.repeat(91)}],
 ['trimmed batch id',{...batch(),id:' batch-1 '}],
 ['truncated batch id',{...batch(),id:'b'.repeat(81)}],
 ['trimmed observation note',batch([{...observation(),note:'  Measured  '}])],
 ['truncated observation note',batch([{...observation(),note:'n'.repeat(601)}])],
 ['numeric string gravity',batch([{...observation(),gravity:'1.04'}])],
 ['empty string gravity',batch([{...observation(),gravity:''}])],
 ['trimmed observation id',batch([{...observation(),id:' obs-1 '}])],
 ['truncated observation id',batch([{...observation(),id:'o'.repeat(81)}])],
];
for (const [label,record] of lossyCases) {
 test('strict journal preserves original evidence by rejecting '+label,()=>{
  const original=JSON.stringify(journal([record]));
  const s=storage(journal([record]));
  assert.throws(()=>readJournalStrict(s),/lossless migration/);
  assert.throws(()=>mutateJournal(s,records=>records),/lossless migration/);
  assert.throws(()=>savePayload([record]),/lossless migration/);
  assert.equal(s.writes,0);
  assert.equal(s.getItem(JOURNAL_KEY),original);
 });
 test('backup refuses evidence-changing import: '+label,()=>{
  const input=JSON.stringify({format:'ferment-ai-studio',version:1,createdAt:'2026-11-21T00:00:00Z',journal:journal([record]),memory:{version:1,entries:[]}});
  assert.throws(()=>inspectBackup(input),/lossless migration/);
 });
}
test('valid null-gravity and unmodified notes survive strict export',()=>{
 const record=batch([{...observation(),gravity:null,note:'Measured at room temperature'}]);
 const s=storage(journal([record]));
 assert.deepEqual(readJournalStrict(s),[record]);
 assert.deepEqual(JSON.parse(savePayload([record])).batches,[record]);
 assert.equal(s.writes,0);
});
