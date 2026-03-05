import { useRef, useEffect, useCallback } from 'react';
import Map, { NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapRef } from 'react-map-gl/maplibre';
import type { ProjectionSpecification } from 'maplibre-gl';
import { useThemeStore } from '../../../ui/theme/theme.store';
import { SATELLITE_STYLE, DARK_STYLE } from '../../../lib/mapStyles';
import { useOsintStore } from '../../osint/osint.store';

// ─── Type Definitions ─────────────────────────────────────────────────────────
interface ACLEDEvent {
    id: string;
    eventType: string;
    fatalities: number;
    location: {
        latitude: number;
        longitude: number;
    };
}

interface ACLEDResponse {
    events: ACLEDEvent[];
}

const INITIAL_VIEW_STATE = {
    longitude: 0,
    latitude: 20,
    zoom: 1.5
};

export function MonitorMap() {
    const mapRef = useRef<MapRef>(null);
    const { mapLayer, mapProjection } = useThemeStore();
    const { setCurrentRegion } = useOsintStore();

    const { data: events } = useQuery({
        queryKey: ['monitor', 'acled', 'map'],
        queryFn: async (): Promise<ACLEDEvent[]> => {
            const res = await fetch('/api/monitor/acled?limit=1000');
            if (!res.ok) throw new Error('Network response was not ok');
            const data: ACLEDResponse = await res.json();
            return data.events;
        },
        refetchInterval: 60000, // 60s
    });

    const acledGeoJSON = useMemo(() => {
        if (!events) return null;
        return {
            type: 'FeatureCollection',
            features: events.map((e: ACLEDEvent) => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [e.location.longitude, e.location.latitude]
                },
                properties: {
                    id: e.id,
                    eventType: e.eventType,
                    fatalities: e.fatalities
                }
            }))
        };
    }, [events]);

    const activeMapStyle = mapLayer === 'satellite' ? SATELLITE_STYLE : DARK_STYLE;

    const onClick = useCallback((e: import('maplibre-gl').MapMouseEvent) => {
        // Set OSINT region on click, just like FlightsMap
        setCurrentRegion(e.lngLat.lat, e.lngLat.lng);
    }, [setCurrentRegion]);

    // Force map resize on mount to fix MapLibre zero-dimension rendering bug in flex/grid layouts
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.resize();
            }
        }, 100);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="w-full h-full relative bg-black">
            <Map
                ref={mapRef}
                initialViewState={INITIAL_VIEW_STATE}
                mapStyle={activeMapStyle}
                styleDiffing={false}
                onClick={onClick}
                cursor="crosshair"
                projection={mapProjection === 'globe' ? { type: 'globe' } as ProjectionSpecification : { type: 'mercator' } as ProjectionSpecification}
                doubleClickZoom={mapProjection !== 'globe'}
                style={{ width: '100%', height: '100%' }}
            >
                <NavigationControl
                    position="top-right"
                    showCompass={true}
                    visualizePitch={true}
                />

                {acledGeoJSON && (
                    <Source id="acled-events" type="geojson" data={acledGeoJSON as GeoJSON.FeatureCollection}>
                        <Layer
                            id="acled-heatmap"
                            type="heatmap"
                            paint={{
                                'heatmap-weight': [
                                    'interpolate',
                                    ['linear'],
                                    ['get', 'fatalities'],
                                    0, 0.5,
                                    10, 1
                                ],
                                'heatmap-intensity': 1,
                                'heatmap-color': [
                                    'interpolate',
                                    ['linear'],
                                    ['heatmap-density'],
                                    0, 'rgba(239, 68, 68, 0)',
                                    0.2, 'rgba(239, 68, 68, 0.2)',
                                    0.4, 'rgba(239, 68, 68, 0.4)',
                                    0.6, 'rgba(239, 68, 68, 0.6)',
                                    0.8, 'rgba(239, 68, 68, 0.8)',
                                    1, 'rgba(239, 68, 68, 1)'
                                ],
                                'heatmap-radius': 30,
                                'heatmap-opacity': 0.7
                            }}
                        />
                        <Layer
                            id="acled-points"
                            type="circle"
                            paint={{
                                'circle-radius': 3,
                                'circle-color': '#ef4444',
                                'circle-opacity': 0.9,
                                'circle-stroke-width': 1,
                                'circle-stroke-color': '#7f1d1d'
                            }}
                        />
                    </Source>
                )}
            </Map>
            <div className="absolute top-4 left-4 pointer-events-none z-10 tech-panel px-4 py-2 drop-shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                <div className="flex items-center gap-3 text-sm font-mono font-bold tracking-[0.15em] text-intel-text-light">
                    <span className="w-2 h-2 bg-intel-accent animate-pulse shadow-[0_0_10px_var(--color-intel-accent)]"></span>
                    GLOBAL TACTICAL OVERVIEW
                </div>
            </div>
        </div>
    );
}
