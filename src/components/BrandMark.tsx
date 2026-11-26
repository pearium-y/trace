/** 线条风日历本 + 手绘同心圆（雷达）品牌图标 */
export function BrandMark({
  size = 42,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Trace"
    >
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="14"
        fill="#c04a35"
        stroke="#9c3524"
        strokeWidth="2.4"
      />
      <g fill="none" stroke="#fdf6ec" strokeLinecap="round" strokeLinejoin="round">
        <rect x="15.5" y="20.5" width="33" height="28" rx="3.2" strokeWidth="2.2" />
        <path d="M15.9 27.7h32.2" strokeWidth="1.9" />
        <rect x="21.4" y="15.4" width="4.6" height="8.4" rx="2.3" strokeWidth="1.9" />
        <rect x="38" y="15.4" width="4.6" height="8.4" rx="2.3" strokeWidth="1.9" />
        <path
          d="M32 30.8c4.2-.2 7.7 3 7.8 7.1.1 4.2-3.3 7.6-7.5 7.6-4.2 0-7.6-3.2-7.7-7.3-.1-4 3.2-7.3 7.4-7.4z"
          strokeWidth="1.5"
        />
        <path
          d="M32 33.6c2.6-.1 4.7 1.8 4.8 4.3.1 2.5-2 4.6-4.5 4.6-2.5 0-4.5-1.9-4.6-4.4-.1-2.4 1.9-4.4 4.3-4.5z"
          strokeWidth="1.4"
        />
        <circle cx="32" cy="38.2" r="1.5" strokeWidth="1.3" />
        <path d="M32 38.2l5.6-5" strokeWidth="1.2" />
        <circle cx="35.4" cy="34.5" r="0.8" fill="#fdf6ec" stroke="none" />
      </g>
    </svg>
  );
}
