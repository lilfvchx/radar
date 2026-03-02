import { useRef, useEffect, useCallback } from 'react';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapRef } from 'react-map-gl/maplibre';
import { useThemeStore } from '../../../ui/theme/theme.store';
import { SATELLITE_STYLE, DARK_STYLE } from '../../../lib/mapStyles';
import { useOsintStore } from '../../osint/osint.store';

const INITIAL_VIEW_STATE = {
    longitude: 0,
    latitude: 20,
    zoom: 1.5
};

export function MonitorMap() {
    const mapRef = useRef<MapRef>(null);
    const { mapLayer, mapProjection } = useThemeStore();
    const { setCurrentRegion } = useOsintStore();

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
                projection={mapProjection === 'globe' ? { type: 'globe' } as import('maplibre-gl').ProjectionSpecification : { type: 'mercator' } as import('maplibre-gl').ProjectionSpecification}
                doubleClickZoom={mapProjection !== 'globe'}
                style={{ width: '100%', height: '100%' }}
            >
                <NavigationControl
                    position="top-right"
                    showCompass={true}
                    visualizePitch={true}
                />
            </Map>
            <div className="absolute top-4 left-4 pointer-events-none z-10 bg-black/40 px-3 py-1.5 rounded border border-white/10 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-blue-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    GLOBAL TACTICAL OVERVIEW
                </div>
            </div>
        </div>
    );
}
