import { chromium } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

async function generateAndroidAssets() {
  const svgPath = path.resolve('public/icon.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf-8');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const resBase = path.resolve('android/app/src/main/res');

  const densities = [
    { dir: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 }
  ];

  for (const d of densities) {
    const targetDir = path.join(resBase, d.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 1. Standard Square / Squircle Icon
    await page.setViewportSize({ width: d.iconSize, height: d.iconSize });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: ${d.iconSize}px; height: ${d.iconSize}px; background: transparent; overflow: hidden; }
            svg { width: 100%; height: 100%; display: block; }
          </style>
        </head>
        <body>
          ${svgContent}
        </body>
      </html>
    `);
    await page.screenshot({ path: path.join(targetDir, 'ic_launcher.png'), omitBackground: true });

    // 2. Round Icon (circular clip)
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: ${d.iconSize}px; height: ${d.iconSize}px; background: transparent; overflow: hidden; }
            .circle-wrap { width: 100%; height: 100%; border-radius: 50%; overflow: hidden; }
            svg { width: 100%; height: 100%; display: block; }
          </style>
        </head>
        <body>
          <div class="circle-wrap">
            ${svgContent}
          </div>
        </body>
      </html>
    `);
    await page.screenshot({ path: path.join(targetDir, 'ic_launcher_round.png'), omitBackground: true });

    // 3. Foreground Icon for Adaptive Icons
    await page.setViewportSize({ width: d.fgSize, height: d.fgSize });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: ${d.fgSize}px; height: ${d.fgSize}px; background: transparent; overflow: hidden; display: flex; align-items: center; justify-content: center; }
            svg { width: 75%; height: 75%; display: block; }
          </style>
        </head>
        <body>
          ${svgContent}
        </body>
      </html>
    `);
    await page.screenshot({ path: path.join(targetDir, 'ic_launcher_foreground.png'), omitBackground: true });

    console.log(`Updated Android density: ${d.dir}`);
  }

  // 4. Update Splash screens in drawable-*
  const splashDensities = [
    { dir: 'drawable', width: 480, height: 800 },
    { dir: 'drawable-land-mdpi', width: 480, height: 320 },
    { dir: 'drawable-land-hdpi', width: 800, height: 480 },
    { dir: 'drawable-land-xhdpi', width: 1280, height: 720 },
    { dir: 'drawable-land-xxhdpi', width: 1600, height: 960 },
    { dir: 'drawable-land-xxxhdpi', width: 1920, height: 1280 },
    { dir: 'drawable-port-mdpi', width: 320, height: 480 },
    { dir: 'drawable-port-hdpi', width: 480, height: 800 },
    { dir: 'drawable-port-xhdpi', width: 720, height: 1280 },
    { dir: 'drawable-port-xxhdpi', width: 960, height: 1600 },
    { dir: 'drawable-port-xxxhdpi', width: 1280, height: 1920 }
  ];

  for (const s of splashDensities) {
    const sDir = path.join(resBase, s.dir);
    if (!fs.existsSync(sDir)) {
      fs.mkdirSync(sDir, { recursive: true });
    }
    await page.setViewportSize({ width: s.width, height: s.height });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body {
              width: ${s.width}px;
              height: ${s.height}px;
              background: radial-gradient(circle at center, #2E0F26 0%, #160613 100%);
              overflow: hidden;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .logo-wrap {
              width: ${Math.min(s.width, s.height) * 0.38}px;
              height: ${Math.min(s.width, s.height) * 0.38}px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            svg { width: 100%; height: 100%; display: block; filter: drop-shadow(0 10px 25px rgba(255, 46, 147, 0.4)); }
          </style>
        </head>
        <body>
          <div class="logo-wrap">
            ${svgContent}
          </div>
        </body>
      </html>
    `);
    await page.screenshot({ path: path.join(sDir, 'splash.png') });
  }

  await browser.close();
  console.log('ALL_ANDROID_ASSETS_GENERATED_SUCCESSFULLY');
}

generateAndroidAssets().catch(console.error);
