import type { CSSProperties } from 'react';
import type { Habit, RecordMap, Tag } from '../types';
import { useStore } from '../store';
import { colorOf } from '../utils/colors';
import { fmtDuration } from '../utils/format';
import { computeStreak, dayRatio, dayValue, isDayMet, weekValueSum } from '../utils/stats';
import { ProgressBar, SealDone, StampSeal } from './Basics';
import { FolderChip, TagChips } from './TagChips';
import { Icon } from './Icon';
import styles from './HabitCard.module.css';

export function HabitCard({
  habit,
  records,
  date,
  stampKey,
  tags = [],
  projectName,
  onOpen,
  onQuickAdd,
}: {
  habit: Habit;
  records: RecordMap;
  date: string;
  /** 盖章动画触发的 key（变更即重放） */
  stampKey?: number;
  tags?: Tag[];
  projectName?: string;
  onOpen: () => void;
  onQuickAdd?: () => void;
}) {
  const { t } = useStore();
  const def = colorOf(habit.color);
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
    const v = habit.goalType === 'duration' ? fmtDuration(wv, t) : t('timesUnit', { n: wv });
    const tgt =
      habit.goalType === 'none'
        ? ''
        : ` / ${habit.goalType === 'duration' ? fmtDuration(habit.target, t) : t('timesUnit', { n: habit.target })}`;
    progressText = `${t('weekly')} ${v}${tgt}`;
  } else {
    ratio = dayRatio(habit, records, date);
    done = isDayMet(habit, records, date);
    if (habit.goalType === 'duration') {
      progressText = `${fmtDuration(value, t)} / ${fmtDuration(habit.target, t)}`;
    } else if (habit.goalType === 'count') {
      progressText = `${value} / ${t('timesUnit', { n: habit.target })}`;
    } else {
      progressText = value > 0 ? t('recorded') : '—';
    }
  }

  const todayPart = isWeekly && value > 0 ? t('dayTotal', { v: valueLabelShort() }) : '';

  function valueLabelShort() {
    return habit.goalType === 'duration' ? fmtDuration(value, t) : t('timesUnit', { n: value });
  }

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
            <span className={styles.freqBadge}>{isWeekly ? t('weekly') : t('daily')}</span>
          )}
        </div>
        <div className={styles.progressRow}>
          <ProgressBar ratio={ratio} color={done ? def.accent : undefined} />
          <span className={`${styles.progressText} num`}>{progressText}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.streak}>
            <Icon name="flame" size={14} />
            {t('streakInline', { n: streak.current, unit: isWeekly ? t('unitWeek') : t('unitDay') })}
          </span>
          {todayPart && <span className={styles.todayPart}>{todayPart}</span>}
        </div>
        {(projectName || tags.length > 0) && (
          <div className={styles.tagRow}>
            {projectName && <FolderChip>{projectName}</FolderChip>}
            <TagChips tags={tags} />
          </div>
        )}
      </button>
      {habit.goalType === 'count' && onQuickAdd && (
        <button
          type="button"
          className={styles.quickAdd}
          style={{ color: def.accent, borderColor: def.accent }}
          onClick={onQuickAdd}
          aria-label={t('quickAdd', { name: habit.name })}
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
