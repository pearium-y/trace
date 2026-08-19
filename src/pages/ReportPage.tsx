import { useState } from 'react';
import { useStore } from '../store';
import { SectionTitle, Segmented } from '../components/Basics';
import { BarChart } from '../components/BarChart';
import type { Bar } from '../components/BarChart';
import { HeatLegend, MonthHeatmap } from '../components/Heatmap';
import { Icon } from '../components/Icon';
import { HABIT_COLORS } from '../utils/colors';
import {
  addDays,
  addMonths,
  addYears,
  dateLabel,
  dateOf,
  endOfMonth,
  endOfYear,
  rangeDays,
  relativeDayLabel,
  startOfMonth,
  startOfWeek,
  startOfYear,
  today,
  weekdayIndex,
  WEEKDAY_FULL,
  yearOf,
} from '../utils/date';
import { fmtDuration, fmtPct } from '../utils/format';
import { collectNotes, habitRangeStat, hasAnyRecord, heatLevel, overallDayRatio } from '../utils/stats';
import styles from './ReportPage.module.css';

type Dim = 'week' | 'month' | 'year';

export default function ReportPage() {
  const { db } = useStore();
  const [dim, setDim] = useState<Dim>('week');
  const [anchor, setAnchor] = useState(today());
  const t = today();
  const habits = db.habits;
  const ramp = HABIT_COLORS.seal.ramp;

  const range =
    dim === 'week'
      ? {
          start: startOfWeek(anchor),
          end: addDays(startOfWeek(anchor), 6),
          label: `${dateLabel(startOfWeek(anchor))} – ${dateLabel(addDays(startOfWeek(anchor), 6))}`,
        }
      : dim === 'month'
        ? {
            start: startOfMonth(anchor),
            end: endOfMonth(anchor),
            label: `${startOfMonth(anchor).slice(0, 4)}年${Number(startOfMonth(anchor).slice(5, 7))}月`,
          }
        : {
            start: startOfYear(anchor),
            end: endOfYear(anchor),
            label: `${yearOf(anchor)}年`,
          };

  const prevRange =
    dim === 'week'
      ? { start: addDays(startOfWeek(anchor), -7), end: addDays(startOfWeek(anchor), -1) }
      : dim === 'month'
        ? {
            start: addMonths(startOfMonth(anchor), -1),
            end: endOfMonth(addMonths(startOfMonth(anchor), -1)),
          }
        : { start: addYears(startOfYear(anchor), -1), end: endOfYear(addYears(startOfYear(anchor), -1)) };

  const shift = (n: number) => {
    if (dim === 'week') setAnchor(addDays(anchor, n * 7));
    else if (dim === 'month') setAnchor(addMonths(startOfMonth(anchor), n));
    else setAnchor(addYears(startOfYear(anchor), n));
  };

  const nextStart =
    dim === 'week'
      ? addDays(startOfWeek(anchor), 7)
      : dim === 'month'
        ? addMonths(startOfMonth(anchor), 1)
        : addYears(startOfYear(anchor), 1);
  const canNext = nextStart <= t;

  const stats = habits.map((h) => habitRangeStat(h, db.records, range.start, range.end));
  const dueTotal = stats.reduce((s, x) => s + x.due, 0);
  const metTotal = stats.reduce((s, x) => s + x.met, 0);
  const rate = dueTotal > 0 ? metTotal / dueTotal : 0;
  const countTotal = habits.reduce((s, h, i) => (h.goalType === 'duration' ? s : s + stats[i].total), 0);
  const durationTotal = habits.reduce((s, h, i) => (h.goalType === 'duration' ? s + stats[i].total : s), 0);

  const days = rangeDays(range.start, range.end).filter((d) => d <= t);
  const recordedDays = days.filter((d) => hasAnyRecord(db.records, d)).length;

  let longestRun = 0;
  let run = 0;
  for (const d of days) {
    if (hasAnyRecord(db.records, d)) {
      run++;
      if (run > longestRun) longestRun = run;
    } else {
      run = 0;
    }
  }

  let bestDay: string | null = null;
  let bestRatio = 0;
  for (const d of days) {
    const r = overallDayRatio(habits, db.records, d);
    if (r > bestRatio) {
      bestRatio = r;
      bestDay = d;
    }
  }

  const bars: Bar[] =
    dim === 'year'
      ? Array.from({ length: 12 }, (_, m) => {
          const ms = `${yearOf(anchor)}-${String(m + 1).padStart(2, '0')}-01`;
          const ds = rangeDays(ms, endOfMonth(ms)).filter((d) => d <= t);
          const avg =
            ds.length > 0
              ? ds.reduce((s, d) => s + overallDayRatio(habits, db.records, d), 0) / ds.length
              : 0;
          return { label: `${m + 1}月`, value: avg };
        })
      : days.map((d) => ({
          label: dim === 'week' ? WEEKDAY_FULL[weekdayIndex(d)].replace('周', '') : `${dateOf(d)}`,
          value: overallDayRatio(habits, db.records, d),
          highlight: bestDay === d,
        }));

  const rows = habits.map((h, i) => {
    const cur = stats[i];
    const prev = habitRangeStat(h, db.records, prevRange.start, prevRange.end);
    return {
      habit: h,
      stat: cur,
      delta: prev.due > 0 && cur.due > 0 ? cur.rate - prev.rate : null,
    };
  });

  const notes = collectNotes(habits, db.records, range.start, range.end);

  const overallCell = (d: string) => {
    const r = overallDayRatio(habits, db.records, d);
    return { level: heatLevel(r), value: Math.round(r * 100), hasNote: false, text: r > 0 ? `完成 ${fmtPct(r)}` : undefined };
  };

  if (habits.length === 0) {
    return (
      <div>
        <header className="page-header">
          <h1 className="page-title">
            报告<small>REPORT</small>
          </h1>
        </header>
        <div className={`card ${styles.empty}`}>
          <div className="empty-seal">迹</div>
          <p className="muted">创建计划并坚持记录后，这里会长出你的分析报告</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">
          报告<small>REPORT</small>
        </h1>
      </header>

      <Segmented
        value={dim}
        onChange={setDim}
        options={[
          { value: 'week', label: '周报' },
          { value: 'month', label: '月报' },
          { value: 'year', label: '年报' },
        ]}
      />

      <div className={styles.periodNav}>
        <button className={styles.navBtn} onClick={() => shift(-1)} aria-label="上一期">
          <Icon name="chevron-left" size={17} />
        </button>
        <span className={styles.periodLabel}>{range.label}</span>
        <button className={styles.navBtn} disabled={!canNext} onClick={() => shift(1)} aria-label="下一期">
          <Icon name="chevron-right" size={17} />
        </button>
      </div>

      <div className={styles.cardsGrid}>
        <div className={`card ${styles.statCard}`}>
          <b className="num">{fmtPct(rate)}</b>
          <span>总完成率</span>
          <i className={styles.statSub}>{dueTotal > 0 ? `${metTotal}/${dueTotal} 项达成` : '暂无应完成项'}</i>
        </div>
        <div className={`card ${styles.statCard}`}>
          <b className="num">
            {recordedDays}
            <i>天</i>
          </b>
          <span>记录天数</span>
          <i className={styles.statSub}>期间共 {days.length} 天</i>
        </div>
        {countTotal > 0 && (
          <div className={`card ${styles.statCard}`}>
            <b className="num">
              {countTotal}
              <i>次</i>
            </b>
            <span>累计次数</span>
          </div>
        )}
        {durationTotal > 0 && (
          <div className={`card ${styles.statCard}`}>
            <b className="num">{fmtDuration(durationTotal)}</b>
            <span>累计时长</span>
          </div>
        )}
        <div className={`card ${styles.statCard}`}>
          <b className="num">
            {longestRun}
            <i>天</i>
          </b>
          <span>最长连续记录</span>
        </div>
        {bestDay && (
          <div className={`card ${styles.statCard}`}>
            <b className={styles.bestDay}>{dateLabel(bestDay)}</b>
            <span>最佳一日</span>
            <i className={styles.statSub}>完成 {fmtPct(bestRatio)}</i>
          </div>
        )}
      </div>

      {dim === 'month' && (
        <>
          <SectionTitle>本月热力图</SectionTitle>
          <div className={`card ${styles.heatWrap}`}>
            <MonthHeatmap monthStart={startOfMonth(anchor)} cellOf={overallCell} ramp={ramp} />
            <HeatLegend ramp={ramp} />
          </div>
        </>
      )}

      {dim === 'year' && (
        <>
          <SectionTitle>全年概览</SectionTitle>
          <div className={`card ${styles.yearBlocks}`}>
            {bars.map((b, m) => (
              <div
                key={m}
                className={styles.yb}
                style={{ background: ramp[heatLevel(b.value)] }}
                title={`${b.label} 完成 ${fmtPct(b.value)}`}
              >
                <span className="num">{m + 1}月</span>
                <em>{fmtPct(b.value)}</em>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionTitle>{dim === 'year' ? '月度完成度' : '每日完成度'}</SectionTitle>
      <div className={`card ${styles.chartWrap}`}>
        <BarChart bars={bars} height={140} />
      </div>

      <SectionTitle>各计划表现</SectionTitle>
      <div className={styles.habitRows}>
        {rows.map(({ habit: h, stat, delta }) => (
          <div key={h.id} className={`card ${styles.habitRow}`}>
            <span className={styles.hEmoji}>{h.emoji}</span>
            <div className={styles.hInfo}>
              <span className={styles.hName}>{h.name}</span>
              <span className={styles.hMeta}>
                {h.goalType === 'duration' ? fmtDuration(stat.total) : `${stat.total} 次`} · 达成 {stat.met}/{stat.due}
              </span>
            </div>
            <div className={styles.hRight}>
              <b className="num">{fmtPct(stat.rate)}</b>
              {delta === null ? (
                <i className={styles.hDelta}>—</i>
              ) : delta > 0.001 ? (
                <i className={`${styles.hDelta} ${styles.up}`}>↑ {fmtPct(delta)}</i>
              ) : delta < -0.001 ? (
                <i className={`${styles.hDelta} ${styles.down}`}>↓ {fmtPct(Math.abs(delta))}</i>
              ) : (
                <i className={styles.hDelta}>持平</i>
              )}
            </div>
          </div>
        ))}
      </div>

      <SectionTitle>备注回顾</SectionTitle>
      {notes.length === 0 ? (
        <p className="muted">本期没有留下备注。</p>
      ) : (
        <div className={styles.noteList}>
          {notes.map((n, i) => (
            <div key={i} className={`card ${styles.noteItem}`}>
              <span className={styles.noteDate}>{relativeDayLabel(n.date)}</span>
              <span className={styles.noteHabit}>
                {n.habit.emoji} {n.habit.name}
              </span>
              <span className={styles.noteText}>{n.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
