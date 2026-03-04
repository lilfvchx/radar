import React, { useCallback, useRef } from 'react';
import { useFlightsStore } from '../state/flights.store';
import type { FlightsFilters } from '../state/flights.store';

interface FlightsToolbarProps {
    totalCount: number;
    filteredCount: number;
    airborneCount: number;
    onGroundCount: number;
}

export const FlightsToolbar: React.FC<FlightsToolbarProps> = ({
    totalCount,
    filteredCount,
    airborneCount,
    onGroundCount,
}) => {
    const { filters, setFilter } = useFlightsStore();

    // Debounce slider updates so rapid drags don't re-filter thousands of
    // states on every pixel movement.
    const sliderTimer = useRef<ReturnType<typeof setTimeout>>(null);
    const debouncedSetFilter = useCallback(
        <K extends keyof FlightsFilters>(key: K, value: FlightsFilters[K]) => {
            if (sliderTimer.current) clearTimeout(sliderTimer.current);
            sliderTimer.current = setTimeout(() => setFilter(key, value), 80);
        },
        [setFilter]
    );

    return (
        <div className="absolute top-0 left-0 right-0 p-2 tech-panel z-10 flex items-center gap-4 pointer-events-auto flex-wrap !border-t-0 !border-l-0 !border-r-0 shadow-[0_15px_30px_rgba(0,0,0,0.8)]">

            {/* ── Global Stats ──────────────────────────────── */}
            <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold tracking-widest text-intel-text-light/50 uppercase">Stats</span>
                <StatPill label="TOTAL" value={totalCount} color="text-intel-text-light" />
                <StatPill label="SHOWN" value={filteredCount} color="text-intel-accent" />
                <StatPill label="AIRBORNE" value={airborneCount} color="text-green-400" />
                <StatPill label="GROUND" value={onGroundCount} color="text-amber-400" />
            </div>

            <div className="w-px h-4 bg-white/10" />

            {/* ── Callsign filter ───────────────────────────── */}
            <div className="flex items-center gap-2">
                <label htmlFor="callsign-filter" className="text-[10px] font-bold tracking-widest text-intel-text-light">CALLSIGN</label>
                <input
                    id="callsign-filter"
                    type="text"
                    value={filters.callsign}
                    onChange={e => setFilter('callsign', e.target.value.toUpperCase())}
                    className="bg-black/60 border border-white/10 px-2 py-1 text-xs font-mono text-intel-text-light outline-none focus:border-intel-accent focus:shadow-[0_0_10px_rgba(0,229,255,0.3)] transition-all w-24"
                    placeholder="ANY"
                />
            </div>

            {/* ── On Ground toggle ──────────────────────────── */}
            <div className="flex items-center gap-2">
                <label htmlFor="on-ground-toggle" className="text-[10px] font-bold tracking-widest text-intel-text-light">ON GROUND</label>
                <input
                    id="on-ground-toggle"
                    type="checkbox"
                    checked={filters.showOnGround}
                    onChange={e => setFilter('showOnGround', e.target.checked)}
                    className="accent-intel-accent"
                />
            </div>

            <div className="w-px h-4 bg-white/10" />

            {/* ── Altitude slider ───────────────────────────── */}
            <div className="flex items-center gap-2">
                <label htmlFor="alt-slider" className="text-[10px] font-bold tracking-widest text-intel-text-light whitespace-nowrap">MAX ALT (m)</label>
                <input
                    id="alt-slider"
                    type="range"
                    className="accent-intel-accent w-24"
                    min="0" max="50000" step="1000"
                    defaultValue={filters.altitudeMax}
                    onChange={e => debouncedSetFilter('altitudeMax', Number(e.target.value))}
                    aria-label="Maximum altitude filter"
                />
                <span className="text-[10px] font-mono text-intel-accent w-12 text-right">{filters.altitudeMax.toLocaleString()}</span>
            </div>

            {/* ── Speed slider ──────────────────────────────── */}
            <div className="flex items-center gap-2">
                <label htmlFor="spd-slider" className="text-[10px] font-bold tracking-widest text-intel-text-light whitespace-nowrap">MAX SPD (m/s)</label>
                <input
                    id="spd-slider"
                    type="range"
                    className="accent-intel-accent w-20"
                    min="0" max="1000" step="50"
                    defaultValue={filters.speedMax}
                    onChange={e => debouncedSetFilter('speedMax', Number(e.target.value))}
                    aria-label="Maximum speed filter"
                />
                <span className="text-[10px] font-mono text-intel-accent w-8 text-right">{filters.speedMax}</span>
            </div>
        </div>
    );
};

const StatPill: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 border border-white/5 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]">
        <span className="text-[9px] font-bold tracking-[0.1em] text-intel-text uppercase">{label}</span>
        <span className={`text-xs font-mono font-bold tabular-nums drop-shadow-[0_0_5px_currentColor] ${color}`}>{value.toLocaleString()}</span>
    </div>
);
