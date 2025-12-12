'use server';

import { createClient } from '@/lib/supabase/server';

interface SkillPrerequisite {
  id: string;
  skill_id: string;
  prerequisite_skill_id: string;
  prerequisite_skill?: {
    id: string;
    name: string;
    mastery_level?: number;
  };
}

export async function getSkillPrerequisites(skillId: string): Promise<SkillPrerequisite[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('skill_prerequisites')
    .select(`
      id,
      skill_id,
      prerequisite_skill_id,
      prerequisite_skill:skills!prerequisite_skill_id (
        id,
        name
      )
    `)
    .eq('skill_id', skillId);

  if (error) {
    console.error('Error fetching prerequisites:', error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id,
    skill_id: item.skill_id,
    prerequisite_skill_id: item.prerequisite_skill_id,
    prerequisite_skill: item.prerequisite_skill ? {
      id: (item.prerequisite_skill as unknown as { id: string; name: string }).id,
      name: (item.prerequisite_skill as unknown as { id: string; name: string }).name,
    } : undefined,
  }));
}

export async function getSkillsWithPrerequisiteStatus(
  domainId: string,
  studentId: string
): Promise<Array<{
  id: string;
  name: string;
  description: string;
  mastery_level: number;
  is_unlocked: boolean;
  prerequisites: Array<{ id: string; name: string; mastery_level: number; is_met: boolean }>;
}>> {
  const supabase = await createClient();
  
  const { data: skills } = await supabase
    .from('skills')
    .select('*')
    .eq('domain_id', domainId)
    .eq('is_active', true)
    .order('sort_order');

  if (!skills) return [];

  const { data: progress } = await supabase
    .from('student_skill_progress')
    .select('skill_id, mastery_level')
    .eq('student_id', studentId);

  const progressMap = new Map(
    (progress || []).map(p => [p.skill_id, p.mastery_level])
  );

  const { data: prerequisites } = await supabase
    .from('skill_prerequisites')
    .select(`
      skill_id,
      prerequisite_skill_id,
      prerequisite_skill:skills!prerequisite_skill_id (id, name)
    `)
    .in('skill_id', skills.map(s => s.id));

  const prereqMap = new Map<string, Array<{ id: string; name: string }>>();
  (prerequisites || []).forEach(p => {
    const existing = prereqMap.get(p.skill_id) || [];
    if (p.prerequisite_skill) {
      const prereqSkill = p.prerequisite_skill as unknown as { id: string; name: string };
      existing.push({ id: prereqSkill.id, name: prereqSkill.name });
    }
    prereqMap.set(p.skill_id, existing);
  });

  return skills.map(skill => {
    const skillPrereqs = prereqMap.get(skill.id) || [];
    const prereqsWithStatus = skillPrereqs.map(prereq => ({
      ...prereq,
      mastery_level: progressMap.get(prereq.id) || 0,
      is_met: (progressMap.get(prereq.id) || 0) >= 70,
    }));

    const isUnlocked = prereqsWithStatus.length === 0 || 
      prereqsWithStatus.every(p => p.is_met);

    return {
      id: skill.id,
      name: skill.name,
      description: skill.description || '',
      mastery_level: progressMap.get(skill.id) || 0,
      is_unlocked: isUnlocked,
      prerequisites: prereqsWithStatus,
    };
  });
}

export async function addSkillPrerequisite(
  skillId: string,
  prerequisiteSkillId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('skill_prerequisites')
    .insert({
      skill_id: skillId,
      prerequisite_skill_id: prerequisiteSkillId,
    });

  if (error) {
    console.error('Error adding prerequisite:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function removeSkillPrerequisite(
  skillId: string,
  prerequisiteSkillId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('skill_prerequisites')
    .delete()
    .eq('skill_id', skillId)
    .eq('prerequisite_skill_id', prerequisiteSkillId);

  if (error) {
    console.error('Error removing prerequisite:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
