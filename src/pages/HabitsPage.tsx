import { useStore } from '../store';
import { Icon } from '../components/Icon';
import { HABIT_COLORS } from '../utils/colors';
import { addDays, today } from '../utils/date';
import { fmtPct } from '../utils/format';
import { computeStreak, goalText, habitRangeStat } from '../utils/stats';
import type { CSSProperties } from 'react';
import styles from './HabitsPage.module.css';

export default function HabitsPage({
  onOpen,
  onCreate,
}: {
  onOpen: (id: string) => void;
  onCreate: () => void;
}) {
  const { db } = useStore();
  const habits = db.habits;

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">
          计划<small>HABITS</small>
        </h1>
        <button className="btn btn-primary" onClick={onCreate}>
          <Icon name="plus" size={15} /> 新建
        </button>
      </header>

      {habits.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <div className="empty-seal">迹</div>
          <p className="muted">还没有任何计划</p>
          <button className="btn btn-primary" onClick={onCreate}>
            <Icon name="plus" size={16} /> 创建计划
          </button>
        </div>
      ) : (
        <div className={`${styles.list} stagger`}>
          {habits.map((h) => {
            const def = HABIT_COLORS[h.color];
            const streak = computeStreak(h, db.records);
            const stat30 = habitRangeStat(h, db.records, addDays(today(), -29), today());
            const recordCount = Object.keys(db.records[h.id] ?? {}).length;
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
                    {goalText(h)} · 记录 {recordCount} 天
                  </span>
                  <span className={styles.meta2}>
                    近30天 {fmtPct(stat30.rate)} · 连续 {streak.current}
                    {h.frequency === 'daily' ? ' 天' : ' 周'}
                  </span>
                </span>
                <Icon name="chevron-right" size={17} className={styles.chev} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
