import { BookOpen, CalendarDays, LayoutDashboard, MessageSquare, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/resources', label: 'Resources', icon: BookOpen },
  { to: '/app/messages', label: 'Messages', icon: MessageSquare },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
];

export function Sidebar() {
  return <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-950 md:flex">
    <div className="mb-10 flex items-center gap-3 px-3"><span className="flex size-10 items-center justify-center rounded-xl bg-brand-600 text-white"><Users className="size-5" /></span><div><p className="font-bold tracking-tight text-slate-900 dark:text-white">CampusHub</p><p className="text-[11px] text-slate-500">Your campus, connected</p></div></div>
    <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Workspace</p>
    <nav className="space-y-1">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${isActive ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'}`}><Icon className="size-[18px]" />{label}</NavLink>)}</nav>
    <div className="mt-auto rounded-2xl bg-slate-50 p-4 dark:bg-slate-900"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Study together.</p><p className="mt-1 text-xs leading-5 text-slate-500">Keep your projects, tasks, and classmates in one place.</p></div>
  </aside>;
}
