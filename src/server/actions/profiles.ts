'use server';

import { createClient } from '@/lib/supabase/server';

export interface StudentProfile {
  id: string;
  user_id: string | null;
  display_name: string;
  birth_year: number | null;
  preferred_language: string;
  preferred_method: string;
  country_program: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileInput {
  display_name: string;
  birth_year?: number;
  preferred_language?: string;
  country_program?: string;
  avatar_url?: string;
}

export async function getProfilesByParent(parentId: string): Promise<StudentProfile[]> {
  const supabase = await createClient();
  
  const { data: links, error: linksError } = await supabase
    .from('parent_student_links')
    .select('student_id')
    .eq('parent_id', parentId);

  if (linksError || !links || links.length === 0) {
    return [];
  }

  const studentIds = links.map((l: { student_id: string }) => l.student_id);
  
  const { data: profiles, error: profilesError } = await supabase
    .from('student_profiles')
    .select('*')
    .in('id', studentIds);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return [];
  }

  return profiles || [];
}

export async function getProfileById(id: string): Promise<StudentProfile | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function createProfile(
  parentId: string,
  input: CreateProfileInput
): Promise<{ success: boolean; profile?: StudentProfile; error?: string }> {
  const supabase = await createClient();
  
  const { data: profile, error: profileError } = await supabase
    .from('student_profiles')
    .insert({
      display_name: input.display_name,
      birth_year: input.birth_year,
      preferred_language: input.preferred_language || 'fr',
      country_program: input.country_program || 'FR',
      avatar_url: input.avatar_url,
    })
    .select()
    .single();

  if (profileError) {
    console.error('Error creating profile:', profileError);
    return { success: false, error: profileError.message };
  }

  const { error: linkError } = await supabase
    .from('parent_student_links')
    .insert({
      parent_id: parentId,
      student_id: profile.id,
    });

  if (linkError) {
    console.error('Error creating link:', linkError);
    await supabase.from('student_profiles').delete().eq('id', profile.id);
    return { success: false, error: linkError.message };
  }

  return { success: true, profile };
}

export async function updateProfile(
  id: string,
  input: Partial<CreateProfileInput>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('student_profiles')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteProfile(
  parentId: string,
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { error: linkError } = await supabase
    .from('parent_student_links')
    .delete()
    .eq('parent_id', parentId)
    .eq('student_id', profileId);

  if (linkError) {
    console.error('Error deleting link:', linkError);
    return { success: false, error: linkError.message };
  }

  const { data: remainingLinks } = await supabase
    .from('parent_student_links')
    .select('id')
    .eq('student_id', profileId);

  if (!remainingLinks || remainingLinks.length === 0) {
    const { error: profileError } = await supabase
      .from('student_profiles')
      .delete()
      .eq('id', profileId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
    }
  }

  return { success: true };
}

export async function getProfileStats(profileId: string) {
  const supabase = await createClient();
  
  const { data: progress, error } = await supabase
    .from('student_skill_progress')
    .select('mastery_level, attempts_count, correct_count')
    .eq('student_id', profileId);

  if (error || !progress) {
    return {
      totalSkills: 0,
      masteredSkills: 0,
      totalAttempts: 0,
      totalCorrect: 0,
      averageMastery: 0,
    };
  }

  const totalSkills = progress.length;
  const masteredSkills = progress.filter((p: { mastery_level: number }) => p.mastery_level >= 80).length;
  const totalAttempts = progress.reduce((sum: number, p: { attempts_count: number }) => sum + p.attempts_count, 0);
  const totalCorrect = progress.reduce((sum: number, p: { correct_count: number }) => sum + p.correct_count, 0);
  const averageMastery = totalSkills > 0
    ? Math.round(progress.reduce((sum: number, p: { mastery_level: number }) => sum + p.mastery_level, 0) / totalSkills)
    : 0;

  return {
    totalSkills,
    masteredSkills,
    totalAttempts,
    totalCorrect,
    averageMastery,
  };
}
