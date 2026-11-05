import { useMemo, useState, useEffect } from 'react';
import type { DragEvent } from 'react';
import { CalendarDays, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Group, Task, TaskStatus } from '../../lib/api/types';
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from './hooks';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Dialog, ConfirmDialog } from '../../components/ui/Dialog';
import { Field, SelectField, TextAreaField } from '../../components/ui/Field';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useToast } from '../../hooks/useToast';
import { ApiError } from '../../lib/api/client';
import { formatDate, isOverdue } from '../../lib/utils';
import { useAuth } from '../auth/AuthContext';

const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'TODO', label: 'To do', color: 'bg-slate-400' },
  { status: 'IN_PROGRESS', label: 'In progress', color: 'bg-blue-500' },
  { status: 'DONE', label: 'Done', color: 'bg-emerald-500' },
];
const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required.').max(200, 'Title is too long.'),
  description: z.string().optional(), priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  dueDate: z.string().optional(), assigneeId: z.string().optional(),
});
type TaskFormValues = z.infer<typeof taskFormSchema>;

function TaskDialog({ open, onClose, group, task }: { open: boolean; onClose: () => void; group: Group; task?: Task | null }) {
  const create = useCreateTask(group.id);
  const update = useUpdateTask(group.id);
  const { toast } = useToast();
  const form = useForm<TaskFormValues>({ resolver: zodResolver(taskFormSchema), defaultValues: { title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' } });
  const { reset } = form;
  useEffect(() => {
    if (open) reset({
      title: task?.title ?? '', description: task?.description ?? '', priority: task?.priority ?? 'MEDIUM',
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '', assigneeId: task?.assigneeId ?? '',
    });
  }, [open, task, reset]);
  const submit = form.handleSubmit(async (values) => {
    const dueDate = values.dueDate ? new Date(`${values.dueDate}T23:59:00`).toISOString() : undefined;
    try {
      if (task) {
        await update.mutateAsync({ taskId: task.id, input: { title: values.title, description: values.description || null, priority: values.priority, dueDate: dueDate ?? null, assigneeId: values.assigneeId || null } });
        toast('Task updated.');
      } else {
        await create.mutateAsync({ title: values.title, description: values.description || undefined, priority: values.priority, dueDate, assigneeId: values.assigneeId || undefined });
        toast('Task created.');
      }
      onClose();
    } catch (error) {
      if (error instanceof ApiError) Object.entries(error.fieldErrors).forEach(([field, messages]) => form.setError(field as keyof TaskFormValues, { message: messages[0] }));
      toast(error instanceof ApiError ? error.message : 'Unable to save task.', 'error');
    }
  });
  const busy = create.isPending || update.isPending;
  return <Dialog open={open} onClose={onClose} title={task ? 'Edit task' : 'Create a task'}><form onSubmit={submit} className="space-y-4" noValidate>
    <Field id="task-title" label="Task title" placeholder="What needs to get done?" {...form.register('title')} error={form.formState.errors.title?.message} />
    <TextAreaField id="task-description" label="Description" rows={3} placeholder="Add useful details (optional)" {...form.register('description')} />
    <div className="grid grid-cols-2 gap-3"><SelectField id="task-priority" label="Priority" {...form.register('priority')}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></SelectField><Field id="task-due-date" label="Due date" type="date" {...form.register('dueDate')} /></div>
    <SelectField id="task-assignee" label="Assignee" {...form.register('assigneeId')}><option value="">Unassigned</option>{group.members.map((member) => <option key={member.userId} value={member.userId}>{member.user.firstName} {member.user.lastName}</option>)}</SelectField>
    <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : task ? 'Save changes' : 'Create task'}</Button></div>
  </form></Dialog>;
}

function TaskCard({ task, onEdit, onDelete, canDelete, onStatusChange, onDragStart }: {
  task: Task; onEdit: () => void; onDelete: () => void; canDelete: boolean;
  onStatusChange: (status: TaskStatus) => void; onDragStart: (event: DragEvent<HTMLDivElement>) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const priorityTone = task.priority === 'HIGH' ? 'rose' : task.priority === 'LOW' ? 'slate' : 'amber';
  const dueOverdue = isOverdue(task.dueDate) && task.status !== 'DONE';
  return <Card draggable onDragStart={onDragStart} className="cursor-grab p-4 active:cursor-grabbing">
    <div className="flex items-start justify-between gap-2"><Badge tone={priorityTone}>{task.priority.toLowerCase()} priority</Badge><div className="relative"><button aria-label={`Actions for ${task.title}`} onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><MoreHorizontal className="size-4" /></button>{menuOpen && <div className="absolute right-0 top-8 z-20 min-w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"><button onClick={() => { setMenuOpen(false); onEdit(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800"><Pencil className="size-3.5" /> Edit task</button>{canDelete && <button onClick={() => { setMenuOpen(false); onDelete(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><Trash2 className="size-3.5" /> Delete task</button>}</div>}</div></div>
    <h4 className="mt-3 text-sm font-semibold leading-5 text-slate-900 dark:text-white">{task.title}</h4>
    {task.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{task.description}</p>}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800"><span className={`inline-flex items-center gap-1 text-[11px] ${dueOverdue ? 'font-semibold text-rose-600' : 'text-slate-500 dark:text-slate-400'}`}><CalendarDays className="size-3.5" />{dueOverdue ? 'Overdue · ' : ''}{formatDate(task.dueDate)}</span>{task.assignee ? <span className="inline-flex items-center gap-1.5" title={`${task.assignee.firstName} ${task.assignee.lastName}`}><Avatar firstName={task.assignee.firstName} lastName={task.assignee.lastName} src={task.assignee.avatarUrl} size="sm" /><span className="max-w-20 truncate text-[11px] text-slate-500">{task.assignee.firstName}</span></span> : <span className="text-[11px] text-slate-400">Unassigned</span>}</div>
    <div className="mt-3"><label className="sr-only" htmlFor={`status-${task.id}`}>Change status for {task.title}</label><select id={`status-${task.id}`} value={task.status} onChange={(event) => onStatusChange(event.target.value as TaskStatus)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option></select></div>
  </Card>;
}

export function TaskBoard({ group }: { group: Group }) {
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<Task | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch } = useTasks(group.id, { assigneeId: assigneeFilter || undefined });
  const updateTask = useUpdateTask(group.id);
  const deleteTask = useDeleteTask(group.id);
  const tasks = data?.tasks ?? [];
  const groupedTasks = useMemo(() => Object.fromEntries(columns.map((column) => [column.status, tasks.filter((task) => task.status === column.status)])) as Record<TaskStatus, Task[]>, [tasks]);
  const setTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTask.mutateAsync({ taskId, input: { status } });
      toast(`Task moved to ${columns.find((column) => column.status === status)?.label ?? status}.`);
    }
    catch (err) { toast(err instanceof ApiError ? err.message : 'Could not update task status.', 'error'); }
  };
  const startDrag = (taskId: string) => (event: DragEvent<HTMLDivElement>) => { event.dataTransfer.setData('text/plain', taskId); event.dataTransfer.effectAllowed = 'move'; };
  const confirmDelete = async () => {
    if (!deleteTaskTarget) return;
    try { await deleteTask.mutateAsync(deleteTaskTarget.id); toast('Task deleted.'); setDeleteTaskTarget(null); }
    catch (err) { toast(err instanceof ApiError ? err.message : 'Could not delete task.', 'error'); }
  };
  return <div className="space-y-5">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">Tasks</h2><p className="mt-0.5 text-xs text-slate-500">Plan work, assign owners, and move tasks across the board.</p></div><div className="flex flex-wrap gap-2"><select aria-label="Filter tasks by assignee" value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><option value="">All assignees</option>{group.members.map((member) => <option key={member.userId} value={member.userId}>{member.user.firstName} {member.user.lastName}</option>)}</select><Button onClick={() => { setEditingTask(null); setDialogOpen(true); }}><Plus className="size-4" /> Add task</Button></div></div>
    {isLoading ? <div className="grid gap-4 lg:grid-cols-3"><LoadingState rows={3} /><LoadingState rows={3} /><LoadingState rows={3} /></div> : isError ? <ErrorState message={error instanceof Error ? error.message : 'Could not load tasks.'} onRetry={() => void refetch()} /> : tasks.length === 0 ? <EmptyState title="No tasks yet" description={assigneeFilter ? 'No tasks match this assignee. Try another filter.' : 'Add the first task to start organizing your group work.'} action={!assigneeFilter ? <Button onClick={() => setDialogOpen(true)}><Plus className="size-4" /> Add a task</Button> : <Button variant="secondary" onClick={() => setAssigneeFilter('')}>Clear filter</Button>} /> : <div className="grid items-start gap-4 lg:grid-cols-3">{columns.map((column) => <section key={column.status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const taskId = event.dataTransfer.getData('text/plain'); if (taskId) void setTaskStatus(taskId, column.status); }} className="min-h-64 rounded-2xl bg-slate-100/80 p-3 dark:bg-slate-900/70"><div className="mb-3 flex items-center justify-between px-1"><div className="flex items-center gap-2"><span className={`size-2 rounded-full ${column.color}`} /><h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{column.label}</h3><span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800">{groupedTasks[column.status].length}</span></div></div><div className="space-y-3">{groupedTasks[column.status].map((task) => <TaskCard key={task.id} task={task} onDragStart={startDrag(task.id)} onEdit={() => { setEditingTask(task); setDialogOpen(true); }} onDelete={() => setDeleteTaskTarget(task)} canDelete={task.createdById === user?.id || group.myRole === 'OWNER' || group.myRole === 'ADMIN'} onStatusChange={(status) => void setTaskStatus(task.id, status)} />)}</div>{groupedTasks[column.status].length === 0 && <p className="rounded-xl border border-dashed border-slate-300 px-3 py-7 text-center text-xs text-slate-400 dark:border-slate-700">Drop tasks here</p>}</section>)}</div>}
    <TaskDialog open={dialogOpen} onClose={() => setDialogOpen(false)} group={group} task={editingTask} />
    <ConfirmDialog open={Boolean(deleteTaskTarget)} onClose={() => setDeleteTaskTarget(null)} onConfirm={() => void confirmDelete()} title="Delete this task?" description={`“${deleteTaskTarget?.title ?? ''}” will be permanently deleted.`} confirmLabel="Delete task" busy={deleteTask.isPending} />
  </div>;
}
