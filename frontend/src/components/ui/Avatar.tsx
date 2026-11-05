import { initials } from '../../lib/utils';
export function Avatar({ firstName, lastName, src, size = 'md' }: { firstName: string; lastName: string; src?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'size-7 text-[10px]', md: 'size-9 text-xs', lg: 'size-12 text-sm' };
  return src ? <img src={src} alt={`${firstName} ${lastName}`} className={`${sizes[size]} rounded-full object-cover`} /> : <span aria-label={`${firstName} ${lastName}`} className={`${sizes[size]} inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 dark:bg-brand-900/50 dark:text-brand-200`}>{initials(firstName, lastName)}</span>;
}
