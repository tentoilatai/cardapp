import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const VIEWPORTS = [
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'desktop-1366', width: 1366, height: 768 },
  { name: 'tablet-ipad', width: 768, height: 1024 },
  { name: 'mobile-iphone', width: 390, height: 844 },
  { name: 'mobile-small', width: 320, height: 568 }
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
  { name: 'not-found', path: '/non-existent-page-404', requiresAuth: false }
];

async function authenticate(page: any) {
  await page.request.post('/api/auth/login', {
    data: { username: 'taitv', password: 'Tai@28012004' },
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  });
}

async function runComprehensiveAudit() {
  const screenshotsDir = path.resolve('../docs/screenshots/glass-after');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const auditResults: any[] = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      baseURL: 'http://localhost:5173'
    });
    const page = await context.newPage();

    // Authenticate once per context
    await authenticate(page);

    for (const p of PAGES) {
      await page.goto(p.path);
      await page.waitForTimeout(600);

      // Light mode capture
      const lightShotName = `${p.name}-${vp.name}-light.png`;
      await page.screenshot({ path: path.join(screenshotsDir, lightShotName) });

      // Measure color, saturation, brightness, contrast & computed styles
      const metrics = await page.evaluate(`(() => {
        function getRGB(colorStr) {
          const match = colorStr.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
          if (!match) return null;
          return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3]),
            a: match[4] !== undefined ? parseFloat(match[4]) : 1
          };
        }

        function getLuminance(r, g, b) {
          const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          });
          return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        }

        function getContrast(rgb1, rgb2) {
          const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
          const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
          const lighter = Math.max(l1, l2);
          const darker = Math.min(l1, l2);
          return (lighter + 0.05) / (darker + 0.05);
        }

        const surfaces = Array.from(document.querySelectorAll('.glass-surface, .glass-surface-clear, .glass-surface-dense, .glass-surface-thick, header, aside, nav, [data-testid="stat-card"], [data-testid="glass-block"]'));
        const surfaceAudits = surfaces.map((el) => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const backdrop = style.backdropFilter || style.webkitBackdropFilter || '';
          
          return {
            tag: el.tagName.toLowerCase(),
            className: el.className,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            backdropFilter: backdrop,
            opacity: style.opacity,
            hasGrayscale: backdrop.includes('grayscale') || style.filter.includes('grayscale'),
            hasLowBrightness: style.filter.includes('brightness(') && parseFloat(style.filter.split('brightness(')[1]) < 1
          };
        });

        const mainTextEls = Array.from(document.querySelectorAll('h1, h2, h3, h4, th, .tabular-nums, button, p')).slice(0, 15);
        const textContrasts = mainTextEls.map((el) => {
          const style = window.getComputedStyle(el);
          const textColor = getRGB(style.color) || { r: 44, g: 30, b: 38, a: 1 };
          const lightBg = { r: 255, g: 250, b: 252 };
          const contrastAgainstLight = getContrast(textColor, lightBg);
          return {
            tag: el.tagName.toLowerCase(),
            text: el.textContent?.trim().slice(0, 30) || '',
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            color: style.color,
            contrast: Math.round(contrastAgainstLight * 10) / 10
          };
        });

        return {
          surfaceAudits: surfaceAudits.slice(0, 8),
          textContrasts: textContrasts.slice(0, 6)
        };
      })()`);

      // Dark mode capture
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await page.waitForTimeout(300);
      const darkShotName = `${p.name}-${vp.name}-dark.png`;
      await page.screenshot({ path: path.join(screenshotsDir, darkShotName) });
      await page.evaluate(() => document.documentElement.classList.remove('dark'));

      auditResults.push({
        page: p.name,
        viewport: vp.name,
        metrics
      });
    }

    // Capture Interactive Overlays (Drawer, BottomSheet, Dialog, Settings tabs) on representative viewport
    if (vp.name === 'desktop-1366') {
      // 1. Transactions Add/Edit DetailDrawer
      await page.goto('/transactions');
      await page.waitForTimeout(400);
      const addBtn = page.locator('button:has-text("Thêm giao dịch")');
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(screenshotsDir, `overlay-detail-drawer-desktop-1366-light.png`) });
        await page.evaluate(() => document.documentElement.classList.add('dark'));
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(screenshotsDir, `overlay-detail-drawer-desktop-1366-dark.png`) });
        await page.evaluate(() => document.documentElement.classList.remove('dark'));
        const closeBtn = page.locator('button[aria-label="Đóng ngăn kéo"]').first();
        if (await closeBtn.isVisible()) await closeBtn.click();
      }

      // 2. Settings Tabs (Profile, Password, Cards, Preferences)
      await page.goto('/settings');
      await page.waitForTimeout(400);
      const tabs = ['Hồ sơ', 'Mật khẩu', 'Thẻ & Ngân hàng', 'Giao diện'];
      for (const t of tabs) {
        const tabBtn = page.locator(`button:has-text("${t}")`);
        if (await tabBtn.isVisible()) {
          await tabBtn.click();
          await page.waitForTimeout(300);
          const safeTabName = t.toLowerCase().replace(/[^a-z0-9]/g, '-');
          await page.screenshot({ path: path.join(screenshotsDir, `settings-tab-${safeTabName}-desktop-1366-light.png`) });
        }
      }
    }

    if (vp.name === 'mobile-iphone') {
      // 3. Transactions Filter BottomSheet on mobile
      await page.goto('/transactions');
      await page.waitForTimeout(400);
      const filterBtn = page.locator('button:has-text("Bộ lọc")');
      if (await filterBtn.isVisible()) {
        await filterBtn.click();
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(screenshotsDir, `overlay-bottomsheet-filter-mobile-iphone-light.png`) });
        await page.evaluate(() => document.documentElement.classList.add('dark'));
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(screenshotsDir, `overlay-bottomsheet-filter-mobile-iphone-dark.png`) });
        await page.evaluate(() => document.documentElement.classList.remove('dark'));
      }
    }

    await context.close();
  }

  await browser.close();

  fs.writeFileSync(
    path.resolve('../docs/glass-audit-data-after.json'),
    JSON.stringify(auditResults, null, 2)
  );

  console.log('COMPREHENSIVE_AUDIT_CAPTURED_SUCCESSFULLY');
}

runComprehensiveAudit().catch(console.error);
