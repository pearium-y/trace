import { useState } from 'react';
import type { StickyNote } from '../types';
import { useStore } from '../store';
import { habitOf } from '../utils/entities';
import { Sheet } from './Sheet';
import { Icon } from './Icon';
import styles from './NoteReminderSheet.module.css';

/** 点击习惯时依次展示关联便签，关闭一张后消除小红点并展示下一张 */
export function NoteReminderSheet({
  notes,
  onFinish,
}: {
  notes: StickyNote[];
  onFinish: () => void;
}) {
  const { db, t, markNoteViewed } = useStore();
  const [index, setIndex] = useState(0);
  const note = notes[index];
  if (!note) return null;

  const habit = note.habitId ? habitOf(db.habits, note.habitId) : undefined;
  const last = index >= notes.length - 1;

  const advance = () => {
    markNoteViewed(note.id);
    if (last) onFinish();
    else setIndex(index + 1);
  };

  return (
    <Sheet
      title={
        <span className={styles.title}>
          <Icon name="bell" size={17} />
          {t('noteReminderTitle')}
          {notes.length > 1 && (
            <span className={styles.counter}>
              {index + 1}/{notes.length}
            </span>
          )}
        </span>
      }
      onClose={advance}
    >
      {habit && (
        <span className="tagchip">
          <Icon name="folder" size={11} />
          {habit.emoji} {habit.name}
        </span>
      )}
      <p className={styles.text}>{note.text}</p>
      <button className="btn btn-primary btn-block" onClick={advance}>
        {last ? t('noteGotIt') : t('noteNext')}
      </button>
    </Sheet>
  );
}
