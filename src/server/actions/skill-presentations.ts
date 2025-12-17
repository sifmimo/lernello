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

    // Extraire les noms réels (sans les clés de traduction)
    const subjectCode = skill.domains?.subjects?.code || 'math';
    const skillName = skill.name_key?.replace('skills.', '').replace(/_/g, ' ') || skill.code;
    const domainName = skill.domains?.name_key?.replace('domains.', '').replace(/_/g, ' ') || 'général';
    
    // Déterminer le contexte pédagogique selon la matière
    const subjectContexts: Record<string, { name: string; style: string; examples: string; blockTypes: string }> = {
      math: {
        name: 'Mathématiques',
        style: 'logique et progressif, avec manipulation de nombres et visualisation',
        examples: 'calculs concrets (bonbons, billes, argent), problèmes du quotidien',
        blockTypes: 'hook (défi mathématique), concept (règle illustrée), example (calcul guidé étape par étape), practice (mini-calcul), synthesis (formule à retenir)'
      },
      francais: {
        name: 'Français',
        style: 'narratif et expressif, avec lecture et écriture',
        examples: 'histoires courtes, jeux de mots, textes du quotidien (recettes, lettres)',
        blockTypes: 'hook (histoire captivante ou devinette), reading (texte à lire), vocabulary (mots nouveaux), rule (règle de grammaire/orthographe), practice (phrase à compléter), expression (écriture créative)'
      },
      informatique: {
        name: 'Informatique',
        style: 'pratique et interactif, avec des analogies du monde réel',
        examples: 'recettes de cuisine (algorithmes), jeux vidéo, robots',
        blockTypes: 'hook (problème à résoudre), concept (explication avec analogie), demo (code ou pseudo-code), practice (exercice de logique), debug (trouver l\'erreur)'
      },
      sciences: {
        name: 'Sciences',
        style: 'expérimental et observationnel, basé sur la curiosité',
        examples: 'expériences simples, phénomènes naturels, animaux',
        blockTypes: 'hook (question mystère), observation (décrire un phénomène), hypothesis (deviner), experiment (expérience simple), conclusion (ce qu\'on a appris)'
      },
      histoire: {
        name: 'Histoire',
        style: 'narratif et chronologique, avec des personnages et événements',
        examples: 'vie quotidienne d\'époque, personnages historiques, objets anciens',
        blockTypes: 'hook (voyage dans le temps), context (situer l\'époque), story (récit historique), characters (personnages clés), legacy (impact aujourd\'hui)'
      }
    };
    
    const subjectContext = subjectContexts[subjectCode] || subjectContexts.math;
    
    // Templates de présentation selon le profil de matière
    const presentationTemplates = subjectProfile?.default_presentation_templates || [];
    const selectedTemplate = presentationTemplates[0] || { blocks: ['hook', 'concept', 'example', 'practice', 'synthesis'] };

    // Générer les blocs de contenu avec GPT-4o
    const prompt = `Tu es un expert en pédagogie pour enfants. Génère une présentation de compétence ADAPTÉE À LA MATIÈRE.

=== CONTEXTE ===
MATIÈRE: ${subjectContext.name}
COMPÉTENCE: ${skillName}
DOMAINE: ${domainName}
TYPE DE CONNAISSANCE: ${subjectProfile?.knowledge_type || 'procédural'}
MODALITÉ PRINCIPALE: ${subjectProfile?.primary_modality || 'visuel'}

=== STYLE PÉDAGOGIQUE POUR CETTE MATIÈRE ===
Approche: ${subjectContext.style}
Exemples typiques: ${subjectContext.examples}
Types de blocs recommandés: ${subjectContext.blockTypes}

=== PROFIL ÉLÈVE ===
- Âge: ${studentProfile.age} ans
- Style d'apprentissage: ${studentProfile.learning_style || 'visuel'}
- Centres d'intérêt: ${(studentProfile.interests || []).join(', ') || 'jeux, animaux, nature'}

=== MÉTHODE ===
Méthode: ${method?.name || 'Traditionnelle'}
Type: ${presentationType}

=== STRUCTURE DEMANDÉE ===
Génère exactement 4-5 blocs adaptés à ${subjectContext.name}. Chaque bloc:
{
  "type": "hook|concept|example|practice|synthesis|reading|vocabulary|rule|expression|observation|experiment",
  "format": "text|story|visual|guided|mnemonic|challenge|scenario|interactive",
  "content": {
    "title": "Titre court",
    "text": "Contenu principal adapté à l'âge",
    "visual_hint": "Description d'illustration ou emoji",
    "character": "lumi",
    "emotion": "curious|excited|thinking|encouraging"
  }
}

=== RÈGLES IMPORTANTES ===
1. ADAPTE LE CONTENU À LA MATIÈRE ${subjectContext.name.toUpperCase()}
2. Utilise le vocabulaire et les exemples propres à cette matière
3. Langage simple pour un enfant de ${studentProfile.age} ans
4. Sois engageant avec des émojis et un ton encourageant
5. Pour le Français: inclus des textes à lire, du vocabulaire
6. Pour les Maths: inclus des calculs, des manipulations
7. Pour l'Informatique: inclus de la logique, des algorithmes simples

Réponds UNIQUEMENT avec un objet JSON: {"blocks": [...]}`;

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
