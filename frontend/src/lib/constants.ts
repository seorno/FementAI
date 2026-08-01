export const PRODUCT_TYPES = ['Kombucha', 'Kimchi'] as const;
export type ProductType = typeof PRODUCT_TYPES[number];

export const COLORS = {
  positive: '#06d6a0',
  info: '#0ea5e9',
  warning: '#f59e0b',
  danger: '#f43f5e',
  background: '#0a0f1e',
  card: '#111827',
};

export const DEFAULT_RANGES = {
  Kombucha: {
    temperature: [20, 30],
    substrate: [5, 15], // sugar %
    ph: [3.5, 4.5],
    duration: [7, 14], // days
  },
  Kimchi: {
    temperature: [10, 20],
    substrate: [1, 5], // salt %
    ph: [4.5, 6.0],
    duration: [14, 28], // days
  }
};
