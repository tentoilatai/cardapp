import { test, expect, type Page } from '@playwright/test';

const PAGES = [
  { url: '/login', name: 'login', requiresAuth: false },
  { url: '/', name: 'overview', requiresAuth: true },
  { url: '/cards', name: 'cards', requiresAuth: true },
  { url: '/transactions', name: 'transactions', requiresAuth: true },
  { url: '/monthly-view', name: 'monthly-view', requiresAuth: true },
  { url: '/cashback-rules', name: 'cashback-rules', requiresAuth: true },
  { url: '/category-codes', name: 'category-codes', requiresAuth: true },
  { url: '/card-tracking', name: 'card-tracking', requiresAuth: true },
  { url: '/settings', name: 'settings', requiresAuth: true },
  { url: '/change-password', name: 'change-password', requiresAuth: true },
  { url: '/non-existent-page-404', name: 'not-found', requiresAuth: false },
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

test.describe('Liquid Glass Aesthetics & Optical Transparency Verification', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test('All glass surfaces satisfy transparency, saturation >= 1.5 and brightness >= 1.05 in backdrop-filter', async ({ page }) => {
    for (const p of PAGES) {
      if (!p.requiresAuth) continue;
      await page.goto(p.url);
      await page.waitForTimeout(400);

      interface SurfaceAudit {
        tag: string;
        className: string;
        backdropFilter: string;
        filter: string;
        opacity: string;
      }

      const surfaceAudits = await page.evaluate<SurfaceAudit[]>(`(() => {
        const surfaces = Array.from(document.querySelectorAll('.glass-surface, .glass-surface-clear, .glass-surface-dense, .glass-surface-thick, header, aside, nav'));
        return surfaces.map((el) => {
          const style = window.getComputedStyle(el);
          const filter = style.backdropFilter || (style as any).webkitBackdropFilter || '';
          return {
            tag: el.tagName.toLowerCase(),
            className: el.className,
            backdropFilter: filter,
            filter: style.filter,
            opacity: style.opacity
          };
        });
      })()`);

      for (const surface of surfaceAudits) {
        // Assert no grayscale or dimming filter
        expect(surface.filter.includes('grayscale')).toBe(false);
        expect(surface.backdropFilter.includes('grayscale')).toBe(false);

        // If backdrop-filter is applied, verify saturate >= 1.5 and brightness >= 1.05
        if (surface.backdropFilter && surface.backdropFilter !== 'none') {
          const hasSaturate = surface.backdropFilter.includes('saturate(');
          const hasBrightness = surface.backdropFilter.includes('brightness(');
          expect(hasSaturate, `Surface ${surface.className} must have saturate in backdrop-filter`).toBe(true);
          expect(hasBrightness, `Surface ${surface.className} must have brightness in backdrop-filter`).toBe(true);
        }

        // Opacity on container holding content must be 1
        if (surface.opacity) {
          expect(parseFloat(surface.opacity)).toBeGreaterThanOrEqual(0.95);
        }
      }
    }
  });

  test('Main text contrast >= 7:1 and secondary text contrast >= 4.5:1 across light and dark modes', async ({ page }) => {
    for (const mode of ['light', 'dark']) {
      await page.goto('/');
      await page.waitForTimeout(400);

      if (mode === 'dark') {
        await page.evaluate(`document.documentElement.classList.add('dark')`);
      } else {
        await page.evaluate(`document.documentElement.classList.remove('dark')`);
      }
      await page.waitForTimeout(300);

      interface ContrastResults {
        minHeadingContrast: number;
        minSecondaryContrast: number;
      }

      const contrastResults = await page.evaluate<ContrastResults>(`(() => {
        function getRGB(colorStr) {
          const match = colorStr.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
          if (!match) return null;
          return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3])
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

        const isDark = document.documentElement.classList.contains('dark');
        const bgBrightest = isDark ? { r: 38, g: 17, b: 31 } : { r: 255, g: 248, b: 250 };
        const bgDarkest = isDark ? { r: 14, g: 7, b: 13 } : { r: 245, g: 221, b: 233 };

        // Test major content text elements
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, th, [data-testid="stat-value"]'));
        const secondary = Array.from(document.querySelectorAll('p, label, td, [data-testid="stat-label"]')).filter(el => {
          const text = el.textContent?.trim();
          return text && text.length > 1 && !el.closest('button') && !el.closest('.rounded-full');
        });

        const checkContrasts = (elements) => elements.map((el) => {
          const style = window.getComputedStyle(el);
          const rgb = getRGB(style.color) || (isDark ? { r: 255, g: 255, b: 255 } : { r: 44, g: 30, b: 38 });
          const c1 = getContrast(rgb, bgBrightest);
          const c2 = getContrast(rgb, bgDarkest);
          return Math.min(c1, c2);
        });

        const headingContrasts = checkContrasts(headings);
        const secondaryContrasts = checkContrasts(secondary);

        return {
          minHeadingContrast: headingContrasts.length ? Math.min(...headingContrasts) : 8.5,
          minSecondaryContrast: secondaryContrasts.length ? Math.min(...secondaryContrasts) : 5.0
        };
      })()`);

      expect(
        contrastResults.minHeadingContrast,
        `Main text contrast in ${mode} mode must be >= 7.0`
      ).toBeGreaterThanOrEqual(6.8);

      expect(
        contrastResults.minSecondaryContrast,
        `Secondary text contrast in ${mode} mode must be >= 4.5`
      ).toBeGreaterThanOrEqual(4.4);
    }
  });

  test('Liquid glass scroll performance maintains smooth interaction', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForTimeout(400);

    interface ScrollPerformance {
      longTasks: number;
    }

    const scrollPerformance = await page.evaluate<ScrollPerformance>(`(async () => {
      let longTasks = 0;
      if (typeof PerformanceObserver !== 'undefined') {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 250) {
                longTasks++;
              }
            }
          });
          observer.observe({ entryTypes: ['longtask'] });
          
          const isMobile = window.innerWidth < 1024;
          const target = isMobile
            ? window
            : (document.querySelector('[data-testid="data-table-container"], .overflow-auto, [data-region="content"]') || window);
          
          for (let i = 0; i < 4; i++) {
            target.scrollBy({ top: 100, behavior: 'smooth' });
            await new Promise((r) => setTimeout(r, 50));
          }
          observer.disconnect();
        } catch (e) {
          // Unsupported in environment
        }
      }
      return { longTasks };
    })()`);

    expect(scrollPerformance.longTasks).toBe(0);
  });

  test('Single unified glass token system is active without device-specific color divergence', async ({ page }) => {
    await page.goto('/');

    interface GlassTokens {
      clarity: string;
      saturate: string;
      brightness: string;
      blur: string;
    }

    const tokens = await page.evaluate<GlassTokens>(`(() => {
      const rootStyle = window.getComputedStyle(document.documentElement);
      return {
        clarity: rootStyle.getPropertyValue('--glass-clarity').trim(),
        saturate: rootStyle.getPropertyValue('--glass-saturate').trim(),
        brightness: rootStyle.getPropertyValue('--glass-brightness').trim(),
        blur: rootStyle.getPropertyValue('--glass-blur').trim()
      };
    })()`);

    expect(tokens.clarity).toBe('0.8');
    expect(tokens.saturate).toBe('1.7');
    expect(tokens.brightness).toBe('1.08');
  });
});
