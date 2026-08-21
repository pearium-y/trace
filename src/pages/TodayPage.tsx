import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import { HabitCard } from '../components/HabitCard';
import { RecordSheet } from '../components/RecordSheet';
import { Icon } from '../components/Icon';
import { dateLabel, fullDateLabel, today, weekdayLabel } from '../utils/date';
import { computeStreak, dayValue, overallDayRatio } from '../utils/stats';
import type { Habit } from '../types';
import styles from './TodayPage.module.css';

export default function TodayPage({ onCreate }: { onCreate: () => void }) {
  const { db, setRecord, removeRecord } = useStore();
  const [selDate, setSelDate] = useState(today());
  const [editing, setEditing] = useState<{ habitId: string; date: string } | null>(null);
  const [stamp, setStamp] = useState<{ habitId: string; date: string; key: number } | null>(null);

  const t = today();
  const isBackfill = selDate < t;
  const habits = db.habits;
  const due = habits.filter((h) => h.createdAt <= selDate);
  const recordedCount = due.filter((h) => db.records[h.id]?.[selDate]).length;

  const streakSummary = useMemo(() => {
    let bestD = 0;
    let bestW = 0;
    for (const h of habits) {
      const s = computeStreak(h, db.records);
      if (h.frequency === 'daily') {
        if (s.current > bestD) bestD = s.current;
      } else if (s.current > bestW) {
        bestW = s.current;
      }
    }
    if (bestD > 0) return { n: bestD, unit: '天' };
    if (bestW > 0) return { n: bestW, unit: '周' };
    return null;
  }, [habits, db.records]);

  useEffect(() => {
    if (!stamp) return;
    const timer = setTimeout(() => setStamp(null), 1700);
    return () => clearTimeout(timer);
  }, [stamp]);

  const editingHabit = editing ? habits.find((h) => h.id === editing.habitId) : undefined;
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

  const quickAdd = (h: Habit) => {
    const cur = dayValue(db.records, h.id, selDate);
    setRecord(h.id, selDate, cur + 1);
    doStamp(h.id, selDate);
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">
          {isBackfill ? '补录' : '今日'}
          <small>
            {fullDateLabel(selDate)} {weekdayLabel(selDate)}
          </small>
        </h1>
        <input
          className="date-input"
          type="date"
          value={selDate}
          max={t}
          onChange={(e) => e.target.value && setSelDate(e.target.value)}
          aria-label="选择记录日期"
          title="选择日期（可补录过去）"
        />
      </header>

      {isBackfill && (
        <div className={styles.backfillBanner}>
          <Icon name="today" size={15} />
          <span>
            正在补录 <b>{dateLabel(selDate)}</b>（{weekdayLabel(selDate)}）的记录
          </span>
          <button className={styles.backToday} onClick={() => setSelDate(t)}>
            回到今天
          </button>
        </div>
      )}

      {habits.length === 0 ? (
        <div className={`card ${styles.emptyCard}`}>
          <div className="empty-seal">迹</div>
          <p className="muted">纸页还空着，写下第一个计划吧</p>
          <button className="btn btn-primary" onClick={onCreate}>
            <Icon name="plus" size={16} /> 创建第一个计划
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
              <span>今日已记录</span>
            </div>
            {streakSummary && (
              <>
                <div className={styles.sumDivider} />
                <div className={styles.sumItem}>
                  <b className="num">
                    {streakSummary.n}
                    <i>{streakSummary.unit}</i>
                  </b>
                  <span>最佳连续</span>
                </div>
              </>
            )}
            <div className={styles.sumDivider} />
            <div className={styles.sumItem}>
              <b className="num">
                {Math.round(overallDayRatio(habits, db.records, selDate) * 100)}
                <i>%</i>
              </b>
              <span>今日完成度</span>
            </div>
          </div>

          <div className={`${styles.list} stagger`}>
            {due.map((h) => (
              <HabitCard
                key={h.id}
                habit={h}
                records={db.records}
                date={selDate}
                stampKey={stamp && stamp.habitId === h.id && stamp.date === selDate ? stamp.key : undefined}
                onOpen={() => setEditing({ habitId: h.id, date: selDate })}
                onQuickAdd={() => quickAdd(h)}
              />
            ))}
            {due.length === 0 && (
              <p className={`${styles.noneDue} muted`}>
                {isBackfill ? '这一天还没有可记录的计划。' : '暂无待记录的计划。'}
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
    </div>
  );
}
