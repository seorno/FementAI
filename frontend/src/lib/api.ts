import { ProductType } from './constants';
import { mockPrediction, mockNetwork } from './mockData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

/** Explicitly opt in to illustrative data; outages must never masquerade as predictions. */
export class FermentApiError extends Error {
  constructor(public readonly endpoint: string, public readonly status?: number) {
    super(status ? `Ferment AI service returned HTTP ${status} at ${endpoint}` : `Ferment AI service is unavailable at ${endpoint}`);
    this.name = 'FermentApiError';
  }
}

async function fetchJson(path: string, options?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new FermentApiError(path);
  }
  if (!response.ok) throw new FermentApiError(path, response.status);
  try {
    return await response.json();
  } catch {
    throw new FermentApiError(path);
  }
}

export async function predictBatch(data: any) {
  if (DEMO_MODE) return mockPrediction(data.productType as ProductType, data);
  const raw = await fetchJson('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_type: data.productType?.toLowerCase() || 'kombucha',
      temperature_c: data.temperature,
      ph_initial: data.ph,
      duration_hours: (data.duration || 10) * 24,
      substrate_conc: data.productType === 'Kombucha' ? data.substrate * 10 : undefined,
      salt_conc: data.productType === 'Kimchi' ? data.substrate : undefined,
    }),
  });
  return {
    predictedAcidity: raw.predicted_acidity,
    predictedABV: raw.predicted_alcohol_pct ?? 0,
    offFlavorRisk: raw.off_flavor_risk > 0.5 ? 'High' : 'Low',
    fermentationCurve: raw.fermentation_curve?.map((p: any) => ({
      day: p.hour / 24, pH: p.ph, acidity: p.acidity,
    })) || [],
    shapValues: raw.top_explanations?.map((e: any) => ({
      feature: e.display_name, importance: e.shap_value,
    })) || [],
    is_simulated_prediction: raw.is_simulated_prediction,
  };
}

export async function getNetwork(productType: ProductType) {
  if (DEMO_MODE) return mockNetwork(productType);
  const raw = await fetchJson(`/api/network/${productType.toLowerCase()}`);
  return {
    nodes: raw.nodes.map((n: any) => ({ data: { id: n.id, label: n.label, abundance: n.size * 100 } })),
    edges: raw.edges.map((e: any) => ({ data: { source: e.source, target: e.target, type: e.interaction_type, strength: e.weight } })),
    data_provenance: raw.data_provenance || 'unknown',
  };
}

export async function getProducts() {
  if (DEMO_MODE) return ['Kombucha', 'Kimchi'];
  const raw = await fetchJson('/api/products');
  return raw.products.map((p: { display_name: string }) => p.display_name);
}
