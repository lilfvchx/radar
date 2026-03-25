import { normalizeWithGeoRef } from '../enrich/georef';

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      localidades: [
        {
          centroide: { lat: -34.6037, lon: -58.3816 },
          provincia: { nombre: 'CABA' },
          municipio: { nombre: 'Comuna 1' },
          nombre: 'Monserrat'
        }
      ]
    })
  })
) as jest.Mock;

describe('georef', () => {
  it('normalizes location text into geo object', async () => {
    const geo = await normalizeWithGeoRef('Avenida Corrientes 1000, CABA');

    expect(geo).toBeDefined();
    expect(geo.lat).toBe(-34.6037);
    expect(geo.lon).toBe(-58.3816);
    expect(geo.provincia).toBe('CABA');
    expect(geo.municipio).toBe('Comuna 1');
    expect(geo.localidad).toBe('Monserrat');
    expect(geo.geocode_confidence).toBe(80);
  });

  it('returns low confidence when fetch fails or returns no results', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ localidades: [] })
    });

    const geo = await normalizeWithGeoRef('Nowhereville');
    expect(geo.geocode_confidence).toBe(20);
    expect(geo.lat).toBeUndefined();
  });
});
