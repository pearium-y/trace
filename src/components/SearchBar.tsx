import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { projectLabel } from '../utils/colors';
import { projectOf, tagsOf } from '../utils/entities';
import { Icon } from './Icon';

export function SearchBar({ onOpenHabit }: { onOpenHabit: (id: string) => void }) {
  const { db, t } = useStore();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return [];
    return db.habits
      .filter((h) => {
        const project = projectOf(db.projects, h.projectId);
        const pName = project ? projectLabel(project, t).toLowerCase() : '';
        const tagNames = tagsOf(db.tags, h.tagIds).map((tag) => tag.name.toLowerCase());
        return (
          h.name.toLowerCase().includes(q) ||
          (h.notes ?? '').toLowerCase().includes(q) ||
          pName.includes(q) ||
          tagNames.some((n) => n.includes(q))
        );
      })
      .slice(0, 20);
  }, [db, q, t]);

  const open = focused && q.length > 0;

  return (
    <div className="searchwrap" ref={wrapRef}>
      <Icon name="search" size={17} />
      <input
        value={query}
        placeholder={t('searchPlaceholder')}
        aria-label={t('search')}
        onChange={(e) => {
          setQuery(e.target.value);
          setFocused(true);
        }}
        onFocus={() => setFocused(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setQuery('');
            setFocused(false);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      {query && (
        <button
          type="button"
          className="search-clear"
          onClick={() => setQuery('')}
          aria-label={t('clearSearch')}
        >
          <Icon name="close" size={14} />
        </button>
      )}

      {open && (
        <div className="search-panel">
          <div className="search-meta">
            {results.length > 0 ? t('searchResults', { n: results.length }) : t('searchHint')}
          </div>
          {results.length === 0 ? (
            <div className="search-empty">{t('searchNoResults')}</div>
          ) : (
            results.map((h) => {
              const project = projectOf(db.projects, h.projectId);
              const tags = tagsOf(db.tags, h.tagIds);
              return (
                <button
                  key={h.id}
                  type="button"
                  className="search-item"
                  onClick={() => {
                    setQuery('');
                    setFocused(false);
                    onOpenHabit(h.id);
                  }}
                >
                  <span className="s-emoji">{h.emoji}</span>
                  <span className="s-info">
                    <span className="s-name">{h.name}</span>
                    <span className="s-meta">
                      {project ? projectLabel(project, t) : ''}
                      {tags.length > 0
                        ? ` · ${tags.map((tag) => tag.name).join(' / ')}`
                        : ''}
                      {h.notes ? ` · ${h.notes}` : ''}
                    </span>
                  </span>
                  <Icon name="chevron-right" size={15} />
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
