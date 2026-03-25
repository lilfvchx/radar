import { describe, it, expect, vi } from 'vitest';
import { generateDedupeKey, normalizeString } from '../dedupe/dedupe';
import { extractCrimeType, extractWeaponPresence, extractLocations } from '../normalize/event';
import { calculateSeverity, calculateConfidence } from '../score/scoring';

describe('AR Crime Normalization & Scoring', () => {
  it('should extract crime types correctly', () => {
    expect(extractCrimeType('Un hombre fue asesinado en el barrio')).toBe('homicide');
    expect(extractCrimeType('Robo violento de motochorro')).toBe('robbery');
    expect(extractCrimeType('Desbaratan red de trata')).toBe('human_trafficking');
    expect(extractCrimeType('Noticia normal sin crimen')).toBe('unknown');
  });

  it('should detect weapons', () => {
    expect(extractWeaponPresence('Lo amenazó con una pistola')).toBe(true);
    expect(extractWeaponPresence('Recibió varios tiros')).toBe(true);
    expect(extractWeaponPresence('Le robaron el celular')).toBe(false);
  });

  it('should extract locations naively', () => {
    expect(extractLocations('Un asalto en Quilmes Centro dejó un herido')).toBe('Quilmes Centro');
    expect(extractLocations('Ocurrió en Rosario, Santa Fe ayer')).toBe('Rosario, Santa Fe');
  });

  it('should generate deterministic dedupe keys', () => {
    const key1 = generateDedupeKey('Robo en Lanus', 'Lanus', '2023-10-15T12:00:00Z');
    const key2 = generateDedupeKey('ROBO EN LANÚS', 'Lanus', '2023-10-15T18:00:00Z'); // different time, same day
    const key3 = generateDedupeKey('Robo en Lanus', 'Lanus', '2023-10-16T12:00:00Z'); // next day

    expect(key1).toBe(key2); // title normalized, day is the same
    expect(key1).not.toBe(key3); // different day
  });

  it('should calculate severity', () => {
    expect(calculateSeverity({ event_type: 'homicide', weapon_present: true })).toBe(95); // 10 + 70 + 15
    expect(calculateSeverity({ event_type: 'cybercrime' })).toBe(30); // 10 + 20
    expect(calculateSeverity({ event_type: 'robbery', weapon_present: false, victim_count: 3 })).toBe(65); // 10 + 40 + (3*5)
  });

  it('should calculate confidence', () => {
    expect(calculateConfidence({ lat: -34, lon: -58, geocode_confidence: 0.9 }, 1)).toBe(60); // 30 + 30
    expect(calculateConfidence({ admin_area_municipio: 'CABA' }, 3)).toBe(80); // 30 + (2*20) + 10
  });
});
