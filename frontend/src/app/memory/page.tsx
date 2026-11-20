'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {JOURNAL_KEY,loadJournal} from '@/lib/batch-journal.mjs';
import {MEMORY_KEY,DIMENSIONS,loadMemory,addMemory,comparison,saveMemory} from '@/lib/taste-memory.mjs';
type Batch={id:string;name:string;beverage:string;stage:string};
type Scores=Record<string,number>;
type Memory={id:string;batchId:string;date:string;intent:Scores;observed:Scores;nextTime:string;notes:string};
const zero=()=>Object.fromEntries(DIMENSIONS.map(k=>[k,2])) as Scores;
const input='mt-2 w-full rounded-xl border border-[#d9d0d6] bg-white p-3 text-[#30252d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#77566e]';
const today=()=>new Date().toISOString().slice(0,10);
export default function TasteMemoryPage(){
 const [ready,setReady]=useState(false),[batches,setBatches]=useState<Batch[]>([]),[entries,setEntries]=useState<Memory[]>([]);
 const [batchId,setBatchId]=useState(''),[intent,setIntent]=useState<Scores>(zero),[observed,setObserved]=useState<Scores>(zero);
 const [nextTime,setNextTime]=useState('same'),[notes,setNotes]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{
  try {
   const raw=localStorage.getItem(JOURNAL_KEY);
   const bs=raw?loadJournal(JSON.parse(raw)) as Batch[]:[];
   setBatches(bs);setBatchId(bs[0]?.id||'');
   const saved=localStorage.getItem(MEMORY_KEY);
   if(saved)setEntries(loadMemory(JSON.parse(saved),bs.map(b=>b.id)));
  }catch{setNotice('Some saved data could not be read. Existing browser data has not been overwritten.');}
  finally{setReady(true);}
 },[]);
 // Avoid silently overwriting unreadable or future-version data on load.
 const [canSave,setCanSave]=useState(true);
 useEffect(()=>{if(!ready)return;try{const existing=localStorage.getItem(MEMORY_KEY);if(existing){const raw=JSON.parse(existing);if(raw.version!==1){setCanSave(false);setNotice('A different taste-memory format was found. Export it manually before making changes.');}}}catch{setCanSave(false);setNotice('Unreadable taste memory detected; it will not be overwritten.');}},[ready]);
 useEffect(()=>{if(!ready||!canSave)return;try{localStorage.setItem(MEMORY_KEY,saveMemory(entries));}catch{setNotice('Browser storage failed. Your new feedback may not persist.');}},[entries,ready,canSave]);
 function record(e:React.FormEvent){e.preventDefault();if(!batchId||!canSave)return;
  try{const x={version:1,id:crypto.randomUUID(),batchId,date:today(),intent,observed,nextTime,notes};setEntries(v=>addMemory(v,x,batches.map(b=>b.id)));setNotes('');setNotice('Taste feedback saved locally.');}
  catch{setNotice('Could not save feedback. Check the batch and values.');}
 }
 function exportData(){const blob=new Blob([saveMemory(entries)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ferment-ai-taste-memory.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 if(!ready)return <p role="status" className="mx-auto max-w-5xl p-10">Opening taste memory…</p>;
 const selected=entries.filter(x=>x.batchId===batchId).slice().reverse();
 return <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#806177]">Your private studio</p>
  <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">Taste memory.</h1>
  <p className="mt-4 max-w-3xl text-[#68686d]">Compare the flavour you wanted with what you perceived. These are personal, ordinal impressions, not chemical measurements or evidence that a drink is safe to consume.</p>
  <p className="mt-3 text-sm text-[#76546b]">Record feedback only after independent safety checks. Never taste a questionable batch. Everything stays in this browser; clearing storage may erase it.</p>
  {notice&&<p role="status" className="mt-5 rounded-xl bg-[#f8f1f5] p-4">{notice}</p>}
  <div className="mt-6 flex flex-wrap gap-3"><Link href="/journal" className="rounded-full border border-[#c9b8c3] px-5 py-3">Batch journal</Link><button type="button" onClick={exportData} className="rounded-full border border-[#c9b8c3] px-5 py-3">Export feedback JSON</button></div>
  {!batches.length?<section className="mt-10 rounded-[28px] border bg-white p-8"><h2 className="text-xl font-semibold">Start with a batch record</h2><p className="mt-3 text-[#68686d]">Create a batch in your journal to link your intended and perceived taste.</p><Link href="/journal" className="mt-5 inline-block underline">Open batch journal</Link></section>:
  <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
   <form onSubmit={record} className="rounded-[28px] border border-[#e7e7e7] bg-white p-6">
    <h2 className="text-xl font-semibold">Reflect on a batch</h2>
    <label className="mt-5 block text-sm font-medium">Batch<select className={input} value={batchId} onChange={e=>setBatchId(e.target.value)}>{batches.map(b=><option key={b.id} value={b.id}>{b.name} ({b.stage})</option>)}</select></label>
    <p className="mt-5 text-sm text-[#68686d]">0 = very low · 5 = very high. Values describe preferences and perceptions only.</p>
    {DIMENSIONS.map(k=><fieldset key={k} className="mt-5 rounded-xl border border-[#e7e7e7] p-4"><legend className="px-1 font-medium capitalize">{k}</legend>
     {([['Intended',intent,setIntent],['Perceived',observed,setObserved]] as const).map(([label,value,setter])=><label key={label} className="mt-3 flex items-center gap-4 text-sm"><span className="w-20">{label}</span><input type="range" min="0" max="5" step="1" aria-label={label+' '+k} value={value[k]} onChange={e=>setter(v=>({...v,[k]:Number(e.target.value)}))} className="min-w-0 flex-1 accent-[#77566e]"/><output className="w-5 text-right tabular-nums">{value[k]}</output></label>)}
    </fieldset>)}
    <label className="mt-5 block text-sm font-medium">Next time<select className={input} value={nextTime} onChange={e=>setNextTime(e.target.value)}><option value="more">Make more of this</option><option value="same">Keep it similar</option><option value="less">Make less of this</option></select></label>
    <label className="mt-5 block text-sm font-medium">Your notes<textarea className={input} rows={3} maxLength={600} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="What would you change?"/></label>
    <button disabled={!canSave} className="mt-6 min-h-12 rounded-full bg-[#1d1d1f] px-6 py-3 text-white disabled:opacity-40">Save taste reflection</button>
   </form>
   <section className="rounded-[28px] border border-[#e7e7e7] bg-white p-6" aria-label="Taste reflections">
    <h2 className="text-xl font-semibold">Previous reflections</h2>
    {!selected.length?<p className="mt-4 text-sm text-[#68686d]">No feedback for this batch yet.</p>:<ol className="mt-5 space-y-4">{selected.map(x=><li key={x.id} className="rounded-xl border border-[#e7e7e7] p-4"><p className="text-xs uppercase tracking-wide text-[#806177]">{x.date} · Next time: {x.nextTime}</p><dl className="mt-3 space-y-1">{Object.entries(comparison(x)).map(([k,v])=><div key={k} className="flex justify-between text-sm"><dt className="capitalize">{k}</dt><dd>{v>0?'+':''}{v} perceived vs intended</dd></div>)}</dl>{x.notes&&<p className="mt-3 whitespace-pre-wrap break-words text-sm">{x.notes}</p>}</li>)}</ol>}
    <p className="mt-6 text-sm text-[#68686d]">Comparisons are subjective self-reports. They do not train a model or alter recipe feasibility, safety screening, alcohol estimates or future recommendations.</p>
   </section>
  </div>}
 </div>;
}
