import type { EventType } from '../types';

const BASE_SEVERITY: Record<EventType, number> = {
  homicide: 90,
  robbery: 65,
  assault: 60,
  kidnapping: 85,
  drug_trafficking: 75,
  illegal_firearm: 70,
  gender_violence: 80,
  human_trafficking: 90,
  cybercrime: 55,
  unknown: 40,
};

export function computeSeverityScore(eventType: EventType, headline: string): number {
  let score = BASE_SEVERITY[eventType] ?? 40;
  const lower = headline.toLowerCase();
  if (lower.includes('arma')) score += 5;
  if (lower.includes('muert')) score += 8;
  if (lower.includes('narco')) score += 5;
  return Math.max(0, Math.min(100, score));
}

export function computeConfidenceScore(params: {
  sourceReliability: number;
  corroboratedSources: number;
  geocodeConfidence: number;
}): number {
  const corroboration = Math.min(20, params.corroboratedSources * 5);
  const score =
    params.sourceReliability + corroboration + Math.floor(params.geocodeConfidence * 0.25);
  return Math.max(0, Math.min(100, score));
}
