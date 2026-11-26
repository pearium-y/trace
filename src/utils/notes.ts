import type { StickyNote } from '../types';
import { today } from './date';

/** 设置了每日提醒、且今天还没查看过的便签 */
export function isNotePending(note: StickyNote, date = today()): boolean {
  return note.remind && note.lastViewedDate !== date;
}

export function pendingNotes(notes: StickyNote[], date = today()): StickyNote[] {
  return notes.filter((n) => isNotePending(n, date));
}

export function pendingNotesForHabit(
  notes: StickyNote[],
  habitId: string,
  date = today(),
): StickyNote[] {
  return notes.filter((n) => n.habitId === habitId && isNotePending(n, date));
}
