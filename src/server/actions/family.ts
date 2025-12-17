'use server';

import { createClient } from '@/lib/supabase/server';

export interface FamilyChallenge {
  id: string;
  studentId: string;
  challengeType: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  status: 'active' | 'completed' | 'expired';
  startsAt: string;
  endsAt: string | null;
}

export async function createFamilyChallenge(
  parentUserId: string,
  studentId: string,
  challengeType: string,
  title: string,
  description: string,
  targetValue: number,
  durationDays: number = 7
) {
  const supabase = await createClient();
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + durationDays);

  const { data, error } = await supabase
    .from('family_challenges')
    .insert({
      parent_user_id: parentUserId,
      student_id: studentId,
      challenge_type: challengeType,
      title,
      description,
      target_value: targetValue,
      current_value: 0,
      status: 'active',
      ends_at: endsAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, challenge: data };
}

export async function getFamilyChallenges(studentId: string): Promise<FamilyChallenge[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('family_challenges')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  return (data || []).map(c => ({
    id: c.id,
    studentId: c.student_id,
    challengeType: c.challenge_type,
    title: c.title,
    description: c.description,
    targetValue: c.target_value,
    currentValue: c.current_value,
    status: c.status,
    startsAt: c.starts_at,
    endsAt: c.ends_at,
  }));
}

export async function updateChallengeProgress(challengeId: string, increment: number = 1) {
  const supabase = await createClient();

  const { data: challenge } = await supabase
    .from('family_challenges')
    .select('*')
    .eq('id', challengeId)
    .single();

  if (!challenge || challenge.status !== 'active') {
    return { success: false };
  }

  const newValue = challenge.current_value + increment;
  const isCompleted = newValue >= challenge.target_value;

  await supabase
    .from('family_challenges')
    .update({
      current_value: newValue,
      status: isCompleted ? 'completed' : 'active',
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq('id', challengeId);

  return { success: true, completed: isCompleted, newValue };
}

export async function getActiveChallengesForStudent(studentId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('family_challenges')
    .select('*')
    .eq('student_id', studentId)
    .eq('status', 'active');

  return data || [];
}

// Predefined challenge templates - exported as async function for "use server" compatibility
export async function getChallengeTemplates() {
  return [
  {
    type: 'weekly_exercises',
    title: 'Champion de la semaine',
    description: 'Complète {target} exercices cette semaine',
    defaultTarget: 20,
    icon: '🏆',
  },
  {
    type: 'streak_goal',
    title: 'Série gagnante',
    description: 'Maintiens une série de {target} jours',
    defaultTarget: 7,
    icon: '🔥',
  },
  {
    type: 'skill_mastery',
    title: 'Maître des compétences',
    description: 'Maîtrise {target} nouvelles compétences',
    defaultTarget: 3,
    icon: '⭐',
  },
  {
    type: 'accuracy_goal',
    title: 'Précision parfaite',
    description: 'Obtiens {target}% de bonnes réponses sur 10 exercices',
    defaultTarget: 80,
    icon: '🎯',
  },
  {
    type: 'time_goal',
    title: 'Temps d\'apprentissage',
    description: 'Apprends pendant {target} minutes cette semaine',
    defaultTarget: 60,
    icon: '⏱️',
  },
  ];
}
