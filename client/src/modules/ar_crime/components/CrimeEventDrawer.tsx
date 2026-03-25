import type { CrimeEvent } from '../types';

export function CrimeEventDrawer({
  event,
  onClose,
}: {
  event: CrimeEvent | null;
  onClose: () => void;
}) {
  if (!event) return null;

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-[#070a0f] border-l border-white/10 shadow-2xl z-50 flex flex-col font-mono text-white/90">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-orange-400">
          Event Details
        </h2>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors p-1"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h3 className="text-xs text-white/50 uppercase mb-1">Type</h3>
          <p className="text-sm uppercase">{event.event_type.replace(/_/g, ' ')}</p>
        </div>

        <div>
          <h3 className="text-xs text-white/50 uppercase mb-1">Summary</h3>
          <p className="text-xs leading-relaxed border-l-2 border-orange-500/50 pl-3 py-1">
            {event.summary}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-[10px] text-white/50 uppercase mb-1">Severity</h3>
            <p className={`text-xl font-bold ${event.severity_score >= 70 ? 'text-red-400' : 'text-orange-400'}`}>
              {event.severity_score}
            </p>
          </div>
          <div>
            <h3 className="text-[10px] text-white/50 uppercase mb-1">Confidence</h3>
            <p className="text-xl font-bold text-sky-400">{event.confidence_score}</p>
          </div>
        </div>

        <div>
          <h3 className="text-xs text-white/50 uppercase mb-2">Sources ({event.sources?.length || 0})</h3>
          <div className="space-y-2">
            {event.sources?.map((s, i) => (
              <div key={i} className="bg-white/5 p-2 rounded-sm border border-white/10">
                <p className="text-[10px] text-orange-300 mb-1">{s.sourceName}</p>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs hover:underline text-white/80 block line-clamp-2"
                >
                  {s.title}
                </a>
                {s.publishedAt && (
                  <p className="text-[9px] text-white/30 mt-1">
                    {s.publishedAt.slice(0, 10)}
                  </p>
                )}
              </div>
            ))}
            {(!event.sources || event.sources.length === 0) && (
              <p className="text-xs text-white/40 italic">No evidence sources linked.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
