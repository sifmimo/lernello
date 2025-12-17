'use server';

import { createClient } from '@/lib/supabase/server';

export type StudentNotificationType = 
  | 'streak_reminder' 
  | 'achievement_unlocked' 
  | 'level_up' 
  | 'challenge_progress'
  | 'lumi_message'
  | 'new_zone_unlocked'
  | 'decoration_earned';

interface CreateNotificationParams {
  studentId: string;
  type: StudentNotificationType;
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
}

export async function createStudentNotification(params: CreateNotificationParams) {
  const supabase = await createClient();

  const { error } = await supabase.from('student_notifications').insert({
    student_id: params.studentId,
    notification_type: params.type,
    title: params.title,
    message: params.message,
    icon: params.icon,
    action_url: params.actionUrl,
    is_read: false,
  });

  if (error) {
    console.error('Error creating notification:', error);
    return { success: false };
  }

  return { success: true };
}

export async function getStudentNotifications(studentId: string, unreadOnly = false) {
  const supabase = await createClient();

  let query = supabase
    .from('student_notifications')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(20);

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

export async function markStudentNotificationRead(notificationId: string) {
  const supabase = await createClient();

  await supabase
    .from('student_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  return { success: true };
}

export async function markAllStudentNotificationsRead(studentId: string) {
  const supabase = await createClient();

  await supabase
    .from('student_notifications')
    .update({ is_read: true })
    .eq('student_id', studentId)
    .eq('is_read', false);

  return { success: true };
}

export async function notifyStreakAtRisk(studentId: string, currentStreak: number) {
  return createStudentNotification({
    studentId,
    type: 'streak_reminder',
    title: '🔥 Ta série est en danger !',
    message: `Tu as ${currentStreak} jours de suite. Joue aujourd'hui pour ne pas perdre ta série !`,
    icon: '🔥',
    actionUrl: '/dashboard',
  });
}

export async function notifyLevelUp(studentId: string, newLevel: number) {
  return createStudentNotification({
    studentId,
    type: 'level_up',
    title: '⭐ Niveau supérieur !',
    message: `Bravo ! Tu es maintenant niveau ${newLevel} ! Continue comme ça !`,
    icon: '⭐',
    actionUrl: '/achievements',
  });
}

export async function notifyAchievementUnlocked(studentId: string, achievementName: string, achievementIcon: string) {
  return createStudentNotification({
    studentId,
    type: 'achievement_unlocked',
    title: '🏆 Nouveau badge !',
    message: `Tu as débloqué le badge "${achievementName}" !`,
    icon: achievementIcon,
    actionUrl: '/achievements',
  });
}

export async function notifyNewZoneUnlocked(studentId: string, zoneName: string) {
  return createStudentNotification({
    studentId,
    type: 'new_zone_unlocked',
    title: '🗺️ Nouvelle zone !',
    message: `Tu as débloqué "${zoneName}" dans ton univers !`,
    icon: '🏝️',
    actionUrl: '/world',
  });
}

export async function notifyDecorationEarned(studentId: string, decorationName: string) {
  return createStudentNotification({
    studentId,
    type: 'decoration_earned',
    title: '✨ Nouvelle décoration !',
    message: `Tu as gagné la décoration "${decorationName}" !`,
    icon: '✨',
    actionUrl: '/world',
  });
}

export async function sendLumiMessage(studentId: string, message: string) {
  return createStudentNotification({
    studentId,
    type: 'lumi_message',
    title: '💬 Message de Lumi',
    message,
    icon: '🌟',
    actionUrl: '/dashboard',
  });
}
