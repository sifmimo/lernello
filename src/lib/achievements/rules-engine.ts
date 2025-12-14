'use server';

import { createClient } from '@/lib/supabase/server';

export interface AchievementRule {
  id: string;
  code: string;
  name_key: string;
  description_key: string;
  icon: string;
  category: string;
  trigger_type: 'skill_mastery' | 'streak' | 'time_goal' | 'exercises_completed' | 'domain_complete' | 'level_up';
  trigger_conditions: Record<string, unknown>;
  xp_reward: number;
  version: number;
  is_active: boolean;
}

export interface TriggerContext {
  studentId: string;
  skillId?: string;
  domainId?: string;
  exerciseCount?: number;
  streakDays?: number;
  masteryLevel?: number;
  timeSpentMinutes?: number;
}

export async function evaluateRule(
  rule: AchievementRule,
  context: TriggerContext
): Promise<boolean> {
  const conditions = rule.trigger_conditions;

  switch (rule.trigger_type) {
    case 'skill_mastery':
      return evaluateSkillMastery(conditions, context);
    case 'streak':
      return evaluateStreak(conditions, context);
    case 'time_goal':
      return evaluateTimeGoal(conditions, context);
    case 'exercises_completed':
      return evaluateExercisesCompleted(conditions, context);
    case 'domain_complete':
      return evaluateDomainComplete(conditions, context);
    case 'level_up':
      return evaluateLevelUp(conditions, context);
    default:
      return false;
  }
}

async function evaluateSkillMastery(
  conditions: Record<string, unknown>,
  context: TriggerContext
): Promise<boolean> {
  const requiredMastery = (conditions.mastery_threshold as number) || 100;
  const skillCount = (conditions.skill_count as number) || 1;

  const supabase = await createClient();
  const { count } = await supabase
    .from('student_skill_progress')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', context.studentId)
    .gte('mastery_level', requiredMastery);

  return (count || 0) >= skillCount;
}

async function evaluateStreak(
  conditions: Record<string, unknown>,
  context: TriggerContext
): Promise<boolean> {
  const requiredDays = (conditions.days as number) || 7;
  
  const supabase = await createClient();
  const { data } = await supabase
    .from('student_profiles')
    .select('current_streak')
    .eq('id', context.studentId)
    .single();

  return (data?.current_streak || 0) >= requiredDays;
}

async function evaluateTimeGoal(
  conditions: Record<string, unknown>,
  context: TriggerContext
): Promise<boolean> {
  const requiredMinutes = (conditions.minutes as number) || 30;
  const period = (conditions.period as string) || 'day';

  const supabase = await createClient();
  
  const startDate = new Date();
  if (period === 'day') {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  }

  const { data } = await supabase
    .from('learning_sessions')
    .select('duration_seconds')
    .eq('student_id', context.studentId)
    .gte('started_at', startDate.toISOString());

  const totalMinutes = (data || []).reduce(
    (sum, s) => sum + (s.duration_seconds || 0) / 60,
    0
  );

  return totalMinutes >= requiredMinutes;
}

async function evaluateExercisesCompleted(
  conditions: Record<string, unknown>,
  context: TriggerContext
): Promise<boolean> {
  const requiredCount = (conditions.count as number) || 10;
  const correctOnly = (conditions.correct_only as boolean) || false;

  const supabase = await createClient();
  
  let query = supabase
    .from('exercise_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', context.studentId);

  if (correctOnly) {
    query = query.eq('is_correct', true);
  }

  const { count } = await query;
  return (count || 0) >= requiredCount;
}

async function evaluateDomainComplete(
  conditions: Record<string, unknown>,
  context: TriggerContext
): Promise<boolean> {
  const requiredMastery = (conditions.mastery_threshold as number) || 80;

  if (!context.domainId) return false;

  const supabase = await createClient();
  
  const { data: skills } = await supabase
    .from('skills')
    .select('id')
    .eq('domain_id', context.domainId);

  if (!skills || skills.length === 0) return false;

  const { data: progress } = await supabase
    .from('student_skill_progress')
    .select('mastery_level')
    .eq('student_id', context.studentId)
    .in('skill_id', skills.map(s => s.id));

  if (!progress || progress.length < skills.length) return false;

  return progress.every(p => (p.mastery_level || 0) >= requiredMastery);
}

async function evaluateLevelUp(
  conditions: Record<string, unknown>,
  context: TriggerContext
): Promise<boolean> {
  const targetLevel = (conditions.level as number) || 1;

  const supabase = await createClient();
  const { data } = await supabase
    .from('student_profiles')
    .select('total_xp')
    .eq('id', context.studentId)
    .single();

  const xp = data?.total_xp || 0;
  const currentLevel = Math.floor(xp / 1000) + 1;

  return currentLevel >= targetLevel;
}

export async function checkAndGrantAchievements(
  context: TriggerContext
): Promise<string[]> {
  const supabase = await createClient();
  
  const { data: rules } = await supabase
    .from('achievement_rules')
    .select('*')
    .eq('is_active', true);

  if (!rules) return [];

  const { data: earned } = await supabase
    .from('student_achievements')
    .select('rule_id')
    .eq('student_id', context.studentId);

  const earnedIds = new Set(earned?.map(e => e.rule_id) || []);
  const newAchievements: string[] = [];

  for (const rule of rules) {
    if (earnedIds.has(rule.id)) continue;

    const isEarned = await evaluateRule(rule as AchievementRule, context);
    
    if (isEarned) {
      await supabase.from('student_achievements').insert({
        student_id: context.studentId,
        rule_id: rule.id,
        earned_at: new Date().toISOString(),
      });

      await supabase.rpc('increment_xp', {
        p_student_id: context.studentId,
        p_xp: rule.xp_reward,
      });

      newAchievements.push(rule.code);
    }
  }

  return newAchievements;
}

export async function getActiveRulesVersion(): Promise<number> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('achievement_rules')
    .select('version')
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  return data?.version || 1;
}

export async function createRuleVersion(
  ruleId: string,
  updates: Partial<AchievementRule>
): Promise<void> {
  const supabase = await createClient();
  
  const { data: currentRule } = await supabase
    .from('achievement_rules')
    .select('*')
    .eq('id', ruleId)
    .single();

  if (!currentRule) return;

  await supabase
    .from('achievement_rules')
    .update({ is_active: false })
    .eq('id', ruleId);

  await supabase.from('achievement_rules').insert({
    ...currentRule,
    ...updates,
    id: undefined,
    version: currentRule.version + 1,
    is_active: true,
    created_at: new Date().toISOString(),
  });
}
