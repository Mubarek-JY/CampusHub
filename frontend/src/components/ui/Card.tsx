import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';
export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div className={cn('rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900', className)} {...props}>{children}</div>;
}
