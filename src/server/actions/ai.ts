'use server';

import { createClient } from '@/lib/supabase/server';
import { createAICompletion, AIProvider, AIModel } from '@/lib/ai/providers';
import { generateExercise, ExerciseType } from '@/lib/ai/exercises';
import { generateExplanation, generateProgressiveHint, generateEncouragementMessage } from '@/lib/ai/explanations';
import { encryptApiKey, decryptApiKey, validateOpenAIKey, validateAnthropicKey } from '@/lib/ai/encryption';

interface AISettings {
  provider: AIProvider;
  model: AIModel;
  apiKey: string;
}

async function getUserAISettings(userId: string): Promise<AISettings | null> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('user_ai_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!data || data.provider === 'platform') {
    return {
      provider: 'platform',
      model: 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
    };
  }

  return {
    provider: data.provider as AIProvider,
    model: data.preferred_model as AIModel,
    apiKey: data.api_key_encrypted ? decryptApiKey(data.api_key_encrypted) : '',
  };
}

export async function saveUserAISettings(
  provider: AIProvider,
  apiKey: string | null,
  preferredModel: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Non authentifié' };
  }

  const updateData: Record<string, unknown> = {
    user_id: user.id,
    provider,
    preferred_model: preferredModel,
    updated_at: new Date().toISOString(),
  };

  if (apiKey) {
    let isValid = false;
    if (provider === 'openai') {
      isValid = await validateOpenAIKey(apiKey);
    } else if (provider === 'anthropic') {
      isValid = await validateAnthropicKey(apiKey);
    }

    if (!isValid && provider !== 'platform') {
      return { success: false, error: 'Clé API invalide' };
    }

    updateData.api_key_encrypted = encryptApiKey(apiKey);
    updateData.is_key_valid = isValid;
  }

  const { error } = await supabase
    .from('user_ai_settings')
    .upsert(updateData, { onConflict: 'user_id' });

  if (error) {
    console.error('Error saving AI settings:', error);
    return { success: false, error: 'Erreur lors de la sauvegarde' };
  }

  return { success: true };
}

export async function generateAIExercise(
  skillId: string,
  exerciseType: ExerciseType,
  difficulty: number
): Promise<{ success: boolean; exercise?: unknown; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Non authentifié' };
  }

  const settings = await getUserAISettings(user.id);
  if (!settings || !settings.apiKey) {
    return { success: false, error: 'Configuration IA manquante' };
  }

  const { data: skill } = await supabase
    .from('skills')
    .select('name, description')
    .eq('id', skillId)
    .single();

  if (!skill) {
    return { success: false, error: 'Compétence non trouvée' };
  }

  try {
    const exercise = await generateExercise(
      settings.provider,
      settings.apiKey,
      skill.name,
      skill.description || '',
      exerciseType,
      difficulty,
      8,
      'fr',
      settings.model
    );

    return { success: true, exercise };
  } catch (error) {
    console.error('Error generating exercise:', error);
    return { success: false, error: 'Erreur lors de la génération' };
  }
}

export async function getAIExplanation(
  skillName: string,
  question: string,
  correctAnswer: string,
  studentAnswer?: string
): Promise<{ success: boolean; explanation?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Non authentifié' };
  }

  const settings = await getUserAISettings(user.id);
  if (!settings || !settings.apiKey) {
    return { success: false, error: 'Configuration IA manquante' };
  }

  try {
    const explanation = await generateExplanation(
      settings.provider,
      settings.apiKey,
      {
        skillName,
        question,
        correctAnswer,
        studentAnswer,
        studentAge: 8,
        language: 'fr',
      },
      settings.model
    );

    return { success: true, explanation };
  } catch (error) {
    console.error('Error generating explanation:', error);
    return { success: false, error: 'Erreur lors de la génération' };
  }
}

export async function getAIHint(
  question: string,
  correctAnswer: string,
  hintLevel: number
): Promise<{ success: boolean; hint?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Non authentifié' };
  }

  const settings = await getUserAISettings(user.id);
  if (!settings || !settings.apiKey) {
    return { success: false, error: 'Configuration IA manquante' };
  }

  try {
    const hint = await generateProgressiveHint(
      settings.provider,
      settings.apiKey,
      question,
      correctAnswer,
      hintLevel,
      8,
      'fr',
      settings.model
    );

    return { success: true, hint };
  } catch (error) {
    console.error('Error generating hint:', error);
    return { success: false, error: 'Erreur lors de la génération' };
  }
}

export async function getEncouragement(
  context: 'correct' | 'incorrect' | 'streak' | 'milestone' | 'struggle',
  streakCount?: number
): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return 'Continue comme ça ! 💪';
  }

  const settings = await getUserAISettings(user.id);
  if (!settings || !settings.apiKey) {
    const fallbacks = {
      correct: 'Bravo ! 🎉',
      incorrect: 'Continue, tu vas y arriver ! 💪',
      streak: 'Quelle série ! 🔥',
      milestone: 'Félicitations ! 🏆',
      struggle: 'Tu peux le faire ! 💪'
    };
    return fallbacks[context];
  }

  try {
    return await generateEncouragementMessage(
      settings.provider,
      settings.apiKey,
      context,
      8,
      streakCount,
      'fr',
      settings.model
    );
  } catch {
    return 'Continue comme ça ! 💪';
  }
}

export async function logAIUsage(
  action: string,
  tokensUsed: number,
  model: string
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  await supabase.from('ai_usage_logs').insert({
    user_id: user.id,
    action,
    tokens_used: tokensUsed,
    model,
    created_at: new Date().toISOString(),
  });
}
