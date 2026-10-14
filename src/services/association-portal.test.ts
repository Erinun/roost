import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getActivities,
  createActivity,
  updateActivity,
  publishActivity,
  unpublishActivity,
  deleteActivity,
  getSignupCounts,
  getMySignups,
  signUpForActivity,
  cancelSignup,
  getNews,
  getNewsById,
  createNews,
  updateNews,
  publishNews,
  unpublishNews,
  deleteNews,
  getQuestions,
  getMyQuestions,
  getQuestionById,
  createQuestion,
  addQuestionReply,
  updateQuestionStatus,
} from './association-portal';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Thenable query chain — awaitable at any point in the chain
function createQueryMock(result: { data?: unknown; error?: unknown }) {
  const chain: any = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (onFulfilled: any, onRejected: any) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };
  return chain;
}

describe('Association Portal Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Activities ────────────────────────────────────────────────

  describe('getActivities', () => {
    it('should fetch activities ordered by starts_at ascending', async () => {
      const mockActivities = [{ id: 'act-1' }, { id: 'act-2' }];
      const chain = createQueryMock({ data: mockActivities, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await getActivities('assoc-1');

      expect(supabase.from).toHaveBeenCalledWith('association_activities');
      expect(chain.eq).toHaveBeenCalledWith('association_id', 'assoc-1');
      expect(chain.order).toHaveBeenCalledWith('starts_at', { ascending: true });
      expect(chain.gte).not.toHaveBeenCalled();
      expect(result).toEqual(mockActivities);
    });

    it('should filter on is_published and upcoming when options are set', async () => {
      const chain = createQueryMock({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      await getActivities('assoc-1', { onlyPublished: true, upcomingOnly: true });

      expect(chain.eq).toHaveBeenCalledWith('association_id', 'assoc-1');
      expect(chain.eq).toHaveBeenCalledWith('is_published', true);
      expect(chain.gte).toHaveBeenCalledWith('starts_at', expect.any(String));
      // gte argument should be a valid ISO timestamp
      const gteArg = chain.gte.mock.calls[0][1];
      expect(new Date(gteArg).toISOString()).toBe(gteArg);
    });

    it('should throw when fetch fails', async () => {
      const mockError = { message: 'DB error' };
      vi.mocked(supabase.from).mockReturnValue(createQueryMock({ data: null, error: mockError }));

      await expect(getActivities('assoc-1')).rejects.toEqual(mockError);
    });
  });

  describe('createActivity', () => {
    it('should insert the activity and return it', async () => {
      const mockActivity = { id: 'act-1', title: 'Städdag' };
      const chain = createQueryMock({ data: mockActivity, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await createActivity({
        association_id: 'assoc-1',
        title: 'Städdag',
        starts_at: '2026-11-01T10:00:00Z',
        location: 'Gården',
        created_by: 'user-1',
      });

      expect(supabase.from).toHaveBeenCalledWith('association_activities');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          association_id: 'assoc-1',
          title: 'Städdag',
          starts_at: '2026-11-01T10:00:00Z',
          location: 'Gården',
          created_by: 'user-1',
        })
      );
      expect(result).toEqual(mockActivity);
    });
  });

  describe('updateActivity', () => {
    it('should update the given fields by id', async () => {
      const mockActivity = { id: 'act-1', title: 'Ny titel' };
      const chain = createQueryMock({ data: mockActivity, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await updateActivity('act-1', { title: 'Ny titel' });

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Ny titel' })
      );
      expect(chain.eq).toHaveBeenCalledWith('id', 'act-1');
      expect(result).toEqual(mockActivity);
    });
  });

  describe('publishActivity', () => {
    it('should set is_published=true and published_at to an ISO timestamp', async () => {
      const mockActivity = { id: 'act-1', is_published: true };
      const chain = createQueryMock({ data: mockActivity, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await publishActivity('act-1');

      expect(supabase.from).toHaveBeenCalledWith('association_activities');
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_published: true,
          published_at: expect.any(String),
        })
      );
      const payload = chain.update.mock.calls[0][0];
      expect(new Date(payload.published_at).toISOString()).toBe(payload.published_at);
      expect(chain.eq).toHaveBeenCalledWith('id', 'act-1');
      expect(result).toEqual(mockActivity);
    });
  });

  describe('unpublishActivity', () => {
    it('should set is_published=false and clear published_at', async () => {
      const mockActivity = { id: 'act-1', is_published: false };
      const chain = createQueryMock({ data: mockActivity, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await unpublishActivity('act-1');

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ is_published: false, published_at: null })
      );
      expect(chain.eq).toHaveBeenCalledWith('id', 'act-1');
      expect(result).toEqual(mockActivity);
    });
  });

  describe('deleteActivity', () => {
    it('should delete the activity by id', async () => {
      const chain = createQueryMock({ error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      await deleteActivity('act-1');

      expect(supabase.from).toHaveBeenCalledWith('association_activities');
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('id', 'act-1');
    });
  });

  // ─── Signups ───────────────────────────────────────────────────

  describe('getSignupCounts', () => {
    it('should return {} without querying when input is empty', async () => {
      const result = await getSignupCounts([]);

      expect(result).toEqual({});
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should count signups per activity in JS', async () => {
      const rows = [
        { activity_id: 'act-1' },
        { activity_id: 'act-1' },
        { activity_id: 'act-2' },
      ];
      const chain = createQueryMock({ data: rows, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await getSignupCounts(['act-1', 'act-2', 'act-3']);

      expect(supabase.from).toHaveBeenCalledWith('activity_signups');
      expect(chain.in).toHaveBeenCalledWith('activity_id', ['act-1', 'act-2', 'act-3']);
      expect(result).toEqual({ 'act-1': 2, 'act-2': 1 });
    });
  });

  describe('getMySignups', () => {
    it('should return [] without querying when input is empty', async () => {
      const result = await getMySignups('user-1', []);

      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should return the activity ids the user has signed up for', async () => {
      const rows = [{ activity_id: 'act-1' }, { activity_id: 'act-3' }];
      const chain = createQueryMock({ data: rows, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await getMySignups('user-1', ['act-1', 'act-2', 'act-3']);

      expect(supabase.from).toHaveBeenCalledWith('activity_signups');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(chain.in).toHaveBeenCalledWith('activity_id', ['act-1', 'act-2', 'act-3']);
      expect(result).toEqual(['act-1', 'act-3']);
    });
  });

  describe('signUpForActivity', () => {
    it('should insert a signup row', async () => {
      const chain = createQueryMock({ error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      await signUpForActivity('act-1', 'user-1');

      expect(supabase.from).toHaveBeenCalledWith('activity_signups');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ activity_id: 'act-1', user_id: 'user-1' })
      );
    });
  });

  describe('cancelSignup', () => {
    it('should delete the signup row for the activity and user', async () => {
      const chain = createQueryMock({ error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      await cancelSignup('act-1', 'user-1');

      expect(supabase.from).toHaveBeenCalledWith('activity_signups');
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('activity_id', 'act-1');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });
  });

  // ─── News ──────────────────────────────────────────────────────

  describe('getNews', () => {
    it('should order drafts first then newest when not filtering', async () => {
      const mockNews = [{ id: 'news-1' }];
      const chain = createQueryMock({ data: mockNews, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await getNews('assoc-1');

      expect(supabase.from).toHaveBeenCalledWith('member_news');
      expect(chain.eq).toHaveBeenCalledWith('association_id', 'assoc-1');
      expect(chain.order).toHaveBeenCalledWith('status', { ascending: true });
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockNews);
    });

    it('should filter published and order by published_at descending when onlyPublished', async () => {
      const chain = createQueryMock({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      await getNews('assoc-1', { onlyPublished: true });

      expect(chain.eq).toHaveBeenCalledWith('status', 'published');
      expect(chain.order).toHaveBeenCalledWith('published_at', { ascending: false });
    });
  });

  describe('getNewsById', () => {
    it('should return the news item', async () => {
      const mockNews = { id: 'news-1', title: 'Nyhet' };
      const chain = createQueryMock({ data: mockNews, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await getNewsById('news-1');

      expect(chain.eq).toHaveBeenCalledWith('id', 'news-1');
      expect(result).toEqual(mockNews);
    });

    it('should return null when not found', async () => {
      const chain = createQueryMock({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await getNewsById('missing');

      expect(result).toBeNull();
    });
  });

  describe('createNews', () => {
    it('should insert the news item and return it', async () => {
      const mockNews = { id: 'news-1', title: 'Höstnytt', status: 'draft' };
      const chain = createQueryMock({ data: mockNews, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await createNews({
        association_id: 'assoc-1',
        title: 'Höstnytt',
        content: 'Innehåll',
        created_by: 'user-1',
      });

      expect(supabase.from).toHaveBeenCalledWith('member_news');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          association_id: 'assoc-1',
          title: 'Höstnytt',
          content: 'Innehåll',
          created_by: 'user-1',
        })
      );
      expect(result).toEqual(mockNews);
    });
  });

  describe('updateNews', () => {
    it('should update title/content by id', async () => {
      const mockNews = { id: 'news-1', title: 'Ny titel' };
      const chain = createQueryMock({ data: mockNews, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await updateNews('news-1', { title: 'Ny titel' });

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Ny titel' })
      );
      expect(chain.eq).toHaveBeenCalledWith('id', 'news-1');
      expect(result).toEqual(mockNews);
    });
  });

  describe('publishNews', () => {
    it('should set status=published and published_at to an ISO timestamp', async () => {
      const mockNews = { id: 'news-1', status: 'published' };
      const chain = createQueryMock({ data: mockNews, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await publishNews('news-1');

      expect(supabase.from).toHaveBeenCalledWith('member_news');
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
          published_at: expect.any(String),
        })
      );
      const payload = chain.update.mock.calls[0][0];
      expect(new Date(payload.published_at).toISOString()).toBe(payload.published_at);
      expect(chain.eq).toHaveBeenCalledWith('id', 'news-1');
      expect(result).toEqual(mockNews);
    });
  });

  describe('unpublishNews', () => {
    it('should set status=draft and clear published_at', async () => {
      const mockNews = { id: 'news-1', status: 'draft' };
      const chain = createQueryMock({ data: mockNews, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await unpublishNews('news-1');

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'draft', published_at: null })
      );
      expect(result).toEqual(mockNews);
    });
  });

  describe('deleteNews', () => {
    it('should delete the news item by id', async () => {
      const chain = createQueryMock({ error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      await deleteNews('news-1');

      expect(supabase.from).toHaveBeenCalledWith('member_news');
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('id', 'news-1');
    });
  });

  // ─── Member questions ──────────────────────────────────────────

  describe('getQuestions', () => {
    it('should fetch questions with author profile, newest first', async () => {
      const mockQuestions = [{ id: 'q-1' }];
      const chain = createQueryMock({ data: mockQuestions, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await getQuestions('assoc-1');

      expect(supabase.from).toHaveBeenCalledWith('member_questions');
      expect(chain.select).toHaveBeenCalledWith(
        expect.stringContaining('author:profiles(id, username, display_name, avatar_url)')
      );
      expect(chain.eq).toHaveBeenCalledWith('association_id', 'assoc-1');
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockQuestions);
    });
  });

  describe('getMyQuestions', () => {
    it('should fetch questions by author, newest first', async () => {
      const mockQuestions = [{ id: 'q-1' }];
      const chain = createQueryMock({ data: mockQuestions, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await getMyQuestions('user-1');

      expect(supabase.from).toHaveBeenCalledWith('member_questions');
      expect(chain.eq).toHaveBeenCalledWith('author_id', 'user-1');
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockQuestions);
    });
  });

  describe('getQuestionById', () => {
    it('should fetch the question with replies sorted oldest first', async () => {
      const mockQuestion = {
        id: 'q-1',
        subject: 'Fråga',
        replies: [
          { id: 'r-2', created_at: '2026-10-02T00:00:00Z' },
          { id: 'r-1', created_at: '2026-10-01T00:00:00Z' },
        ],
      };
      const chain = createQueryMock({ data: mockQuestion, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await getQuestionById('q-1');

      expect(supabase.from).toHaveBeenCalledWith('member_questions');
      expect(chain.select).toHaveBeenCalledWith(
        expect.stringContaining('replies:member_question_replies')
      );
      expect(chain.eq).toHaveBeenCalledWith('id', 'q-1');
      expect(result?.replies?.map(r => r.id)).toEqual(['r-1', 'r-2']);
    });

    it('should return null when not found', async () => {
      const chain = createQueryMock({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await getQuestionById('missing');

      expect(result).toBeNull();
    });
  });

  describe('createQuestion', () => {
    it('should insert the question and return it', async () => {
      const mockQuestion = { id: 'q-1', subject: 'Parkering', status: 'open' };
      const chain = createQueryMock({ data: mockQuestion, error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      const result = await createQuestion({
        association_id: 'assoc-1',
        author_id: 'user-1',
        subject: 'Parkering',
        content: 'Hur fungerar gästparkeringen?',
      });

      expect(supabase.from).toHaveBeenCalledWith('member_questions');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          association_id: 'assoc-1',
          author_id: 'user-1',
          subject: 'Parkering',
          content: 'Hur fungerar gästparkeringen?',
        })
      );
      expect(result).toEqual(mockQuestion);
    });
  });

  describe('addQuestionReply', () => {
    it('should insert the reply without touching question status by default', async () => {
      const mockReply = { id: 'r-1', question_id: 'q-1', content: 'Svar' };
      const replyChain = createQueryMock({ data: mockReply, error: null });
      vi.mocked(supabase.from).mockReturnValue(replyChain);

      const result = await addQuestionReply({
        question_id: 'q-1',
        author_id: 'user-2',
        content: 'Svar',
      });

      expect(supabase.from).toHaveBeenCalledTimes(1);
      expect(supabase.from).toHaveBeenCalledWith('member_question_replies');
      expect(replyChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          question_id: 'q-1',
          author_id: 'user-2',
          content: 'Svar',
        })
      );
      expect(result).toEqual(mockReply);
    });

    it('should mark the question as answered when markAnswered=true', async () => {
      const mockReply = { id: 'r-1', question_id: 'q-1', content: 'Svar' };
      const replyChain = createQueryMock({ data: mockReply, error: null });
      const statusChain = createQueryMock({ error: null });
      vi.mocked(supabase.from)
        .mockReturnValueOnce(replyChain)
        .mockReturnValueOnce(statusChain);

      const result = await addQuestionReply(
        { question_id: 'q-1', author_id: 'admin-1', content: 'Svar' },
        true
      );

      expect(supabase.from).toHaveBeenCalledWith('member_question_replies');
      expect(supabase.from).toHaveBeenCalledWith('member_questions');
      expect(statusChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'answered' })
      );
      expect(statusChain.eq).toHaveBeenCalledWith('id', 'q-1');
      expect(result).toEqual(mockReply);
    });

    it('should throw when the status update fails', async () => {
      const mockReply = { id: 'r-1', question_id: 'q-1', content: 'Svar' };
      const mockError = { message: 'Status update failed' };
      const replyChain = createQueryMock({ data: mockReply, error: null });
      const statusChain = createQueryMock({ error: mockError });
      vi.mocked(supabase.from)
        .mockReturnValueOnce(replyChain)
        .mockReturnValueOnce(statusChain);

      await expect(
        addQuestionReply(
          { question_id: 'q-1', author_id: 'admin-1', content: 'Svar' },
          true
        )
      ).rejects.toEqual(mockError);
    });
  });

  describe('updateQuestionStatus', () => {
    it('should update the question status by id', async () => {
      const chain = createQueryMock({ error: null });
      vi.mocked(supabase.from).mockReturnValue(chain);

      await updateQuestionStatus('q-1', 'closed');

      expect(supabase.from).toHaveBeenCalledWith('member_questions');
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'closed' })
      );
      expect(chain.eq).toHaveBeenCalledWith('id', 'q-1');
    });

    it('should throw when the update fails', async () => {
      const mockError = { message: 'Update failed' };
      vi.mocked(supabase.from).mockReturnValue(createQueryMock({ error: mockError }));

      await expect(updateQuestionStatus('q-1', 'closed')).rejects.toEqual(mockError);
    });
  });
});
