import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useStore } from '../store';
import { DB_KEY, buildExport, parseImport } from '../storage';
import { SectionTitle } from '../components/Basics';
import { Icon } from '../components/Icon';
import { today } from '../utils/date';
import { buildCSV } from '../utils/csv';
import { downloadFile } from '../utils/download';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const { db, importDB, clearAll } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

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
    setMsg(`已导出备份：${name}`);
  };

  const exportCSV = () => {
    const name = `trace-records-${today().replaceAll('-', '')}.csv`;
    downloadFile(name, buildCSV(db), 'text/csv');
    setMsg(`已导出记录：${name}`);
  };

  const onImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseImport(text);
      if (!parsed) {
        setMsg('导入失败：不是有效的循迹备份文件');
        return;
      }
      const ok = window.confirm(
        `将用备份覆盖当前数据。\n\n当前：${db.habits.length} 个计划、${recordCount} 条记录\n备份：${parsed.habits.length} 个计划\n\n确定覆盖吗？`,
      );
      if (ok) {
        importDB(parsed);
        setMsg('导入成功，数据已恢复');
      }
    } catch {
      setMsg('导入失败：文件读取错误');
    }
  };

  const onClear = () => {
    if (!window.confirm('确定清空全部数据？此操作不可恢复。')) return;
    if (!window.confirm('再次确认：真的要清空全部计划与记录吗？建议先导出备份。')) return;
    clearAll();
    setMsg('已清空全部数据');
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">
          设置<small>SETTINGS</small>
        </h1>
      </header>

      {msg && <div className={styles.msg}>{msg}</div>}

      <SectionTitle>数据备份</SectionTitle>
      <div className={`card ${styles.group}`}>
        <button type="button" className={styles.item} onClick={exportJSON}>
          <Icon name="download" size={18} />
          <span className={styles.itemMain}>
            <b>导出 JSON 备份</b>
            <i>完整数据，可用于恢复或迁移到其他设备</i>
          </span>
          <Icon name="chevron-right" size={15} className={styles.chev} />
        </button>
        <button type="button" className={styles.item} onClick={exportCSV}>
          <Icon name="download" size={18} />
          <span className={styles.itemMain}>
            <b>导出 CSV 记录</b>
            <i>全部记录明细，可用表格软件打开分析</i>
          </span>
          <Icon name="chevron-right" size={15} className={styles.chev} />
        </button>
        <button type="button" className={styles.item} onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={18} />
          <span className={styles.itemMain}>
            <b>导入备份</b>
            <i>从 JSON 备份文件恢复，将覆盖当前数据</i>
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

      <SectionTitle>数据概览</SectionTitle>
      <div className={`card ${styles.overview}`}>
        <div>
          <b className="num">{db.habits.length}</b>
          <span>计划</span>
        </div>
        <div>
          <b className="num">{recordCount}</b>
          <span>记录</span>
        </div>
        <div>
          <b className="num">{storageKB} KB</b>
          <span>占用</span>
        </div>
      </div>
      <p className={styles.storageNote}>数据仅保存在本浏览器（localStorage）中，更换设备请使用 JSON 备份迁移。</p>

      <SectionTitle>危险区域</SectionTitle>
      <div className={`card ${styles.group}`}>
        <button type="button" className={styles.item} onClick={onClear}>
          <Icon name="trash" size={18} className={styles.dangerIcon} />
          <span className={styles.itemMain}>
            <b className={styles.dangerText}>清空全部数据</b>
            <i>删除所有计划与记录，不可恢复</i>
          </span>
        </button>
      </div>

      <SectionTitle>关于</SectionTitle>
      <div className={`card ${styles.about}`}>
        <span className="brand-seal" style={{ width: 36, height: 36, fontSize: 19 }}>
          迹
        </span>
        <div className={styles.aboutText}>
          <b>循迹 Trace</b> <span className="faint">v1.0.0</span>
          <p>记录与追踪你的习惯和计划。纸页之间，看见坚持的痕迹。</p>
        </div>
      </div>
    </div>
  );
}
