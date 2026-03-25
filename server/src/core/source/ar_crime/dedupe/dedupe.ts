export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function makeDedupeKey(
  title: string,
  location: string | undefined,
  dateISO: string,
): string {
  const date = new Date(dateISO);
  const day = Number.isNaN(date.getTime()) ? dateISO.slice(0, 10) : date.toISOString().slice(0, 10);
  const loc = normalizeText(location ?? 'unknown');
  return `${normalizeText(title)}|${loc}|${day}`;
}
