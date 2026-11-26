export type Frequency = 'daily' | 'weekly';
export type GoalType = 'none' | 'count' | 'duration';

/** 调色板（习惯专属色 / 标签色 / 项目色共用） */
export type PaletteColor = 'seal' | 'ochre' | 'bamboo' | 'indigo' | 'wisteria' | 'ink';

export type Lang = 'zh' | 'en';

export interface Project {
  id: string;
  name: string;
  emoji: string;
  color: PaletteColor;
  createdAt: string;
  /** 默认项目不可删除 */
  builtin?: boolean;
}

export interface Tag {
  id: string;
  projectId: string;
  name: string;
  color: PaletteColor;
}

export interface Habit {
  id: string;
  projectId: string;
  name: string;
  emoji: string;
  color: PaletteColor;
  tagIds: string[];
  /** 习惯备注 */
  notes?: string;
  frequency: Frequency;
  goalType: GoalType;
  /** count: 次; duration: 分钟; none: 0 */
  target: number;
  /** YYYY-MM-DD，统计起算日 */
  createdAt: string;
}

export interface DayRecord {
  value: number;
  note?: string;
  updatedAt: number;
}

/** 便签墙上的便签 */
export interface StickyNote {
  id: string;
  text: string;
  color: PaletteColor;
  createdAt: string;
  updatedAt: number;
  /** 是否每天提醒 */
  remind: boolean;
  /** 关联的习惯 */
  habitId?: string;
  /** 最近一次查看提醒的日期（YYYY-MM-DD），用于每日小红点 */
  lastViewedDate?: string;
}

/** habitId -> date(YYYY-MM-DD) -> record */
export type RecordMap = Record<string, Record<string, DayRecord>>;

export interface DB {
  version: 2;
  projects: Project[];
  tags: Tag[];
  habits: Habit[];
  records: RecordMap;
  /** 便签墙功能开关 */
  notesEnabled: boolean;
  notes: StickyNote[];
  /** null = 全部项目汇总 */
  activeProjectId: string | null;
  lang: Lang;
}

export interface ExportPayload {
  app: 'trace';
  version: 2;
  exportedAt: string;
  projects: Project[];
  tags: Tag[];
  habits: Habit[];
  records: RecordMap;
  notesEnabled?: boolean;
  notes?: StickyNote[];
  lang: Lang;
}
