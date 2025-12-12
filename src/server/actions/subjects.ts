'use server';

import { createClient } from '@/lib/supabase/server';

export interface Subject {
  id: string;
  code: string;
  name_key: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Domain {
  id: string;
  subject_id: string;
  code: string;
  name_key: string;
  description_key: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export async function getSubjects(): Promise<Subject[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }

  return data || [];
}

export async function getSubjectByCode(code: string): Promise<Subject | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching subject:', error);
    return null;
  }

  return data;
}

export async function getDomainsBySubject(subjectId: string): Promise<Domain[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .eq('subject_id', subjectId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching domains:', error);
    return [];
  }

  return data || [];
}

export async function getSubjectWithDomains(code: string) {
  const subject = await getSubjectByCode(code);
  if (!subject) return null;

  const domains = await getDomainsBySubject(subject.id);
  return { ...subject, domains };
}
