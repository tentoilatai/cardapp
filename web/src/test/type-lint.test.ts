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

describe('Typography & Token Lint Rules', () => {
  const srcDir = path.resolve(__dirname, '..');
  const files = scanFiles(srcDir);

  it('contains no sub-12px hardcoded font sizes (text-[10px], text-[11px], etc.)', () => {
    const invalidSizeRegex = /text-\[(10|11|9|8|7)px\]/;
    const violations: Array<{ file: string; match: string }> = [];

    for (const f of files) {
      const content = fs.readFileSync(f, 'utf-8');
      const match = content.match(invalidSizeRegex);
      if (match) {
        violations.push({
          file: path.relative(srcDir, f),
          match: match[0],
        });
      }
    }

    expect(
      violations,
      `Found hardcoded sub-12px font size in: ${JSON.stringify(violations)}`
    ).toEqual([]);
  });

  it('contains only permitted font weights (400, 500, 600) and no font-bold / font-black', () => {
    const invalidWeightRegex = /\b(font-bold|font-black|font-extrabold|font-thin|font-extralight|font-light)\b/;
    const violations: Array<{ file: string; match: string }> = [];

    for (const f of files) {
      // Exclude tokens.css and index.css base font declarations
      if (f.endsWith('tokens.css') || f.endsWith('index.css')) continue;

      const content = fs.readFileSync(f, 'utf-8');
      const match = content.match(invalidWeightRegex);
      if (match) {
        violations.push({
          file: path.relative(srcDir, f),
          match: match[0],
        });
      }
    }

    expect(
      violations,
      `Found non-standard font weight class (use font-normal, font-medium, or font-semibold): ${JSON.stringify(violations)}`
    ).toEqual([]);
  });
});
