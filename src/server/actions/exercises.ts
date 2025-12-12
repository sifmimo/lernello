'use server';

import { createClient } from '@/lib/supabase/server';

export interface Exercise {
  id: string;
  skill_id: string;
  type: 'qcm' | 'fill_blank' | 'drag_drop' | 'free_input' | 'interactive';
  difficulty: number;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  is_ai_generated: boolean;
  is_validated: boolean;
}

export interface ExerciseAttempt {
  id: string;
  student_id: string;
  exercise_id: string;
  is_correct: boolean;
  answer: Record<string, unknown>;
  time_spent_seconds: number | null;
  created_at: string;
}

export async function getExercisesBySkill(
  skillId: string,
  limit: number = 5
): Promise<Exercise[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('skill_id', skillId)
    .eq('is_validated', true)
    .order('difficulty', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }

  return data || [];
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching exercise:', error);
    return null;
  }

  return data;
}

export async function submitExerciseAttempt(
  studentId: string,
  exerciseId: string,
  answer: Record<string, unknown>,
  isCorrect: boolean,
  timeSpentSeconds?: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { error: attemptError } = await supabase
    .from('exercise_attempts')
    .insert({
      student_id: studentId,
      exercise_id: exerciseId,
      answer,
      is_correct: isCorrect,
      time_spent_seconds: timeSpentSeconds,
    });

  if (attemptError) {
    console.error('Error saving attempt:', attemptError);
    return { success: false, error: attemptError.message };
  }

  // Mettre à jour la progression
  const { data: exercise } = await supabase
    .from('exercises')
    .select('skill_id')
    .eq('id', exerciseId)
    .single();

  if (exercise) {
    await updateSkillProgress(studentId, exercise.skill_id, isCorrect);
  }

  return { success: true };
}

async function updateSkillProgress(
  studentId: string,
  skillId: string,
  isCorrect: boolean
) {
  const supabase = await createClient();
  
  const { data: existing } = await supabase
    .from('student_skill_progress')
    .select('*')
    .eq('student_id', studentId)
    .eq('skill_id', skillId)
    .single();

  const newAttempts = (existing?.attempts_count || 0) + 1;
  const newCorrect = (existing?.correct_count || 0) + (isCorrect ? 1 : 0);
  const newMastery = Math.round((newCorrect / newAttempts) * 100);

  if (existing) {
    await supabase
      .from('student_skill_progress')
      .update({
        attempts_count: newAttempts,
        correct_count: newCorrect,
        mastery_level: newMastery,
        last_attempt_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('student_skill_progress').insert({
      student_id: studentId,
      skill_id: skillId,
      attempts_count: 1,
      correct_count: isCorrect ? 1 : 0,
      mastery_level: isCorrect ? 100 : 0,
      last_attempt_at: new Date().toISOString(),
    });
  }
}

export async function getNextExercise(
  skillId: string,
  studentId: string,
  excludeIds: string[] = []
): Promise<Exercise | null> {
  const supabase = await createClient();
  
  let query = supabase
    .from('exercises')
    .select('*')
    .eq('skill_id', skillId)
    .eq('is_validated', true)
    .order('difficulty', { ascending: true })
    .limit(1);

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0];
}
