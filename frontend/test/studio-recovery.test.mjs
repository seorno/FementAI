import test from 'node:test';
import assert from 'node:assert/strict';
import {exportStudioBackupStrict,exportRawRecovery,inspectBackup} from '../src/lib/studio-backup.mjs';
import {JOURNAL_KEY} from '../src/lib/batch-journal.mjs';
import {MEMORY_KEY} from '../src/lib/taste-memory.mjs';
const batch={version:1,id:'b1',name:'Cider',beverage:'cider',startedOn:'2026-11-20',stage:'active',entries:[{id:'e1',date:'2026-11-20',stage:'active',note:'Unchanged',gravity:1.04}]};
const scores={sweetness:2,acidity:3,body:2,fruit:4,aroma:3};
const memory={version:1,id:'m1',batchId:'b1',date:'2026-11-20',intent:scores,observed:scores,nextTime:'same',notes:'Original'};
const store=(j,m)=>{const data=new Map();if(j!==null)data.set(JOURNAL_KEY,j);if(m!==null)data.set(MEMORY_KEY,m);return {getItem:k=>data.get(k)??null,setItem:()=>{throw Error('Unexpected write');}}};
const j=()=>JSON.stringify({version:1,batches:[batch]});
const m=()=>JSON.stringify({version:1,entries:[memory]});
test('validated export retains linked records and original notes',()=>{
 const result=inspectBackup(exportStudioBackupStrict(store(j(),m()),'2026-11-21T00:00:00Z'));
 assert.equal(result.summary.observations,1);
 assert.equal(result.entries[0].notes,'Original');
 assert.equal(result.batches[0].entries[0].note,'Unchanged');
});
test('normal backup refuses malformed journal rather than silently dropping evidence',()=>{
 const damaged=JSON.parse(j());damaged.batches[0].entries[0].note='  original with whitespace  ';
 assert.throws(()=>exportStudioBackupStrict(store(JSON.stringify(damaged),m())),/lossless migration/);
});
test('normal backup refuses invalid and orphaned taste memory',()=>{
 const orphan=JSON.parse(m());orphan.entries[0].batchId='missing';
 assert.throws(()=>exportStudioBackupStrict(store(j(),JSON.stringify(orphan))),/invalid or orphaned/);
 const lossy=JSON.parse(m());lossy.entries[0].notes='  do not trim  ';
 assert.throws(()=>exportStudioBackupStrict(store(j(),JSON.stringify(lossy))),/lossless migration/);
});
test('raw recovery preserves exact malformed JSON and both storage keys',()=>{
 const raw='{"broken": [not json';const mem='{"entries": [malformed';
 const snapshot=JSON.parse(exportRawRecovery(store(raw,mem),'2026-11-21T00:00:00Z'));
 assert.equal(snapshot.format,'ferment-ai-raw-recovery');
 assert.equal(snapshot.storage[JOURNAL_KEY],raw);
 assert.equal(snapshot.storage[MEMORY_KEY],mem);
 assert.throws(()=>inspectBackup(JSON.stringify(snapshot)),/Unsupported/);
});
test('raw recovery distinguishes absent records from empty strings',()=>{
 const snapshot=JSON.parse(exportRawRecovery(store(null,'')));
 assert.equal(snapshot.storage[JOURNAL_KEY],null);
 assert.equal(snapshot.storage[MEMORY_KEY],'');
});
test('validated export refuses invalid JSON while raw recovery retains it',()=>{
 const storage=store('{broken',m());
 assert.throws(()=>exportStudioBackupStrict(storage),/unreadable/);
 assert.equal(JSON.parse(exportRawRecovery(storage)).storage[JOURNAL_KEY],'{broken');
});
