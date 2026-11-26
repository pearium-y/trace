import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useStore } from '../store';
import { DB_KEY, buildExport, parseImport } from '../storage';
import { SectionTitle, Segmented } from '../components/Basics';
import { Icon } from '../components/Icon';
import { ProjectEditor } from '../components/ProjectSwitcher';
import { colorOf, projectLabel } from '../utils/colors';
import { today } from '../utils/date';
import { buildCSV } from '../utils/csv';
import { downloadFile } from '../utils/download';
import type { Project } from '../types';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const { db, lang, t, importDB, clearAll, setLang } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [editor, setEditor] = useState<Project | 'new' | null>(null);

  const recordCount = useMemo(
    () => Object.values(db.records).reduce((s, days) => s + Object.keys(days).length, 0),
    [db.records],
  );

  const storageKB = useMemo(() => {
    try {
      return ((localStorage.getItem(DB_KEY) ?? '').length / 1024).toFixed(1);
    } catch {
      return '0';
    }
  }, [db]);

  const exportJSON = () => {
    const name = `trace-backup-${today().replaceAll('-', '')}.json`;
    downloadFile(name, JSON.stringify(buildExport(db), null, 2), 'application/json');
    setMsg(t('exportJsonDone', { name }));
  };

  const exportCSV = () => {
    const name = `trace-records-${today().replaceAll('-', '')}.csv`;
    downloadFile(name, buildCSV(db, lang), 'text/csv');
    setMsg(t('exportCsvDone', { name }));
  };

  const onImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseImport(text);
      if (!parsed) {
        setMsg(t('importInvalid'));
        return;
      }
      const ok = window.confirm(
        t('importConfirm', {
          h: db.habits.length,
          r: recordCount,
          bh: parsed.habits.length,
        }),
      );
      if (ok) {
        importDB(parsed);
        setMsg(t('importSuccess'));
      }
    } catch {
      setMsg(t('importReadError'));
    }
  };

  const onClear = () => {
    if (!window.confirm(t('clearConfirm1'))) return;
    if (!window.confirm(t('clearConfirm2'))) return;
    clearAll();
    setMsg(t('clearedMsg'));
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">
          {t('tabSettings')}
          <small>SETTINGS</small>
        </h1>
      </header>

      {msg && <div className={styles.msg}>{msg}</div>}

      <SectionTitle>{t('language')}</SectionTitle>
      <div className={styles.langWrap}>
        <Segmented
          value={lang}
          onChange={setLang}
          options={[
            { value: 'zh', label: t('langZh') },
            { value: 'en', label: t('langEn') },
          ]}
        />
      </div>

      <SectionTitle>{t('manageProjects')}</SectionTitle>
      <div className={`card ${styles.group}`}>
        {db.projects.map((p) => {
          const def = colorOf(p.color);
          return (
            <button key={p.id} type="button" className={styles.item} onClick={() => setEditor(p)}>
              <span
                className="proj-emoji"
                style={{ width: 30, height: 30, fontSize: 16, background: `${def.accent}1e`, borderColor: `${def.accent}55` }}
              >
                {p.emoji}
              </span>
              <span className={styles.itemMain}>
                <b>{projectLabel(p, t)}</b>
                <i>{t('projectHabitCount', { n: db.habits.filter((h) => h.projectId === p.id).length })}</i>
              </span>
              <Icon name="edit" size={15} className={styles.chev} />
            </button>
          );
        })}
        <button type="button" className={styles.item} onClick={() => setEditor('new')}>
          <span className={styles.addIcon}>
            <Icon name="plus" size={15} />
          </span>
          <span className={styles.itemMain}>
            <b>{t('newProject')}</b>
          </span>
          <Icon name="chevron-right" size={15} className={styles.chev} />
        </button>
      </div>

      <SectionTitle>{t('dataBackup')}</SectionTitle>
      <div className={`card ${styles.group}`}>
        <button type="button" className={styles.item} onClick={exportJSON}>
          <Icon name="download" size={18} />
          <span className={styles.itemMain}>
            <b>{t('exportJson')}</b>
            <i>{t('exportJsonHint')}</i>
          </span>
          <Icon name="chevron-right" size={15} className={styles.chev} />
        </button>
        <button type="button" className={styles.item} onClick={exportCSV}>
          <Icon name="download" size={18} />
          <span className={styles.itemMain}>
            <b>{t('exportCsv')}</b>
            <i>{t('exportCsvHint')}</i>
          </span>
          <Icon name="chevron-right" size={15} className={styles.chev} />
        </button>
        <button type="button" className={styles.item} onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={18} />
          <span className={styles.itemMain}>
            <b>{t('importBackup')}</b>
            <i>{t('importBackupHint')}</i>
          </span>
          <Icon name="chevron-right" size={15} className={styles.chev} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={onImportFile}
        />
      </div>

      <SectionTitle>{t('overview')}</SectionTitle>
      <div className={`card ${styles.overview}`}>
        <div>
          <b className="num">{db.habits.length}</b>
          <span>{t('habitsCount')}</span>
        </div>
        <div>
          <b className="num">{db.projects.length}</b>
          <span>{t('projects')}</span>
        </div>
        <div>
          <b className="num">{recordCount}</b>
          <span>{t('recordsCount')}</span>
        </div>
        <div>
          <b className="num">{storageKB} KB</b>
          <span>{t('storageUsed')}</span>
        </div>
      </div>
      <p className={styles.storageNote}>{t('storageNote')}</p>

      <SectionTitle>{t('dangerZone')}</SectionTitle>
      <div className={`card ${styles.group}`}>
        <button type="button" className={styles.item} onClick={onClear}>
          <Icon name="trash" size={18} className={styles.dangerIcon} />
          <span className={styles.itemMain}>
            <b className={styles.dangerText}>{t('clearData')}</b>
            <i>{t('clearDataHint')}</i>
          </span>
        </button>
      </div>

      <SectionTitle>{t('about')}</SectionTitle>
      <div className={`card ${styles.about}`}>
        <span className="brand-seal" style={{ width: 36, height: 36, fontSize: 19 }}>
          迹
        </span>
        <div className={styles.aboutText}>
          <b>{t('appName')}</b> <span className="faint">V1.1-rc.2</span>
          <p>{t('aboutText')}</p>
        </div>
      </div>

      {editor && (
        <ProjectEditor
          project={editor === 'new' ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}
