import { useEffect, useState } from 'react';

interface TokenBalanceProps {
  tokens: number;
  animate?: boolean;
}

export default function TokenBalance({ tokens, animate }: TokenBalanceProps) {
  const [display, setDisplay] = useState(animate ? 0 : tokens);

  useEffect(() => {
    if (!animate) return;
    let start = 0;
    const duration = 800;
    const increment = tokens / (duration / 10);
    const timer = setInterval(() => {
      start += increment;
      if (start >= tokens) {
        setDisplay(tokens);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 10);
    return () => clearInterval(timer);
  }, [tokens, animate]);

  return (
    <span className="font-bold text-bloom-primary text-xl">{display} BLM</span>
  );
}
