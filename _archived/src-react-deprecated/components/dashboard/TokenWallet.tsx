import { useEffect, useState } from 'react';

type Transaction = {
  id: number;
  type: 'earned' | 'spent' | 'decay' | 'bonus';
  amount: number;
  description: string;
  date: string;
};

interface TokenWalletProps {
  tokens: number;
  transactions: Transaction[];
}

export default function TokenWallet({ tokens, transactions }: TokenWalletProps) {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const increment = tokens / (duration / 10);
    const timer = setInterval(() => {
      start += increment;
      if (start >= tokens) {
        setBalance(tokens);
        clearInterval(timer);
      } else {
        setBalance(Math.floor(start));
      }
    }, 10);
    return () => clearInterval(timer);
  }, [tokens]);

  return (
    <div className="bg-white/60 backdrop-blur-lg rounded-xl shadow-lg p-6 flex flex-col items-center glass-morph">
      <h2 className="text-xl font-bold text-bloom-primary mb-2">Token Wallet</h2>
      <div className="text-5xl font-extrabold text-bloom-primary mb-2 animate-countup">{balance} BLM</div>
      <div className="w-full mb-4">
        <div className="text-sm font-semibold mb-2">Recent Transactions</div>
        <ul>
          {transactions.slice(0, 5).map(tx => (
            <li key={tx.id} className={`flex justify-between py-1 px-2 rounded ${tx.amount > 0 ? 'text-bloom-success' : 'text-bloom-danger'}`}>
              <span>{tx.description}</span>
              <span>{tx.amount > 0 ? '+' : ''}{tx.amount} BLM</span>
              <span className="text-xs text-gray-400">{tx.date}</span>
            </li>
          ))}
        </ul>
        <a href="#" className="text-bloom-accent text-sm mt-2 inline-block hover:underline">View all transactions</a>
      </div>
      {/* Mini chart placeholder */}
      <div className="w-full h-16 bg-gradient-to-r from-bloom-primary to-bloom-accent rounded-lg mt-2 flex items-center justify-center text-white text-xs">
        Balance trend (chart coming soon)
      </div>
    </div>
  );
}
