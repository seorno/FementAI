'use client';
import { useState } from 'react';
import { ProductType } from '@/lib/constants';
import { predictBatch } from '@/lib/api';
import ProductSelector from '@/components/ProductSelector';
import BatchForm from '@/components/BatchForm';
import ResultsPanel from '@/components/ResultsPanel';

export default function PredictPage() {
  const [product, setProduct] = useState<ProductType>('Kombucha');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async (data: any) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await predictBatch(data));
    } catch {
      setError('The research prediction service could not be reached. No prediction has been generated. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <p className="uppercase tracking-widest text-xs text-amber-300 mb-3">Experimental research lab · not validated for home alcohol production</p>
        <h1 className="text-4xl font-bold mb-4">Explore fermentation models</h1>
        <ProductSelector value={product} onChange={setProduct} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4"><BatchForm productType={product} onSubmit={handlePredict} /></div>
        <div className="lg:col-span-8">
          {loading ? (
            <div role="status" className="glass-card h-64 flex items-center justify-center animate-pulse">Running research model…</div>
          ) : error ? (
            <div role="alert" className="glass-card p-8 border border-red-400 text-red-200">{error}</div>
          ) : result ? (
            <ResultsPanel result={result} />
          ) : (
            <div className="glass-card h-64 flex items-center justify-center text-gray-400 p-8 text-center">Enter research parameters to explore a simulated or literature-informed outcome.</div>
          )}
        </div>
      </div>
    </div>
  );
}
