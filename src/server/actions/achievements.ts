'use server';

import { createClient } from '@/lib/supabase/server';

interface AchievementCheck {
  studentId: string;
  eventType: 'exercise_correct' | 'streak' | 'skill_mastered' | 'session_complete';
  data?: {
    streakCount?: number;
    skillId?: string;
    exercisesCompleted?: number;
    correctAnswers?: number;
  };
}

export async function checkAndGrantAchievements(check: AchievementCheck) {
  const supabase = await createClient();
  const achievementsToGrant: string[] = [];

  const { data: rules } = await supabase
    .from('achievement_rules')
    .select('*')
    .eq('is_active', true);

  if (!rules) return { granted: [] };

  const { data: existingAchievements } = await supabase
    .from('student_achievements')
    .select('rule_id')
    .eq('student_id', check.studentId);

  const earnedRuleIds = new Set((existingAchievements || []).map((a: { rule_id: string }) => a.rule_id));

  for (const rule of rules) {
    if (earnedRuleIds.has(rule.id)) continue;

    let shouldGrant = false;

    switch (rule.code) {
      case 'first_correct':
        if (check.eventType === 'exercise_correct') {
          shouldGrant = true;
        }
        break;

      case 'streak_5':
        if (check.eventType === 'streak' && (check.data?.streakCount || 0) >= 5) {
          shouldGrant = true;
        }
        break;

      case 'streak_10':
        if (check.eventType === 'streak' && (check.data?.streakCount || 0) >= 10) {
          shouldGrant = true;
        }
        break;

      case 'skill_mastered':
        if (check.eventType === 'skill_mastered') {
          shouldGrant = true;
        }
        break;

      case 'perfect_session':
        if (check.eventType === 'session_complete') {
          const { exercisesCompleted = 0, correctAnswers = 0 } = check.data || {};
          if (exercisesCompleted >= 5 && exercisesCompleted === correctAnswers) {
            shouldGrant = true;
          }
        }
        break;

      case 'early_bird':
        if (check.eventType === 'exercise_correct') {
          const hour = new Date().getHours();
          if (hour < 8) {
            shouldGrant = true;
          }
        }
        break;

      case 'night_owl':
        if (check.eventType === 'exercise_correct') {
          const hour = new Date().getHours();
          if (hour >= 20) {
            shouldGrant = true;
          }
        }
        break;
    }

    if (shouldGrant) {
      achievementsToGrant.push(rule.id);
    }
  }

  if (achievementsToGrant.length > 0) {
    const insertData = achievementsToGrant.map(ruleId => ({
      student_id: check.studentId,
      rule_id: ruleId,
      earned_at: new Date().toISOString(),
      is_seen_by_student: false,
    }));

    await supabase.from('student_achievements').insert(insertData);
  }

  return { granted: achievementsToGrant };
}

export async function getNewAchievements(studentId: string) {
  const supabase = await createClient();

  const { data: newAchievements } = await supabase
    .from('student_achievements')
    .select(`
      id,
      earned_at,
      achievement_rules (
        code,
        name_key,
        description_key,
        icon,
        category
      )
    `)
    .eq('student_id', studentId)
    .eq('is_seen_by_student', false);

  return newAchievements || [];
}

export async function markAchievementsSeen(studentId: string) {
  const supabase = await createClient();

  await supabase
    .from('student_achievements')
    .update({ is_seen_by_student: true })
    .eq('student_id', studentId)
    .eq('is_seen_by_student', false);
}

export async function getStudentAchievementsCount(studentId: string) {
  const supabase = await createClient();

  const { count: earned } = await supabase
    .from('student_achievements')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId);

  const { count: total } = await supabase
    .from('achievement_rules')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  return {
    earned: earned || 0,
    total: total || 0,
  };
}
