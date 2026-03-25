## 2024-03-25 - React-Map-GL Source Re-Renders
**Learning:** In react-map-gl, passing unmemoized FeatureCollection objects to a `<Source>` component triggers expensive WebGL updates and garbage collection on every parent render. This is particularly noticeable when wrapping map layers that re-render frequently due to parent state changes (like popups or region selection).
**Action:** Always wrap FeatureCollection generation (e.g. array filtering/mapping) in `useMemo` to maintain a stable object reference for MapLibre's Source component when the underlying data props haven't changed.
