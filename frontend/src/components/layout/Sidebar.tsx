import { BookOpen, CalendarDays, LayoutDashboard, MessageSquare } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Logo } from '../branding/Logo';

const links = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/resources', label: 'Resources', icon: BookOpen },
  { to: '/app/messages', label: 'Messages', icon: MessageSquare },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
];

export function Sidebar() {
  return <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white/70 px-4 py-7 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/65 md:flex">
    <div className="mb-10 px-3"><Logo href="/app" showTagline /></div>
    <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Workspace</p>
    <nav className="space-y-1">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${isActive ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'}`}><Icon className="size-[18px]" />{label}</NavLink>)}</nav>
    <div className="mt-auto overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 dark:border-brand-900/50 dark:from-brand-950/50 dark:to-slate-900"><p className="text-xs font-bold text-brand-800 dark:text-brand-200">Study together.</p><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Keep your projects, tasks, and classmates in one place.</p></div>
  </aside>;
}
