'use server';

export type EncouragementContext = 
  | 'correct_answer'
  | 'incorrect_answer'
  | 'streak_3'
  | 'streak_5'
  | 'streak_10'
  | 'session_complete'
  | 'skill_mastered'
  | 'first_exercise'
  | 'comeback'
  | 'struggle';

interface EncouragementMessage {
  text: string;
  emoji: string;
}

const encouragementMessages: Record<EncouragementContext, Record<string, EncouragementMessage[]>> = {
  correct_answer: {
    fr: [
      { text: 'Bravo !', emoji: '🎉' },
      { text: 'Super !', emoji: '⭐' },
      { text: 'Excellent !', emoji: '👏' },
      { text: 'Génial !', emoji: '🌟' },
      { text: 'Parfait !', emoji: '✨' },
      { text: 'Bien joué !', emoji: '👍' },
    ],
    ar: [
      { text: 'أحسنت!', emoji: '🎉' },
      { text: 'ممتاز!', emoji: '⭐' },
      { text: 'رائع!', emoji: '👏' },
    ],
    en: [
      { text: 'Great job!', emoji: '🎉' },
      { text: 'Awesome!', emoji: '⭐' },
      { text: 'Excellent!', emoji: '👏' },
    ],
  },
  incorrect_answer: {
    fr: [
      { text: 'Pas grave, réessaie !', emoji: '💪' },
      { text: 'Continue, tu vas y arriver !', emoji: '🌈' },
      { text: 'Presque ! Encore un effort !', emoji: '🎯' },
      { text: 'Tu progresses, continue !', emoji: '📈' },
    ],
    ar: [
      { text: 'لا بأس، حاول مرة أخرى!', emoji: '💪' },
      { text: 'استمر، ستنجح!', emoji: '🌈' },
    ],
    en: [
      { text: "Don't worry, try again!", emoji: '💪' },
      { text: 'Keep going, you got this!', emoji: '🌈' },
    ],
  },
  streak_3: {
    fr: [
      { text: '3 bonnes réponses de suite !', emoji: '🔥' },
      { text: 'Tu es en forme !', emoji: '💫' },
    ],
    ar: [
      { text: '3 إجابات صحيحة متتالية!', emoji: '🔥' },
    ],
    en: [
      { text: '3 correct answers in a row!', emoji: '🔥' },
    ],
  },
  streak_5: {
    fr: [
      { text: '5 bonnes réponses ! Incroyable !', emoji: '🚀' },
      { text: 'Quelle série ! Continue !', emoji: '⚡' },
    ],
    ar: [
      { text: '5 إجابات صحيحة! رائع!', emoji: '🚀' },
    ],
    en: [
      { text: '5 correct answers! Amazing!', emoji: '🚀' },
    ],
  },
  streak_10: {
    fr: [
      { text: '10 bonnes réponses ! Tu es un champion !', emoji: '🏆' },
      { text: 'Extraordinaire ! 10 de suite !', emoji: '👑' },
    ],
    ar: [
      { text: '10 إجابات صحيحة! أنت بطل!', emoji: '🏆' },
    ],
    en: [
      { text: '10 correct answers! You are a champion!', emoji: '🏆' },
    ],
  },
  session_complete: {
    fr: [
      { text: 'Session terminée ! Bien joué !', emoji: '🎊' },
      { text: 'Super session ! À bientôt !', emoji: '🌟' },
    ],
    ar: [
      { text: 'انتهت الجلسة! أحسنت!', emoji: '🎊' },
    ],
    en: [
      { text: 'Session complete! Well done!', emoji: '🎊' },
    ],
  },
  skill_mastered: {
    fr: [
      { text: 'Compétence maîtrisée !', emoji: '🏅' },
      { text: 'Tu as tout compris !', emoji: '🎓' },
    ],
    ar: [
      { text: 'أتقنت المهارة!', emoji: '🏅' },
    ],
    en: [
      { text: 'Skill mastered!', emoji: '🏅' },
    ],
  },
  first_exercise: {
    fr: [
      { text: 'Premier exercice ! C\'est parti !', emoji: '🚀' },
      { text: 'Bienvenue ! Bonne chance !', emoji: '🍀' },
    ],
    ar: [
      { text: 'التمرين الأول! هيا بنا!', emoji: '🚀' },
    ],
    en: [
      { text: 'First exercise! Let\'s go!', emoji: '🚀' },
    ],
  },
  comeback: {
    fr: [
      { text: 'Content de te revoir !', emoji: '👋' },
      { text: 'Bon retour ! Prêt à apprendre ?', emoji: '📚' },
    ],
    ar: [
      { text: 'سعيد برؤيتك مجدداً!', emoji: '👋' },
    ],
    en: [
      { text: 'Welcome back!', emoji: '👋' },
    ],
  },
  struggle: {
    fr: [
      { text: 'Prends ton temps, tu vas y arriver !', emoji: '🌟' },
      { text: 'C\'est normal de trouver ça difficile.', emoji: '💪' },
      { text: 'Chaque erreur est une occasion d\'apprendre !', emoji: '📖' },
    ],
    ar: [
      { text: 'خذ وقتك، ستنجح!', emoji: '🌟' },
    ],
    en: [
      { text: 'Take your time, you will get it!', emoji: '🌟' },
    ],
  },
};

export async function getEncouragementMessage(
  context: EncouragementContext,
  language: string = 'fr'
): Promise<EncouragementMessage> {
  const messages = encouragementMessages[context]?.[language] || 
                   encouragementMessages[context]?.['fr'] ||
                   [{ text: 'Continue !', emoji: '💪' }];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

export async function getStreakEncouragement(
  streakCount: number,
  language: string = 'fr'
): Promise<EncouragementMessage | null> {
  if (streakCount === 3) {
    return getEncouragementMessage('streak_3', language);
  }
  if (streakCount === 5) {
    return getEncouragementMessage('streak_5', language);
  }
  if (streakCount === 10 || streakCount % 10 === 0) {
    return getEncouragementMessage('streak_10', language);
  }
  return null;
}

export async function getContextualEncouragement(
  isCorrect: boolean,
  streakCount: number,
  consecutiveErrors: number,
  language: string = 'fr'
): Promise<EncouragementMessage> {
  if (consecutiveErrors >= 3) {
    return getEncouragementMessage('struggle', language);
  }
  
  const streakMessage = await getStreakEncouragement(streakCount, language);
  if (streakMessage) {
    return streakMessage;
  }
  
  if (isCorrect) {
    return getEncouragementMessage('correct_answer', language);
  }
  
  return getEncouragementMessage('incorrect_answer', language);
}
