export function CrimeFilters({
  minSeverity,
  setMinSeverity,
}: {
  minSeverity: number;
  setMinSeverity: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/70">
      <span>Crime Severity</span>
      <input
        type="range"
        min={0}
        max={100}
        value={minSeverity}
        onChange={(e) => setMinSeverity(Number(e.target.value))}
      />
      <span>{minSeverity}</span>
    </div>
  );
}
