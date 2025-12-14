import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
          order: vi.fn(() => ({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({ data: null, error: null })),
      upsert: vi.fn(() => ({ data: null, error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ data: null, error: null })),
      })),
    })),
    auth: {
      getUser: vi.fn(() => ({ data: { user: { id: 'test-user-id' } } })),
    },
    rpc: vi.fn(() => ({ data: { can_generate: true, use_platform_tokens: true, current_usage: 0, limit: 10, remaining: 10, plan_type: 'free' }, error: null })),
  })),
}));

vi.mock('@/lib/ai/providers', () => ({
  createAICompletion: vi.fn(() => Promise.resolve({
    content: JSON.stringify({
      content: {
        objective: 'Test objective',
        context: 'Test context',
        theory: 'Test theory',
        synthesis: 'Test synthesis',
        enrichments: {},
      },
      examples: [
        { title: 'Example 1', problem: 'Problem', solution: 'Solution', explanation: 'Explanation' },
      ],
      selfAssessments: [
        { question: 'Did you understand?', type: 'yes_no' },
      ],
    }),
    model: 'gpt-4o-mini',
  })),
}));

describe('Skill Content Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSkillContent', () => {
    it('should return null content when skill has no content', async () => {
      const { getSkillContent } = await import('../../../src/server/actions/skill-content');
      const result = await getSkillContent('test-skill-id');
      
      expect(result).toBeDefined();
      expect(result?.content).toBeNull();
      expect(result?.examples).toEqual([]);
      expect(result?.selfAssessments).toEqual([]);
    });
  });

  describe('getPedagogicalMethods', () => {
    it('should return empty array when no methods exist', async () => {
      const { getPedagogicalMethods } = await import('../../../src/server/actions/skill-content');
      const result = await getPedagogicalMethods();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('checkExerciseUsage', () => {
    it('should return usage check result', async () => {
      const { checkExerciseUsage } = await import('../../../src/server/actions/skill-content');
      const result = await checkExerciseUsage('test-skill-id');
      
      expect(result).toBeDefined();
      expect(result.can_generate).toBe(true);
      expect(result.limit).toBe(10);
    });
  });
});
