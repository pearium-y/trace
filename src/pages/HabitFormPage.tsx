import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useStore } from '../store';
import type { Frequency, GoalType, HabitColor } from '../types';
import { Segmented } from '../components/Basics';
import { HabitCard } from '../components/HabitCard';
import { Icon } from '../components/Icon';
import { COLOR_KEYS, EMOJIS, HABIT_COLORS } from '../utils/colors';
import { today } from '../utils/date';
import styles from './HabitFormPage.module.css';

export default function HabitFormPage({
  habitId,
  onBack,
  onDeleted,
}: {
  habitId?: string;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const { db, addHabit, updateHabit, deleteHabit } = useStore();
  const existing = habitId ? db.habits.find((h) => h.id === habitId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? '📖');
  const [color, setColor] = useState<HabitColor>(existing?.color ?? 'seal');
  const [frequency, setFrequency] = useState<Frequency>(existing?.frequency ?? 'daily');
  const [goalType, setGoalType] = useState<GoalType>(existing?.goalType ?? 'count');
  const [countTarget, setCountTarget] = useState(
    existing && existing.goalType === 'count' ? existing.target : 1,
  );
  const [durH, setDurH] = useState(
    Math.floor((existing && existing.goalType === 'duration' ? existing.target : 30) / 60),
  );
  const [durM, setDurM] = useState(
    (existing && existing.goalType === 'duration' ? existing.target : 30) % 60,
  );
  const [error, setError] = useState('');

  const durationTarget = durH * 60 + durM;
  const finalTarget = goalType === 'count' ? countTarget : goalType === 'duration' ? durationTarget : 0;

  const submit = () => {
    const n = name.trim();
    if (!n) {
      setError('请填写计划名称');
      return;
    }
    if (n.length > 20) {
      setError('名称不能超过 20 个字');
      return;
    }
    if (goalType === 'count' && countTarget < 1) {
      setError('次数目标至少为 1 次');
      return;
    }
    if (goalType === 'duration' && durationTarget < 1) {
      setError('时长目标至少 1 分钟');
      return;
    }
    const input = { name: n, emoji, color, frequency, goalType, target: finalTarget };
    if (existing) {
      updateHabit(existing.id, input);
    } else {
      addHabit(input);
    }
    onBack();
  };

  const remove = () => {
    if (!existing) return;
    if (window.confirm(`确定删除「${existing.name}」吗？它的所有记录将一并删除。`)) {
      deleteHabit(existing.id);
      onDeleted();
    }
  };

  const preview = {
    id: 'preview',
    name: name.trim() || '计划名称',
    emoji,
    color,
    frequency,
    goalType,
    target: finalTarget,
    createdAt: today(),
  };

  return (
    <div>
      <header className="subheader">
        <button className="icon-btn" onClick={onBack} aria-label="返回">
          <Icon name="back" />
        </button>
        <div className="subheader-title">{existing ? '编辑计划' : '新建计划'}</div>
        {existing && (
          <button className="icon-btn" onClick={remove} aria-label="删除计划" title="删除计划">
            <Icon name="trash" />
          </button>
        )}
      </header>

      <div className={styles.previewWrap}>
        <HabitCard habit={preview} records={{}} date={today()} onOpen={() => undefined} />
        <p className="faint">卡片预览</p>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="habit-name">
          名称
        </label>
        <input
          id="habit-name"
          className="input"
          placeholder="例如：读书、跑步、冥想…"
          maxLength={20}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
        />
      </div>

      <div className="field">
        <span className="field-label">图标</span>
        <div className={styles.emojiGrid}>
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className={`${styles.emojiItem} ${e === emoji ? styles.emojiOn : ''}`}
              onClick={() => setEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">专属色（用于热力图）</span>
        <div className={styles.colorRow}>
          {COLOR_KEYS.map((c) => {
            const def = HABIT_COLORS[c];
            return (
              <button
                key={c}
                type="button"
                className={`${styles.colorDot} ${c === color ? styles.colorOn : ''}`}
                style={{ background: def.accent } as CSSProperties}
                onClick={() => setColor(c)}
                title={def.label}
                aria-label={def.label}
              />
            );
          })}
        </div>
      </div>

      <div className="field">
        <span className="field-label">频率</span>
        <Segmented
          value={frequency}
          onChange={setFrequency}
          options={[
            { value: 'daily', label: '每日' },
            { value: 'weekly', label: '每周' },
          ]}
        />
      </div>

      <div className="field">
        <span className="field-label">目标</span>
        <Segmented
          value={goalType}
          onChange={setGoalType}
          options={[
            { value: 'count', label: '完成次数' },
            { value: 'duration', label: '累计时长' },
            { value: 'none', label: '无目标' },
          ]}
        />
      </div>

      {goalType === 'count' && (
        <div className="field">
          <label className="field-label" htmlFor="count-target">
            {frequency === 'daily' ? '每天' : '每周'}目标次数
          </label>
          <div className={styles.targetRow}>
            <input
              id="count-target"
              className="input"
              type="number"
              min={1}
              max={99}
              inputMode="numeric"
              value={countTarget}
              onChange={(e) => setCountTarget(Math.max(1, Math.min(99, Math.floor(Number(e.target.value) || 1))))}
            />
            <span className={styles.targetUnit}>次</span>
          </div>
        </div>
      )}

      {goalType === 'duration' && (
        <div className="field">
          <label className="field-label">{frequency === 'daily' ? '每天' : '每周'}目标时长</label>
          <div className={styles.targetRow}>
            <input
              className="input"
              type="number"
              min={0}
              max={40}
              inputMode="numeric"
              value={durH}
              onChange={(e) => setDurH(Math.max(0, Math.min(40, Math.floor(Number(e.target.value) || 0))))}
              aria-label="小时"
            />
            <span className={styles.targetUnit}>小时</span>
            <input
              className="input"
              type="number"
              min={0}
              max={59}
              inputMode="numeric"
              value={durM}
              onChange={(e) => setDurM(Math.max(0, Math.min(59, Math.floor(Number(e.target.value) || 0))))}
              aria-label="分钟"
            />
            <span className={styles.targetUnit}>分钟</span>
          </div>
        </div>
      )}

      {goalType === 'none' && (
        <p className={styles.noneHint}>无目标计划只需每天标记「已记录」，也可写下备注。</p>
      )}

      {error && <p className="field-error">{error}</p>}

      <div className={styles.savebar}>
        <button className="btn btn-primary btn-block" onClick={submit}>
          <Icon name="check" size={16} /> {existing ? '保存修改' : '创建计划'}
        </button>
      </div>
    </div>
  );
}
