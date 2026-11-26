import { useState } from 'react';
import { useStore } from '../store';
import type { PaletteColor, Tag } from '../types';
import { colorOf } from '../utils/colors';
import { ColorPicker } from './ColorPicker';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import styles from './TagSheet.module.css';

function TagForm({
  projectId,
  tag,
  onDone,
}: {
  projectId: string;
  tag?: Tag;
  onDone: () => void;
}) {
  const { db, t, addTag, updateTag } = useStore();
  const [name, setName] = useState(tag?.name ?? '');
  const [color, setColor] = useState<PaletteColor>(tag?.color ?? 'seal');
  const [error, setError] = useState('');

  const submit = () => {
    const n = name.trim();
    if (!n) {
      setError(t('tagNameRequired'));
      return;
    }
    const dup = db.tags.some(
      (x) =>
        x.projectId === projectId &&
        x.id !== tag?.id &&
        x.name.toLowerCase() === n.toLowerCase(),
    );
    if (dup) {
      setError(t('tagExists'));
      return;
    }
    if (tag) {
      updateTag(tag.id, { name: n, color });
    } else {
      addTag(projectId, { name: n, color });
    }
    onDone();
  };

  return (
    <>
      <div className="field">
        <label className="field-label" htmlFor="tag-name">
          {t('tagName')}
        </label>
        <input
          id="tag-name"
          className="input"
          maxLength={12}
          placeholder={t('tagNamePlaceholder')}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
        />
        {error && <p className="field-error">{error}</p>}
      </div>

      <div className="field">
        <span className="field-label">{t('tagColor')}</span>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <div className={styles.footer}>
        <button className="btn btn-ghost" onClick={onDone}>
          {t('back')}
        </button>
        <button className="btn btn-primary" onClick={submit}>
          <Icon name="check" size={15} /> {t('save')}
        </button>
      </div>
    </>
  );
}

export function TagSheet({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { db, t, deleteTag } = useStore();
  const tags = db.tags.filter((tag) => tag.projectId === projectId);
  const [editing, setEditing] = useState<Tag | 'new' | null>(null);

  return (
    <Sheet title={t('manageTags')} onClose={onClose}>
      {editing ? (
        <TagForm
          key={editing === 'new' ? 'new' : editing.id}
          projectId={projectId}
          tag={editing === 'new' ? undefined : editing}
          onDone={() => setEditing(null)}
        />
      ) : (
        <>
          <div className={styles.list}>
            {tags.map((tag) => {
              const def = colorOf(tag.color);
              return (
                <div key={tag.id} className={styles.row}>
                  <i className={styles.dot} style={{ background: def.accent }} />
                  <span className={styles.name}>{tag.name}</span>
                  <button
                    type="button"
                    className={styles.rowBtn}
                    onClick={() => setEditing(tag)}
                    aria-label={t('editTag')}
                  >
                    <Icon name="edit" size={15} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.rowBtn} ${styles.danger}`}
                    onClick={() => {
                      if (window.confirm(t('deleteTagConfirm', { name: tag.name }))) {
                        deleteTag(tag.id);
                      }
                    }}
                    aria-label={t('deleteTag')}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              );
            })}
            {tags.length === 0 && <p className={styles.empty}>{t('noTags')}</p>}
          </div>
          <button className="btn btn-primary btn-block" onClick={() => setEditing('new')}>
            <Icon name="plus" size={15} /> {t('newTag')}
          </button>
        </>
      )}
    </Sheet>
  );
}
