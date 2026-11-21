import test from 'node:test';
import assert from 'node:assert/strict';
import {JOURNAL_KEY,mutateJournal,readJournalStrict,addEntry} from '../src/lib/batch-journal.mjs';
const batch=(id)=>({version:1,id,name:id,beverage:'cider',startedOn:'2026-11-21',stage:'planned',entries:[],recipeStatus:'unverified'});
function storage(){const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v)};}
test('independent tabs re-read latest batches instead of overwriting a new concept',()=>{
 const store=storage();const stale=readJournalStrict(store);
 mutateJournal(store,v=>[batch('concept'),...v]);
 mutateJournal(store,v=>[batch('journal'),...v]);
 assert.equal(stale.length,0);
 assert.deepEqual(readJournalStrict(store).map(b=>b.id),['journal','concept']);
});
test('observation commits preserve external concept and reject deleted batches',()=>{
 const store=storage();mutateJournal(store,v=>[batch('existing'),...v]);
 const stale=readJournalStrict(store);
 mutateJournal(store,v=>[batch('concept'),...v]);
 mutateJournal(store,v=>v.map(b=>b.id==='existing'?addEntry(b,{id:'entry',date:'2026-11-21',stage:'active',note:'Measured',gravity:1.05}):b));
 assert.equal(readJournalStrict(store).length,2);
 assert.equal(readJournalStrict(store).find(b=>b.id==='existing').entries.length,1);
 assert.equal(stale[0].entries.length,0);
 assert.throws(()=>mutateJournal(store,v=>{if(!v.some(b=>b.id==='deleted'))throw Error('Missing');return v;}),/Missing/);
});
test('unreadable or unsupported data is never silently overwritten',()=>{
 const store=storage();store.setItem(JOURNAL_KEY,'{broken');
 assert.throws(()=>mutateJournal(store,v=>[batch('new'),...v]),/unreadable/);
 assert.equal(store.getItem(JOURNAL_KEY),'{broken');
 store.setItem(JOURNAL_KEY,JSON.stringify({version:2,batches:[]}));
 assert.throws(()=>readJournalStrict(store),/Unsupported/);
});
test('storage write failures preserve the prior snapshot',()=>{
 const store=storage();mutateJournal(store,v=>[batch('one'),...v]);
 const before=store.getItem(JOURNAL_KEY);
 const failing={getItem:store.getItem,setItem:()=>{throw Error('Quota');}};
 assert.throws(()=>mutateJournal(failing,v=>[batch('two'),...v]),/Quota/);
 assert.equal(store.getItem(JOURNAL_KEY),before);
});
