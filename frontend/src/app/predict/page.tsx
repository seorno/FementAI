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
  const [loading, setLoading] = useState(false);

  const handlePredict = async (data: any) => {
    setLoading(true);
    const res = await predictBatch(data);
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Predict Fermentation Outcomes</h1>
        <ProductSelector value={product} onChange={setProduct} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <BatchForm productType={product} onSubmit={handlePredict} />
        </div>
        <div className="lg:col-span-8">
          {loading ? (
            <div className="glass-card h-64 flex items-center justify-center animate-pulse text-accent-teal">
              Running model...
            </div>
          ) : result ? (
            <ResultsPanel result={result} />
          ) : (
            <div className="glass-card h-64 flex items-center justify-center text-gray-500">
              Enter parameters and click predict to see results
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
