import { today } from './utils/date';

/** 快排计划独立存储：仅在当天有效，不进入 JSON 备份 */
export const RUSH_STORAGE_KEY = 'trace-rush-v1';

export const DAY_MINUTES = 24 * 60;
export const REST_MINUTES = 5;
export const DEFAULT_HABIT_MINUTES = 25;
export const DEFAULT_BREAK_MINUTES = 20;

const DRAG_TYPE = 'application/x-trace-rush';

export type RushItem =
  | { kind: 'habit'; id: string; habitId: string; duration: number; done: boolean }
  | { kind: 'break'; id: string; duration: number };

export interface RushPlan {
  /** YYYY-MM-DD，计划仅在当天有效 */
  date: string;
  /** 计划开始时间（当天第几分钟，0 - 1439） */
  startMin: number;
  items: RushItem[];
}

export type RushBlockKind = 'habit' | 'break' | 'rest';

export interface RushBlock {
  key: string;
  kind: RushBlockKind;
  start: number;
  end: number;
  /** rest 块没有对应 item */
  item?: RushItem;
  /** rest 块没有 index */
  index?: number;
}

export type RushDragPayload =
  | { kind: 'habit'; habitId: string }
  | { kind: 'break' };

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

export function parseHHMM(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 24 || m > 59) return null;
  const total = h * 60 + m;
  return total > DAY_MINUTES ? null : total;
}

export function minutesToHHMM(minutes: number): string {
  const v = clamp(Math.round(minutes), 0, DAY_MINUTES);
  const h = Math.floor(v / 60);
  const m = v % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function itemId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createHabitItem(habitId: string, duration: number): RushItem {
  return { kind: 'habit', id: itemId('h'), habitId, duration, done: false };
}

export function createBreakItem(duration: number): RushItem {
  return { kind: 'break', id: itemId('b'), duration };
}

function parseRushPlan(raw: unknown, date: string): RushPlan | null {
  if (!isObj(raw) || raw.date !== date) return null;
  const startMin = raw.startMin;
  if (typeof startMin !== 'number' || !Number.isFinite(startMin)) return null;
  if (startMin < 0 || startMin >= DAY_MINUTES) return null;
  if (!Array.isArray(raw.items)) return null;

  const items: RushItem[] = [];
  for (const entry of raw.items) {
    if (!isObj(entry)) continue;
    const duration =
      typeof entry.duration === 'number' && Number.isFinite(entry.duration)
        ? Math.floor(entry.duration)
        : 0;
    if (duration <= 0) continue;
    const id = typeof entry.id === 'string' && entry.id ? entry.id : '';

    if (entry.kind === 'habit') {
      const habitId = entry.habitId;
      if (typeof habitId !== 'string' || !habitId) continue;
      items.push({
        kind: 'habit',
        id: id || itemId('h'),
        habitId,
        duration,
        done: entry.done === true,
      });
    } else if (entry.kind === 'break') {
      items.push({ kind: 'break', id: id || itemId('b'), duration });
    }
  }

  return { date, startMin: Math.floor(startMin), items };
}

/** 读取当天计划；日期不是今天（或数据损坏）时视为空计划并清理 */
export function loadRushPlan(date: string = today()): RushPlan | null {
  try {
    const raw = localStorage.getItem(RUSH_STORAGE_KEY);
    if (!raw) return null;
    const plan = parseRushPlan(JSON.parse(raw) as unknown, date);
    if (!plan) localStorage.removeItem(RUSH_STORAGE_KEY);
    return plan;
  } catch {
    return null;
  }
}

export function saveRushPlan(plan: RushPlan | null): void {
  try {
    if (plan) localStorage.setItem(RUSH_STORAGE_KEY, JSON.stringify(plan));
    else localStorage.removeItem(RUSH_STORAGE_KEY);
  } catch {
    /* 存储失败时静默 */
  }
}

/** 把计划展开为时间轴块：习惯之间自动插入 5 分钟休息 */
export function computeSchedule(plan: RushPlan): RushBlock[] {
  const blocks: RushBlock[] = [];
  let cursor = plan.startMin;

  plan.items.forEach((item, index) => {
    const prev = plan.items[index - 1];
    if (prev && prev.kind === 'habit' && item.kind === 'habit') {
      const restEnd = Math.min(cursor + REST_MINUTES, DAY_MINUTES);
      if (restEnd > cursor) {
        blocks.push({ key: `rest-${index}`, kind: 'rest', start: cursor, end: restEnd });
        cursor = restEnd;
      }
    }
    const start = cursor;
    const end = Math.min(start + item.duration, DAY_MINUTES);
    blocks.push({ key: item.id, kind: item.kind, start, end, item, index });
    cursor = end;
  });

  return blocks;
}

/** 追加新项目时的起点：若前面紧邻习惯且新项目也是习惯，则先留出休息 */
export function appendStart(plan: RushPlan, kind: RushItem['kind']): number {
  const blocks = computeSchedule(plan);
  const last = blocks[blocks.length - 1];
  let cursor = last ? last.end : plan.startMin;
  const lastItem = plan.items[plan.items.length - 1];
  if (kind === 'habit' && lastItem && lastItem.kind === 'habit') cursor += REST_MINUTES;
  return Math.min(cursor, DAY_MINUTES);
}

/** 在保证后续安排仍能排进今天的前提下，某个项目允许的最大时长 */
export function maxDurationAt(plan: RushPlan, index: number): number {
  const block = computeSchedule(plan).find((b) => b.index === index);
  if (!block) return 1;
  let tail = 0;
  for (let i = index + 1; i < plan.items.length; i += 1) {
    const prev = plan.items[i - 1];
    const current = plan.items[i];
    if (prev && prev.kind === 'habit' && current.kind === 'habit') tail += REST_MINUTES;
    tail += current.duration;
  }
  return Math.max(1, DAY_MINUTES - block.start - tail);
}

/** 移除已不存在的习惯引用 */
export function keepKnownHabits(items: RushItem[], habitIds: Set<string>): RushItem[] {
  return items.filter((item) => item.kind === 'break' || habitIds.has(item.habitId));
}

export function writeRushDrag(
  dataTransfer: DataTransfer,
  payload: RushDragPayload,
): void {
  const text = JSON.stringify(payload);
  dataTransfer.setData(DRAG_TYPE, text);
  dataTransfer.setData('text/plain', text);
  dataTransfer.effectAllowed = 'copy';
}

export function readRushDrag(dataTransfer: DataTransfer): RushDragPayload | null {
  const raw = dataTransfer.getData(DRAG_TYPE) || dataTransfer.getData('text/plain');
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isObj(parsed)) return null;
    if (parsed.kind === 'break') return { kind: 'break' };
    if (
      parsed.kind === 'habit' &&
      typeof parsed.habitId === 'string' &&
      parsed.habitId
    ) {
      return { kind: 'habit', habitId: parsed.habitId };
    }
    return null;
  } catch {
    return null;
  }
}
