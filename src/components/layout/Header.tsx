import TokenBalance from '../common/TokenBalance';

type User = {
  name: string;
  tokens: number;
};

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white/80 shadow rounded-b-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-bloom-primary">Bloom</span>
      </div>
      <nav className="flex gap-8 text-gray-700 font-medium">
        <a href="#" className="hover:text-bloom-accent transition">Dashboard</a>
        <a href="#" className="hover:text-bloom-accent transition">PD Marketplace</a>
        <a href="#" className="hover:text-bloom-accent transition">Calendar</a>
        <a href="#" className="hover:text-bloom-accent transition">Profile</a>
      </nav>
      <div className="flex items-center gap-4">
        <TokenBalance tokens={user.tokens} />
        <div className="w-10 h-10 rounded-full bg-bloom-primary flex items-center justify-center text-white font-bold shadow">
          SC
        </div>
      </div>
    </header>
  );
}
