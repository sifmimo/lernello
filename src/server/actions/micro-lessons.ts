'use server';

import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import {
  MicroLesson,
  MicroLessonGenerationParams,
  QualityReport,
  QualityCheckResult,
  HookContent,
  DiscoverContent,
  LearnContent,
  PracticeContent,
  ApplyContent,
} from '@/types/micro-lesson';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SUBJECT_PEDAGOGICAL_STYLES: Record<string, {
  approach: string;
  examples: string;
  blockTypes: string;
  manipulationTools: string[];
}> = {
  math: {
    approach: 'Manipulation concrète → Représentation visuelle → Abstraction symbolique',
    examples: 'Problèmes du quotidien (achats, partages, mesures), jeux de logique',
    blockTypes: 'manipulation, calcul_mental, problème_contextualisé, démonstration_visuelle',
    manipulationTools: ['base_ten_blocks', 'number_line', 'fraction_visual', 'balance'],
  },
  french: {
    approach: 'Observation de textes → Découverte de la règle → Application guidée → Production',
    examples: 'Textes courts, dialogues, histoires, jeux de mots',
    blockTypes: 'lecture, vocabulaire, règle_grammaticale, expression_écrite, dictée',
    manipulationTools: ['text_highlighter', 'word_sorting', 'sentence_builder'],
  },
  sciences: {
    approach: 'Observation → Hypothèse → Expérimentation → Conclusion',
    examples: 'Expériences simples, observations nature, phénomènes quotidiens',
    blockTypes: 'observation, expérience, schéma, conclusion_scientifique',
    manipulationTools: ['sorting_area', 'diagram_builder', 'timeline'],
  },
  history: {
    approach: 'Contexte → Source historique → Analyse → Mise en perspective',
    examples: 'Documents d\'époque, frises chronologiques, témoignages',
    blockTypes: 'contexte_historique, analyse_source, frise_chronologique, comparaison',
    manipulationTools: ['timeline', 'map_explorer', 'source_analyzer'],
  },
  informatique: {
    approach: 'Problème → Décomposition → Algorithme → Implémentation → Test',
    examples: 'Robots, recettes, jeux, automatisations quotidiennes',
    blockTypes: 'problème_logique, algorithme, pseudo_code, débogage',
    manipulationTools: ['block_programming', 'flowchart_builder', 'robot_simulator'],
  },
  music: {
    approach: 'Écoute → Reproduction → Création → Performance',
    examples: 'Chansons connues, rythmes corporels, instruments simples',
    blockTypes: 'écoute_active, rythme, mélodie, création_musicale',
    manipulationTools: ['rhythm_tapper', 'note_sequencer', 'audio_recorder'],
  },
};

const AGE_LANGUAGE_ADAPTATIONS: Record<number, {
  sentence_length: string;
  vocabulary: string;
  tone: string;
  examples_type: string;
}> = {
  6: {
    sentence_length: 'Très courtes (5-8 mots)',
    vocabulary: 'Mots simples du quotidien, pas de termes techniques',
    tone: 'Très ludique, beaucoup d\'encouragements, émojis',
    examples_type: 'Jouets, animaux, famille, école',
  },
  7: {
    sentence_length: 'Courtes (8-10 mots)',
    vocabulary: 'Vocabulaire de base, introduction progressive de termes',
    tone: 'Ludique et encourageant',
    examples_type: 'Jeux, animaux, amis, activités quotidiennes',
  },
  8: {
    sentence_length: 'Courtes à moyennes (10-12 mots)',
    vocabulary: 'Vocabulaire enrichi, termes techniques expliqués',
    tone: 'Encourageant avec touches d\'humour',
    examples_type: 'Sports, jeux vidéo, nature, aventures',
  },
  9: {
    sentence_length: 'Moyennes (12-15 mots)',
    vocabulary: 'Vocabulaire varié, termes techniques acceptés',
    tone: 'Motivant, valorisant l\'autonomie',
    examples_type: 'Défis, compétitions, découvertes, créations',
  },
  10: {
    sentence_length: 'Moyennes (12-15 mots)',
    vocabulary: 'Vocabulaire riche, abstractions possibles',
    tone: 'Stimulant intellectuellement',
    examples_type: 'Problèmes réels, projets, innovations',
  },
  11: {
    sentence_length: 'Moyennes à longues (15-18 mots)',
    vocabulary: 'Vocabulaire avancé, concepts abstraits',
    tone: 'Respectueux, valorisant la réflexion',
    examples_type: 'Situations complexes, enjeux sociétaux simplifiés',
  },
  12: {
    sentence_length: 'Variables selon le contexte',
    vocabulary: 'Vocabulaire complet, nuances acceptées',
    tone: 'Mature mais accessible',
    examples_type: 'Cas réels, problématiques actuelles',
  },
};

function getAgeAdaptation(age: number) {
  if (age <= 6) return AGE_LANGUAGE_ADAPTATIONS[6];
  if (age >= 12) return AGE_LANGUAGE_ADAPTATIONS[12];
  return AGE_LANGUAGE_ADAPTATIONS[age] || AGE_LANGUAGE_ADAPTATIONS[9];
}

function buildExpertPrompt(params: MicroLessonGenerationParams): string {
  const subjectStyle = SUBJECT_PEDAGOGICAL_STYLES[params.subject_code] || SUBJECT_PEDAGOGICAL_STYLES['math'];
  const ageAdaptation = getAgeAdaptation(params.student_age);
  const interests = params.student_interests?.join(', ') || 'jeux, animaux, nature, sport';

  return `Tu es un expert en conception pédagogique (Instructional Designer) avec 20 ans d'expérience dans l'éducation primaire et secondaire. Tu crées du contenu de qualité professionnelle comparable à Duolingo et Khan Academy.

=== MISSION ===
Créer une micro-leçon de 3-5 minutes pour la compétence suivante.

=== COMPÉTENCE ===
- Matière : ${params.subject_name}
- Domaine : ${params.domain_name}
- Compétence : ${params.skill_name}
- Description : ${params.skill_description || 'Non spécifiée'}
- Niveau de difficulté : ${params.difficulty}/5
- Prérequis : ${params.prerequisites?.join(', ') || 'Aucun'}

=== APPROCHE PÉDAGOGIQUE POUR ${params.subject_name.toUpperCase()} ===
- Méthode : ${subjectStyle.approach}
- Types d'exemples : ${subjectStyle.examples}
- Outils de manipulation : ${subjectStyle.manipulationTools.join(', ')}

=== PROFIL ÉLÈVE ===
- Âge : ${params.student_age} ans
- Style d'apprentissage : ${params.student_learning_style || 'visuel'}
- Centres d'intérêt : ${interests}

=== ADAPTATION AU LANGAGE (${params.student_age} ans) ===
- Longueur des phrases : ${ageAdaptation.sentence_length}
- Vocabulaire : ${ageAdaptation.vocabulary}
- Ton : ${ageAdaptation.tone}
- Types d'exemples : ${ageAdaptation.examples_type}

=== CONTRAINTES PÉDAGOGIQUES STRICTES ===
1. UN SEUL concept par micro-leçon (pas de surcharge cognitive)
2. Durée totale : 3-5 minutes (180-300 secondes)
3. Progression : Concret → Abstrait → Application
4. Le hook DOIT créer une vraie curiosité (pas générique)
5. La découverte DOIT permettre à l'enfant de trouver lui-même
6. L'explication DOIT utiliser une métaphore concrète
7. Les exercices DOIVENT être progressifs (guidé → autonome)
8. Le contexte d'application DOIT être réaliste pour l'âge

=== STRUCTURE JSON OBLIGATOIRE ===
{
  "title": "Titre court et accrocheur",
  "subtitle": "Sous-titre descriptif",
  "estimated_duration_seconds": 240,
  "difficulty_tier": 1,
  
  "hook": {
    "type": "question|challenge|story|mystery|real_world",
    "text": "Max 2 phrases, doit créer la curiosité",
    "visual_emoji": "Emoji représentatif",
    "interaction": "tap|swipe|none",
    "engagement_hook": "Pourquoi ça intéresse l'enfant"
  },
  
  "discover": {
    "type": "observation|manipulation|exploration",
    "observation_prompt": "Question ouverte pour guider l'observation",
    "guided_discovery": ["étape 1", "étape 2", "étape 3"],
    "aha_moment": "Ce que l'enfant doit découvrir par lui-même",
    "tool": "${subjectStyle.manipulationTools[0]}",
    "visual_aid": "Description de l'aide visuelle"
  },
  
  "learn": {
    "concept_name": "Nom du concept (max 5 mots)",
    "explanation": {
      "simple": "1-2 phrases avec métaphore concrète",
      "standard": "Explication complète et claire",
      "advanced": "Pour approfondissement optionnel"
    },
    "visual_representation": {
      "type": "animation|diagram|illustration",
      "description": "Description détaillée du visuel"
    },
    "key_formula": "Formule ou règle si applicable",
    "mnemonic": "Astuce mnémotechnique si utile",
    "common_mistakes": ["erreur fréquente 1", "erreur fréquente 2"],
    "key_takeaway": "À retenir en 1 phrase"
  },
  
  "practice": {
    "instruction": "Consigne générale",
    "exercises": [
      {
        "type": "guided",
        "question": "Question avec support",
        "input_type": "number|text|select|drag|tap",
        "options": ["option1", "option2", "option3", "option4"],
        "expected_answer": "réponse attendue",
        "scaffolding": "Aide fournie pour cet exercice",
        "hint": "Indice si l'élève bloque",
        "feedback_correct": "Feedback positif spécifique",
        "feedback_incorrect": "Feedback explicatif avec aide"
      },
      {
        "type": "scaffolded",
        "question": "Question avec moins de support",
        "input_type": "number|text|select",
        "expected_answer": "réponse attendue",
        "hint": "Indice",
        "feedback_correct": "Bravo !",
        "feedback_incorrect": "Explication de l'erreur"
      },
      {
        "type": "independent",
        "question": "Question autonome",
        "input_type": "number|text",
        "expected_answer": "réponse attendue",
        "hint": "Dernier recours",
        "feedback_correct": "Excellent travail !",
        "feedback_incorrect": "Aide pour comprendre"
      }
    ]
  },
  
  "apply": {
    "context": "Situation réelle détaillée (min 30 caractères)",
    "challenge": "Le défi à relever",
    "input_type": "number|text|select|free_response",
    "expected_answer": "réponse si applicable",
    "success_criteria": "Comment savoir si c'est réussi",
    "real_world_connection": "Lien avec la vie quotidienne"
  }
}

=== CRITÈRES DE QUALITÉ (score minimum 75/100) ===
- Hook engageant avec vraie question (15 pts)
- Concept unique et clair (20 pts)
- Métaphore concrète dans l'explication simple (15 pts)
- Progression des exercices guidé→autonome (20 pts)
- Feedback personnalisé et explicatif (15 pts)
- Contexte d'application réaliste (15 pts)

Génère UNIQUEMENT le JSON valide, sans commentaires ni markdown.`;
}

function checkQuality(lesson: Partial<MicroLesson>): QualityReport {
  const checks: QualityCheckResult[] = [];
  
  // Check 1: Hook engageant (15 pts)
  const hookCheck: QualityCheckResult = {
    criterion: 'Hook engageant',
    weight: 15,
    pass: false,
    score: 0,
    feedback: '',
  };
  if (lesson.hook) {
    const hasQuestion = lesson.hook.text?.includes('?') || lesson.hook.type === 'question';
    const hasLength = (lesson.hook.text?.length || 0) > 20;
    const hasEmoji = !!lesson.hook.visual_emoji;
    hookCheck.pass = hasQuestion && hasLength;
    hookCheck.score = (hasQuestion ? 50 : 0) + (hasLength ? 30 : 0) + (hasEmoji ? 20 : 0);
    hookCheck.feedback = !hasQuestion ? 'Le hook devrait poser une question intrigante' : 
                         !hasLength ? 'Le hook est trop court' : 'Hook engageant ✓';
  }
  checks.push(hookCheck);

  // Check 2: Concept unique (20 pts)
  const conceptCheck: QualityCheckResult = {
    criterion: 'Concept unique',
    weight: 20,
    pass: false,
    score: 0,
    feedback: '',
  };
  if (lesson.learn) {
    const wordCount = lesson.learn.concept_name?.split(' ').length || 0;
    const hasExplanations = !!lesson.learn.explanation?.simple && !!lesson.learn.explanation?.standard;
    conceptCheck.pass = wordCount <= 5 && hasExplanations;
    conceptCheck.score = (wordCount <= 5 ? 60 : 30) + (hasExplanations ? 40 : 0);
    conceptCheck.feedback = wordCount > 5 ? 'Le nom du concept est trop long (max 5 mots)' :
                           !hasExplanations ? 'Explications manquantes' : 'Concept bien défini ✓';
  }
  checks.push(conceptCheck);

  // Check 3: Métaphore concrète (15 pts)
  const metaphorCheck: QualityCheckResult = {
    criterion: 'Métaphore concrète',
    weight: 15,
    pass: false,
    score: 0,
    feedback: '',
  };
  if (lesson.learn?.explanation?.simple) {
    const hasMetaphor = /comme|c'est|imagine|pense à|ressemble|pareil/i.test(lesson.learn.explanation.simple);
    const hasConcreteExample = lesson.learn.explanation.simple.length > 30;
    metaphorCheck.pass = hasMetaphor || hasConcreteExample;
    metaphorCheck.score = (hasMetaphor ? 70 : 0) + (hasConcreteExample ? 30 : 0);
    metaphorCheck.feedback = !hasMetaphor ? 'Ajouter une métaphore (comme, imagine, pense à...)' : 'Métaphore présente ✓';
  }
  checks.push(metaphorCheck);

  // Check 4: Progression exercices (20 pts)
  const progressionCheck: QualityCheckResult = {
    criterion: 'Progression exercices',
    weight: 20,
    pass: false,
    score: 0,
    feedback: '',
  };
  if (lesson.practice?.exercises) {
    const hasGuided = lesson.practice.exercises.some(e => e.type === 'guided');
    const hasIndependent = lesson.practice.exercises.some(e => e.type === 'independent');
    const hasMultiple = lesson.practice.exercises.length >= 2;
    progressionCheck.pass = hasGuided && hasMultiple;
    progressionCheck.score = (hasGuided ? 40 : 0) + (hasIndependent ? 30 : 0) + (hasMultiple ? 30 : 0);
    progressionCheck.feedback = !hasGuided ? 'Ajouter au moins un exercice guidé' :
                                !hasMultiple ? 'Ajouter plus d\'exercices' : 'Progression correcte ✓';
  }
  checks.push(progressionCheck);

  // Check 5: Feedback personnalisé (15 pts)
  const feedbackCheck: QualityCheckResult = {
    criterion: 'Feedback personnalisé',
    weight: 15,
    pass: false,
    score: 0,
    feedback: '',
  };
  if (lesson.practice?.exercises) {
    const allHaveFeedback = lesson.practice.exercises.every(e => 
      e.feedback_correct && e.feedback_incorrect && 
      e.feedback_correct !== e.feedback_incorrect
    );
    const feedbacksAreDetailed = lesson.practice.exercises.every(e =>
      (e.feedback_incorrect?.length || 0) > 15
    );
    feedbackCheck.pass = allHaveFeedback;
    feedbackCheck.score = (allHaveFeedback ? 60 : 0) + (feedbacksAreDetailed ? 40 : 0);
    feedbackCheck.feedback = !allHaveFeedback ? 'Chaque exercice doit avoir des feedbacks différenciés' :
                            !feedbacksAreDetailed ? 'Les feedbacks incorrects devraient être plus explicatifs' : 'Feedbacks complets ✓';
  }
  checks.push(feedbackCheck);

  // Check 6: Contexte réaliste (15 pts)
  const contextCheck: QualityCheckResult = {
    criterion: 'Contexte réaliste',
    weight: 15,
    pass: false,
    score: 0,
    feedback: '',
  };
  if (lesson.apply) {
    const hasDetailedContext = (lesson.apply.context?.length || 0) > 30;
    const hasChallenge = !!lesson.apply.challenge;
    const hasRealWorld = !!lesson.apply.real_world_connection;
    contextCheck.pass = hasDetailedContext && hasChallenge;
    contextCheck.score = (hasDetailedContext ? 40 : 0) + (hasChallenge ? 30 : 0) + (hasRealWorld ? 30 : 0);
    contextCheck.feedback = !hasDetailedContext ? 'Le contexte d\'application doit être plus détaillé (min 30 car.)' :
                           !hasChallenge ? 'Ajouter un défi clair' : 'Contexte réaliste ✓';
  }
  checks.push(contextCheck);

  // Calculate total score
  const totalScore = checks.reduce((sum, check) => {
    return sum + (check.score * check.weight / 100);
  }, 0);

  // Determine status
  let status: QualityReport['status'];
  if (totalScore < 60) status = 'rejected';
  else if (totalScore < 75) status = 'warning';
  else if (totalScore < 90) status = 'good';
  else status = 'excellent';

  // Generate recommendations
  const recommendations = checks
    .filter(c => !c.pass)
    .map(c => c.feedback);

  return {
    total_score: Math.round(totalScore),
    checks,
    status,
    recommendations,
  };
}

export async function generateMicroLesson(
  params: MicroLessonGenerationParams,
  maxRetries: number = 3
): Promise<{ lesson: MicroLesson | null; quality: QualityReport; error?: string }> {
  const supabase = await createClient();
  
  let lastError: string | undefined;
  let bestLesson: Partial<MicroLesson> | null = null;
  let bestQuality: QualityReport | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const prompt = buildExpertPrompt(params);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en conception pédagogique. Tu génères du JSON valide uniquement.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        lastError = 'Réponse vide de l\'IA';
        continue;
      }

      const parsed = JSON.parse(content);
      
      // Build lesson object
      const lesson: Partial<MicroLesson> = {
        skill_id: params.skill_id,
        order: 1,
        title: parsed.title,
        subtitle: parsed.subtitle,
        estimated_duration_seconds: parsed.estimated_duration_seconds || 240,
        difficulty_tier: parsed.difficulty_tier || 1,
        hook: parsed.hook as HookContent,
        discover: parsed.discover as DiscoverContent,
        learn: parsed.learn as LearnContent,
        practice: parsed.practice as PracticeContent,
        apply: parsed.apply as ApplyContent,
        quality_score: 0,
        review_status: 'draft',
      };

      // Check quality
      const quality = checkQuality(lesson);
      lesson.quality_score = quality.total_score;

      // Keep best attempt
      if (!bestQuality || quality.total_score > bestQuality.total_score) {
        bestLesson = lesson;
        bestQuality = quality;
      }

      // If quality is good enough, stop retrying
      if (quality.status === 'good' || quality.status === 'excellent') {
        break;
      }

      lastError = `Score qualité insuffisant: ${quality.total_score}/100`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Erreur inconnue';
    }
  }

  if (!bestLesson || !bestQuality) {
    return {
      lesson: null,
      quality: {
        total_score: 0,
        checks: [],
        status: 'rejected',
        recommendations: ['Impossible de générer la micro-leçon'],
      },
      error: lastError,
    };
  }

  // Save to database if quality is acceptable
  if (bestQuality.status !== 'rejected') {
    try {
      const { data, error } = await supabase
        .from('micro_lessons')
        .insert({
          skill_id: bestLesson.skill_id,
          order_index: bestLesson.order,
          title: bestLesson.title,
          subtitle: bestLesson.subtitle,
          estimated_duration_seconds: bestLesson.estimated_duration_seconds,
          difficulty_tier: bestLesson.difficulty_tier,
          hook: bestLesson.hook,
          discover: bestLesson.discover,
          learn: bestLesson.learn,
          practice: bestLesson.practice,
          apply: bestLesson.apply,
          quality_score: bestLesson.quality_score,
          review_status: bestLesson.review_status,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving micro-lesson:', error);
      } else if (data) {
        bestLesson.id = data.id;
        bestLesson.created_at = data.created_at;
        bestLesson.updated_at = data.updated_at;
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
    }
  }

  return {
    lesson: bestLesson as MicroLesson,
    quality: bestQuality,
    error: bestQuality.status === 'rejected' ? lastError : undefined,
  };
}

export async function getMicroLessonsForSkill(skillId: string): Promise<MicroLesson[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('micro_lessons')
    .select('*')
    .eq('skill_id', skillId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching micro-lessons:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    skill_id: row.skill_id,
    order: row.order_index,
    title: row.title,
    subtitle: row.subtitle,
    estimated_duration_seconds: row.estimated_duration_seconds,
    difficulty_tier: row.difficulty_tier,
    hook: row.hook as HookContent,
    discover: row.discover as DiscoverContent,
    learn: row.learn as LearnContent,
    practice: row.practice as PracticeContent,
    apply: row.apply as ApplyContent,
    quality_score: row.quality_score,
    review_status: row.review_status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_reviewed_at: row.last_reviewed_at,
  }));
}

export async function getBestMicroLessonForSkill(
  skillId: string,
  studentAge: number,
  learningStyle?: string
): Promise<MicroLesson | null> {
  const lessons = await getMicroLessonsForSkill(skillId);
  
  if (lessons.length === 0) {
    return null;
  }

  // Sort by quality score and filter by review status
  const approvedLessons = lessons.filter(l => l.review_status === 'approved');
  const goodLessons = lessons.filter(l => l.quality_score >= 75);
  
  const candidates = approvedLessons.length > 0 ? approvedLessons : 
                     goodLessons.length > 0 ? goodLessons : lessons;

  // Return the highest quality lesson
  return candidates.sort((a, b) => b.quality_score - a.quality_score)[0];
}

export async function updateMicroLessonQuality(
  lessonId: string,
  qualityScore: number,
  reviewStatus: 'draft' | 'reviewed' | 'approved'
): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('micro_lessons')
    .update({
      quality_score: qualityScore,
      review_status: reviewStatus,
      last_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', lessonId);

  return !error;
}
