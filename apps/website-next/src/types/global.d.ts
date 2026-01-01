// Global TypeScript declarations
import type { DataLayerItem } from '../tracking/types';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: DataLayerItem[];
    clarity?: (...args: unknown[]) => void;
  }
}

export {};
