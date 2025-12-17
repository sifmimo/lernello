export interface LumiContext {
  studentName: string;
  currentStreak: number;
  totalXp: number;
  level: number;
  masteredSkills: number;
  lastActivityDate?: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  isFirstVisitToday: boolean;
  recentAchievement?: string;
}

export type LumiMood = 'happy' | 'excited' | 'thinking' | 'encouraging' | 'celebrating' | 'curious' | 'proud' | 'neutral' | 'waving';

interface LumiMessage {
  message: string;
  mood: LumiMood;
}

export function getLumiGreeting(context: LumiContext): LumiMessage {
  const { studentName, currentStreak, level, masteredSkills, timeOfDay, isFirstVisitToday, recentAchievement } = context;

  // Célébration d'un achievement récent
  if (recentAchievement) {
    return {
      message: `${studentName}, tu as débloqué "${recentAchievement}" ! Je suis tellement fier de toi ! 🏆`,
      mood: 'celebrating'
    };
  }

  // Streak impressionnant
  if (currentStreak >= 7) {
    return {
      message: `Incroyable ${studentName} ! ${currentStreak} jours de suite ! Tu es une vraie star ! 🌟`,
      mood: 'celebrating'
    };
  }

  if (currentStreak >= 3) {
    return {
      message: `Super ${studentName} ! ${currentStreak} jours d'affilée, continue comme ça ! 🔥`,
      mood: 'excited'
    };
  }

  // Messages selon l'heure
  if (isFirstVisitToday) {
    switch (timeOfDay) {
      case 'morning':
        return {
          message: `Bonjour ${studentName} ! Prêt pour une super journée d'apprentissage ? ☀️`,
          mood: 'waving'
        };
      case 'afternoon':
        return {
          message: `Coucou ${studentName} ! Content de te revoir cet après-midi ! 👋`,
          mood: 'happy'
        };
      case 'evening':
        return {
          message: `Bonsoir ${studentName} ! Une petite session avant le dîner ? 🌅`,
          mood: 'waving'
        };
      case 'night':
        return {
          message: `Bonsoir ${studentName} ! Une petite session avant de dormir ? 🌙`,
          mood: 'waving'
        };
    }
  }

  // Messages basés sur la progression
  if (masteredSkills >= 10) {
    return {
      message: `${studentName}, tu as déjà maîtrisé ${masteredSkills} compétences ! Tu es incroyable ! ⭐`,
      mood: 'proud'
    };
  }

  if (level >= 5) {
    return {
      message: `Niveau ${level} ! ${studentName}, tu progresses super vite ! 🚀`,
      mood: 'excited'
    };
  }

  // Messages par défaut variés
  const defaultMessages: LumiMessage[] = [
    { message: `Salut ${studentName} ! Qu'est-ce qu'on apprend aujourd'hui ? 📚`, mood: 'curious' },
    { message: `${studentName}, je suis content de te voir ! On continue ? 😊`, mood: 'happy' },
    { message: `Hey ${studentName} ! Prêt pour de nouvelles aventures ? 🎯`, mood: 'excited' },
    { message: `${studentName}, ensemble on va faire des merveilles ! ✨`, mood: 'encouraging' },
  ];

  return defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
}

export function getLumiEncouragement(isCorrect: boolean, streakCount: number): LumiMessage {
  if (isCorrect) {
    if (streakCount >= 5) {
      return {
        message: `${streakCount} bonnes réponses d'affilée ! Tu es en feu ! 🔥`,
        mood: 'celebrating'
      };
    }
    if (streakCount >= 3) {
      return {
        message: `Bravo ! Tu as super bien répondu, continue comme ça ! 🎉`,
        mood: 'excited'
      };
    }
    const correctMessages: LumiMessage[] = [
      { message: 'Excellent ! Tu as tout compris ! ⭐', mood: 'happy' },
      { message: 'Bravo ! C\'est la bonne réponse ! 🎉', mood: 'celebrating' },
      { message: 'Super ! Tu es vraiment doué ! 👏', mood: 'proud' },
      { message: 'Parfait ! Continue comme ça ! ✨', mood: 'excited' },
    ];
    return correctMessages[Math.floor(Math.random() * correctMessages.length)];
  }

  const incorrectMessages: LumiMessage[] = [
    { message: 'Pas de souci, on apprend de ses erreurs ! 💪', mood: 'encouraging' },
    { message: 'Continue, tu vas y arriver ! 🌟', mood: 'encouraging' },
    { message: 'Réessaie, je crois en toi ! 💫', mood: 'encouraging' },
    { message: 'C\'est en pratiquant qu\'on progresse ! 📚', mood: 'thinking' },
  ];
  return incorrectMessages[Math.floor(Math.random() * incorrectMessages.length)];
}

export function getLumiHint(): LumiMessage {
  const hintMessages: LumiMessage[] = [
    { message: 'Hmm, laisse-moi réfléchir... 🤔', mood: 'thinking' },
    { message: 'Je vais t\'aider ! Voici un indice... 💡', mood: 'curious' },
    { message: 'Regarde bien la question... 🔍', mood: 'thinking' },
  ];
  return hintMessages[Math.floor(Math.random() * hintMessages.length)];
}

export function getLumiSessionComplete(correctCount: number, totalCount: number, xpEarned: number): LumiMessage {
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  if (accuracy >= 90) {
    return {
      message: `Incroyable ! ${accuracy}% de réussite et ${xpEarned} XP gagnés ! Tu es un champion ! 🏆`,
      mood: 'celebrating'
    };
  }
  if (accuracy >= 70) {
    return {
      message: `Super session ! ${correctCount}/${totalCount} bonnes réponses et ${xpEarned} XP ! 🌟`,
      mood: 'proud'
    };
  }
  if (accuracy >= 50) {
    return {
      message: `Bien joué ! Tu as gagné ${xpEarned} XP. Continue à t'entraîner ! 💪`,
      mood: 'encouraging'
    };
  }
  return {
    message: `Merci d'avoir joué ! Chaque exercice te rend plus fort ! 🌱`,
    mood: 'encouraging'
  };
}

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
