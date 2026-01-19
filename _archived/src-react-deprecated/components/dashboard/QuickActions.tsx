export default function QuickActions() {
  return (
    <div className="bg-white/80 rounded-xl shadow-lg p-6 flex flex-col gap-4">
      <h2 className="text-xl font-bold text-bloom-primary mb-2">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button className="flex items-center gap-2 bg-bloom-accent text-white px-3 py-2 rounded shadow hover:bg-bloom-primary transition">
          <span>📅</span> Book PD Session
        </button>
        <button className="flex items-center gap-2 bg-bloom-accent text-white px-3 py-2 rounded shadow hover:bg-bloom-primary transition">
          <span>🗓️</span> View My Schedule
        </button>
        <button className="flex items-center gap-2 bg-bloom-accent text-white px-3 py-2 rounded shadow hover:bg-bloom-primary transition">
          <span>👤</span> Update Profile
        </button>
        <button className="flex items-center gap-2 bg-bloom-accent text-white px-3 py-2 rounded shadow hover:bg-bloom-primary transition">
          <span>🤝</span> Refer a Colleague
        </button>
      </div>
      <div className="bg-gradient-to-r from-bloom-accent to-bloom-success rounded-lg p-3 text-white flex items-center justify-between animate-pulse">
        <span>Current Bounties: 2 active</span>
        <span className="text-xs">Due: Dec 10</span>
      </div>
      <div className="mt-2 text-sm text-gray-600">
        Upcoming deadlines: <span className="font-bold text-bloom-danger">Dec 10 - Case Review</span>
      </div>
    </div>
  );
}
