import { useState } from 'react';
import { useStore } from '../store';
import type { Project } from '../types';
import { projectLabel } from '../utils/colors';
import { Icon } from './Icon';
import { ProjectEditor } from './ProjectEditor';
import { ProjectMark } from './ProjectMark';

/** 桌面侧栏项目切换 */
export function ProjectNav() {
  const { db, t, activeProjectId, setActiveProject } = useStore();
  const [editor, setEditor] = useState<Project | 'new' | null>(null);

  return (
    <>
      <div className="projnav">
        <div className="projnav-head">
          <span>{t('projects')}</span>
          <button
            type="button"
            className="projnav-add"
            onClick={() => setEditor('new')}
            aria-label={t('newProject')}
            title={t('newProject')}
          >
            <Icon name="plus" size={14} />
          </button>
        </div>
        <button
          type="button"
          className={`proj-item ${!activeProjectId ? 'active' : ''}`}
          onClick={() => setActiveProject(null)}
        >
          <ProjectMark />
          <span className="proj-name">{t('allProjects')}</span>
        </button>
        {db.projects.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`proj-item ${activeProjectId === p.id ? 'active' : ''}`}
            onClick={() => setActiveProject(p.id)}
          >
            <ProjectMark project={p} />
            <span className="proj-name">{projectLabel(p, t)}</span>
          </button>
        ))}
      </div>
      <div className="proj-sep" />
      {editor && (
        <ProjectEditor
          project={editor === 'new' ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
