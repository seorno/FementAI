export const MEMORY_KEY = 'ferment-ai:taste-memory:v1';
export const DIMENSIONS = ['sweetness','acidity','body','fruit','aroma'];
export const FEEDBACK = ['more','same','less'];
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const short = (x,max=180) => typeof x === 'string' ? x.trim().slice(0,max) : '';
const validDate = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x+'T00:00:00Z')) && new Date(x+'T00:00:00Z').toISOString().startsWith(x);
export function sanitiseScores(x) {
 if(!object(x)) return null;
 const out={};
 for(const k of DIMENSIONS){if(!Number.isInteger(x[k]) || x[k]<0 || x[k]>5)return null;out[k]=x[k];}
 return out;
}
export function sanitiseMemory(x) {
 if(!object(x) || x.version!==1 || !validDate(x.date))return null;
 const id=short(x.id,80),batchId=short(x.batchId,80),intent=sanitiseScores(x.intent),observed=sanitiseScores(x.observed);
 if(!id||!batchId||!intent||!observed||!FEEDBACK.includes(x.nextTime))return null;
 return {version:1,id,batchId,date:x.date,intent,observed,nextTime:x.nextTime,notes:short(x.notes,600)};
}
export function loadMemory(raw, batchIds) {
 if(!object(raw)||raw.version!==1||!Array.isArray(raw.entries))return [];
 const allowed=new Set(batchIds),seen=new Set();
 return raw.entries.slice(0,300).map(sanitiseMemory).filter(x=>{
  if(!x||!allowed.has(x.batchId)||seen.has(x.id))return false;
  seen.add(x.id);return true;
 });
}
export function addMemory(entries, entry, batchIds) {
 const clean=sanitiseMemory(entry);
 if(!clean||!new Set(batchIds).has(clean.batchId)||entries.some(e=>e.id===clean.id)||entries.length>=300)throw new Error('Invalid taste memory');
 return [...entries,clean];
}
export function comparison(entry) {
 const result={};
 for(const k of DIMENSIONS)result[k]=entry.observed[k]-entry.intent[k];
 return result;
}
export function saveMemory(entries) {
 return JSON.stringify({version:1,entries:entries.map(sanitiseMemory).filter(Boolean)});
}

/** Read without normalising or silently discarding existing reflections. */
export function readMemoryStrict(storage,batchIds){
 const raw=storage.getItem(MEMORY_KEY);
 if(raw===null)return [];
 let parsed;
 try{parsed=JSON.parse(raw);}catch{throw Error('Taste memory is unreadable; preserve raw recovery data before editing.');}
 if(!object(parsed)||parsed.version!==1||!Array.isArray(parsed.entries)||parsed.entries.length>300)
  throw Error('Unsupported taste memory; preserve raw recovery data before editing.');
 const entries=loadMemory(parsed,batchIds);
 if(entries.length!==parsed.entries.length||JSON.stringify(entries)!==JSON.stringify(parsed.entries))
  throw Error('Taste memory contains invalid, orphaned or non-canonical evidence; preserve raw recovery data before editing.');
 return entries;
}
/** Commit before updating React state. Never autosave a stale component snapshot. */
export function recordMemory(storage,entry,batchIds){
 const current=readMemoryStrict(storage,batchIds);
 const next=addMemory(current,entry,batchIds);
 storage.setItem(MEMORY_KEY,saveMemory(next));
 return next;
}
