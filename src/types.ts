export type Frequency = 'daily' | 'weekly';
export type GoalType = 'none' | 'count' | 'duration';
export type HabitColor = 'seal' | 'ochre' | 'bamboo' | 'indigo' | 'wisteria' | 'ink';

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: HabitColor;
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
  version: 1;
  habits: Habit[];
  records: RecordMap;
}

export interface ExportPayload {
  app: 'trace';
  version: 1;
  exportedAt: string;
  habits: Habit[];
  records: RecordMap;
}
