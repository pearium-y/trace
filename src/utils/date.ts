import dayjs from 'dayjs';

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

export const WEEKDAY_FULL = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export const dateLabel = (s: DateStr): string => `${monthOf(s) + 1}月${dateOf(s)}日`;
export const fullDateLabel = (s: DateStr): string => `${yearOf(s)}年${monthOf(s) + 1}月${dateOf(s)}日`;
export const weekdayLabel = (s: DateStr): string => WEEKDAY_FULL[weekdayIndex(s)];

export const rangeDays = (start: DateStr, end: DateStr): DateStr[] => {
  const out: DateStr[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
};

export const relativeDayLabel = (s: DateStr): string => {
  const t = today();
  if (s === t) return '今天';
  if (s === addDays(t, -1)) return '昨天';
  if (s === addDays(t, -2)) return '前天';
  return `${dateLabel(s)} ${weekdayLabel(s)}`;
};
