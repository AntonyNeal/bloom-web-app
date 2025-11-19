import Header from '../components/layout/Header';
import TokenWallet from '../components/dashboard/TokenWallet';
import PDOpportunities from '../components/dashboard/PDOpportunities';
import QuickActions from '../components/dashboard/QuickActions';
import TokenBalance from '../components/common/TokenBalance';
import RevenueSplitIndicator from '../components/common/RevenueSplitIndicator';

const mockUser = {
  name: "Dr. Sarah Chen",
  tokens: 500,
  revenueShare: 0.85,
  pdHoursCompleted: 12,
  pdHoursRequired: 10,
  monthlyBoost: 2400
};

const mockTransactions: {
  id: number;
  type: 'earned' | 'spent' | 'decay' | 'bonus';
  amount: number;
  description: string;
  date: string;
}[] = [
  { id: 1, type: 'earned', amount: 50, description: 'Supervision provided', date: '2 hours ago' },
  { id: 2, type: 'spent', amount: -30, description: 'EMDR Training', date: '1 day ago' },
  { id: 3, type: 'earned', amount: 25, description: 'Case consultation', date: '3 days ago' },
  { id: 4, type: 'decay', amount: -5, description: 'Monthly fee', date: '1 week ago' },
  { id: 5, type: 'bonus', amount: 100, description: 'Referral bonus', date: '2 weeks ago' }
];

const mockPDSessions = [
  { id: 1, title: 'Trauma-Informed Care Workshop', date: 'Nov 28', time: '2:00 PM', cost: 45, spotsLeft: 3 },
  { id: 2, title: 'CBT Advanced Techniques', date: 'Dec 2', time: '10:00 AM', cost: 60, spotsLeft: 8 },
  { id: 3, title: 'Group Supervision Session', date: 'Dec 5', time: '4:00 PM', cost: 30, spotsLeft: 5 }
];

export default function Homepage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bloom-primary to-[#764ba2] text-gray-900 font-inter">
      <Header user={mockUser} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {mockUser.name}</h1>
              <RevenueSplitIndicator revenueShare={mockUser.revenueShare} />
            </div>
            <div className="flex gap-6 mt-4 md:mt-0">
              <div className="bg-white/80 rounded-lg shadow px-6 py-4 flex flex-col items-center">
                <span className="text-sm text-gray-500">Tokens held</span>
                <TokenBalance tokens={mockUser.tokens} animate />
              </div>
              <div className="bg-white/80 rounded-lg shadow px-6 py-4 flex flex-col items-center">
                <span className="text-sm text-gray-500">PD Hours</span>
                <span className="font-bold text-bloom-primary text-xl">{mockUser.pdHoursCompleted}/{mockUser.pdHoursRequired}</span>
              </div>
              <div className="bg-white/80 rounded-lg shadow px-6 py-4 flex flex-col items-center">
                <span className="text-sm text-gray-500">Next PD session</span>
                <span className="font-bold text-bloom-accent text-xl">Tomorrow 2pm</span>
              </div>
              <div className="bg-white/80 rounded-lg shadow px-6 py-4 flex flex-col items-center">
                <span className="text-sm text-gray-500">Monthly boost</span>
                <span className="font-bold text-bloom-success text-xl">+${mockUser.monthlyBoost}</span>
              </div>
            </div>
          </div>
        </section>
        {/* Main Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <TokenWallet tokens={mockUser.tokens} transactions={mockTransactions} />
          <PDOpportunities sessions={mockPDSessions} />
          <QuickActions />
        </section>
      </main>
      <footer className="mt-12 py-6 text-center text-gray-400 bg-white/10">
        <a href="/support" className="underline text-bloom-accent">Support</a> &nbsp;|&nbsp; Powered by Life Psychology Australia
      </footer>
    </div>
  );
}
