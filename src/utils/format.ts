import { Currency } from '../types/domain';

export function formatCurrency(amount: number, currency: Currency): string {
  const rounded = Math.round(amount);
  const formattedNumber = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formattedNumber} ${currency}`;
}

export function toCdfEquivalent(amount: number, currency: Currency, usdToCdfRate = 2850): number {
  if (currency === 'CDF') return amount;
  return amount * usdToCdfRate;
}

export function formatDateFr(isoOrDate: string): string {
  if (!isoOrDate) return '—';
  const date = new Date(isoOrDate.includes('T') ? isoOrDate : `${isoOrDate}T09:00:00`);
  if (Number.isNaN(date.getTime())) return isoOrDate;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatRelativeTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'À l’instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return formatDateFr(isoString);
}

export function getLocalIsoDate(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isValidDrcPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, '');
  return /^\+243\d{9}$/.test(cleaned) || /^0[89]\d{8}$/.test(cleaned);
}
