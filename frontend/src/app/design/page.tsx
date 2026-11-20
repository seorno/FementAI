'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TasteAtlas from '@/components/TasteAtlas';
import FeasibilityReview from '@/components/FeasibilityReview';
import {saveDesignAsPlannedBatch} from '@/lib/design-journal-handoff.mjs';
import {
  createDefaultDraft, sanitiseDraft, summariseDraft, DRAFT_STORAGE_KEY,
  OCCASIONS, SERVING, CARBONATION, INGREDIENTS, EQUIPMENT,
  type TasteDraft, type IngredientKey, type EquipmentKey,
} from '@/lib/taste-draft.mjs';

const steps = ['The moment', 'Taste Atlas', 'What you have', 'Your direction'] as const;
const panel = 'rounded-[28px] border border-[#e7e7e7] bg-white p-5 sm:p-8';
const caption = 'text-xs font-semibold uppercase tracking-[0.22em] text-[#806177]';
const selectClass = (chosen: boolean) => chosen
  ? 'border-[#77566e] bg-[#f8f1f5] text-[#382a34] shadow-sm'
  : 'border-[#e6e1e4] bg-white text-[#514b51] hover:border-[#b9a5b2]';

export default function DesignPage() {
  const [draft, setDraft] = useState<TasteDraft>(createDefaultDraft);
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(0);
  const [ineligible, setIneligible] = useState(false);
  const [notice, setNotice] = useState('');
  const [journalNotice, setJournalNotice] = useState('');
  const [journalCategory, setJournalCategory] = useState('other');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) setDraft(sanitiseDraft(JSON.parse(saved)));
    } catch {
      setNotice('A previous draft could not be restored. You can create a new one.');
    } finally {
      setHydrated(true);
    }
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(sanitiseDraft(draft)));
    } catch {
      setNotice('Your browser could not save this draft. Your selections remain available until you leave this page.');
    }
  }, [draft, hydrated]);

  if (!hydrated) {
    return <div className="max-w-5xl mx-auto px-6 py-24 text-center text-[#68686d]" role="status">Preparing your studio…</div>;
  }
  if (!draft.adultConfirmed) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 sm:py-32">
        <div className={panel}>
          <p className={caption}>Ferment AI · Home studio</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em]">For adults only.</h1>
          {ineligible ? (
            <>
              <p className="mt-4 text-[#68686d] leading-relaxed">The alcoholic-drink design studio is not available to under-18s. You can still read about our experimental fermentation research.</p>
              <Link href="/about" className="mt-8 inline-flex rounded-full border border-[#e5dfe2] px-6 py-3">About Ferment AI</Link>
            </>
          ) : (
            <>
              <p className="mt-4 text-[#68686d] leading-relaxed">This prototype explores preferences for home-fermented, non-distilled alcoholic drinks. Please confirm that you are at least 18 years old to continue.</p>
              <p className="mt-3 text-sm text-[#858087]">This is an age acknowledgement, not legal identity verification. No drink recipes or safety certification are generated here.</p>
              <button type="button" onClick={() => setDraft((current) => ({ ...current, adultConfirmed: true }))} className="mt-8 w-full min-h-12 rounded-full bg-[#1d1d1f] px-6 py-3 text-white font-medium hover:bg-[#493943]">I am 18 or older</button>
              <button type="button" onClick={() => setIneligible(true)} className="mt-3 w-full min-h-12 rounded-full border border-[#e4dce0] px-6 py-3 font-medium">I am under 18</button>
            </>
          )}
        </div>
      </div>
    );
  }

  const summary = summariseDraft(draft);
  const ingredientCount = Object.values(draft.ingredients).filter(Boolean).length;
  const gearCount = Object.values(draft.equipment).filter(Boolean).length;
  const selected = (yes: boolean) => 'min-h-[48px] rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 ' + selectClass(yes);

  function toggleIngredient(id: IngredientKey) {
    setDraft((current) => ({ ...current, ingredients: { ...current.ingredients, [id]: !current.ingredients[id] } }));
  }
  function toggleEquipment(id: EquipmentKey) {
    setDraft((current) => ({ ...current, equipment: { ...current.equipment, [id]: !current.equipment[id] } }));
  }
  function changeNumber(field: 'volumeLitres' | 'budgetGBP', input: string) {
    const value = Number(input);
    if (!Number.isFinite(value)) return;
    setDraft((current) => ({ ...current, [field]: field === 'volumeLitres' ? Math.min(25, Math.max(0.25, value)) : Math.min(500, Math.max(0, value)) }));
  }
  function saveConcept() {
    try {
      const date = new Date().toLocaleDateString('en-CA');
      saveDesignAsPlannedBatch(window.localStorage, draft, {id:window.crypto.randomUUID(),date,beverage:journalCategory});
      setJournalNotice('Saved as an unverified planned concept in your local journal. No recipe or safety assessment was created.');
    } catch (error) {
      setJournalNotice(error instanceof Error ? error.message : 'Could not save the concept. Existing journal data was not changed.');
    }
  }
  function reset() {
    if (!window.confirm('Clear your taste draft and start again?')) return;
    setDraft({ ...createDefaultDraft(), adultConfirmed: true });
    setStep(0);
    setNotice('');
  }

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
      <div className="mb-9 sm:mb-12 flex flex-col md:flex-row justify-between md:items-end gap-5">
        <div>
          <p className={caption}>A flavour-first experiment</p>
          <h1 className="mt-3 text-4xl sm:text-6xl font-semibold tracking-[-0.055em] leading-[1.1]">Design your drink.</h1>
          <p className="mt-4 text-base sm:text-lg text-[#68686d] max-w-xl">Start with the experience. Discover the taste you want. Keep your idea, even before you have the recipe.</p>
        </div>
        <div className="text-sm text-[#68686d] bg-white border border-[#e7e7e7] rounded-2xl px-5 py-3 max-w-sm">
          <p className="font-medium text-[#382a34]">Saved in this browser</p>
          <p className="mt-1">Not uploaded, analysed by AI or used to train models.</p>
        </div>
      </div>
      {notice && <p role="alert" className="mb-5 rounded-xl border border-[#dfc0b4] bg-[#fff6f1] p-4 text-sm text-[#805747]">{notice}</p>}

      <nav aria-label="Drink design steps" className="mb-10 overflow-x-auto">
        <ol className="grid grid-cols-4 min-w-[440px] gap-2">
          {steps.map((label, index) => (
            <li key={label}>
              <button type="button" aria-current={step === index ? 'step' : undefined} onClick={() => setStep(index)}
                className={'w-full min-h-[50px] rounded-xl px-2 py-3 text-xs sm:text-sm font-medium transition-colors ' + (step === index ? 'bg-[#1d1d1f] text-white' : 'bg-white border border-[#e7e7e7] hover:bg-[#f6eef3] text-[#5d555b]')}>
                <span className="opacity-60 mr-2">{String(index + 1).padStart(2, '0')}</span>{label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {step === 0 && (
        <section aria-labelledby="moment-title" className="space-y-8">
          <header><p className={caption}>Step 1 · The experience</p><h2 id="moment-title" className="mt-3 text-4xl sm:text-5xl font-semibold tracking-[-0.05em]">What is the moment?</h2><p className="mt-4 text-[#68686d]">The occasion helps describe the experience. It does not determine the chemistry.</p></header>
          <div className={panel}>
            <h3 className="text-lg font-semibold mb-5">I&apos;m making something for…</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {OCCASIONS.map((option) => (
                <button type="button" key={option.id} aria-pressed={draft.occasion === option.id} onClick={() => setDraft((current) => ({ ...current, occasion: option.id }))} className={selected(draft.occasion === option.id)}>
                  <span className="block font-semibold">{option.label}</span><span className="block mt-1 text-sm opacity-70">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className={panel}><h3 className="text-lg font-semibold mb-5">How will you serve it?</h3><div className="flex flex-col gap-2">
              {SERVING.map((option) => <button type="button" key={option.id} aria-pressed={draft.serving === option.id} onClick={() => setDraft((current) => ({ ...current, serving: option.id }))} className={selected(draft.serving === option.id)}>{option.label}</button>)}
            </div></div>
            <div className={panel}><h3 className="text-lg font-semibold mb-5">What about bubbles?</h3><div className="flex flex-col gap-2">
              {CARBONATION.map((option) => <button type="button" key={option.id} aria-pressed={draft.carbonation === option.id} onClick={() => setDraft((current) => ({ ...current, carbonation: option.id }))} className={selected(draft.carbonation === option.id)}>{option.label}</button>)}
            </div><p className="mt-4 text-xs text-[#756d74]">This is only a preference. Carbonation requires validated pressure-safe methods before any recipe can be suggested.</p></div>
          </div>
        </section>
      )}

      {step === 1 && <TasteAtlas value={draft} onChange={setDraft} />}

      {step === 2 && (
        <section aria-labelledby="inventory-title" className="space-y-8">
          <header><p className={caption}>Step 3 · Your reality</p><h2 id="inventory-title" className="mt-3 text-4xl sm:text-5xl font-semibold tracking-[-0.05em]">What do you have?</h2><p className="mt-4 text-[#68686d]">We&apos;ll use these constraints in a future feasibility engine. Nothing here is a brewing instruction.</p></header>
          <div className="grid lg:grid-cols-2 gap-5">
            <div className={panel}><h3 className="text-lg font-semibold">Ingredients at home</h3><p className="text-sm text-[#68686d] mt-1 mb-5">Choose everything you already have.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {INGREDIENTS.map((item) => <label key={item.id} className={selected(draft.ingredients[item.id]) + ' flex items-center gap-3 cursor-pointer'}><input type="checkbox" checked={draft.ingredients[item.id]} onChange={() => toggleIngredient(item.id)} className="h-5 w-5 accent-[#77566e]" /><span>{item.label}</span></label>)}
              </div><p className="mt-4 text-xs text-[#68686d]">{ingredientCount} ingredients selected</p>
            </div>
            <div className={panel}><h3 className="text-lg font-semibold">Equipment available</h3><p className="text-sm text-[#68686d] mt-1 mb-5">It&apos;s fine if you aren&apos;t sure yet.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {EQUIPMENT.map((item) => <label key={item.id} className={selected(draft.equipment[item.id]) + ' flex items-center gap-3 cursor-pointer'}><input type="checkbox" checked={draft.equipment[item.id]} onChange={() => toggleEquipment(item.id)} className="h-5 w-5 accent-[#77566e]" /><span>{item.label}</span></label>)}
              </div><p className="mt-4 text-xs text-[#68686d]">{gearCount} equipment items selected</p>
            </div>
          </div>
          <div className={panel}>
            <h3 className="text-lg font-semibold mb-5">Practical constraints</h3>
            <div className="grid sm:grid-cols-3 gap-5">
              <label className="block text-sm font-medium">Date you want it ready <span className="mt-2 block"><input type="date" value={draft.readyBy} onChange={(event) => setDraft((current) => ({ ...current, readyBy: event.target.value }))} className="w-full min-h-12 rounded-xl border border-[#e1d9de] px-3 bg-white" /></span></label>
              <label className="block text-sm font-medium">Quantity (litres) <span className="mt-2 block"><input type="number" min="0.25" max="25" step="0.25" value={draft.volumeLitres} onChange={(event) => changeNumber('volumeLitres', event.target.value)} className="w-full min-h-12 rounded-xl border border-[#e1d9de] px-3 bg-white" /></span></label>
              <label className="block text-sm font-medium">Budget (£) <span className="mt-2 block"><input type="number" min="0" max="500" step="1" value={draft.budgetGBP} onChange={(event) => changeNumber('budgetGBP', event.target.value)} className="w-full min-h-12 rounded-xl border border-[#e1d9de] px-3 bg-white" /></span></label>
            </div>
            <p className="mt-5 text-xs text-[#756d74]">A deadline or budget does not make an unsafe or impossible fermentation feasible. The upcoming recipe engine must validate everything separately.</p>
          </div>
        </section>
      )}

      {step === 3 && (
        <section aria-labelledby="summary-title" className="space-y-6 max-w-4xl mx-auto">
          <div className="text-center"><p className={caption}>Step 4 · Your direction</p><h2 id="summary-title" className="mt-3 text-4xl sm:text-6xl font-semibold tracking-[-0.05em]">{summary.title}</h2><p className="mt-5 text-lg text-[#68686d]">{summary.description}</p></div>
          <div className={panel}>
            <h3 className="text-xl font-semibold">Your design snapshot</h3>
            <dl className="mt-6 grid sm:grid-cols-2 gap-x-8 gap-y-4">
              <div><dt className="text-xs uppercase tracking-wide text-[#858087]">Occasion</dt><dd className="font-medium mt-1">{OCCASIONS.find((o) => o.id === draft.occasion)?.label}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-[#858087]">Serving</dt><dd className="font-medium mt-1">{SERVING.find((o) => o.id === draft.serving)?.label}; {CARBONATION.find((o) => o.id === draft.carbonation)?.label.toLowerCase()}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-[#858087]">Flavours to avoid</dt><dd className="font-medium mt-1">{summary.avoided.length ? summary.avoided.join(', ') : 'None selected'}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-[#858087]">Supplies</dt><dd className="font-medium mt-1">{ingredientCount} ingredients, {gearCount} equipment items</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-[#858087]">Desired date</dt><dd className="font-medium mt-1">{draft.readyBy || 'Flexible'}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-[#858087]">Quantity / budget</dt><dd className="font-medium mt-1">{draft.volumeLitres} L · £{draft.budgetGBP}</dd></div>
            </dl>
            <p className="mt-6 rounded-2xl bg-[#f8f3f5] p-5 text-sm text-[#6f5365]">{summary.disclaimer}</p>
          </div>
          <FeasibilityReview draft={draft} />
          <section className={panel} aria-labelledby="journal-handoff-title">
            <p className={caption}>Keep your idea</p>
            <h3 id="journal-handoff-title" className="mt-3 text-2xl font-semibold">Save to your batch journal</h3>
            <p className="mt-3 text-sm text-[#68686d]">Create a planned, unverified concept with a dated record of your taste intentions. This does not mean fermentation is feasible or safe. No ingredients, recipe or measurements are generated.</p>
            <label className="mt-5 block max-w-xs text-sm font-medium">Journal category
              <select value={journalCategory} onChange={e=>setJournalCategory(e.target.value)} className="mt-2 block w-full min-h-12 rounded-xl border border-[#d9d0d6] bg-white px-3">
                <option value="other">Undecided / concept only</option>
                <option value="cider">Cider</option>
                <option value="mead">Mead</option>
                <option value="fruit-wine">Fruit wine</option>
              </select>
            </label>
            <button type="button" onClick={saveConcept} className="mt-5 min-h-12 rounded-full bg-[#1d1d1f] px-6 py-3 font-medium text-white">Save planned concept locally</button>
            {journalNotice&&<p role="status" className="mt-4 rounded-xl bg-[#f8f1f5] p-4 text-sm">{journalNotice} <Link href="/journal" className="underline">Open journal</Link></p>}
          </section>
          <div className="rounded-[28px] bg-[#30242e] p-7 sm:p-9 text-white">
            <h3 className="text-2xl font-semibold tracking-tight">Your taste is saved.</h3>
            <p className="mt-3 text-[#e2d8df] leading-relaxed">This is a working taste-design preview, not a home-brewing recipe generator yet. You can now check practical constraints using a conservative server screen. Source-reviewed recipes and validated sensory predictions are not yet available.</p>
            <button type="button" onClick={() => setStep(1)} className="mt-6 rounded-full bg-white px-6 py-3 text-[#30242e] font-semibold">Refine my flavour</button>
          </div>
        </section>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#e5dfe2] pt-7">
        <div className="flex gap-3">
          <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="min-h-12 rounded-full border border-[#ded6db] px-6 font-medium disabled:opacity-40">Back</button>
          <button type="button" onClick={reset} className="min-h-12 rounded-full px-4 text-sm text-[#756d74] hover:underline">Start again</button>
        </div>
        {step < steps.length - 1 ? <button type="button" onClick={() => setStep(Math.min(steps.length - 1, step + 1))} className="min-h-12 rounded-full bg-[#1d1d1f] text-white px-7 font-medium hover:bg-[#493943]">{step === 2 ? 'Review your direction' : 'Continue'} <span aria-hidden="true">→</span></button> : <Link href="/" className="inline-flex items-center min-h-12 rounded-full border border-[#dcd1d8] px-6 font-medium">Return to studio</Link>}
      </div>
      <p className="mt-5 text-xs text-[#777077] text-center">Preference prototype · server screening only on request · no cloud account, recipe, model-generated ABV, or safety certification</p>
    </div>
  );
}
