import { test, expect } from '@playwright/test';

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
    await page.goto('/login');
    await page.waitForTimeout(200);
    const userInput = page.locator('input[type="text"], input[name="username"]').first();
    const passInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"], button:has-text("Đăng nhập")').first();
    if (await userInput.count() > 0 && await passInput.count() > 0) {
      await userInput.fill('taitv');
      await passInput.fill('Tai@28012004');
      await submitBtn.click();
      await page.waitForTimeout(400);
    }
  } catch (e) {
    console.warn('Auth exception:', e);
  }
}

test.describe('Shape & Geometry Uniformity Suite', () => {
  for (const p of PAGES) {
    test(`Page ${p.name}: Control capsule shapes and container radius scale`, async ({ page }) => {
      if (p.requiresAuth) {
        await authenticate(page);
      }
      await page.goto(p.path);
      await page.waitForTimeout(300);

      const audit = await page.evaluate(() => {
        const controls = Array.from(
          document.querySelectorAll(
            'button, input, select, [role="button"], [role="tab"], .glass-badge, [data-badge="true"], [data-tab="true"], [data-chip="true"]'
          )
        );

        const nonCapsuleControls: any[] = [];
        for (const el of controls) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          const style = window.getComputedStyle(el);
          const tl = parseFloat(style.borderTopLeftRadius) || 0;
          const isTextarea = el.tagName.toLowerCase() === 'textarea';
          const isCheckbox = (el as HTMLInputElement).type === 'checkbox';

          if (isTextarea) {
            // Textarea allowed 16px (--radius-md)
            if (Math.abs(tl - 16) > 2) {
              nonCapsuleControls.push({ tag: 'textarea', radius: style.borderRadius });
            }
          } else if (isCheckbox) {
            // Checkbox allowed 6px
            if (Math.abs(tl - 6) > 2) {
              nonCapsuleControls.push({ tag: 'checkbox', radius: style.borderRadius });
            }
          } else {
            const isCapsule = tl >= Math.min(rect.width, rect.height) / 2 - 2 || tl >= 999;
            if (!isCapsule) {
              nonCapsuleControls.push({
                tag: el.tagName.toLowerCase(),
                text: el.textContent?.trim().slice(0, 20),
                width: rect.width,
                height: rect.height,
                radius: style.borderRadius,
              });
            }
          }
        }

        // Check container scale: 12, 16, 24, 32 or full
        const containers = Array.from(
          document.querySelectorAll(
            '.glass-surface-tier1, .glass-surface-tier2, .glass-surface-tier3, .glass-block, [data-role="glass-block"], [data-role="stat-card"], [role="dialog"], [data-role="detail-drawer"], [data-role="bottom-sheet"]'
          )
        );

        const invalidContainerRadii: any[] = [];
        const allowedRadii = [0, 12, 16, 24, 32, 999, 9999];

        for (const el of containers) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          const style = window.getComputedStyle(el);
          const tl = Math.round(parseFloat(style.borderTopLeftRadius) || 0);

          const isAllowed = allowedRadii.some((ar) => Math.abs(ar - tl) <= 2);
          if (!isAllowed) {
            invalidContainerRadii.push({
              className: el.className ? String(el.className).slice(0, 40) : '',
              radius: tl,
            });
          }
        }

        return { nonCapsuleControls, invalidContainerRadii };
      });

      expect(audit.nonCapsuleControls).toEqual([]);
      expect(audit.invalidContainerRadii).toEqual([]);
    });

    test(`Page ${p.name}: Surface tiering and backdrop-filter limits`, async ({ page }) => {
      if (p.requiresAuth) {
        await authenticate(page);
      }
      await page.goto(p.path);
      await page.waitForTimeout(300);

      const surfaceAudit = await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll('*'));
        const backdropElements: any[] = [];
        const nestedBackdropElements: any[] = [];
        const tableBackdrops: any[] = [];

        for (const el of allElements) {
          const style = window.getComputedStyle(el);
          const bf = style.backdropFilter || (style as any).webkitBackdropFilter;
          if (bf && bf !== 'none') {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              backdropElements.push({
                tag: el.tagName.toLowerCase(),
                className: el.className ? String(el.className).slice(0, 30) : '',
              });

              // Check nested backdrop
              let parent = el.parentElement;
              while (parent) {
                const pStyle = window.getComputedStyle(parent);
                const pBf = pStyle.backdropFilter || (pStyle as any).webkitBackdropFilter;
                if (pBf && pBf !== 'none') {
                  nestedBackdropElements.push({
                    tag: el.tagName.toLowerCase(),
                    parentTag: parent.tagName.toLowerCase(),
                  });
                  break;
                }
                parent = parent.parentElement;
              }

              // Check table body / row
              if (el.matches('table, tbody, tr, td, th')) {
                tableBackdrops.push({ tag: el.tagName.toLowerCase() });
              }
            }
          }
        }

        return {
          backdropCount: backdropElements.length,
          nestedCount: nestedBackdropElements.length,
          tableBackdropCount: tableBackdrops.length,
        };
      });

      const vp = page.viewportSize();
      const maxAllowed = (vp?.width ?? 1000) >= 768 ? 6 : 4;
      expect(surfaceAudit.backdropCount).toBeLessThanOrEqual(maxAllowed);
      expect(surfaceAudit.nestedCount).toBe(0);
      expect(surfaceAudit.tableBackdropCount).toBe(0);
    });

    test(`Page ${p.name}: Zero unauthorized skew/rotate transforms`, async ({ page }) => {
      if (p.requiresAuth) {
        await authenticate(page);
      }
      await page.goto(p.path);
      await page.waitForTimeout(300);

      const transformAudit = await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll('*'));
        const unauthorizedTransforms: any[] = [];

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
              const [, m01, m02, , m10, , , , m20] = parts;
              return Math.abs(m01) > 0.005 || Math.abs(m10) > 0.005 || Math.abs(m02) > 0.005 || Math.abs(m20) > 0.005;
          }
          return matrixStr.includes('rotate') || matrixStr.includes('skew');
        }

        for (const el of allElements) {
          const style = window.getComputedStyle(el);
          const tr = style.transform;
          if (tr && tr !== 'none') {
            if (hasRotationOrSkew(tr)) {
              const isSpinner = el.classList.contains('animate-spin') || el.closest('.animate-spin');
              const isSvg = el.querySelector('svg') || el.tagName.toLowerCase() === 'svg' || el.tagName.toLowerCase() === 'path';
              if (!isSpinner && !isSvg) {
                unauthorizedTransforms.push({
                  tag: el.tagName.toLowerCase(),
                  transform: tr,
                  className: String(el.className).slice(0, 30),
                });
              }
            }
          }
        }

        return { unauthorizedTransforms };
      });

      expect(transformAudit.unauthorizedTransforms).toEqual([]);
    });
  }
});
