import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useStore } from '../store';
import { Icon } from '../components/Icon';
import { ListControls } from '../components/ListControls';
import { colorOf, projectLabel } from '../utils/colors';
import { addDays, today } from '../utils/date';
import { habitTagNames, projectOf, tagOptionsFor, tagsOf } from '../utils/entities';
import { fmtPct } from '../utils/format';
import { computeStreak, goalText, habitRangeStat } from '../utils/stats';
import { applyList, emptyFilter } from '../utils/list';
import type { ListFilter, SortKey } from '../utils/list';
import styles from './HabitsPage.module.css';

export default function HabitsPage({
  onOpen,
  onCreate,
}: {
  onOpen: (id: string) => void;
  onCreate: () => void;
}) {
  const { db, t, lang, activeProjectId } = useStore();
  const [sort, setSort] = useState<SortKey>('default');
  const [filter, setFilter] = useState<ListFilter>(emptyFilter());

  const projectHabits = useMemo(
    () => db.habits.filter((h) => !activeProjectId || h.projectId === activeProjectId),
    [db.habits, activeProjectId],
  );

  const list = useMemo(
    () => applyList(projectHabits, db.records, filter, sort, lang, (h) => habitTagNames(db.tags, h)),
    [projectHabits, db.records, db.tags, filter, sort, lang],
  );

  const tagOptions = useMemo(
    () => tagOptionsFor(db.tags, activeProjectId),
    [db.tags, activeProjectId],
  );

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">
          {t('habitsTitle')}
          <small>HABITS</small>
        </h1>
        <button className="btn btn-primary" onClick={onCreate}>
          <Icon name="plus" size={15} /> {t('newHabit')}
        </button>
      </header>

      {projectHabits.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <div className="empty-seal">迹</div>
          <p className="muted">{t('emptyHabits')}</p>
          <button className="btn btn-primary" onClick={onCreate}>
            <Icon name="plus" size={16} /> {t('createHabit')}
          </button>
        </div>
      ) : (
        <>
          <ListControls
            sort={sort}
            onSort={setSort}
            filter={filter}
            onFilter={setFilter}
            tagOptions={tagOptions}
          />

          <div className={`${styles.list} stagger`}>
            {list.map((h) => {
              const def = colorOf(h.color);
              const streak = computeStreak(h, db.records);
              const stat30 = habitRangeStat(h, db.records, addDays(today(), -29), today());
              const recordCount = Object.keys(db.records[h.id] ?? {}).length;
              const project = projectOf(db.projects, h.projectId);
              const tags = tagsOf(db.tags, h.tagIds);
              return (
                <button
                  key={h.id}
                  className={`card tape ${styles.row}`}
                  style={{ '--tape-color': `${def.accent}55` } as CSSProperties}
                  onClick={() => onOpen(h.id)}
                >
                  <span className={styles.emoji} style={{ background: `${def.accent}1e`, borderColor: `${def.accent}55` }}>
                    {h.emoji}
                  </span>
                  <span className={styles.info}>
                    <span className={styles.name}>{h.name}</span>
                    <span className={styles.meta}>
                      {goalText(h, t)} · {t('recordsDays', { n: recordCount })}
                    </span>
                    <span className={styles.meta2}>
                      {t('last30', { pct: fmtPct(stat30.rate) })} ·{' '}
                      {t('streakInline', {
                        n: streak.current,
                        unit: h.frequency === 'daily' ? t('unitDay') : t('unitWeek'),
                      })}
                    </span>
                    {(tags.length > 0 || !activeProjectId) && (
                      <span className={styles.tagRow}>
                        {!activeProjectId && project && (
                          <span className="tagchip">
                            <Icon name="folder" size={11} />
                            {projectLabel(project, t)}
                          </span>
                        )}
                        {tags.map((tag) => {
                          const tdef = colorOf(tag.color);
                          return (
                            <span key={tag.id} className="tagchip">
                              <i className="dot" style={{ background: tdef.accent }} />
                              {tag.name}
                            </span>
                          );
                        })}
                      </span>
                    )}
                  </span>
                  <Icon name="chevron-right" size={17} className={styles.chev} />
                </button>
              );
            })}
            {list.length === 0 && (
              <p className={styles.noMatch}>{t('noMatch')}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
