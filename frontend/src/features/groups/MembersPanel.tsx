import { useState } from 'react';
import { MoreHorizontal, Shield, UserMinus, Users } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/ui/States';
import { useToast } from '../../hooks/useToast';
import { ApiError } from '../../lib/api/client';
import type { Group, GroupMember } from '../../lib/api/types';
import { useAuth } from '../auth/AuthContext';
import { useRemoveMember, useUpdateMemberRole } from './hooks';

export function MembersPanel({ group }: { group: Group }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [removeTarget, setRemoveTarget] = useState<GroupMember | null>(null);
  const [menuUserId, setMenuUserId] = useState<string | null>(null);
  const updateRole = useUpdateMemberRole(group.id);
  const removeMember = useRemoveMember(group.id);
  const isOwner = group.myRole === 'OWNER';
  const canManageMembers = isOwner || group.myRole === 'ADMIN';
  const changeRole = async (member: GroupMember, role: 'ADMIN' | 'MEMBER') => {
    try { await updateRole.mutateAsync({ userId: member.userId, role }); toast(`${member.user.firstName}'s role updated.`); setMenuUserId(null); }
    catch (error) { toast(error instanceof ApiError ? error.message : 'Could not update member role.', 'error'); }
  };
  const confirmRemove = async () => {
    if (!removeTarget) return;
    try { await removeMember.mutateAsync(removeTarget.userId); toast(`${removeTarget.user.firstName} was removed.`); setRemoveTarget(null); }
    catch (error) { toast(error instanceof ApiError ? error.message : 'Could not remove member.', 'error'); }
  };
  return <div className="space-y-5"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">Members</h2><p className="mt-0.5 text-xs text-slate-500">People collaborating in this group.</p></div><Badge tone="blue">{group.members.length} members</Badge></div>
    {group.members.length === 0 ? <EmptyState title="No members" description="This group does not have any members yet." /> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="hidden grid-cols-[1fr_130px_48px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950 sm:grid"><span>Member</span><span>Role</span><span /></div>{group.members.map((member) => {
      const isMe = member.userId === user?.id;
      const canRemove = canManageMembers && !isMe && member.role !== 'OWNER' && (isOwner || member.role !== 'ADMIN');
      const canChange = isOwner && member.role !== 'OWNER';
      return <div key={member.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 dark:border-slate-800 sm:grid-cols-[1fr_130px_48px] sm:px-5"><div className="flex min-w-0 items-center gap-3"><Avatar firstName={member.user.firstName} lastName={member.user.lastName} src={member.user.avatarUrl} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{member.user.firstName} {member.user.lastName}{isMe && <span className="ml-2 text-[10px] font-normal text-slate-400">You</span>}</p><p className="text-[11px] text-slate-400">Joined {new Date(member.joinedAt).toLocaleDateString()}</p></div></div><div className="justify-self-end sm:justify-self-start"><Badge tone={member.role === 'OWNER' ? 'blue' : member.role === 'ADMIN' ? 'amber' : 'slate'}>{member.role}</Badge></div><div className="relative justify-self-end">{(canChange || canRemove) && <><button aria-label={`Manage ${member.user.firstName}`} onClick={() => setMenuUserId(menuUserId === member.userId ? null : member.userId)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><MoreHorizontal className="size-4" /></button>{menuUserId === member.userId && <div className="absolute right-0 top-10 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">{canChange && <><button onClick={() => void changeRole(member, member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800"><Shield className="size-3.5" />{member.role === 'ADMIN' ? 'Make member' : 'Promote to admin'}</button><div className="my-1 border-t border-slate-100 dark:border-slate-800" /></>}{canRemove && <button onClick={() => { setMenuUserId(null); setRemoveTarget(member); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><UserMinus className="size-3.5" /> Remove from group</button>}</div>}</>}</div>
      </div>;
    })}</div>}
    {!canManageMembers && <p className="flex items-center gap-2 text-xs text-slate-400"><Users className="size-3.5" />Only group admins and the owner can manage members.</p>}
    <ConfirmDialog open={Boolean(removeTarget)} onClose={() => setRemoveTarget(null)} onConfirm={() => void confirmRemove()} title="Remove this member?" description={`${removeTarget?.user.firstName ?? 'This member'} will lose access to this group.`} confirmLabel="Remove member" busy={removeMember.isPending} />
  </div>;
}
