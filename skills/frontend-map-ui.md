# UI Map & Fusion Panel Skill

## Purpose
Visualize enriched intelligence data on MapLibre map and side panels.

## Implementation Details
- Use `react-map-gl` layers/markers.
- Style map points based on severity (e.g., color intensity).
- Implement clickable markers that open an `EventDrawer` showing deduplicated sources and timeline.
- Rely on `zustand` for state management if filtering is complex.
