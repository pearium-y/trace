import type { Lang } from './types';

export const APP_VERSION = '1.1.0-rc.3';

/** 当前版本的发行注记 */
export const RELEASE_NOTES: Record<Lang, string[]> = {
  zh: [
    '新增可选页面「便签墙」：记录想记住的事或提醒事项，支持每日小红点提醒，并可关联某个习惯；可在「设置」中随时启用或禁用。',
    '设置中的「关于」卡片现在可以点击查看当前版本的发行注记。',
    '修复英文界面左上角重复显示 “Trace” 的问题。',
    '重新绘制网站图标：线条风日历本配手绘同心圆。',
  ],
  en: [
    'New optional “Notes Wall” page: keep reminders with daily red-dot alerts and link a note to a habit. Enable or disable it anytime in Settings.',
    'The About card in Settings now opens the release notes for the current version.',
    'Fixed the duplicated “Trace” label at the top-left in English.',
    'Redrew the site icon: a line-art calendar with hand-drawn concentric rings.',
  ],
};
