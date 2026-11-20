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
export function savePayload(batches){return JSON.stringify({version:1,batches:batches.map(sanitiseBatch).filter(Boolean)});}
