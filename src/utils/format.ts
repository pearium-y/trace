import type { Lang } from '../types';
import type { T } from '../i18n';

export function fmtDuration(min: number, t?: T): string {
  if (!t) return `${min}min`;
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

export function fmtCount(n: number): string {
  return `${n}`;
}

export const localeOf = (lang: Lang): string => (lang === 'en' ? 'en-US' : 'zh-CN');
