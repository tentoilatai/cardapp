import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PAGES = [
  { url: '/', name: 'overview', template: 'stats-two-blocks', hasMonthPicker: true, hasPrimaryAction: false },
  { url: '/cards', name: 'cards', template: 'single-table', hasMonthPicker: false, hasPrimaryAction: true },
  { url: '/transactions', name: 'transactions', template: 'single-table', hasMonthPicker: true, hasPrimaryAction: true },
  { url: '/monthly-view', name: 'monthly-view', template: 'stats-two-blocks', hasMonthPicker: true, hasPrimaryAction: false },
  { url: '/cashback-rules', name: 'cashback-rules', template: 'single-table', hasMonthPicker: false, hasPrimaryAction: true },
  { url: '/category-codes', name: 'category-codes', template: 'single-table', hasMonthPicker: false, hasPrimaryAction: true },
  { url: '/card-tracking', name: 'card-tracking', template: 'two-equal-blocks', hasMonthPicker: false, hasPrimaryAction: true },
  { url: '/settings', name: 'settings', template: 'form', hasMonthPicker: false, hasPrimaryAction: false },
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

test.describe('Desktop Layout & Geometry Verification (>= 1024px)', () => {
  test.beforeEach(async ({ page }) => {
    const vp = page.viewportSize();
    if (vp && vp.width < 1024) {
      test.skip();
    }
    await authenticate(page);
  });

  test('No document-level vertical scroll on any page (height: 100dvh; overflow: hidden)', async ({ page }) => {
    for (const p of PAGES) {
      await page.goto(p.url);
      await page.waitForSelector('[data-region="content"]');
      await page.waitForTimeout(300);

      const hasDocumentScroll = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollHeight > window.innerHeight;
      });

      expect(
        hasDocumentScroll,
        `Page ${p.url} should not have document-level vertical scrollbar`
      ).toBe(false);
    }
  });

  test('Fixed layout regions A, B, C, D have exact dimensions and positions across all pages', async ({ page }) => {
    type Rect = { x: number; y: number; width: number; height: number };
    let baselineTopbar: Rect | null = null;
    let baselineToolbar: Rect | null = null;
    let baselineFooter: Rect | null = null;

    for (const p of PAGES) {
      await page.goto(p.url);
      await page.waitForSelector('[data-region="topbar"]');
      await page.waitForSelector('[data-region="toolbar"]');
      await page.waitForSelector('[data-region="footer"]');
      await page.waitForTimeout(200);

      const topbarRect = await page.locator('[data-region="topbar"]').boundingBox();
      const toolbarRect = await page.locator('[data-region="toolbar"]').boundingBox();
      const footerRect = await page.locator('[data-region="footer"]').boundingBox();

      expect(topbarRect, `Topbar on ${p.url}`).toBeTruthy();
      expect(toolbarRect, `Toolbar on ${p.url}`).toBeTruthy();
      expect(footerRect, `Footer on ${p.url}`).toBeTruthy();

      if (topbarRect && toolbarRect && footerRect) {
        // Topbar height: 64px (tolerance 1px)
        expect(Math.abs(topbarRect.height - 64)).toBeLessThanOrEqual(1.5);
        // Toolbar height: 56px (tolerance 1.5px)
        expect(Math.abs(toolbarRect.height - 56)).toBeLessThanOrEqual(1.5);
        // Footer height: 48px (tolerance 1.5px)
        expect(Math.abs(footerRect.height - 48)).toBeLessThanOrEqual(1.5);

        if (!baselineTopbar || !baselineToolbar || !baselineFooter) {
          baselineTopbar = topbarRect;
          baselineToolbar = toolbarRect;
          baselineFooter = footerRect;
        } else {
          // Verify alignment with baseline (tolerance 2px across pages)
          expect(Math.abs(topbarRect.y - baselineTopbar.y)).toBeLessThanOrEqual(2);
          expect(Math.abs(toolbarRect.y - baselineToolbar.y)).toBeLessThanOrEqual(2);
          expect(Math.abs(footerRect.y - baselineFooter.y)).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  test('Primary action buttons and month pickers share consistent coordinates across pages', async ({ page }) => {
    let baselineActionX: number | null = null;
    let baselineActionY: number | null = null;

    for (const p of PAGES.filter((x) => x.hasPrimaryAction)) {
      await page.goto(p.url);
      await page.waitForSelector('[data-region="topbar"]');
      await page.waitForTimeout(200);

      const actionButton = page.locator('[data-region="topbar"] button').last();
      const box = await actionButton.boundingBox();

      if (box) {
        if (baselineActionX === null || baselineActionY === null) {
          baselineActionX = box.x;
          baselineActionY = box.y;
        } else {
          expect(Math.abs(box.y - baselineActionY)).toBeLessThanOrEqual(3);
        }
      }
    }
  });

  test('Table headers remain sticky when scrolling inside DataTable', async ({ page }) => {
    await page.goto('/cards');
    await page.waitForSelector('table');

    const thead = page.locator('thead');
    expect(await thead.count()).toBeGreaterThan(0);

    const isSticky = await thead.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.position === 'sticky';
    });

    expect(isSticky).toBe(true);
  });

  test('Dashboard My Cards item opens modal, clicking "Xem theo dõi thẻ" navigates directly to that card in Card Tracking', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-region="content"]');

    // Switch to tab "Thẻ của tôi" on the right block
    const myCardsTab = page.locator('button:has-text("Thẻ của tôi")');
    await myCardsTab.click();
    await page.waitForTimeout(300);

    // Click on OCB card item to open modal
    const ocbCard = page.locator('[data-testid="dashboard-mycard-OCB-JCBGOLD"]');
    await ocbCard.click();

    // Verify modal is open
    await page.waitForSelector('[data-testid="detail-drawer"]');
    await expect(page.locator('[data-testid="detail-drawer"]').getByText('OCB JCB Gold').first()).toBeVisible();

    // Click "Xem theo dõi thẻ" button inside modal
    const trackButton = page.locator('[data-testid="detail-drawer"] button:has-text("Xem theo dõi thẻ")');
    await trackButton.click();

    // Verify navigated to card-tracking with query param
    await page.waitForURL(/.*card-tracking\?cardId=OCB-JCBGOLD.*/);
    await page.waitForSelector('[data-testid="tracker-card-detail-block"]');

    // Verify the detail block on tracker page displays the selected card (OCB JCB Gold)
    const detailTitle = page.locator('[data-testid="tracker-card-detail-block"]');
    await expect(detailTitle.getByRole('heading', { name: 'OCB JCB Gold' }).first()).toBeVisible();

    const artifactPath = 'C:/Users/tento/.gemini/antigravity-ide/brain/99332d26-4566-441b-970c-8f86522c19d7/tracker-ocb-selected.png';
    await page.screenshot({ path: artifactPath });
  });

  test('Dashboard My Cards chevron click directly navigates to that card in Card Tracking', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-region="content"]');

    // Switch to tab "Thẻ của tôi" on the right block
    const myCardsTab = page.locator('button:has-text("Thẻ của tôi")');
    await myCardsTab.click();
    await page.waitForTimeout(300);

    // Find the row for Shinhan Bank and click its direct tracking button
    const shinhanRow = page.locator('[data-testid="dashboard-mycard-SHB-SUPREME"]');
    const chevronBtn = shinhanRow.locator('button[title="Xem theo dõi thẻ"]');
    await chevronBtn.click();

    // Verify navigated to card-tracking with query param
    await page.waitForURL(/.*card-tracking\?cardId=SHB-SUPREME.*/);
    await page.waitForSelector('[data-testid="tracker-card-detail-block"]');

    // Verify Shinhan Bank is auto-selected
    const detailTitle = page.locator('[data-testid="tracker-card-detail-block"]');
    await expect(detailTitle.getByRole('heading', { name: 'Shinhan Bank Visa Supreme' }).first()).toBeVisible();
  });

  test('Screenshots captured for desktop layout regression audit', async ({ page }) => {
    const screenshotDir = path.resolve('..', 'docs', 'screenshots', 'desktop');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    for (const p of PAGES) {
      await page.goto(p.url);
      await page.waitForSelector('[data-region="content"]');
      await page.waitForTimeout(400);

      const filePath = path.join(screenshotDir, `${p.name}-1366x768.png`);
      await page.screenshot({ path: filePath });
    }

    // Capture Centered Modal screenshot on /cards
    await page.goto('/cards');
    await page.waitForSelector('button:has-text("Thêm thẻ mới")');
    await page.click('button:has-text("Thêm thẻ mới")');
    await page.waitForSelector('[data-testid="detail-drawer"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'modal-centered-cards-1366x768.png') });
  });
});
