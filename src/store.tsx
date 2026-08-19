import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { DB, Habit } from './types';
import { loadDB, saveDB } from './storage';
import { today } from './utils/date';

export function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export type HabitInput = Omit<Habit, 'id' | 'createdAt'>;

type Action =
  | { type: 'addHabit'; habit: Habit }
  | { type: 'updateHabit'; id: string; patch: Partial<Habit> }
  | { type: 'deleteHabit'; id: string }
  | { type: 'setRecord'; habitId: string; date: string; value: number; note?: string }
  | { type: 'removeRecord'; habitId: string; date: string }
  | { type: 'importDB'; db: DB }
  | { type: 'clearAll' };

function reducer(db: DB, action: Action): DB {
  switch (action.type) {
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
    case 'importDB':
      return action.db;
    case 'clearAll':
      return { version: 1, habits: [], records: {} };
  }
}

export interface StoreValue {
  db: DB;
  addHabit: (input: HabitInput) => Habit;
  updateHabit: (id: string, patch: Partial<HabitInput>) => void;
  deleteHabit: (id: string) => void;
  setRecord: (habitId: string, date: string, value: number, note?: string) => void;
  removeRecord: (habitId: string, date: string) => void;
  importDB: (db: DB) => void;
  clearAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, dispatch] = useReducer(reducer, undefined, loadDB);

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const value = useMemo<StoreValue>(
    () => ({
      db,
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
    }),
    [db],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore 必须在 StoreProvider 内使用');
  return ctx;
}
