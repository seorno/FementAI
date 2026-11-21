'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {JOURNAL_KEY,loadJournal} from '@/lib/batch-journal.mjs';
import {QUESTIONS,normaliseAnswers,reviewPackagingEvidence} from '@/lib/packaging-audit.mjs';
type Entry={date:string;gravity:number|null};
type Batch={id:string;name:string;stage:string;recipeStatus:string;entries:Entry[]};
type Answer='unknown'|'documented'|'missing'|'concern';
export default function PackagingAuditPage(){
 const [batches,setBatches]=useState<Batch[]>([]);
 const [selected,setSelected]=useState('');
 const [answers,setAnswers]=useState<Record<string,Answer>>(()=>normaliseAnswers({}) as Record<string,Answer>);
 const [loaded,setLoaded]=useState(false),[error,setError]=useState('');
 useEffect(()=>{try{const raw=localStorage.getItem(JOURNAL_KEY);const data=raw?loadJournal(JSON.parse(raw)):[];setBatches(data);setSelected(data[0]?.id??'');}catch{setError('Journal data could not be read. Nothing was modified.');}finally{setLoaded(true)}},[]);
 const active=batches.find(b=>b.id===selected);
 const review=active?reviewPackagingEvidence(active,answers):null;
 return <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
 <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#806177]">Batch journal · Evidence review</p>
 <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">Before packaging.</h1>
 <p className="mt-4 max-w-2xl text-[#68686d]">Inventory the evidence you have and identify unresolved concerns. This is a documentation aid, not a safety test, brewing procedure, pressure calculation or permission to bottle or drink.</p>
 <div className="mt-7 rounded-2xl border border-[#d8c6d0] bg-[#f8f1f5] p-5 text-sm text-[#5b3d50]" role="note"><strong>Packaging is not authorised by this screen.</strong> Even fully documented answers cannot establish fermentation completion, vessel safety or consumption suitability. Suspected contamination or pressure hazards require appropriate independent expertise.</div>
 {error&&<p role="alert" className="mt-5 text-[#8b3f4b]">{error}</p>}
 {!loaded?<p className="mt-8" role="status">Reading local journal…</p>:batches.length===0?<p className="mt-8">No batches recorded. <Link className="underline" href="/journal">Open the journal</Link>.</p>:<>
 <label className="mt-8 block text-sm font-semibold">Select batch<select value={selected} onChange={e=>{setSelected(e.target.value);setAnswers(normaliseAnswers({}) as Record<string,Answer>);}} className="mt-2 block min-h-12 w-full rounded-xl border border-[#d9d0d6] bg-white p-3">{batches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
 {review&&<><section className="mt-7 rounded-[28px] border border-[#e7e7e7] bg-white p-6 sm:p-8" aria-labelledby="audit-title">
 <h2 id="audit-title" className="text-2xl font-semibold">Evidence inventory</h2>
 <p className="mt-2 text-sm text-[#68686d]">Select only what is actually documented. Answers are temporary and are not saved or transmitted.</p>
 <div className="mt-6 space-y-5">{QUESTIONS.map(q=><fieldset key={q.id} className="border-b border-[#eee7eb] pb-5"><legend className="font-medium">{q.label}</legend><div className="mt-3 flex flex-wrap gap-2">{([['unknown','Unsure'],['documented','Documented'],['missing','Missing'],['concern','Concern']] as const).map(([value,label])=><label key={value} className={'cursor-pointer rounded-full border px-4 py-2 text-sm focus-within:outline focus-within:outline-2 focus-within:outline-[#77566e] '+(answers[q.id]===value?'border-[#77566e] bg-[#f8f1f5]':'border-[#ded6db]')}><input className="mr-2 accent-[#77566e]" type="radio" name={q.id} checked={answers[q.id]===value} onChange={()=>setAnswers(v=>({...v,[q.id]:value}))}/>{label}</label>)}</div></fieldset>)}</div>
 </section>
 <section aria-live="polite" className="mt-6 rounded-[28px] bg-[#30242e] p-6 text-white sm:p-8"><h2 className="text-2xl font-semibold">Review outcome: not assessed for safety</h2><p className="mt-3 text-[#e2d8df]">{review.measurementCount} recorded gravity readings across {review.measurementDays} distinct dates. These are self-reported observations, not evidence of safe packaging.</p><p className="mt-3 text-[#e2d8df]">{review.gaps.length} evidence items remain missing, uncertain or concerning. {review.concerns.length} explicitly flagged concerns.</p><ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-[#f0e4eb]">{review.warnings.map(w=><li key={w}>{w}</li>)}</ul><p className="mt-5 font-medium">No packaging or consumption clearance is issued.</p></section></>}
 </>}
 <Link href="/journal" className="mt-8 inline-flex min-h-12 items-center rounded-full border border-[#c9b8c3] px-5">Back to journal</Link>
 </div>;
}
