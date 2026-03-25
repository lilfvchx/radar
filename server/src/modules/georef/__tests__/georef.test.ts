import { vi, describe, beforeEach, it, expect } from 'vitest';
import { GeorefClient } from '../client';

// Mock the global fetch using Vitest
global.fetch = vi.fn();

describe('GeorefClient', () => {
  let client: GeorefClient;

  beforeEach(() => {
    client = new GeorefClient();
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  });

  it('should fallback to degraded mode on 500 error after retries', async () => {
    // Simular error 500
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 500,
      json: async () => ({}),
    });

    const result = await client.getDirecciones('Callao 123');

    expect(global.fetch).toHaveBeenCalledTimes(3);

    expect(result).toEqual({
      direcciones: [],
      geocode_confidence: 0.1,
      fallback_used: true,
    });
  }, 10000);
});
