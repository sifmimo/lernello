export interface Tournament {
  id: string;
  title: string;
  description: string;
  theme: string;
  emoji: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'ended';
  rewards: TournamentReward[];
  leaderboard: LeaderboardEntry[];
  rules: string[];
  minLevel: number;
}

export interface TournamentReward {
  rank: number | 'top10' | 'top50' | 'participant';
  xp: number;
  badge?: string;
  decoration?: string;
  title?: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  score: number;
  exercisesCompleted: number;
  accuracy: number;
}

export interface TournamentParticipation {
  odId: string;
  odName: string;
  score: number;
  exercisesCompleted: number;
  correctAnswers: number;
  lastActivityAt: Date;
}

export const SEASONAL_THEMES = {
  winter: {
    name: 'Festival d\'Hiver',
    emoji: '❄️',
    colors: ['from-blue-400', 'to-cyan-300'],
    decorations: ['snowflake', 'igloo', 'penguin'],
  },
  spring: {
    name: 'Éveil du Printemps',
    emoji: '🌸',
    colors: ['from-pink-400', 'to-rose-300'],
    decorations: ['flower', 'butterfly', 'rainbow'],
  },
  summer: {
    name: 'Aventure d\'Été',
    emoji: '☀️',
    colors: ['from-amber-400', 'to-orange-300'],
    decorations: ['sun', 'beach', 'palm_tree'],
  },
  autumn: {
    name: 'Récolte d\'Automne',
    emoji: '🍂',
    colors: ['from-orange-400', 'to-amber-500'],
    decorations: ['leaf', 'pumpkin', 'acorn'],
  },
  halloween: {
    name: 'Mystères d\'Halloween',
    emoji: '🎃',
    colors: ['from-purple-600', 'to-orange-500'],
    decorations: ['ghost', 'bat', 'witch_hat'],
  },
  christmas: {
    name: 'Magie de Noël',
    emoji: '🎄',
    colors: ['from-red-500', 'to-green-500'],
    decorations: ['christmas_tree', 'gift', 'star'],
  },
};

export function getCurrentSeason(): keyof typeof SEASONAL_THEMES {
  const month = new Date().getMonth();
  
  if (month === 9) return 'halloween';
  if (month === 11) return 'christmas';
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

export function generateMockTournament(): Tournament {
  const season = getCurrentSeason();
  const theme = SEASONAL_THEMES[season];
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 7);

  return {
    id: `tournament_${season}_${now.getFullYear()}`,
    title: theme.name,
    description: `Participe au tournoi ${theme.name} et gagne des récompenses exclusives !`,
    theme: season,
    emoji: theme.emoji,
    startDate: now,
    endDate,
    status: 'active',
    minLevel: 1,
    rewards: [
      { rank: 1, xp: 500, badge: `${season}_champion`, title: 'Champion' },
      { rank: 2, xp: 300, badge: `${season}_silver`, title: 'Vice-Champion' },
      { rank: 3, xp: 200, badge: `${season}_bronze`, title: 'Médaillé' },
      { rank: 'top10', xp: 100, decoration: theme.decorations[0] },
      { rank: 'top50', xp: 50, decoration: theme.decorations[1] },
      { rank: 'participant', xp: 20 },
    ],
    leaderboard: generateMockLeaderboard(),
    rules: [
      'Complète un maximum d\'exercices pendant la durée du tournoi',
      'Chaque bonne réponse rapporte des points',
      'Les réponses rapides donnent des bonus',
      'Les séries de bonnes réponses multiplient les points',
    ],
  };
}

function generateMockLeaderboard(): LeaderboardEntry[] {
  const names = [
    'Lucas', 'Emma', 'Hugo', 'Léa', 'Nathan', 'Chloé', 'Théo', 'Manon',
    'Raphaël', 'Camille', 'Louis', 'Jade', 'Jules', 'Louise', 'Adam'
  ];
  
  const avatars = ['🦊', '🐼', '🦁', '🐯', '🐰', '🐸', '🦄', '🐻', '🐨', '🐷'];
  
  return names.map((name, idx) => ({
    rank: idx + 1,
    playerId: `player_${idx}`,
    playerName: name,
    playerAvatar: avatars[idx % avatars.length],
    score: Math.floor(1000 - idx * 50 + Math.random() * 30),
    exercisesCompleted: Math.floor(50 - idx * 2 + Math.random() * 10),
    accuracy: Math.floor(95 - idx * 2 + Math.random() * 5),
  }));
}

export function calculateTournamentScore(
  correctAnswers: number,
  totalAnswers: number,
  averageResponseTime: number,
  streak: number
): number {
  const baseScore = correctAnswers * 10;
  const accuracyBonus = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 50 : 0;
  const speedBonus = Math.max(0, (30 - averageResponseTime) * 2);
  const streakBonus = streak * 5;
  
  return Math.round(baseScore + accuracyBonus + speedBonus + streakBonus);
}

export function getRankReward(rank: number, rewards: TournamentReward[]): TournamentReward | null {
  const exactRank = rewards.find(r => r.rank === rank);
  if (exactRank) return exactRank;
  
  if (rank <= 10) return rewards.find(r => r.rank === 'top10') || null;
  if (rank <= 50) return rewards.find(r => r.rank === 'top50') || null;
  return rewards.find(r => r.rank === 'participant') || null;
}

export function formatTimeRemaining(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) return 'Terminé';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}
