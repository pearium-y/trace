import { Icon } from './Icon';
import type { IconName } from './Icon';
import styles from './BottomNav.module.css';

export type TabKey = 'today' | 'habits' | 'report' | 'settings';

export const TABS: { key: TabKey; label: string; icon: IconName }[] = [
  { key: 'today', label: '今日', icon: 'today' },
  { key: 'habits', label: '计划', icon: 'habits' },
  { key: 'report', label: '报告', icon: 'report' },
  { key: 'settings', label: '设置', icon: 'settings' },
];

export function BottomNav({ active, onSelect }: { active: TabKey; onSelect: (t: TabKey) => void }) {
  return (
    <nav className={styles.nav}>
      {TABS.map((t) => (
        <button
          key={t.key}
          className={`${styles.item} ${active === t.key ? styles.active : ''}`}
          onClick={() => onSelect(t.key)}
        >
          <Icon name={t.icon} size={22} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
