import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function scanFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('dist') && !filePath.includes('coverage')) {
        scanFiles(filePath, fileList);
      }
    } else if (/\.(tsx|jsx|ts|js|css)$/.test(file) && !file.includes('.test.') && !file.includes('.spec.')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

describe('Shape & Geometry Lint Rules', () => {
  const srcDir = path.resolve(__dirname, '..');
  const files = scanFiles(srcDir);

  it('contains no forbidden hardcoded border radii outside the standard scale (6, 12, 16, 24, 32)', () => {
    // Matches rounded-[Npx] where N is not 6, 12, 16, 24, 32, 999, 9999
    const invalidRadiusRegex = /rounded-(?:t-|b-|l-|r-|tl-|tr-|bl-|br-)?\[(?!6px|12px|16px|24px|32px|999px|9999px|var\(--radius-)\d+px\]/g;
    const violations: Array<{ file: string; match: string }> = [];

    for (const f of files) {
      if (f.endsWith('tokens.css') || f.endsWith('index.css')) continue;

      const content = fs.readFileSync(f, 'utf-8');
      const matches = content.match(invalidRadiusRegex);
      if (matches) {
        for (const m of matches) {
          violations.push({
            file: path.relative(srcDir, f),
            match: m,
          });
        }
      }
    }

    expect(
      violations,
      `Found non-standard border-radius class (allowed: rounded-[6px], rounded-[12px], rounded-[16px], rounded-[24px], rounded-[32px], rounded-full): ${JSON.stringify(violations)}`
    ).toEqual([]);
  });

  it('contains no unauthorized skew or perspective-tilt transforms', () => {
    const invalidTransformRegex = /\b(skew-x|skew-y|perspective-|rotate-(?!180|90|45))\b/;
    const violations: Array<{ file: string; match: string }> = [];

    for (const f of files) {
      if (f.endsWith('tokens.css') || f.endsWith('index.css')) continue;

      const content = fs.readFileSync(f, 'utf-8');
      const match = content.match(invalidTransformRegex);
      if (match) {
        violations.push({
          file: path.relative(srcDir, f),
          match: match[0],
        });
      }
    }

    expect(
      violations,
      `Found forbidden transform class: ${JSON.stringify(violations)}`
    ).toEqual([]);
  });
});
