import { BookOpen, CalendarDays, MessageSquare } from 'lucide-react';
import { Card } from '../../components/ui/Card';

const content = {
  resources: { title: 'Resources', description: 'Share notes, links, and study materials with your group.', icon: BookOpen },
  messages: { title: 'Messages', description: 'Stay in touch with classmates and keep conversations organized.', icon: MessageSquare },
  calendar: { title: 'Calendar', description: 'Keep track of deadlines, meetings, and upcoming academic events.', icon: CalendarDays },
};
export function ComingSoonPage({ page }: { page: keyof typeof content }) {
  const item = content[page];
  const Icon = item.icon;
  return <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center"><Card className="w-full p-8 text-center sm:p-12"><span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"><Icon className="size-6" /></span><p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-brand-600">Coming soon</p><h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{item.title}</h1><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description}</p><p className="mt-6 text-xs text-slate-400">This section is not available yet.</p></Card></div>;
}
