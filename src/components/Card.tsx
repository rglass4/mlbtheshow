import type { PropsWithChildren, ReactNode } from 'react';

interface CardProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export const Card = ({ title, subtitle, action, className, children }: CardProps) => (
  <section className={`panel ${className ?? ''}`}>
    {(title || subtitle || action) && (
      <header className="panel-header">
        <div>
          {title ? <h2>{title}</h2> : null}
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action}
      </header>
    )}
    {children}
  </section>
);
