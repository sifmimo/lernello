import {
  calculateNextReview,
  qualityFromCorrectness,
  prioritizeExercises,
  SpacedRepetitionData,
  AnswerQuality,
} from '@/lib/spaced-repetition';

describe('Spaced Repetition Algorithm', () => {
  describe('calculateNextReview', () => {
    it('should reset interval for quality < 3', () => {
      const currentData: SpacedRepetitionData = {
        easeFactor: 2.5,
        interval: 10,
        repetitions: 5,
        nextReviewDate: new Date(),
      };
      const result = calculateNextReview(currentData, 2 as AnswerQuality);

      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });

    it('should set interval to 1 for first successful review', () => {
      const result = calculateNextReview(null, 4 as AnswerQuality);

      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it('should set interval to 6 for second successful review', () => {
      const currentData: SpacedRepetitionData = {
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
        nextReviewDate: new Date(),
      };
      const result = calculateNextReview(currentData, 4 as AnswerQuality);

      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it('should multiply interval by ease factor for subsequent reviews', () => {
      const currentData: SpacedRepetitionData = {
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
        nextReviewDate: new Date(),
      };
      const result = calculateNextReview(currentData, 4 as AnswerQuality);

      expect(result.interval).toBe(15);
      expect(result.repetitions).toBe(3);
    });

    it('should not let ease factor go below 1.3', () => {
      const currentData: SpacedRepetitionData = {
        easeFactor: 1.3,
        interval: 6,
        repetitions: 2,
        nextReviewDate: new Date(),
      };
      const result = calculateNextReview(currentData, 3 as AnswerQuality);

      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });
  });

  describe('qualityFromCorrectness', () => {
    it('should return 5 for correct answer without hints and quick response', () => {
      expect(qualityFromCorrectness(true, 5000, 0)).toBe(5);
    });

    it('should return 4 for correct answer with one hint', () => {
      expect(qualityFromCorrectness(true, 5000, 1)).toBe(4);
    });

    it('should return 3 for correct answer with multiple hints', () => {
      expect(qualityFromCorrectness(true, 5000, 3)).toBe(3);
    });

    it('should return 2 for incorrect answer without hints', () => {
      expect(qualityFromCorrectness(false, 5000, 0)).toBe(2);
    });

    it('should return 1 for incorrect answer with hints', () => {
      expect(qualityFromCorrectness(false, 5000, 2)).toBe(1);
    });
  });

  describe('prioritizeExercises', () => {
    it('should prioritize exercises with lower mastery', () => {
      const exercises = [
        { id: '1', mastery_level: 80, last_attempt_at: '2024-01-01', nextReviewDate: null },
        { id: '2', mastery_level: 20, last_attempt_at: '2024-01-01', nextReviewDate: null },
        { id: '3', mastery_level: 50, last_attempt_at: '2024-01-01', nextReviewDate: null },
      ];

      const prioritized = prioritizeExercises(exercises);

      expect(prioritized[0]).toBe('2');
    });

    it('should prioritize exercises without attempts', () => {
      const exercises = [
        { id: '1', mastery_level: 50, last_attempt_at: '2024-01-01', nextReviewDate: null },
        { id: '2', mastery_level: 50, last_attempt_at: null, nextReviewDate: null },
      ];

      const prioritized = prioritizeExercises(exercises);

      expect(prioritized[0]).toBe('2');
    });
  });
});
