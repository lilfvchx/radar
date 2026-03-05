import React from 'react';
import { useCyberStore } from '../cyber.store';
import { useDynamicCyberData } from '../hooks/useCyberData';
import { getEndpointDef, getCategoryForEndpoint } from '../config';

// ─── Type Definitions ─────────────────────────────────────────────────────────
interface RankedCountryRow {
    clientCountryName?: string;
    originCountryName?: string;
    location?: string;
    clientCountryAlpha2?: string;
    originCountryAlpha2?: string;
    value?: string;
    rank?: number;
}

interface RankedAsnRow {
    asn?: string;
    originAsn?: string;
    ASName?: string;
    originAsnName?: string;
    value?: string;
    rank?: number;
}

interface DomainCategory {
    name: string;
}

interface RankedDomainRow {
    rank: number;
    domain: string;
    categories?: DomainCategory[];
}

interface SpeedTableRow {
    clientCountryAlpha2: string;
    clientCountryName: string;
    bandwidthDownload: string;
    bandwidthUpload: string;
    latencyIdle: string;
    jitterIdle: string;
}

interface BgpStats {
    routes_total: number;
    routes_valid: number;
    routes_invalid: number;
    routes_unknown: number;
    distinct_prefixes: number;
    distinct_prefixes_ipv4: number;
    distinct_prefixes_ipv6: number;
    distinct_origins: number;
    distinct_origins_ipv4: number;
    distinct_origins_ipv6: number;
}

interface AnomalyRow {
    type: string;
    locationDetails?: {
        name: string;
        code: string;
    };
    asnDetails?: {
        name: string;
        location?: {
            code: string;
        };
    };
    status: string;
    startDate: string;
    endDate?: string;
    visibleInDataSources?: string[];
}

// ─── Flag emoji from ISO alpha-2 ─────────────────────────────────────────────
const flagEmoji = (alpha2: string) =>
    alpha2
        .toUpperCase()
        .split('')
        .map(c => String.fromCodePoint(c.charCodeAt(0) + 127397))
        .join('');

// ─── Mini horizontal bar ─────────────────────────────────────────────────────
const Bar: React.FC<{ pct: number; max?: number; color: string }> = ({ pct, max = 100, color }) => (
    <div className="w-32 h-1.5 bg-intel-bg/80 rounded-full overflow-hidden shrink-0">
        <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min((pct / max) * 100, 100)}%`, backgroundColor: color }}
        />
    </div>
);

// ─── Ranked Country ───────────────────────────────────────────────────────────
const RankedCountryRenderer: React.FC<{ rows: RankedCountryRow[]; color: string; unit?: string }> = ({ rows, color, unit }) => {
    const max = rows.length > 0 ? parseFloat(rows[0].value ?? '0') : 100;
    return (
        <div className="flex flex-col gap-1">
            {rows.map((row, i) => {
                const name = row.clientCountryName ?? row.originCountryName ?? row.location ?? '—';
                const alpha2 = row.clientCountryAlpha2 ?? row.originCountryAlpha2 ?? '';
                const raw = parseFloat(row.value ?? '0');
                return (
                    <div key={i} className="flex items-center gap-2 bg-intel-bg/40 border border-white/5 px-3 py-1.5 rounded hover:bg-white/5 transition-colors">
                        <span className="text-intel-text-light/30 font-mono text-[10px] w-5 text-right shrink-0">{(row.rank ?? i + 1)}.</span>
                        {alpha2 && <span className="text-sm leading-none shrink-0">{flagEmoji(alpha2)}</span>}
                        <span className="text-intel-text-light font-mono text-xs flex-1 truncate pr-2">{name}</span>
                        <Bar pct={raw} max={max} color={color} />
                        <span className="font-mono text-xs font-bold tabular-nums w-16 text-right shrink-0" style={{ color }}>
                            {raw.toFixed(2)}{unit ?? '%'}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

// ─── Ranked ASN ───────────────────────────────────────────────────────────────
const RankedAsnRenderer: React.FC<{ rows: RankedAsnRow[]; color: string; unit?: string }> = ({ rows, color, unit }) => {
    const max = rows.length > 0 ? parseFloat(rows[0].value ?? '0') : 100;
    return (
        <div className="flex flex-col gap-1">
            {rows.map((row, i) => {
                const asn = row.asn ?? row.originAsn ?? '?';
                const name = row.ASName ?? row.originAsnName ?? '—';
                const raw = parseFloat(row.value ?? '0');
                return (
                    <div key={i} className="flex items-center gap-2 bg-intel-bg/40 border border-white/5 px-3 py-1.5 rounded hover:bg-white/5 transition-colors">
                        <span className="text-intel-text-light/30 font-mono text-[10px] w-5 text-right shrink-0">{(row.rank ?? i + 1)}.</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ background: `${color}22`, color }}>
                            AS{asn}
                        </span>
                        <span className="text-intel-text-light font-mono text-xs flex-1 truncate pr-2">{name}</span>
                        <Bar pct={raw} max={max} color={color} />
                        <span className="font-mono text-xs font-bold tabular-nums w-16 text-right shrink-0" style={{ color }}>
                            {raw.toFixed(2)}{unit ?? '%'}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

// ─── Ranked Domain ────────────────────────────────────────────────────────────
const RankedDomainRenderer: React.FC<{ rows: RankedDomainRow[]; color: string }> = ({ rows, color }) => (
    <div className="flex flex-col gap-1">
        {rows.map((row, i) => {
            const cats = (row.categories ?? []).map((c: DomainCategory) => c.name).join(' · ');
            return (
                <div key={i} className="flex items-center gap-3 bg-intel-bg/40 border border-white/5 px-3 py-1.5 rounded hover:bg-white/5 transition-colors">
                    <span className="font-mono text-xs font-bold w-10 text-right tabular-nums shrink-0" style={{ color }}>#{row.rank}</span>
                    <span className="text-intel-text-light font-mono text-xs font-bold flex-1">{row.domain}</span>
                    {cats && <span className="text-intel-text-light/30 font-mono text-[10px] truncate max-w-[200px]">{cats}</span>}
                </div>
            );
        })}
    </div>
);

// ─── Speed Table ──────────────────────────────────────────────────────────────
const SpeedTableRenderer: React.FC<{ rows: SpeedTableRow[]; color: string }> = ({ rows, color }) => (
    <div>
        <div className="grid grid-cols-6 gap-2 px-3 py-1 mb-1">
            {['#', 'Country', 'Download', 'Upload', 'Latency', 'Jitter'].map(h => (
                <span key={h} className="text-intel-text-light/30 font-mono text-[10px] uppercase">{h}</span>
            ))}
        </div>
        <div className="flex flex-col gap-1">
            {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-6 gap-2 items-center bg-intel-bg/40 border border-white/5 px-3 py-1.5 rounded hover:bg-white/5 transition-colors">
                    <span className="text-intel-text-light/30 font-mono text-[10px]">{i + 1}</span>
                    <span className="flex items-center gap-1 font-mono text-xs text-intel-text-light truncate">
                        {flagEmoji(row.clientCountryAlpha2)} {row.clientCountryName}
                    </span>
                    <span className="font-mono text-xs font-bold tabular-nums" style={{ color }}>
                        {parseFloat(row.bandwidthDownload).toFixed(0)}<span className="text-[9px] ml-0.5 opacity-60">Mbps</span>
                    </span>
                    <span className="font-mono text-xs text-intel-text-light/60 tabular-nums">
                        {parseFloat(row.bandwidthUpload).toFixed(0)}<span className="text-[9px] ml-0.5 opacity-60">Mbps</span>
                    </span>
                    <span className="font-mono text-xs text-intel-text-light/60 tabular-nums">
                        {parseFloat(row.latencyIdle).toFixed(0)}<span className="text-[9px] ml-0.5 opacity-60">ms</span>
                    </span>
                    <span className="font-mono text-xs text-intel-text-light/60 tabular-nums">
                        {parseFloat(row.jitterIdle).toFixed(1)}<span className="text-[9px] ml-0.5 opacity-60">ms</span>
                    </span>
                </div>
            ))}
        </div>
    </div>
);

// ─── BGP Global Stats ─────────────────────────────────────────────────────────
const BgpStatsRenderer: React.FC<{ stats: BgpStats; color: string }> = ({ stats, color }) => {
    const groups = [
        {
            label: 'Routes',
            items: [
                { k: 'Total', v: stats.routes_total, pct: 100 },
                { k: 'Valid', v: stats.routes_valid, pct: (stats.routes_valid / stats.routes_total) * 100 },
                { k: 'Invalid', v: stats.routes_invalid, pct: (stats.routes_invalid / stats.routes_total) * 100 },
                { k: 'Unknown', v: stats.routes_unknown, pct: (stats.routes_unknown / stats.routes_total) * 100 },
            ],
        },
        {
            label: 'Prefixes',
            items: [
                { k: 'Total', v: stats.distinct_prefixes, pct: 100 },
                { k: 'IPv4', v: stats.distinct_prefixes_ipv4, pct: (stats.distinct_prefixes_ipv4 / stats.distinct_prefixes) * 100 },
                { k: 'IPv6', v: stats.distinct_prefixes_ipv6, pct: (stats.distinct_prefixes_ipv6 / stats.distinct_prefixes) * 100 },
            ],
        },
        {
            label: 'Origin ASes',
            items: [
                { k: 'Total', v: stats.distinct_origins, pct: 100 },
                { k: 'IPv4', v: stats.distinct_origins_ipv4, pct: (stats.distinct_origins_ipv4 / stats.distinct_origins) * 100 },
                { k: 'IPv6', v: stats.distinct_origins_ipv6, pct: (stats.distinct_origins_ipv6 / stats.distinct_origins) * 100 },
            ],
        },
    ];

    return (
        <div className="grid grid-cols-3 gap-4">
            {groups.map(g => (
                <div key={g.label} className="bg-intel-bg/40 border border-white/5 rounded p-3">
                    <p className="text-intel-text-light/40 font-mono text-[10px] uppercase tracking-widest mb-2">{g.label}</p>
                    <div className="flex flex-col gap-1.5">
                        {g.items.map(it => (
                            <div key={it.k}>
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-intel-text-light/70 font-mono text-[10px]">{it.k}</span>
                                    <span className="font-mono text-[11px] font-bold tabular-nums" style={{ color }}>{it.v?.toLocaleString()}</span>
                                </div>
                                <div className="h-1 bg-intel-bg/80 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${it.pct}%`, backgroundColor: color, opacity: it.k === 'Total' ? 0.9 : 0.6 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// ─── Anomaly Feed ─────────────────────────────────────────────────────────────
const AnomalyFeedRenderer: React.FC<{ rows: AnomalyRow[] }> = ({ rows }) => {
    const statusColor = (s: string) => s === 'VERIFIED' ? '#ef4444' : '#f59e0b';
    // Compute current time for elapsed time display. This is intentionally called during render
    // to show accurate elapsed times. The component re-renders when rows change, updating times.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return (
        <div className="flex flex-col gap-2">
            {rows.map((a, i) => {
                const isLocation = a.type === 'LOCATION';
                const name = isLocation ? a.locationDetails?.name : a.asnDetails?.name;
                const code = isLocation ? a.locationDetails?.code : a.asnDetails?.location?.code;
                const sc = statusColor(a.status);
                const elapsed = now - new Date(a.startDate).getTime();
                const hours = Math.floor(elapsed / 3_600_000);
                const minutes = Math.floor((elapsed % 3_600_000) / 60_000);
                const duration = hours > 0 ? `${hours}h ${minutes}m ago` : `${minutes}m ago`;
                return (
                    <div key={i} className="bg-intel-bg/40 border rounded p-3 flex gap-3 relative overflow-hidden" style={{ borderColor: `${sc}33` }}>
                        <div className="w-0.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: sc }} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: `${sc}22`, color: sc }}>
                                    {a.status === 'VERIFIED' ? 'CONFIRMED' : 'DETECTING'}
                                </span>
                                <span className="font-mono text-[9px] text-intel-text-light/40 uppercase">{a.type}</span>
                                {(a.visibleInDataSources ?? []).map((src: string) => (
                                    <span key={src} className="font-mono text-[9px] text-intel-text-light/30 border border-white/10 px-1 rounded">{src}</span>
                                ))}
                                {!a.endDate && (
                                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded animate-pulse ml-auto shrink-0" style={{ background: `${sc}22`, color: sc }}>
                                        ONGOING
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {code && <span className="text-lg leading-none">{flagEmoji(code)}</span>}
                                <span className="text-intel-text-light font-mono text-sm font-bold">{name ?? 'Unknown'}</span>
                                <span className="text-intel-text-light/30 font-mono text-[10px] ml-auto">{duration}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ─── Main Visualization ────────────────────────────────────────────────────────
export const CyberDataVisualization: React.FC = () => {
    const activeEndpoint = useCyberStore((s) => s.activeEndpoint);
    const timeRange = useCyberStore((s) => s.timeRange);

    const { data, isLoading, error } = useDynamicCyberData(activeEndpoint, timeRange);
    const endpointDef = getEndpointDef(activeEndpoint);
    const catDef = getCategoryForEndpoint(activeEndpoint);
    const color = catDef?.color ?? '#00e5ff';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${color} transparent transparent transparent` }} />
                    <p className="font-mono text-[10px] tracking-[0.2em] uppercase animate-pulse" style={{ color }}>Acquiring Signal…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-4 font-mono text-sm text-red-400">
                <div className="font-bold text-[10px] uppercase tracking-widest mb-1">Signal Intercepted — Error</div>
                {error.message}
            </div>
        );
    }

    if (!data || !endpointDef) return null;

    const payload = data[endpointDef.dataKey] ?? [];
    const meta = data.meta;
    const dateRange = meta?.dateRange?.[0];
    const lastUpdated = meta?.lastUpdated ? new Date(meta.lastUpdated).toLocaleString() : null;
    const rowCount = Array.isArray(payload) ? payload.length : null;

    return (
        <div className="flex flex-col gap-3">
            {/* Info header strip */}
            <div
                className="flex items-center gap-3 border rounded px-3 py-2 text-[10px] font-mono flex-wrap"
                style={{ borderColor: `${color}33`, background: `${color}08` }}
            >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ backgroundColor: color }} />
                <span className="uppercase tracking-widest font-bold" style={{ color }}>{endpointDef.name}</span>
                <span className="text-intel-text-light/40 hidden md:inline">—</span>
                <span className="text-intel-text-light/50 hidden md:inline truncate">{endpointDef.description}</span>
                {rowCount !== null && (
                    <span className="ml-auto shrink-0 font-mono text-intel-text-light/40">{rowCount} results</span>
                )}
                {lastUpdated && <span className="text-intel-text-light/30 shrink-0">Updated {lastUpdated}</span>}
                {dateRange && (
                    <span className="text-intel-text-light/30 shrink-0">
                        {new Date(dateRange.startTime).toLocaleDateString()} → {new Date(dateRange.endTime).toLocaleDateString()}
                    </span>
                )}
            </div>

            {/* Data panel */}
            <div
                className="bg-intel-panel/80 backdrop-blur-md border rounded p-3 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                style={{ borderColor: `${color}22` }}
            >
                {endpointDef.renderer === 'ranked_country' && Array.isArray(payload) && (
                    <RankedCountryRenderer rows={payload} color={color} unit={endpointDef.unit} />
                )}
                {endpointDef.renderer === 'ranked_asn' && Array.isArray(payload) && (
                    <RankedAsnRenderer rows={payload} color={color} unit={endpointDef.unit} />
                )}
                {endpointDef.renderer === 'ranked_domain' && Array.isArray(payload) && (
                    <RankedDomainRenderer rows={payload} color={color} />
                )}
                {endpointDef.renderer === 'speed_table' && Array.isArray(payload) && (
                    <SpeedTableRenderer rows={payload} color={color} />
                )}
                {endpointDef.renderer === 'anomaly_feed' && Array.isArray(payload) && (
                    <AnomalyFeedRenderer rows={payload} />
                )}
                {endpointDef.renderer === 'bgp_stats' && payload && typeof payload === 'object' && !Array.isArray(payload) && (
                    <BgpStatsRenderer stats={payload} color={color} />
                )}
            </div>
        </div>
    );
};
