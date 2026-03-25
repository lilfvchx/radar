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
    <div className="absolute right-3 top-16 z-40 w-[320px] bg-[#07090d] border border-red-500/30 text-intel-text font-mono p-3 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
        <h3 className="text-xs tracking-widest uppercase text-red-300">Crime Event</h3>
        <button onClick={onClose} className="text-[10px] text-white/60 hover:text-white">
          Close
        </button>
      </div>
      <p className="text-[11px] text-white/90 leading-relaxed">{event.summary}</p>
      <div className="mt-2 text-[10px] text-white/60 space-y-1">
        <div>Tipo: {event.event_type}</div>
        <div>Severidad: {event.severity_score}</div>
        <div>Confianza: {event.confidence_score}</div>
        <div>Ubicación: {event.location_text ?? 'N/D'}</div>
      </div>
    </div>
  );
}
