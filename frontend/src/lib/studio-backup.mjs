import {loadJournal,validateJournalRecords,savePayload,JOURNAL_KEY} from './batch-journal.mjs';
import {loadMemory,saveMemory,MEMORY_KEY} from './taste-memory.mjs';
export const BACKUP_VERSION=1;
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export function makeBackup(journal,memory,createdAt=new Date().toISOString()){
 const batches=loadJournal(JSON.parse(savePayload(journal)));
 const entries=loadMemory(JSON.parse(saveMemory(memory)),batches.map(x=>x.id));
 return JSON.stringify({format:'ferment-ai-studio',version:BACKUP_VERSION,createdAt,journal:{version:1,batches},memory:{version:1,entries}},null,2);
}
export function inspectBackup(input){
 if(typeof input!=='string'||input.length>2_000_000)throw Error('Backup is too large or unreadable');
 let data;try{data=JSON.parse(input);}catch{throw Error('Not valid JSON');}
 if(!object(data)||data.format!=='ferment-ai-studio'||data.version!==1||!object(data.journal)||!object(data.memory)||!Array.isArray(data.journal.batches)||!Array.isArray(data.memory.entries)||data.journal.version!==1||data.memory.version!==1)throw Error('Unsupported or incomplete studio backup');
 if(data.journal.batches.length>100||data.memory.entries.length>300)throw Error('Backup exceeds storage limits');
 const batches=validateJournalRecords(data.journal);
 const entries=loadMemory(data.memory,batches.map(b=>b.id));
 // Reject rather than silently dropping invalid, duplicate or orphaned records.
 if(batches.length!==data.journal.batches.length||entries.length!==data.memory.entries.length)throw Error('Backup contains invalid, duplicate or orphaned records');
 for(const b of data.journal.batches){const restored=batches.find(x=>x.id===b.id);if(!restored||!Array.isArray(b.entries)||restored.entries.length!==b.entries.length||b.entries.some(e=>!e.id||!restored.entries.some(y=>y.id===e.id)))throw Error('Backup contains invalid journal observations');}
 return {batches,entries,summary:{batches:batches.length,observations:batches.reduce((n,b)=>n+b.entries.length,0),reflections:entries.length,createdAt:typeof data.createdAt==='string'?data.createdAt:'unknown'}};
}
export function restoreBackup(storage,validated){
 const oldJournal=storage.getItem(JOURNAL_KEY),oldMemory=storage.getItem(MEMORY_KEY);
 const journal=savePayload(validated.batches),memory=saveMemory(validated.entries);
 try{storage.setItem(JOURNAL_KEY,journal);storage.setItem(MEMORY_KEY,memory);}
 catch(error){
  try{if(oldJournal===null)storage.removeItem(JOURNAL_KEY);else storage.setItem(JOURNAL_KEY,oldJournal);
   if(oldMemory===null)storage.removeItem(MEMORY_KEY);else storage.setItem(MEMORY_KEY,oldMemory);}
  catch{throw Error('Restore failed and rollback was incomplete. Preserve your existing backups.');}
  throw Error('Restore failed; previous local records were restored.');
 }
 return validated.summary;
}
