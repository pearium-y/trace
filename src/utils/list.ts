import type { Frequency, GoalType, Habit, RecordMap } from '../types';
import { addDays, today } from './date';
import { computeStreak, habitRangeStat } from './stats';

export type SortKey = 'default' | 'name' | 'streak' | 'rate' | 'target' | 'newest';

export interface ListFilter {
  tagNames: string[];
  frequency: 'all' | Frequency;
  goalType: 'all' | GoalType;
}

export const emptyFilter = (): ListFilter => ({
  tagNames: [],
  frequency: 'all',
  goalType: 'all',
});

export const countActiveFilters = (filter: ListFilter): number =>
  filter.tagNames.length +
  (filter.frequency !== 'all' ? 1 : 0) +
  (filter.goalType !== 'all' ? 1 : 0);

/** tagNamesOf: 习惯 id -> 标签显示名集合 */
export function filterHabits(
  habits: Habit[],
  filter: ListFilter,
  tagNamesOf: (habit: Habit) => string[],
): Habit[] {
  return habits.filter((h) => {
    if (filter.frequency !== 'all' && h.frequency !== filter.frequency) return false;
    if (filter.goalType !== 'all' && h.goalType !== filter.goalType) return false;
    if (filter.tagNames.length > 0) {
      const names = tagNamesOf(h);
      if (!filter.tagNames.some((n) => names.includes(n))) return false;
    }
    return true;
  });
}

export function sortHabits(
  habits: Habit[],
  records: RecordMap,
  sort: SortKey,
  lang: string,
): Habit[] {
  const list = [...habits];
  if (sort === 'name') {
    return list.sort((a, b) => a.name.localeCompare(b.name, lang));
  }
  if (sort === 'streak') {
    return list.sort((a, b) => computeStreak(b, records).current - computeStreak(a, records).current);
  }
  if (sort === 'rate') {
    const start = addDays(today(), -29);
    const end = today();
    return list.sort(
      (a, b) =>
        habitRangeStat(b, records, start, end).rate - habitRangeStat(a, records, start, end).rate,
    );
  }
  if (sort === 'target') {
    return list.sort((a, b) => b.target - a.target);
  }
  if (sort === 'newest') {
    return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  return list;
}

export interface TagOption {
  name: string;
  color: import('../types').PaletteColor;
}

export function applyList(
  habits: Habit[],
  records: RecordMap,
  filter: ListFilter,
  sort: SortKey,
  lang: string,
  tagNamesOf: (habit: Habit) => string[],
): Habit[] {
  return sortHabits(filterHabits(habits, filter, tagNamesOf), records, sort, lang);
}
