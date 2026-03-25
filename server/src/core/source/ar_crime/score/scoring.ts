import { CrimeEvent } from '../types';

export function calculateSeverity(event: Partial<CrimeEvent>): number {
  let score = 10; // base score

  // Event type rules
  switch (event.event_type) {
    case 'homicide':
    case 'kidnapping':
    case 'human_trafficking':
      score += 70;
      break;
    case 'drug_trafficking':
    case 'illegal_firearm':
      score += 50;
      break;
    case 'robbery':
    case 'assault':
    case 'gender_violence':
      score += 40;
      break;
    case 'cybercrime':
      score += 20;
      break;
  }

  // Modifiers
  if (event.weapon_present) score += 15;
  if (event.victim_count && event.victim_count > 1) score += (event.victim_count * 5);
  if (event.suspect_count && event.suspect_count > 2) score += 10;

  return Math.min(100, Math.max(0, score));
}

export function calculateConfidence(event: Partial<CrimeEvent>, sourceCount: number): number {
  let score = 30; // base confidence for a single non-official source

  // Boost by number of corroborated sources
  if (sourceCount > 1) score += (sourceCount - 1) * 20;

  // Geographic precision boost
  if (event.lat && event.lon) {
    if (event.geocode_confidence && event.geocode_confidence > 0.8) {
      score += 30; // Exact geocoded location
    } else {
      score += 15; // Rough lat/lon
    }
  } else if (event.admin_area_municipio || event.location_text) {
    score += 10; // Mentioned city/neighborhood but no coordinates
  }

  return Math.min(100, Math.max(0, score));
}
