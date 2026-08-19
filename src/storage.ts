import type { DB, DayRecord, ExportPayload, Habit } from './types';

export const DB_KEY = 'trace-data-v1';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const COLORS = ['seal', 'ochre', 'bamboo', 'indigo', 'wisteria', 'ink'];

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

function parseHabit(x: unknown): Habit | null {
  if (!isObj(x)) return null;
  const { id, name, emoji, color, frequency, goalType, target, createdAt } = x;
  if (typeof id !== 'string' || typeof name !== 'string' || typeof emoji !== 'string') return null;
  if (typeof color !== 'string' || !COLORS.includes(color)) return null;
  if (frequency !== 'daily' && frequency !== 'weekly') return null;
  if (goalType !== 'none' && goalType !== 'count' && goalType !== 'duration') return null;
  if (typeof target !== 'number' || !Number.isFinite(target) || target < 0) return null;
  if (typeof createdAt !== 'string' || !DATE_RE.test(createdAt)) return null;
  return {
    id,
    name,
    emoji,
    color: color as Habit['color'],
    frequency,
    goalType,
    target: Math.floor(target),
    createdAt,
  };
}

function parseRecords(x: unknown): DB['records'] {
  const out: DB['records'] = {};
  if (!isObj(x)) return out;
  for (const [habitId, days] of Object.entries(x)) {
    if (!isObj(days)) continue;
    const dayMap: Record<string, DayRecord> = {};
    for (const [date, rec] of Object.entries(days)) {
      if (!isObj(rec) || !DATE_RE.test(date)) continue;
      if (typeof rec.value !== 'number' || !Number.isFinite(rec.value)) continue;
      dayMap[date] = {
        value: rec.value,
        note: typeof rec.note === 'string' ? rec.note : undefined,
        updatedAt: typeof rec.updatedAt === 'number' ? rec.updatedAt : Date.now(),
      };
    }
    out[habitId] = dayMap;
  }
  return out;
}

export function parseDB(x: unknown): DB | null {
  if (!isObj(x) || x.version !== 1 || !Array.isArray(x.habits)) return null;
  const habits = (x.habits as unknown[]).map(parseHabit).filter((h): h is Habit => h !== null);
  const records = parseRecords(x.records);
  for (const k of Object.keys(records)) {
    if (!habits.some((h) => h.id === k)) delete records[k];
  }
  return { version: 1, habits, records };
}

export function emptyDB(): DB {
  return { version: 1, habits: [], records: {} };
}

export function loadDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return emptyDB();
    return parseDB(JSON.parse(raw)) ?? emptyDB();
  } catch {
    return emptyDB();
  }
}

export function saveDB(db: DB): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function buildExport(db: DB): ExportPayload {
  return {
    app: 'trace',
    version: 1,
    exportedAt: new Date().toISOString(),
    habits: db.habits,
    records: db.records,
  };
}

/** 校验导入的备份文件（必须带 app:'trace' 标记） */
export function parseImport(text: string): DB | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isObj(parsed) || parsed.app !== 'trace') return null;
    return parseDB(parsed);
  } catch {
    return null;
  }
}
