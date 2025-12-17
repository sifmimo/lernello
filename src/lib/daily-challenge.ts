export interface DailyChallenge {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'math' | 'logic' | 'memory' | 'speed';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  hint: string;
  xpReward: number;
  bonusXp: number;
  timeLimit?: number;
}

const CHALLENGE_TEMPLATES: Omit<DailyChallenge, 'id' | 'date'>[] = [
  {
    title: 'Calcul Express',
    description: 'Résous ce calcul le plus vite possible !',
    type: 'speed',
    difficulty: 'easy',
    question: 'Combien font 7 + 8 ?',
    options: ['13', '14', '15', '16'],
    correctAnswer: '15',
    hint: 'Pense à 7 + 7 + 1',
    xpReward: 25,
    bonusXp: 10,
    timeLimit: 30,
  },
  {
    title: 'Défi Logique',
    description: 'Trouve le nombre manquant dans la suite !',
    type: 'logic',
    difficulty: 'medium',
    question: 'Quelle est la suite : 2, 4, 6, 8, ?',
    options: ['9', '10', '11', '12'],
    correctAnswer: '10',
    hint: 'Les nombres augmentent de 2 à chaque fois',
    xpReward: 30,
    bonusXp: 15,
  },
  {
    title: 'Problème du Jour',
    description: 'Un problème pour réfléchir !',
    type: 'math',
    difficulty: 'medium',
    question: 'Marie a 12 bonbons. Elle en donne la moitié à son frère. Combien lui en reste-t-il ?',
    options: ['4', '5', '6', '7'],
    correctAnswer: '6',
    hint: 'La moitié de 12, c\'est 12 divisé par 2',
    xpReward: 35,
    bonusXp: 15,
  },
  {
    title: 'Multiplication Mystère',
    description: 'Trouve le résultat de cette multiplication !',
    type: 'math',
    difficulty: 'hard',
    question: 'Combien font 6 × 7 ?',
    options: ['40', '41', '42', '43'],
    correctAnswer: '42',
    hint: 'Pense à 6 × 7 = 6 × 5 + 6 × 2',
    xpReward: 40,
    bonusXp: 20,
    timeLimit: 45,
  },
  {
    title: 'Suite Numérique',
    description: 'Complète cette suite de nombres !',
    type: 'logic',
    difficulty: 'hard',
    question: 'Quelle est la suite : 1, 4, 9, 16, ?',
    options: ['20', '23', '25', '27'],
    correctAnswer: '25',
    hint: 'Ce sont les carrés : 1², 2², 3², 4², 5²',
    xpReward: 50,
    bonusXp: 25,
  },
];

export function getDailyChallenge(): DailyChallenge {
  const today = new Date().toISOString().split('T')[0];
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const templateIndex = dayOfYear % CHALLENGE_TEMPLATES.length;
  const template = CHALLENGE_TEMPLATES[templateIndex];

  return {
    ...template,
    id: `daily_${today}`,
    date: today,
  };
}

export function hasCompletedDailyChallenge(completedChallenges: string[]): boolean {
  const today = new Date().toISOString().split('T')[0];
  return completedChallenges.includes(`daily_${today}`);
}

export function getStreakBonus(streak: number): number {
  if (streak >= 30) return 50;
  if (streak >= 14) return 30;
  if (streak >= 7) return 20;
  if (streak >= 3) return 10;
  return 0;
}

export function formatTimeRemaining(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}min`;
}
