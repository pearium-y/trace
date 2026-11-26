import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { HabitCard } from '../components/HabitCard';
import { RecordSheet } from '../components/RecordSheet';
import { NoteReminderSheet } from '../components/NoteReminderSheet';
import { ListControls } from '../components/ListControls';
import { Icon } from '../components/Icon';
import { dateLabel, fullDateLabel, today, weekdayLabel } from '../utils/date';
import { computeStreak, dayValue, overallDayRatio } from '../utils/stats';
import { projectLabel } from '../utils/colors';
import { habitTagNames, projectOf, tagOptionsFor, tagsOf } from '../utils/entities';
import { applyList, emptyFilter } from '../utils/list';
import { pendingNotesForHabit } from '../utils/notes';
import type { ListFilter, SortKey } from '../utils/list';
import type { Habit, StickyNote } from '../types';
import styles from './TodayPage.module.css';

export default function TodayPage({ onCreate }: { onCreate: () => void }) {
  const { db, t, lang, activeProjectId, setRecord, removeRecord } = useStore();
  const [selDate, setSelDate] = useState(today());
  const [editing, setEditing] = useState<{ habitId: string; date: string } | null>(null);
  const [stamp, setStamp] = useState<{ habitId: string; date: string; key: number } | null>(null);
  const [sort, setSort] = useState<SortKey>('default');
  const [filter, setFilter] = useState<ListFilter>(emptyFilter());
  const [reminderQueue, setReminderQueue] = useState<StickyNote[] | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const t0 = today();
  const isBackfill = selDate < t0;
  const projectHabits = useMemo(
    () => db.habits.filter((h) => !activeProjectId || h.projectId === activeProjectId),
    [db.habits, activeProjectId],
  );
  const due = projectHabits.filter((h) => h.createdAt <= selDate);

  const list = useMemo(
    () => applyList(due, db.records, filter, sort, lang, (h) => habitTagNames(db.tags, h)),
    [due, db.records, db.tags, filter, sort, lang],
  );

  const tagOptions = useMemo(
    () => tagOptionsFor(db.tags, activeProjectId),
    [db.tags, activeProjectId],
  );

  const recordedCount = due.filter((h) => db.records[h.id]?.[selDate]).length;

  const streakSummary = useMemo(() => {
    let bestD = 0;
    let bestW = 0;
    for (const h of projectHabits) {
      const s = computeStreak(h, db.records);
      if (h.frequency === 'daily') {
        if (s.current > bestD) bestD = s.current;
      } else if (s.current > bestW) {
        bestW = s.current;
      }
    }
    if (bestD > 0) return { n: bestD, unit: t('unitDay') };
    if (bestW > 0) return { n: bestW, unit: t('unitWeek') };
    return null;
  }, [projectHabits, db.records, t]);

  useEffect(() => {
    if (!stamp) return;
    const timer = setTimeout(() => setStamp(null), 1700);
    return () => clearTimeout(timer);
  }, [stamp]);

  const editingHabit = editing ? db.habits.find((h) => h.id === editing.habitId) : undefined;
  const editingRecord = editing ? db.records[editing.habitId]?.[editing.date] : undefined;

  const doStamp = (habitId: string, date: string) => setStamp({ habitId, date, key: Date.now() });

  const handleSave = (value: number, note: string) => {
    if (!editing) return;
    setRecord(editing.habitId, editing.date, value, note);
    doStamp(editing.habitId, editing.date);
    setEditing(null);
  };

  const handleRemove = () => {
    if (!editing) return;
    removeRecord(editing.habitId, editing.date);
    setEditing(null);
  };

  function recordQuickAdd(h: Habit) {
    const cur = dayValue(db.records, h.id, selDate);
    setRecord(h.id, selDate, cur + 1);
    doStamp(h.id, selDate);
  }

  const quickAdd = (h: Habit) => {
    const pending = pendingNotesForHabit(db.notes, h.id);
    if (pending.length > 0) {
      pendingActionRef.current = () => recordQuickAdd(h);
      setReminderQueue(pending);
      return;
    }
    recordQuickAdd(h);
  };

  const finishReminders = () => {
    setReminderQueue(null);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">
          {isBackfill ? t('backfillTitle') : t('todayTitle')}
          <small>
            {fullDateLabel(selDate, lang)} {weekdayLabel(selDate, lang)}
          </small>
        </h1>
        <input
          className="date-input"
          type="date"
          value={selDate}
          max={t0}
          onChange={(e) => e.target.value && setSelDate(e.target.value)}
          aria-label={t('chooseDate')}
          title={t('dateTitle')}
        />
      </header>

      {isBackfill && (
        <div className={styles.backfillBanner}>
          <Icon name="today" size={15} />
          <span>
            {t('backfillBanner', {
              date: `${dateLabel(selDate, lang)} (${weekdayLabel(selDate, lang)})`,
            })}
          </span>
          <button className={styles.backToday} onClick={() => setSelDate(t0)}>
            {t('backToToday')}
          </button>
        </div>
      )}

      {projectHabits.length === 0 ? (
        <div className={`card ${styles.emptyCard}`}>
          <div className="empty-seal">迹</div>
          <p className="muted">{t('emptyToday')}</p>
          <button className="btn btn-primary" onClick={onCreate}>
            <Icon name="plus" size={16} /> {t('createFirstHabit')}
          </button>
        </div>
      ) : (
        <>
          <div className={`card ${styles.summary}`}>
            <div className={styles.sumItem}>
              <b className="num">
                {recordedCount}
                <i>/</i>
                {due.length}
              </b>
              <span>{t('recordedToday')}</span>
            </div>
            {streakSummary && (
              <>
                <div className={styles.sumDivider} />
                <div className={styles.sumItem}>
                  <b className="num">
                    {streakSummary.n}
                    <i>{streakSummary.unit}</i>
                  </b>
                  <span>{t('bestStreak')}</span>
                </div>
              </>
            )}
            <div className={styles.sumDivider} />
            <div className={styles.sumItem}>
              <b className="num">
                {Math.round(overallDayRatio(projectHabits, db.records, selDate) * 100)}
                <i>%</i>
              </b>
              <span>{t('todayCompletion')}</span>
            </div>
          </div>

          <ListControls
            sort={sort}
            onSort={setSort}
            filter={filter}
            onFilter={setFilter}
            tagOptions={tagOptions}
          />

          <div className={`${styles.list} stagger`}>
            {list.map((h) => {
              const project = projectOf(db.projects, h.projectId);
              const tags = tagsOf(db.tags, h.tagIds);
              return (
                <HabitCard
                  key={h.id}
                  habit={h}
                  records={db.records}
                  date={selDate}
                  tags={tags}
                  projectName={activeProjectId ? undefined : project ? projectLabel(project, t) : undefined}
                  stampKey={stamp && stamp.habitId === h.id && stamp.date === selDate ? stamp.key : undefined}
                  onOpen={() => setEditing({ habitId: h.id, date: selDate })}
                  onQuickAdd={() => quickAdd(h)}
                />
              );
            })}
            {list.length === 0 && (
              <p className={`${styles.noneDue} muted`}>
                {due.length === 0
                  ? isBackfill
                    ? t('noneDueBackfill')
                    : t('noneDue')
                  : t('noMatch')}
              </p>
            )}
          </div>
        </>
      )}

      {editing && editingHabit && (
        <RecordSheet
          habit={editingHabit}
          date={editing.date}
          initial={editingRecord ? { value: editingRecord.value, note: editingRecord.note } : undefined}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onRemove={handleRemove}
        />
      )}

      {reminderQueue && reminderQueue.length > 0 && (
        <NoteReminderSheet notes={reminderQueue} onFinish={finishReminders} />
      )}
    </div>
  );
}
