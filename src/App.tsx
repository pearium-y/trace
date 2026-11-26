import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { BootState } from './storage';
import { bootDB, migrateLegacy } from './storage';
import { StoreProvider, useStore } from './store';
import { BottomNav, useTabs } from './components/BottomNav';
import type { TabKey } from './components/BottomNav';
import { Icon } from './components/Icon';
import { BrandMark } from './components/BrandMark';
import { MobileProjectBar, ProjectNav } from './components/ProjectSwitcher';
import { SearchBar } from './components/SearchBar';
import TodayPage from './pages/TodayPage';
import HabitsPage from './pages/HabitsPage';
import HabitDetailPage from './pages/HabitDetailPage';
import HabitFormPage from './pages/HabitFormPage';
import ReportPage from './pages/ReportPage';
import SettingsPage from './pages/SettingsPage';
import NotesPage from './pages/NotesPage';

type View = { tab: TabKey } | { page: 'habit'; id: string } | { page: 'habit-form'; id?: string };

function Shell() {
  const { db, lang, t, setActiveProject } = useStore();
  const tabs = useTabs();
  const [view, setView] = useState<View>({ tab: 'today' });

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.title = lang === 'en' ? 'Trace' : '循迹 Trace';
  }, [lang]);

  useEffect(() => {
    const onFocus = (e: FocusEvent) => {
      const el = e.target;
      if (el instanceof HTMLInputElement && el.type === 'number') el.select();
    };
    document.addEventListener('focusin', onFocus);
    return () => document.removeEventListener('focusin', onFocus);
  }, []);

  useEffect(() => {
    if (!db.notesEnabled && 'tab' in view && view.tab === 'notes') setView({ tab: 'today' });
  }, [db.notesEnabled, view]);

  const openHabit = (id: string) => setView({ page: 'habit', id });
  const backFromHabit = () => {
    const habit = db.habits.find((h) => h.id === (view as { page: 'habit'; id: string }).id);
    if (habit) setActiveProject(habit.projectId);
    setView({ tab: 'habits' });
  };

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
      content = <HabitsPage onOpen={openHabit} onCreate={() => setView({ page: 'habit-form' })} />;
    } else if (view.tab === 'report') {
      content = <ReportPage />;
    } else if (view.tab === 'notes') {
      content = <NotesPage />;
    } else {
      content = <SettingsPage />;
    }
  } else if (view.page === 'habit') {
    key = `habit-${view.id}`;
    content = (
      <HabitDetailPage
        habitId={view.id}
        onBack={backFromHabit}
        onEdit={() => setView({ page: 'habit-form', id: view.id })}
      />
    );
  } else {
    key = `form-${view.id ?? 'new'}`;
    content = (
      <HabitFormPage
        habitId={view.id}
        onBack={() => (view.id ? setView({ page: 'habit', id: view.id }) : setView({ tab: 'habits' }))}
        onDeleted={() => setView({ tab: 'habits' })}
        onCreated={(id) => setView({ page: 'habit', id })}
      />
    );
  }

  return (
    <>
      <aside className="sidenav">
        <div className="brand">
          <BrandMark size={42} className="brand-logo" />
          <div>
            <div className="brand-name">{t('appName')}</div>
            <div className="brand-sub">{t('brandSub')}</div>
          </div>
        </div>
        <ProjectNav />
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`sidenav-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setView({ tab: tab.key })}
          >
            <Icon name={tab.icon} size={20} />
            {tab.label}
          </button>
        ))}
      </aside>
      <div className={`maincol ${hasNav ? 'has-nav' : ''}`}>
        <div className="topbar">
          <MobileProjectBar />
          <SearchBar onOpenHabit={openHabit} />
        </div>
        <main className="page" key={key}>
          {content}
        </main>
      </div>
      {hasNav && <BottomNav active={activeTab} onSelect={(tab) => setView({ tab })} />}
    </>
  );
}

function Gate({
  title,
  body,
  actions,
}: {
  title: string;
  body: string;
  actions: ReactNode;
}) {
  return (
    <div className="gate">
      <div className="gate-card card">
        <BrandMark size={42} className="brand-logo gate-seal" />
        <h1>{title}</h1>
        <p>{body}</p>
        <div className="gate-actions">{actions}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [boot, setBoot] = useState<BootState>(() => bootDB());
  const [exited, setExited] = useState(false);
  const [failed, setFailed] = useState(false);

  if (boot.kind === 'legacy') {
    if (exited) {
      return (
        <Gate
          title="已退出 / Exited"
          body="旧数据未迁移，你可以安全关闭此标签页。Old data was not migrated. You can safely close this tab."
          actions={null}
        />
      );
    }
    return (
      <Gate
        title="检测到 V1.0 数据 · V1.0 data detected"
        body={
          failed
            ? '迁移失败：旧数据无法解析。 Migration failed: old data could not be parsed.'
            : '本次更新为破坏性变更。你可以将旧数据迁移到新版本（所有习惯归入默认项目，不保留旧标签），或退出网页。 This is a breaking update: migrate old data into the new version, or exit the page.'
        }
        actions={
          <>
            <button
              className="btn btn-primary"
              onClick={() => {
                const db = migrateLegacy();
                if (db) setBoot({ kind: 'ready', db });
                else setFailed(true);
              }}
            >
              迁移并进入 · Migrate
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setExited(true);
                try {
                  window.close();
                } catch {
                  /* 浏览器可能阻止关闭 */
                }
              }}
            >
              退出网页 · Exit
            </button>
          </>
        }
      />
    );
  }

  return (
    <StoreProvider initialDB={boot.db}>
      <Shell />
    </StoreProvider>
  );
}
