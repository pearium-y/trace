import type { ReactNode } from 'react';
import type { Habit, Tag } from '../types';
import { colorOf } from '../utils/colors';
import { Icon } from './Icon';

/** 一组带颜色圆点的标签胶囊 */
export function TagChips({ tags }: { tags: Tag[] }) {
  return (
    <>
      {tags.map((tag) => {
        const def = colorOf(tag.color);
        return (
          <span key={tag.id} className="tagchip">
            <i className="dot" style={{ background: def.accent }} />
            {tag.name}
          </span>
        );
      })}
    </>
  );
}

/** 带文件夹图标的胶囊，用于项目/关联习惯 */
export function FolderChip({ children }: { children: ReactNode }) {
  return (
    <span className="tagchip">
      <Icon name="folder" size={11} />
      {children}
    </span>
  );
}

export function HabitChip({ habit }: { habit: Habit }) {
  return (
    <FolderChip>
      {habit.emoji} {habit.name}
    </FolderChip>
  );
}
