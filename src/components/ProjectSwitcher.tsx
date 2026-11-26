import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useStore } from '../store';
import type { PaletteColor, Project } from '../types';
import { COLOR_KEYS, colorOf, paletteLabel, projectLabel, PROJECT_EMOJIS } from '../utils/colors';
import { countProjectHabits } from '../utils/entities';
import { Sheet } from './Sheet';
import { Icon } from './Icon';
import styles from './ProjectSwitcher.module.css';

function ProjectMark({ project, size = 24 }: { project?: Project | null; size?: number }) {
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

export function ProjectEditor({
  project,
  onClose,
}: {
  project?: Project;
  onClose: () => void;
}) {
  const { db, t, addProject, updateProject, deleteProject } = useStore();
  const [name, setName] = useState(project ? projectLabel(project, t) : '');
  const [emoji, setEmoji] = useState(project?.emoji ?? '🗂️');
  const [color, setColor] = useState<PaletteColor>(project?.color ?? 'indigo');
  const [error, setError] = useState('');

  const builtin = project?.builtin === true;

  const save = () => {
    const n = name.trim();
    if (!n) {
      setError(t('projectNameRequired'));
      return;
    }
    if (project) {
      updateProject(project.id, builtin ? { emoji, color } : { name: n, emoji, color });
    } else {
      addProject({ name: n, emoji, color });
    }
    onClose();
  };

  const remove = () => {
    if (!project || builtin) return;
    const count = countProjectHabits(db.habits, project.id);
    if (window.confirm(t('deleteProjectConfirm', { name: projectLabel(project, t), n: count }))) {
      deleteProject(project.id);
      onClose();
    }
  };

  return (
    <Sheet title={project ? t('editProject') : t('newProject')} onClose={onClose}>
      <div className="field">
        <label className="field-label" htmlFor="proj-name">
          {t('projectName')}
        </label>
        <input
          id="proj-name"
          className="input"
          maxLength={20}
          placeholder={t('projectNamePlaceholder')}
          value={name}
          disabled={builtin}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
        />
        {builtin && <p className={styles.hint}>{t('builtinProjectHint')}</p>}
        {error && <p className="field-error">{error}</p>}
      </div>

      <div className="field">
        <span className="field-label">{t('projectEmoji')}</span>
        <div className={styles.emojiGrid}>
          {PROJECT_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className={`${styles.emojiItem} ${e === emoji ? styles.emojiOn : ''}`}
              onClick={() => setEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">{t('projectColor')}</span>
        <div className="color-row">
          {COLOR_KEYS.map((c) => (
            <button
              key={c}
              type="button"
              className={`color-dot ${c === color ? 'on' : ''}`}
              style={{ background: colorOf(c).accent } as CSSProperties}
              onClick={() => setColor(c)}
              title={paletteLabel(c, t)}
              aria-label={paletteLabel(c, t)}
            />
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        {project && !builtin ? (
          <button className="btn btn-danger" onClick={remove}>
            <Icon name="trash" size={15} /> {t('delete')}
          </button>
        ) : (
          <span />
        )}
        <button className="btn btn-primary" onClick={save}>
          <Icon name="check" size={15} /> {t('save')}
        </button>
      </div>
    </Sheet>
  );
}

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
