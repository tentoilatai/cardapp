import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '360x740', width: 360, height: 740 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '844x390', width: 844, height: 390 }, // landscape
];

const PAGES = [
  { url: '/login', name: 'login', auth: false },
  { url: '/', name: 'overview', auth: true },
  { url: '/cards', name: 'cards', auth: true },
  { url: '/transactions', name: 'transactions', auth: true },
  { url: '/monthly-view', name: 'monthly-view', auth: true },
  { url: '/cashback-rules', name: 'cashback-rules', auth: true },
  { url: '/category-codes', name: 'category-codes', auth: true },
  { url: '/card-tracking', name: 'card-tracking', auth: true },
  { url: '/settings', name: 'settings', auth: true },
  { url: '/change-password', name: 'change-password', auth: true },
  { url: '/non-existent-page', name: 'not-found', auth: true },
];

async function run() {
  const browser = await chromium.launch();
  const baseDir = path.resolve('..', 'docs', 'screenshots');
  const auditDir = path.join(baseDir, 'audit');
  fs.mkdirSync(auditDir, { recursive: true });

  // 1. Authenticate once
  const authContext = await browser.newContext();
  const page = await authContext.newPage();
  await page.request.post('http://localhost:5173/api/auth/login', {
    data: { username: 'taitv', password: 'Tai@28012004' },
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
  const storageState = await authContext.storageState();
  await authContext.close();

  // 2. Capture all pages across viewports
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: true,
      isMobile: true,
      storageState: storageState,
    });
    const p = await context.newPage();

    for (const pageItem of PAGES) {
      try {
        await p.goto(`http://localhost:5173${pageItem.url}`, { waitUntil: 'networkidle' });
        await p.waitForTimeout(300);
        const fileName = `${pageItem.name}-${vp.name}.png`;
        await p.screenshot({ path: path.join(auditDir, fileName) });
        console.log(`Saved: ${fileName}`);
      } catch (err) {
        console.error(`Error on ${pageItem.name} ${vp.name}:`, err.message);
      }
    }
    await context.close();
  }

  // 3. Capture specific states on 390x844
  const stateContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    storageState: storageState,
  });
  const sp = await stateContext.newPage();

  // State A: Transactions Drawer
  try {
    await sp.goto('http://localhost:5173/transactions', { waitUntil: 'networkidle' });
    await sp.waitForTimeout(300);
    const addBtn = sp.locator('[data-region="topbar"] button:has-text("Thêm giao dịch"), [data-region="topbar"] button[title*="Thêm"]').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await sp.waitForSelector('[data-testid="detail-drawer"]');
      await sp.waitForTimeout(300);
      await sp.screenshot({ path: path.join(auditDir, 'state-drawer-390x844.png') });
      console.log('Saved: state-drawer-390x844.png');
    }
  } catch (err) {
    console.error('Error capturing drawer state:', err.message);
  }

  // State B: Transactions Filter BottomSheet
  try {
    await sp.goto('http://localhost:5173/transactions', { waitUntil: 'networkidle' });
    await sp.waitForTimeout(300);
    const filterBtn = sp.locator('[data-testid="transactions-filter-btn"]');
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await sp.waitForSelector('[data-testid="transactions-filter-sheet"]');
      await sp.waitForTimeout(300);
      await sp.screenshot({ path: path.join(auditDir, 'state-filter-sheet-390x844.png') });
      console.log('Saved: state-filter-sheet-390x844.png');
    }
  } catch (err) {
    console.error('Error capturing filter sheet state:', err.message);
  }

  // State C: Confirm Dialog (Delete)
  try {
    await sp.goto('http://localhost:5173/cards', { waitUntil: 'networkidle' });
    await sp.waitForTimeout(300);
    // Find delete button on first card or table row
    const deleteBtn = sp.locator('button[title*="Xóa"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await sp.waitForTimeout(300);
      await sp.screenshot({ path: path.join(auditDir, 'state-dialog-confirm-390x844.png') });
      console.log('Saved: state-dialog-confirm-390x844.png');
    }
  } catch (err) {
    console.error('Error capturing confirm dialog state:', err.message);
  }

  // State D: "Khác" More BottomSheet
  try {
    await sp.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await sp.waitForTimeout(300);
    const moreBtn = sp.locator('[data-testid="bottom-nav-more"]');
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await sp.waitForSelector('[data-testid="bottom-nav-sheet"]');
      await sp.waitForTimeout(300);
      await sp.screenshot({ path: path.join(auditDir, 'state-bottom-nav-more-390x844.png') });
      console.log('Saved: state-bottom-nav-more-390x844.png');
    }
  } catch (err) {
    console.error('Error capturing more bottom sheet state:', err.message);
  }

  await stateContext.close();
  await browser.close();
  console.log('Mobile audit screenshots completed successfully.');
}

run().catch(console.error);
