import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { useStore } from '../store';
import { RecordSheet } from '../components/RecordSheet';
import { RushPicker } from '../components/RushPicker';
import { Sheet } from '../components/Sheet';
import { Icon } from '../components/Icon';
import { fullDateLabel, today, weekdayLabel } from '../utils/date';
import { colorOf } from '../utils/colors';
import { habitOf } from '../utils/entities';
import { downloadFile } from '../utils/download';
import { buildRushICS } from '../utils/ics';
import {
  DAY_MINUTES,
  DEFAULT_BREAK_MINUTES,
  DEFAULT_HABIT_MINUTES,
  appendStart,
  computeSchedule,
  createBreakItem,
  createHabitItem,
  keepKnownHabits,
  loadRushPlan,
  minutesToHHMM,
  nowMinutes,
  parseHHMM,
  readRushDrag,
  saveRushPlan,
} from '../rush';
import type { RushBlock, RushDragPayload, RushPlan } from '../rush';
import type { Habit } from '../types';
import styles from './RushPage.module.css';

const PX_PER_MIN = 96 / 60;
const PX_PER_HOUR = 96;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

export default function RushPage() {
  const { db, lang, t, setRecord, removeRecord } = useStore();
  const [plan, setPlan] = useState<RushPlan | null>(() => loadRushPlan());
  const [now, setNow] = useState(nowMinutes);
  const [startInput, setStartInput] = useState('08:00');
  const [editMode, setEditMode] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [dropHere, setDropHere] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);

  const commit = useCallback((next: RushPlan | null) => {
    setPlan(next);
    saveRushPlan(next);
  }, []);

  // 习惯被删除后清理计划中的失效引用
  useEffect(() => {
    if (!plan) return;
    const ids = new Set(db.habits.map((h) => h.id));
    const items = keepKnownHabits(plan.items, ids);
    if (items.length !== plan.items.length) commit({ ...plan, items });
  }, [db.habits, plan, commit]);

  // 标记过期状态并跨天自动清空
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(nowMinutes());
      setPlan((prev) => {
        if (prev && prev.date !== today()) {
          saveRushPlan(null);
          return null;
        }
        return prev;
      });
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!msg) return;
    const timer = setTimeout(() => setMsg(''), 2800);
    return () => clearTimeout(timer);
  }, [msg]);

  // 首次进入时滚动到计划开始时间附近
  useEffect(() => {
    if (!plan || scrolledRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = Math.max(0, plan.startMin * PX_PER_MIN - 48);
    scrolledRef.current = true;
  }, [plan]);

  const blocks = useMemo(() => (plan ? computeSchedule(plan) : []), [plan]);
  const dragging = dragFrom !== null;

  const moveItem = useCallback(
    (from: number, to: number) => {
      if (!plan || from === to) return;
      const items = [...plan.items];
      const [moved] = items.splice(from, 1);
      if (!moved) return;
      items.splice(to, 0, moved);
      commit({ ...plan, items });
    },
    [plan, commit],
  );

  const toggleEdit = () => {
    setEditingId(null);
    setRecordingId(null);
    setPickerOpen(false);
    setDragFrom(null);
    setOverIndex(null);
    setEditMode((v) => !v);
  };

  const append = useCallback(
    (payload: RushDragPayload) => {
      if (!plan) {
        setMsg(t('rushSetStartFirst'));
        return;
      }
      if (editMode) return;
      if (payload.kind === 'habit' && !db.habits.some((h) => h.id === payload.habitId)) return;
      const start = appendStart(plan, payload.kind);
      const available = DAY_MINUTES - start;
      if (available < 1) {
        setMsg(t('rushFull'));
        return;
      }
      const wanted = payload.kind === 'habit' ? DEFAULT_HABIT_MINUTES : DEFAULT_BREAK_MINUTES;
      const duration = Math.min(wanted, available);
      const item =
        payload.kind === 'habit'
          ? createHabitItem(payload.habitId, duration)
          : createBreakItem(duration);
      commit({ ...plan, items: [...plan.items, item] });
      setMsg('');
    },
    [plan, db.habits, editMode, t, commit],
  );

  const onCanvasDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (editMode && dragFrom === null) return;
    e.preventDefault();
    if (dragFrom === null) {
      e.dataTransfer.dropEffect = 'copy';
      setDropHere(true);
    }
  };

  const onCanvasDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDropHere(false);
  };

  const onCanvasDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropHere(false);
    if (dragFrom !== null) {
      if (plan && dragFrom !== plan.items.length - 1) moveItem(dragFrom, plan.items.length - 1);
      setDragFrom(null);
      setOverIndex(null);
      return;
    }
    if (editMode) return;
    const payload = readRushDrag(e.dataTransfer);
    if (payload) append(payload);
  };

  const onBlockDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    if (!editMode) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    setDragFrom(index);
  };

  const onBlockDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    if (dragFrom === null) return;
    e.preventDefault();
    e.stopPropagation();
    setOverIndex(index);
  };

  const onBlockDrop = (e: DragEvent<HTMLDivElement>, index: number) => {
    if (dragFrom === null) return;
    e.preventDefault();
    e.stopPropagation();
    moveItem(dragFrom, index);
    setDragFrom(null);
    setOverIndex(null);
  };

  const confirmStart = () => {
    const min = parseHHMM(startInput);
    if (min === null || min >= DAY_MINUTES) return;
    scrolledRef.current = false;
    setMsg('');
    commit({ date: today(), startMin: min, items: [] });
  };

  const handleClear = () => {
    if (!plan) return;
    if (!window.confirm(t('rushClearConfirm'))) return;
    setEditMode(false);
    setEditingId(null);
    setRecordingId(null);
    setPickerOpen(false);
    setDragFrom(null);
    setOverIndex(null);
    scrolledRef.current = false;
    commit(null);
  };

  const toggleDone = (block: RushBlock) => {
    if (!plan || !block.item || block.item.kind !== 'habit') return;
    const target = block.item;
    const nextDone = !target.done;
    commit({
      ...plan,
      items: plan.items.map((item) =>
        item.id === target.id && item.kind === 'habit' ? { ...item, done: nextDone } : item,
      ),
    });
    if (nextDone) setRecordingId(target.habitId);
  };

  const editingBlock = useMemo(
    () => blocks.find((block) => block.item?.id === editingId) ?? null,
    [blocks, editingId],
  );
  const editingHabit =
    editingBlock && editingBlock.item?.kind === 'habit'
      ? habitOf(db.habits, editingBlock.item.habitId)
      : undefined;
  const recordingHabit = recordingId ? habitOf(db.habits, recordingId) : undefined;
  const recordingDate = plan?.date ?? today();
  const recordingRecord = recordingId ? db.records[recordingId]?.[recordingDate] : undefined;

  const saveDuration = (duration: number) => {
    if (!plan || !editingBlock || !editingBlock.item) return;
    const max = Math.max(1, DAY_MINUTES - editingBlock.start);
    const clamped = Math.max(1, Math.min(max, Math.floor(duration)));
    const targetId = editingBlock.item.id;
    commit({
      ...plan,
      items: plan.items.map((item) =>
        item.id === targetId ? { ...item, duration: clamped } : item,
      ),
    });
    setEditingId(null);
  };

  const handleExport = () => {
    if (!plan) return;
    if (!plan.items.some((item) => item.kind === 'habit')) {
      setMsg(t('rushExportEmpty'));
      return;
    }
    const name = `trace-rush-${plan.date.replaceAll('-', '')}.ics`;
    downloadFile(name, buildRushICS(plan, db.habits), 'text/calendar');
    setMsg(t('rushExportDone', { name }));
  };

  const renderBlock = (block: RushBlock) => {
    if (!plan || !block.item || block.index === undefined) return null;
    const item = block.item;
    const index = block.index;
    const height = Math.max(16, (block.end - block.start) * PX_PER_MIN);
    const isHabit = item.kind === 'habit';
    const habit = item.kind === 'habit' ? habitOf(db.habits, item.habitId) : undefined;
    if (isHabit && !habit) return null;
    const accent = habit ? colorOf(habit.color).accent : undefined;
    const done = item.kind === 'habit' && item.done;
    const overdue = isHabit && !done && now > block.end;
    const compact = height < 28;
    const isOver = overIndex === index;

    return (
      <div
        key={block.key}
        className={[
          styles.block,
          isHabit ? styles.habitBlock : styles.breakBlock,
          done ? styles.done : '',
          isHabit && !editMode ? styles.withCheck : '',
          isOver ? styles.over : '',
          editMode ? styles.editBlock : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          top: block.start * PX_PER_MIN,
          height,
          ...(accent ? { background: `${accent}22`, borderLeftColor: accent } : {}),
        }}
        draggable={editMode}
        onDragStart={editMode ? (e) => onBlockDragStart(e, index) : undefined}
        onDragEnd={
          editMode
            ? () => {
                setDragFrom(null);
                setOverIndex(null);
              }
            : undefined
        }
        onDragOver={editMode ? (e) => onBlockDragOver(e, index) : undefined}
        onDrop={editMode ? (e) => onBlockDrop(e, index) : undefined}
        onClick={() => {
          if (!editMode) setEditingId(item.id);
        }}
        onKeyDown={
          editMode
            ? undefined
            : (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setEditingId(item.id);
                }
              }
        }
        role={editMode ? undefined : 'button'}
        tabIndex={editMode ? undefined : 0}
      >
        <div className={styles.blockTitle}>
          {isHabit && habit ? `${habit.emoji} ${habit.name}` : `☕ ${t('rushLongBreak')}`}
        </div>
        {!compact && (
          <div className={styles.blockTime}>
            {minutesToHHMM(block.start)} – {minutesToHHMM(block.end)} ·{' '}
            {t('rushDurationMin', { n: Math.max(0, block.end - block.start) })}
          </div>
        )}
        {overdue && (
          <span className={styles.overdue} title={t('rushOverdue')}>
            !
          </span>
        )}
        {isHabit && !editMode && (
          <button
            type="button"
            className={`${styles.checkBtn} ${done ? styles.checkOn : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleDone(block);
            }}
            aria-label={done ? t('rushUnmarkDone') : t('rushMarkDone')}
            title={done ? t('rushUnmarkDone') : t('rushMarkDone')}
          >
            {done && <Icon name="check" size={15} />}
          </button>
        )}
        {editMode && (
          <span className={styles.moveBtns} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.moveBtn}
              disabled={index === 0}
              onClick={() => moveItem(index, index - 1)}
              aria-label={t('rushMoveUp')}
            >
              ↑
            </button>
            <button
              type="button"
              className={styles.moveBtn}
              disabled={index === plan.items.length - 1}
              onClick={() => moveItem(index, index + 1)}
              aria-label={t('rushMoveDown')}
            >
              ↓
            </button>
          </span>
        )}
      </div>
    );
  };

  const date = plan?.date ?? today();

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={`page-title ${styles.title}`}>
          {t('rushPlanTitle')}
          <small>
            {fullDateLabel(date, lang)} {weekdayLabel(date, lang)}
          </small>
        </h1>
        <div className={styles.actions}>
          <button
            type="button"
            className={`btn btn-ghost ${styles.mobileAdd}`}
            disabled={!plan || editMode}
            onClick={() => setPickerOpen(true)}
          >
            <Icon name="plus" size={15} /> {t('rushAddHabit')}
          </button>
          <button type="button" className="btn btn-ghost" disabled={!plan} onClick={toggleEdit}>
            <Icon name={editMode ? 'check' : 'edit'} size={15} />{' '}
            {editMode ? t('filterConfirm') : t('edit')}
          </button>
          <button type="button" className="btn btn-ghost" disabled={!plan} onClick={handleClear}>
            <Icon name="trash" size={15} /> {t('rushClear')}
          </button>
          <button type="button" className="btn btn-primary" disabled={!plan} onClick={handleExport}>
            <Icon name="download" size={15} /> {t('rushExport')}
          </button>
        </div>
      </header>

      {msg && <div className={styles.msg}>{msg}</div>}

      {!plan ? (
        <div className={`card ${styles.startCard}`}>
          <div className="empty-seal">排</div>
          <h2>{t('rushStartTitle')}</h2>
          <p className="muted">{t('rushStartHint')}</p>
          <div className={styles.startRow}>
            <label className={styles.startLabel}>
              <span>{t('rushStartTime')}</span>
              <input
                className={styles.timeInput}
                type="time"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn btn-primary"
              disabled={parseHHMM(startInput) === null}
              onClick={confirmStart}
            >
              <Icon name="check" size={16} /> {t('rushStartConfirm')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {plan.items.length === 0 && (
            <div className={styles.emptyBanner}>{t('rushEmptyTimeline')}</div>
          )}
          <div
            ref={scrollerRef}
            className={`${styles.scroller} ${dropHere ? styles.dropActive : ''} ${
              editMode ? styles.editing : ''
            }`}
            onDragOver={onCanvasDragOver}
            onDragLeave={onCanvasDragLeave}
            onDrop={onCanvasDrop}
          >
            <div className={styles.canvas} style={{ height: DAY_MINUTES * PX_PER_MIN }}>
              {!dragging &&
                HOURS.map((hour) => (
                  <div key={hour} className={styles.hourLine} style={{ top: hour * PX_PER_HOUR }}>
                    <span className={styles.hourLabel}>{String(hour).padStart(2, '0')}:00</span>
                  </div>
                ))}

              {!dragging && plan.items.length > 0 && (
                <div
                  className={styles.startLine}
                  style={{ top: plan.startMin * PX_PER_MIN }}
                >
                  <span>{minutesToHHMM(plan.startMin)}</span>
                </div>
              )}

              {!dragging &&
                blocks
                  .filter((block) => block.kind === 'rest')
                  .map((block) => (
                    <Fragment key={block.key}>
                      <div
                        className={styles.rest}
                        style={{
                          top: block.start * PX_PER_MIN,
                          height: Math.max(2, (block.end - block.start) * PX_PER_MIN),
                        }}
                      />
                      <span
                        className={styles.restLabel}
                        style={{ top: block.start * PX_PER_MIN }}
                      >
                        {t('rushRestTime', {
                          start: minutesToHHMM(block.start),
                          end: minutesToHHMM(block.end),
                        })}
                      </span>
                    </Fragment>
                  ))}

              {blocks.filter((block) => block.kind !== 'rest').map(renderBlock)}

              {!dragging && (
                <div className={styles.nowLine} style={{ top: now * PX_PER_MIN }}>
                  <span className={styles.nowBadge}>{minutesToHHMM(now)}</span>
                </div>
              )}

              {dropHere && <div className={styles.dropHint}>{t('rushDropHere')}</div>}
            </div>
          </div>
        </>
      )}

      {pickerOpen && (
        <Sheet title={t('rushAddHabit')} onClose={() => setPickerOpen(false)}>
          <RushPicker onPick={append} />
        </Sheet>
      )}

      {editingBlock && editingBlock.item && (
        <DurationSheet
          block={editingBlock}
          habit={editingHabit}
          onClose={() => setEditingId(null)}
          onSave={saveDuration}
        />
      )}

      {recordingId && recordingHabit && plan && (
        <RecordSheet
          habit={recordingHabit}
          date={plan.date}
          initial={
            recordingRecord
              ? { value: recordingRecord.value, note: recordingRecord.note }
              : undefined
          }
          onClose={() => setRecordingId(null)}
          onSave={(value, note) => {
            setRecord(recordingHabit.id, plan.date, value, note);
            setRecordingId(null);
          }}
          onRemove={() => {
            removeRecord(recordingHabit.id, plan.date);
            setRecordingId(null);
          }}
        />
      )}
    </div>
  );
}

function DurationSheet({
  block,
  habit,
  onClose,
  onSave,
}: {
  block: RushBlock;
  habit?: Habit;
  onClose: () => void;
  onSave: (duration: number) => void;
}) {
  const { t } = useStore();
  const isBreak = block.kind === 'break';
  const max = Math.max(1, DAY_MINUTES - block.start);
  const [duration, setDuration] = useState(() =>
    Math.max(1, Math.min(max, block.end - block.start)),
  );
  const end = Math.min(block.start + duration, DAY_MINUTES);
  const endInput = end >= DAY_MINUTES ? '23:59' : minutesToHHMM(end);

  return (
    <Sheet
      title={isBreak ? `☕ ${t('rushLongBreak')}` : `${habit?.emoji ?? ''} ${habit?.name ?? ''}`}
      onClose={onClose}
    >
      <div className={styles.sheetRow}>
        <span>{t('rushStartTime')}</span>
        <b>{minutesToHHMM(block.start)}</b>
      </div>
      <div className={styles.sheetRow}>
        <span>{t('rushEndTime')}</span>
        <b>{minutesToHHMM(end)}</b>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="rush-duration">
          {t('rushDuration')}
        </label>
        <div className={styles.durRow}>
          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => setDuration((d) => Math.max(1, d - 5))}
          >
            −
          </button>
          <input
            id="rush-duration"
            className="input"
            type="number"
            min={1}
            max={max}
            inputMode="numeric"
            value={duration}
            onChange={(e) =>
              setDuration(Math.max(1, Math.min(max, Math.floor(Number(e.target.value) || 1))))
            }
          />
          <span className={styles.durUnit}>{t('minutes')}</span>
          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => setDuration((d) => Math.min(max, d + 5))}
          >
            +
          </button>
        </div>
      </div>

      <div className={styles.chips}>
        {[15, 25, 30, 45, 60]
          .filter((m) => m <= max)
          .map((m) => (
            <button
              key={m}
              type="button"
              className={`${styles.chip} ${duration === m ? styles.chipOn : ''}`}
              onClick={() => setDuration(m)}
            >
              {t('rushDurationMin', { n: m })}
            </button>
          ))}
      </div>

      {isBreak && (
        <div className="field">
          <label className="field-label" htmlFor="rush-end-time">
            {t('rushEndTime')}
          </label>
          <input
            id="rush-end-time"
            className="input"
            type="time"
            value={endInput}
            onChange={(e) => {
              const min = parseHHMM(e.target.value);
              if (min !== null) setDuration(Math.max(1, Math.min(max, min - block.start)));
            }}
          />
          <p className={styles.hint}>{t('rushEndTimeHint')}</p>
        </div>
      )}

      <p className={styles.hint}>{t('rushDurationHint')}</p>

      <div className={styles.footer}>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => onSave(duration)}
        >
          {t('save')}
        </button>
      </div>
    </Sheet>
  );
}
