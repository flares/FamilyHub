import { format, differenceInDays, parseISO, isValid } from 'date-fns';

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return '—';
    return format(date, 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return '—';
    return format(date, 'MMM yyyy');
  } catch {
    return '—';
  }
}

export function getDaysToMaturity(maturityDate: string): number {
  const today = new Date();
  const maturity = parseISO(maturityDate);
  return differenceInDays(maturity, today);
}

export function getMaturityStatus(maturityDate: string): 'matured' | 'maturing' | 'active' {
  const days = getDaysToMaturity(maturityDate);
  if (days < 0) return 'matured';
  if (days <= 30) return 'maturing';
  return 'active';
}

export function formatMaturityCountdown(maturityDate: string): string {
  const days = getDaysToMaturity(maturityDate);
  if (days < 0) return `Matured ${Math.abs(days)} days ago`;
  if (days === 0) return 'Matures today';
  return `Matures in ${days} days`;
}

export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function nowISO(): string {
  return new Date().toISOString();
}
