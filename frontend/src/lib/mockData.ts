import { ProductType } from "./constants";

export const mockPrediction = (productType: ProductType, params: any) => ({
  predictedAcidity: productType === 'Kombucha' ? 3.2 : 4.0,
  predictedABV: productType === 'Kombucha' ? 0.5 : 0.1,
  offFlavorRisk: productType === 'Kombucha' ? (params.temperature > 28 ? 'High' : 'Low') : 'Medium',
  fermentationCurve: Array.from({ length: params.duration || 14 }).map((_, i) => ({
    day: i,
    pH: productType === 'Kombucha' ? 4.5 - i * 0.1 : 5.5 - i * 0.1,
    acidity: i * 0.2,
  })),
  shapValues: [
    { feature: 'Temperature', importance: 0.45 },
    { feature: 'Duration', importance: 0.30 },
    { feature: 'Initial pH', importance: 0.15 },
    { feature: productType === 'Kombucha' ? 'Sugar' : 'Salt', importance: 0.10 },
  ],
  is_simulated_prediction: true,
});

export const mockNetwork = (productType: ProductType) => ({
  nodes: [
    { data: { id: 's1', label: 'Lactobacillus', abundance: 80, role: 'Lactic Acid Producer' } },
    { data: { id: 's2', label: 'Saccharomyces', abundance: 50, role: 'Ethanol Producer' } },
    { data: { id: 's3', label: 'Acetobacter', abundance: 60, role: 'Acetic Acid Producer' } },
  ],
  edges: [
    { data: { source: 's2', target: 's3', type: 'positive', strength: 0.8 } },
    { data: { source: 's1', target: 's3', type: 'negative', strength: -0.4 } },
  ]
});
