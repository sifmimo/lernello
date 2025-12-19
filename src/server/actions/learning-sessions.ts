'use server';

import { createClient } from '@/lib/supabase/server';
import {
  LearningSession,
  SessionType,
  SkillTheoryContent,
  SessionExercise,
  CreateSessionParams,
  SessionRecap,
} from '@/types/learning-session';
import { generateTheoryContent } from './theory-generator';

const EXERCISES_PER_MINUTE = 1.5;

export async function createLearningSession(
  params: CreateSessionParams
): Promise<{ session: LearningSession | null; error?: string }> {
  const supabase = await createClient();
  const { studentId, skillId, sessionType, targetMinutes = 5, generateNew = false } = params;

  try {
    const targetExercises = Math.round(targetMinutes * EXERCISES_PER_MINUTE);
    
    // Si generateNew est true, générer de nouveaux exercices au lieu d'utiliser le pool existant
    let exercises: SessionExercise[];
    if (generateNew) {
      exercises = await generateExercisesForSkill(skillId, targetExercises);
      // Si pas assez d'exercices générés, compléter avec le pool existant
      if (exercises.length < targetExercises) {
        const additionalExercises = await selectExercisesForSession(studentId, skillId, targetExercises - exercises.length);
        exercises = [...exercises, ...additionalExercises];
      }
    } else {
      exercises = await selectExercisesForSession(studentId, skillId, targetExercises);
    }

    if (exercises.length === 0) {
      return { session: null, error: 'Aucun exercice disponible pour cette compétence' };
    }

    const hasTheory = sessionType === 'learn';
    const totalSteps = (hasTheory ? 1 : 0) + exercises.length + 1;

    const { data, error } = await supabase
      .from('learning_sessions')
      .insert({
        student_id: studentId,
        skill_id: skillId,
        session_type: sessionType,
        target_duration_minutes: targetMinutes,
        target_exercises: targetExercises,
        total_steps: totalSteps,
        exercises_order: exercises.map(e => e.id),
        theory_shown: !hasTheory,
      })
      .select()
      .single();

    if (error) {
      console.error('[createLearningSession] Error:', error);
      return { session: null, error: 'Erreur lors de la création de la session' };
    }

    return { session: data as LearningSession };
  } catch (e) {
    console.error('[createLearningSession] Exception:', e);
    return { session: null, error: 'Erreur inattendue' };
  }
}

export async function selectExercisesForSession(
  studentId: string,
  skillId: string,
  count: number
): Promise<SessionExercise[]> {
  const supabase = await createClient();

  const { data: pool } = await supabase
    .from('exercises')
    .select('id, type, content, difficulty, is_ai_generated, quality_score')
    .eq('skill_id', skillId)
    .or('pool_status.eq.active,pool_status.is.null')
    .neq('type', 'free_input')  // Éviter les questions vagues
    .order('quality_score', { ascending: false, nullsFirst: false });

  if (!pool || pool.length === 0) {
    console.log('[selectExercises] No exercises in pool, attempting generation...');
    const generated = await generateExercisesForSkill(skillId, count);
    return generated;
  }

  let { data: rotation } = await supabase
    .from('student_exercise_rotation')
    .select('*')
    .eq('student_id', studentId)
    .eq('skill_id', skillId)
    .single();

  if (!rotation) {
    const { data: newRotation } = await supabase
      .from('student_exercise_rotation')
      .insert({
        student_id: studentId,
        skill_id: skillId,
        current_rotation: 1,
        exercises_seen_this_rotation: [],
      })
      .select()
      .single();
    rotation = newRotation;
  }

  const seenIds = new Set<string>(rotation?.exercises_seen_this_rotation || []);
  let unseen = pool.filter(e => !seenIds.has(e.id));

  if (unseen.length === 0) {
    await supabase
      .from('student_exercise_rotation')
      .update({
        current_rotation: (rotation?.current_rotation || 1) + 1,
        exercises_seen_this_rotation: [],
      })
      .eq('id', rotation?.id);
    unseen = pool;
  }

  const selected: SessionExercise[] = [];
  let lastType: string | null = rotation?.last_exercise_type || null;

  while (selected.length < count && unseen.length > 0) {
    let candidates = unseen.filter(e => e.type !== lastType);
    if (candidates.length === 0) candidates = unseen;

    const next = candidates[0];
    selected.push({
      id: next.id,
      type: next.type,
      content: next.content as SessionExercise['content'],
      difficulty: next.difficulty,
      is_ai_generated: next.is_ai_generated ?? false,
      quality_score: next.quality_score ?? 50,
    });
    unseen = unseen.filter(e => e.id !== next.id);
    lastType = next.type;
  }

  if (selected.length < count && pool.length > selected.length) {
    const remaining = pool
      .filter(e => !selected.find(s => s.id === e.id))
      .slice(0, count - selected.length);
    selected.push(...remaining.map(e => ({
      id: e.id,
      type: e.type,
      content: e.content as SessionExercise['content'],
      difficulty: e.difficulty,
      is_ai_generated: e.is_ai_generated ?? false,
      quality_score: e.quality_score ?? 50,
    })));
  }

  return selected;
}

async function generateExercisesForSkill(skillId: string, count: number): Promise<SessionExercise[]> {
  const supabase = await createClient();
  
  const { data: skill } = await supabase
    .from('skills')
    .select('id, name_key, description_key, difficulty_level')
    .eq('id', skillId)
    .single();

  if (!skill) return [];

  const { generateExerciseWithAI } = await import('@/lib/ai/content-generator');
  const generated: SessionExercise[] = [];

  for (let i = 0; i < Math.min(count, 5); i++) {
    try {
      // Ne pas forcer le type - laisser le générateur utiliser les types configurés pour la compétence
      const exercise = await generateExerciseWithAI({
        skillId: skill.id,
        skillName: skill.name_key,
        skillDescription: skill.description_key || '',
        difficulty: skill.difficulty_level || 1,
        language: 'fr',
        pedagogicalMethod: 'standard',
        targetAge: 9,
      });

      if (exercise) {
        const { data: saved, error: insertError } = await supabase
          .from('exercises')
          .insert({
            skill_id: skillId,
            type: exercise.type,
            content: exercise.content,
            difficulty: exercise.difficulty,
            is_ai_generated: true,
            is_validated: true,
            pool_status: 'active',
            quality_score: 50,
          })
          .select('id, type, content, difficulty')
          .single();

        if (insertError) {
          console.error('[generateExercisesForSkill] Insert error:', insertError);
        }

        if (saved) {
          console.log('[generateExercisesForSkill] Saved exercise:', saved.id, saved.type);
          generated.push({
            id: saved.id,
            type: saved.type,
            content: saved.content as SessionExercise['content'],
            difficulty: saved.difficulty,
          });
        }
      }
    } catch (e) {
      console.error('[generateExercisesForSkill] Error:', e);
    }
  }

  return generated;
}

export async function getSessionTheory(skillId: string): Promise<SkillTheoryContent | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('skill_theory_content')
    .select('*')
    .eq('skill_id', skillId)
    .eq('language', 'fr')
    .single();

  if (data) {
    return data as SkillTheoryContent;
  }

  const generated = await generateTheoryContent(skillId);
  return generated;
}

export async function getSessionExercise(
  sessionId: string,
  exerciseIndex: number
): Promise<SessionExercise | null> {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from('learning_sessions')
    .select('exercises_order')
    .eq('id', sessionId)
    .single();

  if (!session || !session.exercises_order[exerciseIndex]) {
    return null;
  }

  const exerciseId = session.exercises_order[exerciseIndex];

  const { data: exercise } = await supabase
    .from('exercises')
    .select('id, type, content, difficulty')
    .eq('id', exerciseId)
    .single();

  if (!exercise) return null;

  return {
    id: exercise.id,
    type: exercise.type,
    content: exercise.content as SessionExercise['content'],
    difficulty: exercise.difficulty,
  };
}

export async function submitSessionAnswer(
  sessionId: string,
  exerciseId: string,
  isCorrect: boolean,
  timeSpentSeconds: number
): Promise<{ success: boolean; newStep: number; sessionComplete: boolean }> {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from('learning_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return { success: false, newStep: 0, sessionComplete: false };
  }

  const newExercisesCompleted = session.exercises_completed + 1;
  const newExercisesCorrect = session.exercises_correct + (isCorrect ? 1 : 0);
  const newStep = session.current_step + 1;
  
  // La session est complète quand tous les exercices sont faits
  const exerciseCount = session.exercises_order?.length || 0;
  const sessionComplete = newExercisesCompleted >= exerciseCount;

  const xpGained = isCorrect ? 10 : 2;
  const newXp = session.xp_earned + xpGained;

  await supabase
    .from('learning_sessions')
    .update({
      current_step: newStep,
      exercises_completed: newExercisesCompleted,
      exercises_correct: newExercisesCorrect,
      xp_earned: newXp,
      status: sessionComplete ? 'completed' : 'in_progress',
      completed_at: sessionComplete ? new Date().toISOString() : null,
    })
    .eq('id', sessionId);

  await supabase.from('exercise_attempts').insert({
    student_id: session.student_id,
    exercise_id: exerciseId,
    is_correct: isCorrect,
    time_spent_seconds: timeSpentSeconds,
  });

  await supabase.rpc('update_exercise_rotation', {
    p_student_id: session.student_id,
    p_skill_id: session.skill_id,
    p_exercise_id: exerciseId,
    p_exercise_type: 'unknown',
  });

  await supabase.rpc('update_exercise_stats', {
    p_exercise_id: exerciseId,
    p_was_correct: isCorrect,
    p_time_seconds: timeSpentSeconds,
  });

  return { success: true, newStep, sessionComplete };
}

export async function completeSession(sessionId: string): Promise<SessionRecap | null> {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from('learning_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session) return null;

  const timeSpent = session.completed_at
    ? Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 1000)
    : 0;

  const accuracy = session.exercises_completed > 0
    ? Math.round((session.exercises_correct / session.exercises_completed) * 100)
    : 0;

  await supabase
    .from('learning_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', sessionId);

  const { addXp } = await import('./xp');
  await addXp(session.student_id, session.xp_earned, 'session_complete');

  return {
    exercises_completed: session.exercises_completed,
    exercises_correct: session.exercises_correct,
    accuracy,
    xp_earned: session.xp_earned,
    time_spent_seconds: timeSpent,
    streak_bonus: session.exercises_correct >= 3,
    level_up: false,
    canContinue: true,
    skillId: session.skill_id,
  };
}

export async function abandonSession(sessionId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('learning_sessions')
    .update({ status: 'abandoned', completed_at: new Date().toISOString() })
    .eq('id', sessionId);

  return !error;
}

export async function getActiveSession(studentId: string, skillId: string): Promise<LearningSession | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('learning_sessions')
    .select('*')
    .eq('student_id', studentId)
    .eq('skill_id', skillId)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data as LearningSession | null;
}

export async function rateExercise(
  exerciseId: string,
  rating: 'good' | 'bad'
): Promise<boolean> {
  const supabase = await createClient();

  const adjustment = rating === 'good' ? 5 : -10;

  const { data: exercise } = await supabase
    .from('exercises')
    .select('quality_score')
    .eq('id', exerciseId)
    .single();

  if (!exercise) return false;

  const newScore = Math.max(0, Math.min(100, (exercise.quality_score || 50) + adjustment));

  const { error } = await supabase
    .from('exercises')
    .update({ quality_score: newScore })
    .eq('id', exerciseId);

  if (rating === 'bad' && newScore < 20) {
    await supabase
      .from('exercises')
      .update({ pool_status: 'flagged' })
      .eq('id', exerciseId);
  }

  return !error;
}
