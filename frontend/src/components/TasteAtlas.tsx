'use client';

import {
  cyclePreference, FLAVOUR_NOTES, SENSORY_AXES, summariseDraft,
  type TasteDraft, type FlavourNote, type SensoryKey,
} from '@/lib/taste-draft.mjs';

type Props = { value: TasteDraft; onChange: (next: TasteDraft) => void };

const noteStateStyles = {
  neutral: 'border-[#e3dce0] bg-white text-[#4b4149] hover:border-[#806177]',
  love: 'border-[#77566e] bg-[#77566e] text-white shadow-[0_8px_25px_rgba(111,69,101,0.15)]',
  avoid: 'border-[#b97b83] bg-[#fff0f0] text-[#944e58]',
};

export default function TasteAtlas({ value, onChange }: Props) {
  const summary = summariseDraft(value);
  function changeNote(note: FlavourNote) {
    onChange({ ...value, notes: { ...value.notes, [note]: cyclePreference(value.notes[note]) } });
  }
  function changeAxis(axis: SensoryKey, next: number) {
    if (!Number.isFinite(next)) return;
    onChange({ ...value, sensory: { ...value.sensory, [axis]: Math.min(100, Math.max(0, next)) } });
  }
  return (
    <section aria-labelledby="taste-atlas-heading" className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#806177]">Step 2 · Your palate</p>
        <h2 id="taste-atlas-heading" className="mt-3 text-4xl sm:text-5xl tracking-[-0.05em] font-semibold">Explore the flavours you love.</h2>
        <p className="mt-4 text-[#68686d] leading-relaxed">Tap a flavour once to prefer it, twice to avoid it, and a third time to reset it. Then tune your taste using the controls.</p>
      </div>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
        <div className="rounded-[30px] border border-[#e7e1e4] bg-[#fdfafc] p-4 sm:p-7">
          <h3 className="text-base font-medium tracking-tight">Your flavour constellation</h3>
          <p className="mt-1 text-xs text-[#777077]">A visual map of preferences, not microbial or chemical interactions.</p>
          <div className="relative aspect-square max-w-[500px] mx-auto" aria-label="Flavour families">
            <div aria-hidden="true" className="absolute inset-[15%] rounded-full border border-dashed border-[#e7dfe4]" />
            <div aria-hidden="true" className="absolute inset-[27%] rounded-full border border-[#eee7ea]" />
            <div className="absolute inset-[34%] rounded-full bg-gradient-to-br from-[#efe2ea] to-[#faf3f7] border border-[#e9dce3] flex flex-col items-center justify-center text-center p-2 pointer-events-none">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#84657c]">Your palette</span>
              <span className="mt-1 text-sm sm:text-lg font-semibold text-[#382a34] capitalize">{value.sensory.acidity >= 70 ? 'Tart' : value.sensory.sweetness >= 70 ? 'Sweet' : value.sensory.body >= 70 ? 'Rich' : 'Balanced'}</span>
            </div>
            {FLAVOUR_NOTES.map((note, index) => {
              const angle = index * (Math.PI / 4) - Math.PI / 2;
              const x = 50 + 35 * Math.cos(angle);
              const y = 50 + 35 * Math.sin(angle);
              const state = value.notes[note.id];
              return (
                <button
                  key={note.id}
                  type="button"
                  style={{ left: x + '%', top: y + '%', transform: 'translate(-50%, -50%)' }}
                  onClick={() => changeNote(note.id)}
                  aria-label={note.label + ' flavour: ' + (state === 'love' ? 'preferred' : state === 'avoid' ? 'avoided' : 'neutral') + '. Activate to change.'}
                  title={note.description}
                  className={'absolute z-10 flex min-h-[54px] w-[76px] sm:w-[104px] flex-col justify-center rounded-2xl border px-1 py-2 text-center transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' + noteStateStyles[state]}
                >
                  <span className="text-xs sm:text-sm font-semibold">{note.label}</span>
                  <span className="text-[10px] opacity-75">{state === 'love' ? 'Love' : state === 'avoid' ? 'Avoid' : 'Neutral'}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-[#69636a]" aria-hidden="true">
            <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-[#77566e] mr-1" /> Love</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-[#f4cbd1] mr-1" /> Avoid</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-full border border-[#aaa] bg-white mr-1" /> Neutral</span>
          </div>
        </div>
        <div className="rounded-[30px] border border-[#e7e7e7] bg-white p-5 sm:p-8">
          <div className="flex flex-wrap justify-between gap-2 items-baseline mb-6">
            <h3 className="text-lg font-semibold">Fine-tune your palate</h3>
            <span className="text-xs text-[#777]">0–100 · personal preference</span>
          </div>
          <div className="space-y-5">
            {SENSORY_AXES.map((axis) => (
              <div key={axis.id}>
                <div className="flex justify-between gap-4 items-center">
                  <label htmlFor={'sense-' + axis.id} className="text-sm font-medium">{axis.label}</label>
                  <output htmlFor={'sense-' + axis.id} className="text-sm tabular-nums text-[#806177]">{value.sensory[axis.id]}</output>
                </div>
                <input
                  id={'sense-' + axis.id}
                  type="range" min={0} max={100} step={5}
                  aria-label={axis.label + ' preference'}
                  value={value.sensory[axis.id]}
                  onChange={(event) => changeAxis(axis.id, Number(event.target.value))}
                  className="mt-2 block w-full h-3 accent-[#77566e] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-[#858087]"><span>{axis.low}</span><span>{axis.high}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div aria-live="polite" className="rounded-[24px] border border-[#eadde4] bg-white px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#84657c]">Your direction</p>
        <p className="mt-2 text-xl font-semibold text-[#30252c]">{summary.title}</p>
        <p className="mt-1 text-[#68686d]">{summary.description}</p>
      </div>
    </section>
  );
}
