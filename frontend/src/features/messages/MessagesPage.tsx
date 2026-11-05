import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useToast } from '../../hooks/useToast';
import { ApiError } from '../../lib/api/client';
import { useGroups } from '../dashboard/hooks';
import { useCreateMessage, useMessages } from './hooks';

export function MessagesPage() {
  const { data: groups } = useGroups();
  const [groupId, setGroupId] = useState('');
  const [content, setContent] = useState('');
  const messages = useMessages(groupId || undefined);
  const send = useCreateMessage(groupId || undefined);
  const { toast } = useToast();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    try { await send.mutateAsync(content.trim()); setContent(''); }
    catch (error) { toast(error instanceof ApiError ? error.message : 'Could not send message.', 'error'); }
  };
  return <div className="space-y-7"><div><p className="text-sm font-medium text-brand-600">Conversations</p><h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Messages</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Keep group conversations in one place.</p></div><div className="max-w-3xl"><label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="message-group">Conversation</label><select id="message-group" value={groupId} onChange={(event) => setGroupId(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="">All messages</option>{groups?.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></div>{messages.isLoading ? <LoadingState rows={4} /> : messages.isError ? <ErrorState message={messages.error instanceof Error ? messages.error.message : 'Could not load messages.'} onRetry={() => void messages.refetch()} /> : messages.data?.messages.length ? <Card className="max-w-3xl divide-y divide-slate-100 dark:divide-slate-800">{messages.data.messages.map((message) => <div key={message.id} className="flex gap-3 p-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"><MessageSquare className="size-4" /></span><div><p className="text-xs font-semibold text-slate-500">{message.sender.firstName} {message.sender.lastName} · {new Date(message.createdAt).toLocaleString()}</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">{message.content}</p></div></div>)}<form onSubmit={submit} className="flex gap-2 p-4"><input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write a message..." className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" /><Button type="submit" disabled={send.isPending || !content.trim()}><Send className="size-4" /> Send</Button></form></Card> : <div className="max-w-3xl"><EmptyState title="No messages yet" description="Start the conversation with your group." action={<form onSubmit={submit} className="flex gap-2"><input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write a message..." className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" /><Button type="submit" disabled={!content.trim()}>Send</Button></form>} /></div>}</div>;
}
