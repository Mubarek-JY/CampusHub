import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; children: ReactNode };
export function Button({ className, variant = 'primary', size = 'md', ...props }: Props) {
  return <button className={cn('inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]',
    variant === 'primary' && 'bg-brand-600 text-white shadow-[0_8px_20px_-10px_rgba(37,99,235,.8)] hover:-translate-y-0.5 hover:bg-brand-700',
    variant === 'secondary' && 'border border-slate-200/90 bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800',
    variant === 'ghost' && 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
    variant === 'danger' && 'bg-rose-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-rose-700',
    size === 'sm' && 'px-3 py-1.5 text-xs', size === 'md' && 'px-4 py-2.5 text-sm', size === 'lg' && 'px-5 py-3 text-sm', className)} {...props} />;
}
