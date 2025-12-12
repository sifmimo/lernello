'use server';

import { createClient } from '@/lib/supabase/server';

export type NotificationType = 'milestone' | 'struggle' | 'weekly_summary' | 'achievement' | 'streak';

interface Notification {
  id: string;
  user_id: string;
  student_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export async function getParentNotifications(
  userId: string,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('parent_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data || [];
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();
  
  const { count, error } = await supabase
    .from('parent_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error counting notifications:', error);
    return 0;
  }

  return count || 0;
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('parent_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return { success: false };
  }

  return { success: true };
}

export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('parent_notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false };
  }

  return { success: true };
}

export async function createNotification(
  userId: string,
  studentId: string,
  type: NotificationType,
  title: string,
  message: string,
  data: Record<string, unknown> = {}
): Promise<{ success: boolean; id?: string }> {
  const supabase = await createClient();
  
  const { data: notification, error } = await supabase
    .from('parent_notifications')
    .insert({
      user_id: userId,
      student_id: studentId,
      type,
      title,
      message,
      data,
      is_read: false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return { success: false };
  }

  return { success: true, id: notification?.id };
}

export async function createMilestoneNotification(
  userId: string,
  studentId: string,
  studentName: string,
  milestoneName: string
): Promise<void> {
  await createNotification(
    userId,
    studentId,
    'milestone',
    '🏆 Jalon atteint !',
    `${studentName} a atteint le jalon "${milestoneName}" !`,
    { milestone_name: milestoneName }
  );
}

export async function createStruggleNotification(
  userId: string,
  studentId: string,
  studentName: string,
  skillName: string
): Promise<void> {
  await createNotification(
    userId,
    studentId,
    'struggle',
    '📚 Aide nécessaire',
    `${studentName} semble avoir des difficultés avec "${skillName}".`,
    { skill_name: skillName }
  );
}

export async function createStreakNotification(
  userId: string,
  studentId: string,
  studentName: string,
  streakCount: number
): Promise<void> {
  await createNotification(
    userId,
    studentId,
    'streak',
    '🔥 Série en cours !',
    `${studentName} a une série de ${streakCount} jours consécutifs !`,
    { streak_count: streakCount }
  );
}

export async function generateWeeklySummary(
  userId: string,
  studentId: string
): Promise<void> {
  const supabase = await createClient();
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data: student } = await supabase
    .from('student_profiles')
    .select('display_name')
    .eq('id', studentId)
    .single();

  const { data: attempts } = await supabase
    .from('exercise_attempts')
    .select('is_correct')
    .eq('student_id', studentId)
    .gte('created_at', oneWeekAgo.toISOString());

  const { data: sessions } = await supabase
    .from('learning_sessions')
    .select('duration_minutes')
    .eq('student_id', studentId)
    .gte('started_at', oneWeekAgo.toISOString());

  const totalExercises = attempts?.length || 0;
  const correctExercises = attempts?.filter(a => a.is_correct).length || 0;
  const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
  const accuracy = totalExercises > 0 ? Math.round((correctExercises / totalExercises) * 100) : 0;

  const studentName = student?.display_name || 'Votre enfant';

  await createNotification(
    userId,
    studentId,
    'weekly_summary',
    '📊 Résumé hebdomadaire',
    `${studentName} a complété ${totalExercises} exercices cette semaine avec ${accuracy}% de réussite. Temps total : ${totalMinutes} minutes.`,
    {
      total_exercises: totalExercises,
      correct_exercises: correctExercises,
      accuracy,
      total_minutes: totalMinutes,
    }
  );
}
