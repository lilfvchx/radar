import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { FeatureCollection, Point } from 'geojson';
import type { CrimeEvent } from '../types';

export const CRIME_LAYER_IDS = ['crime-events-halo', 'crime-events-dot'];

export function CrimeLayer({ events }: { events: CrimeEvent[] }) {
  // ⚡ Bolt: Memoize the FeatureCollection to prevent unnecessary re-evaluations
  // and maintain a stable object reference for MapLibre's Source component.
  // Impact: Reduces garbage collection and avoids triggering expensive WebGL
  // updates in react-map-gl on every parent render when events haven't changed.
  const fc: FeatureCollection<Point> = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: (events || [])
        .filter((e) => e.geo?.lat != null && e.geo?.lon != null)
        .map((event) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [event.geo!.lon!, event.geo!.lat!] },
          properties: {
            id: event.event_id,
            summary: event.summary,
            eventType: event.event_type,
            severity: event.severity_score,
            confidence: event.confidence_score,
          },
        })),
    }),
    [events],
  );

  return (
    <Source id="crime-events-source" type="geojson" data={fc}>
      <Layer
        id="crime-events-halo"
        type="circle"
        paint={{
          'circle-radius': ['interpolate', ['linear'], ['get', 'severity'], 30, 8, 100, 16],
          'circle-color': '#ef4444',
          'circle-opacity': 0.2,
          'circle-blur': 0.8,
        }}
      />
      <Layer
        id="crime-events-dot"
        type="circle"
        paint={{
          'circle-radius': ['interpolate', ['linear'], ['get', 'severity'], 30, 3, 100, 7],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'severity'],
            30,
            '#fbbf24',
            70,
            '#f97316',
            100,
            '#ef4444',
          ],
          'circle-stroke-color': '#111827',
          'circle-stroke-width': 1,
        }}
      />
    </Source>
  );
}
