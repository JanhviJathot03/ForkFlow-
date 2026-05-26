import type { ReactNode } from 'react';

type GlassCardProps = {
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  /** Single frosted panel — no header/body seam */
  unified?: boolean;
};

export function GlassCard({
  header,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  unified = false,
}: GlassCardProps) {
  if (unified || !header) {
    return (
      <div className={`glass-card glass-card-unified ${className}`.trim()}>
        <div className={`glass-card-unified-inner ${bodyClassName}`.trim()}>
          {header}
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card ${className}`.trim()}>
      <div className={`glass-card-header ${headerClassName}`.trim()}>{header}</div>
      <div className={`glass-card-body ${bodyClassName}`.trim()}>{children}</div>
    </div>
  );
}
