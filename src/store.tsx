import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { DB, Habit, Lang, PaletteColor, Project, Tag } from './types';
import { createDefaultDB, DEFAULT_PROJECT_ID, loadDB, makePresetTags, saveDB } from './storage';
import { today } from './utils/date';
import { makeT } from './i18n';
import type { T } from './i18n';

export function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export type HabitInput = Omit<Habit, 'id' | 'createdAt'>;
export type ProjectInput = Pick<Project, 'name' | 'emoji' | 'color'>;
export type TagInput = Pick<Tag, 'name' | 'color'>;

type Action =
  | { type: 'addProject'; project: Project }
  | { type: 'updateProject'; id: string; patch: Partial<ProjectInput> }
  | { type: 'deleteProject'; id: string }
  | { type: 'addTag'; tag: Tag }
  | { type: 'updateTag'; id: string; patch: Partial<TagInput> }
  | { type: 'deleteTag'; id: string }
  | { type: 'addHabit'; habit: Habit }
  | { type: 'updateHabit'; id: string; patch: Partial<HabitInput> }
  | { type: 'deleteHabit'; id: string }
  | { type: 'setRecord'; habitId: string; date: string; value: number; note?: string }
  | { type: 'removeRecord'; habitId: string; date: string }
  | { type: 'setActiveProject'; id: string | null }
  | { type: 'setLang'; lang: Lang }
  | { type: 'importDB'; db: DB }
  | { type: 'clearAll' };

function reducer(db: DB, action: Action): DB {
  switch (action.type) {
    case 'addProject':
      return {
        ...db,
        projects: [...db.projects, action.project],
        tags: [...db.tags, ...makePresetTags(action.project.id)],
        activeProjectId: action.project.id,
      };
    case 'updateProject':
      return {
        ...db,
        projects: db.projects.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      };
    case 'deleteProject': {
      const project = db.projects.find((p) => p.id === action.id);
      if (!project || project.builtin) return db;
      const habitIds = new Set(db.habits.filter((h) => h.projectId === action.id).map((h) => h.id));
      const records = { ...db.records };
      for (const id of habitIds) delete records[id];
      const remaining = db.projects.filter((p) => p.id !== action.id);
      const fallback =
        remaining.find((p) => p.builtin)?.id ?? remaining[0]?.id ?? DEFAULT_PROJECT_ID;
      return {
        ...db,
        projects: remaining,
        tags: db.tags.filter((t) => t.projectId !== action.id),
        habits: db.habits.filter((h) => h.projectId !== action.id),
        records,
        activeProjectId: db.activeProjectId === action.id ? fallback : db.activeProjectId,
      };
    }
    case 'addTag':
      return { ...db, tags: [...db.tags, action.tag] };
    case 'updateTag':
      return {
        ...db,
        tags: db.tags.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      };
    case 'deleteTag': {
      const tag = db.tags.find((t) => t.id === action.id);
      if (!tag || tag.preset) return db;
      return {
        ...db,
        tags: db.tags.filter((t) => t.id !== action.id),
        habits: db.habits.map((h) =>
          h.tagIds.includes(action.id)
            ? { ...h, tagIds: h.tagIds.filter((id) => id !== action.id) }
            : h,
        ),
      };
    }
    case 'addHabit':
      return {
        ...db,
        habits: [...db.habits, action.habit],
        records: { ...db.records, [action.habit.id]: {} },
      };
    case 'updateHabit':
      return {
        ...db,
        habits: db.habits.map((h) => (h.id === action.id ? { ...h, ...action.patch } : h)),
      };
    case 'deleteHabit': {
      const records = { ...db.records };
      delete records[action.id];
      return { ...db, habits: db.habits.filter((h) => h.id !== action.id), records };
    }
    case 'setRecord': {
      const days = { ...(db.records[action.habitId] ?? {}) };
      if (action.value <= 0 && !action.note) {
        delete days[action.date];
      } else {
        days[action.date] = { value: action.value, note: action.note || undefined, updatedAt: Date.now() };
      }
      return { ...db, records: { ...db.records, [action.habitId]: days } };
    }
    case 'removeRecord': {
      const days = { ...(db.records[action.habitId] ?? {}) };
      delete days[action.date];
      return { ...db, records: { ...db.records, [action.habitId]: days } };
    }
    case 'setActiveProject':
      return { ...db, activeProjectId: action.id };
    case 'setLang':
      return { ...db, lang: action.lang };
    case 'importDB':
      return action.db;
    case 'clearAll':
      return { ...createDefaultDB(db.lang), lang: db.lang };
  }
}

export interface StoreValue {
  db: DB;
  lang: Lang;
  t: T;
  activeProjectId: string | null;
  activeProject: Project | null;
  setActiveProject: (id: string | null) => void;
  setLang: (lang: Lang) => void;
  addProject: (input: ProjectInput) => Project;
  updateProject: (id: string, patch: Partial<ProjectInput>) => void;
  deleteProject: (id: string) => void;
  addTag: (projectId: string, input: TagInput) => Tag;
  updateTag: (id: string, patch: Partial<TagInput>) => void;
  deleteTag: (id: string) => void;
  addHabit: (input: HabitInput) => Habit;
  updateHabit: (id: string, patch: Partial<HabitInput>) => void;
  deleteHabit: (id: string) => void;
  setRecord: (habitId: string, date: string, value: number, note?: string) => void;
  removeRecord: (habitId: string, date: string) => void;
  importDB: (db: DB) => void;
  clearAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({
  children,
  initialDB,
}: {
  children: ReactNode;
  initialDB?: DB;
}) {
  const [db, dispatch] = useReducer(reducer, initialDB, (init) => init ?? loadDB());

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const value = useMemo<StoreValue>(() => {
    const t = makeT(db.lang);
    return {
      db,
      lang: db.lang,
      t,
      activeProjectId: db.activeProjectId,
      activeProject: db.projects.find((p) => p.id === db.activeProjectId) ?? null,
      setActiveProject: (id) => dispatch({ type: 'setActiveProject', id }),
      setLang: (lang) => dispatch({ type: 'setLang', lang }),
      addProject: (input) => {
        const project: Project = { ...input, id: uid(), createdAt: today() };
        dispatch({ type: 'addProject', project });
        return project;
      },
      updateProject: (id, patch) => dispatch({ type: 'updateProject', id, patch }),
      deleteProject: (id) => dispatch({ type: 'deleteProject', id }),
      addTag: (projectId, input) => {
        const tag: Tag = { id: uid(), projectId, name: input.name, color: input.color };
        dispatch({ type: 'addTag', tag });
        return tag;
      },
      updateTag: (id, patch) => dispatch({ type: 'updateTag', id, patch }),
      deleteTag: (id) => dispatch({ type: 'deleteTag', id }),
      addHabit: (input) => {
        const habit: Habit = { ...input, id: uid(), createdAt: today() };
        dispatch({ type: 'addHabit', habit });
        return habit;
      },
      updateHabit: (id, patch) => dispatch({ type: 'updateHabit', id, patch }),
      deleteHabit: (id) => dispatch({ type: 'deleteHabit', id }),
      setRecord: (habitId, date, value, note) =>
        dispatch({ type: 'setRecord', habitId, date, value, note }),
      removeRecord: (habitId, date) => dispatch({ type: 'removeRecord', habitId, date }),
      importDB: (next) => dispatch({ type: 'importDB', db: next }),
      clearAll: () => dispatch({ type: 'clearAll' }),
    };
  }, [db]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore 必须在 StoreProvider 内使用');
  return ctx;
}

export type { PaletteColor };
