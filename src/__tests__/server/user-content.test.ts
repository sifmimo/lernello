import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({ data: { id: 'target-user-id' }, error: null })),
            })),
          })),
        };
      }
      if (table === 'user_plans') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  plan_type: 'free',
                  limits: { modules_per_month: 3, skills_per_month: 10 },
                  current_usage: { modules: 0, skills: 0 },
                },
                error: null,
              })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({ data: null, error: null })),
          })),
        };
      }
      if (table === 'subjects') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({ data: { code: 'math', name_key: 'subjects.math' }, error: null })),
            })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null })),
            order: vi.fn(() => ({
              limit: vi.fn(() => ({ data: [], error: null })),
            })),
          })),
          order: vi.fn(() => ({ data: [], error: null })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: { id: 'new-module-id', name: 'Test Module' }, error: null })),
          })),
        })),
        upsert: vi.fn(() => ({ data: null, error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ data: null, error: null })),
        })),
      };
    }),
    auth: {
      getUser: vi.fn(() => ({ data: { user: { id: 'test-user-id' } } })),
    },
  })),
}));

vi.mock('@/lib/ai/providers', () => ({
  createAICompletion: vi.fn(() => Promise.resolve({
    content: JSON.stringify({
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    }),
    model: 'gpt-4o-mini',
  })),
}));

describe('User Content Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserModules', () => {
    it('should return empty array when no modules exist', async () => {
      const { getUserModules } = await import('../../../src/server/actions/user-content');
      const result = await getUserModules();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getUserSkills', () => {
    it('should return empty array when no skills exist', async () => {
      const { getUserSkills } = await import('../../../src/server/actions/user-content');
      const result = await getUserSkills();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getPublicModules', () => {
    it('should return empty array when no public modules exist', async () => {
      const { getPublicModules } = await import('../../../src/server/actions/user-content');
      const result = await getPublicModules();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getPublicSkills', () => {
    it('should return empty array when no public skills exist', async () => {
      const { getPublicSkills } = await import('../../../src/server/actions/user-content');
      const result = await getPublicSkills();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('rateContent', () => {
    it('should reject invalid ratings', async () => {
      const { rateContent } = await import('../../../src/server/actions/user-content');
      const result = await rateContent('module', 'test-id', 0);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalide');
    });

    it('should reject ratings above 5', async () => {
      const { rateContent } = await import('../../../src/server/actions/user-content');
      const result = await rateContent('module', 'test-id', 6);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalide');
    });
  });
});
