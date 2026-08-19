import { useState } from 'react';
import type { Habit } from '../types';
import { fullDateLabel, relativeDayLabel } from '../utils/date';
import { fmtDuration } from '../utils/format';
import { goalText } from '../utils/stats';
import { Sheet } from './Sheet';
import { Icon } from './Icon';
import styles from './RecordSheet.module.css';

const QUICK_MIN = [15, 30, 45, 60, 90, 120];

export function RecordSheet({
  habit,
  date,
  initial,
  onClose,
  onSave,
  onRemove,
}: {
  habit: Habit;
  date: string;
  initial?: { value: number; note?: string };
  onClose: () => void;
  onSave: (value: number, note: string) => void;
  onRemove?: () => void;
}) {
  const isDuration = habit.goalType === 'duration';
  const isNone = habit.goalType === 'none';
  const [value, setValue] = useState(initial?.value ?? 0);
  const [note, setNote] = useState(initial?.note ?? '');

  const hours = Math.floor(value / 60);
  const mins = value % 60;

  const setDurationParts = (h: number, m: number) => {
    setValue(Math.max(0, Math.min(1440, Math.floor(h) * 60 + Math.floor(m))));
  };

  return (
    <Sheet
      title={
        <span className={styles.title}>
          <span className={styles.emoji}>{habit.emoji}</span>
          {habit.name}
        </span>
      }
      onClose={onClose}
    >
      <div className={styles.date}>
        {relativeDayLabel(date)} · {fullDateLabel(date)}
      </div>

      {isNone ? (
        <div className={styles.noneRow}>
          <button
            type="button"
            className={`${styles.noneBtn} ${value > 0 ? styles.noneOn : ''}`}
            onClick={() => setValue(value > 0 ? 0 : 1)}
          >
            {value > 0 ? (
              <>
                <Icon name="check" size={18} /> 已记录
              </>
            ) : (
              '标记为已记录'
            )}
          </button>
        </div>
      ) : isDuration ? (
        <div className={styles.block}>
          <div className={styles.chips}>
            {QUICK_MIN.map((m) => (
              <button
                key={m}
                type="button"
                className={`${styles.chip} ${value === m ? styles.chipOn : ''}`}
                onClick={() => setValue(m)}
              >
                {m >= 60 ? `${m / 60}小时` : `${m}分`}
              </button>
            ))}
          </div>
          <div className={styles.hmRow}>
            <label className={styles.hmItem}>
              <input
                type="number"
                min={0}
                max={23}
                inputMode="numeric"
                value={hours}
                onChange={(e) => setDurationParts(Number(e.target.value) || 0, mins)}
              />
              <span>小时</span>
            </label>
            <label className={styles.hmItem}>
              <input
                type="number"
                min={0}
                max={59}
                inputMode="numeric"
                value={mins}
                onChange={(e) => setDurationParts(hours, Number(e.target.value) || 0)}
              />
              <span>分钟</span>
            </label>
            <span className={styles.hmTotal}>当日累计 {fmtDuration(value)}</span>
          </div>
        </div>
      ) : (
        <div className={styles.countRow}>
          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => setValue(Math.max(0, value - 1))}
            aria-label="减一"
          >
            −
          </button>
          <input
            className={styles.countInput}
            type="number"
            min={0}
            max={999}
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(Math.max(0, Math.min(999, Math.floor(Number(e.target.value) || 0))))}
          />
          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => setValue(Math.min(999, value + 1))}
            aria-label="加一"
          >
            +
          </button>
          <span className={styles.countUnit}>次</span>
        </div>
      )}

      <div className={styles.hints}>
        <span>目标 · {goalText(habit)}</span>
        {habit.frequency === 'weekly' && <span>按日录入，本周进度自动累计</span>}
      </div>

      <div className={`field ${styles.noteField}`}>
        <label className="field-label" htmlFor="rec-note">
          备注（可选）
        </label>
        <textarea
          id="rec-note"
          className="textarea"
          maxLength={200}
          placeholder="记录这一笔的完成情况…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className={styles.noteCount}>{note.length}/200</div>
      </div>

      <div className={styles.footer}>
        {initial && onRemove ? (
          <button
            className="btn btn-danger"
            onClick={() => {
              onRemove();
            }}
          >
            <Icon name="trash" size={15} /> 删除记录
          </button>
        ) : (
          <span />
        )}
        <button className="btn btn-primary" onClick={() => onSave(value, note.trim())}>
          保存
        </button>
      </div>
    </Sheet>
  );
}
