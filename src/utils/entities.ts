import type { Habit, PaletteColor, Project, Tag } from '../types';

export interface TagOption {
  name: string;
  color: PaletteColor;
}

export function projectOf(projects: Project[], id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function habitOf(habits: Habit[], id: string): Habit | undefined {
  return habits.find((h) => h.id === id);
}

export function tagsOf(tags: Tag[], tagIds: string[]): Tag[] {
  return tagIds.map((id) => tags.find((tag) => tag.id === id)).filter((tag): tag is Tag => !!tag);
}

export function habitTagNames(tags: Tag[], habit: Habit): string[] {
  return tagsOf(tags, habit.tagIds).map((tag) => tag.name);
}

/** 按名称去重的标签筛选项，保留首次出现的颜色 */
export function tagOptionsFor(tags: Tag[], projectId: string | null): TagOption[] {
  const source = projectId ? tags.filter((tag) => tag.projectId === projectId) : tags;
  const map = new Map<string, TagOption>();
  for (const tag of source) {
    if (!map.has(tag.name)) map.set(tag.name, { name: tag.name, color: tag.color });
  }
  return [...map.values()];
}

export function countProjectHabits(habits: Habit[], projectId: string): number {
  return habits.filter((h) => h.projectId === projectId).length;
}
