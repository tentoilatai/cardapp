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
  { name: 'not-found', path: '/non-existent-page-404', requiresAuth: true },
];

async function authenticate(page: any) {
  try {
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(200);
    const userInput = page.locator('input[type="text"], input[name="username"]').first();
    const passInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"], button:has-text("Đăng nhập")').first();
    if (await userInput.count() > 0 && await passInput.count() > 0) {
      await userInput.fill('taitv');
      await passInput.fill('Tai@28012004');
      await submitBtn.click();
      await page.waitForTimeout(500);
    }
  } catch (e) {
    console.warn('Auth exception:', e);
  }
}

async function runShapeAuditAfter() {
  const screenshotsDir = path.resolve('../docs/screenshots/shape-after');
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
      try {
        await page.goto(p.path);
        await page.waitForTimeout(250);

        // Screenshot
        const shotName = `${p.name}-${vp.name}.png`;
        try {
          await page.screenshot({ path: path.join(screenshotsDir, shotName) });
        } catch (err) {}

        // Evaluate shapes and geometry
        const pageAudit = await page.evaluate(() => {
          const controls = Array.from(
            document.querySelectorAll(
              'button, input, select, [role="button"], [role="tab"], .glass-badge, [data-badge="true"], [data-tab="true"], [data-chip="true"]'
            )
          );
          const containers = Array.from(
            document.querySelectorAll(
              '.glass-surface-tier1, .glass-surface-tier2, .glass-surface-tier3, .glass-block, [data-role="glass-block"], [data-role="stat-card"], [role="dialog"], [data-role="detail-drawer"], [data-role="bottom-sheet"]'
            )
          );
          const allElements = Array.from(document.querySelectorAll('*'));

          const controlMetrics = [];
          for (const el of controls) {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            const style = window.getComputedStyle(el);
            const tl = parseFloat(style.borderTopLeftRadius) || 0;
            const isCapsule = tl >= Math.min(rect.width, rect.height) / 2 - 2 || tl >= 999;
            const isCircle = Math.abs(rect.width - rect.height) <= 2 && isCapsule;
            const isTextarea = el.tagName.toLowerCase() === 'textarea';
            const isCheckbox = (el as HTMLInputElement).type === 'checkbox';

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
              isTextarea,
              isCheckbox,
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

          const backdropElements = [];
          for (const el of allElements) {
            const style = window.getComputedStyle(el);
            const bf = style.backdropFilter || (style as any).webkitBackdropFilter;
            if (bf && bf !== 'none') {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
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

          function hasRotationOrSkew(matrixStr: string): boolean {
            const match2d = matrixStr.match(/matrix\(([^)]+)\)/);
            if (match2d) {
              const parts = match2d[1].split(',').map((s) => parseFloat(s.trim()));
              if (parts.length >= 6) {
                const [, b, c] = parts;
                return Math.abs(b) > 0.005 || Math.abs(c) > 0.005;
              }
            }
            const match3d = matrixStr.match(/matrix3d\(([^)]+)\)/);
            if (match3d) {
              const parts = match3d[1].split(',').map((s) => parseFloat(s.trim()));
              if (parts.length === 16) {
                const [, m01, m02, , m10, , , , m20] = parts;
                return Math.abs(m01) > 0.005 || Math.abs(m10) > 0.005 || Math.abs(m02) > 0.005 || Math.abs(m20) > 0.005;
              }
            }
            return matrixStr.includes('rotate') || matrixStr.includes('skew');
          }

          const transformElements = [];
          for (const el of allElements) {
            const style = window.getComputedStyle(el);
            const tr = style.transform;
            if (tr && tr !== 'none') {
              if (hasRotationOrSkew(tr)) {
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
          if (!c.isCapsule && !c.isTextarea && !c.isCheckbox) {
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
      } catch (err) {
        console.warn(`Error auditing page ${p.name} on ${vp.name}:`, err);
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

  fs.writeFileSync(path.resolve('../docs/shape-audit-after.json'), JSON.stringify(report, null, 2));
  console.log('SHAPE_AUDIT_AFTER_DONE:', JSON.stringify({
    distinctBorderRadiiCount: borderRadiiSet.size,
    nonCapsuleControlsCount: controlShapes.length,
    nestedBackdropCount: nestedBackdropElements.length,
    tableBackdropCount: tableBackdropAnomalies.length,
    subpixelAnomaliesCount: subpixelAnomalies.length,
    transformAnomaliesCount: transformAnomalies.length,
    backdropFilterPerScreenMax: Math.max(...Object.values(backdropFilterCounts)),
  }, null, 2));
}

runShapeAuditAfter().catch(console.error);
