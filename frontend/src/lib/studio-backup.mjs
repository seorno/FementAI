import {loadJournal,validateJournalRecords,readJournalStrict,savePayload,JOURNAL_KEY} from './batch-journal.mjs';
import {loadMemory,saveMemory,MEMORY_KEY} from './taste-memory.mjs';
export const BACKUP_VERSION=1;
// Strict normal backup: never turn damaged stored evidence into a plausible-looking clean file.
export function exportStudioBackupStrict(storage,createdAt=new Date().toISOString()){
 const batches=readJournalStrict(storage);
 const rawMemory=storage.getItem(MEMORY_KEY);
 let entries=[];
 if(rawMemory!==null){
  let parsed;
  try{parsed=JSON.parse(rawMemory);}catch{throw Error('Taste memory is unreadable; export raw recovery data instead.');}
  if(!object(parsed)||parsed.version!==1||!Array.isArray(parsed.entries)||parsed.entries.length>300)
   throw Error('Taste memory is unsupported; export raw recovery data instead.');
  entries=loadMemory(parsed,batches.map(b=>b.id));
  if(entries.length!==parsed.entries.length)
   throw Error('Taste memory contains invalid or orphaned records; export raw recovery data instead.');
  if(JSON.stringify(parsed.entries)!==JSON.stringify(entries))
   throw Error('Taste memory requires a lossless migration; export raw recovery data instead.');
 }
 return makeBackup(batches,entries,createdAt);
}
// Recovery is intentionally NOT a restorable studio backup. Preserve exact stored bytes,
// including malformed JSON, without parsing, truncating or rewriting either storage key.
export function exportRawRecovery(storage,createdAt=new Date().toISOString()){
 return JSON.stringify({format:'ferment-ai-raw-recovery',version:1,createdAt,
  warning:'Unvalidated local evidence. Not a studio backup. Do not import as a recipe or safety assessment.',
  storage:{[JOURNAL_KEY]:storage.getItem(JOURNAL_KEY),[MEMORY_KEY]:storage.getItem(MEMORY_KEY)}},null,2);
}
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
 // A backup is an evidence archive: normalisation must never silently change a reflection.
 // Match the strict on-device memory contract, including trimmed text and score fields.
 if(JSON.stringify(entries)!==JSON.stringify(data.memory.entries))
  throw Error('Backup contains non-canonical taste reflections; preserve the original file and export raw recovery data.');
 for(const b of data.journal.batches){const restored=batches.find(x=>x.id===b.id);if(!restored||!Array.isArray(b.entries)||restored.entries.length!==b.entries.length||b.entries.some(e=>!e.id||!restored.entries.some(y=>y.id===e.id)))throw Error('Backup contains invalid journal observations');}
 return {batches,entries,summary:{batches:batches.length,observations:batches.reduce((n,b)=>n+b.entries.length,0),reflections:entries.length,createdAt:typeof data.createdAt==='string'?data.createdAt:'unknown'}};
}
export function captureRestoreBaseline(storage){
 return {[JOURNAL_KEY]:storage.getItem(JOURNAL_KEY),[MEMORY_KEY]:storage.getItem(MEMORY_KEY)};
}
export function restoreBackup(storage,validated,expectedBaseline){
 const oldJournal=storage.getItem(JOURNAL_KEY),oldMemory=storage.getItem(MEMORY_KEY);
 // A file may be inspected while another tab edits the journal. Refuse a stale
 // restore preview rather than silently replacing those newer observations.
 if (!expectedBaseline || oldJournal!==expectedBaseline[JOURNAL_KEY] || oldMemory!==expectedBaseline[MEMORY_KEY])
  throw Error('Local records changed since backup inspection. Re-select the backup before restoring; no changes were made.');
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
