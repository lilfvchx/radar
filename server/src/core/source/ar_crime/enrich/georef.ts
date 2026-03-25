export interface GeoRefResult {
  provincia?: string;
  municipio?: string;
  localidad?: string;
  lat?: number;
  lon?: number;
  geocode_confidence: number;
}

export async function normalizeWithGeoRef(location: string): Promise<GeoRefResult> {
  const base = process.env.AR_GEOREF_BASE_URL || 'https://apis.datos.gob.ar/georef/api';
  const url = `${base}/localidades?nombre=${encodeURIComponent(location)}&max=1`;

  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'RadarCrimeOSINT/0.1' } });
    if (!res.ok) return { geocode_confidence: 20 };
    const json = (await res.json()) as {
      localidades?: Array<{
        nombre?: string;
        centroide?: { lat?: number; lon?: number };
        provincia?: { nombre?: string };
        municipio?: { nombre?: string };
      }>;
    };

    const loc = json.localidades?.[0];
    if (!loc) return { geocode_confidence: 20 };

    return {
      provincia: loc.provincia?.nombre,
      municipio: loc.municipio?.nombre,
      localidad: loc.nombre,
      lat: loc.centroide?.lat,
      lon: loc.centroide?.lon,
      geocode_confidence: loc.centroide?.lat ? 80 : 55,
    };
  } catch {
    return { geocode_confidence: 10 };
  }
}
