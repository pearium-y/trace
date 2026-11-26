import type { CSSProperties } from 'react';
import type { PaletteColor } from '../types';
import { useStore } from '../store';
import { COLOR_KEYS, colorOf } from '../utils/colors';

export function ColorPicker({
  value,
  onChange,
  colors = COLOR_KEYS,
  size = 30,
  gap = 12,
}: {
  value: PaletteColor;
  onChange: (color: PaletteColor) => void;
  colors?: PaletteColor[];
  size?: number;
  gap?: number;
}) {
  const { t } = useStore();
  return (
    <div className="color-row" style={{ gap }}>
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          className={`color-dot ${c === value ? 'on' : ''}`}
          style={{ background: colorOf(c).accent, width: size, height: size } as CSSProperties}
          onClick={() => onChange(c)}
          title={t(`palette_${c}`)}
          aria-label={t(`palette_${c}`)}
        />
      ))}
    </div>
  );
}
