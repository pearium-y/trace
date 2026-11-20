import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useStore } from '../store';
import { HeatLegend, YearHeatmap } from '../components/Heatmap';
import { RecordSheet } from '../components/RecordSheet';
import { SectionTitle } from '../components/Basics';
import { Icon } from '../components/Icon';
import { colorOf, projectLabel, tagLabel } from '../utils/colors';
import { addDays, relativeDayLabel, today } from '../utils/date';
import { fmtDuration, fmtPct } from '../utils/format';
import { computeStreak, dayRatio, dayValue, goalText, habitRangeStat, heatLevel, valueLabel } from '../utils/stats';
import styles from './HabitDetailPage.module.css';

export default function HabitDetailPage({
  habitId,
  onBack,
  onEdit,
}: {
  habitId: string;
  onBack: () => void;
  onEdit: () => void;
}) {
  const { db, t, lang, setRecord, removeRecord } = useStore();
  const [editingDate, setEditingDate] = useState<string | null>(null);

  const habit = db.habits.find((h) => h.id === habitId);

  if (!habit) {
    return (
      <div className="empty">
        <p>{t('habitNotFound')}</p>
        <button className="btn" onClick={onBack}>
          {t('backToList')}
        </button>
      </div>
    );
  }

  const def = colorOf(habit.color);
  const records = db.records[habit.id] ?? {};
  const streak = computeStreak(habit, db.records);
  const stat30 = habitRangeStat(habit, db.records, addDays(today(), -29), today());
  const total = Object.values(records).reduce((s, r) => s + r.value, 0);
  const recordDays = Object.keys(records).length;
  const isWeekly = habit.frequency === 'weekly';
  const unit = isWeekly ? t('unitWeek') : t('unitDay');
  const project = db.projects.find((p) => p.id === habit.projectId);
  const tags = habit.tagIds
    .map((id) => db.tags.find((tag) => tag.id === id))
    .filter((tag) => !!tag);

  const cellOf = (d: string) => {
    const v = dayValue(db.records, habit.id, d);
    return {
      level: heatLevel(dayRatio(habit, db.records, d)),
      value: v,
      hasNote: !!records[d]?.note,
      text: v > 0 ? valueLabel(habit, v, t) : undefined,
    };
  };

  const recent = Object.entries(records)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 30);

  const editingRecord = editingDate ? records[editingDate] : undefined;

  return (
    <div>
      <header className="subheader">
        <button className="icon-btn" onClick={onBack} aria-label={t('back')}>
          <Icon name="back" />
        </button>
        <div className="subheader-title">
          {habit.emoji} {habit.name}
        </div>
        <button className="icon-btn" onClick={onEdit} aria-label={t('edit')} title={t('edit')}>
          <Icon name="edit" />
        </button>
      </header>

      <section className={`card tape ${styles.heatCard}`} style={{ '--tape-color': `${def.accent}55` } as CSSProperties}>
        <p className={styles.goalLine}>
          {goalText(habit, t)} · {t('createdOn', { date: habit.createdAt })}
        </p>
        {(project || tags.length > 0) && (
          <div className={styles.tagRow}>
            {project && (
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
                  {tagLabel(tag, t)}
                </span>
              );
            })}
          </div>
        )}
        <YearHeatmap cellOf={cellOf} ramp={def.ramp} onSelect={(d) => setEditingDate(d)} lang={lang} />
        <HeatLegend ramp={def.ramp} />
      </section>

      {habit.notes && (
        <>
          <SectionTitle>{t('habitNotesTitle')}</SectionTitle>
          <div className={`card ${styles.habitNote}`}>
            <Icon name="note" size={15} />
            <p>{habit.notes}</p>
          </div>
        </>
      )}

      <SectionTitle>{t('statsTitle')}</SectionTitle>
      <div className={styles.statsGrid}>
        <div className={`card ${styles.stat}`}>
          <b className="num">
            {streak.current}
            <i>{unit}</i>
          </b>
          <span>{t('currentStreak')}</span>
        </div>
        <div className={`card ${styles.stat}`}>
          <b className="num">
            {streak.longest}
            <i>{unit}</i>
          </b>
          <span>{t('longestStreak')}</span>
        </div>
        <div className={`card ${styles.stat}`}>
          <b className="num">
            {habit.goalType === 'duration' ? fmtDuration(total, t) : `${total}`}
            <i>{habit.goalType === 'duration' ? '' : habit.goalType === 'count' ? t('unitTimes') : ''}</i>
          </b>
          <span>{habit.goalType === 'duration' ? t('totalDurationStat') : t('totalRecordStat')}</span>
        </div>
        <div className={`card ${styles.stat}`}>
          <b className="num">{fmtPct(stat30.rate)}</b>
          <span>{t('rate30')}</span>
        </div>
      </div>
      <p className={`${styles.recordDays} faint`}>{t('recordDaysLine', { n: recordDays })}</p>

      <SectionTitle>{t('recentRecords')}</SectionTitle>
      {recent.length === 0 ? (
        <p className="muted">{t('noRecordsYet')}</p>
      ) : (
        <div className={styles.recentList}>
          {recent.map(([date, rec]) => (
            <button key={date} type="button" className={`card ${styles.recentItem}`} onClick={() => setEditingDate(date)}>
              <span className={`${styles.recentDate} num`}>{relativeDayLabel(date, lang)}</span>
              <span className={`${styles.recentValue} num`}>{valueLabel(habit, rec.value, t)}</span>
              {rec.note && <span className={styles.recentNote}>{rec.note}</span>}
              <Icon name="edit" size={14} className={styles.recentEdit} />
            </button>
          ))}
        </div>
      )}

      {editingDate && (
        <RecordSheet
          habit={habit}
          date={editingDate}
          initial={editingRecord ? { value: editingRecord.value, note: editingRecord.note } : undefined}
          onClose={() => setEditingDate(null)}
          onSave={(v, n) => {
            setRecord(habit.id, editingDate, v, n);
            setEditingDate(null);
          }}
          onRemove={() => {
            removeRecord(habit.id, editingDate);
            setEditingDate(null);
          }}
        />
      )}
    </div>
  );
}
