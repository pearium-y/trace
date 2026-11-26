import type { T } from '../i18n';

export function fmtDuration(min: number, t: T): string {
  if (min <= 0) return t('durationM', { m: 0 });
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h > 0 && m > 0) return t('durationHm', { h, m });
  if (h > 0) return t('durationH', { h });
  return t('durationM', { m });
}

export function fmtPct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
