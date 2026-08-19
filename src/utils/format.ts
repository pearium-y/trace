export function fmtDuration(min: number): string {
  if (min <= 0) return '0分钟';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h > 0 && m > 0) return `${h}小时${m}分`;
  if (h > 0) return `${h}小时`;
  return `${m}分钟`;
}

export function fmtPct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export function fmtCount(n: number): string {
  return `${n}次`;
}
