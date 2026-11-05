import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';
export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div className={cn('rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_35px_-24px_rgba(15,23,42,.35)] dark:border-slate-800 dark:bg-slate-900', className)} {...props}>{children}</div>;
}
