/** Descriptive review only; never infer ABV, completion or safety. */
const validDate=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().startsWith(x);
export function reviewBatch(batch){
 if(!batch||!Array.isArray(batch.entries))throw new TypeError('Invalid batch');
 const observations=batch.entries.filter(e=>e&&validDate(e.date)&&typeof e.gravity==='number'&&Number.isFinite(e.gravity)&&e.gravity>=0.9&&e.gravity<=1.2).map((e,index)=>({id:String(e.id??index),date:e.date,gravity:e.gravity,index})).sort((a,b)=>a.date.localeCompare(b.date)||a.index-b.index);
 const distinctDays=new Set(observations.map(e=>e.date)).size;
 const first=observations[0]??null,last=observations.at(-1)??null;
 const change=observations.length>1?Number((last.gravity-first.gravity).toFixed(3)):null;
 const warnings=[];
 if(!observations.length)warnings.push('No valid specific-gravity measurements recorded.');
 if(observations.length===1)warnings.push('One measurement cannot establish a trend.');
 if(observations.length>1&&distinctDays===1)warnings.push('All measurements were recorded on one day; there is no multi-day trend.');
 if(observations.some((e,i)=>i>0&&e.date===observations[i-1].date))warnings.push('Multiple readings share a date; their within-day order may not reflect measurement time.');
 if(change!==null&&change>0)warnings.push('Recorded gravity increased; verify the measurements and context before interpreting this change.');
 warnings.push('These are self-reported observations. Gravity alone cannot establish fermentation completion, bottle safety, alcohol content or suitability for consumption.');
 return {observations:observations.map(({index,...e})=>e),count:observations.length,distinctDays,first:first&&{id:first.id,date:first.date,gravity:first.gravity},last:last&&{id:last.id,date:last.date,gravity:last.gravity},change,warnings,provenance:'self_reported_descriptive_only'};
}