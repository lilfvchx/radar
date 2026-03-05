import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import Map, { NavigationControl, Source, Layer, Popup } from 'react-map-gl/maplibre';
import type { MapRef, MapMouseEvent } from 'react-map-gl/maplibre';
import type { ProjectionSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useThemeStore } from '../../../ui/theme/theme.store';
import { SATELLITE_STYLE, DARK_STYLE } from '../../../lib/mapStyles';
import { useDynamicCyberData } from '../hooks/useCyberData';
import { useCyberStore } from '../cyber.store';
import { getCategoryDef } from '../config';

// ─── Type Definitions ─────────────────────────────────────────────────────────
interface CyberDataRow {
    clientCountryAlpha2?: string;
    originCountryAlpha2?: string;
    clientCountryName?: string;
    originCountryName?: string;
    value?: string;
    rank?: number;
    asn?: string;
    originAsn?: string;
    ASName?: string;
    originAsnName?: string;
}

interface FeatureProperties {
    code: string;
    name: string;
    value: number;
    rank: number | null;
    radiusPx: number;
    [key: string]: string | number | null | undefined;
}

// ─── Country centroid LUT ─────────────────────────────────────────────────────
const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
    US: [-98.5, 39.5], BR: [-51.9, -14.2], CN: [104.2, 35.9], DE: [10.5, 51.2],
    IN: [78.9, 20.6], GB: [-3.4, 55.4], FR: [2.2, 46.2], RU: [105.3, 61.5],
    JP: [138.3, 36.2], CA: [-96.8, 60.0], AU: [133.8, -25.7], NL: [5.3, 52.1],
    SG: [103.8, 1.4], KR: [127.8, 36.5], IT: [12.6, 42.8], ES: [-3.7, 40.4],
    PL: [19.1, 51.9], SE: [18.6, 60.1], CH: [8.2, 46.8], TR: [35.2, 39.1],
    ID: [113.9, -0.8], MX: [-102.6, 23.6], AR: [-63.6, -38.4], ZA: [25.1, -29.0],
    NG: [8.7, 9.1], UA: [31.2, 48.4], SA: [45.1, 23.9], AE: [53.8, 23.4],
    MY: [109.7, 4.2], TH: [100.9, 15.9], VN: [108.3, 14.1], PH: [122.9, 12.9],
    EG: [30.8, 26.8], IR: [53.7, 32.4], PK: [69.3, 30.4], BD: [90.4, 23.7],
    HK: [114.2, 22.3], TW: [120.9, 23.7], CL: [-71.5, -35.7], CO: [-74.3, 4.6],
    IS: [-18.5, 64.9], HU: [19.5, 47.2], KY: [-80.5, 19.3], PT: [-8.2, 39.6],
    AZ: [47.6, 40.1], KW: [47.5, 29.3], RO: [24.9, 45.9], AT: [14.6, 47.7],
    FI: [25.7, 61.9], NO: [8.5, 60.5], DK: [10.0, 56.3], BE: [4.5, 50.5],
    IL: [34.9, 31.1], GR: [21.8, 39.1], CZ: [15.5, 49.8], SK: [19.7, 48.7],
};

const flagEmoji = (alpha2: string) =>
    alpha2.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');

const INITIAL_VIEW = { longitude: 10, latitude: 20, zoom: 1.5 };

// Per-category color map
const CATEGORY_COLORS: Record<string, string> = {
    attacks: '#ff3366',
    http: '#00e5ff',
    dns: '#7b61ff',
    netflows: '#22d3ee',
    bgp: '#00ff9d',
    ranking: '#f59e0b',
    quality: '#e879f9',
    anomalies: '#ef4444',
};

// Overlay endpoint for each category (country-based circles on map)
const OVERLAY_ENDPOINTS: Record<string, string> = {
    attacks: '/radar/attacks/layer7/top/locations/origin',
    http: '/radar/http/top/locations',
    dns: '/radar/dns/top/locations',
    netflows: '/radar/netflows/top/locations',
    bgp: '/radar/bgp/top/ases', // ASes don't have a country code — we skip them on map
};

interface PopupData {
    longitude: number;
    latitude: number;
    props: FeatureProperties;
}

export function CyberMap() {
    const mapRef = useRef<MapRef>(null);
    const { mapLayer, mapProjection } = useThemeStore();
    const activeCategory = useCyberStore(s => s.activeCategory);
    const timeRange = useCyberStore(s => s.timeRange);
    const catDef = getCategoryDef(activeCategory);

    const [popup, setPopup] = useState<PopupData | null>(null);

    const overlayPath = OVERLAY_ENDPOINTS[activeCategory] ?? '/radar/attacks/layer7/top/locations/origin';
    const { data: overlayData } = useDynamicCyberData(overlayPath, timeRange);

    // ─── Build GeoJSON from response rows ─────────────────────────────────────
    const geojson = useMemo(() => {
        const rows: CyberDataRow[] = overlayData?.top_0 ?? [];
        if (rows.length === 0) return { type: 'FeatureCollection', features: [] };

        // Compute dynamic radius: sqrt scaling so top country ≈ 40px, tail ≈ 5px
        const maxVal = Math.max(...rows.map((r: CyberDataRow) => parseFloat(r.value ?? '0')));
        const MIN_R = 5;
        const MAX_R = 42;

        const features = rows
            .map((row: CyberDataRow) => {
                const code = row.clientCountryAlpha2 ?? row.originCountryAlpha2;
                const coords = COUNTRY_CENTROIDS[code];
                if (!coords) return null;
                const rawVal = parseFloat(row.value ?? '0');
                // sqrt gives visual area proportional to value
                const radiusPx = MIN_R + (MAX_R - MIN_R) * Math.sqrt(rawVal / maxVal);
                return {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: coords },
                    properties: {
                        code,
                        name: row.clientCountryName ?? row.originCountryName ?? code,
                        value: rawVal,
                        rank: row.rank ?? null,
                        radiusPx, // pre-computed per feature
                        ...row,
                    },
                };
            })
            .filter(Boolean);
        return { type: 'FeatureCollection', features };
    }, [overlayData]);

    const activeMapStyle = mapLayer === 'satellite' ? SATELLITE_STYLE : DARK_STYLE;
    const circleColor = CATEGORY_COLORS[activeCategory] ?? '#00e5ff';

    useEffect(() => {
        const t = setTimeout(() => mapRef.current?.resize(), 100);
        return () => clearTimeout(t);
    }, []);

    // ─── Click handler: find feature under cursor ─────────────────────────────
    const onClick = useCallback((e: MapMouseEvent) => {
        const map = mapRef.current?.getMap();
        if (!map) return;

        const features = map.queryRenderedFeatures(e.point, {
            layers: ['cyber-circles'],
        });

        if (features.length > 0) {
            const feat = features[0];
            const coords = (feat.geometry as GeoJSON.Point).coordinates;
            const props = feat.properties as FeatureProperties;
            setPopup({
                longitude: coords[0],
                latitude: coords[1],
                props,
            });
        } else {
            setPopup(null);
        }
    }, []);

    // ─── Cursor CSS ───────────────────────────────────────────────────────────
    const onMouseEnter = useCallback(() => {
        const map = mapRef.current?.getMap();
        if (map) map.getCanvas().style.cursor = 'pointer';
    }, []);
    const onMouseLeave = useCallback(() => {
        const map = mapRef.current?.getMap();
        if (map) map.getCanvas().style.cursor = 'crosshair';
    }, []);

    return (
        <div className="w-full h-full relative bg-black">
            <Map
                ref={mapRef}
                initialViewState={INITIAL_VIEW}
                mapStyle={activeMapStyle}
                styleDiffing={false}
                cursor="crosshair"
                projection={mapProjection === 'globe' ? { type: 'globe' } as ProjectionSpecification : { type: 'mercator' } as ProjectionSpecification}
                doubleClickZoom={mapProjection !== 'globe'}
                style={{ width: '100%', height: '100%' }}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                interactiveLayerIds={['cyber-glow', 'cyber-ring', 'cyber-circles']}
            >
                <NavigationControl position="top-right" showCompass visualizePitch />

                {/* ── GeoJSON bubble layers ── */}
                {geojson.features.length > 0 && (
                    <Source id="cyber-overlay" type="geojson" data={geojson as GeoJSON.FeatureCollection}>
                        {/* Deep soft glow — 2.4x the bubble radius */}
                        <Layer
                            id="cyber-glow"
                            type="circle"
                            paint={{
                                'circle-radius': ['*', ['get', 'radiusPx'], 2.4],
                                'circle-color': circleColor,
                                'circle-opacity': 0.05,
                                'circle-blur': 1.2,
                            }}
                        />
                        {/* Outer pulse ring — 1.7x radius, thin stroke only */}
                        <Layer
                            id="cyber-ring"
                            type="circle"
                            paint={{
                                'circle-radius': ['*', ['get', 'radiusPx'], 1.65],
                                'circle-color': 'transparent',
                                'circle-opacity': 1,
                                'circle-stroke-width': 1,
                                'circle-stroke-color': circleColor,
                                'circle-stroke-opacity': 0.35,
                            }}
                        />
                        {/* Main filled bubble — size driven by pre-computed radiusPx */}
                        <Layer
                            id="cyber-circles"
                            type="circle"
                            paint={{
                                'circle-radius': ['get', 'radiusPx'],
                                'circle-color': circleColor,
                                'circle-opacity': 0.78,
                                'circle-stroke-width': 1.5,
                                'circle-stroke-color': 'rgba(0,0,0,0.6)',
                            }}
                        />
                        {/* Country labels — only shown when bubble is large enough */}
                        <Layer
                            id="cyber-labels"
                            type="symbol"
                            layout={{
                                'text-field': [
                                    'concat',
                                    ['get', 'name'],
                                    '\n',
                                    ['number-format', ['get', 'value'], { 'max-fraction-digits': 1 }],
                                    '%',
                                ],
                                'text-size': ['interpolate', ['linear'], ['get', 'radiusPx'], 5, 8, 42, 11],
                                'text-font': ['Open Sans Bold'],
                                'text-anchor': 'center',
                                'text-optional': true,
                                'text-allow-overlap': false,
                            }}
                            paint={{
                                'text-color': '#ffffff',
                                'text-halo-color': 'rgba(0,0,0,0.85)',
                                'text-halo-width': 1.5,
                                'text-opacity': ['interpolate', ['linear'], ['get', 'radiusPx'], 12, 0, 18, 1],
                            }}
                        />
                    </Source>
                )}

                {/* ── Click Popup ── */}
                {popup && (
                    <Popup
                        longitude={popup.longitude}
                        latitude={popup.latitude}
                        anchor="bottom"
                        closeButton={false}
                        onClose={() => setPopup(null)}
                        className="cyber-popup"
                        maxWidth="300px"
                    >
                        <PopupCard props={popup.props} color={circleColor} category={catDef?.name ?? activeCategory} onClose={() => setPopup(null)} />
                    </Popup>
                )}
            </Map>

            {/* Map badge */}
            <div className="absolute top-3 left-3 pointer-events-none z-10 tech-panel px-3 py-2 drop-shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-[0.15em] text-intel-text-light uppercase">
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: circleColor, boxShadow: `0 0 8px ${circleColor}` }} />
                    Cyber Threat Globe · {catDef?.name ?? 'Overview'}
                    {geojson.features.length > 0 && (
                        <span className="text-intel-text-light/40 ml-1 font-normal text-[10px]">({geojson.features.length} nodes)</span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Inline popup card — no extra file needed ─────────────────────────────────
function PopupCard({ props, color, category, onClose }: { props: FeatureProperties; color: string; category: string; onClose: () => void }) {
    const code = props.code ?? props.clientCountryAlpha2 ?? props.originCountryAlpha2 ?? '';
    const name = props.name ?? props.clientCountryName ?? props.originCountryName ?? 'Unknown';
    const value = parseFloat(props.value ?? '0');
    const rank = props.rank;

    // Known fields we handle specially — everything else goes to the "Extra" section
    const KNOWN = new Set(['code', 'name', 'value', 'rank', 'clientCountryAlpha2', 'originCountryAlpha2',
        'clientCountryName', 'originCountryName', 'asn', 'ASName', 'originAsn', 'originAsnName']);

    const extra = Object.entries(props).filter(([k]) => !KNOWN.has(k) && props[k] !== null && props[k] !== '');

    return (
        <div
            className="min-w-[220px] max-w-[280px] font-mono text-xs rounded shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden"
            style={{ background: 'rgba(8,10,18,0.97)', border: `1px solid ${color}55` }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: `${color}33`, background: `${color}12` }}>
                <div className="flex items-center gap-2">
                    {code && <span className="text-xl">{flagEmoji(code)}</span>}
                    <div>
                        <div className="text-white font-bold text-sm leading-tight">{name}</div>
                        <div className="text-[10px] uppercase tracking-widest" style={{ color }}>{category}</div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-white/30 hover:text-white/80 transition-colors text-base ml-2"
                >×</button>
            </div>

            {/* Core metrics */}
            <div className="px-3 py-2 flex flex-col gap-1.5">
                {rank && (
                    <div className="flex justify-between">
                        <span className="text-white/40">Global Rank</span>
                        <span className="font-bold" style={{ color }}>#{rank}</span>
                    </div>
                )}
                <div className="flex justify-between items-center">
                    <span className="text-white/40">Share</span>
                    <span className="font-bold text-sm" style={{ color }}>{value.toFixed(2)}%</span>
                </div>
                {/* Mini bar for share */}
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(value * 3, 100)}%`, backgroundColor: color }} />
                </div>

                {/* ASN info if present */}
                {(props.ASName || props.originAsnName) && (
                    <div className="flex flex-col mt-1 gap-0.5">
                        <span className="text-white/40 text-[9px] uppercase tracking-widest">AS Handle</span>
                        <span className="text-white/80 truncate">{props.ASName ?? props.originAsnName}</span>
                        <span className="text-[10px]" style={{ color }}>AS{props.asn ?? props.originAsn}</span>
                    </div>
                )}

                {/* Extra fields */}
                {extra.length > 0 && (
                    <>
                        <div className="border-t mt-1 pt-1.5" style={{ borderColor: `${color}22` }}>
                            {extra.map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-2 py-0.5">
                                    <span className="text-white/30 truncate capitalize">{k.replace(/_/g, ' ')}</span>
                                    <span className="text-white/70 text-right truncate max-w-[130px]">{String(v)}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
