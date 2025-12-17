export interface AdventureChapter {
  id: string;
  title: string;
  description: string;
  backgroundImage: string;
  character: string;
  dialogues: AdventureDialogue[];
  challenge: AdventureChallenge;
  rewards: AdventureReward;
}

export interface AdventureDialogue {
  speaker: 'narrator' | 'lumi' | 'character';
  text: string;
  emotion?: string;
}

export interface AdventureChallenge {
  type: 'math' | 'logic' | 'memory';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  hint: string;
  storyContext: string;
}

export interface AdventureReward {
  xp: number;
  decoration?: string;
  badge?: string;
  storyUnlock?: string;
}

export interface Adventure {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  chapters: AdventureChapter[];
  requiredLevel: number;
  subject: string;
}

export const ADVENTURES: Adventure[] = [
  {
    id: 'treasure_island',
    title: 'L\'Île au Trésor Mathématique',
    description: 'Aide le capitaine Lumi à trouver le trésor caché en résolvant des énigmes !',
    thumbnail: '🏝️',
    difficulty: 'easy',
    estimatedTime: 10,
    requiredLevel: 1,
    subject: 'math',
    chapters: [
      {
        id: 'chapter_1',
        title: 'Le Message Mystérieux',
        description: 'Un message codé arrive...',
        backgroundImage: 'beach',
        character: '🦜',
        dialogues: [
          { speaker: 'narrator', text: 'Sur une plage dorée, un perroquet apporte un message mystérieux...' },
          { speaker: 'lumi', text: 'Regarde ! Ce perroquet a quelque chose pour nous !', emotion: 'curious' },
          { speaker: 'character', text: 'Croa ! J\'ai un message du capitaine ! Mais il est codé !' },
          { speaker: 'lumi', text: 'Pour le décoder, il faut résoudre cette énigme !', emotion: 'excited' },
        ],
        challenge: {
          type: 'math',
          question: 'Le capitaine a caché 5 pièces d\'or, puis en a trouvé 3 de plus. Combien a-t-il de pièces maintenant ?',
          options: ['6', '7', '8', '9'],
          correctAnswer: '8',
          hint: 'Additionne les pièces cachées et les pièces trouvées !',
          storyContext: 'Ce nombre révèle la direction du trésor !'
        },
        rewards: { xp: 15, decoration: 'parrot_friend' }
      },
      {
        id: 'chapter_2',
        title: 'La Carte au Trésor',
        description: 'Déchiffre la carte !',
        backgroundImage: 'jungle',
        character: '🐒',
        dialogues: [
          { speaker: 'narrator', text: 'Dans la jungle, un singe malin garde la carte...' },
          { speaker: 'character', text: 'Hi hi ! Tu veux ma carte ? Résous mon défi !' },
          { speaker: 'lumi', text: 'On peut le faire ! Concentre-toi bien !', emotion: 'encouraging' },
        ],
        challenge: {
          type: 'math',
          question: 'Le singe a 12 bananes. Il en mange 4. Combien lui en reste-t-il ?',
          options: ['6', '7', '8', '9'],
          correctAnswer: '8',
          hint: 'Enlève les bananes mangées du total !',
          storyContext: 'Le singe te donne la carte !'
        },
        rewards: { xp: 20, decoration: 'treasure_map' }
      },
      {
        id: 'chapter_3',
        title: 'Le Coffre du Capitaine',
        description: 'Ouvre le coffre !',
        backgroundImage: 'cave',
        character: '💎',
        dialogues: [
          { speaker: 'narrator', text: 'Au fond de la grotte, le coffre brille de mille feux...' },
          { speaker: 'lumi', text: 'On y est presque ! Le code du coffre est une énigme !', emotion: 'excited' },
        ],
        challenge: {
          type: 'math',
          question: 'Le coffre contient 3 rangées de 4 diamants. Combien y a-t-il de diamants en tout ?',
          options: ['7', '10', '12', '14'],
          correctAnswer: '12',
          hint: 'Multiplie le nombre de rangées par le nombre de diamants dans chaque rangée !',
          storyContext: 'Le coffre s\'ouvre ! Tu as trouvé le trésor !'
        },
        rewards: { xp: 30, badge: 'treasure_hunter', decoration: 'golden_chest' }
      }
    ]
  },
  {
    id: 'space_mission',
    title: 'Mission Spatiale',
    description: 'Voyage dans l\'espace et sauve la station spatiale avec tes calculs !',
    thumbnail: '🚀',
    difficulty: 'medium',
    estimatedTime: 15,
    requiredLevel: 3,
    subject: 'math',
    chapters: [
      {
        id: 'space_1',
        title: 'Décollage !',
        description: 'Prépare la fusée pour le décollage',
        backgroundImage: 'launchpad',
        character: '👨‍🚀',
        dialogues: [
          { speaker: 'narrator', text: 'La base spatiale est en effervescence...' },
          { speaker: 'character', text: 'Astronaute, nous avons besoin de toi ! La station a un problème !' },
          { speaker: 'lumi', text: 'On va les aider ! Mais d\'abord, préparons le décollage !', emotion: 'excited' },
        ],
        challenge: {
          type: 'math',
          question: 'La fusée a besoin de 50 litres de carburant. Elle en a déjà 23. Combien faut-il en ajouter ?',
          options: ['25', '27', '30', '73'],
          correctAnswer: '27',
          hint: 'Calcule la différence entre ce qu\'il faut et ce qu\'on a !',
          storyContext: 'Parfait ! La fusée est prête au décollage !'
        },
        rewards: { xp: 20 }
      },
      {
        id: 'space_2',
        title: 'Navigation Stellaire',
        description: 'Guide la fusée à travers les astéroïdes',
        backgroundImage: 'space',
        character: '🛸',
        dialogues: [
          { speaker: 'narrator', text: 'L\'espace infini s\'étend devant vous...' },
          { speaker: 'lumi', text: 'Attention aux astéroïdes ! Il faut calculer la bonne trajectoire !', emotion: 'thinking' },
        ],
        challenge: {
          type: 'math',
          question: 'Il y a 8 astéroïdes à gauche et 7 à droite. Combien d\'astéroïdes au total ?',
          options: ['13', '14', '15', '16'],
          correctAnswer: '15',
          hint: 'Additionne les astéroïdes des deux côtés !',
          storyContext: 'Trajectoire calculée ! On évite les astéroïdes !'
        },
        rewards: { xp: 25, decoration: 'asteroid_dodger' }
      },
      {
        id: 'space_3',
        title: 'Réparation de la Station',
        description: 'Répare la station spatiale',
        backgroundImage: 'station',
        character: '🛰️',
        dialogues: [
          { speaker: 'narrator', text: 'La station spatiale apparaît, ses lumières clignotent...' },
          { speaker: 'character', text: 'Merci d\'être venu ! Le système de survie a besoin d\'être réparé !' },
          { speaker: 'lumi', text: 'On va y arriver ! Résous le code de réparation !', emotion: 'encouraging' },
        ],
        challenge: {
          type: 'math',
          question: 'Le système nécessite 100 unités d\'énergie. Chaque panneau solaire produit 25 unités. Combien de panneaux faut-il ?',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          hint: 'Divise l\'énergie totale par l\'énergie d\'un panneau !',
          storyContext: 'Station réparée ! Tu es un héros de l\'espace !'
        },
        rewards: { xp: 35, badge: 'space_hero', decoration: 'space_station' }
      }
    ]
  },
  {
    id: 'dragon_quest',
    title: 'La Quête du Dragon',
    description: 'Aide le dragon à retrouver ses œufs magiques perdus !',
    thumbnail: '🐉',
    difficulty: 'hard',
    estimatedTime: 20,
    requiredLevel: 5,
    subject: 'math',
    chapters: [
      {
        id: 'dragon_1',
        title: 'Le Dragon Triste',
        description: 'Rencontre le dragon',
        backgroundImage: 'mountain',
        character: '🐉',
        dialogues: [
          { speaker: 'narrator', text: 'Au sommet de la montagne, un dragon pleure...' },
          { speaker: 'character', text: 'Snif... Mes œufs magiques ont été volés par le sorcier !' },
          { speaker: 'lumi', text: 'Ne t\'inquiète pas, on va t\'aider à les retrouver !', emotion: 'encouraging' },
        ],
        challenge: {
          type: 'math',
          question: 'Le dragon avait 24 œufs dans 4 nids égaux. Combien d\'œufs par nid ?',
          options: ['4', '5', '6', '8'],
          correctAnswer: '6',
          hint: 'Divise le nombre total d\'œufs par le nombre de nids !',
          storyContext: 'Tu connais maintenant le nombre d\'œufs à chercher dans chaque cachette !'
        },
        rewards: { xp: 25 }
      },
      {
        id: 'dragon_2',
        title: 'La Tour du Sorcier',
        description: 'Infiltre la tour',
        backgroundImage: 'tower',
        character: '🧙',
        dialogues: [
          { speaker: 'narrator', text: 'La tour sombre du sorcier se dresse devant vous...' },
          { speaker: 'lumi', text: 'Le sorcier a mis des pièges mathématiques ! Sois prudent !', emotion: 'thinking' },
        ],
        challenge: {
          type: 'math',
          question: 'La tour a 7 étages. À chaque étage, il y a 3 gardes. Combien de gardes au total ?',
          options: ['18', '20', '21', '24'],
          correctAnswer: '21',
          hint: 'Multiplie le nombre d\'étages par le nombre de gardes par étage !',
          storyContext: 'Tu as déjoué les pièges ! Continue vers le sommet !'
        },
        rewards: { xp: 30, decoration: 'wizard_hat' }
      },
      {
        id: 'dragon_3',
        title: 'Le Duel Final',
        description: 'Affronte le sorcier',
        backgroundImage: 'throne',
        character: '⚔️',
        dialogues: [
          { speaker: 'narrator', text: 'Le sorcier apparaît, les œufs brillent derrière lui...' },
          { speaker: 'character', text: 'Ha ha ! Tu ne pourras jamais résoudre mon énigme ultime !' },
          { speaker: 'lumi', text: 'On peut le faire ! Concentre-toi bien !', emotion: 'excited' },
        ],
        challenge: {
          type: 'math',
          question: 'Le sorcier dit : "J\'ai pris la moitié des 24 œufs, puis j\'en ai donné 4 à mon corbeau. Combien m\'en reste-t-il ?"',
          options: ['6', '8', '10', '12'],
          correctAnswer: '8',
          hint: 'D\'abord calcule la moitié de 24, puis enlève 4 !',
          storyContext: 'Le sorcier est vaincu ! Les œufs sont sauvés !'
        },
        rewards: { xp: 50, badge: 'dragon_friend', decoration: 'dragon_egg' }
      }
    ]
  }
];

export function getAdventureById(id: string): Adventure | undefined {
  return ADVENTURES.find(a => a.id === id);
}

export function getAvailableAdventures(level: number): Adventure[] {
  return ADVENTURES.filter(a => a.requiredLevel <= level);
}

export function getAdventureProgress(adventureId: string, completedChapters: string[]): number {
  const adventure = getAdventureById(adventureId);
  if (!adventure) return 0;
  
  const completed = adventure.chapters.filter(c => completedChapters.includes(c.id)).length;
  return Math.round((completed / adventure.chapters.length) * 100);
}
