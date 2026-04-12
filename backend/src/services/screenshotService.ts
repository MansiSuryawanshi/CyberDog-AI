import puppeteer from 'puppeteer';

export interface ScreenshotResult {
  imageBase64: string;
  finalUrl: string;       // URL after redirects
  pageTitle: string;
  hadRedirect: boolean;
}

export async function captureScreenshot(url: string): Promise<ScreenshotResult> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');

    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => null);

    const finalUrl = page.url();
    const pageTitle = await page.title().catch(() => '');
    const hadRedirect = finalUrl !== url;

    const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 80, fullPage: false }) as Buffer;
    const imageBase64 = screenshotBuffer.toString('base64');

    return { imageBase64, finalUrl, pageTitle, hadRedirect };
  } finally {
    await browser.close();
  }
}
