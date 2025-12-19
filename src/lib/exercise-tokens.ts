'use server';

import { createClient } from '@/lib/supabase/server';

const FREE_EXERCISES_PER_SKILL = 10;

interface ExerciseTokenStatus {
  freeExercisesUsed: number;
  freeExercisesRemaining: number;
  canGenerateFree: boolean;
  requiresPersonalTokens: boolean;
  hasPersonalApiKey: boolean;
}

export async function getExerciseTokenStatus(
  userId: string,
  skillId: string
): Promise<ExerciseTokenStatus> {
  const supabase = await createClient();

  // Compter les exercices générés par IA pour cette compétence par cet utilisateur
  const { count: generatedCount } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('skill_id', skillId)
    .eq('is_ai_generated', true)
    .eq('created_by', userId);

  const freeExercisesUsed = generatedCount || 0;
  const freeExercisesRemaining = Math.max(0, FREE_EXERCISES_PER_SKILL - freeExercisesUsed);
  const canGenerateFree = freeExercisesRemaining > 0;

  // Vérifier si l'utilisateur a une clé API personnelle
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('openai_api_key')
    .eq('user_id', userId)
    .single();

  const hasPersonalApiKey = !!(userSettings?.openai_api_key);

  return {
    freeExercisesUsed,
    freeExercisesRemaining,
    canGenerateFree,
    requiresPersonalTokens: !canGenerateFree,
    hasPersonalApiKey,
  };
}

export async function canGenerateExercise(
  userId: string,
  skillId: string
): Promise<{ allowed: boolean; reason?: string; requiresConfirmation?: boolean }> {
  const status = await getExerciseTokenStatus(userId, skillId);

  if (status.canGenerateFree) {
    return { allowed: true };
  }

  if (status.hasPersonalApiKey) {
    return { 
      allowed: true, 
      requiresConfirmation: true,
      reason: `Vous avez utilisé vos ${FREE_EXERCISES_PER_SKILL} exercices gratuits pour cette compétence. La génération utilisera votre clé API personnelle.`
    };
  }

  return { 
    allowed: false, 
    reason: `Vous avez utilisé vos ${FREE_EXERCISES_PER_SKILL} exercices gratuits pour cette compétence. Configurez votre clé API personnelle dans les paramètres pour continuer.`
  };
}

export async function recordExerciseGeneration(
  userId: string,
  skillId: string,
  exerciseId: string,
  usedPersonalKey: boolean
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('exercise_generation_logs').insert({
    user_id: userId,
    skill_id: skillId,
    exercise_id: exerciseId,
    used_personal_key: usedPersonalKey,
    created_at: new Date().toISOString(),
  });
}

export async function getSkillExerciseStats(skillId: string): Promise<{
  totalExercises: number;
  officialExercises: number;
  userGeneratedExercises: number;
}> {
  const supabase = await createClient();

  const { data: exercises } = await supabase
    .from('exercises')
    .select('is_ai_generated, created_by')
    .eq('skill_id', skillId);

  if (!exercises) {
    return { totalExercises: 0, officialExercises: 0, userGeneratedExercises: 0 };
  }

  const officialExercises = exercises.filter(e => !e.is_ai_generated || !e.created_by).length;
  const userGeneratedExercises = exercises.filter(e => e.is_ai_generated && e.created_by).length;

  return {
    totalExercises: exercises.length,
    officialExercises,
    userGeneratedExercises,
  };
}
