import { chromium, Page } from 'playwright';

// Types
export interface ComprarResult {
  numeroExpediente: string;
  organismo: string;
  objeto: string;
  monto: string;
}

export class SchemaDriftError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaDriftError';
  }
}

// Random delay between 3 and 5 seconds
const randomDelay = () => {
  const min = 3000;
  const max = 5000;
  return new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
};

export async function scrapeComprarPublicSearch(): Promise<ComprarResult[]> {
  // 4. Kill Switch
  if (process.env.KILL_SWITCH_COMPRAR === 'true') {
    return []; // Abort silently
  }

  const browser = await chromium.launch({ headless: true });
  // Set an absolute timeout per page of 30s
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000); // 30s absolute timeout

  try {
    // 1. Navigate to search page
    // Using a placeholder URL as the actual search URL isn't provided, but assuming we can navigate to search results
    await page.goto('https://comprar.gob.ar/BuscarAvanzado.aspx');

    // Simulate navigation/search to results table if needed...
    // Let's assume the table is available at #resultados

    // 5. Self-protection: check for schema drift
    // Wait for the table, but catch the timeout to throw our custom error
    try {
      await page.waitForSelector('#resultados', { timeout: 10000 });
    } catch (error) {
      console.error('[CRÍTICA] Schema Drift Detectado: La tabla #resultados no existe. COMPR.AR puede haber cambiado su diseño.');
      throw new SchemaDriftError('Master CSS selector #resultados not found');
    }

    // Extract table rows
    // Wait for rows to be visible, then extract data
    const results: ComprarResult[] = [];
    const rows = await page.locator('#resultados tbody tr').all();

    for (const row of rows) {
      // 3. Strict Throttling: wait before processing each row or page (if paginated)
      // Here we simulate throttling between processing or requests.
      // If we were navigating between pages, we'd wait here.
      // We'll add the delay here to simulate throttling between item extraction
      // or navigation if it required further clicks.
      await randomDelay();

      const numeroExpediente = await row.locator('td:nth-child(1)').innerText().catch(() => '');
      const organismo = await row.locator('td:nth-child(2)').innerText().catch(() => '');
      const objeto = await row.locator('td:nth-child(3)').innerText().catch(() => '');
      const monto = await row.locator('td:nth-child(4)').innerText().catch(() => '');

      results.push({
        numeroExpediente: numeroExpediente.trim(),
        organismo: organismo.trim(),
        objeto: objeto.trim(),
        monto: monto.trim(),
      });
    }

    return results;
  } finally {
    await browser.close();
  }
}
