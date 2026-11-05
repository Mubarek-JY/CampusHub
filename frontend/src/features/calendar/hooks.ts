import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCalendarEvent, deleteCalendarEvent, getCalendarEvents } from '../../lib/api/endpoints';
export const calendarKeys = { all: ['calendar'] as const };
export function useCalendarEvents() { return useQuery({ queryKey: calendarKeys.all, queryFn: getCalendarEvents }); }
export function useCreateCalendarEvent() {
  const client = useQueryClient();
  return useMutation({ mutationFn: createCalendarEvent, onSuccess: () => client.invalidateQueries({ queryKey: calendarKeys.all }) });
}
export function useDeleteCalendarEvent() {
  const client = useQueryClient();
  return useMutation({ mutationFn: deleteCalendarEvent, onSuccess: () => client.invalidateQueries({ queryKey: calendarKeys.all }) });
}
