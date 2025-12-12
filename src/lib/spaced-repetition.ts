const MIN_INTERVAL = 1;
const MAX_INTERVAL = 365;
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

export interface SpacedRepetitionData {
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReviewDate: Date;
}

export type AnswerQuality = 0 | 1 | 2 | 3 | 4 | 5;

export function calculateNextReview(
  currentData: SpacedRepetitionData | null,
  quality: AnswerQuality
): SpacedRepetitionData {
  const now = new Date();
  
  if (!currentData) {
    currentData = {
      interval: MIN_INTERVAL,
      easeFactor: DEFAULT_EASE_FACTOR,
      repetitions: 0,
      nextReviewDate: now,
    };
  }

  let { interval, easeFactor, repetitions } = currentData;

  if (quality < 3) {
    repetitions = 0;
    interval = MIN_INTERVAL;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor);

  interval = Math.min(MAX_INTERVAL, Math.max(MIN_INTERVAL, interval));

  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    interval,
    easeFactor,
    repetitions,
    nextReviewDate,
  };
}

export function qualityFromCorrectness(
  isCorrect: boolean,
  timeSpentMs: number,
  hintsUsed: number
): AnswerQuality {
  if (!isCorrect) {
    return hintsUsed > 0 ? 1 : 2;
  }

  const quickThreshold = 10000;
  const slowThreshold = 60000;

  if (hintsUsed > 1) return 3;
  if (hintsUsed === 1) return 4;
  if (timeSpentMs < quickThreshold) return 5;
  if (timeSpentMs > slowThreshold) return 3;
  return 4;
}

export function getExercisesDueForReview(
  exercises: Array<{
    id: string;
    nextReviewDate: Date | null;
    mastery_level: number;
  }>,
  limit: number = 10
): string[] {
  const now = new Date();
  
  return exercises
    .filter(ex => {
      if (!ex.nextReviewDate) return true;
      return new Date(ex.nextReviewDate) <= now;
    })
    .sort((a, b) => {
      if (!a.nextReviewDate) return -1;
      if (!b.nextReviewDate) return 1;
      return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
    })
    .slice(0, limit)
    .map(ex => ex.id);
}

export function prioritizeExercises(
  exercises: Array<{
    id: string;
    mastery_level: number;
    last_attempt_at: string | null;
    nextReviewDate: Date | null;
  }>
): string[] {
  const now = new Date();
  
  const scored = exercises.map(ex => {
    let score = 0;
    
    score += (100 - ex.mastery_level) * 2;
    
    if (ex.nextReviewDate && new Date(ex.nextReviewDate) <= now) {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(ex.nextReviewDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      score += Math.min(daysOverdue * 10, 100);
    }
    
    if (!ex.last_attempt_at) {
      score += 50;
    }
    
    return { id: ex.id, score };
  });
  
  return scored
    .sort((a, b) => b.score - a.score)
    .map(ex => ex.id);
}
