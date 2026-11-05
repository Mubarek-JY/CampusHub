import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTask, deleteGroup, deleteTask, getGroup, getTasks, leaveGroup, removeMember, updateMemberRole, updateTask } from '../../lib/api/endpoints';
import type { Task, UpdateTaskInput } from '../../lib/api/types';
import { groupKeys } from '../dashboard/hooks';

export const taskKeys = { all: (groupId: string) => ['groups', groupId, 'tasks'] as const };
export const useGroup = (groupId: string) => useQuery({ queryKey: groupKeys.detail(groupId), queryFn: () => getGroup(groupId), enabled: Boolean(groupId) });
export const useTasks = (groupId: string, params?: { assigneeId?: string }) => useQuery({
  queryKey: [...taskKeys.all(groupId), params ?? {}], queryFn: () => getTasks(groupId, params), enabled: Boolean(groupId),
});
export const useCreateTask = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createTask>[1]) => createTask(groupId, input),
    onSuccess: async () => Promise.all([
      qc.invalidateQueries({ queryKey: taskKeys.all(groupId) }),
      qc.invalidateQueries({ queryKey: groupKeys.detail(groupId) }),
      qc.invalidateQueries({ queryKey: groupKeys.list() }),
    ]),
  });
};
export const useUpdateTask = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) => updateTask(groupId, taskId, input),
    onMutate: async ({ taskId, input }) => {
      if (!input.status) return { snapshots: [] as { key: readonly unknown[]; data: { tasks: Task[] } | undefined }[] };
      await qc.cancelQueries({ queryKey: taskKeys.all(groupId) });
      const snapshots = qc.getQueriesData<{ tasks: Task[] }>({ queryKey: taskKeys.all(groupId) }).map(([key, data]) => ({ key, data }));
      snapshots.forEach(({ key, data }) => {
        if (data) qc.setQueryData(key, { tasks: data.tasks.map((task) => task.id === taskId ? { ...task, ...input } : task) });
      });
      return { snapshots };
    },
    onError: (_error, _variables, context) => context?.snapshots.forEach(({ key, data }) => qc.setQueryData(key, data)),
    onSettled: () => qc.invalidateQueries({ queryKey: taskKeys.all(groupId) }),
  });
};
export const useDeleteTask = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => deleteTask(groupId, taskId),
    onSuccess: async () => Promise.all([
      qc.invalidateQueries({ queryKey: taskKeys.all(groupId) }),
      qc.invalidateQueries({ queryKey: groupKeys.detail(groupId) }),
      qc.invalidateQueries({ queryKey: groupKeys.list() }),
    ]),
  });
};
export const useUpdateMemberRole = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ userId, role }: { userId: string; role: 'ADMIN' | 'MEMBER' }) => updateMemberRole(groupId, userId, role), onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.detail(groupId) }) });
};
export const useRemoveMember = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (userId: string) => removeMember(groupId, userId), onSuccess: async () => Promise.all([qc.invalidateQueries({ queryKey: groupKeys.detail(groupId) }), qc.invalidateQueries({ queryKey: groupKeys.list() })]) });
};
export const useLeaveGroup = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => leaveGroup(groupId), onSuccess: () => { qc.removeQueries({ queryKey: groupKeys.detail(groupId) }); qc.invalidateQueries({ queryKey: groupKeys.list() }); } });
};
export const useDeleteGroup = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => deleteGroup(groupId), onSuccess: () => { qc.removeQueries({ queryKey: groupKeys.detail(groupId) }); qc.invalidateQueries({ queryKey: groupKeys.list() }); } });
};
