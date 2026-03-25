export type CkanDataset = {
  id: string;
  title: string;
  name: string;
  resources: Array<{ id: string; name: string; format?: string; url: string }>;
};

export async function ckanPackageSearch(
  baseUrl: string,
  q: string,
  rows = 10,
): Promise<CkanDataset[]> {
  const url = `${baseUrl}/api/3/action/package_search?q=${encodeURIComponent(q)}&rows=${rows}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'RadarCrimeOSINT/0.1' } });
  if (!res.ok) throw new Error(`CKAN package_search failed: ${res.status}`);
  const json = (await res.json()) as {
    result: {
      results: Array<{
        id: string;
        title: string;
        name: string;
        resources?: CkanDataset['resources'];
      }>;
    };
  };

  return json.result.results.map((row) => ({
    id: row.id,
    title: row.title,
    name: row.name,
    resources: row.resources ?? [],
  }));
}
