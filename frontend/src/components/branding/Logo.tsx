import { Link } from 'react-router-dom';

type LogoProps = {
  href?: string;
  showTagline?: boolean;
  compact?: boolean;
};

export function Logo({ href, showTagline = false, compact = false }: LogoProps) {
  const content = <span className="inline-flex items-center gap-3">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/20" aria-hidden="true">
      <svg viewBox="0 0 32 32" className="size-6 fill-none stroke-current" role="img">
        <path d="M7 9.5 16 5l9 4.5-9 4.5-9-4.5Z" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M10 12v7.5c0 1.7 2.7 3.5 6 3.5s6-1.8 6-3.5V12M25 10v8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 16.5h8" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </span>
    {!compact && <span className="min-w-0"><span className="block font-bold tracking-tight text-slate-900 dark:text-white">CampusHub</span>{showTagline && <span className="block text-[11px] text-slate-500">Your campus, connected</span>}</span>}
  </span>;

  return href ? <Link to={href} aria-label="CampusHub home">{content}</Link> : content;
}
