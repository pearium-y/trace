import { useState } from 'react';
import { useStore } from '../store';
import type { Project } from '../types';
import { projectLabel } from '../utils/colors';
import { countProjectHabits } from '../utils/entities';
import { Icon } from './Icon';
import { ProjectEditor } from './ProjectEditor';
import { ProjectMark } from './ProjectMark';
import { Sheet } from './Sheet';
import styles from './Project.module.css';

/** 移动端顶栏项目切换 */
export function MobileProjectBar() {
  const { db, t, activeProject, activeProjectId, setActiveProject } = useStore();
  const [open, setOpen] = useState(false);
  const [editor, setEditor] = useState<Project | 'new' | null>(null);

  return (
    <>
      <button className="mproj" onClick={() => setOpen(true)} aria-label={t('switchProject')}>
        <ProjectMark project={activeProject} size={22} />
        <span className="proj-name">{activeProject ? projectLabel(activeProject, t) : t('allProjects')}</span>
        <Icon name="chevron-down" size={14} />
      </button>

      {open && (
        <Sheet title={t('switchProject')} onClose={() => setOpen(false)}>
          <div className={styles.list}>
            <button
              type="button"
              className={`proj-row ${!activeProjectId ? 'active' : ''}`}
              onClick={() => {
                setActiveProject(null);
                setOpen(false);
              }}
            >
              <ProjectMark size={32} />
              <span className="p-info">
                <span className="p-name">{t('allProjects')}</span>
                <span className="p-meta">{t('allProjectsHint')}</span>
              </span>
            </button>
            {db.projects.map((p) => (
              <div key={p.id} className={`proj-row ${activeProjectId === p.id ? 'active' : ''}`}>
                <button
                  type="button"
                  className={styles.rowMain}
                  onClick={() => {
                    setActiveProject(p.id);
                    setOpen(false);
                  }}
                >
                  <ProjectMark project={p} size={32} />
                  <span className="p-info">
                    <span className="p-name">{projectLabel(p, t)}</span>
                    <span className="p-meta">
                      {t('projectHabitCount', {
                        n: countProjectHabits(db.habits, p.id),
                      })}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={() => setEditor(p)}
                  aria-label={t('editProject')}
                >
                  <Icon name="edit" size={15} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.addRow}
              onClick={() => setEditor('new')}
            >
              <Icon name="plus" size={16} /> {t('newProject')}
            </button>
          </div>
        </Sheet>
      )}

      {editor && (
        <ProjectEditor
          project={editor === 'new' ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
