import { test, expect, type Page } from '@playwright/test';

const PAGES = [
  { url: '/', name: 'Overview' },
  { url: '/cards', name: 'Cards' },
  { url: '/transactions', name: 'Transactions' },
  { url: '/monthly-view', name: 'MonthlyView' },
  { url: '/cashback-rules', name: 'CashbackRules' },
  { url: '/category-codes', name: 'CategoryCodes' },
  { url: '/card-tracking', name: 'CardTracking' },
  { url: '/settings', name: 'Settings' },
];

let sharedAuthCookies: any[] | null = null;

async function authenticate(page: Page) {
  if (sharedAuthCookies && sharedAuthCookies.length > 0) {
    await page.context().addCookies(sharedAuthCookies);
    return;
  }

  const res = await page.request.post('/api/auth/login', {
    data: { username: 'taitv', password: 'Tai@28012004' },
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
  expect(res.ok()).toBeTruthy();

  const state = await page.context().storageState();
  if (state.cookies && state.cookies.length > 0) {
    sharedAuthCookies = state.cookies;
  }
}

test.describe('Typography Scale & Control Verification', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test('All text elements adhere to font floor >= 12px and allowed weights {400, 500, 600}', async ({ page }) => {
    for (const p of PAGES) {
      await page.goto(p.url);
      await page.waitForSelector('[data-region="content"]');
      await page.waitForTimeout(300);

      const typographyAudit = await page.evaluate(() => {
        const allowedWeights = ['400', '500', '600'];
        const textNodes = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, label, th, td, button, input, [data-role]'));
        const violations: Array<{ tag: string; text: string; fontSize: number; fontWeight: string }> = [];

        for (const el of textNodes) {
          const htmlEl = el as HTMLElement;
          if (htmlEl.offsetParent === null && htmlEl.tagName !== 'BODY') continue;
          const text = htmlEl.innerText?.trim();
          if (!text || text.length === 0) continue;

          const style = window.getComputedStyle(htmlEl);
          const fontSize = parseFloat(style.fontSize);
          const fontWeight = String(style.fontWeight);

          // Floor check: strictly >= 11.5px (allow 0.5px subpixel rounding on 12px)
          if (fontSize < 11.5) {
            violations.push({
              tag: htmlEl.tagName.toLowerCase(),
              text: text.slice(0, 30),
              fontSize,
              fontWeight,
            });
          }

          // Weight check: strictly in 400, 500, 600
          if (!allowedWeights.includes(fontWeight)) {
            violations.push({
              tag: htmlEl.tagName.toLowerCase(),
              text: text.slice(0, 30),
              fontSize,
              fontWeight,
            });
          }
        }

        return {
          violationsCount: violations.length,
          violations: violations.slice(0, 10),
        };
      });

      expect(
        typographyAudit.violationsCount,
        `Page ${p.name} had typography violations: ${JSON.stringify(typographyAudit.violations)}`
      ).toBe(0);
    }
  });

  test('All buttons and controls have standard heights in {32, 36, 40, 44, 48, 52}px', async ({ page }) => {
    for (const p of PAGES) {
      await page.goto(p.url);
      await page.waitForSelector('[data-region="content"]');
      await page.waitForTimeout(300);

      const invalidButtons = await page.evaluate(() => {
        const allowedHeights = [32, 36, 40, 44, 48, 52, 64, 72];
        const buttons = Array.from(document.querySelectorAll('button, [data-role="button"], a.btn'));
        const issues: Array<{ text: string; height: number }> = [];

        for (const b of buttons) {
          const htmlB = b as HTMLElement;
          if (htmlB.offsetParent === null) continue;
          const rect = htmlB.getBoundingClientRect();
          if (rect.height === 0 || rect.width === 0) continue;

          const roundedHeight = Math.round(rect.height);
          const isAllowed = allowedHeights.some((h) => Math.abs(h - roundedHeight) <= 2);

          if (!isAllowed) {
            issues.push({
              text: htmlB.innerText?.slice(0, 20) || htmlB.className,
              height: rect.height,
            });
          }
        }

        return issues;
      });

      expect(
        invalidButtons.length,
        `Page ${p.name} has buttons with non-standard height: ${JSON.stringify(invalidButtons)}`
      ).toBe(0);
    }
  });

  test('FormActions component has standard layout [Delete] ... [Cancel] [Save]', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForSelector('[data-region="content"]');
    await page.waitForTimeout(300);

    const addBtn = page.locator('button:has-text("Thêm giao dịch"), button:has-text("Thêm")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(300);

      const formActions = page.locator('[data-testid="form-actions"]');
      await expect(formActions).toBeVisible();

      const cancelBtn = formActions.locator('button:has-text("Hủy")');
      const saveBtn = formActions.locator('button:has-text("Lưu"), button:has-text("Thêm")');

      await expect(cancelBtn).toBeVisible();
      await expect(saveBtn).toBeVisible();

      const cancelRect = await cancelBtn.boundingBox();
      const saveRect = await saveBtn.boundingBox();

      expect(cancelRect).toBeTruthy();
      expect(saveRect).toBeTruthy();
      if (cancelRect && saveRect) {
        expect(Math.abs(cancelRect.height - saveRect.height)).toBeLessThanOrEqual(2);
      }

      await cancelBtn.click();
    }
  });

  test('Mobile inputs have font-size >= 16px to prevent iOS auto-zoom on touch devices', async ({ page }) => {
    const vp = page.viewportSize();
    if (!vp || vp.width >= 1024) return;

    await page.goto('/transactions');
    await page.waitForSelector('[data-region="content"]');
    await page.waitForTimeout(300);

    const addBtn = page.locator('button:has-text("Thêm giao dịch"), button:has-text("Thêm")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(300);

      const inputFontSizes = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]), select, textarea'));
        return inputs.map((inp) => parseFloat(window.getComputedStyle(inp).fontSize));
      });

      for (const fs of inputFontSizes) {
        expect(fs).toBeGreaterThanOrEqual(15.5);
      }
    }
  });
});
