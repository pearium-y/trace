import { useState } from 'react';
import { useStore } from '../store';
import type { PaletteColor, Project } from '../types';
import { projectLabel, PROJECT_EMOJIS } from '../utils/colors';
import { countProjectHabits } from '../utils/entities';
import { ColorPicker } from './ColorPicker';
import { Sheet } from './Sheet';
import { Icon } from './Icon';
import styles from './Project.module.css';

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
        <ColorPicker value={color} onChange={setColor} />
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
