'use server';

import { createClient } from '@/lib/supabase/server';

export interface Skill {
  id: string;
  domain_id: string;
  code: string;
  name_key: string;
  description_key: string | null;
  difficulty_level: number;
  prerequisites: string[];
  estimated_duration_minutes: number;
  country_programs: string[];
  sort_order: number;
  is_active: boolean;
}

interface SkillProgress {
  skill_id: string;
  mastery_level: number;
  attempts_count: number;
  correct_count: number;
  last_attempt_at: string | null;
}

export interface SkillWithProgress extends Skill {
  mastery_level: number;
  attempts_count: number;
  correct_count: number;
  last_attempt_at: string | null;
}

export async function getSkillsByDomain(domainId: string): Promise<Skill[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('domain_id', domainId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching skills:', error);
    return [];
  }

  return data || [];
}

export async function getSkillByCode(code: string): Promise<Skill | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching skill:', error);
    return null;
  }

  return data;
}

export async function getSkillsWithProgress(
  domainId: string,
  studentId: string
): Promise<SkillWithProgress[]> {
  const supabase = await createClient();
  
  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('*')
    .eq('domain_id', domainId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (skillsError || !skills) {
    console.error('Error fetching skills:', skillsError);
    return [];
  }

  const { data: progress, error: progressError } = await supabase
    .from('student_skill_progress')
    .select('*')
    .eq('student_id', studentId)
    .in('skill_id', skills.map((s: Skill) => s.id));

  if (progressError) {
    console.error('Error fetching progress:', progressError);
  }

  const progressMap = new Map<string, SkillProgress>(
    (progress || []).map((p: SkillProgress) => [p.skill_id, p])
  );

  return skills.map((skill: Skill) => ({
    ...skill,
    mastery_level: progressMap.get(skill.id)?.mastery_level || 0,
    attempts_count: progressMap.get(skill.id)?.attempts_count || 0,
    correct_count: progressMap.get(skill.id)?.correct_count || 0,
    last_attempt_at: progressMap.get(skill.id)?.last_attempt_at || null,
  }));
}

export async function getStudentProgress(studentId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('student_skill_progress')
    .select(`
      *,
      skills (
        id,
        code,
        name_key,
        domain_id,
        domains (
          id,
          code,
          name_key,
          subject_id
        )
      )
    `)
    .eq('student_id', studentId);

  if (error) {
    console.error('Error fetching student progress:', error);
    return [];
  }

  return data || [];
}
