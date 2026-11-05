import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGroup, getGroups, joinGroup } from '../../lib/api/endpoints';

export const groupKeys = { all: ['groups'] as const, list: () => [...groupKeys.all, 'list'] as const, detail: (id: string) => [...groupKeys.all, 'detail', id] as const };
export const useGroups = () => useQuery({ queryKey: groupKeys.list(), queryFn: getGroups });
export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: createGroup, onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.all }) });
};
export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: joinGroup, onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.all }) });
};
