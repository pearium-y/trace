import { useState } from 'react';
import { useStore } from '../store';
import { SectionTitle, Segmented } from '../components/Basics';
import { BarChart } from '../components/BarChart';
import type { Bar } from '../components/BarChart';
import { HeatLegend, MonthHeatmap } from '../components/Heatmap';
import { Icon } from '../components/Icon';
import { colorOf } from '../utils/colors';
import {
  addDays,
  addMonths,
  addYears,
  dateLabel,
  dateOf,
  endOfMonth,
  endOfYear,
  monthOf,
  monthShort,
  rangeDays,
  relativeDayLabel,
  startOfMonth,
  startOfWeek,
  startOfYear,
  today,
  weekdayLabel,
  yearOf,
} from '../utils/date';
import { fmtDuration, fmtPct } from '../utils/format';
import { collectNotes, habitRangeStat, hasAnyRecord, heatLevel, overallDayRatio } from '../utils/stats';
import styles from './ReportPage.module.css';

type Dim = 'week' | 'month' | 'year';

export default function ReportPage() {
  const { db, t, lang, activeProjectId } = useStore();
  const [dim, setDim] = useState<Dim>('week');
  const [anchor, setAnchor] = useState(today());
  const t0 = today();
  const habits = db.habits.filter((h) => !activeProjectId || h.projectId === activeProjectId);
  const ramp = colorOf('seal').ramp;

  const range =
    dim === 'week'
      ? {
          start: startOfWeek(anchor),
          end: addDays(startOfWeek(anchor), 6),
          label: `${dateLabel(startOfWeek(anchor), lang)} – ${dateLabel(addDays(startOfWeek(anchor), 6), lang)}`,
        }
      : dim === 'month'
        ? {
            start: startOfMonth(anchor),
            end: endOfMonth(anchor),
            label:
              lang === 'en'
                ? `${monthShort(monthOf(anchor), lang)} ${yearOf(anchor)}`
                : `${yearOf(anchor)}年${monthOf(anchor) + 1}月`,
          }
        : {
            start: startOfYear(anchor),
            end: endOfYear(anchor),
            label: lang === 'en' ? `${yearOf(anchor)}` : `${yearOf(anchor)}年`,
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
  const canNext = nextStart <= t0;

  const stats = habits.map((h) => habitRangeStat(h, db.records, range.start, range.end));
  const dueTotal = stats.reduce((s, x) => s + x.due, 0);
  const metTotal = stats.reduce((s, x) => s + x.met, 0);
  const rate = dueTotal > 0 ? metTotal / dueTotal : 0;
  const countTotal = habits.reduce((s, h, i) => (h.goalType === 'duration' ? s : s + stats[i].total), 0);
  const durationTotal = habits.reduce((s, h, i) => (h.goalType === 'duration' ? s + stats[i].total : s), 0);

  const days = rangeDays(range.start, range.end).filter((d) => d <= t0);
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
          const ds = rangeDays(ms, endOfMonth(ms)).filter((d) => d <= t0);
          const avg =
            ds.length > 0
              ? ds.reduce((s, d) => s + overallDayRatio(habits, db.records, d), 0) / ds.length
              : 0;
          return { label: monthShort(m, lang), value: avg };
        })
      : days.map((d) => ({
          label:
            dim === 'week'
              ? weekdayLabel(d, lang).replace('周', '')
              : `${dateOf(d)}`,
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
    return { level: heatLevel(r), value: Math.round(r * 100), hasNote: false, text: r > 0 ? t('completionPct', { pct: fmtPct(r) }) : undefined };
  };

  if (habits.length === 0) {
    return (
      <div>
        <header className="page-header">
          <h1 className="page-title">
            {t('reportTitle')}
            <small>REPORT</small>
          </h1>
        </header>
        <div className={`card ${styles.empty}`}>
          <div className="empty-seal">迹</div>
          <p className="muted">{t('reportEmpty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">
          {t('reportTitle')}
          <small>REPORT</small>
        </h1>
      </header>

      <Segmented
        value={dim}
        onChange={setDim}
        options={[
          { value: 'week', label: t('reportWeek') },
          { value: 'month', label: t('reportMonth') },
          { value: 'year', label: t('reportYear') },
        ]}
      />

      <div className={styles.periodNav}>
        <button className={styles.navBtn} onClick={() => shift(-1)} aria-label={t('prevPeriod')}>
          <Icon name="chevron-left" size={17} />
        </button>
        <span className={styles.periodLabel}>{range.label}</span>
        <button className={styles.navBtn} disabled={!canNext} onClick={() => shift(1)} aria-label={t('nextPeriod')}>
          <Icon name="chevron-right" size={17} />
        </button>
      </div>

      <div className={styles.cardsGrid}>
        <div className={`card ${styles.statCard}`}>
          <b className="num">{fmtPct(rate)}</b>
          <span>{t('totalRate')}</span>
          <i className={styles.statSub}>
            {dueTotal > 0 ? t('itemsMet', { met: metTotal, due: dueTotal }) : t('noDueItems')}
          </i>
        </div>
        <div className={`card ${styles.statCard}`}>
          <b className="num">
            {recordedDays}
            <i>{t('unitDay')}</i>
          </b>
          <span>{t('recordedDaysCard')}</span>
          <i className={styles.statSub}>{t('ofDays', { n: days.length })}</i>
        </div>
        {countTotal > 0 && (
          <div className={`card ${styles.statCard}`}>
            <b className="num">
              {countTotal}
              <i>{t('unitTimes')}</i>
            </b>
            <span>{t('totalCount')}</span>
          </div>
        )}
        {durationTotal > 0 && (
          <div className={`card ${styles.statCard}`}>
            <b className="num">{fmtDuration(durationTotal, t)}</b>
            <span>{t('totalDurationStat')}</span>
          </div>
        )}
        <div className={`card ${styles.statCard}`}>
          <b className="num">
            {longestRun}
            <i>{t('unitDay')}</i>
          </b>
          <span>{t('longestRun')}</span>
        </div>
        {bestDay && (
          <div className={`card ${styles.statCard}`}>
            <b className={styles.bestDay}>{dateLabel(bestDay, lang)}</b>
            <span>{t('bestDay')}</span>
            <i className={styles.statSub}>{t('completionPct', { pct: fmtPct(bestRatio) })}</i>
          </div>
        )}
      </div>

      {dim === 'month' && (
        <>
          <SectionTitle>{t('monthHeatmap')}</SectionTitle>
          <div className={`card ${styles.heatWrap}`}>
            <MonthHeatmap monthStart={startOfMonth(anchor)} cellOf={overallCell} ramp={ramp} lang={lang} />
            <HeatLegend ramp={ramp} />
          </div>
        </>
      )}

      {dim === 'year' && (
        <>
          <SectionTitle>{t('yearOverview')}</SectionTitle>
          <div className={`card ${styles.yearBlocks}`}>
            {bars.map((b, m) => (
              <div
                key={m}
                className={styles.yb}
                style={{ background: ramp[heatLevel(b.value)] }}
                title={`${b.label} ${t('completionPct', { pct: fmtPct(b.value) })}`}
              >
                <span className="num">{monthShort(m, lang)}</span>
                <em>{fmtPct(b.value)}</em>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionTitle>{dim === 'year' ? t('monthlyCompletion') : t('dailyCompletion')}</SectionTitle>
      <div className={`card ${styles.chartWrap}`}>
        <BarChart bars={bars} height={140} />
      </div>

      <SectionTitle>{t('habitPerformance')}</SectionTitle>
      <div className={styles.habitRows}>
        {rows.map(({ habit: h, stat, delta }) => (
          <div key={h.id} className={`card ${styles.habitRow}`}>
            <span className={styles.hEmoji}>{h.emoji}</span>
            <div className={styles.hInfo}>
              <span className={styles.hName}>{h.name}</span>
              <span className={styles.hMeta}>
                {h.goalType === 'duration' ? fmtDuration(stat.total, t) : `${stat.total} ${t('unitTimes')}`} ·{' '}
                {t('achieved', { met: stat.met, due: stat.due })}
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
                <i className={styles.hDelta}>{t('flat')}</i>
              )}
            </div>
          </div>
        ))}
      </div>

      <SectionTitle>{t('notesReview')}</SectionTitle>
      {notes.length === 0 ? (
        <p className="muted">{t('noNotes')}</p>
      ) : (
        <div className={styles.noteList}>
          {notes.map((n, i) => (
            <div key={i} className={`card ${styles.noteItem}`}>
              <span className={styles.noteDate}>{relativeDayLabel(n.date, lang)}</span>
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
