import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { CrimeEvent } from '../types';

export function CrimeLayer({ events }: { events: CrimeEvent[] }) {
  const data = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: events.map((event) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [event.lon!, event.lat!],
        },
        properties: {
          ...event,
        },
      })),
    };
  }, [events]);

  return (
    <Source type="geojson" data={data}>
      <Layer
        id="ar-crime-halo"
        type="circle"
        paint={{
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 8, 8, 20],
          'circle-color': [
            'step',
            ['get', 'severity_score'],
            'rgba(251, 191, 36, 0.2)', // < 40: yellow
            40,
            'rgba(249, 115, 22, 0.3)', // 40-70: orange
            70,
            'rgba(239, 68, 68, 0.4)' // >= 70: red
          ],
          'circle-blur': 0.8,
        }}
      />
      <Layer
        id="ar-crime-dot"
        type="circle"
        paint={{
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 2, 8, 4],
          'circle-color': [
            'step',
            ['get', 'severity_score'],
            '#fbbf24', // yellow
            40,
            '#f97316', // orange
            70,
            '#ef4444' // red
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(255,255,255,0.8)',
        }}
      />
    </Source>
  );
}
