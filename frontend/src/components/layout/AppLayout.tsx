import { LogOut, Moon, Sun, UserRound, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Avatar } from '../ui/Avatar';
import { Sidebar } from './Sidebar';
import { Logo } from '../branding/Logo';

export function AppLayout() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('campushub.theme', dark ? 'dark' : 'light'); }, [dark]);
  const logout = async () => { await signOut(); toast('You have been signed out.'); navigate('/login', { replace: true }); };
  const navLinks = [{ to: '/app', label: 'Dashboard' }, { to: '/app/messages', label: 'Messages' }, { to: '/app/calendar', label: 'Calendar' }];
  return <div className="app-shell flex min-h-screen text-slate-900 dark:text-slate-100">
    <Sidebar />
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/75 sm:px-7">
        <div className="flex items-center gap-3"><button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden dark:hover:bg-slate-800" aria-label="Open navigation" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button><span className="md:hidden"><Logo href="/app" compact /></span><span className="hidden text-sm text-slate-400 md:block">Student workspace</span></div>
        <div className="flex items-center gap-2 sm:gap-4"><button aria-label="Toggle dark mode" onClick={() => setDark(!dark)} className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:bg-slate-800">{dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}</button><Link to="/app/profile" className="flex items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-slate-900"><Avatar firstName={user?.firstName ?? ''} lastName={user?.lastName ?? ''} src={user?.avatarUrl} /><span className="hidden text-left sm:block"><span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">{user?.firstName} {user?.lastName}</span><span className="block text-[10px] text-slate-500">My profile</span></span><UserRound className="hidden size-3.5 text-slate-400 sm:block" /></Link><button onClick={() => void logout()} aria-label="Sign out" title="Sign out" className="rounded-xl p-2.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:hover:bg-rose-950/30"><LogOut className="size-[18px]" /></button></div>
      </header>
      {mobileOpen && <nav className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 md:hidden">{navLinks.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/app'} onClick={() => setMobileOpen(false)} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300' : 'text-slate-600 dark:text-slate-300'}`}>{item.label}</NavLink>)}</nav>}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-7 lg:px-10"><Outlet /></main>
    </div>
  </div>;
}
