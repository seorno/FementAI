import { ProductType, PRODUCT_TYPES } from '@/lib/constants';

export default function ProductSelector({ value, onChange }: { value: ProductType; onChange: (v: ProductType) => void }) {
  return (
    <div className="flex gap-4 p-2 glass-card rounded-full inline-flex">
      {PRODUCT_TYPES.map(type => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`px-6 py-2 rounded-full font-bold transition-all ${value === type ? 'bg-accent-cyan text-navy-900 shadow-[0_0_15px_rgba(14,165,233,0.5)]' : 'text-gray-400 hover:text-white'}`}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
