import { ProductType } from './constants';
import { mockPrediction, mockNetwork } from './mockData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function predictBatch(data: any) {
  try {
    const res = await fetch(`${API_URL}/api/predict`, {
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
    if (!res.ok) throw new Error('API Error');
    const raw = await res.json();
    return {
      predictedAcidity: raw.predicted_acidity,
      predictedABV: raw.predicted_alcohol_pct || 0,
      offFlavorRisk: raw.off_flavor_risk > 0.5 ? 'High' : 'Low',
      fermentationCurve: raw.fermentation_curve?.map((p: any) => ({
        day: p.hour / 24,
        pH: p.ph,
        acidity: p.acidity,
      })) || [],
      shapValues: raw.top_explanations?.map((e: any) => ({
        feature: e.display_name,
        importance: e.shap_value,
      })) || [],
      is_simulated_prediction: raw.is_simulated_prediction,
    };
  } catch (error) {
    console.warn('API fetch failed, using mock data');
    return mockPrediction(data.productType as ProductType, data);
  }
}

export async function getNetwork(productType: ProductType) {
  try {
    const res = await fetch(`${API_URL}/api/network/${productType.toLowerCase()}`);
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    console.warn('API fetch failed, using mock data');
    return mockNetwork(productType);
  }
}

export async function getProducts() {
  return ['Kombucha', 'Kimchi'];
}
