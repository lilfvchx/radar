import { z } from 'zod';

// Throttling/Rate Limiting variables
const MAX_REQUESTS_PER_SECOND = 5;
const REQUEST_INTERVAL_MS = 1000 / MAX_REQUESTS_PER_SECOND;

let lastRequestTime = 0;
let queue: Promise<void> = Promise.resolve();

function throttle(): Promise<void> {
  queue = queue.then(() => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    let waitTime = 0;

    if (timeSinceLastRequest < REQUEST_INTERVAL_MS) {
      waitTime = REQUEST_INTERVAL_MS - timeSinceLastRequest;
    }

    lastRequestTime = now + waitTime;

    if (waitTime > 0) {
      return new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    return Promise.resolve();
  });

  return queue;
}

async function fetchWithRetry(url: string, options: RequestInit, retries: number = 3): Promise<Response> {
  let lastError: any;
  for (let attempt = 0; attempt < retries; attempt++) {
    await throttle();
    try {
      const response = await fetch(url, options);
      if (response.status >= 500 && response.status < 600) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries - 1) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

export const DireccionResponseSchema = z.object({
  direcciones: z.array(z.any()),
  parametros: z.any().optional(),
  cantidad: z.number().optional(),
  total: z.number().optional(),
  inicio: z.number().optional(),
  geocode_confidence: z.number().optional(),
  fallback_used: z.boolean().optional(),
});

export const ProvinciaResponseSchema = z.object({
  provincias: z.array(z.any()),
  parametros: z.any().optional(),
  cantidad: z.number().optional(),
  total: z.number().optional(),
  inicio: z.number().optional(),
  geocode_confidence: z.number().optional(),
  fallback_used: z.boolean().optional(),
});

export const MunicipioResponseSchema = z.object({
  municipios: z.array(z.any()),
  parametros: z.any().optional(),
  cantidad: z.number().optional(),
  total: z.number().optional(),
  inicio: z.number().optional(),
  geocode_confidence: z.number().optional(),
  fallback_used: z.boolean().optional(),
});

export class GeorefClient {
  private baseUrl = 'https://apis.datos.gob.ar/georef/api';

  async getDirecciones(direccion: string): Promise<z.infer<typeof DireccionResponseSchema>> {
    const url = new URL(`${this.baseUrl}/direcciones`);
    url.searchParams.append('direccion', direccion);

    try {
      const response = await fetchWithRetry(url.toString(), { method: 'GET' });
      if (response.status === 404 || response.status >= 500) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return DireccionResponseSchema.parse(data);
    } catch (error) {
      return {
        direcciones: [],
        geocode_confidence: 0.1,
        fallback_used: true,
      };
    }
  }

  async getProvincias(nombre?: string): Promise<z.infer<typeof ProvinciaResponseSchema>> {
    const url = new URL(`${this.baseUrl}/provincias`);
    if (nombre) url.searchParams.append('nombre', nombre);

    try {
      const response = await fetchWithRetry(url.toString(), { method: 'GET' });
      if (response.status === 404 || response.status >= 500) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return ProvinciaResponseSchema.parse(data);
    } catch (error) {
      return {
        provincias: [],
        geocode_confidence: 0.1,
        fallback_used: true,
      };
    }
  }

  async getMunicipios(provincia?: string, nombre?: string): Promise<z.infer<typeof MunicipioResponseSchema>> {
    const url = new URL(`${this.baseUrl}/municipios`);
    if (provincia) url.searchParams.append('provincia', provincia);
    if (nombre) url.searchParams.append('nombre', nombre);

    try {
      const response = await fetchWithRetry(url.toString(), { method: 'GET' });
      if (response.status === 404 || response.status >= 500) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return MunicipioResponseSchema.parse(data);
    } catch (error) {
      return {
        municipios: [],
        geocode_confidence: 0.1,
        fallback_used: true,
      };
    }
  }
}
