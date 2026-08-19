import styles from './BarChart.module.css';

export interface Bar {
  label: string;
  /** 0..1 */
  value: number;
  hint?: string;
  highlight?: boolean;
}

export function BarChart({ bars, height = 150 }: { bars: Bar[]; height?: number }) {
  if (bars.length === 0) return null;
  const step = Math.max(1, Math.ceil(bars.length / 10));

  return (
    <div className={styles.wrap}>
      <div className={styles.plot} style={{ height }}>
        <div className={styles.gridlines}>
          {[100, 75, 50, 25].map((p) => (
            <i key={p} style={{ bottom: `${p}%` }} />
          ))}
        </div>
        <div className={styles.bars}>
          {bars.map((b, i) => {
            const h = Math.max(0, Math.min(1, b.value)) * 100;
            return (
              <div
                key={i}
                className={styles.col}
                title={`${b.label}${b.hint ?? ` ${Math.round(b.value * 100)}%`}`}
              >
                <div
                  className={`${styles.bar} ${b.highlight ? styles.hl : ''}`}
                  style={{ height: `${h}%`, opacity: h > 0 ? 1 : 0.18 }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.labels}>
        {bars.map((b, i) => (
          <span key={i} className={styles.label}>
            {i % step === 0 || i === bars.length - 1 ? b.label : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
