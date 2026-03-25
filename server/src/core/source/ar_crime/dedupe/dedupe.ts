import crypto from 'crypto';

export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, '') // remove punctuation
    .trim();
}

/**
 * Deterministic dedupe key generation for MVP
 * Combines normalized title words + location snippet + date bucket
 */
export function generateDedupeKey(title: string, locationText: string | null, dateIso: string | null): string {
  const t = normalizeString(title).split(' ').slice(0, 5).join('_'); // first 5 words
  const loc = locationText ? normalizeString(locationText).substring(0, 10) : 'unknown_loc';
  const d = dateIso ? dateIso.slice(0, 10) : 'unknown_date'; // YYYY-MM-DD

  const rawKey = `${t}__${loc}__${d}`;
  return crypto.createHash('sha256').update(rawKey).digest('hex').slice(0, 16);
}

export function generateContentHash(title: string, link: string): string {
  return crypto.createHash('sha256').update(`${title}|${link}`).digest('hex');
}
