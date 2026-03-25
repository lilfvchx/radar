import csv from 'csv-parser';
import { Readable } from 'stream';

type CkanPackageSearchResponse = {
  result: { results: Array<{ id: string; name: string; title: string; resources: Array<{ url: string; format: string }> }> };
};

export async function ckanPackageSearch(baseUrl: string, q: string) {
  const url = `${baseUrl}/api/3/action/package_search?q=${encodeURIComponent(q)}&rows=20`;
  const res = await fetch(url, { headers: { 'User-Agent': 'RadarCrimeOSINT/0.1' } });
  if (!res.ok) throw new Error(`CKAN package_search failed ${res.status}`);
  return (await res.json()) as CkanPackageSearchResponse;
}

export async function fetchCkanCsv(url: string): Promise<any[]> {
  const res = await fetch(url, { headers: { 'User-Agent': 'RadarCrimeOSINT/0.1' } });
  if (!res.ok) throw new Error(`CKAN resource fetch failed ${res.status}`);

  const text = await res.text();

  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const stream = Readable.from([text]);

    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}
