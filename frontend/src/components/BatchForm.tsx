import { useState, useEffect } from 'react';
import { ProductType, DEFAULT_RANGES } from '@/lib/constants';

export default function BatchForm({ productType, onSubmit }: { productType: ProductType, onSubmit: (data: any) => void }) {
  const defaults = DEFAULT_RANGES[productType];
  const [temp, setTemp] = useState(defaults.temperature[0]);
  const [ph, setPh] = useState(defaults.ph[0]);
  const [duration, setDuration] = useState(defaults.duration[0]);
  const [substrate, setSubstrate] = useState(defaults.substrate[0]);

  useEffect(() => {
    setTemp(defaults.temperature[0]);
    setPh(defaults.ph[0]);
    setDuration(defaults.duration[0]);
    setSubstrate(defaults.substrate[0]);
  }, [productType, defaults]);

  return (
    <form className="glass-card p-6 flex flex-col gap-6" onSubmit={e => { e.preventDefault(); onSubmit({ productType, temperature: temp, ph, duration, substrate }); }}>
      <h3 className="text-2xl font-bold text-accent-teal">Parameters</h3>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Temperature (°C) - <span className="data-value text-white">{temp}</span></label>
        <input type="range" min="0" max="40" value={temp} onChange={e => setTemp(Number(e.target.value))} className="w-full accent-accent-teal" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Initial pH - <span className="data-value text-white">{ph}</span></label>
        <input type="range" min="2" max="8" step="0.1" value={ph} onChange={e => setPh(Number(e.target.value))} className="w-full accent-accent-teal" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Duration (days) - <span className="data-value text-white">{duration}</span></label>
        <input type="range" min="1" max="60" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full accent-accent-teal" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">{productType === 'Kombucha' ? 'Sugar' : 'Salt'} (%) - <span className="data-value text-white">{substrate}</span></label>
        <input type="range" min="0" max="20" step="0.5" value={substrate} onChange={e => setSubstrate(Number(e.target.value))} className="w-full accent-accent-teal" />
      </div>
      <button type="submit" className="mt-4 px-6 py-3 bg-gradient-to-r from-accent-teal to-accent-cyan text-navy-900 font-bold rounded-lg hover:brightness-110 transition-all">
        Predict Outcome
      </button>
    </form>
  );
}
