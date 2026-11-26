import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useStore } from '../store';
import type { ListFilter, SortKey } from '../utils/list';
import { countActiveFilters, emptyFilter } from '../utils/list';
import type { TagOption } from '../utils/entities';
import { colorOf } from '../utils/colors';
import { Segmented } from './Basics';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import styles from './ListControls.module.css';

export function ListControls({
  sort,
  onSort,
  filter,
  onFilter,
  tagOptions,
}: {
  sort: SortKey;
  onSort: (s: SortKey) => void;
  filter: ListFilter;
  onFilter: (f: ListFilter) => void;
  tagOptions: TagOption[];
}) {
  const { t } = useStore();
  const [open, setOpen] = useState(false);
  const active = countActiveFilters(filter);

  const toggleTag = (name: string) => {
    onFilter({
      ...filter,
      tagNames: filter.tagNames.includes(name)
        ? filter.tagNames.filter((n) => n !== name)
        : [...filter.tagNames, name],
    });
  };

  return (
    <div className={styles.bar}>
      <label className={styles.sortWrap}>
        <Icon name="sort" size={15} />
        <select
          className="select"
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
          aria-label={t('sortBy')}
        >
          <option value="default">{t('sortDefault')}</option>
          <option value="name">{t('sortName')}</option>
          <option value="streak">{t('sortStreak')}</option>
          <option value="rate">{t('sortRate')}</option>
          <option value="target">{t('sortTarget')}</option>
          <option value="newest">{t('sortNewest')}</option>
        </select>
      </label>
      <button
        type="button"
        className={`${styles.filterBtn} ${active > 0 ? styles.filterOn : ''}`}
        onClick={() => setOpen(true)}
      >
        <Icon name="filter" size={14} />
        {t('filter')}
        {active > 0 && <b className={styles.badge}>{active}</b>}
      </button>

      {open && (
        <Sheet title={t('filter')} onClose={() => setOpen(false)}>
          <div className="field">
            <span className="field-label">{t('filterFrequency')}</span>
            <Segmented
              value={filter.frequency}
              onChange={(v) => onFilter({ ...filter, frequency: v })}
              options={[
                { value: 'all', label: t('all') },
                { value: 'daily', label: t('daily') },
                { value: 'weekly', label: t('weekly') },
              ]}
            />
          </div>

          <div className="field">
            <span className="field-label">{t('filterGoal')}</span>
            <Segmented
              value={filter.goalType}
              onChange={(v) => onFilter({ ...filter, goalType: v })}
              options={[
                { value: 'all', label: t('all') },
                { value: 'count', label: t('goalCount') },
                { value: 'duration', label: t('goalDuration') },
                { value: 'none', label: t('goalNone') },
              ]}
            />
          </div>

          <div className="field">
            <span className="field-label">{t('filterTags')}</span>
            {tagOptions.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>
                {t('noTags')}
              </p>
            ) : (
              <div className={styles.tagGrid}>
                {tagOptions.map((opt) => {
                  const on = filter.tagNames.includes(opt.name);
                  const def = colorOf(opt.color);
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      className={`${styles.tagOpt} ${on ? styles.tagOn : ''}`}
                      style={
                        on
                          ? ({ borderColor: def.accent, color: def.deep, background: `${def.accent}1a` } as CSSProperties)
                          : undefined
                      }
                      onClick={() => toggleTag(opt.name)}
                    >
                      <i className={styles.dot} style={{ background: def.accent }} />
                      {opt.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <button className="btn btn-ghost" onClick={() => onFilter(emptyFilter())}>
              {t('filterReset')}
            </button>
            <button className="btn btn-primary" onClick={() => setOpen(false)}>
              {t('filterConfirm')}
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
