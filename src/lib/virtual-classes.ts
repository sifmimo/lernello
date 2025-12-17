export interface VirtualClass {
  id: string;
  name: string;
  code: string;
  createdBy: string;
  createdAt: Date;
  members: ClassMember[];
  settings: ClassSettings;
}

export interface ClassMember {
  id: string;
  name: string;
  avatar: string;
  role: 'leader' | 'member';
  joinedAt: Date;
  weeklyXp: number;
  totalXp: number;
  currentStreak: number;
  isOnline: boolean;
}

export interface ClassSettings {
  isPublic: boolean;
  maxMembers: number;
  allowHints: boolean;
  showProgress: boolean;
}

export interface ClassChallenge {
  id: string;
  classId: string;
  title: string;
  description: string;
  targetXp: number;
  currentXp: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'failed';
  contributors: { memberId: string; xp: number }[];
}

export interface ClassActivity {
  id: string;
  classId: string;
  memberId: string;
  memberName: string;
  type: 'joined' | 'achievement' | 'streak' | 'level_up' | 'challenge_contribution';
  message: string;
  timestamp: Date;
}

export function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateMockClass(userId: string, userName: string): VirtualClass {
  return {
    id: `class_${Date.now()}`,
    name: `Équipe de ${userName}`,
    code: generateClassCode(),
    createdBy: userId,
    createdAt: new Date(),
    members: [
      {
        id: userId,
        name: userName,
        avatar: '🦊',
        role: 'leader',
        joinedAt: new Date(),
        weeklyXp: 150,
        totalXp: 1200,
        currentStreak: 5,
        isOnline: true,
      }
    ],
    settings: {
      isPublic: false,
      maxMembers: 10,
      allowHints: true,
      showProgress: true,
    }
  };
}

export function generateMockMembers(): ClassMember[] {
  const members: ClassMember[] = [
    { id: '1', name: 'Lucas', avatar: '🦁', role: 'member', joinedAt: new Date(), weeklyXp: 120, totalXp: 980, currentStreak: 3, isOnline: true },
    { id: '2', name: 'Emma', avatar: '🐼', role: 'member', joinedAt: new Date(), weeklyXp: 200, totalXp: 1500, currentStreak: 7, isOnline: false },
    { id: '3', name: 'Hugo', avatar: '🐯', role: 'member', joinedAt: new Date(), weeklyXp: 80, totalXp: 650, currentStreak: 2, isOnline: true },
    { id: '4', name: 'Léa', avatar: '🦄', role: 'member', joinedAt: new Date(), weeklyXp: 180, totalXp: 1100, currentStreak: 4, isOnline: false },
  ];
  return members;
}

export function generateMockActivities(classId: string): ClassActivity[] {
  const now = new Date();
  return [
    {
      id: '1',
      classId,
      memberId: '2',
      memberName: 'Emma',
      type: 'streak',
      message: 'a atteint une série de 7 jours ! 🔥',
      timestamp: new Date(now.getTime() - 1000 * 60 * 30),
    },
    {
      id: '2',
      classId,
      memberId: '1',
      memberName: 'Lucas',
      type: 'achievement',
      message: 'a débloqué le badge "Mathématicien" ! 🏆',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2),
    },
    {
      id: '3',
      classId,
      memberId: '4',
      memberName: 'Léa',
      type: 'level_up',
      message: 'est passée au niveau 5 ! ⭐',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 5),
    },
    {
      id: '4',
      classId,
      memberId: '3',
      memberName: 'Hugo',
      type: 'challenge_contribution',
      message: 'a contribué 50 XP au défi d\'équipe ! 💪',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 8),
    },
  ];
}

export function generateMockChallenge(classId: string): ClassChallenge {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 5);
  
  return {
    id: `challenge_${Date.now()}`,
    classId,
    title: 'Défi de la semaine',
    description: 'Gagnez 500 XP ensemble pour débloquer une récompense spéciale !',
    targetXp: 500,
    currentXp: 320,
    startDate: now,
    endDate,
    status: 'active',
    contributors: [
      { memberId: '1', xp: 80 },
      { memberId: '2', xp: 120 },
      { memberId: '3', xp: 40 },
      { memberId: '4', xp: 80 },
    ],
  };
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days === 1) return 'Hier';
  return `Il y a ${days} jours`;
}
