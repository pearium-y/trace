import { useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import { useStore } from '../store';
import { projectLabel } from '../utils/colors';
import { writeRushDrag } from '../rush';
import type { RushDragPayload } from '../rush';
import { Icon } from './Icon';
import styles from './RushPicker.module.css';

/**
 * 快排习惯选择器：桌面侧栏与移动端抽屉共用。
 * 传入 onPick 时，点击方格即追加；桌面端通过拖拽写入拖拽数据。
 */
export function RushPicker({
  onBack,
  onPick,
}: {
  onBack?: () => void;
  onPick?: (payload: RushDragPayload) => void;
}) {
  const { db, t } = useStore();
  const [query, setQuery] = useState('');
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  const q = query.trim().toLowerCase();

  const groups = useMemo(
    () =>
      db.projects
        .map((project) => ({
          project,
          habits: db.habits.filter(
            (h) => h.projectId === project.id && (!q || h.name.toLowerCase().includes(q)),
          ),
        }))
        .filter((group) => group.habits.length > 0),
    [db.projects, db.habits, q],
  );

  const hasHabits = db.habits.length > 0;

  const startDrag = (e: DragEvent<HTMLElement>, payload: RushDragPayload) => {
    writeRushDrag(e.dataTransfer, payload);
  };

  const pick = (payload: RushDragPayload) => {
    if (onPick) onPick(payload);
  };

  return (
    <div className={styles.wrap}>
      {onBack && (
        <button type="button" className={`sidenav-item ${styles.back}`} onClick={onBack}>
          <Icon name="back" size={18} />
          {t('rushBackHome')}
        </button>
      )}

      <div className={styles.head}>{t('rushPlanSection')}</div>
      <button
        type="button"
        className={styles.breakTile}
        draggable
        onDragStart={(e) => startDrag(e, { kind: 'break' })}
        onClick={() => pick({ kind: 'break' })}
        title={t('rushLongBreakHint')}
      >
        <span className={styles.breakEmoji}>☕</span>
        <span className={styles.breakText}>{t('rushLongBreak')}</span>
      </button>

      {!hasHabits && <p className={styles.empty}>{t('rushNoHabits')}</p>}

      {groups.map(({ project, habits }) => {
        const isClosed = !q && Boolean(closed[project.id]);
        return (
          <div key={project.id} className={styles.group}>
            <button
              type="button"
              className={styles.groupHead}
              onClick={() =>
                setClosed((prev) => ({ ...prev, [project.id]: !prev[project.id] }))
              }
            >
              <span className={styles.groupEmoji}>{project.emoji}</span>
              <span className={styles.groupName}>{projectLabel(project, t)}</span>
              <span className={styles.groupCount}>{habits.length}</span>
              <Icon
                name="chevron-down"
                size={13}
                className={`${styles.chev} ${isClosed ? styles.chevClosed : ''}`}
              />
            </button>
            {!isClosed && (
              <div className={styles.grid}>
                {habits.map((habit) => (
                  <button
                    key={habit.id}
                    type="button"
                    className={styles.tile}
                    draggable
                    onDragStart={(e) => startDrag(e, { kind: 'habit', habitId: habit.id })}
                    onClick={() => pick({ kind: 'habit', habitId: habit.id })}
                    title={habit.name}
                    aria-label={habit.name}
                  >
                    {habit.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {q && groups.length === 0 && <p className={styles.empty}>{t('rushNoMatch')}</p>}

      <div className={styles.searchWrap}>
        <Icon name="search" size={15} />
        <input
          value={query}
          placeholder={t('rushSearchHabits')}
          aria-label={t('rushSearchHabits')}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            className={styles.searchClear}
            onClick={() => setQuery('')}
            aria-label={t('clearSearch')}
          >
            <Icon name="close" size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
