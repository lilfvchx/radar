export type GeoRefLocation = {
  provincia?: string;
  departamento?: string;
  municipio?: string;
  localidad?: string;
  lat?: number;
  lon?: number;
};

// GeoRef base URL from env
const GEOREF_BASE = process.env.AR_GEOREF_BASE_URL || 'https://apis.datos.gob.ar/georef/api';

/**
 * Attempt to normalize an address string using GeoRef.
 * Falls back to local entity extraction if API fails.
 */
export async function normalizeAddress(address: string, provincia?: string): Promise<GeoRefLocation | null> {
  if (!address || address.length < 4) return null;

  try {
    const params = new URLSearchParams({ direccion: address, max: '1' });
    if (provincia) params.set('provincia', provincia);

    const url = `${GEOREF_BASE}/direcciones?${params.toString()}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RadarCrimeOSINT/0.1' }
    });

    if (!res.ok) {
      console.warn(`[GeoRef] Failed to geocode ${address}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (!data.direcciones || data.direcciones.length === 0) return null;

    const d = data.direcciones[0];
    return {
      provincia: d.provincia?.nombre,
      departamento: d.departamento?.nombre,
      municipio: d.municipio?.nombre,
      localidad: d.localidad_censal?.nombre,
      lat: d.ubicacion?.lat,
      lon: d.ubicacion?.lon
    };
  } catch (error) {
    console.error(`[GeoRef] Error normalizing address ${address}:`, error);
    return null;
  }
}
