import type { ReactNode } from 'react';
import { useStore } from '../store';

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  small,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  small?: boolean;
}) {
  return (
    <div className={`seg ${small ? 'seg-sm' : ''}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`seg-item ${o.value === value ? 'active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ ratio, color }: { ratio: number; color?: string }) {
  const r = Math.max(0, Math.min(1, ratio));
  return (
    <div className="progress" role="presentation">
      <div className="progress-fill" style={{ width: `${r * 100}%`, background: color ?? 'var(--ink)' }} />
    </div>
  );
}

export function StampSeal({ text = '迹', size = 68 }: { text?: string; size?: number }) {
  return (
    <span className="stamp-seal" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {text}
    </span>
  );
}

export function SealDone({ size = 27 }: { size?: number }) {
  const { t } = useStore();
  return (
    <span className="seal-done" style={{ width: size, height: size }} aria-label={t('recorded')}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 13l4.2 4.2L19 7.5" />
      </svg>
    </span>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="section-title">{children}</h2>;
}
