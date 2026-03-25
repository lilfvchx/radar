export function CrimeFilters({
  onFilterChange
}: {
  onFilterChange: (filters: { minSeverity: number; daysBack: number }) => void;
}) {
  return (
    <div className="absolute top-4 left-4 z-10 w-64 bg-[#070a0f]/90 backdrop-blur border border-white/10 rounded-sm p-3 font-mono">
      <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
        Fusion Controls
      </h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[9px] text-white/70 uppercase">Min Severity</label>
            <span className="text-[9px] text-orange-400 font-bold">40+</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="40"
            onChange={(e) => onFilterChange({ minSeverity: Number(e.target.value), daysBack: 7 })}
            className="w-full accent-orange-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
