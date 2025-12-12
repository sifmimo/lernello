'use server';

import { createAICompletion, AIProvider, AIModel } from './providers';

export type ExerciseType = 'qcm' | 'fill_blank' | 'free_input' | 'drag_drop';

interface GeneratedExercise {
  type: ExerciseType;
  question: string;
  content: Record<string, unknown>;
  difficulty: number;
  hint?: string;
}

const exercisePrompts: Record<ExerciseType, string> = {
  qcm: `Génère un exercice QCM (Question à Choix Multiple) pour un enfant.
Format JSON attendu:
{
  "question": "La question posée",
  "content": {
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0
  },
  "hint": "Un indice pour aider l'enfant"
}`,
  
  fill_blank: `Génère un exercice de texte à trous pour un enfant.
Format JSON attendu:
{
  "question": "Complète la phrase suivante",
  "content": {
    "text": "Le chat ___ sur le tapis",
    "blanks": ["dort"],
    "blank_positions": [2]
  },
  "hint": "Un indice pour aider l'enfant"
}`,
  
  free_input: `Génère un exercice à réponse libre pour un enfant.
Format JSON attendu:
{
  "question": "La question posée",
  "content": {
    "answer": "La réponse attendue",
    "accept_variants": ["variante1", "variante2"]
  },
  "hint": "Un indice pour aider l'enfant"
}`,
  
  drag_drop: `Génère un exercice de remise en ordre pour un enfant.
Format JSON attendu:
{
  "question": "Remets les éléments dans le bon ordre",
  "content": {
    "items": ["Premier", "Deuxième", "Troisième", "Quatrième"],
    "correct_order": [0, 1, 2, 3]
  },
  "hint": "Un indice pour aider l'enfant"
}`
};

export async function generateExercise(
  provider: AIProvider,
  apiKey: string,
  skillName: string,
  skillDescription: string,
  exerciseType: ExerciseType,
  difficulty: number,
  studentAge: number,
  language: string = 'fr',
  model?: AIModel
): Promise<GeneratedExercise> {
  const systemPrompt = `Tu es un expert en pédagogie pour enfants. Tu crées des exercices adaptés à l'âge et au niveau de l'enfant.
Langue: ${language === 'fr' ? 'Français' : language === 'ar' ? 'Arabe' : 'Anglais'}
Âge de l'élève: ${studentAge} ans
Niveau de difficulté: ${difficulty}/5

IMPORTANT: Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après.`;

  const userPrompt = `Crée un exercice de type "${exerciseType}" pour la compétence "${skillName}".
Description de la compétence: ${skillDescription}

${exercisePrompts[exerciseType]}`;

  try {
    const result = await createAICompletion(provider, apiKey, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model,
      temperature: 0.8,
      maxTokens: 1024,
    });

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      type: exerciseType,
      question: parsed.question,
      content: parsed.content,
      difficulty,
      hint: parsed.hint,
    };
  } catch (error) {
    console.error('Error generating exercise:', error);
    throw new Error('Failed to generate exercise');
  }
}

export async function validateGeneratedExercise(exercise: GeneratedExercise): Promise<boolean> {
  if (!exercise.question || !exercise.content) return false;
  
  switch (exercise.type) {
    case 'qcm':
      return Array.isArray(exercise.content.options) && 
             typeof exercise.content.correct === 'number';
    case 'fill_blank':
      return typeof exercise.content.text === 'string' && 
             Array.isArray(exercise.content.blanks);
    case 'free_input':
      return typeof exercise.content.answer === 'string';
    case 'drag_drop':
      return Array.isArray(exercise.content.items) && 
             Array.isArray(exercise.content.correct_order);
    default:
      return false;
  }
}
