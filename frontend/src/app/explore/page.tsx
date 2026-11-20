'use client';
import { useState, useEffect } from 'react';
import { ProductType } from '@/lib/constants';
import { getNetwork } from '@/lib/api';
import ProductSelector from '@/components/ProductSelector';
import NetworkGraph from '@/components/NetworkGraph';
import { COLORS } from '@/lib/constants';

export default function ExplorePage() {
  const [product, setProduct] = useState<ProductType>('Kombucha');
  const [networkData, setNetworkData] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setNetworkData(null);
    setError(false);
    getNetwork(product).then(data => { if (active) setNetworkData(data); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [product]);

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto px-4 py-8 w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs tracking-widest uppercase text-amber-300 mb-2">Research lab · experimental and synthetic data</p>
          <h1 className="text-4xl font-bold">Microbial network</h1>
        </div>
        <ProductSelector value={product} onChange={setProduct} />
      </div>
      {error ? (
        <div role="alert" className="glass-card p-8 text-red-200">The research network is unavailable. No illustrative fallback has been substituted. Try again later.</div>
      ) : !networkData ? (
        <p role="status" className="glass-card p-8 text-gray-400">Loading network…</p>
      ) : (
        <>
          <div className="mb-6 p-4 rounded-lg border border-amber-500/50 bg-amber-500/10">
            <strong>Data provenance: {networkData.data_provenance}</strong>
            <p className="text-sm mt-1">These exploratory associations are not validated predictions or evidence of causation. Synthetic and blended datasets are for demonstration.</p>
          </div>
          <div className="flex-grow w-full relative min-h-[400px]">
            <NetworkGraph data={networkData} />
            <div className="absolute bottom-4 left-4 glass-card p-4 text-sm z-10">
              <h4 className="font-bold mb-2">Legend</h4>
              <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.positive }} /> Positive association</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.danger }} /> Negative association</div>
              <p className="text-gray-400 mt-2 text-xs">Node size = abundance</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
