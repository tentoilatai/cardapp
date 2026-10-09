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
  { name: 'not-found', path: '/non-existent-page-404', requiresAuth: false },
];

async function authenticate(page: any) {
  await page.request.post('/api/auth/login', {
    data: { username: 'taitv', password: 'Tai@28012004' },
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
}

async function runTypeAuditAfter() {
  const screenshotsDir = path.resolve('../docs/screenshots/type-after');
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
      await page.waitForTimeout(500);

      // Capture screenshot
      const shotName = `${p.name}-${vp.name}.png`;
      await page.screenshot({ path: path.join(screenshotsDir, shotName) });

      // Extract typography, buttons, inputs, spacing
      const pageAudit = await page.evaluate(`(() => {
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
            lineHeight: parseFloat(style.lineHeight) || 0
          };
        });

        return {
          textCount: textMetrics.length,
          textMetrics,
          buttonsCount: buttonMetrics.length,
          buttonMetrics,
          inputsCount: inputMetrics.length,
          inputMetrics
        };
      })()`);

      // Collect data into sets
      for (const t of (pageAudit as any).textMetrics) {
        fontSizesSet.add(`${t.fontSize}px`);
        fontFamiliesSet.add(t.fontFamily.split(',')[0].replace(/['"]/g, '').trim());
        fontWeightsSet.add(t.fontWeight);

        if (t.fontSize < 11.5) {
          anomalies.push({
            page: p.name,
            viewport: vp.name,
            issue: `Font size too small: ${t.fontSize}px < 12px floor`,
            element: `${t.tag}: "${t.text}"`
          });
        }
        if (!['400', '500', '600'].includes(String(t.fontWeight))) {
          anomalies.push({
            page: p.name,
            viewport: vp.name,
            issue: `Non-standard font weight: ${t.fontWeight}`,
            element: `${t.tag}: "${t.text}"`
          });
        }
      }

      for (const b of (pageAudit as any).buttonMetrics) {
        if (b.height > 0) buttonHeightsSet.add(b.height);
      }

      for (const i of (pageAudit as any).inputMetrics) {
        if (i.height > 0) inputHeightsSet.add(i.height);
      }

      allAudits.push({
        page: p.name,
        viewport: vp.name,
        audit: pageAudit
      });
    }
  }

  await browser.close();

  const summary = {
    totalDistinctFontSizes: fontSizesSet.size,
    distinctFontSizes: Array.from(fontSizesSet).sort((a, b) => parseFloat(a) - parseFloat(b)),
    totalDistinctFontFamilies: fontFamiliesSet.size,
    distinctFontFamilies: Array.from(fontFamiliesSet),
    distinctFontWeights: Array.from(fontWeightsSet).sort(),
    totalDistinctButtonHeights: buttonHeightsSet.size,
    distinctButtonHeights: Array.from(buttonHeightsSet).sort((a, b) => a - b),
    totalDistinctInputHeights: inputHeightsSet.size,
    distinctInputHeights: Array.from(inputHeightsSet).sort((a, b) => a - b),
    totalAnomalies: anomalies.length,
    anomalies: anomalies.slice(0, 50)
  };

  fs.writeFileSync(
    path.resolve('../docs/type-audit-after.json'),
    JSON.stringify({ summary, allAudits }, null, 2),
    'utf-8'
  );

  console.log('=== TYPE AUDIT AFTER SUMMARY ===');
  console.log(`Distinct font sizes: ${summary.totalDistinctFontSizes} ->`, summary.distinctFontSizes);
  console.log(`Distinct font families: ${summary.totalDistinctFontFamilies} ->`, summary.distinctFontFamilies);
  console.log(`Distinct font weights:`, summary.distinctFontWeights);
  console.log(`Distinct button heights: ${summary.totalDistinctButtonHeights} ->`, summary.distinctButtonHeights);
  console.log(`Distinct input heights: ${summary.totalDistinctInputHeights} ->`, summary.distinctInputHeights);
  console.log(`Total anomalies: ${summary.totalAnomalies}`);
  if (summary.totalAnomalies > 0) {
    console.log('Sample anomalies:', summary.anomalies.slice(0, 10));
  }
}

runTypeAuditAfter().catch(console.error);
