'use server';

import { createClient } from '@/lib/supabase/server';
import { createAICompletion, AIProvider, AIModel } from './providers';
import { calculateNextReview, qualityFromCorrectness, SpacedRepetitionData } from '@/lib/spaced-repetition';

export type ExerciseType = 'qcm' | 'fill_blank' | 'drag_drop' | 'free_input' | 'match_pairs' | 'sorting' | 'image_qcm' | 'timeline' | 'hotspot' | 'puzzle' | 'drawing' | 'animation';

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

    match_pairs: `Type: Association de paires
Format JSON requis:
{
  "type": "match_pairs",
  "content": {
    "question": "Associe chaque opération à son résultat",
    "pairs": [
      { "left": "2 + 3", "right": "5" },
      { "left": "4 + 1", "right": "5" },
      { "left": "3 + 3", "right": "6" },
      { "left": "2 + 2", "right": "4" }
    ],
    "hint": "Un indice pour aider"
  }
}
- "pairs" contient les associations correctes
- L'interface mélangera les éléments de droite pour l'exercice`,

    sorting: `Type: Tri / Classement en catégories
Format JSON requis:
{
  "type": "sorting",
  "content": {
    "question": "Classe ces nombres selon leur parité",
    "categories": ["Pairs", "Impairs"],
    "items": [
      { "text": "2", "category": 0 },
      { "text": "3", "category": 1 },
      { "text": "4", "category": 0 },
      { "text": "5", "category": 1 }
    ],
    "hint": "Un indice pour aider"
  }
}
- "categories" liste les catégories disponibles
- "items" contient les éléments avec leur catégorie correcte (index)`,

    image_qcm: `Type: QCM avec images/descriptions
Format JSON requis:
{
  "type": "image_qcm",
  "content": {
    "question": "Quel est le triangle ?",
    "options": [
      { "text": "Triangle", "description": "Forme à 3 côtés", "emoji": "🔺" },
      { "text": "Carré", "description": "Forme à 4 côtés égaux", "emoji": "🟦" },
      { "text": "Cercle", "description": "Forme ronde", "emoji": "🔵" },
      { "text": "Rectangle", "description": "Forme à 4 côtés", "emoji": "🟩" }
    ],
    "correct": 0,
    "hint": "Un indice pour aider"
  }
}
- Utilise des emojis pour représenter visuellement les options
- "correct" est l'index de la bonne réponse`,

    timeline: `Type: Chronologie / Ordre temporel
Format JSON requis:
{
  "type": "timeline",
  "content": {
    "question": "Place ces événements dans l'ordre chronologique",
    "events": [
      { "text": "Se réveiller", "order": 0 },
      { "text": "Prendre le petit-déjeuner", "order": 1 },
      { "text": "Aller à l'école", "order": 2 },
      { "text": "Déjeuner", "order": 3 }
    ],
    "hint": "Pense à ta journée type"
  }
}
- "events" contient les événements avec leur ordre correct (0 = premier)
- L'interface affichera les événements mélangés`,

    hotspot: `Type: Zone à identifier
Format JSON requis:
{
  "type": "hotspot",
  "content": {
    "question": "Identifie les éléments demandés",
    "scenario": "Tu vois un bureau avec un ordinateur, un clavier, une souris et un écran.",
    "items": ["clavier", "souris", "écran"],
    "correctItem": "souris",
    "hint": "C'est l'outil qui permet de cliquer"
  }
}
- "scenario" décrit la scène textuelle
- "items" liste les éléments présents
- "correctItem" est l'élément à trouver`,

    puzzle: `Type: Puzzle / Reconstitution
Format JSON requis:
{
  "type": "puzzle",
  "content": {
    "question": "Reconstitue la phrase dans le bon ordre",
    "pieces": ["Le", "chat", "mange", "sa", "pâtée"],
    "correctOrder": [0, 1, 2, 3, 4],
    "hint": "Commence par le sujet de la phrase"
  }
}
- "pieces" contient les morceaux mélangés
- "correctOrder" indique l'ordre correct des indices`,

    drawing: `Type: Dessin / Tracé
Format JSON requis:
{
  "type": "drawing",
  "content": {
    "question": "Décris ce que tu dois dessiner",
    "instruction": "Trace une ligne droite de gauche à droite",
    "expectedShape": "ligne_horizontale",
    "hint": "Garde ta main stable"
  }
}
- Pour les exercices de motricité fine
- "instruction" guide l'élève
- "expectedShape" décrit la forme attendue`,

    animation: `Type: Animation interactive
Format JSON requis:
{
  "type": "animation",
  "content": {
    "question": "Observe et réponds",
    "scenario": "Un crayon trace lentement une spirale sur la feuille",
    "action": "Quel mouvement fait le crayon ?",
    "options": ["Ligne droite", "Spirale", "Zigzag", "Cercle"],
    "correct": 1,
    "hint": "Observe bien le mouvement"
  }
}
- Décrit une animation textuelle
- L'élève doit identifier ce qui se passe`,
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
  
  // Récupérer les types d'exercices configurés pour cette compétence
  const { data: skillConfig } = await supabase
    .from('skills')
    .select('allowed_exercise_types, preferred_exercise_types')
    .eq('id', config.skillId)
    .single();
  
  
  // Types par défaut si non configurés
  const defaultTypes: ExerciseType[] = ['qcm', 'fill_blank', 'free_input'];
  let allowedTypes: ExerciseType[] = defaultTypes;
  
  if (skillConfig?.allowed_exercise_types && skillConfig.allowed_exercise_types.length > 0) {
    // Filtrer pour ne garder que les types implémentés
    const implementedTypes: ExerciseType[] = ['qcm', 'fill_blank', 'free_input', 'drag_drop', 'match_pairs', 'sorting', 'image_qcm', 'timeline', 'hotspot', 'puzzle', 'drawing', 'animation'];
    allowedTypes = (skillConfig.allowed_exercise_types as string[])
      .filter(t => implementedTypes.includes(t as ExerciseType)) as ExerciseType[];
    
    console.log('[generateExerciseWithAI] Skill config types:', skillConfig.allowed_exercise_types, '-> Filtered:', allowedTypes);
    
    if (allowedTypes.length === 0) {
      console.log('[generateExerciseWithAI] No implemented types found, using defaults');
      allowedTypes = defaultTypes;
    }
  }
  
  // Récupérer les types déjà utilisés pour cette compétence pour varier
  const { data: recentExercises } = await supabase
    .from('exercises')
    .select('type')
    .eq('skill_id', config.skillId)
    .order('created_at', { ascending: false })
    .limit(5);
  
  const recentTypes = recentExercises?.map(e => e.type as ExerciseType) || [];
  
  // Filtrer les types pour éviter de répéter les mêmes
  let availableTypes = allowedTypes.filter(t => !recentTypes.includes(t));
  if (availableTypes.length === 0) {
    availableTypes = allowedTypes; // Si tous les types ont été utilisés, on recommence
  }
  
  // Prioriser les types préférés s'ils existent
  let selectedType: ExerciseType;
  if (config.exerciseType) {
    selectedType = config.exerciseType;
  } else if (skillConfig?.preferred_exercise_types && skillConfig.preferred_exercise_types.length > 0) {
    const preferredTypes = (skillConfig.preferred_exercise_types as string[])
      .filter(t => availableTypes.includes(t as ExerciseType)) as ExerciseType[];
    if (preferredTypes.length > 0) {
      selectedType = preferredTypes[Math.floor(Math.random() * preferredTypes.length)];
    } else {
      selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }
  } else {
    selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
  }
  
  console.log('[generateExerciseWithAI] Allowed types:', allowedTypes, 'Selected:', selectedType);
  
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
  
  // Construire le prompt strict et contextuel
  const systemPrompt = `Tu es un expert en pédagogie pour enfants. Génère un exercice éducatif en JSON UNIQUEMENT.

CONTEXTE OBLIGATOIRE:
- Compétence: ${config.skillName}
${config.skillDescription ? `- Description: ${config.skillDescription}` : ''}
- Âge cible: ${config.targetAge} ans

RÈGLES ABSOLUES (VIOLATION = ÉCHEC):
1. L'exercice DOIT tester EXACTEMENT la compétence indiquée ci-dessus
2. NE JAMAIS générer d'exercice sur un autre sujet
3. Si la compétence parle d'ordinateur/tablette, l'exercice doit porter sur ordinateur/tablette
4. Si la compétence parle de mathématiques, l'exercice doit être un calcul
5. Réponds UNIQUEMENT avec du JSON valide, rien d'autre
6. Contenu en français, adapté à l'âge

EXEMPLES DE CE QU'IL NE FAUT PAS FAIRE:
- Compétence "Reconnaître ordinateur/tablette" → NE PAS demander "Quel appareil prend des photos"
- Compétence "Addition" → NE PAS demander des questions de culture générale

${getExerciseTypePrompt(selectedType)}`;

  const userPrompt = `COMPÉTENCE À TESTER: ${config.skillName}

Génère un exercice ${selectedType.toUpperCase()} qui teste UNIQUEMENT cette compétence.
${avoidDuplicatesPrompt}

JSON:`;

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

  console.log('[V8] getOrCreateExercise - skill:', skillId, 'student:', studentId);

  // 1. Récupérer les infos de la compétence avec ses traductions
  const { data: skill } = await supabase
    .from('skills')
    .select(`
      id, code, name_key, description_key, difficulty_level,
      domain:domains!inner(
        id, name_key,
        subject:subjects!inner(id, name_key, code)
      )
    `)
    .eq('id', skillId)
    .single();

  if (!skill) {
    console.error('[V8] Skill not found:', skillId);
    return null;
  }

  // Extraire domain (peut être un objet ou un tableau selon Supabase)
  const domain = Array.isArray(skill.domain) ? skill.domain[0] : skill.domain;
  const subject = domain ? (Array.isArray(domain.subject) ? domain.subject[0] : domain.subject) : null;

  // Récupérer les traductions pour avoir les vrais noms
  const translationKeys = [
    skill.name_key,
    skill.description_key,
    domain?.name_key,
    subject?.name_key,
  ].filter(Boolean) as string[];

  const { data: translations } = await supabase
    .from('content_translations')
    .select('key, value')
    .in('key', translationKeys)
    .eq('language', language);

  const translationMap = new Map(translations?.map(t => [t.key, t.value]) || []);
  
  const skillName = translationMap.get(skill.name_key) || skill.name_key;
  const skillDescription = translationMap.get(skill.description_key || '') || '';
  const domainName = translationMap.get(domain?.name_key || '') || '';
  const subjectName = translationMap.get(subject?.name_key || '') || subject?.code || '';

  // 2. Récupérer le profil de l'élève
  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('birth_year')
    .eq('id', studentId)
    .single();

  const currentYear = new Date().getFullYear();
  const targetAge = studentProfile?.birth_year 
    ? Math.max(6, Math.min(12, currentYear - studentProfile.birth_year))
    : 8;

  // 3. Récupérer TOUS les exercices validés pour cette compétence
  const { data: allExercises } = await supabase
    .from('exercises')
    .select('id, type, content, difficulty')
    .eq('skill_id', skillId)
    .eq('is_validated', true)
    .order('created_at', { ascending: true });

  const totalExercises = allExercises?.length || 0;
  const MAX_EXERCISES_PER_SKILL = 10;
  const canGenerateWithPlatformTokens = totalExercises < MAX_EXERCISES_PER_SKILL;

  const quotaInfo: ExerciseQuotaInfo = {
    totalExercises,
    maxExercises: MAX_EXERCISES_PER_SKILL,
    usePlatformTokens: canGenerateWithPlatformTokens,
    limitReached: !canGenerateWithPlatformTokens,
  };

  // 4. V8 ROTATION GARANTIE: Récupérer les exercices vus dans la rotation actuelle
  // On utilise exercise_attempts pour tracker ce qui a été vu
  const { data: attemptedExercises } = await supabase
    .from('exercise_attempts')
    .select('exercise_id, created_at')
    .eq('student_id', studentId)
    .in('exercise_id', allExercises?.map(e => e.id) || [])
    .order('created_at', { ascending: false });

  // Compter combien de fois chaque exercice a été tenté
  const attemptCounts = new Map<string, number>();
  attemptedExercises?.forEach(a => {
    attemptCounts.set(a.exercise_id, (attemptCounts.get(a.exercise_id) || 0) + 1);
  });

  // Trouver le nombre minimum de tentatives (= rotation actuelle)
  const minAttempts = allExercises && allExercises.length > 0
    ? Math.min(...allExercises.map(e => attemptCounts.get(e.id) || 0))
    : 0;

  // V8: Exercices non vus dans la rotation actuelle = ceux avec le minimum de tentatives
  const unseenInRotation = allExercises?.filter(e => 
    (attemptCounts.get(e.id) || 0) === minAttempts
  ) || [];

  console.log(`[V8] Rotation: total=${totalExercises}, minAttempts=${minAttempts}, unseenInRotation=${unseenInRotation.length}`);

  // 5. V8: Si tous les exercices ont été vus ET quota non atteint, générer un nouveau
  if (unseenInRotation.length === 0 && canGenerateWithPlatformTokens) {
    console.log('[V8] Tous vus, génération IA...');
    
    try {
      const generatedExercise = await generateExerciseWithAI({
        skillId: skill.id,
        skillName: `${subjectName} - ${domainName} - ${skillName}`,
        skillDescription: skillDescription,
        difficulty: Math.min(5, Math.max(1, minAttempts + 1)),
        language,
        pedagogicalMethod,
        targetAge,
      });

      if (generatedExercise) {
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

        if (!error && savedExercise) {
          console.log('[V8] Nouvel exercice généré:', savedExercise.id);
          return {
            exercise: savedExercise as GeneratedExercise & { id: string },
            isNew: true,
            quotaInfo: { ...quotaInfo, totalExercises: totalExercises + 1 },
          };
        }
      }
    } catch (aiError) {
      console.error('[V8] Erreur génération:', aiError);
    }
    
    // Si génération échoue, réinitialiser la rotation (tous redeviennent disponibles)
    console.log('[V8] Génération échouée, réinitialisation rotation');
  }

  // 6. Sélectionner parmi les exercices non vus dans cette rotation
  const candidates = unseenInRotation.length > 0 ? unseenInRotation : (allExercises || []);
  
  if (candidates.length === 0) {
    // Aucun exercice, tenter génération
    console.log('[V8] Aucun exercice, génération initiale...');
    try {
      const generatedExercise = await generateExerciseWithAI({
        skillId: skill.id,
        skillName: `${subjectName} - ${domainName} - ${skillName}`,
        skillDescription: skillDescription,
        difficulty: 1,
        language,
        pedagogicalMethod,
        targetAge,
      });

      if (generatedExercise) {
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

        if (!error && savedExercise) {
          return {
            exercise: savedExercise as GeneratedExercise & { id: string },
            isNew: true,
            quotaInfo: { ...quotaInfo, totalExercises: 1 },
          };
        }
      }
    } catch (e) {
      console.error('[V8] Erreur génération initiale:', e);
    }
    return null;
  }

  // 7. V8 INTERLEAVING: Récupérer le dernier type d'exercice fait
  const lastAttempt = attemptedExercises?.[0];
  const lastExercise = lastAttempt 
    ? allExercises?.find(e => e.id === lastAttempt.exercise_id)
    : null;
  const lastType = lastExercise?.type;

  // Filtrer pour éviter le même type consécutif (si possible)
  let finalCandidates = candidates;
  if (lastType && candidates.length > 1) {
    const differentType = candidates.filter(e => e.type !== lastType);
    if (differentType.length > 0) {
      finalCandidates = differentType;
    }
  }

  // 8. Sélection aléatoire parmi les candidats finaux
  const selectedExercise = finalCandidates[Math.floor(Math.random() * finalCandidates.length)];
  
  console.log(`[V8] Sélectionné: ${selectedExercise.id} (type: ${selectedExercise.type})`);
  
  return {
    exercise: selectedExercise as GeneratedExercise & { id: string },
    isNew: false,
    quotaInfo,
  };
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
