'use server';

import { createClient } from '@/lib/supabase/server';

export type MilestoneType = 'domain_complete' | 'level_up' | 'skill_chain' | 'streak_master' | 'time_champion';

interface Milestone {
  id: string;
  name: string;
  description: string;
  type: MilestoneType;
  target_value: number;
  icon: string;
  reward_xp: number;
}

interface StudentMilestoneProgress {
  milestone_id: string;
  current_value: number;
  is_completed: boolean;
  completed_at: string | null;
  milestone?: Milestone;
}

export async function getMilestones(): Promise<Milestone[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('learning_milestones')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('Error fetching milestones:', error);
    return [];
  }

  return data || [];
}

export async function getStudentMilestoneProgress(
  studentId: string
): Promise<StudentMilestoneProgress[]> {
  const supabase = await createClient();
  
  const { data: milestones } = await supabase
    .from('learning_milestones')
    .select('*')
    .eq('is_active', true);

  const { data: progress } = await supabase
    .from('student_milestone_progress')
    .select('*')
    .eq('student_id', studentId);

  const progressMap = new Map(
    (progress || []).map(p => [p.milestone_id, p])
  );

  return (milestones || []).map(milestone => {
    const studentProgress = progressMap.get(milestone.id);
    return {
      milestone_id: milestone.id,
      current_value: studentProgress?.current_value || 0,
      is_completed: studentProgress?.is_completed || false,
      completed_at: studentProgress?.completed_at || null,
      milestone: {
        id: milestone.id,
        name: milestone.name,
        description: milestone.description,
        type: milestone.type,
        target_value: milestone.target_value,
        icon: milestone.icon,
        reward_xp: milestone.reward_xp,
      },
    };
  });
}

export async function updateMilestoneProgress(
  studentId: string,
  milestoneType: MilestoneType,
  incrementValue: number = 1
): Promise<{ completed: Milestone[] }> {
  const supabase = await createClient();
  const completedMilestones: Milestone[] = [];

  const { data: milestones } = await supabase
    .from('learning_milestones')
    .select('*')
    .eq('type', milestoneType)
    .eq('is_active', true);

  if (!milestones) return { completed: [] };

  for (const milestone of milestones) {
    const { data: existing } = await supabase
      .from('student_milestone_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('milestone_id', milestone.id)
      .single();

    if (existing?.is_completed) continue;

    const newValue = (existing?.current_value || 0) + incrementValue;
    const isCompleted = newValue >= milestone.target_value;

    await supabase
      .from('student_milestone_progress')
      .upsert({
        student_id: studentId,
        milestone_id: milestone.id,
        current_value: newValue,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id,milestone_id' });

    if (isCompleted) {
      completedMilestones.push(milestone);
    }
  }

  return { completed: completedMilestones };
}

export async function checkDomainCompletion(
  studentId: string,
  domainId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data: skills } = await supabase
    .from('skills')
    .select('id')
    .eq('domain_id', domainId)
    .eq('is_active', true);

  if (!skills || skills.length === 0) return false;

  const { data: progress } = await supabase
    .from('student_skill_progress')
    .select('skill_id, mastery_level')
    .eq('student_id', studentId)
    .in('skill_id', skills.map(s => s.id));

  const masteredCount = (progress || []).filter(p => p.mastery_level >= 80).length;
  return masteredCount === skills.length;
}

export async function calculateStudentLevel(studentId: string): Promise<number> {
  const supabase = await createClient();

  const { data: progress } = await supabase
    .from('student_skill_progress')
    .select('mastery_level')
    .eq('student_id', studentId);

  if (!progress || progress.length === 0) return 1;

  const totalMastery = progress.reduce((sum, p) => sum + p.mastery_level, 0);
  const avgMastery = totalMastery / progress.length;
  const skillCount = progress.length;

  const xp = (avgMastery * skillCount) / 10;
  return Math.floor(xp / 100) + 1;
}
