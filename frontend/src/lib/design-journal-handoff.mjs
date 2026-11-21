import {sanitiseDraft, summariseDraft, OCCASIONS, SERVING, CARBONATION, FLAVOUR_NOTES} from './taste-draft.mjs';
import {JOURNAL_KEY,validateJournalRecords,savePayload} from './batch-journal.mjs';

const isoDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value+'T00:00:00Z'));
export function makePlannedBatch(draft, {id, date, beverage='other'}={}) {
 if (!draft || draft.version!==1 || draft.adultConfirmed!==true) throw Error('Adult acknowledgement is required.');
 if (typeof id!=='string'||!id.trim()||id.length>80||!isoDate(date)) throw Error('A valid local identifier and date are required.');
 if (!['cider','mead','fruit-wine','other'].includes(beverage)) throw Error('Unsupported journal category.');
 const d=sanitiseDraft(draft), summary=summariseDraft(d);
 const occasion=OCCASIONS.find(x=>x.id===d.occasion)?.label||'Unspecified';
 const serving=SERVING.find(x=>x.id===d.serving)?.label||'Unspecified';
 const bubbles=CARBONATION.find(x=>x.id===d.carbonation)?.label||'Unspecified';
 const loves=FLAVOUR_NOTES.filter(x=>d.notes[x.id]==='love').map(x=>x.label).join(', ')||'None selected';
 const avoids=FLAVOUR_NOTES.filter(x=>d.notes[x.id]==='avoid').map(x=>x.label).join(', ')||'None selected';
 const note=['DESIGN INTENT — not a recipe or fermentation observation.',summary.description,
 'Occasion: '+occasion+'. Serving: '+serving+'. Carbonation preference: '+bubbles+'.',
 'Liked notes: '+loves+'. Avoided notes: '+avoids+'.',
 'Target date: '+(d.readyBy||'Flexible')+'. Intended volume: '+d.volumeLitres+' L.',
 'No validated recipe, predicted ABV or safety assessment.'].join(' ').slice(0,600);
 return {version:1,id,name:summary.title.slice(0,90),beverage,startedOn:date,stage:'planned',recipeStatus:'unverified',
 entries:[{id:id+'-intent',date,stage:'planned',note,gravity:null}]};
}
export function saveDesignAsPlannedBatch(storage,draft,{id,date,beverage='other'}) {
 const batch=makePlannedBatch(draft,{id,date,beverage});
 const raw=storage.getItem(JOURNAL_KEY);
 let batches=[];
 if(raw!==null){
  let parsed;try{parsed=JSON.parse(raw);}catch{throw Error('Existing journal is unreadable; nothing was overwritten.');}
  if(parsed?.version!==1||!Array.isArray(parsed.batches))throw Error('Existing journal version unsupported; nothing was overwritten.');
  batches=validateJournalRecords(parsed);
 }
 if(batches.length>=100)throw Error('Journal is full; export a backup before adding records.');
 if(batches.some(x=>x.id===batch.id))throw Error('This concept has already been saved.');
 storage.setItem(JOURNAL_KEY,savePayload([batch,...batches]));
 return batch;
}
