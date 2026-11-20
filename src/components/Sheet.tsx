import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { Icon } from './Icon';
import styles from './Sheet.module.css';

export function Sheet({
  title,
  onClose,
  children,
}: {
  title?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useStore();
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.grip} />
        {title && (
          <div className={styles.head}>
            <div className={styles.title}>{title}</div>
            <button className="icon-btn" onClick={onClose} aria-label={t('close')}>
              <Icon name="close" size={18} />
            </button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
