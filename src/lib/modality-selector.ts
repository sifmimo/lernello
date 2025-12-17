'use server';

import { createClient } from '@/lib/supabase/server';

export type ModalityCode = 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing' | 'gamified';

export interface ContentModality {
  id: string;
  code: ModalityCode;
  name: string;
  description: string;
  supported_formats: string[];
  renderer_components: string[];
  requires_audio: boolean;
  requires_visual: boolean;
  requires_interaction: boolean;
  engagement_multiplier: number;
  retention_multiplier: number;
  is_active: boolean;
}

export interface StudentModalityProfile {
  learning_style?: ModalityCode;
  age: number;
  accessibility_needs?: string[];
  device_capabilities?: {
    has_audio: boolean;
    has_touch: boolean;
    screen_size: 'small' | 'medium' | 'large';
  };
}

export interface SkillContext {
  subject_code: string;
  skill_type?: string;
  recommended_modality?: ModalityCode;
}

export interface SessionContext {
  time_available_minutes?: number;
  energy_level?: 'low' | 'medium' | 'high';
  previous_modalities_used?: ModalityCode[];
  environment?: 'quiet' | 'noisy' | 'mobile';
}

export interface ModalitySelectionInput {
  studentProfile: StudentModalityProfile;
  skillContext: SkillContext;
  sessionContext?: SessionContext;
}

export interface ModalitySelectionResult {
  selectedModality: ModalityCode;
  scores: Record<ModalityCode, number>;
  reasoning: string[];
}

const SUBJECT_MODALITIES: Record<string, ModalityCode[]> = {
  math: ['kinesthetic', 'visual'],
  francais: ['reading_writing', 'auditory'],
  sciences: ['visual', 'kinesthetic'],
  histoire: ['visual', 'reading_writing'],
  musique: ['auditory', 'kinesthetic'],
  arts: ['visual', 'kinesthetic'],
  informatique: ['kinesthetic', 'visual'],
};

export async function getAvailableModalities(): Promise<ContentModality[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('content_modalities')
    .select('*')
    .eq('is_active', true)
    .order('code');
  
  if (error) {
    console.error('Error fetching modalities:', error);
    return [];
  }
  
  return data as ContentModality[];
}

export async function getStudentModalityPreferences(studentId: string): Promise<Record<ModalityCode, number>> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('student_modality_preferences')
    .select(`
      preference_score,
      success_rate,
      engagement_score,
      content_modalities!inner(code)
    `)
    .eq('student_id', studentId);
  
  const preferences: Record<ModalityCode, number> = {
    visual: 50,
    auditory: 50,
    kinesthetic: 50,
    reading_writing: 50,
    gamified: 50,
  };
  
  if (data) {
    for (const pref of data) {
      const modalityData = pref.content_modalities as unknown as { code: ModalityCode };
      if (modalityData && modalityData.code) {
        preferences[modalityData.code] = pref.preference_score + (pref.success_rate * 0.3) + (pref.engagement_score * 0.2);
      }
    }
  }
  
  return preferences;
}

export async function selectOptimalModality(
  input: ModalitySelectionInput
): Promise<ModalitySelectionResult> {
  const { studentProfile, skillContext, sessionContext } = input;
  
  const scores: Record<ModalityCode, number> = {
    visual: 50,
    auditory: 50,
    kinesthetic: 50,
    reading_writing: 50,
    gamified: 50,
  };
  
  const reasoning: string[] = [];

  // 1. Préférence d'apprentissage de l'élève (+40 points)
  if (studentProfile.learning_style) {
    scores[studentProfile.learning_style] += 40;
    reasoning.push(`+40 ${studentProfile.learning_style}: préférence d'apprentissage`);
  }

  // 2. Âge de l'enfant
  if (studentProfile.age <= 7) {
    scores.visual += 20;
    scores.kinesthetic += 20;
    scores.auditory += 15;
    scores.reading_writing -= 20;
    reasoning.push('+20 visuel/kinesthésique: âge <= 7 ans');
  } else if (studentProfile.age <= 9) {
    scores.gamified += 15;
    scores.kinesthetic += 10;
    reasoning.push('+15 gamifié: âge 8-9 ans');
  } else {
    scores.reading_writing += 10;
    reasoning.push('+10 lecture/écriture: âge >= 10 ans');
  }

  // 3. Contraintes d'accessibilité
  if (studentProfile.accessibility_needs) {
    if (studentProfile.accessibility_needs.includes('visual_impairment')) {
      scores.visual -= 50;
      scores.auditory += 30;
      reasoning.push('-50 visuel, +30 auditif: déficience visuelle');
    }
    if (studentProfile.accessibility_needs.includes('hearing_impairment')) {
      scores.auditory -= 50;
      scores.visual += 20;
      reasoning.push('-50 auditif, +20 visuel: déficience auditive');
    }
    if (studentProfile.accessibility_needs.includes('motor_impairment')) {
      scores.kinesthetic -= 30;
      reasoning.push('-30 kinesthésique: déficience motrice');
    }
  }

  // 4. Capacités de l'appareil
  if (studentProfile.device_capabilities) {
    if (!studentProfile.device_capabilities.has_audio) {
      scores.auditory -= 100;
      reasoning.push('-100 auditif: pas d\'audio disponible');
    }
    if (!studentProfile.device_capabilities.has_touch) {
      scores.kinesthetic -= 30;
      reasoning.push('-30 kinesthésique: pas de touch');
    }
    if (studentProfile.device_capabilities.screen_size === 'small') {
      scores.kinesthetic -= 10;
      scores.reading_writing -= 10;
      reasoning.push('-10 kinesthésique/lecture: petit écran');
    }
  }

  // 5. Contexte de la matière (+15 points pour modalité recommandée)
  const subjectModalities = SUBJECT_MODALITIES[skillContext.subject_code] || [];
  subjectModalities.forEach((mod, idx) => {
    const bonus = 15 - (idx * 5);
    scores[mod] += bonus;
    reasoning.push(`+${bonus} ${mod}: recommandé pour ${skillContext.subject_code}`);
  });

  // 6. Modalité explicitement recommandée par la compétence
  if (skillContext.recommended_modality) {
    scores[skillContext.recommended_modality] += 25;
    reasoning.push(`+25 ${skillContext.recommended_modality}: recommandé par la compétence`);
  }

  // 7. Contexte de session
  if (sessionContext) {
    if (sessionContext.environment === 'noisy') {
      scores.auditory -= 40;
      reasoning.push('-40 auditif: environnement bruyant');
    }
    
    if (sessionContext.energy_level === 'low') {
      scores.gamified -= 20;
      scores.kinesthetic -= 15;
      scores.visual += 10;
      reasoning.push('-20 gamifié, -15 kinesthésique, +10 visuel: énergie basse');
    } else if (sessionContext.energy_level === 'high') {
      scores.gamified += 15;
      scores.kinesthetic += 10;
      reasoning.push('+15 gamifié, +10 kinesthésique: énergie haute');
    }
    
    if (sessionContext.time_available_minutes && sessionContext.time_available_minutes < 5) {
      scores.gamified += 20;
      reasoning.push('+20 gamifié: session courte');
    }

    // 8. Variété (éviter répétition)
    if (sessionContext.previous_modalities_used) {
      sessionContext.previous_modalities_used.forEach(mod => {
        scores[mod] -= 15;
        reasoning.push(`-15 ${mod}: utilisé récemment`);
      });
    }
  }

  // Sélectionner la meilleure modalité
  const sortedModalities = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);
  
  const selectedModality = sortedModalities[0][0] as ModalityCode;

  return {
    selectedModality,
    scores,
    reasoning,
  };
}

export async function updateStudentModalityPreference(
  studentId: string,
  modalityCode: ModalityCode,
  wasSuccessful: boolean,
  engagementLevel: number
): Promise<void> {
  const supabase = await createClient();
  
  // Récupérer l'ID de la modalité
  const { data: modality } = await supabase
    .from('content_modalities')
    .select('id')
    .eq('code', modalityCode)
    .single();
  
  if (!modality) return;
  
  // Récupérer ou créer la préférence
  const { data: existing } = await supabase
    .from('student_modality_preferences')
    .select('*')
    .eq('student_id', studentId)
    .eq('modality_id', modality.id)
    .single();
  
  if (existing) {
    const newTotal = existing.total_interactions + 1;
    const newSuccessRate = ((existing.success_rate * existing.total_interactions) + (wasSuccessful ? 1 : 0)) / newTotal;
    const newEngagement = ((existing.engagement_score * existing.total_interactions) + engagementLevel) / newTotal;
    
    // Ajuster le score de préférence basé sur le succès et l'engagement
    let preferenceAdjustment = 0;
    if (wasSuccessful && engagementLevel > 0.7) {
      preferenceAdjustment = 2;
    } else if (!wasSuccessful && engagementLevel < 0.3) {
      preferenceAdjustment = -2;
    }
    
    await supabase
      .from('student_modality_preferences')
      .update({
        success_rate: newSuccessRate,
        engagement_score: newEngagement,
        total_interactions: newTotal,
        preference_score: Math.max(0, Math.min(100, existing.preference_score + preferenceAdjustment)),
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('student_modality_preferences')
      .insert({
        student_id: studentId,
        modality_id: modality.id,
        preference_score: 50,
        success_rate: wasSuccessful ? 1 : 0,
        engagement_score: engagementLevel,
        total_interactions: 1,
        last_used_at: new Date().toISOString(),
      });
  }
}

export async function getModalityContentForSkill(
  skillId: string,
  modalityCode: ModalityCode,
  contentType: 'theory' | 'example' | 'exercise' | 'synthesis' = 'theory',
  language: string = 'fr'
): Promise<{ content_data: Record<string, unknown> } | null> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('skill_modality_content')
    .select(`
      content_data,
      content_modalities!inner(code)
    `)
    .eq('skill_id', skillId)
    .eq('content_type', contentType)
    .eq('language', language)
    .eq('content_modalities.code', modalityCode)
    .single();
  
  return data as { content_data: Record<string, unknown> } | null;
}
