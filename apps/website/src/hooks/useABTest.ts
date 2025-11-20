import { createContext, useContext } from 'react';

// A/B Test Configuration
export interface TestConfig {
  name: string;
  description: string;
  variants: string[];
  weights: number[];
  hypothesis: string;
}

export interface ABTestContextType {
  variant: string | null;
  setVariant: (variant: string) => void;
  testConfig: TestConfig | null;
  isDevMode: boolean;
}

export const ABTestContext = createContext<ABTestContextType | undefined>(
  undefined
);

export const useABTest = () => {
  const context = useContext(ABTestContext);
  if (context === undefined) {
    throw new Error('useABTest must be used within an ABTestProvider');
  }
  return context;
};
