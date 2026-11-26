import dayjs from 'dayjs';
import type { Lang } from '../types';

export type DateStr = string; // YYYY-MM-DD

export const today = (): DateStr => dayjs().format('YYYY-MM-DD');

const toStr = (d: dayjs.Dayjs): DateStr => d.format('YYYY-MM-DD');

export const addDays = (s: DateStr, n: number): DateStr => toStr(dayjs(s).add(n, 'day'));

/** 周一为一周之始 */
export const startOfWeek = (s: DateStr): DateStr => {
  const d = dayjs(s);
  return toStr(d.subtract((d.day() + 6) % 7, 'day'));
};

export const startOfMonth = (s: DateStr): DateStr => toStr(dayjs(s).startOf('month'));
export const endOfMonth = (s: DateStr): DateStr => toStr(dayjs(s).endOf('month'));
export const startOfYear = (s: DateStr): DateStr => toStr(dayjs(s).startOf('year'));
export const endOfYear = (s: DateStr): DateStr => toStr(dayjs(s).endOf('year'));
export const addMonths = (s: DateStr, n: number): DateStr => toStr(dayjs(s).add(n, 'month'));
export const addYears = (s: DateStr, n: number): DateStr => toStr(dayjs(s).add(n, 'year'));
export const daysInMonth = (s: DateStr): number => dayjs(s).daysInMonth();

export const yearOf = (s: DateStr): number => dayjs(s).year();
export const monthOf = (s: DateStr): number => dayjs(s).month(); // 0-11
export const dateOf = (s: DateStr): number => dayjs(s).date();
/** 0=周一 ... 6=周日 */
export const weekdayIndex = (s: DateStr): number => (dayjs(s).day() + 6) % 7;

const WEEKDAYS: Record<Lang, string[]> = {
  zh: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

const WEEKDAYS_SHORT: Record<Lang, string[]> = {
  zh: ['一', '二', '三', '四', '五', '六', '日'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
};

const MONTHS_SHORT: Record<Lang, string[]> = {
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

export const weekdaysShort = (lang: Lang): string[] => WEEKDAYS_SHORT[lang];
export const monthShort = (m: number, lang: Lang): string => MONTHS_SHORT[lang][m];

export const dateLabel = (s: DateStr, lang: Lang = 'zh'): string =>
  lang === 'en' ? `${MONTHS_SHORT.en[monthOf(s)]} ${dateOf(s)}` : `${monthOf(s) + 1}月${dateOf(s)}日`;

export const fullDateLabel = (s: DateStr, lang: Lang = 'zh'): string =>
  lang === 'en'
    ? `${MONTHS_SHORT.en[monthOf(s)]} ${dateOf(s)}, ${yearOf(s)}`
    : `${yearOf(s)}年${monthOf(s) + 1}月${dateOf(s)}日`;

export const weekdayLabel = (s: DateStr, lang: Lang = 'zh'): string => WEEKDAYS[lang][weekdayIndex(s)];

export const rangeDays = (start: DateStr, end: DateStr): DateStr[] => {
  const out: DateStr[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
};

export const relativeDayLabel = (s: DateStr, lang: Lang = 'zh'): string => {
  const t = today();
  if (s === t) return lang === 'en' ? 'Today' : '今天';
  if (s === addDays(t, -1)) return lang === 'en' ? 'Yesterday' : '昨天';
  if (s === addDays(t, -2)) return lang === 'en' ? '2 days ago' : '前天';
  return lang === 'en'
    ? `${MONTHS_SHORT.en[monthOf(s)]} ${dateOf(s)}`
    : `${dateLabel(s, lang)} ${weekdayLabel(s, lang)}`;
};
