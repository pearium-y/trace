import type { HabitColor } from '../types';

export interface ColorDef {
  label: string;
  accent: string;
  deep: string;
  /** 5 阶热力色阶：由浅到深 */
  ramp: [string, string, string, string, string];
}

export const HABIT_COLORS: Record<HabitColor, ColorDef> = {
  seal: {
    label: '朱砂',
    accent: '#c04a35',
    deep: '#9c3524',
    ramp: ['#eee6d2', '#e8c5a4', '#dc9668', '#c8643c', '#a53823'],
  },
  ochre: {
    label: '赭石',
    accent: '#b07d2e',
    deep: '#8a5f1e',
    ramp: ['#eee6d2', '#e5cd96', '#d2a95c', '#b9863a', '#8f611e'],
  },
  bamboo: {
    label: '竹青',
    accent: '#6f7f4f',
    deep: '#556439',
    ramp: ['#eee6d2', '#d8dcab', '#b2bd7c', '#899954', '#5e6f37'],
  },
  indigo: {
    label: '黛蓝',
    accent: '#46557c',
    deep: '#333f5e',
    ramp: ['#eee6d2', '#cbd2e0', '#9faccb', '#6f81b0', '#45537a'],
  },
  wisteria: {
    label: '藤紫',
    accent: '#8b76a5',
    deep: '#6b5a81',
    ramp: ['#eee6d2', '#dfd3e2', '#c2aecb', '#9b85af', '#73608b'],
  },
  ink: {
    label: '玄墨',
    accent: '#57503e',
    deep: '#3e3929',
    ramp: ['#eee6d2', '#d7ceb9', '#b1a78d', '#857b62', '#57503e'],
  },
};

export const COLOR_KEYS = Object.keys(HABIT_COLORS) as HabitColor[];

export const EMOJIS = [
  '📖', '🏃', '💧', '🧘', '✍️', '🎸', '🌱', '🍎', '💊', '😴', '📝', '🎨',
  '🧹', '💪', '🚶', '🚴', '📚', '🗣️', '💰', '🍳', '☀️', '🌙', '🧠', '⏰',
];
