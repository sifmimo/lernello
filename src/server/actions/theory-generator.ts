'use server';

import { createClient } from '@/lib/supabase/server';
import { SkillTheoryContent, TheoryExample } from '@/types/learning-session';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateTheoryContent(skillId: string): Promise<SkillTheoryContent | null> {
  const supabase = await createClient();

  const { data: skill } = await supabase
    .from('skills')
    .select(`
      id,
      name_key,
      display_name,
      description_key,
      difficulty_level,
      domain_id,
      domains (
        name_key,
        subject_id,
        subjects (
          name_key,
          code
        )
      )
    `)
    .eq('id', skillId)
    .single();

  if (!skill) {
    console.error('[generateTheoryContent] Skill not found:', skillId);
    return null;
  }

  const domainsData = skill.domains as unknown as { name_key: string; subjects: { name_key: string; code: string }[] } | null;
  const subjectName = domainsData?.subjects?.[0]?.name_key || 'Matière';
  const domainName = domainsData?.name_key || 'Domaine';
  const skillName = skill.display_name || skill.name_key;

  const prompt = `Tu es un expert pédagogue. Génère un contenu théorique structuré pour enseigner cette compétence à un enfant de 8-10 ans.

COMPÉTENCE: ${skillName}
MATIÈRE: ${subjectName}
DOMAINE: ${domainName}
DESCRIPTION: ${skill.description_key || 'Non spécifiée'}

Génère un JSON avec cette structure EXACTE:
{
  "title": "Titre accrocheur (max 50 caractères)",
  "introduction": "1-2 phrases d'accroche qui donnent envie d'apprendre",
  "concept_explanation": "Explication claire du concept en 2-3 paragraphes courts, avec des mots simples et des métaphores concrètes",
  "key_points": ["Point clé 1", "Point clé 2", "Point clé 3"],
  "examples": [
    {"problem": "Exemple 1", "solution": "Solution", "explanation": "Explication pas à pas"},
    {"problem": "Exemple 2", "solution": "Solution", "explanation": "Explication pas à pas"}
  ],
  "tips": ["Astuce 1", "Astuce 2"],
  "common_mistakes": ["Erreur fréquente 1", "Erreur fréquente 2"]
}

RÈGLES:
- Langage simple et accessible pour un enfant
- Exemples concrets du quotidien
- Pas de jargon technique
- Maximum 200 mots pour concept_explanation
- 2-3 exemples pratiques

JSON uniquement:`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Tu génères du contenu pédagogique en JSON valide uniquement.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);

    const theoryContent: Omit<SkillTheoryContent, 'id'> = {
      skill_id: skillId,
      title: parsed.title || skillName,
      introduction: parsed.introduction || '',
      concept_explanation: parsed.concept_explanation || '',
      key_points: parsed.key_points || [],
      examples: (parsed.examples || []) as TheoryExample[],
      tips: parsed.tips || [],
      common_mistakes: parsed.common_mistakes || [],
      language: 'fr',
      difficulty_level: skill.difficulty_level || 1,
      estimated_read_time_seconds: Math.round((parsed.concept_explanation?.length || 200) / 3),
      is_validated: false,
    };

    const { data: saved, error } = await supabase
      .from('skill_theory_content')
      .insert(theoryContent)
      .select()
      .single();

    if (error) {
      console.error('[generateTheoryContent] Save error:', error);
      return null;
    }

    return saved as SkillTheoryContent;
  } catch (e) {
    console.error('[generateTheoryContent] Error:', e);
    return null;
  }
}

export async function getOrGenerateTheory(skillId: string): Promise<SkillTheoryContent | null> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('skill_theory_content')
    .select('*')
    .eq('skill_id', skillId)
    .eq('language', 'fr')
    .single();

  if (existing) {
    return existing as SkillTheoryContent;
  }

  return generateTheoryContent(skillId);
}
