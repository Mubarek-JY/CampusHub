import { useState } from 'react';
import { ArrowLeft, BookOpen, ClipboardList, Settings, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { ApiError } from '../../lib/api/client';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { TaskBoard } from './TaskBoard';
import { MembersPanel } from './MembersPanel';
import { SettingsPanel } from './SettingsPanel';
import { useGroup } from './hooks';
import { ResourcesPage } from '../resources/ResourcesPage';

type Tab = 'tasks' | 'resources' | 'members' | 'settings';
const tabs: { key: Tab; label: string; icon: typeof ClipboardList }[] = [
  { key: 'tasks', label: 'Tasks', icon: ClipboardList },
  { key: 'resources', label: 'Resources', icon: BookOpen },
  { key: 'members', label: 'Members', icon: Users },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export function GroupPage() {
  const { groupId = '' } = useParams();
  const { data, isLoading, isError, error, refetch } = useGroup(groupId);
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  if (isLoading) return <div className="space-y-5"><LoadingState rows={1} /><LoadingState rows={4} /></div>;
  if (isError || !data?.group) {
    const message = error instanceof ApiError && error.status === 404
      ? 'Group not found or you do not have access.'
      : error instanceof Error ? error.message : 'Could not load this group.';
    return <div className="mx-auto max-w-2xl"><Link to="/app" className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600"><ArrowLeft className="size-4" /> Back to dashboard</Link><ErrorState message={message} onRetry={() => void refetch()} /></div>;
  }
  const group = data.group;
  return <div className="space-y-7"><div><Link to="/app" className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-brand-600"><ArrowLeft className="size-3.5" /> All groups</Link><div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{group.name}</h1><Badge tone={group.myRole === 'OWNER' ? 'blue' : group.myRole === 'ADMIN' ? 'amber' : 'slate'}>{group.myRole}</Badge></div><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{group.courseName || group.description || 'Study group'} · {group.members.length} members · {group._count.tasks} tasks</p></div><div className="text-xs text-slate-400">Created {new Date(group.createdAt).toLocaleDateString()}</div></div></div>
    <div className="border-b border-slate-200 dark:border-slate-800"><nav className="-mb-px flex gap-6" aria-label="Group sections">{tabs.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => setActiveTab(key)} aria-current={activeTab === key ? 'page' : undefined} className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition ${activeTab === key ? 'border-brand-600 text-brand-700 dark:text-brand-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}><Icon className="size-4" />{label}</button>)}</nav></div>
    {activeTab === 'tasks' && <TaskBoard group={group} />}
    {activeTab === 'resources' && <ResourcesPage groupId={group.id} />}
    {activeTab === 'members' && <MembersPanel group={group} />}
    {activeTab === 'settings' && <SettingsPanel group={group} />}
  </div>;
}
