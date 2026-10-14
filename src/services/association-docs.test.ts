import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDocuments,
  uploadAssociationDocument,
  deleteDocument,
  getAssociationPosts,
  createAssociationPost,
  deleteAssociationPost,
} from './association-docs';
import { supabase } from './supabase';
import { uploadFile } from './s3';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('./s3', () => ({
  uploadFile: vi.fn(),
}));

// Thenable query chain — awaitable at any point in the chain
function createQueryMock(result: { data?: unknown; error?: unknown }) {
  const chain: any = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
    then: (onFulfilled: any, onRejected: any) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };
  return chain;
}

describe('Association Docs Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDocuments', () => {
    it('should fetch documents with uploader profile, newest first', async () => {
      const mockDocs = [
        { id: 'doc-2', title: 'Protokoll', created_at: '2026-10-02T00:00:00Z' },
        { id: 'doc-1', title: 'Stadgar', created_at: '2026-10-01T00:00:00Z' },
      ];
      const chain = createQueryMock({ data: mockDocs, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await getDocuments('assoc-1');

      expect(supabase.from).toHaveBeenCalledWith('association_documents');
      expect(chain.select).toHaveBeenCalledWith(
        expect.stringContaining('uploader:profiles(id, username, display_name, avatar_url)')
      );
      expect(chain.eq).toHaveBeenCalledWith('association_id', 'assoc-1');
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockDocs);
    });

    it('should throw when fetch fails', async () => {
      const mockError = { message: 'DB error' };
      vi.mocked(supabase.from).mockReturnValue(createQueryMock({ data: null, error: mockError }));

      await expect(getDocuments('assoc-1')).rejects.toEqual(mockError);
    });
  });

  describe('uploadAssociationDocument', () => {
    it('should upload file to the association folder and insert DB row with url, name and size', async () => {
      const file = new File(['hello'], 'stadgar.pdf', { type: 'application/pdf' });
      vi.mocked(uploadFile).mockResolvedValue({
        key: 'association-docs/assoc-1/stadgar.pdf',
        url: 'https://cdn.example.com/association-docs/assoc-1/stadgar.pdf',
        fileName: 'stadgar.pdf',
        fileSize: file.size,
        mimeType: 'application/pdf',
      });

      const mockDoc = { id: 'doc-1', title: 'Stadgar' };
      const chain = createQueryMock({ data: mockDoc, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await uploadAssociationDocument(file, {
        association_id: 'assoc-1',
        title: 'Stadgar',
        description: 'Föreningens stadgar',
        uploaded_by: 'user-1',
      });

      expect(uploadFile).toHaveBeenCalledWith(file, 'association-docs/assoc-1');
      expect(supabase.from).toHaveBeenCalledWith('association_documents');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          association_id: 'assoc-1',
          title: 'Stadgar',
          description: 'Föreningens stadgar',
          file_url: 'https://cdn.example.com/association-docs/assoc-1/stadgar.pdf',
          file_name: 'stadgar.pdf',
          file_size: file.size,
          uploaded_by: 'user-1',
        })
      );
      expect(result).toEqual(mockDoc);
    });

    it('should throw when DB insert fails', async () => {
      const file = new File(['x'], 'fil.pdf', { type: 'application/pdf' });
      vi.mocked(uploadFile).mockResolvedValue({
        key: 'k',
        url: 'https://cdn.example.com/k',
        fileName: 'fil.pdf',
        fileSize: 1,
        mimeType: 'application/pdf',
      });
      const mockError = { message: 'Insert failed' };
      vi.mocked(supabase.from).mockReturnValue(createQueryMock({ data: null, error: mockError }));

      await expect(
        uploadAssociationDocument(file, {
          association_id: 'assoc-1',
          title: 'Fil',
          uploaded_by: 'user-1',
        })
      ).rejects.toEqual(mockError);
    });
  });

  describe('deleteDocument', () => {
    it('should delete the DB row by id', async () => {
      const chain = createQueryMock({ error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      await deleteDocument('doc-1');

      expect(supabase.from).toHaveBeenCalledWith('association_documents');
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('id', 'doc-1');
    });

    it('should throw when delete fails', async () => {
      const mockError = { message: 'Delete failed' };
      vi.mocked(supabase.from).mockReturnValue(createQueryMock({ error: mockError }));

      await expect(deleteDocument('doc-1')).rejects.toEqual(mockError);
    });
  });

  describe('getAssociationPosts', () => {
    it('should build a tree: top-level posts newest first, replies oldest first under their parent', async () => {
      // Flat rows in created_at ASC order (as the query returns them)
      const flat = [
        { id: 'top-1', parent_post_id: null, content: 'Första', created_at: '2026-10-01T10:00:00Z' },
        { id: 'reply-1a', parent_post_id: 'top-1', content: 'Svar 1a', created_at: '2026-10-01T11:00:00Z' },
        { id: 'top-2', parent_post_id: null, content: 'Andra', created_at: '2026-10-02T10:00:00Z' },
        { id: 'reply-1b', parent_post_id: 'top-1', content: 'Svar 1b', created_at: '2026-10-02T11:00:00Z' },
        { id: 'reply-2a', parent_post_id: 'top-2', content: 'Svar 2a', created_at: '2026-10-03T10:00:00Z' },
      ];
      const chain = createQueryMock({ data: flat, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await getAssociationPosts('assoc-1');

      expect(supabase.from).toHaveBeenCalledWith('association_posts');
      expect(chain.select).toHaveBeenCalledWith(
        expect.stringContaining('author:profiles(id, username, display_name, avatar_url)')
      );
      expect(chain.eq).toHaveBeenCalledWith('association_id', 'assoc-1');
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true });

      // Two top-level posts, newest first
      expect(result.map(p => p.id)).toEqual(['top-2', 'top-1']);
      // Replies attached to correct parent, oldest first
      expect(result[0].replies?.map(r => r.id)).toEqual(['reply-2a']);
      expect(result[1].replies?.map(r => r.id)).toEqual(['reply-1a', 'reply-1b']);
    });

    it('should return empty array when there are no posts', async () => {
      vi.mocked(supabase.from).mockReturnValue(createQueryMock({ data: [], error: null }));

      const result = await getAssociationPosts('assoc-1');

      expect(result).toEqual([]);
    });

    it('should throw when fetch fails', async () => {
      const mockError = { message: 'DB error' };
      vi.mocked(supabase.from).mockReturnValue(createQueryMock({ data: null, error: mockError }));

      await expect(getAssociationPosts('assoc-1')).rejects.toEqual(mockError);
    });
  });

  describe('createAssociationPost', () => {
    it('should insert a top-level post with null parent by default', async () => {
      const mockPost = { id: 'post-1', content: 'Hej alla' };
      const chain = createQueryMock({ data: mockPost, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await createAssociationPost({
        association_id: 'assoc-1',
        content: 'Hej alla',
        author_id: 'user-1',
      });

      expect(supabase.from).toHaveBeenCalledWith('association_posts');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          association_id: 'assoc-1',
          content: 'Hej alla',
          author_id: 'user-1',
          parent_post_id: null,
        })
      );
      expect(result).toEqual(mockPost);
    });

    it('should insert a reply with the given parent_post_id', async () => {
      const mockReply = { id: 'post-2', parent_post_id: 'post-1' };
      const chain = createQueryMock({ data: mockReply, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await createAssociationPost({
        association_id: 'assoc-1',
        content: 'Ett svar',
        author_id: 'user-2',
        parent_post_id: 'post-1',
      });

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ parent_post_id: 'post-1' })
      );
      expect(result).toEqual(mockReply);
    });

    it('should throw when insert fails', async () => {
      const mockError = { message: 'Insert failed' };
      vi.mocked(supabase.from).mockReturnValue(createQueryMock({ data: null, error: mockError }));

      await expect(
        createAssociationPost({
          association_id: 'assoc-1',
          content: 'Hej',
          author_id: 'user-1',
        })
      ).rejects.toEqual(mockError);
    });
  });

  describe('deleteAssociationPost', () => {
    it('should delete a post by id', async () => {
      const chain = createQueryMock({ error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      await deleteAssociationPost('post-1');

      expect(supabase.from).toHaveBeenCalledWith('association_posts');
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('id', 'post-1');
    });

    it('should throw when delete fails', async () => {
      const mockError = { message: 'Delete failed' };
      vi.mocked(supabase.from).mockReturnValue(createQueryMock({ error: mockError }));

      await expect(deleteAssociationPost('post-1')).rejects.toEqual(mockError);
    });
  });
});
