'use server';

import { createClient } from '@/lib/supabase/server';
import { createAICompletion } from '@/lib/ai/providers';
import type {
  UserModule,
  UserSkill,
  ContentShare,
  ContentRating,
  ContentType,
  ShareLevel,
  AIValidationResult,
} from '@/types/v2';

export async function createUserModule(
  subjectId: string,
  code: string,
  name: string,
  description?: string
): Promise<{ success: boolean; module?: UserModule; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Non authentifié' };
  }

  const validation = await validateContentWithAI('module', subjectId, name, description);
  if (!validation.isValid) {
    return { success: false, error: validation.errors.join(', ') };
  }

  const planCheck = await checkUserPlanLimits(user.id, 'module');
  if (!planCheck.canCreate) {
    return { success: false, error: planCheck.message };
  }

  const { data, error } = await supabase
    .from('user_modules')
    .insert({
      subject_id: subjectId,
      created_by: user.id,
      code,
      name,
      description,
      is_public: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user module:', error);
    return { success: false, error: 'Erreur lors de la création' };
  }

  await incrementPlanUsage(user.id, 'modules');

  return { success: true, module: data as UserModule };
}

export async function createUserSkill(
  moduleId: string,
  moduleType: 'official' | 'user',
  code: string,
  name: string,
  description?: string,
  difficultyLevel: number = 1
): Promise<{ success: boolean; skill?: UserSkill; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Non authentifié' };
  }

  let subjectId: string | null = null;
  if (moduleType === 'official') {
    const { data: domain } = await supabase
      .from('domains')
      .select('subject_id')
      .eq('id', moduleId)
      .single();
    subjectId = domain?.subject_id || null;
  } else {
    const { data: userModule } = await supabase
      .from('user_modules')
      .select('subject_id')
      .eq('id', moduleId)
      .single();
    subjectId = userModule?.subject_id || null;
  }

  if (subjectId) {
    const validation = await validateContentWithAI('skill', subjectId, name, description);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }
  }

  const planCheck = await checkUserPlanLimits(user.id, 'skill');
  if (!planCheck.canCreate) {
    return { success: false, error: planCheck.message };
  }

  const { data, error } = await supabase
    .from('user_skills')
    .insert({
      module_id: moduleId,
      module_type: moduleType,
      created_by: user.id,
      code,
      name,
      description,
      difficulty_level: difficultyLevel,
      is_public: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user skill:', error);
    return { success: false, error: 'Erreur lors de la création' };
  }

  await incrementPlanUsage(user.id, 'skills');

  return { success: true, skill: data as UserSkill };
}

export async function getUserModules(subjectId?: string): Promise<UserModule[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from('user_modules')
    .select('*')
    .eq('created_by', user.id);

  if (subjectId) {
    query = query.eq('subject_id', subjectId);
  }

  const { data } = await query.order('created_at', { ascending: false });

  return (data || []) as UserModule[];
}

export async function getUserSkills(moduleId?: string): Promise<UserSkill[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from('user_skills')
    .select('*')
    .eq('created_by', user.id);

  if (moduleId) {
    query = query.eq('module_id', moduleId);
  }

  const { data } = await query.order('created_at', { ascending: false });

  return (data || []) as UserSkill[];
}

export async function getPublicModules(subjectId?: string): Promise<UserModule[]> {
  const supabase = await createClient();

  let query = supabase
    .from('user_modules')
    .select('*')
    .eq('is_public', true);

  if (subjectId) {
    query = query.eq('subject_id', subjectId);
  }

  const { data } = await query
    .order('rating_average', { ascending: false })
    .limit(50);

  return (data || []) as UserModule[];
}

export async function getPublicSkills(moduleId?: string): Promise<UserSkill[]> {
  const supabase = await createClient();

  let query = supabase
    .from('user_skills')
    .select('*')
    .eq('is_public', true);

  if (moduleId) {
    query = query.eq('module_id', moduleId);
  }

  const { data } = await query
    .order('rating_average', { ascending: false })
    .limit(50);

  return (data || []) as UserSkill[];
}

export async function toggleModulePublic(moduleId: string): Promise<{ success: boolean; isPublic?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false };
  }

  const { data: current } = await supabase
    .from('user_modules')
    .select('is_public')
    .eq('id', moduleId)
    .eq('created_by', user.id)
    .single();

  if (!current) {
    return { success: false };
  }

  const { error } = await supabase
    .from('user_modules')
    .update({ is_public: !current.is_public })
    .eq('id', moduleId)
    .eq('created_by', user.id);

  if (error) {
    return { success: false };
  }

  return { success: true, isPublic: !current.is_public };
}

export async function toggleSkillPublic(skillId: string): Promise<{ success: boolean; isPublic?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false };
  }

  const { data: current } = await supabase
    .from('user_skills')
    .select('is_public')
    .eq('id', skillId)
    .eq('created_by', user.id)
    .single();

  if (!current) {
    return { success: false };
  }

  const { error } = await supabase
    .from('user_skills')
    .update({ is_public: !current.is_public })
    .eq('id', skillId)
    .eq('created_by', user.id);

  if (error) {
    return { success: false };
  }

  return { success: true, isPublic: !current.is_public };
}

export async function shareContent(
  contentType: ContentType,
  contentId: string,
  sharedWithEmail: string,
  shareLevel: ShareLevel = 'view'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Non authentifié' };
  }

  const { data: targetUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', sharedWithEmail)
    .single();

  if (!targetUser) {
    return { success: false, error: 'Utilisateur non trouvé' };
  }

  const { error } = await supabase
    .from('content_shares')
    .insert({
      content_type: contentType,
      content_id: contentId,
      shared_by: user.id,
      shared_with: targetUser.id,
      share_level: shareLevel,
    });

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Contenu déjà partagé avec cet utilisateur' };
    }
    return { success: false, error: 'Erreur lors du partage' };
  }

  return { success: true };
}

export async function getSharedWithMe(): Promise<ContentShare[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('content_shares')
    .select('*')
    .eq('shared_with', user.id)
    .order('created_at', { ascending: false });

  return (data || []) as ContentShare[];
}

export async function rateContent(
  contentType: ContentType,
  contentId: string,
  rating: number,
  comment?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Non authentifié' };
  }

  if (rating < 1 || rating > 5) {
    return { success: false, error: 'Note invalide (1-5)' };
  }

  const { error } = await supabase
    .from('content_ratings')
    .upsert({
      content_type: contentType,
      content_id: contentId,
      rated_by: user.id,
      rating,
      comment,
    }, { onConflict: 'content_type,content_id,rated_by' });

  if (error) {
    return { success: false, error: 'Erreur lors de la notation' };
  }

  return { success: true };
}

export async function getContentRatings(
  contentType: ContentType,
  contentId: string
): Promise<ContentRating[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('content_ratings')
    .select('*')
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .order('created_at', { ascending: false });

  return (data || []) as ContentRating[];
}

async function validateContentWithAI(
  contentType: ContentType,
  subjectId: string,
  name: string,
  description?: string
): Promise<AIValidationResult> {
  const supabase = await createClient();

  const { data: subject } = await supabase
    .from('subjects')
    .select('name_key, code')
    .eq('id', subjectId)
    .single();

  if (!subject) {
    return {
      isValid: false,
      errors: ['Matière non trouvée'],
      warnings: [],
      suggestions: [],
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      isValid: true,
      errors: [],
      warnings: ['Validation IA non disponible'],
      suggestions: [],
    };
  }

  const prompt = `Tu es un validateur de contenu pédagogique. Vérifie si le contenu suivant est approprié pour la matière indiquée.

MATIÈRE: ${subject.code}
TYPE DE CONTENU: ${contentType}
NOM: ${name}
DESCRIPTION: ${description || 'Non fournie'}

Réponds en JSON:
{
  "isValid": true/false,
  "errors": ["liste des erreurs bloquantes"],
  "warnings": ["liste des avertissements"],
  "suggestions": ["liste des suggestions d'amélioration"]
}

Critères de validation:
1. Le contenu doit correspondre à la matière
2. Le nom doit être clair et pédagogique
3. Pas de contenu inapproprié pour des enfants
4. Le contenu doit avoir une valeur éducative

Réponds UNIQUEMENT avec le JSON.`;

  try {
    const response = await createAICompletion('platform', apiKey, {
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o-mini',
      maxTokens: 500,
      temperature: 0.3,
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as AIValidationResult;
    }
  } catch (error) {
    console.error('AI validation error:', error);
  }

  return {
    isValid: true,
    errors: [],
    warnings: ['Validation IA non disponible'],
    suggestions: [],
  };
}

async function checkUserPlanLimits(
  userId: string,
  resourceType: 'module' | 'skill'
): Promise<{ canCreate: boolean; message?: string }> {
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from('user_plans')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!plan) {
    return { canCreate: true };
  }

  if (plan.plan_type === 'premium') {
    return { canCreate: true };
  }

  const limits = plan.limits as { modules_per_month: number; skills_per_month: number };
  const usage = plan.current_usage as { modules: number; skills: number };

  if (resourceType === 'module') {
    if (usage.modules >= limits.modules_per_month) {
      return {
        canCreate: false,
        message: `Limite atteinte : ${limits.modules_per_month} modules/mois. Passez en Premium pour créer plus.`,
      };
    }
  } else {
    if (usage.skills >= limits.skills_per_month) {
      return {
        canCreate: false,
        message: `Limite atteinte : ${limits.skills_per_month} compétences/mois. Passez en Premium pour créer plus.`,
      };
    }
  }

  return { canCreate: true };
}

async function incrementPlanUsage(userId: string, field: 'modules' | 'skills'): Promise<void> {
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from('user_plans')
    .select('current_usage')
    .eq('user_id', userId)
    .single();

  if (!plan) return;

  const usage = plan.current_usage as { modules: number; skills: number; ai_requests: number };
  usage[field] = (usage[field] || 0) + 1;

  await supabase
    .from('user_plans')
    .update({ current_usage: usage })
    .eq('user_id', userId);
}
