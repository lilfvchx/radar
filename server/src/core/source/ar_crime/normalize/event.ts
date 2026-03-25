import type { EventType } from '../types';

const CRIME_KEYWORDS: Array<{ type: EventType; words: string[] }> = [
  { type: 'homicide', words: ['homicidio', 'asesinato', 'femicidio'] },
  { type: 'robbery', words: ['robo', 'asalto', 'entradera', 'motochorro'] },
  { type: 'drug_trafficking', words: ['narco', 'droga', 'estupefaciente'] },
  { type: 'kidnapping', words: ['secuestro'] },
  { type: 'illegal_firearm', words: ['arma ilegal', 'tenencia de arma'] },
  { type: 'cybercrime', words: ['ciberdelito', 'phishing', 'hackeo'] },
];

export function inferEventType(input: string): EventType {
  const normalized = input.toLowerCase();
  for (const row of CRIME_KEYWORDS) {
    if (row.words.some((word) => normalized.includes(word))) return row.type;
  }
  return 'unknown';
}

export function extractLocationText(input: string): string | undefined {
  const match = input.match(/(?:en|de)\s+([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑ\-\s]{2,40})/);
  return match?.[1]?.trim();
}
