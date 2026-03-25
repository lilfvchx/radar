import { chromium, Page } from 'playwright';

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

const randomThrottle = async (): Promise<void> => {
  const min = 3000;
  const max = 5000;
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise((resolve) => setTimeout(resolve, delay));
};

export async function scrapeComprarPublicSearch(): Promise<ComprarResult[]> {
  // 4. Kill Switch
  if (process.env.KILL_SWITCH_COMPRAR === 'true') {
    return [];
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set an absolute timeout per page of 30s
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);

  try {
    // 3. Strict Throttling: 1 request every 3-5s
    await randomThrottle();
    await page.goto('https://comprar.gob.ar/BuscarAvanzado.aspx');

    // 5. Self-protection: check for schema drift
    try {
      await page.waitForSelector('#resultados', { state: 'attached', timeout: 10000 });
    } catch (error) {
      console.error('[CRÍTICA] Schema Drift Detectado: La tabla #resultados no existe. COMPR.AR puede haber cambiado su diseño.');
      throw new SchemaDriftError('Master CSS selector #resultados not found');
    }

    const results: ComprarResult[] = [];
    const rows = await page.locator('#resultados tbody tr').all();

    for (const row of rows) {
      const cells = await row.locator('td').allInnerTexts();

      if (cells.length >= 4) {
        const numeroExpediente = cells[0] || '';
        const organismo = cells[1] || '';
        const objeto = cells[2] || '';
        const monto = cells[3] || '';

        if (numeroExpediente || organismo || objeto || monto) {
          results.push({
            numeroExpediente: numeroExpediente.trim(),
            organismo: organismo.trim(),
            objeto: objeto.trim(),
            monto: monto.trim(),
          });
        }
      }
    }

    return results;
  } finally {
    await browser.close();
  }
}
