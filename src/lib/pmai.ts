export interface SessionMetrics {
  exercisesCompleted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageResponseTime: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  sessionDuration: number;
  lastActivityTime: number;
}

export interface FlowState {
  state: 'bored' | 'flow' | 'anxious' | 'fatigued';
  confidence: number;
  recommendation: 'easier' | 'same' | 'harder' | 'break' | 'change_activity';
  message: string;
}

export interface DifficultyAdjustment {
  currentDifficulty: number;
  suggestedDifficulty: number;
  reason: string;
}

const OPTIMAL_ACCURACY = 0.75;
const OPTIMAL_RESPONSE_TIME = 15;
const FATIGUE_THRESHOLD_MINUTES = 20;
const CONSECUTIVE_ERRORS_THRESHOLD = 3;
const CONSECUTIVE_SUCCESS_THRESHOLD = 5;

export function analyzeFlowState(metrics: SessionMetrics): FlowState {
  const accuracy = metrics.exercisesCompleted > 0 
    ? metrics.correctAnswers / metrics.exercisesCompleted 
    : 0;
  
  const sessionMinutes = metrics.sessionDuration / 60000;
  const timeSinceLastActivity = (Date.now() - metrics.lastActivityTime) / 1000;

  if (sessionMinutes > FATIGUE_THRESHOLD_MINUTES || timeSinceLastActivity > 60) {
    return {
      state: 'fatigued',
      confidence: 0.8,
      recommendation: 'break',
      message: 'Tu as bien travaillé ! Que dirais-tu d\'une petite pause ? 🌟'
    };
  }

  if (metrics.consecutiveIncorrect >= CONSECUTIVE_ERRORS_THRESHOLD) {
    return {
      state: 'anxious',
      confidence: 0.85,
      recommendation: 'easier',
      message: 'Pas de souci, on va essayer quelque chose de plus simple ! 💪'
    };
  }

  if (metrics.consecutiveCorrect >= CONSECUTIVE_SUCCESS_THRESHOLD && metrics.averageResponseTime < OPTIMAL_RESPONSE_TIME * 0.7) {
    return {
      state: 'bored',
      confidence: 0.75,
      recommendation: 'harder',
      message: 'Tu es vraiment fort ! On passe au niveau supérieur ? 🚀'
    };
  }

  if (accuracy >= 0.6 && accuracy <= 0.9 && metrics.averageResponseTime <= OPTIMAL_RESPONSE_TIME * 1.5) {
    return {
      state: 'flow',
      confidence: 0.9,
      recommendation: 'same',
      message: 'Tu es dans le rythme, continue comme ça ! ⭐'
    };
  }

  if (accuracy < 0.5) {
    return {
      state: 'anxious',
      confidence: 0.7,
      recommendation: 'easier',
      message: 'On va revoir les bases ensemble ! 📚'
    };
  }

  return {
    state: 'flow',
    confidence: 0.6,
    recommendation: 'same',
    message: 'Continue, tu fais du bon travail ! 🌈'
  };
}

export function calculateDifficultyAdjustment(
  currentDifficulty: number,
  flowState: FlowState
): DifficultyAdjustment {
  let suggestedDifficulty = currentDifficulty;
  let reason = '';

  switch (flowState.recommendation) {
    case 'easier':
      suggestedDifficulty = Math.max(1, currentDifficulty - 1);
      reason = 'Difficulté réduite pour renforcer la confiance';
      break;
    case 'harder':
      suggestedDifficulty = Math.min(5, currentDifficulty + 1);
      reason = 'Difficulté augmentée pour maintenir l\'engagement';
      break;
    case 'same':
      reason = 'Niveau optimal maintenu';
      break;
    case 'break':
      reason = 'Pause suggérée - fatigue détectée';
      break;
    case 'change_activity':
      reason = 'Changement d\'activité recommandé';
      break;
  }

  return {
    currentDifficulty,
    suggestedDifficulty,
    reason
  };
}

export function detectFatigue(metrics: SessionMetrics): {
  isFatigued: boolean;
  fatigueLevel: 'none' | 'mild' | 'moderate' | 'high';
  suggestion: string;
} {
  const sessionMinutes = metrics.sessionDuration / 60000;
  const recentAccuracy = metrics.exercisesCompleted > 3 
    ? metrics.correctAnswers / metrics.exercisesCompleted 
    : 1;
  
  const responseTimeIncrease = metrics.averageResponseTime > OPTIMAL_RESPONSE_TIME * 1.5;
  const accuracyDrop = recentAccuracy < 0.5;
  const longSession = sessionMinutes > 15;

  let fatigueScore = 0;
  if (responseTimeIncrease) fatigueScore += 2;
  if (accuracyDrop) fatigueScore += 2;
  if (longSession) fatigueScore += 1;
  if (sessionMinutes > 25) fatigueScore += 2;

  if (fatigueScore >= 5) {
    return {
      isFatigued: true,
      fatigueLevel: 'high',
      suggestion: 'C\'est le moment idéal pour une pause ! Tu as super bien travaillé. 🌟'
    };
  }
  
  if (fatigueScore >= 3) {
    return {
      isFatigued: true,
      fatigueLevel: 'moderate',
      suggestion: 'Tu veux faire une petite pause ou changer d\'activité ? 🎮'
    };
  }
  
  if (fatigueScore >= 1) {
    return {
      isFatigued: false,
      fatigueLevel: 'mild',
      suggestion: 'Tu te débrouilles bien ! Continue à ton rythme. 💪'
    };
  }

  return {
    isFatigued: false,
    fatigueLevel: 'none',
    suggestion: ''
  };
}

export function getSpacedRepetitionInterval(
  masteryLevel: number,
  lastReviewDate: Date,
  correctStreak: number
): number {
  const baseIntervals = [1, 3, 7, 14, 30, 60, 120];
  const index = Math.min(masteryLevel, baseIntervals.length - 1);
  let interval = baseIntervals[index];

  if (correctStreak >= 3) {
    interval *= 1.5;
  } else if (correctStreak === 0) {
    interval *= 0.5;
  }

  return Math.round(interval);
}

export function shouldReviewSkill(
  lastReviewDate: Date,
  masteryLevel: number,
  correctStreak: number
): boolean {
  const interval = getSpacedRepetitionInterval(masteryLevel, lastReviewDate, correctStreak);
  const daysSinceReview = (Date.now() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysSinceReview >= interval;
}

export function createInitialMetrics(): SessionMetrics {
  return {
    exercisesCompleted: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    averageResponseTime: 0,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    sessionDuration: 0,
    lastActivityTime: Date.now()
  };
}

export function updateMetrics(
  metrics: SessionMetrics,
  isCorrect: boolean,
  responseTime: number,
  sessionStartTime: number
): SessionMetrics {
  const newMetrics = { ...metrics };
  
  newMetrics.exercisesCompleted += 1;
  newMetrics.lastActivityTime = Date.now();
  newMetrics.sessionDuration = Date.now() - sessionStartTime;
  
  if (isCorrect) {
    newMetrics.correctAnswers += 1;
    newMetrics.consecutiveCorrect += 1;
    newMetrics.consecutiveIncorrect = 0;
  } else {
    newMetrics.incorrectAnswers += 1;
    newMetrics.consecutiveIncorrect += 1;
    newMetrics.consecutiveCorrect = 0;
  }
  
  const totalTime = metrics.averageResponseTime * (metrics.exercisesCompleted) + responseTime;
  newMetrics.averageResponseTime = totalTime / newMetrics.exercisesCompleted;
  
  return newMetrics;
}
