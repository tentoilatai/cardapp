import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const VIEWPORTS = [
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'desktop-1366', width: 1366, height: 768 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
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

async function runShapeAudit() {
  const screenshotsDir = path.resolve('../docs/screenshots/shape-before');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const allAudits: any[] = [];
  const borderRadiiSet = new Set<string>();
  const containerRadiiSet = new Set<string>();
  const controlShapes: any[] = [];
  const transformAnomalies: any[] = [];
  const subpixelAnomalies: any[] = [];
  const backdropFilterCounts: Record<string, number> = {};
  const nestedBackdropElements: any[] = [];
  const tableBackdropAnomalies: any[] = [];

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

      // Base screenshot
      const shotName = `${p.name}-${vp.name}.png`;
      await page.screenshot({ path: path.join(screenshotsDir, shotName) });

      // Run Shape & Geometry extraction
      const pageAudit = await page.evaluate(() => {
        const controls = Array.from(document.querySelectorAll('button, input, select, [role="button"], [role="tab"], .glass-badge, [data-badge="true"], [data-tab="true"], [data-chip="true"]'));
        const containers = Array.from(document.querySelectorAll('.glass-surface-clear, .glass-surface, .glass-surface-thick, .glass-surface-dense, .glass-block, [data-role="glass-block"], [data-role="stat-card"], [role="dialog"], [data-role="detail-drawer"], [data-role="bottom-sheet"]'));
        const allElements = Array.from(document.querySelectorAll('*'));

        const controlMetrics = [];
        for (const el of controls) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          const style = window.getComputedStyle(el);
          const tl = parseFloat(style.borderTopLeftRadius) || 0;
          const isCapsule = tl >= Math.min(rect.width, rect.height) / 2 - 2;
          const isCircle = Math.abs(rect.width - rect.height) <= 2 && isCapsule;

          controlMetrics.push({
            tag: el.tagName.toLowerCase(),
            role: el.getAttribute('role') || el.getAttribute('data-role') || '',
            text: el.textContent?.trim().slice(0, 20) || '',
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10,
            x: Math.round(rect.x * 10) / 10,
            y: Math.round(rect.y * 10) / 10,
            borderRadius: style.borderRadius,
            isCapsule,
            isCircle,
            boxShadow: style.boxShadow,
            backdropFilter: style.backdropFilter || (style as any).webkitBackdropFilter || 'none',
          });
        }

        const containerMetrics = [];
        for (const el of containers) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          const style = window.getComputedStyle(el);
          containerMetrics.push({
            tag: el.tagName.toLowerCase(),
            role: el.getAttribute('role') || el.getAttribute('data-role') || el.className,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            x: Math.round(rect.x * 10) / 10,
            y: Math.round(rect.y * 10) / 10,
            borderRadius: style.borderRadius,
            backdropFilter: style.backdropFilter || (style as any).webkitBackdropFilter || 'none',
            boxShadow: style.boxShadow,
          });
        }

        // Check for backdrop-filter elements and nested backdrop-filters
        const backdropElements = [];
        for (const el of allElements) {
          const style = window.getComputedStyle(el);
          const bf = style.backdropFilter || (style as any).webkitBackdropFilter;
          if (bf && bf !== 'none') {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              // Check if ancestor also has backdrop-filter
              let parent = el.parentElement;
              let hasBackdropAncestor = false;
              while (parent) {
                const pStyle = window.getComputedStyle(parent);
                const pBf = pStyle.backdropFilter || (pStyle as any).webkitBackdropFilter;
                if (pBf && pBf !== 'none') {
                  hasBackdropAncestor = true;
                  break;
                }
                parent = parent.parentElement;
              }

              const isTableRelated = el.matches('table, tbody, tr, td, th');
              backdropElements.push({
                tag: el.tagName.toLowerCase(),
                className: el.className ? String(el.className).slice(0, 30) : '',
                hasBackdropAncestor,
                isTableRelated,
                rect: { width: Math.round(rect.width), height: Math.round(rect.height) }
              });
            }
          }
        }

        // Transforms and subpixel coordinates
        const transformElements = [];
        for (const el of allElements) {
          const style = window.getComputedStyle(el);
          const tr = style.transform;
          if (tr && tr !== 'none') {
            if (tr.includes('matrix') || tr.includes('rotate') || tr.includes('skew')) {
              const isSpinner = el.classList.contains('animate-spin') || el.closest('.animate-spin');
              const isArrow = el.querySelector('svg') || el.tagName.toLowerCase() === 'svg' || el.tagName.toLowerCase() === 'path';
              transformElements.push({
                tag: el.tagName.toLowerCase(),
                className: el.className ? String(el.className).slice(0, 30) : '',
                transform: tr,
                isAllowed: Boolean(isSpinner || isArrow)
              });
            }
          }
        }

        return { controlMetrics, containerMetrics, backdropElements, transformElements };
      });

      const key = `${p.name}@${vp.name}`;
      backdropFilterCounts[key] = pageAudit.backdropElements.length;

      pageAudit.controlMetrics.forEach((c: any) => {
        borderRadiiSet.add(c.borderRadius);
        if (!c.isCapsule && c.tag !== 'textarea' && c.tag !== 'input[type="checkbox"]') {
          controlShapes.push({ page: p.name, vp: vp.name, control: c });
        }
        if (c.x % 1 !== 0 || c.y % 1 !== 0) {
          subpixelAnomalies.push({ page: p.name, vp: vp.name, item: c });
        }
      });

      pageAudit.containerMetrics.forEach((ct: any) => {
        containerRadiiSet.add(ct.borderRadius);
      });

      pageAudit.backdropElements.forEach((b: any) => {
        if (b.hasBackdropAncestor) {
          nestedBackdropElements.push({ page: p.name, vp: vp.name, element: b });
        }
        if (b.isTableRelated) {
          tableBackdropAnomalies.push({ page: p.name, vp: vp.name, element: b });
        }
      });

      pageAudit.transformElements.forEach((t: any) => {
        if (!t.isAllowed) {
          transformAnomalies.push({ page: p.name, vp: vp.name, transform: t });
        }
      });

      allAudits.push({ page: p.name, viewport: vp.name, audit: pageAudit });

      // Check interactive sub-states if on specific pages
      if (p.name === 'cards') {
        const addBtn = page.locator('button:has-text("Thêm thẻ")');
        if (await addBtn.count() > 0) {
          await addBtn.first().click();
          await page.waitForTimeout(300);
          await page.screenshot({ path: path.join(screenshotsDir, `cards-drawer-${vp.name}.png`) });
          const closeBtn = page.locator('button[aria-label="Đóng"], button:has-text("Hủy")');
          if (await closeBtn.count() > 0) await closeBtn.first().click();
          await page.waitForTimeout(200);
        }
      }

      if (p.name === 'transactions') {
        const addTxBtn = page.locator('button:has-text("Thêm giao dịch")');
        if (await addTxBtn.count() > 0) {
          await addTxBtn.first().click();
          await page.waitForTimeout(300);
          await page.screenshot({ path: path.join(screenshotsDir, `transactions-drawer-${vp.name}.png`) });
          const closeBtn = page.locator('button[aria-label="Đóng"], button:has-text("Hủy")');
          if (await closeBtn.count() > 0) await closeBtn.first().click();
          await page.waitForTimeout(200);
        }
      }

      if (p.name === 'settings') {
        const tabs = ['Bảo mật', 'Giao diện', 'Dữ liệu'];
        for (const tabText of tabs) {
          const tabEl = page.locator(`button:has-text("${tabText}")`);
          if (await tabEl.count() > 0) {
            await tabEl.first().click();
            await page.waitForTimeout(200);
            await page.screenshot({ path: path.join(screenshotsDir, `settings-${tabText}-${vp.name}.png`) });
          }
        }
      }

      if (vp.name.startsWith('mobile') && p.name === 'overview') {
        const moreBtn = page.locator('button:has-text("Khác")');
        if (await moreBtn.count() > 0) {
          await moreBtn.first().click();
          await page.waitForTimeout(300);
          await page.screenshot({ path: path.join(screenshotsDir, `mobile-more-sheet-${vp.name}.png`) });
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);
        }
      }
    }

    await context.close();
  }

  await browser.close();

  const report = {
    distinctBorderRadii: Array.from(borderRadiiSet),
    distinctContainerRadii: Array.from(containerRadiiSet),
    nonCapsuleControlsCount: controlShapes.length,
    subpixelAnomaliesCount: subpixelAnomalies.length,
    nestedBackdropCount: nestedBackdropElements.length,
    tableBackdropCount: tableBackdropAnomalies.length,
    transformAnomaliesCount: transformAnomalies.length,
    backdropFilterPerScreen: backdropFilterCounts,
    samples: {
      controlShapes: controlShapes.slice(0, 20),
      nestedBackdrops: nestedBackdropElements.slice(0, 15),
      tableBackdrops: tableBackdropAnomalies.slice(0, 15),
      subpixel: subpixelAnomalies.slice(0, 15),
      transforms: transformAnomalies.slice(0, 15),
    }
  };

  fs.writeFileSync(path.resolve('../docs/shape-audit-baseline.json'), JSON.stringify(report, null, 2));
  console.log('SHAPE_AUDIT_BASELINE_DONE:', JSON.stringify({
    distinctBorderRadiiCount: borderRadiiSet.size,
    nonCapsuleControlsCount: controlShapes.length,
    nestedBackdropCount: nestedBackdropElements.length,
    tableBackdropCount: tableBackdropAnomalies.length,
    subpixelAnomaliesCount: subpixelAnomalies.length,
    transformAnomaliesCount: transformAnomalies.length,
  }, null, 2));
}

runShapeAudit().catch(console.error);
