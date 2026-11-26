import type { Project } from '../types';
import { colorOf } from '../utils/colors';
import { Icon } from './Icon';

export function ProjectMark({ project, size = 24 }: { project?: Project | null; size?: number }) {
  const def = project ? colorOf(project.color) : null;
  return (
    <span
      className="proj-emoji"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.58,
        background: def ? `${def.accent}1e` : 'var(--paper-deep)',
        borderColor: def ? `${def.accent}55` : 'var(--line)',
      }}
    >
      {project ? project.emoji : <Icon name="globe" size={size * 0.6} />}
    </span>
  );
}
