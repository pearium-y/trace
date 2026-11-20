import type { DB, Lang, Project, Tag } from '../types';
import { makeT } from '../i18n';
import { projectLabel, tagLabel } from './colors';

/** 构建 Excel 友好（UTF-8 BOM）的 CSV 记录明细 */
export function buildCSV(db: DB, lang: Lang = db.lang): string {
  const t = makeT(lang);
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  const header =
    lang === 'en'
      ? ['Project', 'Habit', 'Tags', 'Date', 'Value', 'Unit', 'Note', 'Updated']
      : ['项目', '习惯', '标签', '日期', '数值', '单位', '备注', '更新时间'];
  const lines = [header.join(',')];
  const habits = [...db.habits].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  const projectName = (id: string) => {
    const p = db.projects.find((x: Project) => x.id === id);
    return p ? projectLabel(p, t) : '';
  };
  const tagNames = (ids: string[]) =>
    ids
      .map((id) => db.tags.find((tag: Tag) => tag.id === id))
      .filter((tag): tag is Tag => !!tag)
      .map((tag) => tagLabel(tag, t))
      .join(' / ');

  for (const h of habits) {
    const days = db.records[h.id] ?? {};
    const dates = Object.keys(days).sort();
    for (const d of dates) {
      const r = days[d];
      const unit = h.goalType === 'duration' ? (lang === 'en' ? 'min' : '分钟') : lang === 'en' ? 'times' : '次';
      lines.push(
        [
          esc(projectName(h.projectId)),
          esc(h.name),
          esc(tagNames(h.tagIds)),
          d,
          String(r.value),
          unit,
          esc(r.note ?? ''),
          new Date(r.updatedAt).toLocaleString(lang === 'en' ? 'en-US' : 'zh-CN'),
        ].join(','),
      );
    }
  }
  return `\uFEFF${lines.join('\n')}`;
}
