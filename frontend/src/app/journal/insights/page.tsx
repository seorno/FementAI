'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {JOURNAL_KEY,loadJournal} from '@/lib/batch-journal.mjs';
import {reviewBatch} from '@/lib/batch-insights.mjs';
type Batch={id:string;name:string;beverage:string;entries:{id:string;date:string;gravity:number|null}[]};
export default function BatchInsightsPage(){
 const [batches,setBatches]=useState<Batch[]>([]);
 const [selected,setSelected]=useState('');
 const [notice,setNotice]=useState('');
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  try{const raw=localStorage.getItem(JOURNAL_KEY);const parsed=raw?loadJournal(JSON.parse(raw)):[];setBatches(parsed);setSelected(parsed[0]?.id??'');}
  catch{setNotice('Journal data could not be read. No browser records were changed.');}
  finally{setReady(true);}
 },[]);
 const active=batches.find(b=>b.id===selected);
 const review=useMemo(()=>active?reviewBatch(active):null,[active]);
 const chart=review?.observations??[];
 const min=chart.length?Math.min(...chart.map(p=>p.gravity)):0.9;
 const max=chart.length?Math.max(...chart.map(p=>p.gravity)):1.2;
 const spread=Math.max(0.005,max-min);
 const path=chart.map((p,i)=>`${i===0?'M':'L'} ${40+(chart.length===1?0.5:i/(chart.length-1))*520} ${170-((p.gravity-min)/spread)*130}`).join(' ');
 return <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
  <Link href="/journal" className="text-sm font-medium text-[#6f4565] underline underline-offset-4">Back to batch journal</Link>
  <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-[#806177]">Your private studio · observation review</p>
  <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">Reading your records.</h1>
  <p className="mt-4 max-w-2xl text-[#68686d]">Explore the hydrometer readings you entered. This is a descriptive chart of self-reported measurements, not an alcohol estimate, fermentation-completion test or safety assessment.</p>
  {notice&&<p role="alert" className="mt-6 rounded-2xl bg-[#f8f1f5] p-4">{notice}</p>}
  {!ready?<p role="status" className="mt-8">Opening journal…</p>:batches.length===0?<div className="mt-8 rounded-[28px] border border-[#e7e7e7] bg-white p-8"><p>No batches recorded yet.</p><Link href="/journal" className="mt-4 inline-block underline">Create a journal record</Link></div>:<>
   <label className="mt-8 block max-w-lg text-sm font-semibold">Choose a batch
    <select className="mt-2 min-h-12 w-full rounded-xl border border-[#d9d0d6] bg-white p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#77566e]" value={selected} onChange={e=>setSelected(e.target.value)}>{batches.map(b=><option key={b.id} value={b.id}>{b.name} · {b.beverage}</option>)}</select>
   </label>
   {review&&<section className="mt-8 rounded-[28px] border border-[#e7e7e7] bg-white p-6 sm:p-8" aria-label="Recorded gravity overview">
    <h2 className="text-2xl font-semibold">Recorded gravity</h2>
    <p className="mt-2 text-sm text-[#68686d]">{review.count} valid readings across {review.distinctDays} dates. Values shown in specific-gravity units (SG).</p>
    {chart.length>0?<>
     <svg viewBox="0 0 600 210" role="img" aria-label="Chronological plot of recorded specific-gravity readings; exact values are listed in the table below" className="mt-5 w-full rounded-xl bg-[#f7f7f5]" preserveAspectRatio="xMidYMid meet">
      <line x1="40" x2="560" y1="175" y2="175" stroke="#a69aa2" strokeWidth="1"/>
      {chart.length>1&&<path d={path} stroke="#6f4565" strokeWidth="3" fill="none" strokeLinejoin="round"/>}
      {chart.map((p,i)=><circle key={p.id+'-'+i} cx={40+(chart.length===1?0.5:i/(chart.length-1))*520} cy={170-((p.gravity-min)/spread)*130} r="5" fill="#6f4565"/>)}
      <text x="40" y="197" fontSize="12" fill="#68686d">{chart[0]?.date}</text>
      {chart.length>1&&<text x="560" y="197" textAnchor="end" fontSize="12" fill="#68686d">{chart[chart.length-1]?.date}</text>}
     </svg>
     <div className="mt-5 overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><caption className="mb-3 text-left font-semibold">Exact self-reported readings</caption><thead><tr className="border-b border-[#e7e7e7]"><th scope="col" className="py-3">Date</th><th scope="col" className="py-3">Specific gravity</th></tr></thead><tbody>{chart.map((p,i)=><tr key={p.id+'-'+i} className="border-b border-[#e7e7e7]"><td className="py-3">{p.date}</td><td className="py-3 tabular-nums">{p.gravity.toFixed(3)}</td></tr>)}</tbody></table></div>
     <p className="mt-4 text-sm">First-to-last recorded change: <strong>{review.change===null?'Insufficient readings':`${review.change>0?'+':''}${review.change.toFixed(3)} SG`}</strong>. This is arithmetic on recorded values, not a fermentation-rate model.</p>
    </>:<p className="mt-6 text-[#68686d]">No usable gravity measurements. Add an observation in the journal to see it here.</p>}
    <h3 className="mt-8 font-semibold">Interpretation limits</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#68686d]">{review.warnings.map(w=><li key={w}>{w}</li>)}</ul>
   </section>}
  </>}
 </div>;
}