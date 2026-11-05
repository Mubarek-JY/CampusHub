import { apiRequest } from './client';
import type {
  AuthResponse, CreateGroupInput, CreateTaskInput, Group, GroupMember, GroupSummary,
  LoginInput, ProfileInput, RefreshResponse, RegisterInput, Task, TaskStatus, UpdateTaskInput, User,
  CreateResourceInput, Resource, UpdateResourceInput, ResourceType,
  CalendarEvent, CreateEventInput, CreateMessageInput, Message,
} from './types';

export const register = (input: RegisterInput) => apiRequest<AuthResponse>('/api/auth/register', { method: 'POST', body: input, auth: false });
export const login = (input: LoginInput) => apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: input, auth: false });
export const refresh = (refreshToken: string) => apiRequest<RefreshResponse>('/api/auth/refresh', { method: 'POST', body: { refreshToken }, auth: false, retryAuth: false });
export const logout = (refreshToken: string) => apiRequest<void>('/api/auth/logout', { method: 'POST', body: { refreshToken }, auth: false, retryAuth: false });
export const getMe = () => apiRequest<{ user: User }>('/api/auth/me');
export const updateMe = (input: ProfileInput) => apiRequest<{ user: User }>('/api/auth/me', { method: 'PATCH', body: input });

export const createGroup = (input: CreateGroupInput) => apiRequest<{ group: Group }>('/api/groups', { method: 'POST', body: input });
export const getGroups = () => apiRequest<{ groups: GroupSummary[] }>('/api/groups');
export const joinGroup = (joinCode: string) => apiRequest<{ group: Pick<Group, 'id' | 'name'> }>('/api/groups/join', { method: 'POST', body: { joinCode } });
export const getGroup = (groupId: string) => apiRequest<{ group: Group }>(`/api/groups/${groupId}`);
export const deleteGroup = (groupId: string) => apiRequest<void>(`/api/groups/${groupId}`, { method: 'DELETE' });
export const leaveGroup = (groupId: string) => apiRequest<void>(`/api/groups/${groupId}/leave`, { method: 'POST' });
export const updateMemberRole = (groupId: string, userId: string, role: 'ADMIN' | 'MEMBER') =>
  apiRequest<{ member: GroupMember }>(`/api/groups/${groupId}/members/${userId}`, { method: 'PATCH', body: { role } });
export const removeMember = (groupId: string, userId: string) =>
  apiRequest<void>(`/api/groups/${groupId}/members/${userId}`, { method: 'DELETE' });

export const getTasks = (groupId: string, params?: { status?: TaskStatus; assigneeId?: string }) => {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.assigneeId) query.set('assigneeId', params.assigneeId);
  const suffix = query.size ? `?${query.toString()}` : '';
  return apiRequest<{ tasks: Task[] }>(`/api/groups/${groupId}/tasks${suffix}`);
};
export const createTask = (groupId: string, input: CreateTaskInput) =>
  apiRequest<{ task: Task }>(`/api/groups/${groupId}/tasks`, { method: 'POST', body: input });
export const updateTask = (groupId: string, taskId: string, input: UpdateTaskInput) =>
  apiRequest<{ task: Task }>(`/api/groups/${groupId}/tasks/${taskId}`, { method: 'PATCH', body: input });
export const deleteTask = (groupId: string, taskId: string) =>
  apiRequest<void>(`/api/groups/${groupId}/tasks/${taskId}`, { method: 'DELETE' });

export const getResources = (params?: { type?: ResourceType; courseName?: string; groupId?: string; search?: string }) => {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.courseName) query.set('courseName', params.courseName);
  if (params?.groupId) query.set('groupId', params.groupId);
  if (params?.search) query.set('search', params.search);
  const suffix = query.size ? `?${query.toString()}` : '';
  return apiRequest<{ resources: Resource[] }>(`/api/resources${suffix}`);
};
export const createResource = (input: CreateResourceInput) =>
  apiRequest<{ resource: Resource }>('/api/resources', { method: 'POST', body: input });
export const uploadResource = (file: File, input: Omit<CreateResourceInput, 'type' | 'url'>) => {
  const body = new FormData();
  body.append('file', file);
  body.append('title', input.title);
  if (input.description) body.append('description', input.description);
  if (input.courseName) body.append('courseName', input.courseName);
  if (input.groupId) body.append('groupId', input.groupId);
  body.append('tags', JSON.stringify(input.tags ?? []));
  body.append('isPublic', String(input.isPublic ?? true));
  return apiRequest<{ resource: Resource; filePath: string }>('/api/resources/upload', { method: 'POST', body });
};
export const updateResource = (resourceId: string, input: UpdateResourceInput) =>
  apiRequest<{ resource: Resource }>(`/api/resources/${resourceId}`, { method: 'PATCH', body: input });
export const deleteResource = (resourceId: string) =>
  apiRequest<void>(`/api/resources/${resourceId}`, { method: 'DELETE' });
export const rateResource = (resourceId: string, value: number) =>
  apiRequest<{ resource: Resource }>(`/api/resources/${resourceId}/rating`, { method: 'POST', body: { value } });

export const getMessages = (params?: { groupId?: string; recipientId?: string }) => {
  const query = new URLSearchParams();
  if (params?.groupId) query.set('groupId', params.groupId);
  if (params?.recipientId) query.set('recipientId', params.recipientId);
  return apiRequest<{ messages: Message[] }>(`/api/messages${query.size ? `?${query.toString()}` : ''}`);
};
export const createMessage = (input: CreateMessageInput) =>
  apiRequest<{ message: Message }>('/api/messages', { method: 'POST', body: input });
export const getCalendarEvents = () => apiRequest<{ events: CalendarEvent[] }>('/api/calendar');
export const createCalendarEvent = (input: CreateEventInput) =>
  apiRequest<{ event: CalendarEvent }>('/api/calendar', { method: 'POST', body: input });
export const deleteCalendarEvent = (eventId: string) =>
  apiRequest<void>(`/api/calendar/${eventId}`, { method: 'DELETE' });
