export interface Decoration {
  code: string;
  name: string;
  emoji: string;
  type: 'avatar_accessory' | 'world_decoration' | 'badge_frame';
  unlockCondition: {
    type: 'skill_mastery' | 'streak' | 'level' | 'xp' | 'achievement';
    value: number;
    description: string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const DECORATIONS: Decoration[] = [
  // Avatar Accessories
  {
    code: 'crown_gold',
    name: 'Couronne dorée',
    emoji: '👑',
    type: 'avatar_accessory',
    unlockCondition: { type: 'level', value: 10, description: 'Atteindre le niveau 10' },
    rarity: 'legendary',
  },
  {
    code: 'glasses_smart',
    name: 'Lunettes de savant',
    emoji: '🤓',
    type: 'avatar_accessory',
    unlockCondition: { type: 'skill_mastery', value: 5, description: 'Maîtriser 5 compétences' },
    rarity: 'rare',
  },
  {
    code: 'hat_wizard',
    name: 'Chapeau de magicien',
    emoji: '🧙',
    type: 'avatar_accessory',
    unlockCondition: { type: 'streak', value: 7, description: 'Série de 7 jours' },
    rarity: 'epic',
  },
  {
    code: 'cape_hero',
    name: 'Cape de héros',
    emoji: '🦸',
    type: 'avatar_accessory',
    unlockCondition: { type: 'xp', value: 1000, description: 'Gagner 1000 XP' },
    rarity: 'rare',
  },

  // World Decorations
  {
    code: 'tree_magic',
    name: 'Arbre magique',
    emoji: '🌳',
    type: 'world_decoration',
    unlockCondition: { type: 'skill_mastery', value: 1, description: 'Maîtriser 1 compétence' },
    rarity: 'common',
  },
  {
    code: 'flower_garden',
    name: 'Jardin fleuri',
    emoji: '🌸',
    type: 'world_decoration',
    unlockCondition: { type: 'streak', value: 3, description: 'Série de 3 jours' },
    rarity: 'common',
  },
  {
    code: 'pond_crystal',
    name: 'Étang cristallin',
    emoji: '💧',
    type: 'world_decoration',
    unlockCondition: { type: 'level', value: 3, description: 'Atteindre le niveau 3' },
    rarity: 'rare',
  },
  {
    code: 'campfire',
    name: 'Feu de camp',
    emoji: '🔥',
    type: 'world_decoration',
    unlockCondition: { type: 'streak', value: 5, description: 'Série de 5 jours' },
    rarity: 'rare',
  },
  {
    code: 'telescope',
    name: 'Télescope',
    emoji: '🔭',
    type: 'world_decoration',
    unlockCondition: { type: 'skill_mastery', value: 10, description: 'Maîtriser 10 compétences' },
    rarity: 'epic',
  },
  {
    code: 'rainbow',
    name: 'Arc-en-ciel',
    emoji: '🌈',
    type: 'world_decoration',
    unlockCondition: { type: 'xp', value: 500, description: 'Gagner 500 XP' },
    rarity: 'rare',
  },
  {
    code: 'treasure_chest',
    name: 'Coffre au trésor',
    emoji: '💎',
    type: 'world_decoration',
    unlockCondition: { type: 'level', value: 5, description: 'Atteindre le niveau 5' },
    rarity: 'epic',
  },
  {
    code: 'rocket',
    name: 'Fusée',
    emoji: '🚀',
    type: 'world_decoration',
    unlockCondition: { type: 'skill_mastery', value: 15, description: 'Maîtriser 15 compétences' },
    rarity: 'legendary',
  },
  {
    code: 'castle_mini',
    name: 'Mini château',
    emoji: '🏰',
    type: 'world_decoration',
    unlockCondition: { type: 'level', value: 8, description: 'Atteindre le niveau 8' },
    rarity: 'legendary',
  },

  // Badge Frames
  {
    code: 'frame_bronze',
    name: 'Cadre bronze',
    emoji: '🥉',
    type: 'badge_frame',
    unlockCondition: { type: 'xp', value: 100, description: 'Gagner 100 XP' },
    rarity: 'common',
  },
  {
    code: 'frame_silver',
    name: 'Cadre argent',
    emoji: '🥈',
    type: 'badge_frame',
    unlockCondition: { type: 'xp', value: 500, description: 'Gagner 500 XP' },
    rarity: 'rare',
  },
  {
    code: 'frame_gold',
    name: 'Cadre or',
    emoji: '🥇',
    type: 'badge_frame',
    unlockCondition: { type: 'xp', value: 2000, description: 'Gagner 2000 XP' },
    rarity: 'epic',
  },
  {
    code: 'frame_diamond',
    name: 'Cadre diamant',
    emoji: '💠',
    type: 'badge_frame',
    unlockCondition: { type: 'xp', value: 5000, description: 'Gagner 5000 XP' },
    rarity: 'legendary',
  },
];

export function getDecorationByCode(code: string): Decoration | undefined {
  return DECORATIONS.find(d => d.code === code);
}

export function getDecorationsByType(type: Decoration['type']): Decoration[] {
  return DECORATIONS.filter(d => d.type === type);
}

export function checkDecorationUnlock(
  decoration: Decoration,
  stats: {
    level: number;
    totalXp: number;
    currentStreak: number;
    masteredSkills: number;
  }
): boolean {
  const { type, value } = decoration.unlockCondition;
  
  switch (type) {
    case 'level':
      return stats.level >= value;
    case 'xp':
      return stats.totalXp >= value;
    case 'streak':
      return stats.currentStreak >= value;
    case 'skill_mastery':
      return stats.masteredSkills >= value;
    default:
      return false;
  }
}

export function getUnlockableDecorations(stats: {
  level: number;
  totalXp: number;
  currentStreak: number;
  masteredSkills: number;
}): Decoration[] {
  return DECORATIONS.filter(d => checkDecorationUnlock(d, stats));
}

export const RARITY_COLORS = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-amber-400 to-orange-500',
};
