'use client';

import { SkillPresentation, TargetProfile, LearningStyle } from '@/types/skill-presentation';

interface PresentationScore {
  presentation: SkillPresentation;
  score: number;
  reasons: string[];
}

interface StudentProfile {
  age: number;
  learning_style?: LearningStyle;
  interests?: string[];
  preferred_method?: string;
  energy_level?: 'low' | 'medium' | 'high';
  time_available_minutes?: number;
}

export function selectBestPresentation(
  presentations: SkillPresentation[],
  studentProfile: StudentProfile,
  context?: {
    previousAttempts?: number;
    lastPresentationId?: string;
  }
): PresentationScore | null {
  if (presentations.length === 0) return null;

  const scores: PresentationScore[] = presentations
    .filter(p => p.is_active)
    .map(presentation => {
      let score = 0;
      const reasons: string[] = [];

      const target = presentation.target_profile as TargetProfile;

      // Match age range (+30 points)
      if (target.age_range) {
        const [minAge, maxAge] = target.age_range;
        if (studentProfile.age >= minAge && studentProfile.age <= maxAge) {
          score += 30;
          reasons.push('Âge correspondant');
        }
      }

      // Match learning style (+25 points)
      if (target.learning_style && studentProfile.learning_style) {
        if (target.learning_style === studentProfile.learning_style) {
          score += 25;
          reasons.push('Style d\'apprentissage correspondant');
        }
      }

      // Match interests (+20 points per match)
      if (target.interests && studentProfile.interests) {
        const matchingInterests = target.interests.filter(
          interest => studentProfile.interests?.includes(interest)
        );
        if (matchingInterests.length > 0) {
          score += matchingInterests.length * 20;
          reasons.push(`${matchingInterests.length} intérêt(s) en commun`);
        }
      }

      // Match pedagogical method (+20 points)
      if (studentProfile.preferred_method) {
        if (presentation.pedagogical_approach === studentProfile.preferred_method) {
          score += 20;
          reasons.push('Méthode pédagogique préférée');
        }
      }

      // Historical scores (+15 points max)
      if (presentation.engagement_score > 0) {
        score += Math.min(presentation.engagement_score * 3, 15);
        reasons.push('Bon score d\'engagement');
      }

      // Effectiveness score (+10 points max)
      if (presentation.effectiveness_score > 0) {
        score += Math.min(presentation.effectiveness_score * 2, 10);
        reasons.push('Efficacité prouvée');
      }

      // Time context adjustment
      if (studentProfile.time_available_minutes) {
        const durationDiff = Math.abs(
          presentation.estimated_duration_minutes - studentProfile.time_available_minutes
        );
        if (durationDiff <= 5) {
          score += 10;
          reasons.push('Durée adaptée');
        } else if (durationDiff > 15) {
          score -= 10;
        }
      }

      // Energy level context
      if (studentProfile.energy_level === 'low') {
        if (presentation.presentation_type === 'direct') {
          score += 5;
          reasons.push('Format adapté à l\'énergie');
        }
      } else if (studentProfile.energy_level === 'high') {
        if (['game', 'discovery'].includes(presentation.presentation_type)) {
          score += 5;
          reasons.push('Format engageant');
        }
      }

      // Avoid repetition penalty
      if (context?.lastPresentationId === presentation.id) {
        score -= 20;
        reasons.push('Déjà vu récemment');
      }

      // Default presentation bonus
      if (presentation.is_default && score < 20) {
        score += 15;
        reasons.push('Présentation par défaut');
      }

      return { presentation, score, reasons };
    });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  return scores[0] || null;
}

interface PresentationSelectorProps {
  presentations: SkillPresentation[];
  studentProfile: StudentProfile;
  onSelect: (presentation: SkillPresentation) => void;
  showDebug?: boolean;
}

export function PresentationSelector({ 
  presentations, 
  studentProfile, 
  onSelect,
  showDebug = false 
}: PresentationSelectorProps) {
  const result = selectBestPresentation(presentations, studentProfile);

  if (!result) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune présentation disponible
      </div>
    );
  }

  // Auto-select the best presentation
  if (!showDebug) {
    onSelect(result.presentation);
    return null;
  }

  // Debug view showing all scores
  const allScores = presentations
    .filter(p => p.is_active)
    .map(p => {
      const scored = selectBestPresentation([p], studentProfile);
      return scored;
    })
    .filter(Boolean)
    .sort((a, b) => (b?.score || 0) - (a?.score || 0));

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-700">Sélection de présentation (debug)</h3>
      
      <div className="space-y-2">
        {allScores.map((scored, index) => (
          <div 
            key={scored?.presentation.id}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              index === 0 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => scored && onSelect(scored.presentation)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">
                {scored?.presentation.presentation_type} - {scored?.presentation.pedagogical_approach}
              </span>
              <span className={`px-2 py-1 rounded text-sm font-bold ${
                index === 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {scored?.score} pts
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {scored?.reasons.map((reason, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {reason}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
