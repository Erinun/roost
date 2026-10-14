import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAssociation,
  getMyAssociations,
  addAssociationMember,
  updateMemberRole,
  createWorkgroup,
} from './association';
import { supabase } from './supabase';

// Mock the supabase client
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('Association Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAssociation', () => {
    it('should insert the association, add creator as admin member, and return the association', async () => {
      const mockAssociation = {
        id: 'assoc-1',
        name: 'Testföreningen',
        slug: 'testforeningen',
        description: null,
        contact_info: null,
        avatar_url: null,
        created_by: 'user-1',
        created_at: '2026-10-14T00:00:00Z',
        updated_at: '2026-10-14T00:00:00Z',
      };

      const insertAssociationChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAssociation, error: null }),
      };

      const insertMemberChain = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(insertAssociationChain as any)
        .mockReturnValueOnce(insertMemberChain as any);

      const result = await createAssociation({
        name: 'Testföreningen',
        slug: 'testforeningen',
        created_by: 'user-1',
      });

      expect(supabase.from).toHaveBeenNthCalledWith(1, 'associations');
      expect(insertAssociationChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Testföreningen',
          slug: 'testforeningen',
          created_by: 'user-1',
        })
      );
      expect(supabase.from).toHaveBeenNthCalledWith(2, 'association_members');
      expect(insertMemberChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          association_id: 'assoc-1',
          user_id: 'user-1',
          role: 'admin',
        })
      );
      expect(result).toEqual(mockAssociation);
    });

    it('should throw error when association insert fails', async () => {
      const mockError = { message: 'Database error', code: '500' };

      const insertAssociationChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(insertAssociationChain as any);

      await expect(
        createAssociation({
          name: 'Testföreningen',
          slug: 'testforeningen',
          created_by: 'user-1',
        })
      ).rejects.toEqual(mockError);

      // No member insert should be attempted
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });

    it('should throw error when member insert fails', async () => {
      const mockAssociation = {
        id: 'assoc-1',
        name: 'Testföreningen',
        slug: 'testforeningen',
        created_by: 'user-1',
      };
      const mockError = { message: 'Member insert failed' };

      const insertAssociationChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAssociation, error: null }),
      };

      const insertMemberChain = {
        insert: vi.fn().mockResolvedValue({ error: mockError }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(insertAssociationChain as any)
        .mockReturnValueOnce(insertMemberChain as any);

      await expect(
        createAssociation({
          name: 'Testföreningen',
          slug: 'testforeningen',
          created_by: 'user-1',
        })
      ).rejects.toEqual(mockError);
    });
  });

  describe('getMyAssociations', () => {
    it('should map membership rows to associations with my_role', async () => {
      const mockAssociation = {
        id: 'assoc-1',
        name: 'Testföreningen',
        slug: 'testforeningen',
        description: null,
        contact_info: null,
        avatar_url: null,
        created_by: 'user-2',
        created_at: '2026-10-14T00:00:00Z',
        updated_at: '2026-10-14T00:00:00Z',
      };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ role: 'internal', association: mockAssociation }],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getMyAssociations('user-1');

      expect(supabase.from).toHaveBeenCalledWith('association_members');
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toEqual([{ ...mockAssociation, my_role: 'internal' }]);
    });

    it('should return empty array when user has no memberships', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getMyAssociations('user-1');

      expect(result).toEqual([]);
    });

    it('should throw error when fetch fails', async () => {
      const mockError = { message: 'Fetch failed' };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(getMyAssociations('user-1')).rejects.toEqual(mockError);
    });
  });

  describe('addAssociationMember', () => {
    it('should insert a member with the given role and return it', async () => {
      const mockMember = {
        id: 'member-1',
        association_id: 'assoc-1',
        user_id: 'user-2',
        role: 'internal',
        joined_at: '2026-10-14T00:00:00Z',
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMember, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await addAssociationMember('assoc-1', 'user-2', 'internal');

      expect(supabase.from).toHaveBeenCalledWith('association_members');
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          association_id: 'assoc-1',
          user_id: 'user-2',
          role: 'internal',
        })
      );
      expect(result).toEqual(mockMember);
    });

    it('should throw error when insert fails', async () => {
      const mockError = { message: 'Insert failed' };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(addAssociationMember('assoc-1', 'user-2', 'member')).rejects.toEqual(
        mockError
      );
    });
  });

  describe('updateMemberRole', () => {
    it('should update the member role by member id', async () => {
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await updateMemberRole('member-1', 'admin');

      expect(supabase.from).toHaveBeenCalledWith('association_members');
      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'admin' })
      );
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'member-1');
    });

    it('should throw error when update fails', async () => {
      const mockError = { message: 'Update failed' };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(updateMemberRole('member-1', 'member')).rejects.toEqual(mockError);
    });
  });

  describe('createWorkgroup', () => {
    it('should insert a workgroup and return it', async () => {
      const mockWorkgroup = {
        id: 'wg-1',
        association_id: 'assoc-1',
        name: 'Styrelsen',
        description: null,
        created_by: 'user-1',
        created_at: '2026-10-14T00:00:00Z',
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockWorkgroup, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await createWorkgroup({
        association_id: 'assoc-1',
        name: 'Styrelsen',
        created_by: 'user-1',
      });

      expect(supabase.from).toHaveBeenCalledWith('association_workgroups');
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          association_id: 'assoc-1',
          name: 'Styrelsen',
          created_by: 'user-1',
        })
      );
      expect(result).toEqual(mockWorkgroup);
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
        createWorkgroup({
          association_id: 'assoc-1',
          name: 'Styrelsen',
          created_by: 'user-1',
        })
      ).rejects.toEqual(mockError);
    });
  });
});
