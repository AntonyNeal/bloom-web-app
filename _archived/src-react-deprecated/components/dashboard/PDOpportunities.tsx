type PDSession = {
  id: number;
  title: string;
  date: string;
  time: string;
  cost: number;
  spotsLeft: number;
};

interface PDOpportunitiesProps {
  sessions: PDSession[];
}

export default function PDOpportunities({ sessions }: PDOpportunitiesProps) {
  return (
    <div className="bg-white/80 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-bloom-primary mb-4">Featured PD Sessions</h2>
      <div className="flex flex-col gap-4">
        {sessions.map(session => (
          <div key={session.id} className="bg-gradient-to-r from-bloom-primary to-bloom-accent rounded-lg p-4 shadow hover:scale-105 transition-transform">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">{session.title}</div>
                <div className="text-sm text-white/80">{session.date} • {session.time}</div>
              </div>
              <div className="text-lg font-bold text-bloom-success">{session.cost} BLM</div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <button className="bg-bloom-accent text-white px-4 py-2 rounded shadow hover:bg-bloom-primary transition">Book now</button>
              <span className="text-xs text-white/80">{session.spotsLeft} spots left</span>
            </div>
          </div>
        ))}
      </div>
      <a href="#" className="text-bloom-accent text-sm mt-4 inline-block hover:underline">Browse marketplace</a>
    </div>
  );
}
