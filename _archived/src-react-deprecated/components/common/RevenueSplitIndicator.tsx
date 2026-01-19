interface RevenueSplitIndicatorProps {
  revenueShare: number; // 0.85 = 85%
}

export default function RevenueSplitIndicator({ revenueShare }: RevenueSplitIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="w-40 h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-4 bg-gradient-to-r from-bloom-success to-bloom-accent"
          style={{ width: `${revenueShare * 100}%`, transition: 'width 1s' }}
        />
      </div>
      <span className="font-semibold text-bloom-success">{Math.round(revenueShare * 100)}% revenue share</span>
    </div>
  );
}
