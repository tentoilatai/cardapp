import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Bài kiểm tra Vitest quét mã nguồn giao diện người dùng (/web/src/pages và /web/src/components/layout).
 * Đảm bảo 100% tiếng Việt, không còn chuỗi tiếng Anh hiển thị cho người dùng (user-facing text).
 */
describe('Quét chuỗi tiếng Anh trong giao diện (i18n UI Scanner)', () => {
  // Danh sách từ cấm hiển thị cho người dùng theo yêu cầu mục 1
  const forbiddenKeywords: string[] = [
    'Dashboard',
    'Cashback',
    'Save',
    'Cancel',
    'Loading',
    'Submit',
    'Search',
    'Settings',
    'Status',
    'Amount',
    'Cap',
    'Rule',
    'Category',
    'Utilization',
    'Available'
  ];

  const targetDirs: string[] = [
    path.resolve(__dirname, '../pages'),
    path.resolve(__dirname, '../components/layout')
  ];

  function getAllFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        getAllFiles(filePath, fileList);
      } else if (filePath.endsWith('.tsx')) {
        fileList.push(filePath);
      }
    }
    return fileList;
  }

  it('không chứa từ tiếng Anh cấm trong nhãn hiển thị hoặc JSX text của người dùng', () => {
    const allFiles: string[] = [];
    for (const dir of targetDirs) {
      getAllFiles(dir, allFiles);
    }

    const violations: { file: string; keyword: string; line: number; text: string }[] = [];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line: string, index: number) => {
        const trimmed = line.trim();
        
        // Bỏ qua dòng import, comment, hoặc định nghĩa kiểu/API endpoint
        if (
          trimmed.startsWith('import ') ||
          trimmed.startsWith('//') ||
          trimmed.startsWith('/*') ||
          trimmed.startsWith('*') ||
          trimmed.includes('api.get') ||
          trimmed.includes('api.post') ||
          trimmed.includes('api.put') ||
          trimmed.includes('api.delete') ||
          trimmed.includes('queryKey:') ||
          trimmed.includes('type="submit"') ||
          trimmed.includes('type="category"') ||
          trimmed.includes('type="date"') ||
          trimmed.includes('type="number"') ||
          trimmed.includes('case \'category\':') ||
          trimmed.includes('params.append(') ||
          trimmed.includes('useState<') ||
          trimmed.includes('useState(') ||
          trimmed.includes('vi.dashboard.') ||
          trimmed.includes('vi.settings.') ||
          trimmed.includes('vi.month.') ||
          trimmed.includes('vi.rules.') ||
          trimmed.includes('vi.cards.') ||
          trimmed.includes('vi.transactions.') ||
          trimmed.includes('vi.mcc.') ||
          trimmed.includes('vi.tracker.') ||
          trimmed.includes('vi.login.') ||
          trimmed.includes('vi.common.') ||
          trimmed.includes('vi.nav.') ||
          trimmed.includes('vi.errors.') ||
          trimmed.includes('mapCardStatus(') ||
          trimmed.includes('mapTransactionStatus(') ||
          trimmed.includes('mapCashbackStatus(') ||
          trimmed.includes('mapPaymentStatus(') ||
          trimmed.includes('mapUtilizationLevel(') ||
          trimmed.includes('tx.category') ||
          trimmed.includes('item.category') ||
          trimmed.includes('rule.category')
        ) {
          return;
        }

        // Quét các từ cấm xuất hiện trong văn bản trực tiếp
        for (const word of forbiddenKeywords) {
          const textNodeRegex = new RegExp(`>([^<]*\\b${word}\\b[^<]*)<`, 'i');
          const attrRegex = new RegExp(`(label|title|placeholder|subtitle|description)=["'\`][^"'\`]*\\b${word}\\b[^"'\`]*["'\`]`, 'i');
          const optionLabelRegex = new RegExp(`label:\\s*["'\`][^"'\`]*\\b${word}\\b[^"'\`]*["'\`]`, 'i');

          if (textNodeRegex.test(trimmed) || attrRegex.test(trimmed) || optionLabelRegex.test(trimmed)) {
            violations.push({
              file: path.basename(file),
              keyword: word,
              line: index + 1,
              text: trimmed
            });
          }
        }
      });
    }

    if (violations.length > 0) {
      console.error('Các chuỗi tiếng Anh còn sót trong giao diện:', violations);
    }

    expect(violations).toEqual([]);
  });
});
