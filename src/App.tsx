import { useState } from 'react';
import type { ReactNode } from 'react';
import { StoreProvider } from './store';
import { BottomNav, TABS } from './components/BottomNav';
import type { TabKey } from './components/BottomNav';
import { Icon } from './components/Icon';
import TodayPage from './pages/TodayPage';
import HabitsPage from './pages/HabitsPage';
import HabitDetailPage from './pages/HabitDetailPage';
import HabitFormPage from './pages/HabitFormPage';
import ReportPage from './pages/ReportPage';
import SettingsPage from './pages/SettingsPage';

type View = { tab: TabKey } | { page: 'habit'; id: string } | { page: 'habit-form'; id?: string };

export default function App() {
  const [view, setView] = useState<View>({ tab: 'today' });

  let content: ReactNode;
  let key: string;
  let activeTab: TabKey = 'habits';
  let hasNav = false;

  if ('tab' in view) {
    hasNav = true;
    activeTab = view.tab;
    key = view.tab;
    if (view.tab === 'today') {
      content = <TodayPage onCreate={() => setView({ page: 'habit-form' })} />;
    } else if (view.tab === 'habits') {
      content = (
        <HabitsPage
          onOpen={(id) => setView({ page: 'habit', id })}
          onCreate={() => setView({ page: 'habit-form' })}
        />
      );
    } else if (view.tab === 'report') {
      content = <ReportPage />;
    } else {
      content = <SettingsPage />;
    }
  } else if (view.page === 'habit') {
    key = `habit-${view.id}`;
    content = (
      <HabitDetailPage
        habitId={view.id}
        onBack={() => setView({ tab: 'habits' })}
        onEdit={() => setView({ page: 'habit-form', id: view.id })}
      />
    );
  } else {
    key = `form-${view.id ?? 'new'}`;
    content = (
      <HabitFormPage
        habitId={view.id}
        onBack={() =>
          view.id ? setView({ page: 'habit', id: view.id }) : setView({ tab: 'habits' })
        }
        onDeleted={() => setView({ tab: 'habits' })}
      />
    );
  }

  return (
    <StoreProvider>
      <aside className="sidenav">
        <div className="brand">
          <span className="brand-seal">迹</span>
          <div>
            <div className="brand-name">循迹</div>
            <div className="brand-sub">TRACE</div>
          </div>
        </div>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`sidenav-item ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setView({ tab: t.key })}
          >
            <Icon name={t.icon} size={20} />
            {t.label}
          </button>
        ))}
      </aside>
      <div className={`maincol ${hasNav ? 'has-nav' : ''}`}>
        <main className="page" key={key}>
          {content}
        </main>
      </div>
      {hasNav && <BottomNav active={activeTab} onSelect={(t) => setView({ tab: t })} />}
    </StoreProvider>
  );
}
