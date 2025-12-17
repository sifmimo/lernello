'use server';

import { createClient } from '@/lib/supabase/server';

export interface EmotionSignal {
  responseTimeAvg: number;
  responseTimeRatio: number;
  consecutiveErrors: number;
  consecutiveCorrect: number;
  clickVariance: string;
  sessionDuration: number;
  hintRequests: number;
  successRate: number;
}

export interface DetectedEmotion {
  emotion: 'engaged' | 'frustrated' | 'bored' | 'tired' | 'confident' | 'struggling';
  confidence: number;
  suggestedAction: string;
  message: string;
}

export async function detectEmotion(signals: EmotionSignal): Promise<DetectedEmotion | null> {
  const supabase = await createClient();
  
  const { data: rules } = await supabase
    .from('emotion_rules')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true });

  if (!rules || rules.length === 0) {
    return evaluateDefaultRules(signals);
  }

  for (const rule of rules) {
    if (matchesConditions(signals, rule.conditions)) {
      return {
        emotion: rule.emotion as DetectedEmotion['emotion'],
        confidence: 0.8,
        suggestedAction: rule.suggested_action,
        message: rule.message_template || getDefaultMessage(rule.emotion),
      };
    }
  }

  return null;
}

function matchesConditions(signals: EmotionSignal, conditions: Record<string, string>): boolean {
  for (const [key, condition] of Object.entries(conditions)) {
    const value = getSignalValue(signals, key);
    if (value === null) continue;
    
    if (!evaluateCondition(value, condition)) {
      return false;
    }
  }
  return true;
}

function getSignalValue(signals: EmotionSignal, key: string): number | string | null {
  const mapping: Record<string, keyof EmotionSignal> = {
    'response_time_ratio': 'responseTimeRatio',
    'consecutive_errors': 'consecutiveErrors',
    'consecutive_correct': 'consecutiveCorrect',
    'click_variance': 'clickVariance',
    'session_duration': 'sessionDuration',
    'hint_requests': 'hintRequests',
    'success_rate': 'successRate',
  };
  
  const signalKey = mapping[key] || key as keyof EmotionSignal;
  return signals[signalKey] ?? null;
}

function evaluateCondition(value: number | string, condition: string): boolean {
  if (typeof value === 'string') {
    return value === condition.replace(/[<>=]/g, '');
  }
  
  const match = condition.match(/^([<>=]+)(.+)$/);
  if (!match) return false;
  
  const [, operator, threshold] = match;
  const thresholdNum = parseFloat(threshold);
  
  switch (operator) {
    case '>=': return value >= thresholdNum;
    case '<=': return value <= thresholdNum;
    case '>': return value > thresholdNum;
    case '<': return value < thresholdNum;
    case '=': return value === thresholdNum;
    default: return false;
  }
}

function evaluateDefaultRules(signals: EmotionSignal): DetectedEmotion | null {
  if (signals.consecutiveErrors >= 3 && signals.responseTimeRatio > 1.5) {
    return {
      emotion: 'frustrated',
      confidence: 0.75,
      suggestedAction: 'easier_exercise',
      message: 'Je vois que c\'est un peu difficile. On essaie quelque chose de plus simple ?',
    };
  }
  
  if (signals.responseTimeRatio < 0.5 && signals.successRate > 0.9) {
    return {
      emotion: 'bored',
      confidence: 0.7,
      suggestedAction: 'difficulty_increase',
      message: 'Tu es trop fort ! On passe à quelque chose de plus challengeant ?',
    };
  }
  
  if (signals.responseTimeRatio > 2.5 && signals.sessionDuration > 20) {
    return {
      emotion: 'tired',
      confidence: 0.65,
      suggestedAction: 'break_suggestion',
      message: 'Tu travailles depuis un moment. Une petite pause ?',
    };
  }
  
  if (signals.consecutiveCorrect >= 5 && signals.responseTimeRatio < 1) {
    return {
      emotion: 'confident',
      confidence: 0.8,
      suggestedAction: 'celebration',
      message: 'Waouh ! Tu es en feu ! 🔥',
    };
  }
  
  if (signals.hintRequests >= 3 && signals.successRate < 0.3) {
    return {
      emotion: 'struggling',
      confidence: 0.7,
      suggestedAction: 'guided_help',
      message: 'Je vais t\'aider pas à pas. Regarde bien...',
    };
  }
  
  return {
    emotion: 'engaged',
    confidence: 0.5,
    suggestedAction: 'continue',
    message: 'Continue comme ça !',
  };
}

function getDefaultMessage(emotion: string): string {
  const messages: Record<string, string> = {
    frustrated: 'Pas de panique ! Prends ton temps.',
    bored: 'On passe à quelque chose de plus fun ?',
    tired: 'Tu as bien travaillé. Une pause ?',
    confident: 'Tu assures !',
    struggling: 'Je suis là pour t\'aider.',
    engaged: 'Super travail !',
  };
  return messages[emotion] || 'Continue !';
}

export async function logEmotionSignal(
  profileId: string,
  sessionId: string,
  emotion: DetectedEmotion,
  signals: EmotionSignal
): Promise<void> {
  const supabase = await createClient();
  
  await supabase.from('emotion_signals').insert({
    profile_id: profileId,
    session_id: sessionId,
    detected_emotion: emotion.emotion,
    confidence_score: emotion.confidence,
    signals: signals,
    action_taken: emotion.suggestedAction,
  });
}
