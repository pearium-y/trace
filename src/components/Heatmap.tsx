import { useMemo } from 'react';
import type { DateStr } from '../utils/date';
import { addDays, daysInMonth, monthOf, rangeDays, startOfWeek, today, weekdayIndex } from '../utils/date';
import styles from './Heatmap.module.css';

export interface CellInfo {
  level: number;
  value: number;
  hasNote: boolean;
  /** 悬浮提示中的自定义数值文案（如「完成 67%」） */
  text?: string;
}

export interface YearHeatmapProps {
  end?: DateStr;
  cellOf: (d: DateStr) => CellInfo;
  ramp: [string, string, string, string, string];
  onSelect?: (d: DateStr) => void;
}

/** GitHub 式年度热力图（近一年，周一为行首） */
export function YearHeatmap({ end, cellOf, ramp, onSelect }: YearHeatmapProps) {
  const e = end ?? today();
  const days = useMemo(() => {
    const start = startOfWeek(addDays(e, -364));
    return rangeDays(start, e);
  }, [e]);

  const weeks: DateStr[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const CELL = 12;
  const GAP = 3;
  const STEP = CELL + GAP;
  const LEFT = 26;
  const TOP = 18;
  const width = LEFT + weeks.length * STEP;
  const height = TOP + 7 * STEP;
  const t = today();

  const monthLabels: { x: number; text: string }[] = [];
  let prevM = -1;
  weeks.forEach((w, i) => {
    const m = monthOf(w[0]);
    if (m !== prevM) {
      monthLabels.push({ x: LEFT + i * STEP, text: `${m + 1}月` });
      prevM = m;
    }
  });

  return (
    <div className={styles.scroll}>
      <svg width={width} height={height} className={styles.svg} role="img" aria-label="年度热力图">
        {monthLabels.map((l, i) => (
          <text key={i} x={l.x} y={11} className={styles.mlabel}>
            {l.text}
          </text>
        ))}
        {[0, 2, 4].map((r) => (
          <text key={r} x={LEFT - 8} y={TOP + r * STEP + CELL - 1} textAnchor="end" className={styles.wlabel}>
            {['一', '三', '五'][r / 2]}
          </text>
        ))}
        {weeks.map((w, wi) =>
          w.map((d) => {
            const di = weekdayIndex(d);
            const c = cellOf(d);
            const future = d > t;
            return (
              <rect
                key={d}
                x={LEFT + wi * STEP}
                y={TOP + di * STEP}
                width={CELL}
                height={CELL}
                rx={3}
                fill={future ? 'none' : ramp[c.level]}
                stroke={d === t ? 'var(--seal)' : future ? 'var(--line)' : 'none'}
                strokeWidth={d === t ? 1.6 : 1}
                strokeDasharray={future ? '2 2' : undefined}
                className={onSelect && !future ? styles.cell : undefined}
                onClick={onSelect && !future ? () => onSelect(d) : undefined}
              >
                <title>{`${d}${c.text ?? (c.value > 0 ? ` · ${c.value}` : '')}${c.hasNote ? ' · 有备注' : ''}`}</title>
              </rect>
            );
          }),
        )}
      </svg>
    </div>
  );
}

export interface MonthHeatmapProps {
  /** 该月第一天 */
  monthStart: DateStr;
  cellOf: (d: DateStr) => CellInfo;
  ramp: [string, string, string, string, string];
  onSelect?: (d: DateStr) => void;
}

/** 月历式热力图 */
export function MonthHeatmap({ monthStart, cellOf, ramp, onSelect }: MonthHeatmapProps) {
  const dim = daysInMonth(monthStart);
  const lead = weekdayIndex(monthStart);
  const t = today();
  const cells: (DateStr | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...rangeDays(monthStart, addDays(monthStart, dim - 1)),
  ];

  return (
    <div className={styles.monthgrid}>
      {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
        <div key={w} className={styles.mw}>
          {w}
        </div>
      ))}
      {cells.map((d, i) => {
        if (d === null) return <div key={`blank${i}`} />;
        const c = cellOf(d);
        const future = d > t;
        return (
          <button
            key={d}
            type="button"
            className={styles.mcell}
            style={{ background: future ? 'transparent' : ramp[c.level] }}
            data-today={d === t || undefined}
            data-future={future || undefined}
            onClick={() => !future && onSelect?.(d)}
            title={`${d}${c.text ?? (c.value > 0 ? ` · ${c.value}` : '')}${c.hasNote ? ' · 有备注' : ''}`}
          >
            <span className={styles.mday}>{Number(d.slice(8))}</span>
            {c.hasNote && <i className={styles.dot} />}
          </button>
        );
      })}
    </div>
  );
}

export function HeatLegend({ ramp }: { ramp: [string, string, string, string, string] }) {
  return (
    <div className={styles.legend}>
      <span className="faint">少</span>
      {ramp.map((c) => (
        <i key={c} className={styles.lcell} style={{ background: c }} />
      ))}
      <span className="faint">多</span>
    </div>
  );
}
