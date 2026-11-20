import type { PaletteColor, Project, Tag } from '../types';
import type { T } from '../i18n';

export interface ColorDef {
  accent: string;
  deep: string;
  /** 5 阶热力色阶：由浅到深 */
  ramp: [string, string, string, string, string];
}

export const HABIT_COLORS: Record<PaletteColor, ColorDef> = {
  seal: {
    accent: '#c04a35',
    deep: '#9c3524',
    ramp: ['#eee6d2', '#e8c5a4', '#dc9668', '#c8643c', '#a53823'],
  },
  ochre: {
    accent: '#b07d2e',
    deep: '#8a5f1e',
    ramp: ['#eee6d2', '#e5cd96', '#d2a95c', '#b9863a', '#8f611e'],
  },
  bamboo: {
    accent: '#6f7f4f',
    deep: '#556439',
    ramp: ['#eee6d2', '#d8dcab', '#b2bd7c', '#899954', '#5e6f37'],
  },
  indigo: {
    accent: '#46557c',
    deep: '#333f5e',
    ramp: ['#eee6d2', '#cbd2e0', '#9faccb', '#6f81b0', '#45537a'],
  },
  wisteria: {
    accent: '#8b76a5',
    deep: '#6b5a81',
    ramp: ['#eee6d2', '#dfd3e2', '#c2aecb', '#9b85af', '#73608b'],
  },
  ink: {
    accent: '#57503e',
    deep: '#3e3929',
    ramp: ['#eee6d2', '#d7ceb9', '#b1a78d', '#857b62', '#57503e'],
  },
};

export const COLOR_KEYS = Object.keys(HABIT_COLORS) as PaletteColor[];

export const colorOf = (c: PaletteColor): ColorDef => HABIT_COLORS[c] ?? HABIT_COLORS.seal;

export const paletteLabel = (c: PaletteColor, t: T): string => t(`palette_${c}`);

export function tagLabel(tag: Tag, t: T): string {
  return tag.preset ? t(`tagPreset_${tag.preset}`) : tag.name;
}

export function projectLabel(project: Project, t: T): string {
  return project.builtin ? t('defaultProject') : project.name;
}

export const EMOJIS = [
  '📖', '🏃', '💧', '🧘', '✍️', '🎸', '🌱', '🍎', '💊', '😴', '📝', '🎨',
  '🧹', '💪', '🚶', '🚴', '📚', '🗣️', '💰', '🍳', '☀️', '🌙', '🧠', '⏰',
];

export const PROJECT_EMOJIS = [
  '🗂️', '🌱', '💪', '📚', '🧘', '💼', '🎨', '🏡', '💧', '🍎', '🌙', '⭐',
];
