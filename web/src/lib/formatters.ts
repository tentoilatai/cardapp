/**
 * Các hàm định dạng hiển thị chuẩn Tiếng Việt (locale vi-VN)
 */

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatCompactCurrency(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount) || amount === 0) return '0 ₫';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) {
    const val = (amount / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
    return `${val} tỷ ₫`;
  }
  if (abs >= 1_000_000) {
    const val = (amount / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
    return `${val} triệu ₫`;
  }
  if (abs >= 1_000) {
    const val = (amount / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 0 });
    return `${val} nghìn ₫`;
  }
  return formatCurrency(amount);
}

export function formatNumber(num: number | null | undefined): string {
  if (num == null || isNaN(num)) return '0';
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function formatRate(rate: number | null | undefined): string {
  if (rate == null || isNaN(rate)) return '0%';
  const pct = rate * 100;
  const formatted = pct.toLocaleString('vi-VN', {
    maximumFractionDigits: 1,
    minimumFractionDigits: pct % 1 === 0 ? 0 : 1
  });
  return `${formatted}%`;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return dateString;
  }
}

export function formatMonthLabel(monthKey: number): string {
  const yr = Math.floor(monthKey / 100);
  const mo = monthKey % 100;
  return `Tháng ${String(mo).padStart(2, '0')}/${yr}`;
}

export function formatMonthKey(monthKey: number): string {
  return formatMonthLabel(monthKey);
}

export function parseMonthKey(monthKey: number): { year: number; month: number } {
  return {
    year: Math.floor(monthKey / 100),
    month: monthKey % 100
  };
}

export function getMonthKey(year: number, month: number): number {
  return year * 100 + month;
}

export function getCurrentMonthKey(): number {
  return 202610; // Dữ liệu mẫu tham chiếu tháng 10/2026
}

export function getMonthKeyNow(): number {
  return 202610;
}

export function getRecentMonths(count: number = 12): { key: number; label: string }[] {
  const months: { key: number; label: string }[] = [];
  let yr = 2026;
  let mo = 10;
  
  for (let i = 0; i < count; i++) {
    const key = yr * 100 + mo;
    months.unshift({
      key,
      label: `T${mo}/${yr}`
    });
    mo--;
    if (mo < 1) {
      mo = 12;
      yr--;
    }
  }
  return months;
}
