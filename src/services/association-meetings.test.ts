import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  addDecision,
  deleteDecision,
} from './association-meetings';
import { supabase } from './supabase';

// Mock the supabase client
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('Association Meetings Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMeetings', () => {
    it('should fetch meetings for an association ordered by meeting_date descending', async () => {
      const mockMeetings = [
        { id: 'meeting-2', association_id: 'assoc-1', title: 'Höstmöte', meeting_date: '2026-11-01T18:00:00Z' },
        { id: 'meeting-1', association_id: 'assoc-1', title: 'Styrelsemöte', meeting_date: '2026-10-01T18:00:00Z' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockMeetings, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getMeetings('assoc-1');

      expect(supabase.from).toHaveBeenCalledWith('association_meetings');
      expect(mockChain.eq).toHaveBeenCalledWith('association_id', 'assoc-1');
      expect(mockChain.order).toHaveBeenCalledWith('meeting_date', { ascending: false });
      expect(result).toEqual(mockMeetings);
    });

    it('should throw error when fetch fails', async () => {
      const mockError = { message: 'Database error' };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(getMeetings('assoc-1')).rejects.toEqual(mockError);
    });
  });

  describe('getMeetingById', () => {
    it('should fetch a meeting with its decisions via maybeSingle', async () => {
      const mockMeeting = {
        id: 'meeting-1',
        association_id: 'assoc-1',
        title: 'Styrelsemöte',
        decisions: [{ id: 'decision-1', meeting_id: 'meeting-1', description: 'Köpa ny kaffemaskin' }],
      };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockMeeting, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getMeetingById('meeting-1');

      expect(supabase.from).toHaveBeenCalledWith('association_meetings');
      expect(mockChain.select).toHaveBeenCalledWith(
        expect.stringContaining('decisions:meeting_decisions(*)')
      );
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'meeting-1');
      expect(mockChain.maybeSingle).toHaveBeenCalled();
      expect(result).toEqual(mockMeeting);
    });

    it('should return null when meeting is not found', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getMeetingById('missing');

      expect(result).toBeNull();
    });
  });

  describe('createMeeting', () => {
    it('should insert a meeting with the given payload and return it', async () => {
      const mockMeeting = {
        id: 'meeting-1',
        association_id: 'assoc-1',
        workgroup_id: null,
        title: 'Årsmöte',
        agenda: 'Val av styrelse',
        minutes: null,
        meeting_date: '2026-11-15T18:00:00Z',
        location: 'Föreningslokalen',
        status: 'planned',
        created_by: 'user-1',
        created_at: '2026-10-14T00:00:00Z',
        updated_at: '2026-10-14T00:00:00Z',
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMeeting, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await createMeeting({
        association_id: 'assoc-1',
        title: 'Årsmöte',
        meeting_date: '2026-11-15T18:00:00Z',
        agenda: 'Val av styrelse',
        location: 'Föreningslokalen',
        created_by: 'user-1',
      });

      expect(supabase.from).toHaveBeenCalledWith('association_meetings');
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          association_id: 'assoc-1',
          title: 'Årsmöte',
          meeting_date: '2026-11-15T18:00:00Z',
          agenda: 'Val av styrelse',
          location: 'Föreningslokalen',
          created_by: 'user-1',
        })
      );
      expect(result).toEqual(mockMeeting);
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
        createMeeting({
          association_id: 'assoc-1',
          title: 'Årsmöte',
          meeting_date: '2026-11-15T18:00:00Z',
          created_by: 'user-1',
        })
      ).rejects.toEqual(mockError);
    });
  });

  describe('updateMeeting', () => {
    it('should update the meeting with given fields and updated_at timestamp', async () => {
      const mockUpdated = {
        id: 'meeting-1',
        title: 'Årsmöte (flyttat)',
        status: 'held',
      };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdated, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await updateMeeting('meeting-1', {
        title: 'Årsmöte (flyttat)',
        status: 'held',
      });

      expect(supabase.from).toHaveBeenCalledWith('association_meetings');
      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Årsmöte (flyttat)',
          status: 'held',
          updated_at: expect.any(String),
        })
      );
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'meeting-1');
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('deleteMeeting', () => {
    it('should delete a meeting by ID', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await deleteMeeting('meeting-1');

      expect(supabase.from).toHaveBeenCalledWith('association_meetings');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'meeting-1');
    });

    it('should throw error when delete fails', async () => {
      const mockError = { message: 'Delete failed' };

      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(deleteMeeting('meeting-1')).rejects.toEqual(mockError);
    });
  });

  describe('addDecision', () => {
    it('should insert a decision for a meeting and return it', async () => {
      const mockDecision = {
        id: 'decision-1',
        meeting_id: 'meeting-1',
        description: 'Köpa ny kaffemaskin till lokalen',
        created_by: 'user-1',
        created_at: '2026-10-14T00:00:00Z',
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDecision, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await addDecision({
        meeting_id: 'meeting-1',
        description: 'Köpa ny kaffemaskin till lokalen',
        created_by: 'user-1',
      });

      expect(supabase.from).toHaveBeenCalledWith('meeting_decisions');
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          meeting_id: 'meeting-1',
          description: 'Köpa ny kaffemaskin till lokalen',
          created_by: 'user-1',
        })
      );
      expect(result).toEqual(mockDecision);
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
        addDecision({
          meeting_id: 'meeting-1',
          description: 'Test',
          created_by: 'user-1',
        })
      ).rejects.toEqual(mockError);
    });
  });

  describe('deleteDecision', () => {
    it('should delete a decision by ID', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await deleteDecision('decision-1');

      expect(supabase.from).toHaveBeenCalledWith('meeting_decisions');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'decision-1');
    });
  });
});
