import type { StyleSpecification } from 'maplibre-gl';

/**
 * Shared map style URLs and objects used across all map-bearing pages.
 * Centralised here so changes (e.g. swapping a tile provider) only need to
 * happen in one place and both FlightsPage and MaritimePage stay in sync.
 */

export const MAP_STYLE_URLS = {
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    street: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
} as const;

// Fallback Carto Raster Styles to avoid CORS issues with Carto Vector Tiles on localhost
export const LIGHT_STYLE: StyleSpecification = {
    version: 8,
    sources: {
        carto: {
            type: 'raster',
            tiles: [
                'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
        },
    },
    layers: [{ id: 'carto-light', type: 'raster', source: 'carto', minzoom: 0, maxzoom: 19 }],
};

export const DARK_STYLE: StyleSpecification = {
    version: 8,
    sources: {
        carto: {
            type: 'raster',
            tiles: [
                'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
        },
    },
    layers: [{ id: 'carto-dark', type: 'raster', source: 'carto', minzoom: 0, maxzoom: 19 }],
};

export const STREET_STYLE: StyleSpecification = {
    version: 8,
    sources: {
        carto: {
            type: 'raster',
            tiles: [
                'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
        },
    },
    layers: [{ id: 'carto-street', type: 'raster', source: 'carto', minzoom: 0, maxzoom: 19 }],
};

/**
 * ESRI World Imagery satellite style.
 * Expressed as a StyleSpecification object (not a URL) because ESRI's tile
 * service doesn't expose a MapLibre-compatible JSON endpoint.
 *
 * IMPORTANT: assign this constant directly as mapStyle — do NOT wrap it in
 * useMemo() inside a component. It is already a stable module-level reference,
 * so react-map-gl will never see a changed prop and won't trigger a style diff.
 */
export const SATELLITE_STYLE: StyleSpecification = {
    version: 8,
    sources: {
        esri: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
        },
    },
    layers: [{
        id: 'esri-satellite',
        type: 'raster',
        source: 'esri',
        minzoom: 0,
        maxzoom: 19,
    }],
};
