import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useStore } from '../store';
import { HeatLegend, YearHeatmap } from '../components/Heatmap';
import { RecordSheet } from '../components/RecordSheet';
import { SectionTitle } from '../components/Basics';
import { Icon } from '../components/Icon';
import { HABIT_COLORS } from '../utils/colors';
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
  const { db, setRecord, removeRecord } = useStore();
  const [editingDate, setEditingDate] = useState<string | null>(null);

  const habit = db.habits.find((h) => h.id === habitId);

  if (!habit) {
    return (
      <div className="empty">
        <p>该计划不存在或已被删除</p>
        <button className="btn" onClick={onBack}>
          返回计划列表
        </button>
      </div>
    );
  }

  const def = HABIT_COLORS[habit.color];
  const records = db.records[habit.id] ?? {};
  const streak = computeStreak(habit, db.records);
  const stat30 = habitRangeStat(habit, db.records, addDays(today(), -29), today());
  const total = Object.values(records).reduce((s, r) => s + r.value, 0);
  const recordDays = Object.keys(records).length;
  const isWeekly = habit.frequency === 'weekly';
  const unit = isWeekly ? '周' : '天';

  const cellOf = (d: string) => {
    const v = dayValue(db.records, habit.id, d);
    return {
      level: heatLevel(dayRatio(habit, db.records, d)),
      value: v,
      hasNote: !!records[d]?.note,
      text: v > 0 ? valueLabel(habit, v) : undefined,
    };
  };

  const recent = Object.entries(records)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 30);

  const editingRecord = editingDate ? records[editingDate] : undefined;

  return (
    <div>
      <header className="subheader">
        <button className="icon-btn" onClick={onBack} aria-label="返回">
          <Icon name="back" />
        </button>
        <div className="subheader-title">
          {habit.emoji} {habit.name}
        </div>
        <button className="icon-btn" onClick={onEdit} aria-label="编辑计划" title="编辑计划">
          <Icon name="edit" />
        </button>
      </header>

      <section className={`card tape ${styles.heatCard}`} style={{ '--tape-color': `${def.accent}55` } as CSSProperties}>
        <p className={styles.goalLine}>{goalText(habit)} · 创建于 {habit.createdAt}</p>
        <YearHeatmap cellOf={cellOf} ramp={def.ramp} onSelect={(d) => setEditingDate(d)} />
        <HeatLegend ramp={def.ramp} />
      </section>

      <SectionTitle>统计</SectionTitle>
      <div className={styles.statsGrid}>
        <div className={`card ${styles.stat}`}>
          <b className="num">
            {streak.current}
            <i>{unit}</i>
          </b>
          <span>当前连续</span>
        </div>
        <div className={`card ${styles.stat}`}>
          <b className="num">
            {streak.longest}
            <i>{unit}</i>
          </b>
          <span>最长连续</span>
        </div>
        <div className={`card ${styles.stat}`}>
          <b className="num">
            {habit.goalType === 'duration' ? fmtDuration(total) : `${total}`}
            <i>{habit.goalType === 'duration' ? '' : habit.goalType === 'count' ? '次' : '笔'}</i>
          </b>
          <span>{habit.goalType === 'duration' ? '累计时长' : '累计记录'}</span>
        </div>
        <div className={`card ${styles.stat}`}>
          <b className="num">{fmtPct(stat30.rate)}</b>
          <span>近30天完成率</span>
        </div>
      </div>
      <p className={`${styles.recordDays} faint`}>共记录 {recordDays} 天 · 点击热力图任意格子可补录当天</p>

      <SectionTitle>近期记录</SectionTitle>
      {recent.length === 0 ? (
        <p className="muted">暂无记录，从今日页或热力图开始第一笔。</p>
      ) : (
        <div className={styles.recentList}>
          {recent.map(([date, rec]) => (
            <button key={date} type="button" className={`card ${styles.recentItem}`} onClick={() => setEditingDate(date)}>
              <span className={`${styles.recentDate} num`}>{relativeDayLabel(date)}</span>
              <span className={`${styles.recentValue} num`}>{valueLabel(habit, rec.value)}</span>
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
