import type { ReactNode } from 'react';

export type IconName =
  | 'today'
  | 'habits'
  | 'report'
  | 'settings'
  | 'plus'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'close'
  | 'check'
  | 'trash'
  | 'edit'
  | 'download'
  | 'upload'
  | 'flame'
  | 'back'
  | 'search'
  | 'sort'
  | 'filter'
  | 'folder'
  | 'globe'
  | 'tag'
  | 'note'
  | 'sticky'
  | 'bell';

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
  'chevron-down': <path d="M6 9.5l6 6 6-6" />,
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
  search: (
    <>
      <circle cx="11" cy="11" r="6.2" />
      <path d="M15.6 15.6L20 20" />
    </>
  ),
  sort: <path d="M4 7h10M4 12h7M4 17h4M17.5 5v14M14.5 16l3 3 3-3" />,
  filter: <path d="M4 5h16l-6.2 7.5V19l-3.6 1.8v-8.3L4 5z" />,
  folder: <path d="M3.5 6.5h6l2 2.5h9v9.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5V6.5z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M3.8 12h16.4M12 3.8c2.2 2.3 3.4 5.2 3.4 8.2s-1.2 5.9-3.4 8.2c-2.2-2.3-3.4-5.2-3.4-8.2s1.2-5.9 3.4-8.2z" />
    </>
  ),
  tag: (
    <>
      <path d="M4 4.5h7.2l8.3 8.3-7.2 7.2L4 11.7V4.5z" />
      <circle cx="8" cy="8" r="1.2" />
    </>
  ),
  note: (
    <>
      <path d="M5 4.5h14v15H5z" />
      <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4.5" />
    </>
  ),
  sticky: (
    <>
      <path d="M5 4.5h14v10.5l-4.5 4.5H5z" />
      <path d="M19 15h-4.5v4.5" />
      <path d="M8.5 9h7M8.5 12h4.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16.5h12c-1.2-1.3-1.9-3.1-1.9-5.2V10a4.1 4.1 0 0 0-8.2 0v1.3c0 2.1-.7 3.9-1.9 5.2z" />
      <path d="M10.2 19a2 2 0 0 0 3.6 0" />
    </>
  ),
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
