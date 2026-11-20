'use client';

import {useState} from 'react';
import type {TasteDraft} from '@/lib/taste-draft.mjs';
import {buildScreeningRequest,validateScreeningResponse,type BeverageFamily,type ScreeningResponse} from '@/lib/feasibility-bridge.mjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const families: {id:BeverageFamily;label:string}[] = [
 {id:'cider',label:'Cider'},{id:'mead',label:'Mead'},{id:'fruit_wine',label:'Fruit wine'}
];

/** A user-triggered server screen, not a recommendation or recipe. No taste scores leave the browser. */
export default function FeasibilityReview({draft}:{draft:TasteDraft}) {
 const [family,setFamily]=useState<BeverageFamily>('cider');
 const [result,setResult]=useState<ScreeningResponse|null>(null);
 const [contamination,setContamination]=useState<'unknown'|'yes'|'no'>('unknown');
 const [pressure,setPressure]=useState<'unknown'|'yes'|'no'>('unknown');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 async function check() {
   setBusy(true);setResult(null);setError('');
   const controller=new AbortController();
   const timeout=setTimeout(()=>controller.abort(),12000);
   try {
     const payload=buildScreeningRequest(draft,family,{
       contamination:contamination==='yes',pressure:pressure==='yes'
     });
     const response=await fetch(`${API_URL}/api/v1/recommendations`,{
       method:'POST',headers:{'Content-Type':'application/json'},
       body:JSON.stringify(payload),signal:controller.signal,cache:'no-store',
     });
     if(!response.ok)throw new Error(`Screening service returned HTTP ${response.status}.`);
     setResult(validateScreeningResponse(await response.json()));
   } catch(e) {
     setError(e instanceof Error && e.name==='AbortError'
       ? 'The screening service timed out. Please retry.'
       : e instanceof Error && e.message.startsWith('Screening service returned')
         ? e.message
         : 'Screening is unavailable or returned an unexpected response. No result has been assumed.');
   } finally {clearTimeout(timeout);setBusy(false);}
 }
 return <section aria-labelledby="feasibility-title" className="rounded-[28px] border border-[#e7e7e7] bg-white p-5 sm:p-8">
   <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#806177]">Server-checked constraints</p>
   <h3 id="feasibility-title" className="mt-3 text-2xl font-semibold tracking-tight">Can this idea be planned?</h3>
   <p className="mt-3 text-sm leading-relaxed text-[#68686d]">Choose a drink family to screen practical constraints. This early check cannot provide a validated recipe, safety certification, alcohol strength or finish date.</p>
   <fieldset className="mt-6">
     <legend className="text-sm font-semibold">Drink family to explore</legend>
     <div className="mt-3 flex flex-wrap gap-2">
       {families.map(item=><label key={item.id} className={'cursor-pointer rounded-full border px-4 py-3 text-sm min-h-11 '+(family===item.id?'border-[#6f4565] bg-[#f8f1f5]':'border-[#e7e7e7]')}>
         <input type="radio" name="screening-family" value={item.id} checked={family===item.id}
           onChange={()=>{setFamily(item.id);setResult(null);setError('');}} className="mr-2 accent-[#6f4565]"/>
         {item.label}
       </label>)}
     </div>
   </fieldset>
   <div className="mt-6 space-y-5 rounded-2xl border border-[#e7e0e5] bg-[#faf7f9] p-5">
     <p className="text-sm font-semibold">Safety screening — answer both questions before checking</p>
     {([
       {id:'contamination',label:'Do you suspect spoilage, mould or contamination in any ingredients or an existing batch?',value:contamination,set:setContamination},
       {id:'pressure',label:'Is any vessel or bottle bulging, unexpectedly pressurised or otherwise concerning?',value:pressure,set:setPressure},
     ] as const).map(question=><fieldset key={question.id}>
       <legend className="text-sm leading-relaxed">{question.label}</legend>
       <div className="mt-2 flex flex-wrap gap-4">
         {(['yes','no','unknown'] as const).map(answer=><label key={answer} className="inline-flex min-h-11 items-center gap-2 text-sm">
           <input type="radio" name={'screening-'+question.id} checked={question.value===answer}
             onChange={()=>{question.set(answer);setResult(null);setError('');}} className="h-4 w-4 accent-[#6f4565]" />
           {answer==='unknown'?'Not sure':answer==='yes'?'Yes':'No'}
         </label>)}
       </div>
     </fieldset>)}
     {(contamination==='yes'||pressure==='yes')&&<p role="alert" className="text-sm text-[#7d4336]">A reported concern will block preparation guidance. Do not taste a suspect batch or casually handle a pressurised vessel.</p>}
     {(contamination==='unknown'||pressure==='unknown')&&<p className="text-xs text-[#805747]">If unsure, do not assume there is no hazard. Clarify the concern before requesting a screen.</p>}
   </div>
   <button type="button" disabled={busy||contamination==='unknown'||pressure==='unknown'} onClick={check} className="mt-6 min-h-12 rounded-full bg-[#1d1d1f] px-6 py-3 font-semibold text-white disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
     {busy?'Checking constraints…':'Check practical constraints'}
   </button>
   <p className="mt-3 text-xs text-[#68686d]">Only your age acknowledgement, selected inventory, requested date, carbonation, drink family and explicit safety-concern answers are sent to the configured API when you click. Taste scores, notes, occasion and budget remain in this browser. No server-side storage is requested by this endpoint.</p>
   <div aria-live="polite" aria-atomic="true" className="mt-5">
     {busy&&<p role="status" className="text-sm">Contacting the screening service…</p>}
     {error&&<p role="alert" className="rounded-xl border border-[#d9b5a5] bg-[#fff6f1] p-4 text-sm text-[#7d4336]">{error}</p>}
     {result&&<div className="space-y-5 rounded-2xl bg-[#f8f3f5] p-5">
       <p className="text-lg font-semibold">{result.status==='unsupported'?'Cannot proceed with this request':'More information and evidence required'}</p>
       <p className="text-sm text-[#68686d]">Rule-based screen · {result.template_version}. No recipe or consumption-safety decision has been made.</p>
       {[
         {label:'Why',items:result.reasons},
         {label:'Still needed',items:result.missing_information},
         {label:'Safety considerations',items:result.safety_warnings}
       ].filter(group=>group.items.length).map(group=><div key={group.label}>
         <h4 className="font-semibold text-sm">{group.label}</h4>
         <ul className="mt-2 list-disc pl-5 space-y-2 text-sm text-[#514b51]">{group.items.map((item,i)=><li key={i}>{item}</li>)}</ul>
       </div>)}
       {result.cider_preparation_evidence&&<section aria-label="Source-backed cider preparation evidence" className="rounded-2xl border border-[#d8c8d2] bg-white p-5 space-y-3">
         <h4 className="font-semibold">Cider preparation evidence · {result.cider_preparation_evidence.version}</h4>
         <p className="text-sm text-[#68686d]">{result.cider_preparation_evidence.scope}</p>
         <h5 className="text-sm font-semibold">Preparation checkpoints</h5>
         <ul className="list-disc pl-5 space-y-2 text-sm">{result.cider_preparation_evidence.checkpoints.map((item,i)=><li key={i}>{item}</li>)}</ul>
         <h5 className="text-sm font-semibold">Still unresolved</h5>
         <ul className="list-disc pl-5 space-y-2 text-sm">{result.cider_preparation_evidence.unresolved.map((item,i)=><li key={i}>{item}</li>)}</ul>
         <h5 className="text-sm font-semibold">Evidence sources (not a validated recipe)</h5>
         <ul className="space-y-2">{result.cider_preparation_evidence.source_urls.map(url=><li key={url}><a href={url} target="_blank" rel="noopener noreferrer" className="break-all text-sm underline underline-offset-4">{url}</a></li>)}</ul>
       </section>}
       {result.supporting_sources.length>0&&<div><h4 className="font-semibold text-sm">Regulatory context (not recipe validation)</h4>
         <ul className="mt-2 space-y-2">{result.supporting_sources.filter(url=>url.startsWith('https://www.gov.uk/')||url.startsWith('https://www.asa.org.uk/')).map(url=><li key={url}><a className="break-all text-sm underline underline-offset-4" href={url} target="_blank" rel="noopener noreferrer">{url}</a></li>)}</ul>
       </div>}
     </div>}
   </div>
 </section>;
}
