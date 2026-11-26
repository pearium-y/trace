import type { Lang } from './types';

export const APP_VERSION = '1.1.0-rc.4';

/** 当前版本的发行注记 */
export const RELEASE_NOTES: Record<Lang, string[]> = {
  zh: [
    '清理无人使用的代码与国际化文案，统一项目、习惯与标签的查找逻辑。',
    '复用标签胶囊和颜色选择器组件，并拆分项目管理相关组件，降低维护成本。',
    '修复便签详情页在英文界面下日期仍显示中文的问题。',
    '修复设置页「占用」在首次进入或数据变更后显示旧值的问题。',
  ],
  en: [
    'Removed unused code and translation keys, and unified project / habit / tag lookup logic.',
    'Reused shared tag chip and color picker components, and split the project management components to reduce maintenance cost.',
    'Fixed the note detail date showing Chinese in the English interface.',
    'Fixed the Settings storage usage showing a stale value on first load or after data changes.',
  ],
};
