import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getTasks,
  getTasksForDecision,
  createTask,
  createTaskFromDecision,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from './association-tasks';
import { supabase } from './supabase';
import type { MeetingDecision } from '@/types/association';

// Mock the supabase client
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

const ASSIGNEE_JOIN =
  'assignee:profiles!association_tasks_assignee_id_fkey(id, username, display_name, avatar_url)';

describe('Association Tasks Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTasks', () => {
    it('should fetch tasks with assignee join, ordered by due_date ASC (nulls last) then created_at DESC', async () => {
      const mockTasks = [
        { id: 'task-1', association_id: 'assoc-1', title: 'Boka lokal', due_date: '2026-10-20' },
        { id: 'task-2', association_id: 'assoc-1', title: 'Skriva protokoll', due_date: null },
      ];

      const mockChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn(),
      };
      mockChain.order
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({ data: mockTasks, error: null });

      vi.mocked(supabase.from).mockReturnValue(mockChain);

      const result = await getTasks('assoc-1');

      expect(supabase.from).toHaveBeenCalledWith('association_tasks');
      expect(mockChain.select).toHaveBeenCalledWith(
        expect.stringContaining(ASSIGNEE_JOIN)
      );
      expect(mockChain.eq).toHaveBeenCalledWith('association_id', 'assoc-1');
      expect(mockChain.order).toHaveBeenNthCalledWith(1, 'due_date', {
        ascending: true,
        nullsFirst: false,
      });
      expect(mockChain.order).toHaveBeenNthCalledWith(2, 'created_at', { ascending: false });
      expect(result).toEqual(mockTasks);
    });

    it('should apply status, assignee and workgroup filters when provided', async () => {
      const mockChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn(),
      };
      mockChain.order
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({ data: [], error: null });

      vi.mocked(supabase.from).mockReturnValue(mockChain);

      await getTasks('assoc-1', {
        status: 'in_progress',
        assigneeId: 'user-2',
        workgroupId: 'wg-1',
      });

      expect(mockChain.eq).toHaveBeenCalledWith('association_id', 'assoc-1');
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'in_progress');
      expect(mockChain.eq).toHaveBeenCalledWith('assignee_id', 'user-2');
      expect(mockChain.eq).toHaveBeenCalledWith('workgroup_id', 'wg-1');
    });

    it('should throw error when fetch fails', async () => {
      const mockError = { message: 'Database error' };

      const mockChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn(),
      };
      mockChain.order
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({ data: null, error: mockError });

      vi.mocked(supabase.from).mockReturnValue(mockChain);

      await expect(getTasks('assoc-1')).rejects.toEqual(mockError);
    });
  });

  describe('getTasksForDecision', () => {
    it('should fetch tasks for a decision with assignee join', async () => {
      const mockTasks = [
        { id: 'task-1', decision_id: 'decision-1', title: 'Köpa kaffemaskin' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getTasksForDecision('decision-1');

      expect(supabase.from).toHaveBeenCalledWith('association_tasks');
      expect(mockChain.select).toHaveBeenCalledWith(
        expect.stringContaining(ASSIGNEE_JOIN)
      );
      expect(mockChain.eq).toHaveBeenCalledWith('decision_id', 'decision-1');
      expect(result).toEqual(mockTasks);
    });
  });

  describe('createTask', () => {
    it('should insert a task with the given payload and return it', async () => {
      const mockTask = {
        id: 'task-1',
        association_id: 'assoc-1',
        title: 'Boka lokal',
        description: 'Ring kommunen',
        assignee_id: 'user-2',
        due_date: '2026-10-20',
        status: 'todo',
        created_by: 'user-1',
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await createTask({
        association_id: 'assoc-1',
        title: 'Boka lokal',
        description: 'Ring kommunen',
        assignee_id: 'user-2',
        due_date: '2026-10-20',
        created_by: 'user-1',
      });

      expect(supabase.from).toHaveBeenCalledWith('association_tasks');
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          association_id: 'assoc-1',
          title: 'Boka lokal',
          description: 'Ring kommunen',
          assignee_id: 'user-2',
          due_date: '2026-10-20',
          created_by: 'user-1',
        })
      );
      expect(result).toEqual(mockTask);
    });

    it('should throw error when insert fails', async () => {
      const mockError = { message: 'Insert failed' };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(
        createTask({
          association_id: 'assoc-1',
          title: 'Boka lokal',
          created_by: 'user-1',
        })
      ).rejects.toEqual(mockError);
    });
  });

  describe('createTaskFromDecision', () => {
    const decision: MeetingDecision = {
      id: 'decision-1',
      meeting_id: 'meeting-1',
      description: 'Styrelsen beslutade att köpa en ny kaffemaskin till lokalen',
      created_by: 'user-1',
      created_at: '2026-10-14T00:00:00Z',
    };

    it('should create a task linked to the decision with title defaulting to decision description', async () => {
      const mockTask = { id: 'task-1', decision_id: 'decision-1' };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await createTaskFromDecision(decision, 'assoc-1', 'user-2');

      expect(supabase.from).toHaveBeenCalledWith('association_tasks');
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          association_id: 'assoc-1',
          decision_id: 'decision-1',
          title: 'Styrelsen beslutade att köpa en ny kaffemaskin till lokalen',
          created_by: 'user-2',
        })
      );
      expect(result).toEqual(mockTask);
    });

    it('should truncate the default title to 200 characters', async () => {
      const longDescription = 'a'.repeat(250);
      const longDecision: MeetingDecision = { ...decision, description: longDescription };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'task-1' }, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await createTaskFromDecision(longDecision, 'assoc-1', 'user-2');

      const payload = mockChain.insert.mock.calls[0][0] as { title: string };
      expect(payload.title).toHaveLength(200);
      expect(payload.title).toBe(longDescription.slice(0, 200));
    });

    it('should use override values for title, assignee and due date when provided', async () => {
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'task-1' }, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await createTaskFromDecision(decision, 'assoc-1', 'user-2', {
        title: 'Köp kaffemaskin',
        assignee_id: 'user-3',
        due_date: '2026-11-01',
      });

      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          decision_id: 'decision-1',
          title: 'Köp kaffemaskin',
          assignee_id: 'user-3',
          due_date: '2026-11-01',
        })
      );
    });
  });

  describe('updateTask', () => {
    it('should update the task with given fields and updated_at timestamp', async () => {
      const mockUpdated = { id: 'task-1', title: 'Ny titel' };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdated, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await updateTask('task-1', { title: 'Ny titel', assignee_id: 'user-3' });

      expect(supabase.from).toHaveBeenCalledWith('association_tasks');
      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Ny titel',
          assignee_id: 'user-3',
          updated_at: expect.any(String),
        })
      );
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'task-1');
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('updateTaskStatus', () => {
    it('should set completed_at to an ISO string when status is done', async () => {
      const mockUpdated = { id: 'task-1', status: 'done' };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdated, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await updateTaskStatus('task-1', 'done');

      expect(supabase.from).toHaveBeenCalledWith('association_tasks');
      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'done',
          completed_at: expect.any(String),
        })
      );

      const payload = mockChain.update.mock.calls[0][0] as { completed_at: string };
      // Verify it is a valid ISO timestamp
      expect(new Date(payload.completed_at).toISOString()).toBe(payload.completed_at);

      expect(mockChain.eq).toHaveBeenCalledWith('id', 'task-1');
      expect(result).toEqual(mockUpdated);
    });

    it('should set completed_at to null when status is not done', async () => {
      const mockUpdated = { id: 'task-1', status: 'in_progress' };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdated, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await updateTaskStatus('task-1', 'in_progress');

      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_progress',
          completed_at: null,
        })
      );
    });

    it('should throw error when update fails', async () => {
      const mockError = { message: 'Update failed' };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(updateTaskStatus('task-1', 'done')).rejects.toEqual(mockError);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task by ID', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await deleteTask('task-1');

      expect(supabase.from).toHaveBeenCalledWith('association_tasks');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'task-1');
    });

    it('should throw error when delete fails', async () => {
      const mockError = { message: 'Delete failed' };

      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(deleteTask('task-1')).rejects.toEqual(mockError);
    });
  });
});
