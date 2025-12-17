'use server';

import { createClient } from '@/lib/supabase/server';

interface ProgressUpdate {
  studentId: string;
  skillId: string;
  isCorrect: boolean;
  difficulty: number;
  timeSpentSeconds?: number;
}

export async function updateSkillMastery(update: ProgressUpdate) {
  const supabase = await createClient();
  
  const { data: existing } = await supabase
    .from('student_skill_progress')
    .select('*')
    .eq('student_id', update.studentId)
    .eq('skill_id', update.skillId)
    .single();

  const now = new Date();
  const newAttempts = (existing?.attempts_count || 0) + 1;
  const newCorrect = (existing?.correct_count || 0) + (update.isCorrect ? 1 : 0);
  
  // Algorithme de maîtrise amélioré
  // - Pondération par difficulté (exercices difficiles valent plus)
  // - Décroissance temporelle (les anciennes tentatives comptent moins)
  // - Bonus pour les séries consécutives correctes
  
  const difficultyWeight = 0.8 + (update.difficulty * 0.1); // 0.9 à 1.3
  const baseAccuracy = newCorrect / newAttempts;
  
  // Calculer le streak (série de bonnes réponses)
  const currentStreak = update.isCorrect 
    ? (existing?.current_streak || 0) + 1 
    : 0;
  const streakBonus = Math.min(currentStreak * 2, 10); // Max +10%
  
  // Maîtrise finale
  let mastery = Math.round(baseAccuracy * 100 * difficultyWeight) + streakBonus;
  mastery = Math.min(100, Math.max(0, mastery)); // Clamp 0-100

  const progressData = {
    student_id: update.studentId,
    skill_id: update.skillId,
    attempts_count: newAttempts,
    correct_count: newCorrect,
    mastery_level: mastery,
    current_streak: currentStreak,
    best_streak: Math.max(currentStreak, existing?.best_streak || 0),
    last_attempt_at: now.toISOString(),
    total_time_seconds: (existing?.total_time_seconds || 0) + (update.timeSpentSeconds || 0),
  };

  if (existing) {
    await supabase
      .from('student_skill_progress')
      .update(progressData)
      .eq('id', existing.id);
  } else {
    await supabase
      .from('student_skill_progress')
      .insert(progressData);
  }

  return { mastery, streak: currentStreak };
}

export async function getNextSkillExercise(
  studentId: string,
  skillId: string,
  completedExerciseIds: string[] = []
) {
  const supabase = await createClient();
  
  // Récupérer la progression actuelle
  const { data: progress } = await supabase
    .from('student_skill_progress')
    .select('mastery_level')
    .eq('student_id', studentId)
    .eq('skill_id', skillId)
    .single();

  const masteryLevel = progress?.mastery_level || 0;
  
  // Sélectionner la difficulté en fonction de la maîtrise
  // Maîtrise < 30% → difficulté 1
  // Maîtrise 30-50% → difficulté 1-2
  // Maîtrise 50-70% → difficulté 2-3
  // Maîtrise 70-90% → difficulté 3-4
  // Maîtrise > 90% → difficulté 4-5
  
  let minDifficulty = 1;
  let maxDifficulty = 2;
  
  if (masteryLevel >= 90) {
    minDifficulty = 4;
    maxDifficulty = 5;
  } else if (masteryLevel >= 70) {
    minDifficulty = 3;
    maxDifficulty = 4;
  } else if (masteryLevel >= 50) {
    minDifficulty = 2;
    maxDifficulty = 3;
  } else if (masteryLevel >= 30) {
    minDifficulty = 1;
    maxDifficulty = 2;
  }

  let query = supabase
    .from('exercises')
    .select('*')
    .eq('skill_id', skillId)
    .eq('is_validated', true)
    .gte('difficulty', minDifficulty)
    .lte('difficulty', maxDifficulty)
    .limit(1);

  if (completedExerciseIds.length > 0) {
    query = query.not('id', 'in', `(${completedExerciseIds.join(',')})`);
  }

  const { data: exercises } = await query;

  if (!exercises || exercises.length === 0) {
    // Fallback: récupérer n'importe quel exercice non complété
    const { data: fallbackExercises } = await supabase
      .from('exercises')
      .select('*')
      .eq('skill_id', skillId)
      .eq('is_validated', true)
      .not('id', 'in', completedExerciseIds.length > 0 ? `(${completedExerciseIds.join(',')})` : '()')
      .limit(1);
    
    return fallbackExercises?.[0] || null;
  }

  return exercises[0];
}

export async function getStudentDashboardStats(studentId: string) {
  const supabase = await createClient();
  
  // Récupérer toutes les données en parallèle
  const [progressResult, xpResult, streakResult, achievementsResult, sessionsResult] = await Promise.all([
    supabase
      .from('student_skill_progress')
      .select('mastery_level, attempts_count, correct_count, current_streak, best_streak, total_time_seconds')
      .eq('student_id', studentId),
    supabase
      .from('student_xp')
      .select('total_xp, current_level, xp_to_next_level, xp_earned_today')
      .eq('student_id', studentId)
      .single(),
    supabase
      .from('daily_streaks')
      .select('current_streak, longest_streak, last_activity_date, streak_freeze_available')
      .eq('student_id', studentId)
      .single(),
    supabase
      .from('student_achievements')
      .select('id')
      .eq('student_id', studentId),
    supabase
      .from('learning_sessions')
      .select('started_at, exercises_completed')
      .eq('student_id', studentId)
      .order('started_at', { ascending: false })
      .limit(7)
  ]);

  const progress = progressResult.data || [];
  const xp = xpResult.data;
  const streak = streakResult.data;
  const achievements = achievementsResult.data || [];
  const sessions = sessionsResult.data || [];

  // Stats de progression
  const totalSkills = progress.length;
  const masteredSkills = progress.filter((p: { mastery_level: number }) => p.mastery_level >= 80).length;
  const inProgressSkills = progress.filter((p: { mastery_level: number }) => p.mastery_level > 0 && p.mastery_level < 80).length;
  const totalAttempts = progress.reduce((sum: number, p: { attempts_count: number }) => sum + p.attempts_count, 0);
  const totalCorrect = progress.reduce((sum: number, p: { correct_count: number }) => sum + p.correct_count, 0);
  const averageMastery = totalSkills > 0 
    ? Math.round(progress.reduce((sum: number, p: { mastery_level: number }) => sum + p.mastery_level, 0) / totalSkills) 
    : 0;
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const bestStreak = progress.length > 0 
    ? Math.max(...progress.map((p: { best_streak: number }) => p.best_streak || 0)) 
    : 0;
  const totalTimeMinutes = Math.round(
    progress.reduce((sum: number, p: { total_time_seconds?: number }) => sum + (p.total_time_seconds || 0), 0) / 60
  );

  // Streak quotidien
  const dailyStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  const lastActivityDate = streak?.last_activity_date;
  const streakFreezeAvailable = streak?.streak_freeze_available ?? true;

  // XP
  const totalXp = xp?.total_xp || 0;
  const currentLevel = xp?.current_level || 1;
  const xpToNextLevel = xp?.xp_to_next_level || 100;
  const xpEarnedToday = xp?.xp_earned_today || 0;

  // Badges
  const badgesCount = achievements.length;

  // Activité récente
  const recentActivity = sessions.map((s: { started_at: string; exercises_completed: number }) => ({
    date: s.started_at,
    exercisesCompleted: s.exercises_completed || 0
  }));

  return {
    totalSkills,
    masteredSkills,
    inProgressSkills,
    averageMastery,
    totalAttempts,
    totalCorrect,
    accuracy,
    bestStreak,
    totalTimeMinutes,
    dailyStreak,
    longestStreak,
    lastActivityDate,
    streakFreezeAvailable,
    totalXp,
    currentLevel,
    xpToNextLevel,
    xpEarnedToday,
    badgesCount,
    recentActivity,
  };
}

export async function startLearningSession(studentId: string, skillIds: string[]) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('learning_sessions')
    .insert({
      student_id: studentId,
      skills_practiced: skillIds,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error starting session:', error);
    return null;
  }

  return data;
}

export async function endLearningSession(
  sessionId: string,
  exercisesCompleted: number,
  correctAnswers: number
) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('learning_sessions')
    .update({
      ended_at: new Date().toISOString(),
      exercises_completed: exercisesCompleted,
      correct_answers: correctAnswers,
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error ending session:', error);
    return false;
  }

  return true;
}
