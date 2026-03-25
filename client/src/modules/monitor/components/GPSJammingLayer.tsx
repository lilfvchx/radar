import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { cellToBoundary } from 'h3-js';
import { useGPSJammingData } from '../hooks/useGPSJammingData';
import { useGPSJammingStore } from '../gpsJamming.store';

/**
 * GPS Jamming Layer Component
 * Renders H3 hexagonal cells with different colors for signal types
 */
export function GPSJammingLayer() {
  const { data } = useGPSJammingData();
  const { showCleanSignals, showInterferedSignals, showMixedSignals } = useGPSJammingStore();

  // Convert GPS jamming data to GeoJSON with signal type classification
  const geojson = useMemo(() => {
    if (!data || !data.cells || data.cells.length === 0) {
      return { type: 'FeatureCollection', features: [] };
    }

    const features = data.cells
      .map((cell) => {
        // Classify signal type based on gpsjam.org thresholds
        // Low: 0-2%, Medium: 2-10%, High: >10%
        let signalType: 'clean' | 'mixed' | 'interfered';

        if (cell.interference <= 0.02) {
          signalType = 'clean'; // Low interference (0-2%)
        } else if (cell.interference <= 0.1) {
          signalType = 'mixed'; // Medium interference (2-10%)
        } else {
          signalType = 'interfered'; // High interference (>10%)
        }

        // Apply filters
        if (signalType === 'clean' && !showCleanSignals) return null;
        if (signalType === 'mixed' && !showMixedSignals) return null;
        if (signalType === 'interfered' && !showInterferedSignals) return null;

        // Get H3 cell boundary (returns array of [lat, lng] pairs)
        const boundary = cellToBoundary(cell.h3, true); // true = GeoJSON format [lng, lat]

        // Close the polygon by adding the first point at the end
        const coordinates = [...boundary, boundary[0]];

        // Calculate center for popup
        const centerLng = boundary.reduce((sum, coord) => sum + coord[0], 0) / boundary.length;
        const centerLat = boundary.reduce((sum, coord) => sum + coord[1], 0) / boundary.length;

        return {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
          },
          properties: {
            h3: cell.h3,
            interference: cell.interference,
            good: cell.good,
            bad: cell.bad,
            signalType,
            centerLng,
            centerLat,
          },
        };
      })
      .filter(Boolean);

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [data, showCleanSignals, showInterferedSignals, showMixedSignals]);

  if (!data || geojson.features.length === 0) {
    return null;
  }

  return (
    <>
      <Source id="gps-jamming" type="geojson" data={geojson as GeoJSON.FeatureCollection}>
        {/* Fill layer with color based on signal type */}
        <Layer
          id="gps-jamming-fill"
          type="fill"
          paint={{
            'fill-color': [
              'match',
              ['get', 'signalType'],
              'clean',
              'rgba(34, 197, 94, 0.5)', // Green for clean signals
              'mixed',
              'rgba(234, 179, 8, 0.6)', // Yellow for mixed signals
              'interfered',
              'rgba(239, 68, 68, 0.7)', // Red for interfered signals
              'rgba(100, 100, 100, 0.3)', // Default gray
            ],
            'fill-opacity': 0.7,
          }}
        />

        {/* Outline layer */}
        <Layer
          id="gps-jamming-outline"
          type="line"
          paint={{
            'line-color': [
              'match',
              ['get', 'signalType'],
              'clean',
              'rgba(34, 197, 94, 0.9)',
              'mixed',
              'rgba(234, 179, 8, 0.9)',
              'interfered',
              'rgba(239, 68, 68, 1)',
              'rgba(100, 100, 100, 0.5)',
            ],
            'line-width': ['interpolate', ['linear'], ['zoom'], 0, 0.5, 5, 1.2, 10, 2.5],
            'line-opacity': 0.9,
          }}
        />
      </Source>
    </>
  );
}
