import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { EXERCISE_TYPES, ExerciseTypeId } from '@/types/exercise-types';

interface SkillInfo {
  id: string;
  code: string;
  name: string;
  description?: string;
  difficulty_level: number;
}

interface DomainInfo {
  id: string;
  code: string;
  name: string;
}

interface SubjectInfo {
  id: string;
  code: string;
  name: string;
  ai_model_id?: string;
}

interface ExerciseTypeRecommendation {
  allowed_types: ExerciseTypeId[];
  preferred_types: ExerciseTypeId[];
  reasoning: string;
}

const AVAILABLE_TYPES = Object.keys(EXERCISE_TYPES) as ExerciseTypeId[];

const TYPE_DESCRIPTIONS = Object.entries(EXERCISE_TYPES)
  .map(([id, info]) => `- ${id}: ${info.name} - ${info.description} (catégorie: ${info.category})`)
  .join('\n');

export async function recommendExerciseTypesForSkill(
  skill: SkillInfo,
  domain: DomainInfo,
  subject: SubjectInfo,
  language: string = 'fr'
): Promise<ExerciseTypeRecommendation> {
  const supabase = await createClient();

  let modelName = 'gpt-4o-mini';
  
  if (subject.ai_model_id) {
    const { data: aiModel } = await supabase
      .from('ai_model_config')
      .select('model_name')
      .eq('id', subject.ai_model_id)
      .single();
    
    if (aiModel?.model_name) {
      modelName = aiModel.model_name;
    }
  }

  const prompt = `Tu es un expert en pédagogie et en conception d'exercices éducatifs pour enfants.

CONTEXTE:
- Matière: ${subject.name}
- Module/Domaine: ${domain.name}
- Compétence: ${skill.name}
- Description: ${skill.description || 'Non spécifiée'}
- Niveau de difficulté: ${skill.difficulty_level}/5
- Langue: ${language}

TYPES D'EXERCICES DISPONIBLES:
${TYPE_DESCRIPTIONS}

TÂCHE:
Détermine les types d'exercices les plus adaptés pour enseigner et évaluer cette compétence.

CRITÈRES DE SÉLECTION:
1. Pertinence pédagogique: Le type doit permettre d'évaluer efficacement la compétence
2. Engagement: Privilégier les types interactifs et variés
3. Accessibilité: Adapter au niveau de difficulté
4. Diversité: Proposer plusieurs types pour varier l'apprentissage

RÈGLES:
- Sélectionne entre 3 et 7 types autorisés (allowed_types)
- Parmi ceux-ci, identifie 1 à 3 types préférés (preferred_types) qui sont les plus adaptés
- Les types multimédia (audio_listen, video_watch) nécessitent des ressources, utilise-les avec parcimonie
- Pour les compétences de bas niveau (1-2), privilégie les types simples (qcm, fill_blank)
- Pour les compétences avancées (4-5), inclus des types plus complexes (timeline, puzzle, hotspot)

Réponds UNIQUEMENT avec un JSON valide:
{
  "allowed_types": ["type1", "type2", ...],
  "preferred_types": ["type1", ...],
  "reasoning": "Explication courte du choix"
}`;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: 'Tu es un expert en pédagogie. Réponds uniquement en JSON valide.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(content);
    
    const allowedTypes = (result.allowed_types || [])
      .filter((t: string) => AVAILABLE_TYPES.includes(t as ExerciseTypeId)) as ExerciseTypeId[];
    
    const preferredTypes = (result.preferred_types || [])
      .filter((t: string) => allowedTypes.includes(t as ExerciseTypeId)) as ExerciseTypeId[];

    if (allowedTypes.length === 0) {
      return {
        allowed_types: ['qcm', 'fill_blank', 'free_input'],
        preferred_types: ['qcm'],
        reasoning: 'Types par défaut (IA n\'a pas retourné de types valides)',
      };
    }

    return {
      allowed_types: allowedTypes,
      preferred_types: preferredTypes.length > 0 ? preferredTypes : [allowedTypes[0]],
      reasoning: result.reasoning || 'Recommandation IA',
    };
  } catch (error) {
    console.error('[recommendExerciseTypesForSkill] Error:', error);
    return {
      allowed_types: ['qcm', 'fill_blank', 'free_input', 'drag_drop'],
      preferred_types: ['qcm'],
      reasoning: 'Types par défaut (erreur IA)',
    };
  }
}

export async function applyExerciseTypesToSkill(
  skillId: string,
  recommendation: ExerciseTypeRecommendation
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('skills')
    .update({
      allowed_exercise_types: recommendation.allowed_types,
      preferred_exercise_types: recommendation.preferred_types,
    })
    .eq('id', skillId);

  if (error) {
    console.error('[applyExerciseTypesToSkill] Error:', error);
    return false;
  }

  return true;
}

export async function recommendAndApplyForSkill(
  skillId: string,
  language: string = 'fr'
): Promise<ExerciseTypeRecommendation | null> {
  const supabase = await createClient();

  const { data: skill } = await supabase
    .from('skills')
    .select(`
      id, code, name_key, description_key, difficulty_level,
      domain:domains!inner(
        id, code, name_key,
        subject:subjects!inner(id, code, name_key, ai_model_id)
      )
    `)
    .eq('id', skillId)
    .single();

  if (!skill) {
    console.error('[recommendAndApplyForSkill] Skill not found:', skillId);
    return null;
  }

  const domain = Array.isArray(skill.domain) ? skill.domain[0] : skill.domain;
  const subject = domain ? (Array.isArray(domain.subject) ? domain.subject[0] : domain.subject) : null;

  if (!domain || !subject) {
    console.error('[recommendAndApplyForSkill] Domain or subject not found');
    return null;
  }

  const { data: translations } = await supabase
    .from('content_translations')
    .select('key, value')
    .in('key', [skill.name_key, skill.description_key, domain.name_key, subject.name_key].filter(Boolean))
    .eq('language', language);

  const translationMap = new Map(translations?.map(t => [t.key, t.value]) || []);

  const skillInfo: SkillInfo = {
    id: skill.id,
    code: skill.code,
    name: translationMap.get(skill.name_key) || skill.name_key,
    description: skill.description_key ? translationMap.get(skill.description_key) : undefined,
    difficulty_level: skill.difficulty_level || 1,
  };

  const domainInfo: DomainInfo = {
    id: domain.id,
    code: domain.code,
    name: translationMap.get(domain.name_key) || domain.name_key,
  };

  const subjectInfo: SubjectInfo = {
    id: subject.id,
    code: subject.code,
    name: translationMap.get(subject.name_key) || subject.name_key,
    ai_model_id: subject.ai_model_id,
  };

  const recommendation = await recommendExerciseTypesForSkill(skillInfo, domainInfo, subjectInfo, language);
  
  const success = await applyExerciseTypesToSkill(skillId, recommendation);
  
  if (!success) {
    return null;
  }

  return recommendation;
}

export async function recommendAndApplyForSubject(
  subjectId: string,
  language: string = 'fr'
): Promise<{ success: number; failed: number; total: number }> {
  const supabase = await createClient();

  const { data: skills } = await supabase
    .from('skills')
    .select(`
      id,
      domain:domains!inner(subject_id)
    `)
    .eq('domain.subject_id', subjectId);

  if (!skills || skills.length === 0) {
    return { success: 0, failed: 0, total: 0 };
  }

  let success = 0;
  let failed = 0;

  for (const skill of skills) {
    const result = await recommendAndApplyForSkill(skill.id, language);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed, total: skills.length };
}

export async function recommendAndApplyForDomain(
  domainId: string,
  language: string = 'fr'
): Promise<{ success: number; failed: number; total: number }> {
  const supabase = await createClient();

  const { data: skills } = await supabase
    .from('skills')
    .select('id')
    .eq('domain_id', domainId);

  if (!skills || skills.length === 0) {
    return { success: 0, failed: 0, total: 0 };
  }

  let success = 0;
  let failed = 0;

  for (const skill of skills) {
    const result = await recommendAndApplyForSkill(skill.id, language);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed, total: skills.length };
}
