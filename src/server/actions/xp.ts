'use server';

import { createClient } from '@/lib/supabase/server';

const XP_PER_LEVEL = [
  100, 150, 200, 300, 400, 500, 650, 800, 1000, 1200,
  1500, 1800, 2200, 2600, 3000, 3500, 4000, 4500, 5000, 6000
];

function getXpForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level > XP_PER_LEVEL.length) return XP_PER_LEVEL[XP_PER_LEVEL.length - 1];
  return XP_PER_LEVEL[level - 1];
}

export async function addXp(studentId: string, amount: number, source: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('student_xp')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (!existing) {
    const xpToNext = getXpForLevel(1);
    await supabase.from('student_xp').insert({
      student_id: studentId,
      total_xp: amount,
      current_level: 1,
      xp_to_next_level: xpToNext,
      xp_earned_today: amount,
      last_xp_date: today,
    });
    return { 
      totalXp: amount, 
      level: 1, 
      levelUp: false, 
      xpToNextLevel: xpToNext - amount 
    };
  }

  const newTotalXp = existing.total_xp + amount;
  const xpEarnedToday = existing.last_xp_date === today 
    ? existing.xp_earned_today + amount 
    : amount;

  // Calculer le nouveau niveau
  let currentLevel = existing.current_level;
  let xpForCurrentLevel = 0;
  
  // Calculer XP cumulé pour atteindre le niveau actuel
  for (let i = 1; i < currentLevel; i++) {
    xpForCurrentLevel += getXpForLevel(i);
  }

  // Vérifier si level up
  let levelUp = false;
  while (newTotalXp >= xpForCurrentLevel + getXpForLevel(currentLevel)) {
    xpForCurrentLevel += getXpForLevel(currentLevel);
    currentLevel++;
    levelUp = true;
  }

  const xpToNextLevel = xpForCurrentLevel + getXpForLevel(currentLevel) - newTotalXp;

  await supabase
    .from('student_xp')
    .update({
      total_xp: newTotalXp,
      current_level: currentLevel,
      xp_to_next_level: xpToNextLevel,
      xp_earned_today: xpEarnedToday,
      last_xp_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq('student_id', studentId);

  // Log XP gain (optional table)
  try {
    await supabase.from('xp_history').insert({
      student_id: studentId,
      amount,
      source,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Table may not exist yet
  }

  return { 
    totalXp: newTotalXp, 
    level: currentLevel, 
    levelUp, 
    xpToNextLevel,
    previousLevel: existing.current_level
  };
}

export async function getXpStatus(studentId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('student_xp')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (!data) {
    return {
      totalXp: 0,
      currentLevel: 1,
      xpToNextLevel: 100,
      xpEarnedToday: 0,
      progressPercent: 0,
    };
  }

  const xpForLevel = getXpForLevel(data.current_level);
  const xpInCurrentLevel = xpForLevel - data.xp_to_next_level;
  const progressPercent = Math.round((xpInCurrentLevel / xpForLevel) * 100);

  return {
    totalXp: data.total_xp,
    currentLevel: data.current_level,
    xpToNextLevel: data.xp_to_next_level,
    xpEarnedToday: data.xp_earned_today,
    progressPercent,
  };
}

export async function getLeaderboard(limit: number = 10) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('student_xp')
    .select(`
      student_id,
      total_xp,
      current_level,
      student_profiles!inner(display_name, avatar_url)
    `)
    .order('total_xp', { ascending: false })
    .limit(limit);

  return data?.map((entry, index) => {
    const profile = entry.student_profiles as unknown as { display_name: string; avatar_url: string | null };
    return {
      rank: index + 1,
      studentId: entry.student_id,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      totalXp: entry.total_xp,
      level: entry.current_level,
    };
  }) || [];
}
