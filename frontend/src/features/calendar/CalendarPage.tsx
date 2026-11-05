import { useState } from 'react';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Dialog } from '../../components/ui/Dialog';
import { Field, SelectField, TextAreaField } from '../../components/ui/Field';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { ApiError } from '../../lib/api/client';
import { useToast } from '../../hooks/useToast';
import { useGroups } from '../dashboard/hooks';
import { useCalendarEvents, useCreateCalendarEvent, useDeleteCalendarEvent } from './hooks';

const schema = z.object({ title: z.string().trim().min(1, 'Enter a title.'), description: z.string().optional(), type: z.enum(['CLASS', 'EXAM', 'DEADLINE', 'STUDY_SESSION', 'MEETING', 'OTHER']), startsAt: z.string().min(1, 'Choose a start time.'), endsAt: z.string().optional(), location: z.string().optional(), groupId: z.string().optional() });
type Values = z.infer<typeof schema>;
export function CalendarPage() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, error, refetch } = useCalendarEvents();
  const { data: groups } = useGroups();
  const create = useCreateCalendarEvent();
  const remove = useDeleteCalendarEvent();
  const { toast } = useToast();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { title: '', type: 'OTHER', startsAt: '', endsAt: '', description: '', location: '', groupId: '' } });
  const submit = form.handleSubmit(async (values) => {
    try { await create.mutateAsync({ ...values, description: values.description || undefined, endsAt: values.endsAt || undefined, location: values.location || undefined, groupId: values.groupId || undefined }); toast('Event created.'); form.reset(); setOpen(false); }
    catch (err) { if (err instanceof ApiError) Object.entries(err.fieldErrors).forEach(([field, messages]) => form.setError(field as keyof Values, { message: messages[0] })); toast(err instanceof ApiError ? err.message : 'Could not create event.', 'error'); }
  });
  const deleteEvent = async (id: string) => { if (!window.confirm('Delete this event?')) return; try { await remove.mutateAsync(id); toast('Event deleted.'); } catch (err) { toast(err instanceof ApiError ? err.message : 'Could not delete event.', 'error'); } };
  return <div className="space-y-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-brand-600">Your schedule</p><h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Calendar</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Track classes, deadlines, meetings, and study sessions.</p></div><Button onClick={() => setOpen(true)}><Plus className="size-4" /> Add event</Button></div>{isLoading ? <LoadingState rows={4} /> : isError ? <ErrorState message={error instanceof Error ? error.message : 'Could not load calendar.'} onRetry={() => void refetch()} /> : data?.events.length ? <div className="grid gap-3">{data.events.map((event) => <Card key={event.id} className="flex items-start gap-4 p-5"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"><CalendarDays className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><div><h2 className="font-semibold text-slate-900 dark:text-white">{event.title}</h2><p className="mt-1 text-xs font-medium uppercase tracking-wide text-brand-600">{event.type.replace('_', ' ')}</p></div><button aria-label={`Delete ${event.title}`} className="text-slate-400 hover:text-rose-600" onClick={() => void deleteEvent(event.id)}><Trash2 className="size-4" /></button></div><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{new Date(event.startsAt).toLocaleString()}{event.endsAt ? ` – ${new Date(event.endsAt).toLocaleTimeString()}` : ''}{event.location ? ` · ${event.location}` : ''}{event.group ? ` · ${event.group.name}` : ''}</p>{event.description && <p className="mt-2 text-sm text-slate-500">{event.description}</p>}</div></Card>)}</div> : <EmptyState title="No events yet" description="Add your first class, deadline, or study session." action={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Add event</Button>} />}<Dialog open={open} onClose={() => setOpen(false)} title="Add calendar event"><form onSubmit={submit} className="space-y-4" noValidate><Field id="event-title" label="Title" placeholder="e.g. Algorithms exam" {...form.register('title')} error={form.formState.errors.title?.message} /><SelectField id="event-type" label="Type" {...form.register('type')}><option value="CLASS">Class</option><option value="EXAM">Exam</option><option value="DEADLINE">Deadline</option><option value="STUDY_SESSION">Study session</option><option value="MEETING">Meeting</option><option value="OTHER">Other</option></SelectField><SelectField id="event-group" label="Share with group (optional)" {...form.register('groupId')}><option value="">Personal event</option>{groups?.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</SelectField><Field id="event-start" label="Starts" type="datetime-local" {...form.register('startsAt')} error={form.formState.errors.startsAt?.message} /><Field id="event-end" label="Ends (optional)" type="datetime-local" {...form.register('endsAt')} /><Field id="event-location" label="Location (optional)" {...form.register('location')} /><TextAreaField id="event-description" label="Description (optional)" rows={3} {...form.register('description')} /><div className="flex justify-end gap-2"><Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={create.isPending}>{create.isPending ? 'Adding…' : 'Add event'}</Button></div></form></Dialog></div>;
}
