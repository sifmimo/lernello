'use server';

import { createClient } from '@/lib/supabase/server';

export async function updateDailyStreak(studentId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('daily_streaks')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (!existing) {
    // Créer une nouvelle entrée
    await supabase.from('daily_streaks').insert({
      student_id: studentId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
      streak_freeze_available: true,
    });
    return { streak: 1, isNewStreak: true, streakFreezeUsed: false };
  }

  const lastActivity = existing.last_activity_date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Déjà actif aujourd'hui
  if (lastActivity === today) {
    return { 
      streak: existing.current_streak, 
      isNewStreak: false, 
      streakFreezeUsed: false 
    };
  }

  let newStreak = existing.current_streak;
  let streakFreezeUsed = false;

  if (lastActivity === yesterdayStr) {
    // Continuation du streak
    newStreak = existing.current_streak + 1;
  } else if (existing.streak_freeze_available && !existing.streak_freeze_used_at) {
    // Utiliser le gel de streak si disponible
    const dayBeforeYesterday = new Date();
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    const dayBeforeYesterdayStr = dayBeforeYesterday.toISOString().split('T')[0];

    if (lastActivity === dayBeforeYesterdayStr) {
      // Le streak peut être sauvé avec le gel
      newStreak = existing.current_streak + 1;
      streakFreezeUsed = true;
    } else {
      // Trop de jours manqués, reset
      newStreak = 1;
    }
  } else {
    // Reset du streak
    newStreak = 1;
  }

  const longestStreak = Math.max(newStreak, existing.longest_streak);

  await supabase
    .from('daily_streaks')
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
      streak_freeze_available: streakFreezeUsed ? false : existing.streak_freeze_available,
      streak_freeze_used_at: streakFreezeUsed ? today : existing.streak_freeze_used_at,
      updated_at: new Date().toISOString(),
    })
    .eq('student_id', studentId);

  return { 
    streak: newStreak, 
    isNewStreak: newStreak > existing.current_streak,
    streakFreezeUsed,
    longestStreak
  };
}

export async function getStreakStatus(studentId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('daily_streaks')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (!data) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isActiveToday: false,
      streakFreezeAvailable: true,
      daysUntilStreakLoss: null,
    };
  }

  const isActiveToday = data.last_activity_date === today;
  
  // Calculer les jours avant perte de streak
  let daysUntilStreakLoss = null;
  if (!isActiveToday && data.current_streak > 0) {
    const lastActivity = new Date(data.last_activity_date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    
    if (data.streak_freeze_available) {
      daysUntilStreakLoss = 2 - diffDays; // Avec gel: 2 jours de marge
    } else {
      daysUntilStreakLoss = 1 - diffDays; // Sans gel: 1 jour de marge
    }
  }

  return {
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    isActiveToday,
    streakFreezeAvailable: data.streak_freeze_available,
    daysUntilStreakLoss: Math.max(0, daysUntilStreakLoss || 0),
  };
}

export async function useStreakFreeze(studentId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('daily_streaks')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (!existing || !existing.streak_freeze_available) {
    return { success: false, message: 'Pas de gel de streak disponible' };
  }

  await supabase
    .from('daily_streaks')
    .update({
      streak_freeze_available: false,
      streak_freeze_used_at: today,
      updated_at: new Date().toISOString(),
    })
    .eq('student_id', studentId);

  return { success: true, message: 'Gel de streak utilisé !' };
}

export async function earnStreakFreeze(studentId: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('daily_streaks')
    .select('streak_freeze_available')
    .eq('student_id', studentId)
    .single();

  if (existing?.streak_freeze_available) {
    return { success: false, message: 'Vous avez déjà un gel de streak' };
  }

  await supabase
    .from('daily_streaks')
    .update({
      streak_freeze_available: true,
      streak_freeze_used_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('student_id', studentId);

  return { success: true, message: 'Nouveau gel de streak gagné !' };
}
