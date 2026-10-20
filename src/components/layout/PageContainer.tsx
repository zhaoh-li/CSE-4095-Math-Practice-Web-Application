import type { ReactNode } from 'react';
import styles from './PageContainer.module.css';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/** Centers page content and applies consistent responsive spacing. */
export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={[styles.container, className].filter(Boolean).join(' ')}>{children}</div>;
}
