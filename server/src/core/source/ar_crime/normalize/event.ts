import { CrimeEvent } from '../types';

export const CRIME_KEYWORDS: Record<string, CrimeEvent['event_type']> = {
  asesinado: 'homicide',
  asesinat: 'homicide',
  homicidio: 'homicide',
  mató: 'homicide',
  muerto: 'homicide',
  cadaver: 'homicide',
  robo: 'robbery',
  asalto: 'robbery',
  entradera: 'robbery',
  motochorro: 'robbery',
  hurto: 'robbery',
  secuestro: 'kidnapping',
  rapto: 'kidnapping',
  droga: 'drug_trafficking',
  narco: 'drug_trafficking',
  cocaina: 'drug_trafficking',
  marihuana: 'drug_trafficking',
  arma: 'illegal_firearm',
  pistola: 'illegal_firearm',
  balacera: 'illegal_firearm',
  tiroteo: 'illegal_firearm',
  violencia: 'assault',
  golpiza: 'assault',
  lesiones: 'assault',
  femicidio: 'gender_violence',
  género: 'gender_violence',
  trata: 'human_trafficking',
  ciberdelito: 'cybercrime',
  estafa: 'cybercrime',
  phishing: 'cybercrime',
};

// Extremely basic NER for MVP
export function extractCrimeType(text: string): CrimeEvent['event_type'] {
  if (!text) return 'unknown';
  const lower = text.toLowerCase();

  for (const [kw, type] of Object.entries(CRIME_KEYWORDS)) {
    if (lower.includes(kw)) return type;
  }
  return 'unknown';
}

export function extractWeaponPresence(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return lower.includes('arma') || lower.includes('pistola') || lower.includes('cuchillo') || lower.includes('tiros') || lower.includes('balazo');
}

export function extractLocations(text: string): string | null {
  if (!text) return null;
  // Very naive extraction: look for "en X", "ocurrió en X", etc.
  const match = text.match(/(?:en|zona de|barrio de|localidad de)\s+([A-Z][a-záéíóúñA-Z0-9\s]+(?:,\s*[A-Z][a-záéíóúñA-Z0-9\s]+)?)/);
  if (match && match[1]) {
     // Limit to just the capitalized words
     const words = match[1].trim().split(/\s+/);
     const capitalizedWords = [];
     for (const word of words) {
        if (word && /[A-Z]/.test(word[0])) {
           capitalizedWords.push(word);
        } else {
           break;
        }
     }
     if (capitalizedWords.length > 0) {
        const loc = capitalizedWords.join(' ').replace(/,+$/, '');
        if (loc.length > 3 && loc.length < 50) return loc;
     }
  }
  return null;
}
