import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const VIEWPORTS = [
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'desktop-1366', width: 1366, height: 768 },
  { name: 'tablet-ipad', width: 768, height: 1024 },
  { name: 'mobile-iphone', width: 390, height: 844 },
];

const PAGES = [
  { name: 'login', path: '/login', requiresAuth: false },
  { name: 'overview', path: '/', requiresAuth: true },
  { name: 'cards', path: '/cards', requiresAuth: true },
  { name: 'transactions', path: '/transactions', requiresAuth: true },
  { name: 'monthly-view', path: '/monthly-view', requiresAuth: true },
  { name: 'cashback-rules', path: '/cashback-rules', requiresAuth: true },
  { name: 'category-codes', path: '/category-codes', requiresAuth: true },
  { name: 'card-tracking', path: '/card-tracking', requiresAuth: true },
  { name: 'settings', path: '/settings', requiresAuth: true },
  { name: 'change-password', path: '/change-password', requiresAuth: true },
  { name: 'not-found', path: '/non-existent-page-404', requiresAuth: false },
];

async function authenticate(page: any) {
  await page.request.post('/api/auth/login', {
    data: { username: 'taitv', password: 'Tai@28012004' },
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
}

async function runTypeAudit() {
  const screenshotsDir = path.resolve('../docs/screenshots/type-before');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const allAudits: any[] = [];
  const fontSizesSet = new Set<string>();
  const fontFamiliesSet = new Set<string>();
  const fontWeightsSet = new Set<string>();
  const buttonHeightsSet = new Set<number>();
  const inputHeightsSet = new Set<number>();
  const anomalies: any[] = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      baseURL: 'http://localhost:5173',
    });
    const page = await context.newPage();
    await authenticate(page);

    for (const p of PAGES) {
      await page.goto(p.path);
      await page.waitForTimeout(400);

      // Capture screenshot
      const shotName = `${p.name}-${vp.name}.png`;
      await page.screenshot({ path: path.join(screenshotsDir, shotName) });

      // Extract typography, buttons, inputs, spacing
      interface PageAudit {
        textMetrics: Array<{
          tag: string;
          text: string;
          fontSize: number;
          lineHeight: number;
          fontWeight: string;
          fontFamily: string;
          role: string;
        }>;
        buttonMetrics: Array<{
          text: string;
          width: number;
          height: number;
          padding: string;
          fontSize: number;
          fontWeight: string;
        }>;
        inputMetrics: Array<{
          tag: string;
          width: number;
          height: number;
          fontSize: number;
          padding: string;
        }>;
      }

      const pageAudit = await page.evaluate<PageAudit>(`(() => {
        const textNodes = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, label, th, td, button, input, [data-role]'));
        const textMetrics = [];
        
        for (const el of textNodes) {
          const text = el.textContent?.trim();
          if (!text || text.length === 0) continue;
          
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.5;
          const fontWeight = style.fontWeight;
          const fontFamily = style.fontFamily;
          
          textMetrics.push({
            tag: el.tagName.toLowerCase(),
            text: text.slice(0, 25),
            fontSize: Math.round(fontSize * 10) / 10,
            lineHeight: Math.round(lineHeight * 10) / 10,
            fontWeight,
            fontFamily,
            role: el.getAttribute('data-role') || ''
          });
        }

        const buttons = Array.from(document.querySelectorAll('button, [role="button"], a.btn'));
        const buttonMetrics = buttons.map(b => {
          const rect = b.getBoundingClientRect();
          const style = window.getComputedStyle(b);
          return {
            text: b.textContent?.trim().slice(0, 20) || '',
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            padding: style.padding,
            fontSize: parseFloat(style.fontSize),
            fontWeight: style.fontWeight
          };
        });

        const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
        const inputMetrics = inputs.map(i => {
          const rect = i.getBoundingClientRect();
          const style = window.getComputedStyle(i);
          return {
            tag: i.tagName.toLowerCase(),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            fontSize: parseFloat(style.fontSize),
            padding: style.padding
          };
        });

        return { textMetrics, buttonMetrics, inputMetrics };
      })()`);

      // Collect data
      pageAudit.textMetrics.forEach((t) => {
        fontSizesSet.add(`${t.fontSize}px`);
        fontFamiliesSet.add(t.fontFamily);
        fontWeightsSet.add(t.fontWeight);
        if (t.fontSize < 12) {
          anomalies.push({ type: 'text-below-12px', page: p.name, vp: vp.name, item: t });
        }
        if (t.fontSize > 28 && p.name !== 'login') {
          anomalies.push({ type: 'text-above-28px', page: p.name, vp: vp.name, item: t });
        }
      });

      pageAudit.buttonMetrics.forEach((b) => {
        if (b.height > 0) buttonHeightsSet.add(b.height);
      });

      pageAudit.inputMetrics.forEach((i) => {
        if (i.height > 0) inputHeightsSet.add(i.height);
      });

      allAudits.push({ page: p.name, viewport: vp.name, data: pageAudit });
    }

    await context.close();
  }

  await browser.close();

  const report = {
    summary: {
      distinctFontSizes: Array.from(fontSizesSet).sort((a,b) => parseFloat(a) - parseFloat(b)),
      distinctFontFamilies: Array.from(fontFamiliesSet),
      distinctFontWeights: Array.from(fontWeightsSet),
      distinctButtonHeights: Array.from(buttonHeightsSet).sort((a,b) => a - b),
      distinctInputHeights: Array.from(inputHeightsSet).sort((a,b) => a - b),
      totalAnomaliesFound: anomalies.length
    },
    anomalies: anomalies.slice(0, 30)
  };

  fs.writeFileSync(path.resolve('../docs/type-audit-baseline.json'), JSON.stringify(report, null, 2));
  console.log('TYPE_AUDIT_BASELINE_DONE:', JSON.stringify(report.summary, null, 2));
}

runTypeAudit().catch(console.error);
