import { chromium } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

async function generateAllPngIcons() {
  const svgPath = path.resolve('public/icon.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf-8');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const sizes = [
    { name: 'icon-512.png', width: 512, height: 512 },
    { name: 'icon-192.png', width: 192, height: 192 },
    { name: 'icon-144.png', width: 144, height: 144 },
    { name: 'icon-96.png', width: 96, height: 96 },
    { name: 'icon-72.png', width: 72, height: 72 },
    { name: 'icon-48.png', width: 48, height: 48 },
    { name: 'apple-touch-icon.png', width: 180, height: 180 },
    { name: 'favicon.png', width: 64, height: 64 }
  ];

  for (const s of sizes) {
    await page.setViewportSize({ width: s.width, height: s.height });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: ${s.width}px; height: ${s.height}px; background: transparent; overflow: hidden; }
            svg { width: 100%; height: 100%; display: block; }
          </style>
        </head>
        <body>
          ${svgContent}
        </body>
      </html>
    `);

    const outPath = path.resolve('public', s.name);
    await page.screenshot({ path: outPath, omitBackground: true });
    console.log(`Generated: ${s.name} (${s.width}x${s.height})`);
  }

  await browser.close();
  console.log('ALL_ICONS_GENERATED_SUCCESSFULLY');
}

generateAllPngIcons().catch(console.error);
