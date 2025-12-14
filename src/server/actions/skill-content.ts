'use server';

import { createClient } from '@/lib/supabase/server';
import { createAICompletion } from '@/lib/ai/providers';
import type {
  SkillContent,
  SkillExample,
  SkillSelfAssessment,
  FullSkillContent,
  FullGeneratedSkill,
  GeneratedSkillContent,
  GeneratedSkillExample,
  GeneratedSkillSelfAssessment,
  PedagogicalMethodCode,
  ExerciseUsageCheck,
} from '@/types/v2';

async function getUserAISettings(userId: string) {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('user_ai_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!data || data.provider === 'platform') {
    return {
      provider: 'platform' as const,
      model: 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY || '',
    };
  }

  return {
    provider: data.provider,
    model: data.preferred_model,
    apiKey: data.api_key_encrypted || '',
  };
}

export async function getSkillContent(skillId: string): Promise<FullSkillContent | null> {
  const supabase = await createClient();

  const [contentResult, examplesResult, assessmentsResult] = await Promise.all([
    supabase
      .from('skill_content')
      .select('*')
      .eq('skill_id', skillId)
      .single(),
    supabase
      .from('skill_examples')
      .select('*')
      .eq('skill_id', skillId)
      .order('sort_order'),
    supabase
      .from('skill_self_assessments')
      .select('*')
      .eq('skill_id', skillId)
      .order('sort_order'),
  ]);

  return {
    content: contentResult.data as SkillContent | null,
    examples: (examplesResult.data || []) as SkillExample[],
    selfAssessments: (assessmentsResult.data || []) as SkillSelfAssessment[],
  };
}

export async function getPedagogicalMethods() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('pedagogical_methods')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('Error fetching pedagogical methods:', error);
    return [];
  }

  return data || [];
}

export async function generateFullSkillContent(
  skillId: string,
  skillName: string,
  skillDescription: string,
  method: PedagogicalMethodCode = 'standard',
  language: string = 'fr'
): Promise<{ success: boolean; data?: FullGeneratedSkill; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Non authentifié' };
  }

  const settings = await getUserAISettings(user.id);
  if (!settings.apiKey) {
    return { success: false, error: 'Configuration IA manquante' };
  }

  const { data: methodData } = await supabase
    .from('pedagogical_methods')
    .select('prompt_instructions')
    .eq('code', method)
    .single();

  const methodInstructions = methodData?.prompt_instructions || '';

  const prompt = `Tu es un expert pédagogique. Génère le contenu complet pour la compétence suivante en respectant la structure en 13 points.

COMPÉTENCE: ${skillName}
DESCRIPTION: ${skillDescription}
MÉTHODE PÉDAGOGIQUE: ${method}
INSTRUCTIONS MÉTHODE: ${methodInstructions}
LANGUE: ${language}

Génère un JSON avec la structure suivante:
{
  "content": {
    "objective": "Objectif pédagogique mesurable (commencer par un verbe d'action)",
    "context": "Mise en contexte motivante pour l'apprenant",
    "theory": "Explication théorique complète et progressive (format Markdown)",
    "synthesis": "Synthèse des points clés à retenir",
    "enrichments": {
      "links": ["liens optionnels"],
      "videos": ["vidéos optionnelles"],
      "books": ["livres optionnels"]
    }
  },
  "examples": [
    {
      "title": "Titre de l'exemple",
      "problem": "Énoncé du problème",
      "solution": "Solution détaillée",
      "explanation": "Explication pas à pas"
    }
  ],
  "selfAssessments": [
    {
      "question": "Question d'auto-évaluation",
      "type": "yes_no"
    }
  ]
}

IMPORTANT:
- Adapte le contenu à des enfants de 6-12 ans
- Utilise un langage simple et encourageant
- Fournis au moins 2 exemples guidés
- Fournis au moins 2 questions d'auto-évaluation
- La théorie doit être progressive et illustrée
- Respecte strictement la méthode pédagogique demandée

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

  try {
    const response = await createAICompletion(
      settings.provider as 'openai' | 'anthropic' | 'platform',
      settings.apiKey,
      {
        messages: [{ role: 'user', content: prompt }],
        model: settings.model as 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'claude-3-5-sonnet-20241022' | 'claude-3-haiku-20240307',
        maxTokens: 4000,
        temperature: 0.7,
      }
    );

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: 'Réponse IA invalide' };
    }

    const parsed = JSON.parse(jsonMatch[0]) as FullGeneratedSkill;

    if (!parsed.content?.objective || !parsed.content?.theory) {
      return { success: false, error: 'Contenu généré incomplet' };
    }

    return { success: true, data: parsed };
  } catch (error) {
    console.error('Error generating skill content:', error);
    return { success: false, error: 'Erreur lors de la génération' };
  }
}

export async function saveSkillContent(
  skillId: string,
  content: GeneratedSkillContent,
  examples: GeneratedSkillExample[],
  selfAssessments: GeneratedSkillSelfAssessment[],
  method: PedagogicalMethodCode = 'standard',
  language: string = 'fr',
  source: 'official' | 'user' | 'ai' = 'ai'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Non authentifié' };
  }

  const { error: contentError } = await supabase
    .from('skill_content')
    .upsert({
      skill_id: skillId,
      objective: content.objective,
      context: content.context,
      theory: content.theory,
      synthesis: content.synthesis,
      enrichments: content.enrichments,
      pedagogical_method: method,
      source,
      created_by: user.id,
      is_validated: source === 'official',
      language,
    }, { onConflict: 'skill_id' });

  if (contentError) {
    console.error('Error saving skill content:', contentError);
    return { success: false, error: 'Erreur lors de la sauvegarde du contenu' };
  }

  await supabase
    .from('skill_examples')
    .delete()
    .eq('skill_id', skillId);

  if (examples.length > 0) {
    const { error: examplesError } = await supabase
      .from('skill_examples')
      .insert(examples.map((ex, idx) => ({
        skill_id: skillId,
        title: ex.title,
        problem: ex.problem,
        solution: ex.solution,
        explanation: ex.explanation,
        sort_order: idx,
        language,
      })));

    if (examplesError) {
      console.error('Error saving skill examples:', examplesError);
    }
  }

  await supabase
    .from('skill_self_assessments')
    .delete()
    .eq('skill_id', skillId);

  if (selfAssessments.length > 0) {
    const { error: assessmentsError } = await supabase
      .from('skill_self_assessments')
      .insert(selfAssessments.map((sa, idx) => ({
        skill_id: skillId,
        question: sa.question,
        type: sa.type,
        sort_order: idx,
        language,
      })));

    if (assessmentsError) {
      console.error('Error saving self assessments:', assessmentsError);
    }
  }

  return { success: true };
}

export async function checkExerciseUsage(
  skillId: string
): Promise<ExerciseUsageCheck> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      can_generate: false,
      use_platform_tokens: false,
      current_usage: 0,
      limit: 10,
      remaining: 0,
      plan_type: 'free',
    };
  }

  const { data, error } = await supabase.rpc('check_and_increment_exercise_usage', {
    p_skill_id: skillId,
    p_user_id: user.id,
    p_is_platform: true,
  });

  if (error) {
    console.error('Error checking exercise usage:', error);
    return {
      can_generate: true,
      use_platform_tokens: true,
      current_usage: 0,
      limit: 10,
      remaining: 10,
      plan_type: 'free',
    };
  }

  return data as ExerciseUsageCheck;
}

export async function getUserPlan() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from('user_plans')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return data;
}
