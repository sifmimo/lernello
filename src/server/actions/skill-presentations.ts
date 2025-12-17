'use server';

import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { SkillPresentation, ContentBlock, PedagogicalApproach, PresentationType } from '@/types/skill-presentation';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import { LearningStyle } from '@/types/skill-presentation';

interface StudentProfile {
  age: number;
  learning_style?: LearningStyle;
  interests?: string[];
  preferred_method?: string;
  energy_level?: 'low' | 'medium' | 'high';
  time_available_minutes?: number;
}

interface GeneratePresentationParams {
  skillId: string;
  studentProfile: StudentProfile;
  language?: string;
}

export async function generateSkillPresentation({
  skillId,
  studentProfile,
  language = 'fr',
}: GeneratePresentationParams): Promise<{ success: boolean; presentation?: SkillPresentation; error?: string }> {
  try {
    const supabase = await createClient();

    // Récupérer les infos de la compétence
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select(`
        *,
        domains!inner(
          *,
          subjects!inner(*)
        )
      `)
      .eq('id', skillId)
      .single();

    if (skillError || !skill) {
      return { success: false, error: 'Compétence non trouvée' };
    }

    // Récupérer le profil de la matière
    const { data: subjectProfile } = await supabase
      .from('subject_profiles')
      .select('*')
      .eq('subject_id', skill.domains.subject_id)
      .single();

    // Récupérer la méthode pédagogique préférée
    const methodCode = studentProfile.preferred_method || 'traditional';
    const { data: method } = await supabase
      .from('pedagogical_methods')
      .select('*')
      .eq('code', methodCode)
      .single();

    // Déterminer le type de présentation basé sur le profil
    let presentationType: PresentationType = 'direct';
    if (studentProfile.age <= 8) {
      presentationType = 'story';
    } else if (methodCode === 'game_based') {
      presentationType = 'game';
    } else if (methodCode === 'problem_based') {
      presentationType = 'discovery';
    }

    // Générer les blocs de contenu avec GPT-4o
    const prompt = `Tu es un expert en pédagogie. Génère une présentation de compétence structurée en blocs JSON.

COMPÉTENCE: ${skill.name_key}
DESCRIPTION: ${skill.description_key || 'Non spécifiée'}
MATIÈRE: ${skill.domains?.subjects?.name_key || 'Mathématiques'}
DOMAINE: ${skill.domains?.name_key || 'Général'}

PROFIL ÉLÈVE:
- Âge: ${studentProfile.age} ans
- Style d'apprentissage: ${studentProfile.learning_style || 'visuel'}
- Centres d'intérêt: ${(studentProfile.interests || []).join(', ') || 'Non spécifiés'}

MÉTHODE PÉDAGOGIQUE: ${method?.name_key || 'Traditionnelle'}
TYPE DE PRÉSENTATION: ${presentationType}

Génère exactement 5-7 blocs de contenu. Chaque bloc doit avoir cette structure:
{
  "type": "hook|concept|example|practice|synthesis|real_world|metacognition|extension",
  "format": "text|story|visual|guided|mnemonic|scenario|self_check",
  "content": {
    // Contenu spécifique au type
  }
}

TYPES DE BLOCS À INCLURE:
1. hook (accroche) - Capturer l'attention avec une histoire ou question
2. concept - Expliquer le concept principal
3. example - Exemple guidé étape par étape
4. practice - Mini-exercice pour vérifier
5. synthesis - Résumé mémorisable
6. real_world - Application dans la vie réelle
7. metacognition (optionnel) - Réflexion sur l'apprentissage

RÈGLES:
- Adapte le langage à l'âge de l'élève
- Utilise des exemples concrets liés à ses intérêts si possible
- Sois engageant et encourageant
- Inclus des éléments visuels (emoji, descriptions d'images)

Réponds UNIQUEMENT avec un tableau JSON valide de blocs, sans explication.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Tu es un expert en pédagogie différenciée. Tu génères du contenu éducatif structuré en JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content || '{"blocks":[]}';
    let blocks: ContentBlock[] = [];
    
    try {
      const parsed = JSON.parse(responseText);
      blocks = parsed.blocks || parsed;
      if (!Array.isArray(blocks)) {
        blocks = [blocks];
      }
    } catch {
      console.error('Failed to parse AI response:', responseText);
      return { success: false, error: 'Erreur de parsing de la réponse IA' };
    }

    // Créer la présentation en base de données
    const presentationData = {
      skill_id: skillId,
      presentation_type: presentationType,
      target_profile: {
        age_range: [Math.max(6, studentProfile.age - 1), studentProfile.age + 1],
        learning_style: studentProfile.learning_style,
        interests: studentProfile.interests,
      },
      content_blocks: blocks,
      language,
      pedagogical_approach: methodCode as PedagogicalApproach,
      estimated_duration_minutes: Math.max(10, blocks.length * 3),
      is_ai_generated: true,
      is_default: false,
      is_active: true,
    };

    const { data: presentation, error: insertError } = await supabase
      .from('skill_presentations')
      .insert(presentationData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true, presentation: presentation as SkillPresentation };
  } catch (error) {
    console.error('Generate presentation error:', error);
    return { success: false, error: 'Erreur lors de la génération' };
  }
}

export async function getSkillPresentations(skillId: string): Promise<SkillPresentation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('skill_presentations')
    .select('*')
    .eq('skill_id', skillId)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('effectiveness_score', { ascending: false });

  if (error) {
    console.error('Error fetching presentations:', error);
    return [];
  }

  return (data || []) as SkillPresentation[];
}

export async function getOrCreatePresentation(
  skillId: string,
  studentProfile: StudentProfile,
  language = 'fr'
): Promise<{ success: boolean; presentation?: SkillPresentation; isNew?: boolean; error?: string }> {
  // D'abord chercher une présentation existante adaptée
  const presentations = await getSkillPresentations(skillId);
  
  if (presentations.length > 0) {
    // Importer dynamiquement le sélecteur pour éviter les problèmes de module
    const { selectBestPresentation } = await import('@/components/skill-presentation/PresentationSelector');
    
    const best = selectBestPresentation(presentations, studentProfile);
    if (best && best.score > 30) {
      return { success: true, presentation: best.presentation, isNew: false };
    }
  }

  // Sinon, générer une nouvelle présentation
  const result = await generateSkillPresentation({ skillId, studentProfile, language });
  
  if (result.success && result.presentation) {
    return { success: true, presentation: result.presentation, isNew: true };
  }

  // Fallback sur la présentation par défaut si elle existe
  const defaultPresentation = presentations.find(p => p.is_default);
  if (defaultPresentation) {
    return { success: true, presentation: defaultPresentation, isNew: false };
  }

  return { success: false, error: result.error || 'Aucune présentation disponible' };
}

export async function updatePresentationScore(
  presentationId: string,
  engagement: number,
  effectiveness: number
): Promise<void> {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from('skill_presentations')
    .select('engagement_score, effectiveness_score')
    .eq('id', presentationId)
    .single();

  if (current) {
    // Moyenne mobile pondérée
    const newEngagement = current.engagement_score * 0.7 + engagement * 0.3;
    const newEffectiveness = current.effectiveness_score * 0.7 + effectiveness * 0.3;

    await supabase
      .from('skill_presentations')
      .update({
        engagement_score: newEngagement,
        effectiveness_score: newEffectiveness,
      })
      .eq('id', presentationId);
  }
}
