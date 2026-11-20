export type Frequency = 'daily' | 'weekly';
export type GoalType = 'none' | 'count' | 'duration';

/** 调色板（习惯专属色 / 标签色 / 项目色共用） */
export type PaletteColor = 'seal' | 'ochre' | 'bamboo' | 'indigo' | 'wisteria' | 'ink';

/** 内置标签的预设键，与调色板一致 */
export type TagPreset = PaletteColor;

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
  /** 内置标签：名称随语言变化，不可删除 */
  preset?: TagPreset;
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

/** habitId -> date(YYYY-MM-DD) -> record */
export type RecordMap = Record<string, Record<string, DayRecord>>;

export interface DB {
  version: 2;
  projects: Project[];
  tags: Tag[];
  habits: Habit[];
  records: RecordMap;
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
  lang: Lang;
}
