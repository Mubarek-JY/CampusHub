import { useState } from 'react';
import { AlertTriangle, Copy, DoorOpen, KeyRound, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../hooks/useToast';
import { ApiError } from '../../lib/api/client';
import type { Group } from '../../lib/api/types';
import { useDeleteGroup, useLeaveGroup } from './hooks';

export function SettingsPanel({ group }: { group: Group }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [confirmAction, setConfirmAction] = useState<'leave' | 'delete' | null>(null);
  const leave = useLeaveGroup(group.id);
  const remove = useDeleteGroup(group.id);
  const isOwner = group.myRole === 'OWNER';
  const canSeeCode = isOwner || group.myRole === 'ADMIN';
  const copyCode = async () => {
    if (!group.joinCode) return;
    try { await navigator.clipboard.writeText(group.joinCode); toast('Invite code copied.'); }
    catch { toast('Could not copy the invite code. Copy it manually.', 'error'); }
  };
  const confirm = async () => {
    try {
      if (confirmAction === 'leave') { await leave.mutateAsync(); toast('You left the group.'); navigate('/app', { replace: true }); }
      if (confirmAction === 'delete') { await remove.mutateAsync(); toast('Group deleted.'); navigate('/app', { replace: true }); }
    } catch (error) { toast(error instanceof ApiError ? error.message : 'The action could not be completed.', 'error'); }
    finally { setConfirmAction(null); }
  };
  return <div className="max-w-3xl space-y-6"><div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">Group settings</h2><p className="mt-0.5 text-xs text-slate-500">Manage access and membership for {group.name}.</p></div>
    {canSeeCode && <Card className="p-5"><div className="flex items-start gap-3"><span className="rounded-xl bg-brand-50 p-2.5 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"><KeyRound className="size-5" /></span><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">Invite code</h3><p className="mt-1 text-xs text-slate-500">Share this code with classmates so they can join your group.</p><div className="mt-4 flex flex-wrap items-center gap-2"><code className="rounded-lg bg-slate-100 px-4 py-2.5 font-mono text-sm font-semibold tracking-[.12em] text-slate-800 dark:bg-slate-800 dark:text-slate-100">{group.joinCode ?? 'Not available'}</code><Button size="sm" variant="secondary" onClick={() => void copyCode()} disabled={!group.joinCode}><Copy className="size-3.5" /> Copy code</Button></div></div></div></Card>}
    {!canSeeCode && <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">Invite codes are visible only to group admins and the owner.</p>}
    <Card className="divide-y divide-slate-100 p-5 dark:divide-slate-800"><div className="pb-5"><div className="flex items-center gap-2"><DoorOpen className="size-4 text-slate-500" /><h3 className="text-sm font-semibold">Leave group</h3></div><p className="mt-1 text-xs leading-5 text-slate-500">Remove yourself from this group. You will need a new invite to rejoin.</p>{isOwner ? <p className="mt-3 text-xs text-amber-600">The owner cannot leave the group. Transfer ownership is not available in this API.</p> : <Button variant="secondary" size="sm" className="mt-3" onClick={() => setConfirmAction('leave')}>Leave group</Button>}</div>
      {isOwner && <div className="pt-5"><div className="flex items-center gap-2"><AlertTriangle className="size-4 text-rose-600" /><h3 className="text-sm font-semibold text-rose-700 dark:text-rose-400">Danger zone</h3><Badge tone="rose">Owner only</Badge></div><p className="mt-1 text-xs leading-5 text-slate-500">Permanently delete this group and its associated group data.</p><Button variant="danger" size="sm" className="mt-3" onClick={() => setConfirmAction('delete')}><Trash2 className="size-3.5" /> Delete group</Button></div>}
    </Card>
    <ConfirmDialog open={confirmAction === 'leave'} onClose={() => setConfirmAction(null)} onConfirm={() => void confirm()} title="Leave this group?" description={`You will lose access to “${group.name}”. This action cannot be undone.`} confirmLabel="Leave group" busy={leave.isPending} />
    <ConfirmDialog open={confirmAction === 'delete'} onClose={() => setConfirmAction(null)} onConfirm={() => void confirm()} title="Delete this group?" description={`“${group.name}” will be permanently deleted. All members will lose access.`} confirmLabel="Delete permanently" busy={remove.isPending} />
  </div>;
}
