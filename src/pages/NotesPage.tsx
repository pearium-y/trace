import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useStore } from '../store';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { Switch } from '../components/Basics';
import { colorOf } from '../utils/colors';
import { fullDateLabel } from '../utils/date';
import { isNotePending } from '../utils/notes';
import type { PaletteColor, StickyNote } from '../types';
import styles from './NotesPage.module.css';

const NOTE_COLORS: PaletteColor[] = ['seal', 'ochre', 'bamboo', 'indigo', 'wisteria'];

export default function NotesPage() {
  const { db, t, deleteNote } = useStore();
  const [editing, setEditing] = useState<StickyNote | 'new' | null>(null);
  const [viewing, setViewing] = useState<StickyNote | null>(null);

  const habitOf = (id?: string) => (id ? db.habits.find((h) => h.id === id) : undefined);

  const list = useMemo(
    () =>
      [...db.notes].sort(
        (a, b) =>
          Number(isNotePending(b)) - Number(isNotePending(a)) ||
          b.createdAt.localeCompare(a.createdAt) ||
          b.updatedAt - a.updatedAt,
      ),
    [db.notes],
  );

  const pendingCount = list.filter((n) => isNotePending(n)).length;
  const viewingHabit = viewing ? habitOf(viewing.habitId) : undefined;

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">
          {t('notesTitle')}
          <small>NOTES</small>
        </h1>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          <Icon name="plus" size={15} /> {t('newNote')}
        </button>
      </header>

      {list.length > 0 && (
        <p className={styles.summary}>
          {t('notesCount', { n: list.length })}
          {pendingCount > 0 && (
            <span className={styles.summaryDot}>{t('notesPending', { n: pendingCount })}</span>
          )}
        </p>
      )}

      {list.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <div className="empty-seal">便</div>
          <p className="muted">{t('notesEmpty')}</p>
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <Icon name="plus" size={16} /> {t('createNote')}
          </button>
        </div>
      ) : (
        <div className={`${styles.grid} stagger`}>
          {list.map((note) => {
            const def = colorOf(note.color);
            const habit = habitOf(note.habitId);
            const pending = isNotePending(note);
            return (
              <button
                key={note.id}
                type="button"
                className={`${styles.note} ${pending ? styles.notePending : ''}`}
                style={
                  {
                    '--note-color': def.accent,
                    background: `${def.accent}10`,
                    borderColor: `${def.accent}4d`,
                  } as CSSProperties
                }
                onClick={() => setViewing(note)}
              >
                {pending && <span className={styles.dot} aria-label={t('noteReminderTag')} />}
                <span className={styles.text}>{note.text}</span>
                <span className={styles.foot}>
                  {habit && (
                    <span className="tagchip">
                      <Icon name="folder" size={11} />
                      {habit.emoji} {habit.name}
                    </span>
                  )}
                  {note.remind && (
                    <span className={`${styles.bell} ${pending ? styles.bellOn : ''}`}>
                      <Icon name="bell" size={12} />
                      {pending ? t('noteReminderTag') : t('noteViewed')}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {viewing && (
        <Sheet title={t('notesWall')} onClose={() => setViewing(null)}>
          <div className={styles.detail}>
            <p className={styles.detailText}>{viewing.text}</p>
            <div className={styles.detailMeta}>
              {viewingHabit && (
                <span className="tagchip">
                  <Icon name="folder" size={11} />
                  {viewingHabit.emoji} {viewingHabit.name}
                </span>
              )}
              {viewing.remind && (
                <span className="tagchip">
                  <Icon name="bell" size={11} />
                  {t('noteReminderTag')}
                </span>
              )}
              <span className="faint">{t('noteCreatedAt', { date: fullDateLabel(viewing.createdAt) })}</span>
            </div>
            <div className={styles.detailFoot}>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (!window.confirm(t('noteDeleteConfirm'))) return;
                  deleteNote(viewing.id);
                  setViewing(null);
                }}
              >
                <Icon name="trash" size={15} /> {t('noteDelete')}
              </button>
              <span className="grow" />
              <button className="btn btn-ghost" onClick={() => setViewing(null)}>
                {t('close')}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditing(viewing);
                  setViewing(null);
                }}
              >
                <Icon name="edit" size={15} /> {t('edit')}
              </button>
            </div>
          </div>
        </Sheet>
      )}

      {editing && (
        <NoteEditor note={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function NoteEditor({ note, onClose }: { note?: StickyNote; onClose: () => void }) {
  const { db, t, addNote, updateNote, deleteNote } = useStore();
  const [text, setText] = useState(note?.text ?? '');
  const [color, setColor] = useState<PaletteColor>(note?.color ?? 'seal');
  const [remind, setRemind] = useState(note?.remind ?? false);
  const [habitId, setHabitId] = useState(note?.habitId ?? '');
  const [error, setError] = useState('');

  const save = () => {
    const value = text.trim();
    if (!value) {
      setError(t('noteTextRequired'));
      return;
    }
    const input = { text: value, color, remind, habitId: habitId || undefined };
    if (note) updateNote(note.id, input);
    else addNote(input);
    onClose();
  };

  const remove = () => {
    if (!note) return;
    if (!window.confirm(t('noteDeleteConfirm'))) return;
    deleteNote(note.id);
    onClose();
  };

  return (
    <Sheet title={note ? t('editNote') : t('createNote')} onClose={onClose}>
      <div className="field">
        <label className="field-label" htmlFor="note-text">
          {t('noteText')}
        </label>
        <textarea
          id="note-text"
          className="textarea"
          maxLength={500}
          placeholder={t('noteTextPlaceholder')}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError('');
          }}
        />
        <div className={styles.counter}>{text.length}/500</div>
        {error && <p className="field-error">{error}</p>}
      </div>

      <div className="field">
        <span className="field-label">{t('noteColor')}</span>
        <div className="color-row">
          {NOTE_COLORS.map((c) => {
            const def = colorOf(c);
            return (
              <button
                key={c}
                type="button"
                className={`color-dot ${c === color ? 'on' : ''}`}
                style={{ background: def.accent }}
                aria-label={t(`palette_${c}`)}
                title={t(`palette_${c}`)}
                onClick={() => setColor(c)}
              />
            );
          })}
        </div>
      </div>

      <div className={`field ${styles.switchField}`}>
        <span className={styles.switchCopy}>
          <b>{t('noteReminder')}</b>
          <i>{t('noteReminderHint')}</i>
        </span>
        <Switch checked={remind} onChange={setRemind} label={t('noteReminder')} />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="note-habit">
          {t('noteHabit')}
        </label>
        <select
          id="note-habit"
          className="select"
          value={habitId}
          onChange={(e) => setHabitId(e.target.value)}
        >
          <option value="">{t('noteHabitNone')}</option>
          {db.habits.map((h) => (
            <option key={h.id} value={h.id}>
              {h.emoji} {h.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.editorFoot}>
        {note ? (
          <button className="btn btn-danger" onClick={remove} aria-label={t('noteDelete')}>
            <Icon name="trash" size={15} />
          </button>
        ) : (
          <span />
        )}
        <span className="grow" />
        <button className="btn btn-ghost" onClick={onClose}>
          {t('cancel')}
        </button>
        <button className="btn btn-primary" onClick={save}>
          {t('noteSave')}
        </button>
      </div>
    </Sheet>
  );
}
