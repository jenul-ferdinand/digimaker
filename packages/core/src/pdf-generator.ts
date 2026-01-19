import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import { ParsedLesson, GenerateOptions } from './schemas/index.js';
import { logger } from './logger.js';
import { parseDocx } from './parsing/index.js';

export interface PdfGeneratorInstance {
  browser: Browser;
  generatePdf: (data: ParsedLesson, options?: GenerateOptions) => Promise<string>;
  generateBatch: (items: { data: ParsedLesson; options: GenerateOptions }[]) => Promise<string[]>;
  close: () => Promise<void>;
}

export interface FileToConvert {
  path: string;
  name: string;
}

export interface ConversionResult {
  file: string;
  success: boolean;
  pdfPath?: string;
  error?: string;
}

export const POOL_SIZE = 4;
const RENDER_DELAY = 100;
const PAGE_WAIT_MS = 30_000;

export async function createPdfGenerator(serverUrl: string): Promise<PdfGeneratorInstance> {
  logger.info('[PDF] Launching browser...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const printUrl = serverUrl.endsWith('/') ? `${serverUrl}print` : `${serverUrl}/print`;
  let renderTokenCounter = 0;

  async function initPage(): Promise<Page> {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.goto(printUrl, { waitUntil: 'networkidle0' });
    return page;
  }

  async function renderOnPage(page: Page, data: ParsedLesson): Promise<void> {
    const renderToken = ++renderTokenCounter;

    // Set the render token
    await page.evaluate((token) => {
      (window as any)['RENDER_TOKEN'] = token;
    }, renderToken);

    // Set data - Angular will render and set RENDER_DONE_TOKEN when complete
    await page.evaluate((lessonData) => {
      (window as any)['PDF_DATA'] = lessonData;
    }, data);

    // Wait for render completion
    await page.waitForFunction(
      (token) => (window as any)['RENDER_DONE_TOKEN'] === token,
      { timeout: PAGE_WAIT_MS, polling: 100 },
      renderToken
    );

    // Wait for all images to load
    await page.waitForFunction(
      () => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.every((img) => img.complete && img.naturalHeight > 0);
      },
      { timeout: PAGE_WAIT_MS, polling: 100 }
    );

    // Small delay for final paint
    await new Promise((resolve) => setTimeout(resolve, RENDER_DELAY));
  }

  /**
   * Generate a single PDF.
   * Each call creates a fresh page and closes it when done.
   * Paged.js cannot be safely reused, so one page = one PDF.
   */
  async function generatePdf(data: ParsedLesson, options: GenerateOptions = {}): Promise<string> {
    const { outputDir = './output', filename = 'output' } = options;
    await fs.mkdir(outputDir, { recursive: true });

    const page = await initPage();
    try {
      await renderOnPage(page, data);

      const pdfPath = path.join(outputDir, `${filename}.pdf`);
      await page.pdf({
        path: pdfPath,
        printBackground: true,
        width: '210mm',
        height: '297mm',
      });

      logger.info(`[PDF] Saved: ${pdfPath}`);
      return pdfPath;
    } finally {
      await page.close();
    }
  }

  async function generateBatch(
    items: { data: ParsedLesson; options: GenerateOptions }[]
  ): Promise<string[]> {
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
    await browser.close();
    logger.info('[PDF] Browser closed');
  }

  logger.info('[PDF] Browser launched');
  return { browser, generatePdf, generateBatch, close };
}

/**
 * Process files with bounded concurrency: parse -> generate PDF for each file.
 * Continues on individual failures and returns results for all files.
 */
export async function convertWithConcurrency(
  files: FileToConvert[],
  generator: PdfGeneratorInstance,
  outputDir: string,
  concurrency: number = POOL_SIZE
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = [];
  const queue = [...files];
  let active = 0;
  let index = 0;

  return new Promise((resolve) => {
    const processNext = () => {
      if (queue.length === 0 && active === 0) {
        resolve(results);
        return;
      }

      while (active < concurrency && queue.length > 0) {
        const file = queue.shift()!;
        const currentIndex = index++;
        active++;

        (async () => {
          const result: ConversionResult = { file: file.name, success: false };
          try {
            logger.info(`[${currentIndex + 1}/${files.length}] Parsing: ${file.name}`);
            const parsed = await parseDocx(file.path);

            logger.info(`[${currentIndex + 1}/${files.length}] Generating PDF: ${file.name}`);
            const pdfPath = await generator.generatePdf(parsed.data, {
              outputDir,
              filename: file.name,
            });

            result.success = true;
            result.pdfPath = pdfPath;
          } catch (err) {
            result.error = err instanceof Error ? err.message : String(err);
            logger.error(`[${currentIndex + 1}/${files.length}] Failed: ${file.name} - ${result.error}`);
          }

          results[currentIndex] = result;
          active--;
          processNext();
        })();
      }
    };

    processNext();
  });
}
