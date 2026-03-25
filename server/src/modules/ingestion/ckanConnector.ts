import fs from 'fs';
import path from 'path';

// Rate Limiting variables
const MAX_REQUESTS_PER_SECOND = 10;
const REQUEST_INTERVAL_MS = 1000 / MAX_REQUESTS_PER_SECOND;

let lastRequestTime = 0;
let queue: Promise<void> = Promise.resolve();

function throttle(): Promise<void> {
  queue = queue.then(() => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    let waitTime = 0;

    if (timeSinceLastRequest < REQUEST_INTERVAL_MS) {
      waitTime = REQUEST_INTERVAL_MS - timeSinceLastRequest;
    }

    lastRequestTime = now + waitTime;

    if (waitTime > 0) {
      return new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    return Promise.resolve();
  });

  return queue;
}

async function fetchWithThrottle(url: string, options?: RequestInit): Promise<Response> {
  await throttle();
  const response = await fetch(url, options);
  return response;
}

export class CKANConnector {
  constructor(private baseUrl: string) {}

  /**
   * Simulates a check against a database to see if the dataset changed.
   * In a real implementation, this would query a DB using checksum or last_modified.
   */
  private async hasDatasetChanged(resourceId: string, checksum: string | null, lastModified: string | null): Promise<boolean> {
    // For this implementation, we simulate that it always changed, so we download it.
    return true;
  }

  /**
   * Discovers and downloads resources based on a keyword.
   *
   * Flow:
   * 1. GET package_search with keyword.
   * 2. Iterate and GET package_show for each id.
   * 3. Extract resources.url (CSVs, JSONs).
   * 4. Check DB (simulated).
   * 5. Download file.
   */
  async discoverAndDownload(keyword: string, outputDir: string = '/tmp/ckan_downloads'): Promise<void> {
    console.log(`[CKAN] Starting discovery for keyword: "${keyword}"`);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      // 1. package_search
      const searchUrl = new URL(`${this.baseUrl}/api/3/action/package_search`);
      searchUrl.searchParams.append('q', keyword);

      const searchResponse = await fetchWithThrottle(searchUrl.toString());
      if (!searchResponse.ok) {
        throw new Error(`package_search failed with status: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      const results = searchData.result?.results || [];
      console.log(`[CKAN] Found ${results.length} packages for keyword "${keyword}"`);

      // 2. Iterate over results
      for (const pkg of results) {
        try {
          // package_show
          const showUrl = new URL(`${this.baseUrl}/api/3/action/package_show`);
          showUrl.searchParams.append('id', pkg.id);

          const showResponse = await fetchWithThrottle(showUrl.toString());
          if (!showResponse.ok) {
            console.warn(`[CKAN] Warning: package_show failed for id ${pkg.id} (status: ${showResponse.status})`);
            continue;
          }

          const showData = await showResponse.json();
          const resources = showData.result?.resources || [];

          // 3. Extract resources.url
          for (const resource of resources) {
            const format = resource.format?.toLowerCase() || '';
            const url = resource.url;

            if (format === 'csv' || format === 'json' || url.endsWith('.csv') || url.endsWith('.json')) {
              console.log(`[CKAN] Processing resource: ${resource.name || resource.id} (${format})`);

              // 4. Simulate DB check
              const changed = await this.hasDatasetChanged(resource.id, resource.hash, resource.last_modified);

              if (changed) {
                // 5. Download file
                try {
                  console.log(`[CKAN] Downloading ${url}...`);
                  const downloadResponse = await fetchWithThrottle(url);

                  if (downloadResponse.status === 404) {
                    console.warn(`[CKAN] Error 404: Resource not found at ${url}`);
                    continue; // Skip and do not break pipeline
                  }

                  if (!downloadResponse.ok) {
                    throw new Error(`Download failed with status: ${downloadResponse.status}`);
                  }

                  // Determine file extension
                  const ext = format === 'csv' ? '.csv' : format === 'json' ? '.json' : '';
                  const filename = `${resource.id}${ext}`;
                  const filePath = path.join(outputDir, filename);

                  if (downloadResponse.body) {
                    const buffer = await downloadResponse.arrayBuffer();
                    fs.writeFileSync(filePath, Buffer.from(buffer));
                    console.log(`[CKAN] Downloaded successfully to ${filePath}`);
                  } else {
                     console.warn(`[CKAN] Error: Empty body for ${url}`);
                  }
                } catch (downloadError: any) {
                  console.warn(`[CKAN] Failed to download resource ${resource.id}: ${downloadError.message}`);
                }
              } else {
                console.log(`[CKAN] Resource ${resource.id} has not changed. Skipping download.`);
              }
            }
          }
        } catch (pkgError: any) {
           console.warn(`[CKAN] Error processing package ${pkg.id}: ${pkgError.message}`);
        }
      }
      console.log(`[CKAN] Discovery and download complete.`);
    } catch (error: any) {
      console.error(`[CKAN] Error during discovery: ${error.message}`);
    }
  }
}

// Script executable logic
if (require.main === module) {
  (async () => {
    // Ejemplo de uso con Datos Argentina
    const connector = new CKANConnector('https://datos.gob.ar');
    await connector.discoverAndDownload('estadisticas criminales', './ckan_downloads');
  })();
}
