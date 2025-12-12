'use server';

import { createClient } from '@/lib/supabase/server';
import { createAICompletion, AIProvider, AIModel } from './providers';

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

async function getModelForTask(taskType: string): Promise<{ model: AIModel; maxTokens: number; temperature: number }> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('ai_model_config')
    .select('model_name, max_tokens, temperature')
    .eq('task_type', taskType)
    .eq('is_active', true)
    .single();

  if (data) {
    return {
      model: data.model_name as AIModel,
      maxTokens: data.max_tokens,
      temperature: data.temperature,
    };
  }

  // Defaults
  const defaults: Record<string, { model: AIModel; maxTokens: number; temperature: number }> = {
    exercise_generation: { model: 'gpt-4o', maxTokens: 2000, temperature: 0.7 },
    hint: { model: 'gpt-4o-mini', maxTokens: 200, temperature: 0.5 },
    encouragement: { model: 'gpt-4o-mini', maxTokens: 100, temperature: 0.8 },
    explanation: { model: 'gpt-4o-mini', maxTokens: 500, temperature: 0.6 },
    evaluation: { model: 'gpt-4o-mini', maxTokens: 100, temperature: 0.3 },
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
- "items" sont les éléments à ordonner
- "correctOrder" est l'ordre des indices pour avoir la bonne réponse`,

    free_input: `Type: Réponse libre
Format JSON requis:
{
  "type": "free_input",
  "content": {
    "question": "Combien font 3 + 4 ?",
    "answer": "7",
    "hint": "Un indice pour aider"
  }
}
- "answer" est la réponse attendue (texte ou nombre)`,
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
  const supabase = await createClient();
  const startTime = Date.now();
  
  // Déterminer le type d'exercice si non spécifié
  const exerciseTypes: ExerciseType[] = ['qcm', 'fill_blank', 'drag_drop', 'free_input'];
  const selectedType = config.exerciseType || exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];
  
  // Récupérer la configuration du modèle
  const modelConfig = await getModelForTask('exercise_generation');
  
  // Construire le prompt
  const systemPrompt = `Tu es un expert en pédagogie pour enfants. Tu génères des exercices éducatifs de haute qualité.

RÈGLES STRICTES:
1. Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après
2. Le contenu doit être en ${config.language === 'fr' ? 'français' : config.language === 'ar' ? 'arabe' : 'anglais'}
3. Adapte la difficulté au niveau ${config.difficulty}/5
4. L'exercice doit être approprié pour un enfant de ${config.targetAge} ans

${getPedagogicalStylePrompt(config.pedagogicalMethod, config.targetAge)}

${getExerciseTypePrompt(selectedType)}`;

  const userPrompt = `Génère un exercice pour la compétence suivante:
- Compétence: ${config.skillName}
- Description: ${config.skillDescription}
- Difficulté: ${config.difficulty}/5
- Âge cible: ${config.targetAge} ans

Génère UNIQUEMENT le JSON, rien d'autre.`;

  try {
    // Récupérer la clé API
    const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('No API key configured');
    }

    const provider: AIProvider = modelConfig.model.startsWith('gpt') ? 'openai' : 'anthropic';
    
    const result = await createAICompletion(provider, apiKey, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
    });

    // Parser la réponse JSON
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const exercise = JSON.parse(jsonMatch[0]) as GeneratedExercise;
    exercise.difficulty = config.difficulty;

    // Logger la génération
    const generationTime = Date.now() - startTime;
    await supabase.from('ai_generation_logs').insert({
      skill_id: config.skillId,
      model_used: modelConfig.model,
      tokens_input: result.usage?.promptTokens || 0,
      tokens_output: result.usage?.completionTokens || 0,
      generation_time_ms: generationTime,
      success: true,
    });

    return exercise;
  } catch (error) {
    console.error('Error generating exercise:', error);
    
    // Logger l'erreur
    await supabase.from('ai_generation_logs').insert({
      skill_id: config.skillId,
      model_used: modelConfig.model,
      generation_time_ms: Date.now() - startTime,
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    return null;
  }
}

export async function getOrCreateExercise(
  skillId: string,
  studentId: string,
  language: string = 'fr',
  pedagogicalMethod: string = 'standard'
): Promise<{ exercise: GeneratedExercise & { id: string }; isNew: boolean } | null> {
  const supabase = await createClient();

  // Récupérer les infos de la compétence
  const { data: skill } = await supabase
    .from('skills')
    .select('id, code, name_key, description_key, difficulty_level')
    .eq('id', skillId)
    .single();

  if (!skill) return null;

  // Récupérer le niveau de l'élève pour cette compétence (table existante)
  const { data: progressData } = await supabase
    .from('student_skill_progress')
    .select('mastery_level, attempts_count, correct_count')
    .eq('student_id', studentId)
    .eq('skill_id', skillId)
    .single();

  // Calculer la difficulté recommandée basée sur le taux de réussite
  const correctRate = progressData ? (progressData.correct_count / Math.max(1, progressData.attempts_count)) : 0.5;
  const recommendedDifficulty = Math.min(5, Math.max(1, Math.round(correctRate * 5)));

  // Récupérer le profil de l'élève pour l'âge
  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('age')
    .eq('id', studentId)
    .single();

  const targetAge = studentProfile?.age || 8;

  // Chercher un exercice existant adapté (colonnes de base uniquement)
  const { data: existingExercises } = await supabase
    .from('exercises')
    .select('id, type, content, difficulty')
    .eq('skill_id', skillId)
    .eq('is_validated', true)
    .gte('difficulty', Math.max(1, recommendedDifficulty - 1))
    .lte('difficulty', Math.min(5, recommendedDifficulty + 1))
    .limit(10);

  // Récupérer les exercices déjà faits par l'élève
  const { data: attemptedExercises } = await supabase
    .from('exercise_attempts')
    .select('exercise_id')
    .eq('student_id', studentId);

  const attemptedIds = new Set(attemptedExercises?.map(a => a.exercise_id) || []);

  // Filtrer les exercices non encore tentés
  const availableExercises = existingExercises?.filter(e => !attemptedIds.has(e.id)) || [];

  if (availableExercises.length > 0) {
    // Retourner un exercice existant aléatoire
    const randomExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)];
    return {
      exercise: randomExercise as GeneratedExercise & { id: string },
      isNew: false,
    };
  }

  // Si tous les exercices ont été tentés, permettre de refaire un exercice existant
  if (existingExercises && existingExercises.length > 0) {
    const randomExercise = existingExercises[Math.floor(Math.random() * existingExercises.length)];
    return {
      exercise: randomExercise as GeneratedExercise & { id: string },
      isNew: false,
    };
  }

  // Aucun exercice en base, tenter de générer avec l'IA
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

    if (!generatedExercise) return null;

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
      // Retourner l'exercice généré sans ID (ne sera pas sauvegardé)
      return {
        exercise: {
          id: `temp-${Date.now()}`,
          ...generatedExercise,
        } as GeneratedExercise & { id: string },
        isNew: true,
      };
    }

    return {
      exercise: savedExercise as GeneratedExercise & { id: string },
      isNew: true,
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

  // Récupérer les stats depuis student_skill_progress (table existante)
  const { data: progressData } = await supabase
    .from('student_skill_progress')
    .select('attempts_count, correct_count, mastery_level')
    .eq('student_id', studentId)
    .eq('skill_id', currentSkillId)
    .single();

  const exercisesCompleted = progressData?.attempts_count || 0;
  const correctRate = progressData ? (progressData.correct_count / Math.max(1, progressData.attempts_count)) : 0;

  // Logique de progression
  let nextSkillId = currentSkillId;
  let reason = '';

  // Si maîtrise suffisante (>80% sur au moins 5 exercices), passer à la compétence suivante
  if (correctRate >= 0.8 && exercisesCompleted >= 5) {
    // Chercher la compétence suivante dans le même domaine
    const { data: currentSkill } = await supabase
      .from('skills')
      .select('domain_id, sort_order')
      .eq('id', currentSkillId)
      .single();

    if (currentSkill) {
      const { data: nextSkill } = await supabase
        .from('skills')
        .select('id')
        .eq('domain_id', currentSkill.domain_id)
        .gt('sort_order', currentSkill.sort_order)
        .order('sort_order', { ascending: true })
        .limit(1)
        .single();

      if (nextSkill) {
        nextSkillId = nextSkill.id;
        reason = 'Bravo ! Tu maîtrises cette compétence. Passons à la suivante !';
      } else {
        reason = 'Tu as terminé toutes les compétences de ce domaine !';
      }
    }
  } else if (correctRate < 0.4 && exercisesCompleted >= 3) {
    // Difficulté trop élevée, rester sur la même compétence avec difficulté réduite
    reason = 'Continuons à pratiquer cette compétence ensemble.';
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
