import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskBoard } from '../TaskBoard';
import type { Group } from '../../../lib/api/types';

const mocks = vi.hoisted(() => ({ mutateAsync: vi.fn(), toast: vi.fn() }));
vi.mock('../hooks', () => ({
  useTasks: () => ({ data: { tasks: [{
    id: 'task-1', groupId: 'group-1', title: 'Prepare lecture notes', description: null,
    status: 'TODO', priority: 'MEDIUM', dueDate: null, assigneeId: null, createdById: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', assignee: null,
  }] }, isLoading: false, isError: false, refetch: vi.fn() }),
  useUpdateTask: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }),
  useDeleteTask: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateTask: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('../../auth/AuthContext', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
vi.mock('../../../hooks/useToast', () => ({ useToast: () => ({ toast: mocks.toast }) }));

const group: Group = {
  id: 'group-1', name: 'Algorithms', ownerId: 'user-1', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  myRole: 'OWNER', members: [{ id: 'membership-1', groupId: 'group-1', userId: 'user-1', role: 'OWNER', joinedAt: '2026-01-01T00:00:00.000Z', user: { id: 'user-1', firstName: 'Ada', lastName: 'Lovelace', avatarUrl: null } }],
  _count: { tasks: 1, resources: 0 },
};

describe('TaskBoard', () => {
  beforeEach(() => { mocks.mutateAsync.mockReset().mockResolvedValue(undefined); mocks.toast.mockReset(); });
  it('changes a task status from the mobile-friendly status menu', async () => {
    render(<TaskBoard group={group} />);
    fireEvent.change(screen.getByLabelText('Change status for Prepare lecture notes'), { target: { value: 'IN_PROGRESS' } });
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledWith({ taskId: 'task-1', input: { status: 'IN_PROGRESS' } }));
  });
});
