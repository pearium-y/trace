import type {
  DB,
  DayRecord,
  ExportPayload,
  Habit,
  Lang,
  PaletteColor,
  Project,
  StickyNote,
  Tag,
} from './types';

export const DB_KEY = 'trace-data-v2';
export const LEGACY_KEY = 'trace-data-v1';

export const DEFAULT_PROJECT_ID = 'project-default';
const COLORS: PaletteColor[] = ['seal', 'ochre', 'bamboo', 'indigo', 'wisteria', 'ink'];
/** rc.1 自动生成的内置标签 ID 后缀（如 `project-default--tag-seal`） */
const LEGACY_PRESET_TAG_ID_RE = /--tag-(seal|ochre|bamboo|indigo|wisteria|ink)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

export function detectLang(): Lang {
  try {
    return navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  } catch {
    return 'zh';
  }
}

export function makeDefaultProject(): Project {
  return {
    id: DEFAULT_PROJECT_ID,
    name: '默认项目',
    emoji: '🗂️',
    color: 'ink',
    createdAt: '2000-01-01',
    builtin: true,
  };
}

export function createDefaultDB(lang: Lang = detectLang()): DB {
  const project = makeDefaultProject();
  return {
    version: 2,
    projects: [project],
    tags: [],
    habits: [],
    records: {},
    notesEnabled: false,
    notes: [],
    activeProjectId: project.id,
    lang,
  };
}

function parseProject(x: unknown): Project | null {
  if (!isObj(x)) return null;
  const { id, name, emoji, color, createdAt, builtin } = x;
  if (typeof id !== 'string' || !id) return null;
  if (typeof name !== 'string') return null;
  if (typeof emoji !== 'string') return null;
  if (typeof color !== 'string' || !COLORS.includes(color as PaletteColor)) return null;
  if (typeof createdAt !== 'string' || !DATE_RE.test(createdAt)) return null;
  return {
    id,
    name,
    emoji,
    color: color as PaletteColor,
    createdAt,
    builtin: builtin === true,
  };
}

function parseTag(x: unknown): Tag | null {
  if (!isObj(x)) return null;
  const { id, projectId, name, color } = x;
  if (typeof id !== 'string' || !id) return null;
  if (typeof projectId !== 'string' || !projectId) return null;
  if (typeof name !== 'string') return null;
  if (typeof color !== 'string' || !COLORS.includes(color as PaletteColor)) return null;
  return {
    id,
    projectId,
    name,
    color: color as PaletteColor,
  };
}

function parseHabit(x: unknown): Habit | null {
  if (!isObj(x)) return null;
  const { id, projectId, name, emoji, color, frequency, goalType, target, createdAt, tagIds, notes } = x;
  if (typeof id !== 'string' || typeof name !== 'string' || typeof emoji !== 'string') return null;
  if (typeof projectId !== 'string') return null;
  if (typeof color !== 'string' || !COLORS.includes(color as PaletteColor)) return null;
  if (frequency !== 'daily' && frequency !== 'weekly') return null;
  if (goalType !== 'none' && goalType !== 'count' && goalType !== 'duration') return null;
  if (typeof target !== 'number' || !Number.isFinite(target) || target < 0) return null;
  if (typeof createdAt !== 'string' || !DATE_RE.test(createdAt)) return null;
  const ids = Array.isArray(tagIds) ? tagIds.filter((t): t is string => typeof t === 'string') : [];
  return {
    id,
    projectId,
    name,
    emoji,
    color: color as PaletteColor,
    frequency,
    goalType,
    target: Math.floor(target),
    createdAt,
    tagIds: ids,
    notes: typeof notes === 'string' && notes.trim() ? notes : undefined,
  };
}

function parseNote(x: unknown): StickyNote | null {
  if (!isObj(x)) return null;
  const { id, text, color, createdAt, updatedAt, remind, habitId, lastViewedDate } = x;
  if (typeof id !== 'string' || !id) return null;
  if (typeof text !== 'string' || !text.trim()) return null;
  if (typeof color !== 'string' || !COLORS.includes(color as PaletteColor)) return null;
  if (typeof createdAt !== 'string' || !DATE_RE.test(createdAt)) return null;
  return {
    id,
    text,
    color: color as PaletteColor,
    createdAt,
    updatedAt: typeof updatedAt === 'number' && Number.isFinite(updatedAt) ? updatedAt : Date.now(),
    remind: remind === true,
    habitId: typeof habitId === 'string' && habitId ? habitId : undefined,
    lastViewedDate:
      typeof lastViewedDate === 'string' && DATE_RE.test(lastViewedDate) ? lastViewedDate : undefined,
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

/** 校验并修复 V2 数据（补齐默认项目，剔除失效引用） */
export function parseDB(x: unknown): DB | null {
  if (!isObj(x) || x.version !== 2) return null;
  if (!Array.isArray(x.projects) || !Array.isArray(x.tags) || !Array.isArray(x.habits)) return null;

  const projects = (x.projects as unknown[]).map(parseProject).filter((p): p is Project => p !== null);
  if (!projects.some((p) => p.builtin)) {
    const def = projects.find((p) => p.id === DEFAULT_PROJECT_ID) ?? makeDefaultProject();
    if (!projects.some((p) => p.id === def.id)) projects.unshift(def);
    def.builtin = true;
  }
  const projectIds = new Set(projects.map((p) => p.id));

  const rawTags = x.tags as unknown[];
  const legacyTagIds = new Set<string>();
  for (const raw of rawTags) {
    if (!isObj(raw) || typeof raw.id !== 'string') continue;
    const preset = raw.preset;
    const isLegacyPreset =
      (typeof preset === 'string' && COLORS.includes(preset as PaletteColor)) ||
      LEGACY_PRESET_TAG_ID_RE.test(raw.id);
    if (isLegacyPreset) legacyTagIds.add(raw.id);
  }
  const tags = rawTags
    .map(parseTag)
    .filter((t): t is Tag => t !== null && !legacyTagIds.has(t.id));
  for (const tag of tags) {
    if (!projectIds.has(tag.projectId)) tag.projectId = DEFAULT_PROJECT_ID;
  }
  const tagIds = new Set(tags.map((t) => t.id));

  const habits = (x.habits as unknown[]).map(parseHabit).filter((h): h is Habit => h !== null);
  for (const habit of habits) {
    if (!projectIds.has(habit.projectId)) habit.projectId = DEFAULT_PROJECT_ID;
    habit.tagIds = habit.tagIds.filter((id) => tagIds.has(id));
  }

  const records = parseRecords(x.records);
  const habitIds = new Set(habits.map((h) => h.id));
  for (const k of Object.keys(records)) {
    if (!habitIds.has(k)) delete records[k];
  }

  const notes = Array.isArray(x.notes)
    ? (x.notes as unknown[]).map(parseNote).filter((n): n is StickyNote => n !== null)
    : [];
  for (const note of notes) {
    if (note.habitId && !habitIds.has(note.habitId)) delete note.habitId;
  }
  const notesEnabled = x.notesEnabled === true;

  const activeProjectId =
    typeof x.activeProjectId === 'string' && projectIds.has(x.activeProjectId)
      ? x.activeProjectId
      : null;
  const lang: Lang = x.lang === 'en' ? 'en' : 'zh';

  return {
    version: 2,
    projects,
    tags,
    habits,
    records,
    notesEnabled,
    notes,
    activeProjectId,
    lang,
  };
}

export function loadDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return createDefaultDB();
    return parseDB(JSON.parse(raw)) ?? createDefaultDB();
  } catch {
    return createDefaultDB();
  }
}

export function saveDB(db: DB): void {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* 存储空间不足时静默失败 */
  }
}

export type BootState = { kind: 'ready'; db: DB } | { kind: 'legacy' };

/** 启动时判断：优先 V2 数据，其次检测 V1.0 旧数据 */
export function bootDB(): BootState {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const db = parseDB(JSON.parse(raw));
      if (db) return { kind: 'ready', db };
      return { kind: 'ready', db: createDefaultDB() };
    }
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const parsed: unknown = JSON.parse(legacyRaw);
      if (isObj(parsed) && parsed.version === 1 && Array.isArray(parsed.habits)) {
        return { kind: 'legacy' };
      }
    }
    return { kind: 'ready', db: createDefaultDB() };
  } catch {
    return { kind: 'ready', db: createDefaultDB() };
  }
}

/** 将 V1.0 数据迁移为 V2（成功后写入新键并移除旧键） */
export function migrateLegacy(): DB | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const db = migrateLegacyPayload(parsed);
    if (!db) return null;
    db.lang = detectLang();
    saveDB(db);
    localStorage.removeItem(LEGACY_KEY);
    return db;
  } catch {
    return null;
  }
}

function migrateLegacyPayload(x: unknown): DB | null {
  if (!isObj(x) || !Array.isArray(x.habits)) return null;
  const project = makeDefaultProject();
  const colorSet = new Set<string>(COLORS);

  const habits: Habit[] = [];
  for (const item of x.habits as unknown[]) {
    if (!isObj(item)) continue;
    const { id, name, emoji, color, frequency, goalType, target, createdAt } = item;
    if (typeof id !== 'string' || typeof name !== 'string' || typeof emoji !== 'string') continue;
    if (frequency !== 'daily' && frequency !== 'weekly') continue;
    if (goalType !== 'none' && goalType !== 'count' && goalType !== 'duration') continue;
    if (typeof target !== 'number' || !Number.isFinite(target) || target < 0) continue;
    if (typeof createdAt !== 'string' || !DATE_RE.test(createdAt)) continue;
    const picked = typeof color === 'string' && colorSet.has(color) ? (color as PaletteColor) : 'seal';
    habits.push({
      id,
      projectId: project.id,
      name,
      emoji,
      color: picked,
      frequency,
      goalType,
      target: Math.floor(target),
      createdAt,
      tagIds: [],
    });
  }

  const records = parseRecords(x.records);
  const habitIds = new Set(habits.map((h) => h.id));
  for (const k of Object.keys(records)) {
    if (!habitIds.has(k)) delete records[k];
  }

  return {
    version: 2,
    projects: [project],
    tags: [],
    habits,
    records,
    notesEnabled: false,
    notes: [],
    activeProjectId: project.id,
    lang: 'zh',
  };
}

export function buildExport(db: DB): ExportPayload {
  return {
    app: 'trace',
    version: 2,
    exportedAt: new Date().toISOString(),
    projects: db.projects,
    tags: db.tags,
    habits: db.habits,
    records: db.records,
    notesEnabled: db.notesEnabled,
    notes: db.notes,
    lang: db.lang,
  };
}

/** 校验导入的备份文件（支持 V2 及 V1.0 备份） */
export function parseImport(text: string): DB | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isObj(parsed) || parsed.app !== 'trace') return null;
    if (parsed.version === 2) return parseDB(parsed);
    if (parsed.version === 1) return migrateLegacyPayload(parsed);
    return null;
  } catch {
    return null;
  }
}
