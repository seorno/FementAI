export const JOURNAL_KEY = 'ferment-ai:journal:v1';
export const STAGES = ['planned','active','paused','finished','discarded'];
const isObject = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const date = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x+'T00:00:00Z')) && new Date(x+'T00:00:00Z').toISOString().startsWith(x);
const text = (x,max=240) => typeof x === 'string' ? x.trim().slice(0,max) : '';
export function sanitiseEntry(x) {
 if (!isObject(x) || !date(x.date) || !STAGES.includes(x.stage)) return null;
 const note=text(x.note,600);
 const gravity = x.gravity === '' || x.gravity == null ? null : Number(x.gravity);
 if (gravity !== null && (!Number.isFinite(gravity) || gravity < 0.9 || gravity > 1.2)) return null;
 return {id:text(x.id,80),date:x.date,stage:x.stage,note,gravity};
}
export function sanitiseBatch(x) {
 if (!isObject(x) || x.version !== 1 || !date(x.startedOn)) return null;
 const id=text(x.id,80), name=text(x.name,90), beverage=text(x.beverage,40);
 if (!id || !name || !['cider','mead','fruit-wine','other'].includes(beverage)) return null;
 const entries=(Array.isArray(x.entries)?x.entries:[]).slice(0,300).map(sanitiseEntry).filter(Boolean);
 return {version:1,id,name,beverage,startedOn:x.startedOn,stage:STAGES.includes(x.stage)?x.stage:'planned',entries,recipeStatus:'unverified'};
}
export function loadJournal(raw) {
 if (!isObject(raw) || raw.version !== 1 || !Array.isArray(raw.batches)) return [];
 const ids=new Set();
 return raw.batches.slice(0,100).map(sanitiseBatch).filter(b=>{if(!b||ids.has(b.id))return false;ids.add(b.id);return true;});
}
export function addEntry(batch, entry) {
 const clean=sanitiseEntry(entry);
 if (!clean || !clean.id || batch.entries.some(e=>e.id===clean.id)) throw new Error('Invalid or duplicate journal entry');
 if (batch.entries.length>=300) throw new Error('Journal limit reached');
 return {...batch,stage:clean.stage,entries:[...batch.entries,clean]};
}
export function validateJournalRecords(raw) {
 if (!isObject(raw) || raw.version !== 1 || !Array.isArray(raw.batches) || raw.batches.length > 100)
  throw Error('Unsupported or oversized journal; no changes were made.');
 const batches = loadJournal(raw);
 if (batches.length !== raw.batches.length)
  throw Error('Journal contains invalid or duplicate batches; no changes were made.');
 for (let i = 0; i < raw.batches.length; i++) {
  const original = raw.batches[i], restored = batches[i];
  if (!Array.isArray(original.entries) || original.entries.length > 300 ||
      original.entries.length !== restored.entries.length ||
      !STAGES.includes(original.stage))
   throw Error('Journal contains invalid or oversized observations; no changes were made.');
  // A strict read must not normalise historical evidence. Trimming notes,
  // truncating labels, or coercing gravity would rewrite the user's record.
  // Keep legacy malformed data untouched until an explicit migration/export.
  if (!restored || original.id !== restored.id ||
      original.name !== restored.name ||
      original.beverage !== restored.beverage ||
      original.startedOn !== restored.startedOn ||
      original.stage !== restored.stage)
   throw Error('Journal contains fields requiring a lossless migration; no changes were made.');
  const ids = new Set();
  for (let j = 0; j < original.entries.length; j++) {
   const entry = original.entries[j], clean = sanitiseEntry(entry);
   if (!clean || !clean.id || ids.has(clean.id) ||
       entry.id !== clean.id ||
       entry.date !== clean.date ||
       entry.stage !== clean.stage ||
       entry.note !== clean.note ||
       entry.gravity !== clean.gravity)
    throw Error('Journal contains observations requiring a lossless migration; no changes were made.');
   ids.add(clean.id);
  }
 }
 return batches;
}
export function savePayload(batches) {
 const validated = validateJournalRecords({version:1,batches});
 return JSON.stringify({version:1,batches:validated});
}

export function readJournalStrict(storage) {
 const raw=storage.getItem(JOURNAL_KEY);
 if(raw===null)return [];
 let parsed;
 try{parsed=JSON.parse(raw);}catch{throw Error('Saved journal is unreadable; no changes were made.');}
 if(parsed?.version!==1||!Array.isArray(parsed.batches))throw Error('Unsupported journal version; no changes were made.');
 return validateJournalRecords(parsed);
}
// Always re-read storage at the moment of the action, never commit a stale React snapshot.
// This avoids sequential lost updates but is not a cross-tab transaction.
export function mutateJournal(storage,mutation) {
 const current=readJournalStrict(storage);
 const next=mutation(current);
 if(!Array.isArray(next)||next.length>100)throw Error('Journal limit or invalid update.');
 const payload=savePayload(next);
 if(loadJournal(JSON.parse(payload)).length!==next.length)throw Error('Invalid journal update.');
 storage.setItem(JOURNAL_KEY,payload);
 return loadJournal(JSON.parse(payload));
}
