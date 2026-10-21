import React from 'react';
import clsx from 'clsx';

/**
 * Reusable Card component that follows the brand design system.
 */
export default function Card({
  title,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  onClick
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-slate-900/90 rounded-2xl shadow-xl border border-slate-800',
        'overflow-hidden',
        className
      )}
    >
      {title && (
        <div
          className={clsx(
            'px-5 py-3.5 bg-slate-950/60 border-b border-slate-800/80',
            'text-sm font-bold text-slate-200 uppercase tracking-wider',
            headerClassName
          )}
        >
          {title}
        </div>
      )}
      <div className={clsx('p-5', bodyClassName)}>{children}</div>
    </div>
  );
}
