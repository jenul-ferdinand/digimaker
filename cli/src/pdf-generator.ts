import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import { ParsedLesson } from '@common-types/lesson';
import { GenerateOptions } from '@common-types/generate';
import { logger } from './logger.js';

export interface PdfGeneratorInstance {
  browser: Browser;
  generatePdf: (data: ParsedLesson, options?: GenerateOptions) => Promise<string>;
  generateBatch: (items: { data: ParsedLesson; options: GenerateOptions }[]) => Promise<string[]>;
  close: () => Promise<void>;
}

interface PooledPage {
  page: Page;
  busy: boolean;
}

const POOL_SIZE = 4;
const RENDER_DELAY = 100;
const PAGE_WAIT_MS = 30_000;

export async function createPdfGenerator(serverUrl: string): Promise<PdfGeneratorInstance> {
  logger.info('[PDF] Launching browser...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const pool: PooledPage[] = [];

  async function initPage(): Promise<Page> {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.goto(serverUrl, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('print');
    return page;
  }

  async function getAvailablePage(): Promise<PooledPage> {
    let pooledPage = pool.find(p => !p.busy);

    if (!pooledPage && pool.length < POOL_SIZE) {
      const page = await initPage();
      pooledPage = { page, busy: false };
      pool.push(pooledPage);
    }

    if (!pooledPage) {
      await new Promise<void>(resolve => {
        const check = () => {
          pooledPage = pool.find(p => !p.busy);
          if (pooledPage) resolve();
          else setTimeout(check, 10);
        };
        check();
      });
    }

    pooledPage!.busy = true;
    return pooledPage!;
  }

  async function generateOnPage(page: Page, data: ParsedLesson, options: GenerateOptions): Promise<string> {
    const { outputDir = './output', filename = 'output' } = options;
    await fs.mkdir(outputDir, { recursive: true });

    // Clear previous data
    await page.evaluate(() => {
      (window as any)['PDF_DATA'] = null;
    });

    // Small delay to ensure Angular detects the null value
    await new Promise(resolve => setTimeout(resolve, 50));

    // Set new data
    await page.evaluate((lessonData) => {
      (window as any)['PDF_DATA'] = lessonData;
    }, data);

    // Wait for content to render with longer timeout and more frequent polling
    await page.waitForFunction(
      () => {
        const el = document.querySelector('.a4-page');
        return el && el.textContent && el.textContent.length > 10;
      },
      { timeout: PAGE_WAIT_MS, polling: 100 }
    );

    await new Promise(resolve => setTimeout(resolve, RENDER_DELAY));

    const pdfPath = path.join(outputDir, `${filename}.pdf`);

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return pdfPath;
  }

  async function generatePdf(data: ParsedLesson, options: GenerateOptions = {}): Promise<string> {
    const pooledPage = await getAvailablePage();
    try {
      const result = await generateOnPage(pooledPage.page, data, options);
      logger.info(`[PDF] Saved: ${result}`);
      return result;
    } finally {
      pooledPage.busy = false;
    }
  }

  async function generateBatch(items: { data: ParsedLesson; options: GenerateOptions }[]): Promise<string[]> {
    logger.info(`[PDF] Processing ${items.length} files with ${POOL_SIZE} parallel workers...`);

    const results: string[] = [];
    const promises = items.map(async (item, index) => {
      const result = await generatePdf(item.data, item.options);
      results[index] = result;
    });

    await Promise.all(promises);
    return results;
  }

  async function close(): Promise<void> {
    for (const pooledPage of pool) {
      await pooledPage.page.close();
    }
    await browser.close();
    logger.info('[PDF] Browser closed');
  }

  logger.info('[PDF] Browser launched');
  return { browser, generatePdf, generateBatch, close };
}
