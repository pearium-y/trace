import { useStore } from '../store';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import styles from './BottomNav.module.css';

export type TabKey = 'today' | 'habits' | 'report' | 'settings';

export const TAB_KEYS: TabKey[] = ['today', 'habits', 'report', 'settings'];

const TAB_ICONS: Record<TabKey, IconName> = {
  today: 'today',
  habits: 'habits',
  report: 'report',
  settings: 'settings',
};

const TAB_LABELS: Record<TabKey, string> = {
  today: 'tabToday',
  habits: 'tabHabits',
  report: 'tabReport',
  settings: 'tabSettings',
};

export function useTabs() {
  const { t } = useStore();
  return TAB_KEYS.map((key) => ({ key, label: t(TAB_LABELS[key]), icon: TAB_ICONS[key] }));
}

export function BottomNav({
  active,
  onSelect,
}: {
  active: TabKey;
  onSelect: (t: TabKey) => void;
}) {
  const tabs = useTabs();
  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`${styles.item} ${active === tab.key ? styles.active : ''}`}
          onClick={() => onSelect(tab.key)}
        >
          <Icon name={tab.icon} size={22} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
