import type { CSSProperties } from 'react';
import type { Habit, RecordMap } from '../types';
import { HABIT_COLORS } from '../utils/colors';
import { fmtDuration } from '../utils/format';
import { computeStreak, dayRatio, dayValue, isDayMet, weekValueSum } from '../utils/stats';
import { ProgressBar, SealDone, StampSeal } from './Basics';
import { Icon } from './Icon';
import styles from './HabitCard.module.css';

export function HabitCard({
  habit,
  records,
  date,
  stampKey,
  onOpen,
  onQuickAdd,
}: {
  habit: Habit;
  records: RecordMap;
  date: string;
  /** 盖章动画触发的 key（变更即重放） */
  stampKey?: number;
  onOpen: () => void;
  onQuickAdd?: () => void;
}) {
  const def = HABIT_COLORS[habit.color];
  const value = dayValue(records, habit.id, date);
  const streak = computeStreak(habit, records);
  const isWeekly = habit.frequency === 'weekly';

  let ratio: number;
  let progressText: string;
  let done: boolean;
  if (isWeekly) {
    const wv = weekValueSum(habit, records, date);
    ratio = habit.goalType === 'none' || habit.target <= 0 ? (wv > 0 ? 1 : 0) : wv / habit.target;
    done = ratio >= 1;
    const v = habit.goalType === 'duration' ? fmtDuration(wv) : `${wv} 次`;
    const tgt =
      habit.goalType === 'none'
        ? ''
        : ` / ${habit.goalType === 'duration' ? fmtDuration(habit.target) : `${habit.target} 次`}`;
    progressText = `本周 ${v}${tgt}`;
  } else {
    ratio = dayRatio(habit, records, date);
    done = isDayMet(habit, records, date);
    if (habit.goalType === 'duration') {
      progressText = `${fmtDuration(value)} / ${fmtDuration(habit.target)}`;
    } else if (habit.goalType === 'count') {
      progressText = `${value} / ${habit.target} 次`;
    } else {
      progressText = value > 0 ? '已记录' : '未记录';
    }
  }

  const todayPart =
    isWeekly && value > 0
      ? `今日 ${habit.goalType === 'duration' ? fmtDuration(value) : `${value} 次`}`
      : '';

  return (
    <div
      className={`card tape ${styles.card}`}
      style={{ '--tape-color': `${def.accent}55` } as CSSProperties}
    >
      <button type="button" className={styles.main} onClick={onOpen}>
        <div className={styles.topRow}>
          <span className={styles.emoji} style={{ background: `${def.accent}1e`, borderColor: `${def.accent}55` }}>
            {habit.emoji}
          </span>
          <span className={styles.name}>{habit.name}</span>
          {done ? (
            <SealDone />
          ) : (
            <span className={styles.freqBadge}>{isWeekly ? '每周' : '每日'}</span>
          )}
        </div>
        <div className={styles.progressRow}>
          <ProgressBar ratio={ratio} color={done ? def.accent : undefined} />
          <span className={`${styles.progressText} num`}>{progressText}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.streak}>
            <Icon name="flame" size={14} />
            连续 {streak.current} {isWeekly ? '周' : '天'}
          </span>
          {todayPart && <span className={styles.todayPart}>{todayPart}</span>}
        </div>
      </button>
      {habit.goalType === 'count' && onQuickAdd && (
        <button
          type="button"
          className={styles.quickAdd}
          style={{ color: def.accent, borderColor: def.accent }}
          onClick={onQuickAdd}
          aria-label={`${habit.name} 记一次`}
        >
          <Icon name="plus" size={19} strokeWidth={2.2} />
        </button>
      )}
      {stampKey !== undefined && (
        <span className={styles.stampWrap} key={stampKey}>
          <StampSeal size={58} />
        </span>
      )}
    </div>
  );
}
