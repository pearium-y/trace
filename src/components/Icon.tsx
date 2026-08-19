import type { ReactNode } from 'react';

export type IconName =
  | 'today'
  | 'habits'
  | 'report'
  | 'settings'
  | 'plus'
  | 'chevron-left'
  | 'chevron-right'
  | 'close'
  | 'check'
  | 'trash'
  | 'edit'
  | 'download'
  | 'upload'
  | 'flame'
  | 'back';

/** 手绘笔触风格图标 */
const ICONS: Record<IconName, ReactNode> = {
  today: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="M9 15.2l2.3 2.3 4-4.6" />
    </>
  ),
  habits: (
    <>
      <rect x="5" y="3.5" width="14.5" height="17" rx="2" />
      <path d="M5 7.5h14.5" />
      <path d="M9 11.5h6.5M9 15h4.5" />
    </>
  ),
  report: (
    <>
      <path d="M4 20.5h16.5" />
      <path d="M7.5 20.5v-6M12 20.5v-11M16.5 20.5v-8" />
    </>
  ),
  settings: (
    <>
      <path d="M4 8h8.5M17.5 8H20M4 16h4.5M13.5 16H20" />
      <circle cx="15" cy="8" r="2.3" />
      <circle cx="11" cy="16" r="2.3" />
    </>
  ),
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  'chevron-left': <path d="M14.5 6l-6 6 6 6" />,
  'chevron-right': <path d="M9.5 6l6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 13l4.2 4.2L19 7.5" />,
  trash: <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13.5h9l1-13.5M10 11v6M14 11v6" />,
  edit: (
    <>
      <path d="M4.5 19.5l1-4L16.5 4.5l3 3L8.5 18.5l-4 1z" />
      <path d="M14.5 6.5l3 3" />
    </>
  ),
  download: <path d="M12 4v10.5M8 11l4 4 4-4M5 19.5h14" />,
  upload: <path d="M12 15V4.5M8 8.5l4-4 4 4M5 19.5h14" />,
  flame: (
    <>
      <path d="M12 3.5C12 3.5 17 8.2 17 12.5a5 5 0 0 1-10 0C7 8.2 12 3.5 12 3.5z" />
      <path d="M12 10.5c.9 1 1.6 2 1.6 3.1a1.6 1.6 0 0 1-3.2 0c0-1.1.7-2.1 1.6-3.1z" />
    </>
  ),
  back: <path d="M19 12H5.5M11 6l-6 6 6 6" />,
};

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}
