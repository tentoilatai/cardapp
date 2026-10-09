import { describe, it, expect } from 'vitest';
import { 
  formatCurrency, 
  formatRate, 
  formatDate, 
  formatMonthLabel, 
  parseMonthKey, 
  getMonthKey, 
  getRecentMonths 
} from '../lib/formatters';
import { formatThousands, parseRawNumber } from '../components/glass/GlassCurrencyInput';

describe('Formatters Utilities', () => {
  it('formats currency in VND correctly', () => {
    const formatted = formatCurrency(1500000);
    // Should format with VND symbol and dot separators (or non-breaking space depending on locale)
    expect(formatted).toContain('1.500.000');
    expect(formatCurrency(0)).toContain('0');
    expect(formatCurrency(null)).toContain('0');
  });

  it('formats cashback rates correctly', () => {
    expect(formatRate(0.15)).toBe('15%');
    expect(formatRate(0.05)).toBe('5%');
    expect(formatRate(0.075)).toBe('7,5%');
    expect(formatRate(0)).toBe('0%');
    expect(formatRate(null)).toBe('0%');
  });

  it('formats date to dd/MM/yyyy', () => {
    expect(formatDate('2026-10-15T14:30:00')).toBe('15/10/2026');
    expect(formatDate('2026-05-01')).toBe('01/05/2026');
    expect(formatDate(null)).toBe('');
  });

  it('formats month labels and parses month keys', () => {
    expect(formatMonthLabel(202610)).toBe('Tháng 10/2026');
    expect(formatMonthLabel(202601)).toBe('Tháng 01/2026');
    
    const parsed = parseMonthKey(202610);
    expect(parsed.year).toBe(2026);
    expect(parsed.month).toBe(10);

    expect(getMonthKey(2026, 10)).toBe(202610);
  });

  it('formats thousands separator and parses raw numeric strings', () => {
    expect(formatThousands('1500000')).toBe('1.500.000');
    expect(formatThousands('100000000')).toBe('100.000.000');
    expect(formatThousands('500')).toBe('500');
    expect(formatThousands('')).toBe('');
    
    expect(parseRawNumber('1.500.000 ₫')).toBe('1500000');
    expect(parseRawNumber('1,500,000')).toBe('1500000');
  });

  it('generates 12 recent months sequence', () => {
    const months = getRecentMonths(12);
    expect(months.length).toBe(12);
    expect(months[months.length - 1].key).toBe(202610);
    expect(months[months.length - 1].label).toBe('T10/2026');
  });
});
