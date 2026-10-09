import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const VIEWPORTS = [
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'desktop-1366', width: 1366, height: 768 },
  { name: 'tablet-ipad', width: 768, height: 1024 },
  { name: 'mobile-iphone', width: 390, height: 844 }
];

const PAGES = [
  { name: 'login', path: '/login' },
  { name: 'dashboard', path: '/' },
  { name: 'cards', path: '/cards' },
  { name: 'transactions', path: '/transactions' },
  { name: 'monthly-view', path: '/monthly-view' },
  { name: 'cashback-rules', path: '/cashback-rules' },
  { name: 'category-codes', path: '/category-codes' },
  { name: 'card-tracking', path: '/card-tracking' },
  { name: 'settings', path: '/settings' },
  { name: 'change-password', path: '/change-password' },
  { name: 'not-found', path: '/non-existent-page-404' }
];

async function runAudit() {
  const screenshotsDir = path.resolve('../docs/screenshots/glass-before');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height }
    });
    const page = await context.newPage();

    for (const p of PAGES) {
      await page.goto(`http://localhost:5173${p.path}`);
      await page.waitForTimeout(600);

      // Light mode capture
      const lightShotName = `${p.name}-${vp.name}-light.png`;
      await page.screenshot({ path: path.join(screenshotsDir, lightShotName) });

      // Measure surfaces
      const surfaceMetrics = await page.evaluate(() => {
        const surfaces = document.querySelectorAll('.glass-surface, .glass-surface-dense, .glass-surface-clear, .glass-surface-thick, aside, header, nav, [data-testid="glass-block"], [data-testid="stat-card"]');
        const data: Array<{
          tag: string;
          className: string;
          bg: string;
          bgImage: string;
          backdropFilter: string;
          opacity: string;
          boxShadow: string;
          border: string;
        }> = [];
        surfaces.forEach((el) => {
          const style = window.getComputedStyle(el);
          data.push({
            tag: el.tagName.toLowerCase(),
            className: el.className,
            bg: style.backgroundColor,
            bgImage: style.backgroundImage,
            backdropFilter: style.backdropFilter || (style as any).webkitBackdropFilter,
            opacity: style.opacity,
            boxShadow: style.boxShadow,
            border: style.borderColor
          });
        });
        return data.slice(0, 10);
      });

      // Dark mode capture
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await page.waitForTimeout(300);
      const darkShotName = `${p.name}-${vp.name}-dark.png`;
      await page.screenshot({ path: path.join(screenshotsDir, darkShotName) });
      await page.evaluate(() => document.documentElement.classList.remove('dark'));

      results.push({
        page: p.name,
        viewport: vp.name,
        surfaces: surfaceMetrics
      });
    }

    await context.close();
  }

  await browser.close();

  fs.writeFileSync(
    path.resolve('../docs/glass-audit-data-before.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('AUDIT_BASELINE_CAPTURED_SUCCESSFULLY');
}

runAudit().catch(console.error);
