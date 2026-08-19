import type { DB } from '../types';

/** 构建 Excel 友好（UTF-8 BOM）的 CSV 记录明细 */
export function buildCSV(db: DB): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  const lines = ['计划,日期,数值,单位,备注,更新时间'];
  const habits = [...db.habits].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  for (const h of habits) {
    const days = db.records[h.id] ?? {};
    const dates = Object.keys(days).sort();
    for (const d of dates) {
      const r = days[d];
      const unit = h.goalType === 'duration' ? '分钟' : '次';
      lines.push(
        [
          esc(h.name),
          d,
          String(r.value),
          unit,
          esc(r.note ?? ''),
          new Date(r.updatedAt).toLocaleString('zh-CN'),
        ].join(','),
      );
    }
  }
  return `\uFEFF${lines.join('\n')}`;
}
