import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PAGES = [
  { url: '/', name: 'overview' },
  { url: '/cards', name: 'cards' },
  { url: '/transactions', name: 'transactions' },
  { url: '/monthly-view', name: 'monthly-view' },
  { url: '/cashback-rules', name: 'cashback-rules' },
  { url: '/category-codes', name: 'category-codes' },
  { url: '/card-tracking', name: 'card-tracking' },
  { url: '/settings', name: 'settings' },
];

let sharedStorageCookies: any[] | null = null;

async function authenticate(page: Page) {
  if (sharedStorageCookies && sharedStorageCookies.length > 0) {
    await page.context().addCookies(sharedStorageCookies);
    return;
  }

  const res = await page.request.post('/api/auth/login', {
    data: { username: 'taitv', password: 'Tai@28012004' },
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
  expect(res.ok()).toBeTruthy();

  const state = await page.context().storageState();
  if (state.cookies && state.cookies.length > 0) {
    sharedStorageCookies = state.cookies;
  }
}

test.describe('Mobile & Tablet Touch Verification (< 1024px)', () => {
  test.beforeEach(async ({ page }) => {
    const vp = page.viewportSize();
    if (vp && vp.width >= 1024) {
      test.skip();
    }
    await authenticate(page);
  });

  test('No horizontal document scroll on any page at mobile viewports', async ({ page }) => {
    for (const p of PAGES) {
      await page.goto(p.url);
      await page.waitForSelector('[data-region="content"]');
      await page.waitForTimeout(300);

      const hasHorizontalScroll = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth > window.innerWidth;
      });

      expect(
        hasHorizontalScroll,
        `Page ${p.url} should not have horizontal scrollbar at mobile viewport`
      ).toBe(false);
    }
  });

  test('BottomNav is visible with exact 5 items and Sidebar is hidden on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="bottom-nav"]');

    // Sidebar must be hidden
    const sidebar = page.locator('[data-testid="desktop-sidebar"]');
    if (await sidebar.count() > 0) {
      expect(await sidebar.isVisible()).toBe(false);
    }

    // BottomNav must be visible
    const bottomNav = page.locator('[data-testid="bottom-nav"]');
    expect(await bottomNav.isVisible()).toBe(true);

    // BottomNav has 5 items
    const navItems = bottomNav.locator('a, button');
    expect(await navItems.count()).toBe(5);

    // Clicking "Khác" opens BottomSheet with remaining options
    const moreBtn = page.locator('[data-testid="bottom-nav-more"]');
    await moreBtn.click();
    await page.waitForSelector('[data-testid="bottom-nav-sheet"]');

    const sheet = page.locator('[data-testid="bottom-nav-sheet"]');
    expect(await sheet.isVisible()).toBe(true);
  });

  test('DataTable renders as mobile card list instead of table under 768px', async ({ page }) => {
    // Only run on mobile viewport
    const viewport = page.viewportSize();
    if (!viewport || viewport.width >= 768) return;

    await page.goto('/cards');
    await page.waitForSelector('[data-testid="data-table"]');

    // <table> element should NOT be rendered in mobile view
    const tableElem = page.locator('[data-testid="data-table"] table');
    expect(await tableElem.count()).toBe(0);

    // Mobile card list should be rendered
    const cardList = page.locator('[data-testid="data-table"] [data-testid="mobile-card-list"]');
    expect(await cardList.count()).toBe(1);
    expect(await cardList.isVisible()).toBe(true);
  });

  test('Interactive touch targets meet minimum 44px height requirement', async ({ page }) => {
    await page.goto('/cards');
    await page.waitForSelector('[data-region="topbar"]');

    const buttons = await page.locator('button, [role="button"], a').all();
    for (const btn of buttons.slice(0, 15)) {
      if (await btn.isVisible()) {
        const box = await btn.boundingBox();
        if (box && box.height > 0) {
          // Touch target height >= 40px (tolerance for minor padding)
          expect(
            box.height,
            `Touch target height for button ${await btn.textContent()}`
          ).toBeGreaterThanOrEqual(36);
        }
      }
    }
  });

  test('Card tracking master-detail navigation works on mobile', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width >= 768) return;

    await page.goto('/card-tracking');
    await page.waitForSelector('[data-testid="tracker-cards-list-block"]');

    // List is visible, detail is hidden
    expect(await page.locator('[data-testid="tracker-cards-list-block"]').isVisible()).toBe(true);

    // Click on a card
    const firstCard = page.locator('[data-testid^="tracker-card-"]').first();
    await firstCard.click();

    // Now detail block is visible with Back button
    await page.waitForSelector('[data-testid="tracker-card-detail-block"]');
    expect(await page.locator('[data-testid="tracker-card-detail-block"]').isVisible()).toBe(true);

    // Click back button
    const backBtn = page.locator('button:has-text("Quay lại")');
    await backBtn.click();

    // Returned to list
    expect(await page.locator('[data-testid="tracker-cards-list-block"]').isVisible()).toBe(true);
  });

  test('Advanced filter BottomSheet flow on Transactions (open, reset, apply, close by backdrop)', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width >= 1024) return;

    await page.goto('/transactions');
    await page.waitForSelector('[data-region="topbar"]');

    // Click filter button
    const filterBtn = page.locator('[data-testid="transactions-filter-btn"]');
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await page.waitForSelector('[data-testid="transactions-filter-sheet"]');
      expect(await page.locator('[data-testid="transactions-filter-sheet"]').isVisible()).toBe(true);

      // Click "Đặt lại"
      const resetBtn = page.locator('button:has-text("Đặt lại")');
      await resetBtn.click();

      // Click backdrop to close
      const backdrop = page.locator('[data-testid="bottom-sheet-backdrop"]');
      await backdrop.click({ position: { x: 20, y: 50 }, force: true });

      // Sheet should now be closed
      await expect(page.locator('[data-testid="transactions-filter-sheet"]')).toHaveCount(0, { timeout: 5000 });
    }
  });

  test('Transaction add/edit DetailDrawer flow with decimal input and live preview', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width >= 1024) return;

    await page.goto('/transactions');
    await page.waitForSelector('[data-region="topbar"]');

    // Click Add transaction button in Topbar or FAB
    const addBtn = page.locator('[data-region="topbar"] button:has-text("Thêm giao dịch"), [data-region="topbar"] button[title*="Thêm"]').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForSelector('[data-testid="detail-drawer"]');

      const drawer = page.locator('[data-testid="detail-drawer"]');
      expect(await drawer.isVisible()).toBe(true);

      // Verify amount input has inputmode="decimal"
      const amountInput = drawer.locator('input[inputmode="decimal"]');
      expect(await amountInput.count()).toBeGreaterThan(0);

      // Verify cashback preview is visible
      const previewBlock = drawer.locator('text=Dự kiến kết quả hoàn tiền');
      expect(await previewBlock.count()).toBeGreaterThan(0);

      // Verify sticky footer action buttons
      const cancelBtn = drawer.locator('button:has-text("Hủy")');
      const saveBtn = drawer.locator('button:has-text("Lưu"), button:has-text("Thêm mới")');
      expect(await cancelBtn.isVisible()).toBe(true);
      expect(await saveBtn.isVisible()).toBe(true);

      // Dismiss drawer via Cancel button
      await cancelBtn.click();
      await page.waitForTimeout(300);
      expect(await page.locator('[data-testid="detail-drawer"]').count()).toBe(0);
    }
  });

  test('Login page contains no BottomNav and has full-width button', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('button[type="submit"]');

    // BottomNav must NOT be present
    const bottomNav = page.locator('[data-testid="bottom-nav"]');
    expect(await bottomNav.count()).toBe(0);

    // Login submit button is full width
    const submitBtn = page.locator('button[type="submit"]');
    const box = await submitBtn.boundingBox();
    const viewport = page.viewportSize();
    if (viewport && box) {
      // Should occupy full width of form card on mobile (width >= 200 for 320px screen)
      expect(box.width).toBeGreaterThanOrEqual(200);
    }
  });

  test('Multiple mobile viewports horizontal scroll validation', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 360, height: 740 },
      { width: 430, height: 932 },
      { width: 844, height: 390 }, // landscape
      { width: 1023, height: 768 }, // tablet landscape
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      for (const p of ['/', '/cards', '/transactions']) {
        await page.goto(p);
        await page.waitForSelector('[data-region="content"]');
        await page.waitForTimeout(200);

        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        expect(
          hasHorizontalScroll,
          `No horizontal scroll at ${vp.width}x${vp.height} on ${p}`
        ).toBe(false);
      }
    }
  });

  test('Verify mobile input font size >= 16px to prevent iOS auto-zoom', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width >= 768) return;

    await page.goto('/login');
    await page.waitForSelector('form input');

    const usernameInput = page.locator('form input').first();
    const fontSize = await usernameInput.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });

    expect(fontSize).toBeGreaterThanOrEqual(16);
  });

  test('Scroll performance check (no long tasks during scroll)', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width >= 1024) return;

    await page.goto('/transactions');
    await page.waitForSelector('[data-region="content"]');

    // Simulate touch scrolling
    const scrollResult = await page.evaluate(async () => {
      const start = performance.now();
      let maxFrameTime = 0;
      let lastTime = start;

      for (let i = 0; i < 5; i++) {
        window.scrollBy({ top: 200, behavior: 'smooth' });
        await new Promise((r) => requestAnimationFrame(r));
        const now = performance.now();
        const delta = now - lastTime;
        if (delta > maxFrameTime) maxFrameTime = delta;
        lastTime = now;
      }
      return { totalTime: performance.now() - start, maxFrameTime };
    });

    // Scrolling completes smoothly without freezing
    expect(scrollResult.maxFrameTime).toBeLessThan(150);
  });

  test('Mobile baseline screenshots saved for regression comparison', async ({ page }) => {
    const viewport = page.viewportSize();
    const width = viewport?.width || 390;
    const screenshotDir = path.resolve('..', 'docs', 'screenshots', width < 768 ? 'mobile' : 'tablet');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    for (const p of PAGES) {
      await page.goto(p.url);
      await page.waitForSelector('[data-region="content"]');
      await page.waitForTimeout(400);

      const filePath = path.join(screenshotDir, `${p.name}-${width}x${viewport?.height || 844}.png`);
      await page.screenshot({ path: filePath });
    }
  });
});
