import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createResource, deleteResource, getResources, rateResource, uploadResource } from '../../lib/api/endpoints';
import type { ResourceType } from '../../lib/api/types';

export const resourceKeys = {
  all: ['resources'] as const,
  list: (filters: Record<string, string>) => [...resourceKeys.all, filters] as const,
};

export function useResources(filters: { groupId: string; type?: string; search?: string }) {
  return useQuery({
    queryKey: resourceKeys.list(filters),
    queryFn: () => getResources({ groupId: filters.groupId, type: filters.type as ResourceType | undefined, search: filters.search }),
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createResource,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resourceKeys.all }),
  });
}
export function useUploadResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, input }: { file: File; input: Parameters<typeof uploadResource>[1] }) => uploadResource(file, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resourceKeys.all }),
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteResource,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resourceKeys.all }),
  });
}

export function useRateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceId, value }: { resourceId: string; value: number }) => rateResource(resourceId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resourceKeys.all }),
  });
}
