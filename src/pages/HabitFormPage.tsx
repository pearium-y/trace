import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useStore } from '../store';
import { DEFAULT_PROJECT_ID } from '../storage';
import type { Frequency, GoalType, PaletteColor, Tag } from '../types';
import { Segmented } from '../components/Basics';
import { HabitCard } from '../components/HabitCard';
import { Icon } from '../components/Icon';
import { TagSheet } from '../components/TagSheet';
import { COLOR_KEYS, colorOf, EMOJIS, paletteLabel, projectLabel } from '../utils/colors';
import { today } from '../utils/date';
import styles from './HabitFormPage.module.css';

export default function HabitFormPage({
  habitId,
  onBack,
  onDeleted,
  onCreated,
}: {
  habitId?: string;
  onBack: () => void;
  onDeleted: () => void;
  onCreated?: (id: string) => void;
}) {
  const { db, t, activeProjectId, addHabit, updateHabit, deleteHabit } = useStore();
  const existing = habitId ? db.habits.find((h) => h.id === habitId) : undefined;

  const initialProject =
    existing?.projectId ??
    (activeProjectId && db.projects.some((p) => p.id === activeProjectId)
      ? activeProjectId
      : db.projects[0]?.id ?? DEFAULT_PROJECT_ID);

  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? '📖');
  const [color, setColor] = useState<PaletteColor>(existing?.color ?? 'seal');
  const [projectId, setProjectId] = useState(initialProject);
  const [tagIds, setTagIds] = useState<string[]>(existing?.tagIds ?? []);
  const [notes, setNotes] = useState(existing?.notes ?? '');
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
  const [tagOpen, setTagOpen] = useState(false);

  const projectTags = db.tags.filter((tag) => tag.projectId === projectId);
  const validTagIds = tagIds.filter((id) => projectTags.some((tag) => tag.id === id));
  const selectedTags: Tag[] = validTagIds
    .map((id) => projectTags.find((tag) => tag.id === id))
    .filter((tag): tag is Tag => !!tag);

  const durationTarget = durH * 60 + durM;
  const finalTarget = goalType === 'count' ? countTarget : goalType === 'duration' ? durationTarget : 0;

  const toggleTag = (id: string) => {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = () => {
    const n = name.trim();
    if (!n) {
      setError(t('errorNameRequired'));
      return;
    }
    if (n.length > 20) {
      setError(t('errorNameTooLong'));
      return;
    }
    if (goalType === 'count' && countTarget < 1) {
      setError(t('errorCountMin'));
      return;
    }
    if (goalType === 'duration' && durationTarget < 1) {
      setError(t('errorDurationMin'));
      return;
    }
    const input = {
      name: n,
      emoji,
      color,
      projectId,
      tagIds: validTagIds,
      notes: notes.trim() || undefined,
      frequency,
      goalType,
      target: finalTarget,
    };
    if (existing) {
      updateHabit(existing.id, input);
      onBack();
    } else {
      const habit = addHabit(input);
      if (onCreated) onCreated(habit.id);
      else onBack();
    }
  };

  const remove = () => {
    if (!existing) return;
    if (window.confirm(t('deleteHabitConfirm', { name: existing.name }))) {
      deleteHabit(existing.id);
      onDeleted();
    }
  };

  const preview = {
    id: 'preview',
    projectId,
    name: name.trim() || t('previewName'),
    emoji,
    color,
    tagIds: validTagIds,
    notes: notes.trim() || undefined,
    frequency,
    goalType,
    target: finalTarget,
    createdAt: today(),
  };

  return (
    <div>
      <header className="subheader">
        <button className="icon-btn" onClick={onBack} aria-label={t('back')}>
          <Icon name="back" />
        </button>
        <div className="subheader-title">{existing ? t('editHabit') : t('newHabit')}</div>
        {existing && (
          <button className="icon-btn" onClick={remove} aria-label={t('deleteHabit')} title={t('deleteHabit')}>
            <Icon name="trash" />
          </button>
        )}
      </header>

      <div className={styles.previewWrap}>
        <HabitCard
          habit={preview}
          records={{}}
          date={today()}
          tags={selectedTags}
          onOpen={() => undefined}
        />
        <p className="faint">{t('cardPreview')}</p>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="habit-name">
          {t('name')}
        </label>
        <input
          id="habit-name"
          className="input"
          placeholder={t('namePlaceholder')}
          maxLength={20}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="habit-project">
          {t('selectProject')}
        </label>
        <select
          id="habit-project"
          className="select"
          style={{ width: '100%' }}
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value);
            setTagIds([]);
          }}
        >
          {db.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.emoji} {projectLabel(p, t)}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <span className="field-label">{t('icon')}</span>
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
        <span className="field-label">{t('habitColor')}</span>
        <div className={styles.colorRow}>
          {COLOR_KEYS.map((c) => {
            const def = colorOf(c);
            return (
              <button
                key={c}
                type="button"
                className={`${styles.colorDot} ${c === color ? styles.colorOn : ''}`}
                style={{ background: def.accent } as CSSProperties}
                onClick={() => setColor(c)}
                title={paletteLabel(c, t)}
                aria-label={paletteLabel(c, t)}
              />
            );
          })}
        </div>
      </div>

      <div className="field">
        <div className={styles.tagHead}>
          <span className="field-label" style={{ marginBottom: 0 }}>
            {t('tags')}
          </span>
          <button type="button" className={styles.manageBtn} onClick={() => setTagOpen(true)}>
            <Icon name="tag" size={14} /> {t('manageTags')}
          </button>
        </div>
        {projectTags.length === 0 ? (
          <p className={styles.tagHint}>{t('noTagsHint')}</p>
        ) : (
          <div className={styles.tagWrap}>
            {projectTags.map((tag) => {
              const on = validTagIds.includes(tag.id);
              const def = colorOf(tag.color);
              return (
                <button
                  key={tag.id}
                  type="button"
                  className={`${styles.tagChip} ${on ? styles.tagOn : ''}`}
                  style={
                    on
                      ? ({ borderColor: def.accent, color: def.deep, background: `${def.accent}1a` } as CSSProperties)
                      : undefined
                  }
                  onClick={() => toggleTag(tag.id)}
                >
                  <i className={styles.tagDot} style={{ background: def.accent }} />
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}
        <p className={styles.tagHint}>{t('tagsHint')}</p>
      </div>

      <div className="field">
        <span className="field-label">{t('frequency')}</span>
        <Segmented
          value={frequency}
          onChange={setFrequency}
          options={[
            { value: 'daily', label: t('daily') },
            { value: 'weekly', label: t('weekly') },
          ]}
        />
      </div>

      <div className="field">
        <span className="field-label">{t('goal')}</span>
        <Segmented
          value={goalType}
          onChange={setGoalType}
          options={[
            { value: 'count', label: t('goalCount') },
            { value: 'duration', label: t('goalDuration') },
            { value: 'none', label: t('goalNone') },
          ]}
        />
      </div>

      {goalType === 'count' && (
        <div className="field">
          <label className="field-label" htmlFor="count-target">
            {frequency === 'daily' ? t('targetCountDaily') : t('targetCountWeekly')}
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
            <span className={styles.targetUnit}>{t('unitTimes')}</span>
          </div>
        </div>
      )}

      {goalType === 'duration' && (
        <div className="field">
          <label className="field-label">
            {frequency === 'daily' ? t('targetDurationDaily') : t('targetDurationWeekly')}
          </label>
          <div className={styles.targetRow}>
            <input
              className="input"
              type="number"
              min={0}
              max={40}
              inputMode="numeric"
              value={durH}
              onChange={(e) => setDurH(Math.max(0, Math.min(40, Math.floor(Number(e.target.value) || 0))))}
              aria-label={t('hours')}
            />
            <span className={styles.targetUnit}>{t('hours')}</span>
            <input
              className="input"
              type="number"
              min={0}
              max={59}
              inputMode="numeric"
              value={durM}
              onChange={(e) => setDurM(Math.max(0, Math.min(59, Math.floor(Number(e.target.value) || 0))))}
              aria-label={t('minutes')}
            />
            <span className={styles.targetUnit}>{t('minutes')}</span>
          </div>
        </div>
      )}

      {goalType === 'none' && <p className={styles.noneHint}>{t('goalNoneHint')}</p>}

      <div className="field">
        <label className="field-label" htmlFor="habit-notes">
          {t('habitNote')}
        </label>
        <textarea
          id="habit-notes"
          className="textarea"
          maxLength={500}
          placeholder={t('habitNotePlaceholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && <p className="field-error">{error}</p>}

      <div className={styles.savebar}>
        <button className="btn btn-primary btn-block" onClick={submit}>
          <Icon name="check" size={16} /> {existing ? t('updateHabitBtn') : t('createHabitBtn')}
        </button>
      </div>

      {tagOpen && <TagSheet projectId={projectId} onClose={() => setTagOpen(false)} />}
    </div>
  );
}
