import type { Lang } from './types';

export const APP_VERSION = '1.1.0-rc.5';

/** 当前版本的发行注记 */
export const RELEASE_NOTES: Record<Lang, string[]> = {
  zh: [
    '新增可选「快排」功能：把今天的习惯像搭积木一样按时间顺序排进时间轴。',
    '支持拖拽排程、自动 5 分钟休息与可调长休息，以及完成打卡和时长调整。',
    '支持把当日计划导出为 .ics 日历文件；计划仅保留当天，跨天自动清空。',
    '可在设置中随时启用或关闭快排。',
  ],
  en: [
    'Added an optional Rush feature to lay out today’s habits on a timeline in order.',
    'Drag to schedule, automatic 5-minute rests and adjustable long breaks, completion checks and duration editing.',
    'Export the day’s plan as an .ics calendar file; plans are kept for today only and clear automatically.',
    'Enable or disable Rush anytime in Settings.',
  ],
};
