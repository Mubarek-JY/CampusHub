import { useState } from 'react';
import { ArrowUpRight, BookOpen, Plus, Users, ClipboardList, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Dialog } from '../../components/ui/Dialog';
import { Field, TextAreaField } from '../../components/ui/Field';
import { Badge } from '../../components/ui/Badge';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useToast } from '../../hooks/useToast';
import { ApiError } from '../../lib/api/client';
import { useAuth } from '../auth/AuthContext';
import { useCreateGroup, useGroups, useJoinGroup } from './hooks';

const groupFormSchema = z.object({ name: z.string().trim().min(2, 'Use at least 2 characters.').max(100, 'Name is too long.'), courseName: z.string().optional(), description: z.string().optional() });
type GroupFormValues = z.infer<typeof groupFormSchema>;
const joinSchema = z.object({ joinCode: z.string().trim().min(1, 'Enter an invite code.') });
type JoinValues = z.infer<typeof joinSchema>;

function GroupCard({ group }: { group: NonNullable<ReturnType<typeof useGroups>['data']>['groups'][number] }) {
  return <Link to={`/app/groups/${group.id}`} className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"><Card className="h-full p-5 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-brand-200 group-hover:shadow-lg dark:group-hover:border-brand-900"><div className="flex items-start justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"><BookOpen className="size-5" /></span><Badge tone={group.myRole === 'OWNER' ? 'blue' : group.myRole === 'ADMIN' ? 'amber' : 'slate'}>{group.myRole}</Badge></div><h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">{group.name}</h3><p className="mt-1 min-h-5 text-sm text-slate-500 dark:text-slate-400">{group.courseName || group.description || 'Study group'}</p><div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800"><span className="inline-flex items-center gap-1.5"><Users className="size-3.5" />{group._count.members} members</span><span className="inline-flex items-center gap-1.5"><ClipboardList className="size-3.5" />{group._count.tasks} tasks</span><ArrowUpRight className="ml-auto size-4" /></div></Card></Link>;
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useGroups();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const createForm = useForm<GroupFormValues>({ resolver: zodResolver(groupFormSchema), defaultValues: { name: '', courseName: '', description: '' } });
  const joinForm = useForm<JoinValues>({ resolver: zodResolver(joinSchema), defaultValues: { joinCode: '' } });
  const handleCreate = createForm.handleSubmit(async (values) => {
    try { await createGroup.mutateAsync({ ...values, courseName: values.courseName || undefined, description: values.description || undefined }); toast('Group created.'); setCreateOpen(false); createForm.reset(); }
    catch (err) {
      if (err instanceof ApiError) Object.entries(err.fieldErrors).forEach(([field, messages]) => createForm.setError(field as keyof GroupFormValues, { message: messages[0] }));
      toast(err instanceof ApiError ? err.message : 'Could not create group.', 'error');
    }
  });
  const handleJoin = joinForm.handleSubmit(async (values) => {
    try { const result = await joinGroup.mutateAsync(values.joinCode.trim()); toast(`Joined ${result.group.name}.`); setJoinOpen(false); joinForm.reset(); }
    catch (err) {
      if (err instanceof ApiError) Object.entries(err.fieldErrors).forEach(([field, messages]) => joinForm.setError(field as keyof JoinValues, { message: messages[0] }));
      toast(err instanceof ApiError ? err.message : 'Could not join group.', 'error');
    }
  });
  return <div className="space-y-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-brand-600">Your workspace</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Good to see you, {user?.firstName}.</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Pick up where your study groups left off.</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setJoinOpen(true)}><Hash className="size-4" /> Join with code</Button><Button onClick={() => setCreateOpen(true)}><Plus className="size-4" /> Create group</Button></div></div>
    <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">Your groups</h2><p className="mt-0.5 text-xs text-slate-500">Collaborate with classmates and keep track of tasks.</p></div>{!isLoading && !isError && <span className="text-xs text-slate-400">{data?.groups.length ?? 0} groups</span>}</div>
      {isLoading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><LoadingState rows={3} /></div> : isError ? <ErrorState message={error instanceof Error ? error.message : 'Could not load your groups.'} onRetry={() => void refetch()} /> : data?.groups.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.groups.map((group) => <GroupCard key={group.id} group={group} />)}</div> : <EmptyState title="No groups yet" description="Create a study group or join one using an invite code from a classmate." action={<div className="flex gap-2"><Button variant="secondary" onClick={() => setJoinOpen(true)}>Join with code</Button><Button onClick={() => setCreateOpen(true)}><Plus className="size-4" /> Create group</Button></div>} />}
    </section>
    <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Create a study group"><form className="space-y-4" onSubmit={handleCreate} noValidate><Field id="group-name" label="Group name" placeholder="e.g. Data Structures Study Group" {...createForm.register('name')} error={createForm.formState.errors.name?.message} /><Field id="course-name" label="Course name (optional)" placeholder="e.g. Data Structures and Algorithms" {...createForm.register('courseName')} /><TextAreaField id="group-description" label="Description (optional)" rows={3} placeholder="What will your group work on?" {...createForm.register('description')} /><div className="flex justify-end gap-2 pt-2"><Button variant="secondary" type="button" onClick={() => setCreateOpen(false)}>Cancel</Button><Button type="submit" disabled={createGroup.isPending}>{createGroup.isPending ? 'Creating…' : 'Create group'}</Button></div></form></Dialog>
    <Dialog open={joinOpen} onClose={() => setJoinOpen(false)} title="Join a group"><form className="space-y-4" onSubmit={handleJoin} noValidate><Field id="join-code" label="Invite code" placeholder="Enter the group code" {...joinForm.register('joinCode')} error={joinForm.formState.errors.joinCode?.message} /><p className="text-xs text-slate-500">Ask the group owner or an admin for the invite code.</p><div className="flex justify-end gap-2 pt-2"><Button variant="secondary" type="button" onClick={() => setJoinOpen(false)}>Cancel</Button><Button type="submit" disabled={joinGroup.isPending}>{joinGroup.isPending ? 'Joining…' : 'Join group'}</Button></div></form></Dialog>
  </div>;
}
