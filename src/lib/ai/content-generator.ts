'use server';

import { createClient } from '@/lib/supabase/server';
import { createAICompletion, AIProvider, AIModel } from './providers';
import { calculateNextReview, qualityFromCorrectness, SpacedRepetitionData } from '@/lib/spaced-repetition';

export type ExerciseType = 'qcm' | 'fill_blank' | 'drag_drop' | 'free_input';

interface GenerationConfig {
  skillId: string;
  skillName: string;
  skillDescription: string;
  difficulty: number;
  language: string;
  pedagogicalMethod: string;
  targetAge: number;
  exerciseType?: ExerciseType;
}

interface GeneratedExercise {
  type: ExerciseType;
  content: {
    question: string;
    options?: string[];
    correct?: number;
    answer?: string;
    blanks?: string[];
    text?: string;
    items?: string[];
    correctOrder?: number[];
    hint?: string;
  };
  difficulty: number;
}

async function getModelForSubject(skillId: string): Promise<{ model: AIModel; provider: string } | null> {
  const supabase = await createClient();
  
  // Récupérer le modèle IA de la matière via la compétence
  const { data: skillData } = await supabase
    .from('skills')
    .select('id, domain_id')
    .eq('id', skillId)
    .single();
  
  if (!skillData?.domain_id) return null;
  
  // Récupérer le domaine et la matière
  const { data: domainData } = await supabase
    .from('domains')
    .select('id, subject_id')
    .eq('id', skillData.domain_id)
    .single();
  
  if (!domainData?.subject_id) return null;
  
  // Récupérer la matière avec son modèle IA
  const { data: subjectData } = await supabase
    .from('subjects')
    .select('id, ai_model_id')
    .eq('id', domainData.subject_id)
    .single();
  
  if (!subjectData?.ai_model_id) return null;
  
  // Récupérer les détails du modèle
  const { data: modelConfig } = await supabase
    .from('ai_model_config')
    .select('model_name, provider')
    .eq('id', subjectData.ai_model_id)
    .single();
  
  if (!modelConfig) return null;
  
  return {
    model: modelConfig.model_name as AIModel,
    provider: modelConfig.provider,
  };
}

async function getModelForTask(taskType: string, skillId?: string): Promise<{ model: AIModel; maxTokens: number; temperature: number; provider?: string }> {
  const supabase = await createClient();
  
  // Si un skillId est fourni, essayer de récupérer le modèle de la matière
  if (skillId) {
    const subjectModel = await getModelForSubject(skillId);
    if (subjectModel) {
      return {
        model: subjectModel.model,
        maxTokens: 2000,
        temperature: 0.7,
        provider: subjectModel.provider,
      };
    }
  }
  
  // Récupérer les réglages globaux
  const { data: settings } = await supabase
    .from('ai_settings')
    .select('key, value');
  
  const globalSettings: Record<string, unknown> = {};
  settings?.forEach(s => {
    try {
      globalSettings[s.key] = JSON.parse(s.value);
    } catch {
      globalSettings[s.key] = s.value;
    }
  });

  const defaultModel = (globalSettings.default_model as string) || 'gpt-4o';
  const maxTokensGlobal = (globalSettings.max_tokens_per_request as number) || 2000;

  // Récupérer le modèle par défaut depuis ai_model_config
  const { data: modelConfig } = await supabase
    .from('ai_model_config')
    .select('model_name')
    .eq('is_default', true)
    .eq('is_active', true)
    .single();

  const activeDefaultModel = modelConfig?.model_name || defaultModel;

  // Defaults par type de tâche
  const defaults: Record<string, { model: AIModel; maxTokens: number; temperature: number }> = {
    exercise_generation: { model: activeDefaultModel as AIModel, maxTokens: maxTokensGlobal, temperature: 0.7 },
    hint: { model: 'gpt-4o-mini' as AIModel, maxTokens: 200, temperature: 0.5 },
    encouragement: { model: 'gpt-4o-mini' as AIModel, maxTokens: 100, temperature: 0.8 },
    explanation: { model: 'gpt-4o-mini' as AIModel, maxTokens: 500, temperature: 0.6 },
    evaluation: { model: 'gpt-4o-mini' as AIModel, maxTokens: 100, temperature: 0.3 },
    subject_generation: { model: activeDefaultModel as AIModel, maxTokens: maxTokensGlobal, temperature: 0.7 },
  };

  return defaults[taskType] || defaults.exercise_generation;
}

function getExerciseTypePrompt(type: ExerciseType): string {
  const prompts: Record<ExerciseType, string> = {
    qcm: `Type: QCM (Question à Choix Multiple)
Format JSON requis:
{
  "type": "qcm",
  "content": {
    "question": "La question posée",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "hint": "Un indice pour aider"
  }
}
- "correct" est l'index (0-3) de la bonne réponse
- Exactement 4 options`,

    fill_blank: `Type: Texte à trous
Format JSON requis:
{
  "type": "fill_blank",
  "content": {
    "question": "Complète les trous",
    "text": "Le nombre ___ vient après ___",
    "blanks": ["5", "4"],
    "hint": "Un indice pour aider"
  }
}
- Les trous sont représentés par ___
- "blanks" contient les réponses dans l'ordre`,

    drag_drop: `Type: Glisser-déposer / Ordonner
Format JSON requis:
{
  "type": "drag_drop",
  "content": {
    "question": "Range les nombres du plus petit au plus grand",
    "items": ["3", "1", "5", "2", "4"],
    "correctOrder": [1, 3, 0, 4, 2],
    "hint": "Un indice pour aider"
  }
}
RÈGLES STRICTES pour correctOrder:
- "items" contient les éléments dans un ordre mélangé
- "correctOrder" est un tableau d'INDICES NUMÉRIQUES (0, 1, 2, 3, 4...)
- Chaque indice représente la position de l'élément de "items" dans l'ordre correct
- Exemple: si items = ["C", "A", "B"] et l'ordre correct est A, B, C
  alors correctOrder = [1, 2, 0] (A est à l'index 1, B à l'index 2, C à l'index 0)
- JAMAIS de texte dans correctOrder, UNIQUEMENT des nombres`,

    free_input: `Type: Réponse libre
Format JSON requis:
{
  "type": "free_input",
  "content": {
    "question": "Combien font 3 + 4 ?",
    "answer": "7",
    "acceptedAnswers": ["7", "sept", "7.0"],
    "hint": "Un indice pour aider",
    "useAIEvaluation": true
  }
}
- "answer" est la réponse principale attendue
- "acceptedAnswers" est un tableau de réponses alternatives acceptées (synonymes, variantes)
- "useAIEvaluation": true permet une évaluation flexible par IA pour les réponses sémantiquement correctes`,
  };

  return prompts[type];
}

function getPedagogicalStylePrompt(method: string, age: number): string {
  const styles: Record<string, string> = {
    montessori: `Style Montessori:
- Utilise des objets concrets et manipulables
- Encourage l'auto-correction
- Progression du concret vers l'abstrait
- Langage simple et précis`,
    
    standard: `Style classique:
- Explications claires et structurées
- Exemples progressifs
- Vocabulaire adapté à l'âge`,
    
    playful: `Style ludique:
- Utilise des personnages ou histoires
- Contexte amusant et engageant
- Récompenses verbales encourageantes`,
    
    visual: `Style visuel:
- Décrit des images ou schémas
- Utilise des représentations graphiques
- Couleurs et formes mentionnées`,
  };

  let ageStyle = '';
  if (age <= 6) {
    ageStyle = '\n- Phrases très courtes (max 10 mots)\n- Vocabulaire de base\n- Nombres petits (1-20)';
  } else if (age <= 8) {
    ageStyle = '\n- Phrases courtes\n- Vocabulaire simple\n- Contextes familiers (école, maison, jeux)';
  } else if (age <= 10) {
    ageStyle = '\n- Phrases de longueur moyenne\n- Vocabulaire enrichi\n- Contextes variés';
  } else {
    ageStyle = '\n- Phrases complètes\n- Vocabulaire soutenu\n- Contextes abstraits possibles';
  }

  return (styles[method] || styles.standard) + ageStyle;
}

export async function generateExerciseWithAI(config: GenerationConfig): Promise<GeneratedExercise | null> {
  console.log('[generateExerciseWithAI] Starting for skill:', config.skillName);
  const supabase = await createClient();
  const startTime = Date.now();
  
  // Déterminer le type d'exercice - varier les types
  const exerciseTypes: ExerciseType[] = ['qcm', 'fill_blank', 'free_input'];
  const selectedType = config.exerciseType || exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];
  
  // Récupérer les exercices existants pour éviter les doublons
  const { data: existingExercises } = await supabase
    .from('exercises')
    .select('content')
    .eq('skill_id', config.skillId)
    .limit(10);
  
  const existingQuestions = existingExercises?.map(e => {
    const content = e.content as Record<string, unknown>;
    return content.question || content.text || '';
  }).filter(q => q).join('\n- ') || '';
  
  const avoidDuplicatesPrompt = existingQuestions 
    ? `\n\nATTENTION: Génère un exercice COMPLÈTEMENT DIFFÉRENT. Questions déjà utilisées (NE PAS RÉPÉTER):\n- ${existingQuestions}`
    : '';
  
  // Construire le prompt simplifié
  const systemPrompt = `Tu es un expert en pédagogie. Génère un exercice éducatif en JSON uniquement.

RÈGLES:
1. Réponds UNIQUEMENT avec du JSON valide
2. Contenu en français
3. Adapté pour un enfant de ${config.targetAge} ans
4. VARIE les questions - chaque exercice doit être unique

${getExerciseTypePrompt(selectedType)}`;

  const userPrompt = `Génère un exercice ${selectedType.toUpperCase()} UNIQUE pour: ${config.skillName}
${config.skillDescription ? `Description: ${config.skillDescription}` : ''}
${avoidDuplicatesPrompt}

JSON uniquement:`;

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('[generateExerciseWithAI] No OPENAI_API_KEY configured');
      return null;
    }

    console.log('[generateExerciseWithAI] Calling OpenAI gpt-4o-mini');
    
    const result = await createAICompletion('openai', apiKey, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'gpt-4o-mini',
      temperature: 0.9,
      maxTokens: 800,
    });

    console.log('[generateExerciseWithAI] AI response received, length:', result.content?.length);

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[generateExerciseWithAI] No JSON in response:', result.content?.substring(0, 200));
      return null;
    }

    const exercise = JSON.parse(jsonMatch[0]) as GeneratedExercise;
    exercise.difficulty = config.difficulty;
    exercise.type = exercise.type || selectedType;
    console.log('[generateExerciseWithAI] Success, type:', exercise.type);

    // Log generation (ignore errors)
    const generationTime = Date.now() - startTime;
    void supabase.from('ai_generation_logs').insert({
      skill_id: config.skillId,
      model_used: 'gpt-4o-mini',
      tokens_input: result.usage?.promptTokens || 0,
      tokens_output: result.usage?.completionTokens || 0,
      generation_time_ms: generationTime,
      success: true,
    });

    return exercise;
  } catch (error) {
    console.error('[generateExerciseWithAI] Error:', error);
    return null;
  }
}

export interface ExerciseQuotaInfo {
  totalExercises: number;
  maxExercises: number;
  usePlatformTokens: boolean;
  limitReached: boolean;
}

export async function getOrCreateExercise(
  skillId: string,
  studentId: string,
  language: string = 'fr',
  pedagogicalMethod: string = 'standard'
): Promise<{ exercise: GeneratedExercise & { id: string }; isNew: boolean; quotaInfo?: ExerciseQuotaInfo } | null> {
  const supabase = await createClient();

  console.log('[getOrCreateExercise] Starting for skill:', skillId, 'student:', studentId);

  // Récupérer les infos de la compétence
  const { data: skill, error: skillError } = await supabase
    .from('skills')
    .select('id, code, name_key, description_key, difficulty_level')
    .eq('id', skillId)
    .single();

  console.log('[getOrCreateExercise] Skill data:', skill, 'error:', skillError);

  if (!skill) {
    console.error('[getOrCreateExercise] Skill not found for id:', skillId);
    return null;
  }

  // Récupérer le niveau de l'élève pour cette compétence (table existante)
  const { data: progressData } = await supabase
    .from('student_skill_progress')
    .select('mastery_level, attempts_count, correct_count')
    .eq('student_id', studentId)
    .eq('skill_id', skillId)
    .single();

  // Vision V2 Section 12.2: Parcours adaptatif avec alternance consolidation/défi
  const correctRate = progressData ? (progressData.correct_count / Math.max(1, progressData.attempts_count)) : 0.5;
  const attemptsCount = progressData?.attempts_count || 0;
  
  // Alternance consolidation (70%) / défi (30%) pour éviter la sur-adaptation
  const isConsolidationPhase = Math.random() < 0.7;
  let recommendedDifficulty: number;
  
  if (isConsolidationPhase) {
    // Consolidation: difficulté adaptée au niveau actuel
    recommendedDifficulty = Math.min(5, Math.max(1, Math.round(correctRate * 5)));
  } else {
    // Défi: difficulté légèrement supérieure pour pousser l'apprenant
    const baseDifficulty = Math.round(correctRate * 5);
    recommendedDifficulty = Math.min(5, Math.max(1, baseDifficulty + 1));
  }

  // Récupérer le profil de l'élève pour l'âge
  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('birth_year')
    .eq('id', studentId)
    .single();

  const currentYear = new Date().getFullYear();
  const targetAge = studentProfile?.birth_year 
    ? Math.max(6, Math.min(12, currentYear - studentProfile.birth_year))
    : 8;

  // Chercher TOUS les exercices validés pour cette compétence
  const { data: allExercises } = await supabase
    .from('exercises')
    .select('id, type, content, difficulty')
    .eq('skill_id', skillId)
    .eq('is_validated', true)
    .order('difficulty', { ascending: true });

  // Récupérer les exercices récemment faits par l'élève (dernières 24h pour éviter répétition immédiate)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentAttempts } = await supabase
    .from('exercise_attempts')
    .select('exercise_id')
    .eq('student_id', studentId)
    .gte('created_at', oneDayAgo);

  const recentIds = new Set(recentAttempts?.map(a => a.exercise_id) || []);

  // Filtrer les exercices non récemment tentés
  const availableExercises = allExercises?.filter(e => !recentIds.has(e.id)) || [];
  const totalExercises = allExercises?.length || 0;

  // Vision V2 Section 11: Limite de 10 exercices par compétence via tokens plateforme
  const MAX_EXERCISES_PER_SKILL = 10;
  const canGenerateWithPlatformTokens = totalExercises < MAX_EXERCISES_PER_SKILL;
  
  // Préparer les informations de quota pour l'affichage utilisateur
  const quotaInfo: ExerciseQuotaInfo = {
    totalExercises,
    maxExercises: MAX_EXERCISES_PER_SKILL,
    usePlatformTokens: canGenerateWithPlatformTokens,
    limitReached: !canGenerateWithPlatformTokens,
  };

  // Vision V2 Section 11: Toujours générer un nouvel exercice tant que le quota de 10 n'est pas atteint
  // Cela garantit la variété maximale des exercices (jusqu'à 10 différents)
  const shouldGenerateNew = canGenerateWithPlatformTokens;

  console.log(`[getOrCreateExercise] availableExercises: ${availableExercises.length}, totalExercises: ${totalExercises}, shouldGenerateNew: ${shouldGenerateNew}, canGenerate: ${canGenerateWithPlatformTokens}`);

  if (shouldGenerateNew) {
    console.log(`[AI] Génération d'un nouvel exercice: ${availableExercises.length} disponibles, ${totalExercises}/${MAX_EXERCISES_PER_SKILL} total`);
    
    // Tenter de générer un nouvel exercice avec l'IA
    try {
      const generatedExercise = await generateExerciseWithAI({
        skillId: skill.id,
        skillName: skill.name_key,
        skillDescription: skill.description_key || '',
        difficulty: recommendedDifficulty,
        language,
        pedagogicalMethod,
        targetAge,
      });

      if (generatedExercise) {
        
        // Sauvegarder l'exercice généré en base
        const { data: savedExercise, error } = await supabase
          .from('exercises')
          .insert({
            skill_id: skillId,
            type: generatedExercise.type,
            content: generatedExercise.content,
            difficulty: generatedExercise.difficulty,
            is_ai_generated: true,
            is_validated: true,
          })
          .select('id, type, content, difficulty')
          .single();

        if (error) {
          if (process.env.NODE_ENV === 'development') console.error(`[AI] Erreur sauvegarde exercice:`, error);
        }

        if (!error && savedExercise) {
          return {
            exercise: savedExercise as GeneratedExercise & { id: string },
            isNew: true,
            quotaInfo: { ...quotaInfo, totalExercises: totalExercises + 1 },
          };
        }
      }
    } catch (aiError) {
      console.error('[AI] Erreur génération exercice:', aiError);
    }
  }

  // Prioriser les exercices par difficulté adaptée
  const prioritizedExercises = availableExercises.sort((a, b) => {
    const diffA = Math.abs(a.difficulty - recommendedDifficulty);
    const diffB = Math.abs(b.difficulty - recommendedDifficulty);
    if (diffA !== diffB) return diffA - diffB;
    return Math.random() - 0.5; // Randomiser si même priorité
  });

  if (prioritizedExercises.length > 0) {
    // Prendre un exercice parmi les 3 meilleurs candidats pour varier
    const topCandidates = prioritizedExercises.slice(0, Math.min(3, prioritizedExercises.length));
    const randomExercise = topCandidates[Math.floor(Math.random() * topCandidates.length)];
    return {
      exercise: randomExercise as GeneratedExercise & { id: string },
      isNew: false,
      quotaInfo,
    };
  }

  // Fallback: Si tous les exercices ont été faits récemment et génération échouée
  if (allExercises && allExercises.length > 0) {
    const randomExercise = allExercises[Math.floor(Math.random() * allExercises.length)];
    return {
      exercise: randomExercise as GeneratedExercise & { id: string },
      isNew: false,
      quotaInfo,
    };
  }

  // Aucun exercice en base, tenter de générer avec l'IA
  console.log('[getOrCreateExercise] No exercises in DB, generating with AI for skill:', skill.name_key);
  try {
    const generatedExercise = await generateExerciseWithAI({
      skillId: skill.id,
      skillName: skill.name_key,
      skillDescription: skill.description_key || '',
      difficulty: recommendedDifficulty,
      language,
      pedagogicalMethod,
      targetAge,
    });

    console.log('[getOrCreateExercise] AI generation result:', generatedExercise ? 'success' : 'null');

    if (!generatedExercise) {
      console.error('[getOrCreateExercise] AI generation returned null');
      return null;
    }

    // Tenter de sauvegarder l'exercice généré en base
    const { data: savedExercise, error } = await supabase
      .from('exercises')
      .insert({
        skill_id: skillId,
        type: generatedExercise.type,
        content: generatedExercise.content,
        difficulty: generatedExercise.difficulty,
        is_ai_generated: true,
        is_validated: true,
      })
      .select('id, type, content, difficulty')
      .single();

    if (error) {
      console.error('Error saving generated exercise (RLS?):', error);
      return {
        exercise: {
          id: `temp-${Date.now()}`,
          ...generatedExercise,
        } as GeneratedExercise & { id: string },
        isNew: true,
        quotaInfo: { ...quotaInfo, totalExercises: 1 },
      };
    }

    return {
      exercise: savedExercise as GeneratedExercise & { id: string },
      isNew: true,
      quotaInfo: { ...quotaInfo, totalExercises: 1 },
    };
  } catch (error) {
    console.error('Error generating exercise:', error);
    return null;
  }
}

export async function evaluateAndGetNextExercise(
  studentId: string,
  currentSkillId: string,
  wasCorrect: boolean,
  timeSpentSeconds: number,
  hintsUsed: number
): Promise<{ nextSkillId: string; nextExercise: GeneratedExercise & { id: string }; reason: string } | null> {
  const supabase = await createClient();

  // Récupérer les stats depuis student_skill_progress
  const { data: progressList } = await supabase
    .from('student_skill_progress')
    .select('id, attempts_count, correct_count, mastery_level, current_streak, best_streak, skill_level')
    .eq('student_id', studentId)
    .eq('skill_id', currentSkillId)
    .limit(1);

  const progressData = progressList?.[0] || null;
  const exercisesCompleted = progressData?.attempts_count || 0;
  const correctRate = progressData ? (progressData.correct_count / Math.max(1, progressData.attempts_count)) : 0;

  // Calculer la qualité de la réponse pour la répétition espacée
  const quality = qualityFromCorrectness(wasCorrect, timeSpentSeconds * 1000, hintsUsed);
  
  // Calculer les données de répétition espacée
  const currentSpacedData: SpacedRepetitionData | null = progressData ? {
    interval: 1,
    easeFactor: 2.5,
    repetitions: progressData.correct_count || 0,
    nextReviewDate: new Date(),
  } : null;
  
  const spacedResult = calculateNextReview(currentSpacedData, quality);

  // Mettre à jour la progression avec les données de répétition espacée
  const newAttempts = exercisesCompleted + 1;
  const newCorrect = (progressData?.correct_count || 0) + (wasCorrect ? 1 : 0);
  const newMastery = Math.round((newCorrect / newAttempts) * 100);
  const newStreak = wasCorrect ? (progressData?.current_streak || 0) + 1 : 0;
  const bestStreak = Math.max(newStreak, progressData?.best_streak || 0);

  if (progressData) {
    const { error: updateError } = await supabase
      .from('student_skill_progress')
      .update({
        attempts_count: newAttempts,
        correct_count: newCorrect,
        mastery_level: newMastery,
        current_streak: newStreak,
        best_streak: bestStreak,
        last_attempt_at: new Date().toISOString(),
      })
      .eq('id', progressData.id);
    
    if (updateError) {
      console.error('Error updating progress:', updateError);
    }
  } else {
    const { error: insertError } = await supabase.from('student_skill_progress').insert({
      student_id: studentId,
      skill_id: currentSkillId,
      attempts_count: 1,
      correct_count: wasCorrect ? 1 : 0,
      mastery_level: wasCorrect ? 100 : 0,
      current_streak: wasCorrect ? 1 : 0,
      best_streak: wasCorrect ? 1 : 0,
      last_attempt_at: new Date().toISOString(),
    });
    
    if (insertError) {
      console.error('Error inserting progress:', insertError);
    }
  }

  // Système de niveaux gamifié (1-5 étoiles)
  // Niveau 1: 0-20% maîtrise (3 exercices corrects)
  // Niveau 2: 20-40% maîtrise (6 exercices corrects)
  // Niveau 3: 40-60% maîtrise (10 exercices corrects)
  // Niveau 4: 60-80% maîtrise (15 exercices corrects)
  // Niveau 5: 80-100% maîtrise (20 exercices corrects) = Compétence maîtrisée
  
  const currentLevel = progressData?.skill_level || 1;
  let newLevel = currentLevel;
  let levelUp = false;
  let skillMastered = false;
  
  // Calculer le nouveau niveau basé sur le nombre de bonnes réponses
  if (newCorrect >= 20 && newMastery >= 80) {
    newLevel = 5;
    skillMastered = true;
  } else if (newCorrect >= 15 && newMastery >= 60) {
    newLevel = 4;
  } else if (newCorrect >= 10 && newMastery >= 40) {
    newLevel = 3;
  } else if (newCorrect >= 6 && newMastery >= 20) {
    newLevel = 2;
  } else if (newCorrect >= 3) {
    newLevel = 1;
  }
  
  levelUp = newLevel > currentLevel;
  
  // Mettre à jour le niveau dans la progression
  if (levelUp || skillMastered) {
    await supabase
      .from('student_skill_progress')
      .update({ 
        skill_level: newLevel,
        mastered_at: skillMastered ? new Date().toISOString() : null
      })
      .eq('student_id', studentId)
      .eq('skill_id', currentSkillId);
  }

  // Logique de progression adaptative
  let nextSkillId = currentSkillId;
  let reason = '';

  // Si compétence maîtrisée (niveau 5), déverrouiller et passer à la suivante
  if (skillMastered) {
    const { data: currentSkill } = await supabase
      .from('skills')
      .select('domain_id, sort_order, name_key')
      .eq('id', currentSkillId)
      .single();

    if (currentSkill) {
      const { data: nextSkillList } = await supabase
        .from('skills')
        .select('id, name_key')
        .eq('domain_id', currentSkill.domain_id)
        .gt('sort_order', currentSkill.sort_order)
        .order('sort_order', { ascending: true })
        .limit(1);

      if (nextSkillList?.[0]) {
        // Déverrouiller la compétence suivante
        await supabase.from('student_unlocked_skills').upsert({
          student_id: studentId,
          skill_id: nextSkillList[0].id,
          unlocked_by_skill_id: currentSkillId,
        }, { onConflict: 'student_id,skill_id' });
        
        nextSkillId = nextSkillList[0].id;
        reason = `🏆 Compétence maîtrisée ! Nouvelle compétence débloquée !`;
      } else {
        reason = '🎉 Félicitations ! Tu as terminé toutes les compétences de ce domaine !';
      }
    }
  } else if (levelUp) {
    reason = `⭐ Niveau ${newLevel} atteint ! Continue pour débloquer le niveau suivant !`;
  } else if (correctRate < 0.4 && newAttempts >= 3) {
    reason = 'Continuons à pratiquer cette compétence ensemble.';
  } else if (newStreak >= 3) {
    reason = `🔥 Série de ${newStreak} bonnes réponses ! Continue comme ça !`;
  } else {
    reason = wasCorrect ? 'Excellent ! Continue comme ça !' : 'Pas de souci, on continue à s\'entraîner.';
  }

  // Récupérer ou générer le prochain exercice
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('preferred_language, pedagogical_method')
    .eq('id', studentId)
    .single();

  const nextExerciseResult = await getOrCreateExercise(
    nextSkillId,
    studentId,
    profile?.preferred_language || 'fr',
    profile?.pedagogical_method || 'standard'
  );

  if (!nextExerciseResult) return null;

  return {
    nextSkillId,
    nextExercise: nextExerciseResult.exercise,
    reason,
  };
}
