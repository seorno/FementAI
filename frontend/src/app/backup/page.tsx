'use client';
import {useState} from 'react';
import Link from 'next/link';
import {JOURNAL_KEY,loadJournal} from '@/lib/batch-journal.mjs';
import {MEMORY_KEY,loadMemory} from '@/lib/taste-memory.mjs';
import {makeBackup,inspectBackup,restoreBackup} from '@/lib/studio-backup.mjs';
type Preview=ReturnType<typeof inspectBackup>;
export default function BackupPage(){
 const [preview,setPreview]=useState<Preview|null>(null),[notice,setNotice]=useState(''),[confirm,setConfirm]=useState(false);
 function download(){
  try{
   const j=localStorage.getItem(JOURNAL_KEY),m=localStorage.getItem(MEMORY_KEY);
   if(j&&(!Array.isArray(JSON.parse(j).batches)||JSON.parse(j).version!==1))throw Error('Journal format unsupported');
   if(m&&(!Array.isArray(JSON.parse(m).entries)||JSON.parse(m).version!==1))throw Error('Taste memory format unsupported');
   const batches=j?loadJournal(JSON.parse(j)):[];
   const entries=m?loadMemory(JSON.parse(m),batches.map(b=>b.id)):[];
   const blob=new Blob([makeBackup(batches,entries)],{type:'application/json'});
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ferment-ai-studio-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   setNotice('Backup prepared. Keep the file somewhere private.');
  }catch{setNotice('Could not export existing records. Nothing was changed.');}
 }
 async function select(e:React.ChangeEvent<HTMLInputElement>){
  setPreview(null);setConfirm(false);setNotice('');
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>2_000_000){setNotice('File exceeds the 2 MB limit.');return;}
  try{setPreview(inspectBackup(await file.text()));}
  catch(err){setNotice(err instanceof Error?err.message:'Could not inspect backup.');}
 }
 function restore(){
  if(!preview||!confirm)return;
  try{restoreBackup(localStorage,preview);setPreview(null);setConfirm(false);setNotice('Restore complete. Reopen Journal or Taste Memory to see the restored records.');}
  catch(err){setNotice(err instanceof Error?err.message:'Restore failed.');}
 }
 return <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#806177]">Private studio · Data portability</p>
  <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">Your studio backup.</h1>
  <p className="mt-5 text-[#68686d]">Export your batch journal and linked taste memories together, or inspect a previous backup before restoring. Everything is processed in your browser; no upload to a server.</p>
  <section className="mt-8 rounded-[28px] border border-[#e7e7e7] bg-white p-6"><h2 className="text-xl font-semibold">Export</h2><p className="mt-2 text-sm text-[#68686d]">Store your backup securely. Browser storage can be cleared without warning.</p><button onClick={download} className="mt-5 min-h-12 rounded-full bg-[#1d1d1f] px-6 py-3 text-white">Download studio backup</button></section>
  <section className="mt-6 rounded-[28px] border border-[#e7e7e7] bg-white p-6"><h2 className="text-xl font-semibold">Restore</h2><p className="mt-2 text-sm text-[#68686d]">Only Ferment AI studio backups are accepted (up to 2 MB). Restoring replaces both current journal and taste-memory records. Export your current records first.</p>
   <label className="mt-5 block text-sm font-medium">Choose backup JSON<input className="mt-3 block w-full rounded-xl border border-[#d9d0d6] p-3 focus-visible:outline focus-visible:outline-2" type="file" accept=".json,application/json" onChange={select}/></label>
   {preview&&<div className="mt-5 rounded-xl bg-[#f8f1f5] p-5"><h3 className="font-semibold">Restore preview</h3><p className="mt-2 text-sm">{preview.summary.batches} batches · {preview.summary.observations} observations · {preview.summary.reflections} taste reflections</p><p className="mt-2 text-sm">Created: {preview.summary.createdAt}</p><label className="mt-5 flex items-start gap-3 text-sm"><input type="checkbox" checked={confirm} onChange={e=>setConfirm(e.target.checked)}/>I understand this replaces my existing journal and taste memory.</label><button disabled={!confirm} onClick={restore} className="mt-5 min-h-12 rounded-full bg-[#1d1d1f] px-6 py-3 text-white disabled:opacity-40">Replace local records</button></div>}
  </section>
  {notice&&<p role="status" className="mt-5 rounded-xl bg-[#f8f1f5] p-4">{notice}</p>}
  <p className="mt-7 text-sm text-[#68686d]">Backups contain self-reported observations and subjective impressions, not independently verified recipes, alcohol content or consumption-safety assessments.</p>
  <div className="mt-5 flex gap-6 text-sm"><Link href="/journal" className="underline">Journal</Link><Link href="/memory" className="underline">Taste memory</Link></div>
 </div>;
}
