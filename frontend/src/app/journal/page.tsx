'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {JOURNAL_KEY,STAGES,readJournalStrict,mutateJournal,savePayload,addEntry} from '@/lib/batch-journal.mjs';
type Entry={id:string;date:string;stage:string;note:string;gravity:number|null};
type Batch={version:number;id:string;name:string;beverage:string;startedOn:string;stage:string;entries:Entry[];recipeStatus:string};
const input='w-full rounded-xl border border-[#d9d0d6] bg-white p-3 text-[#30252d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#77566e]';
const today=()=>new Date().toLocaleDateString('en-CA');
export default function JournalPage(){
 const [batches,setBatches]=useState<Batch[]>([]),[ready,setReady]=useState(false),[notice,setNotice]=useState('');
 const [name,setName]=useState(''),[beverage,setBeverage]=useState('cider'),[selected,setSelected]=useState(''),[stage,setStage]=useState('active'),[note,setNote]=useState(''),[gravity,setGravity]=useState('');
 useEffect(()=>{
  try{setBatches(readJournalStrict(localStorage));}
  catch{setNotice('Saved journal could not be read. Existing browser data was not overwritten.');}
  finally{setReady(true);}
  const sync=(event:StorageEvent)=>{
   if(event.key!==JOURNAL_KEY&&event.key!==null)return;
   try{setBatches(readJournalStrict(localStorage));setNotice('Journal updated from another tab.');}
   catch{setNotice('Another tab changed the journal to unreadable data. No changes were made.');}
  };
  window.addEventListener('storage',sync);
  return ()=>window.removeEventListener('storage',sync);
 },[]);
 function commit(change:(current:Batch[])=>Batch[]){
  try{const latest=mutateJournal(localStorage,change);setBatches(latest);return true;}
  catch(error){setNotice(error instanceof Error?error.message:'Could not save. Existing data was preserved.');return false;}
 }
 const active=batches.find(b=>b.id===selected);
 function create(e:React.FormEvent){e.preventDefault();if(!name.trim()||batches.length>=100)return;const id=crypto.randomUUID();const b:Batch={version:1,id,name:name.trim().slice(0,90),beverage,startedOn:today(),stage:'planned',entries:[],recipeStatus:'unverified'};if(!commit(v=>[b,...v]))return;setSelected(id);setName('');}
 function record(e:React.FormEvent){e.preventDefault();if(!active||!note.trim())return;try{const entry={id:crypto.randomUUID(),date:today(),stage,note:note.trim(),gravity:gravity.trim()===''?null:Number(gravity)};if(!commit(v=>{if(!v.some(b=>b.id===active.id))throw Error('Batch was removed in another tab.');return v.map(b=>b.id===active.id?addEntry(b,entry):b);}))return;setNote('');setGravity('');setNotice('Entry saved locally.');}catch{setNotice('Check the entry and gravity (0.900–1.200) before saving.');}}
 function exportJournal(){try{const blob=new Blob([savePayload(readJournalStrict(localStorage))],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ferment-ai-journal.json';a.click();URL.revokeObjectURL(url);}catch{setNotice('Cannot export unreadable journal data. No changes were made.');}}
 if(!ready)return <p className="mx-auto max-w-5xl p-10" role="status">Opening your journal…</p>;
 return <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
 <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#806177]">Your private studio</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">Batch journal.</h1>
 <p className="mt-4 max-w-2xl text-[#68686d]">Keep dated observations and measurements as they happen. Records are self-reported, not independently verified or interpreted as proof of fermentation safety.</p>
 <p className="mt-3 text-sm text-[#76546b]">Local to this browser only. Clearing browser data may erase your journal. No account sync is provided; export a backup regularly.</p>
 {notice&&<p role="status" className="mt-5 rounded-xl bg-[#f8f1f5] p-4">{notice}</p>}
 <div className="mt-8 flex flex-wrap gap-3"><Link href="/journal/insights" className="rounded-full border border-[#c9b8c3] px-5 py-3 font-medium">Review gravity observations</Link><Link href="/journal/packaging" className="rounded-full border border-[#c9b8c3] px-5 py-3 font-medium">Review packaging evidence</Link><Link href="/backup" className="rounded-full border border-[#c9b8c3] px-5 py-3 font-medium">Studio backup &amp; restore</Link><button type="button" onClick={exportJournal} className="rounded-full border border-[#c9b8c3] px-5 py-3 font-medium">Export JSON backup</button></div>
 <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
 <div className="rounded-[28px] border border-[#e7e7e7] bg-white p-6"><h2 className="text-xl font-semibold">Start a record</h2><p className="mt-2 text-sm text-[#68686d]">A journal is not a validated recipe or a recommendation to ferment.</p>
 <form onSubmit={create} className="mt-5 space-y-4"><label className="block text-sm font-medium">Batch name<input className={input+' mt-2'} maxLength={90} required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Autumn orchard"/></label>
 <label className="block text-sm font-medium">Beverage category<select className={input+' mt-2'} value={beverage} onChange={e=>setBeverage(e.target.value)}>{[['cider','Cider'],['mead','Mead'],['fruit-wine','Fruit wine'],['other','Other / observational']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
 <button className="min-h-12 w-full rounded-full bg-[#1d1d1f] px-5 py-3 text-white">Create batch</button></form>
 <h2 className="mt-9 text-lg font-semibold">Your batches ({batches.length})</h2>
 <div className="mt-3 space-y-2">{batches.length===0?<p className="text-sm text-[#68686d]">No batches yet.</p>:batches.map(b=><button key={b.id} type="button" aria-pressed={selected===b.id} onClick={()=>{setSelected(b.id);setStage(b.stage);}} className={'w-full rounded-xl border p-4 text-left focus-visible:outline focus-visible:outline-2 '+(selected===b.id?'border-[#77566e] bg-[#f8f1f5]':'border-[#e7e7e7]')}><span className="block font-semibold">{b.name}</span><span className="text-sm text-[#68686d]">{b.beverage} · {b.stage} · {b.entries.length} observations</span></button>)}</div></div>
 <section className="rounded-[28px] border border-[#e7e7e7] bg-white p-6" aria-label="Selected batch">{!active?<p className="text-[#68686d]">Choose a batch to record an observation.</p>:<>
 <h2 className="text-2xl font-semibold">{active.name}</h2><p className="mt-2 text-sm text-[#68686d]">Started {active.startedOn} · Recipe unverified · No automatic ABV or safety assessment.</p>
 <form onSubmit={record} className="mt-7 space-y-4"><h3 className="font-semibold">Add an observation</h3>
 <label className="block text-sm font-medium">Current status<select className={input+' mt-2'} value={stage} onChange={e=>setStage(e.target.value)}>{STAGES.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
 <label className="block text-sm font-medium">Notes<textarea className={input+' mt-2'} rows={4} required maxLength={600} value={note} onChange={e=>setNote(e.target.value)} placeholder="What did you observe? Avoid treating appearance or smell alone as a safety test."/></label>
 <label className="block text-sm font-medium">Hydrometer specific gravity (optional, observed)<input className={input+' mt-2'} type="number" min="0.9" max="1.2" step="0.001" value={gravity} onChange={e=>setGravity(e.target.value)} placeholder="e.g. 1.045"/></label>
 <button className="min-h-12 rounded-full bg-[#1d1d1f] px-6 py-3 text-white">Save observation</button></form>
 <h3 className="mt-9 font-semibold">Observation history</h3><ol className="mt-4 space-y-3">{[...active.entries].reverse().map(e=><li key={e.id} className="rounded-xl border border-[#e7e7e7] p-4"><p className="text-xs uppercase tracking-wide text-[#806177]">{e.date} · {e.stage}{e.gravity!==null?' · SG '+e.gravity.toFixed(3):''}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{e.note}</p></li>)}</ol>{active.entries.length===0&&<p className="mt-2 text-sm text-[#68686d]">No observations recorded.</p>}</>}</section></div>
 <p className="mt-8 text-sm text-[#68686d]">Do not taste or package a questionable batch based on journal entries. Contamination, pressure and alcohol content require appropriate independent checks.</p>
 </div>;
}
