import type { Habit, RecordMap } from '../types';
import { addDays, startOfWeek, today } from './date';
import { fmtDuration } from './format';

export function dayValue(records: RecordMap, habitId: string, date: string): number {
  return records[habitId]?.[date]?.value ?? 0;
}

export function getRecord(records: RecordMap, habitId: string, date: string) {
  return records[habitId]?.[date];
}

/** 某计划某日的完成比值（周计划按 周目标/7 折算到日；无目标=有记录即 1） */
export function dayRatio(habit: Habit, records: RecordMap, date: string): number {
  const v = dayValue(records, habit.id, date);
  if (habit.goalType === 'none' || habit.target <= 0) return v > 0 ? 1 : 0;
  const dayTarget = habit.frequency === 'weekly' ? habit.target / 7 : habit.target;
  return v / dayTarget;
}

export function weekValueSum(habit: Habit, records: RecordMap, dateInWeek: string): number {
  const ws = startOfWeek(dateInWeek);
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += dayValue(records, habit.id, addDays(ws, i));
  return sum;
}

/** 某日是否有实质记录（无目标计划以此判定完成） */
export function isDayMet(habit: Habit, records: RecordMap, date: string): boolean {
  const v = dayValue(records, habit.id, date);
  if (habit.goalType === 'none' || habit.target <= 0) return v > 0;
  return habit.frequency === 'daily' ? v >= habit.target : v > 0;
}

/** 周计划的本周目标是否达成 */
export function isWeekMet(habit: Habit, records: RecordMap, dateInWeek: string): boolean {
  const wv = weekValueSum(habit, records, dateInWeek);
  if (habit.goalType === 'none' || habit.target <= 0) return wv > 0;
  if (habit.frequency === 'weekly') return wv >= habit.target;
  return wv > 0;
}

export interface Streak {
  current: number;
  longest: number;
}

export function computeStreak(habit: Habit, records: RecordMap): Streak {
  const t = today();
  if (habit.frequency === 'daily') {
    let cur = 0;
    let d = t;
    if (!isDayMet(habit, records, d)) d = addDays(d, -1);
    while (d >= habit.createdAt && isDayMet(habit, records, d)) {
      cur++;
      d = addDays(d, -1);
    }
    let best = 0;
    let run = 0;
    for (let x = habit.createdAt; x <= t; x = addDays(x, 1)) {
      if (isDayMet(habit, records, x)) {
        run++;
        if (run > best) best = run;
      } else {
        run = 0;
      }
    }
    return { current: cur, longest: Math.max(best, cur) };
  }
  // 周计划：按周计连续
  let cur = 0;
  let w = startOfWeek(t);
  if (!isWeekMet(habit, records, w)) w = addDays(w, -7);
  const firstWeek = startOfWeek(habit.createdAt);
  while (w >= firstWeek && isWeekMet(habit, records, w)) {
    cur++;
    w = addDays(w, -7);
  }
  let best = 0;
  let run = 0;
  let x = firstWeek;
  const lastWeek = startOfWeek(t);
  while (x <= lastWeek) {
    if (isWeekMet(habit, records, x)) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
    x = addDays(x, 7);
  }
  return { current: cur, longest: Math.max(best, cur) };
}

export interface RangeStat {
  due: number;
  met: number;
  rate: number;
  total: number;
}

/** 某计划在区间内的完成情况（每日计划按天计，每周计划按周计） */
export function habitRangeStat(habit: Habit, records: RecordMap, start: string, end: string): RangeStat {
  const t = today();
  const effectiveEnd = end > t ? t : end;
  if (habit.frequency === 'daily') {
    let due = 0;
    let met = 0;
    let total = 0;
    for (let d = start; d <= effectiveEnd; d = addDays(d, 1)) {
      if (d < habit.createdAt) continue;
      due++;
      const v = dayValue(records, habit.id, d);
      total += v;
      if (isDayMet(habit, records, d)) met++;
    }
    return { due, met, rate: due > 0 ? met / due : 0, total };
  }
  let due = 0;
  let met = 0;
  let total = 0;
  let w = startOfWeek(start);
  const lastW = startOfWeek(effectiveEnd >= start ? effectiveEnd : start);
  const firstWeek = startOfWeek(habit.createdAt);
  while (w <= lastW) {
    if (w >= firstWeek) {
      due++;
      const wv = weekValueSum(habit, records, w);
      total += wv;
      if (isWeekMet(habit, records, w)) met++;
    }
    w = addDays(w, 7);
  }
  return { due, met, rate: due > 0 ? met / due : 0, total };
}

export function heatLevel(ratio: number): number {
  if (ratio <= 0) return 0;
  if (ratio >= 1) return 4;
  if (ratio >= 0.67) return 3;
  if (ratio >= 0.34) return 2;
  return 1;
}

/** 全部计划在某日的总体完成比值（各计划当日比值封顶后取平均） */
export function overallDayRatio(habits: Habit[], records: RecordMap, date: string): number {
  let sum = 0;
  let n = 0;
  for (const h of habits) {
    if (h.createdAt > date) continue;
    sum += Math.min(dayRatio(h, records, date), 1);
    n++;
  }
  return n > 0 ? sum / n : 0;
}

export function hasAnyRecord(records: RecordMap, date: string): boolean {
  for (const days of Object.values(records)) {
    if (days[date]) return true;
  }
  return false;
}

export interface NoteItem {
  date: string;
  habit: Habit;
  note: string;
}

export function collectNotes(
  habits: Habit[],
  records: RecordMap,
  start: string,
  end: string,
): NoteItem[] {
  const out: NoteItem[] = [];
  for (const h of habits) {
    const days = records[h.id] ?? {};
    for (const [date, rec] of Object.entries(days)) {
      if (rec.note && date >= start && date <= end) {
        out.push({ date, habit: h, note: rec.note });
      }
    }
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function goalText(habit: Habit): string {
  const freq = habit.frequency === 'daily' ? '每日' : '每周';
  if (habit.goalType === 'none') return `${freq} · 无目标`;
  if (habit.goalType === 'count') return `${freq} ${habit.target} 次`;
  return `${freq} ${fmtDuration(habit.target)}`;
}

export function valueLabel(habit: Habit, v: number): string {
  if (habit.goalType === 'duration') return fmtDuration(v);
  return `${v} 次`;
}

export function streakUnit(habit: Habit): string {
  return habit.frequency === 'daily' ? '天' : '周';
}
