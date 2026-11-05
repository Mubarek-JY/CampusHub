import { useState } from 'react';
import { BookOpen, ExternalLink, FileText, Link as LinkIcon, Plus, Search, Star, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Dialog } from '../../components/ui/Dialog';
import { Field, SelectField, TextAreaField } from '../../components/ui/Field';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { ApiError } from '../../lib/api/client';
import type { Resource } from '../../lib/api/types';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../auth/AuthContext';
import { useCreateResource, useDeleteResource, useRateResource, useResources, useUploadResource } from './hooks';

const resourceFormSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title.'),
  type: z.enum(['LINK', 'FILE', 'NOTE']),
  url: z.string().url('Enter a valid URL.').or(z.literal('')),
  content: z.string().optional(),
  description: z.string().optional(),
  courseName: z.string().optional(),
  tags: z.string().optional(),
  isPublic: z.boolean(),
}).superRefine((value, ctx) => {
  if (value.type === 'LINK' && !value.url) ctx.addIssue({ code: 'custom', path: ['url'], message: 'A URL is required.' });
  if (value.type === 'FILE' && !value.url && !(document.getElementById('resource-file') as HTMLInputElement | null)?.files?.length) ctx.addIssue({ code: 'custom', path: ['url'], message: 'Choose a file.' });
  if (value.type === 'NOTE' && !value.content?.trim()) ctx.addIssue({ code: 'custom', path: ['content'], message: 'Content is required.' });
});
type ResourceFormValues = z.infer<typeof resourceFormSchema>;

function ResourceCard({ resource, userId }: { resource: Resource; userId?: string }) {
  const rate = useRateResource();
  const remove = useDeleteResource();
  const { toast } = useToast();
  const Icon = resource.type === 'NOTE' ? FileText : resource.type === 'FILE' ? BookOpen : LinkIcon;
  const handleDelete = async () => {
    if (!window.confirm('Delete this resource?')) return;
    try { await remove.mutateAsync(resource.id); toast('Resource deleted.'); }
    catch (error) { toast(error instanceof ApiError ? error.message : 'Could not delete resource.', 'error'); }
  };
  return <Card className="p-5"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold text-slate-900 dark:text-white">{resource.title}</h3><p className="mt-1 text-xs text-slate-500">{resource.type} · by {resource.uploader.firstName} {resource.uploader.lastName}{resource.group ? ` · ${resource.group.name}` : ''}</p></div>{resource.uploaderId === userId && <button aria-label={`Delete ${resource.title}`} className="text-slate-400 hover:text-rose-600" onClick={() => void handleDelete()}><Trash2 className="size-4" /></button>}</div>{resource.description && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{resource.description}</p>}{resource.type === 'NOTE' && resource.content && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{resource.content}</p>}{resource.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{resource.tags.map((tag) => <Badge key={tag} tone="slate">{tag}</Badge>)}</div>}<div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">{resource.url && <a className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline dark:text-brand-300" href={resource.url} target="_blank" rel="noreferrer">Open resource <ExternalLink className="size-3.5" /></a>}<span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500"><Star className="size-3.5 text-amber-500" />{resource.rating.average ?? 'No ratings'}{resource.rating.count ? ` (${resource.rating.count})` : ''}</span><select aria-label={`Rate ${resource.title}`} value={resource.rating.mine ?? ''} onChange={(event) => { const value = Number(event.target.value); if (value) void rate.mutateAsync({ resourceId: resource.id, value }); }} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"><option value="">Rate</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} star{value > 1 ? 's' : ''}</option>)}</select></div></div></div></Card>;
}

export function ResourcesPage({ groupId }: { groupId: string }) {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error, refetch } = useResources({ groupId, search });
  const create = useCreateResource();
  const upload = useUploadResource();
  const { toast } = useToast();
  const form = useForm<ResourceFormValues>({ resolver: zodResolver(resourceFormSchema), defaultValues: { title: '', type: 'LINK', url: '', content: '', description: '', courseName: '', tags: '', isPublic: true } });
  const type = form.watch('type');
  const submit = form.handleSubmit(async (values) => {
    try {
      const file = (document.getElementById('resource-file') as HTMLInputElement | null)?.files?.[0];
      const input = { ...values, groupId, url: values.url || undefined, content: values.content || undefined, description: values.description || undefined, courseName: values.courseName || undefined, tags: values.tags?.split(',').map((tag) => tag.trim()).filter(Boolean) };
      if (values.type === 'FILE' && file) await upload.mutateAsync({ file, input });
      else if (values.type === 'FILE') throw new Error('Choose a file.');
      else await create.mutateAsync(input);
      toast('Resource shared.'); form.reset(); setDialogOpen(false);
    } catch (error) {
      if (error instanceof ApiError) Object.entries(error.fieldErrors).forEach(([field, messages]) => form.setError(field as keyof ResourceFormValues, { message: messages[0] }));
      toast(error instanceof ApiError ? error.message : 'Could not share resource.', 'error');
    }
  });
  return <div className="space-y-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-brand-600">Group knowledge base</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Resources</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Share notes, links, and study materials with this group.</p></div><Button onClick={() => setDialogOpen(true)}><Plus className="size-4" /> Share resource</Button></div><div className="relative max-w-xl"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resources..." className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" /></div>{isLoading ? <LoadingState rows={4} /> : isError ? <ErrorState message={error instanceof Error ? error.message : 'Could not load resources.'} onRetry={() => void refetch()} /> : data?.resources.length ? <div className="grid gap-4 lg:grid-cols-2">{data.resources.map((resource) => <ResourceCard key={resource.id} resource={resource} userId={user?.id} />)}</div> : <EmptyState title="No resources yet" description="Share the first note, link, or study material with your classmates." action={<Button onClick={() => setDialogOpen(true)}><Plus className="size-4" /> Share resource</Button>} />}<Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Share a resource"><form className="space-y-4" onSubmit={submit} noValidate><Field id="resource-title" label="Title" placeholder="e.g. Week 3 lecture notes" {...form.register('title')} error={form.formState.errors.title?.message} /><SelectField id="resource-type" label="Type" {...form.register('type')}><option value="LINK">Link</option><option value="FILE">File URL</option><option value="NOTE">Note</option></SelectField>{  type === 'NOTE' ? <TextAreaField id="resource-content" label="Content" rows={6} {...form.register('content')} error={form.formState.errors.content?.message} /> : type === 'FILE' ? <Field id="resource-file" label="File" type="file" accept=".pdf,.txt,.csv,.jpg,.jpeg,.png,.webp,.docx,.pptx,.xlsx" error={form.formState.errors.url?.message} /> : <Field id="resource-url" label="URL" placeholder="https://..." {...form.register('url')} error={form.formState.errors.url?.message} />}{type !== 'NOTE' && <TextAreaField id="resource-description" label="Description (optional)" rows={3} {...form.register('description')} />}{type === 'NOTE' && <Field id="resource-course" label="Course (optional)" {...form.register('courseName')} />}<Field id="resource-tags" label="Tags (optional)" placeholder="algorithms, exam, week-3" hint="Separate tags with commas." {...form.register('tags')} /><label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" {...form.register('isPublic')} /> Share publicly</label><div className="flex justify-end gap-2"><Button variant="secondary" type="button" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={create.isPending}>{create.isPending ? 'Sharing…' : 'Share resource'}</Button></div></form></Dialog></div>;
}
