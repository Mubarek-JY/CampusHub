import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createMessage, getMessages } from '../../lib/api/endpoints';
export const messageKeys = { all: ['messages'] as const, list: (groupId?: string) => [...messageKeys.all, groupId ?? 'inbox'] as const };
export function useMessages(groupId?: string) { return useQuery({ queryKey: messageKeys.list(groupId), queryFn: () => getMessages(groupId ? { groupId } : undefined), refetchInterval: 10000 }); }
export function useCreateMessage(groupId?: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (content: string) => createMessage({ content, ...(groupId ? { groupId } : {}) }), onSuccess: () => client.invalidateQueries({ queryKey: messageKeys.all }) });
}
