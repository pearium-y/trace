import type { Habit } from '../types';
import { computeSchedule } from '../rush';
import type { RushPlan } from '../rush';
import { addDays } from './date';

const pad = (n: number): string => String(n).padStart(2, '0');

const DAY_MINUTES = 24 * 60;

/** 本地时间（floating time），跨天时落到次日 00:00 */
function icsDateTime(date: string, minutes: number): string {
  const day = date.replaceAll('-', '');
  if (minutes >= DAY_MINUTES) return `${addDays(date, 1).replaceAll('-', '')}T000000`;
  return `${day}T${pad(Math.floor(minutes / 60))}${pad(minutes % 60)}00`;
}

function utcStamp(): string {
  const d = new Date();
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** 把当天的快排计划导出为 iCalendar（只包含习惯，不含休息） */
export function buildRushICS(plan: RushPlan, habits: Habit[]): string {
  const byId = new Map(habits.map((h) => [h.id, h]));
  const stamp = utcStamp();
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trace//Rush Plan//EN',
    'CALSCALE:GREGORIAN',
  ];

  for (const block of computeSchedule(plan)) {
    if (block.kind !== 'habit' || !block.item || block.item.kind !== 'habit') continue;
    const habit = byId.get(block.item.habitId);
    if (!habit) continue;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${block.item.id}@trace.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDateTime(plan.date, block.start)}`,
      `DTEND:${icsDateTime(plan.date, block.end)}`,
      `SUMMARY:${escapeText(`${habit.emoji} ${habit.name}`)}`,
      `DESCRIPTION:${escapeText(`Trace · ${habit.name}`)}`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}
