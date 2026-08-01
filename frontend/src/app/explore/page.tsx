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

  useEffect(() => {
    getNetwork(product).then(setNetworkData);
  }, [product]);

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto px-4 py-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Microbial Network</h1>
        <ProductSelector value={product} onChange={setProduct} />
      </div>
      
      <div className="flex-grow w-full relative">
        <NetworkGraph data={networkData} />
        
        <div className="absolute bottom-4 left-4 glass-card p-4 text-sm z-10">
          <h4 className="font-bold mb-2">Legend</h4>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.positive }}></div> Positive Interaction
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.danger }}></div> Competition
          </div>
          <p className="text-gray-400 mt-2 text-xs">Node size = Abundance</p>
        </div>
      </div>
    </div>
  );
}
