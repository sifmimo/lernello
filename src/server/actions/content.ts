'use server';

import { createClient } from '@/lib/supabase/server';
import { getOrCreateExercise, evaluateAndGetNextExercise } from '@/lib/ai/content-generator';

export async function fetchOrGenerateExercise(
  skillId: string,
  studentId: string
): Promise<{
  success: boolean;
  exercise?: {
    id: string;
    type: string;
    content: Record<string, unknown>;
    difficulty: number;
  };
  isAIGenerated?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    
    // Récupérer les préférences de l'élève
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('preferred_language, pedagogical_method')
      .eq('id', studentId)
      .single();

    const result = await getOrCreateExercise(
      skillId,
      studentId,
      profile?.preferred_language || 'fr',
      profile?.pedagogical_method || 'standard'
    );

    if (!result) {
      return { success: false, error: 'Impossible de récupérer ou générer un exercice' };
    }

    return {
      success: true,
      exercise: {
        id: result.exercise.id,
        type: result.exercise.type,
        content: result.exercise.content as Record<string, unknown>,
        difficulty: result.exercise.difficulty,
      },
      isAIGenerated: result.isNew,
    };
  } catch (error) {
    console.error('Error in fetchOrGenerateExercise:', error);
    return { success: false, error: 'Erreur lors de la récupération de l\'exercice' };
  }
}

export async function submitAnswerAndGetNext(
  studentId: string,
  exerciseId: string,
  skillId: string,
  isCorrect: boolean,
  timeSpentSeconds: number,
  hintsUsed: number,
  answer: Record<string, unknown>
): Promise<{
  success: boolean;
  nextExercise?: {
    id: string;
    type: string;
    content: Record<string, unknown>;
    difficulty: number;
  };
  nextSkillId?: string;
  reason?: string;
  sessionComplete?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Enregistrer la tentative
    await supabase.from('exercise_attempts').insert({
      student_id: studentId,
      exercise_id: exerciseId,
      is_correct: isCorrect,
      time_spent_seconds: timeSpentSeconds,
      hints_used: hintsUsed,
      answer,
    });

    // Évaluer et obtenir le prochain exercice
    const result = await evaluateAndGetNextExercise(
      studentId,
      skillId,
      isCorrect,
      timeSpentSeconds,
      hintsUsed
    );

    if (!result) {
      return { success: true, sessionComplete: true, reason: 'Session terminée' };
    }

    return {
      success: true,
      nextExercise: {
        id: result.nextExercise.id,
        type: result.nextExercise.type,
        content: result.nextExercise.content as Record<string, unknown>,
        difficulty: result.nextExercise.difficulty,
      },
      nextSkillId: result.nextSkillId,
      reason: result.reason,
    };
  } catch (error) {
    console.error('Error in submitAnswerAndGetNext:', error);
    return { success: false, error: 'Erreur lors de la soumission' };
  }
}

export async function rateExercise(
  exerciseId: string,
  studentId: string,
  rating: number,
  feedback: string | null,
  ratedBy: 'student' | 'parent'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Non authentifié' };
    }

    const { error } = await supabase.from('exercise_ratings').upsert({
      exercise_id: exerciseId,
      user_id: user.id,
      student_id: studentId,
      rating,
      feedback,
      rated_by: ratedBy,
    }, {
      onConflict: 'exercise_id,student_id',
    });

    if (error) {
      console.error('Error rating exercise:', error);
      return { success: false, error: 'Erreur lors de la notation' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in rateExercise:', error);
    return { success: false, error: 'Erreur lors de la notation' };
  }
}

export async function getStudentProgress(studentId: string): Promise<{
  success: boolean;
  progress?: {
    skillId: string;
    skillName: string;
    currentLevel: number;
    exercisesCompleted: number;
    correctRate: number;
    recommendedDifficulty: number;
  }[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('student_level_tracking')
      .select(`
        skill_id,
        current_level,
        exercises_completed,
        correct_answers,
        recommended_difficulty,
        skills (
          name_key
        )
      `)
      .eq('student_id', studentId);

    if (error) {
      return { success: false, error: 'Erreur lors de la récupération' };
    }

    const progress = data?.map(item => {
      const skills = item.skills as unknown as { name_key: string } | null;
      return {
        skillId: item.skill_id,
        skillName: skills?.name_key || '',
        currentLevel: item.current_level,
        exercisesCompleted: item.exercises_completed,
        correctRate: item.exercises_completed > 0 
          ? Math.round((item.correct_answers / item.exercises_completed) * 100) 
          : 0,
        recommendedDifficulty: item.recommended_difficulty,
      };
    }) || [];

    return { success: true, progress };
  } catch (error) {
    console.error('Error in getStudentProgress:', error);
    return { success: false, error: 'Erreur lors de la récupération' };
  }
}
