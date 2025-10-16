import { TokenBalance } from '../tokens/TokenBalance';
import { RevenueSplitIndicator } from '../tokens/RevenueSplitIndicator';
import { PDMarketplace } from '../marketplace/PDMarketplace';

export const PractitionerDashboard = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-bloom-primary mb-4">Practitioner Dashboard</h1>
    <TokenBalance />
    <RevenueSplitIndicator />
    <PDMarketplace />
    {/* Add analytics, calendar, etc. */}
  </div>
);
