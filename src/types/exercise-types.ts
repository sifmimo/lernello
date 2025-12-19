export const EXERCISE_TYPES = {
  // Types de base
  qcm: {
    id: 'qcm',
    name: 'QCM',
    description: 'Question à choix multiple (4 options)',
    icon: '📝',
    category: 'basic',
    requiresMedia: false,
  },
  fill_blank: {
    id: 'fill_blank',
    name: 'Texte à trous',
    description: 'Compléter les blancs dans une phrase',
    icon: '✏️',
    category: 'basic',
    requiresMedia: false,
  },
  free_input: {
    id: 'free_input',
    name: 'Réponse libre',
    description: 'Saisie de texte avec évaluation IA',
    icon: '💬',
    category: 'basic',
    requiresMedia: false,
  },
  
  // Types interactifs
  drag_drop: {
    id: 'drag_drop',
    name: 'Glisser-déposer',
    description: 'Ordonner des éléments par glisser-déposer',
    icon: '🔀',
    category: 'interactive',
    requiresMedia: false,
  },
  match_pairs: {
    id: 'match_pairs',
    name: 'Association',
    description: 'Relier des paires correspondantes',
    icon: '🔗',
    category: 'interactive',
    requiresMedia: false,
  },
  sorting: {
    id: 'sorting',
    name: 'Tri/Classement',
    description: 'Classer des éléments dans des catégories',
    icon: '📊',
    category: 'interactive',
    requiresMedia: false,
  },
  
  // Types multimédia
  audio_listen: {
    id: 'audio_listen',
    name: 'Écoute audio',
    description: 'Écouter un audio et répondre à une question',
    icon: '🎧',
    category: 'multimedia',
    requiresMedia: true,
  },
  audio_record: {
    id: 'audio_record',
    name: 'Enregistrement vocal',
    description: 'Enregistrer sa voix pour répondre',
    icon: '🎤',
    category: 'multimedia',
    requiresMedia: false,
  },
  video_watch: {
    id: 'video_watch',
    name: 'Vidéo interactive',
    description: 'Regarder une vidéo et répondre à des questions',
    icon: '🎬',
    category: 'multimedia',
    requiresMedia: true,
  },
  
  // Types créatifs
  drawing: {
    id: 'drawing',
    name: 'Dessin',
    description: 'Dessiner une réponse ou compléter un schéma',
    icon: '🎨',
    category: 'creative',
    requiresMedia: false,
  },
  animation: {
    id: 'animation',
    name: 'Animation interactive',
    description: 'Interagir avec une animation pour apprendre',
    icon: '✨',
    category: 'creative',
    requiresMedia: false,
  },
  
  // Types avancés
  image_qcm: {
    id: 'image_qcm',
    name: 'QCM avec images',
    description: 'Choisir parmi des images',
    icon: '🖼️',
    category: 'advanced',
    requiresMedia: true,
  },
  hotspot: {
    id: 'hotspot',
    name: 'Zone cliquable',
    description: 'Cliquer sur la bonne zone d\'une image',
    icon: '🎯',
    category: 'advanced',
    requiresMedia: true,
  },
  timeline: {
    id: 'timeline',
    name: 'Chronologie',
    description: 'Placer des événements sur une frise chronologique',
    icon: '📅',
    category: 'advanced',
    requiresMedia: false,
  },
  puzzle: {
    id: 'puzzle',
    name: 'Puzzle',
    description: 'Reconstituer une image ou un concept',
    icon: '🧩',
    category: 'advanced',
    requiresMedia: true,
  },
} as const;

export type ExerciseTypeId = keyof typeof EXERCISE_TYPES;

export const EXERCISE_CATEGORIES = {
  basic: { name: 'Basique', description: 'Exercices fondamentaux' },
  interactive: { name: 'Interactif', description: 'Exercices avec manipulation' },
  multimedia: { name: 'Multimédia', description: 'Exercices avec audio/vidéo' },
  creative: { name: 'Créatif', description: 'Exercices de création' },
  advanced: { name: 'Avancé', description: 'Exercices complexes' },
} as const;

export type ExerciseCategoryId = keyof typeof EXERCISE_CATEGORIES;

export interface SkillExerciseConfig {
  skill_id: string;
  allowed_types: ExerciseTypeId[];
  preferred_types?: ExerciseTypeId[];
  disabled_types?: ExerciseTypeId[];
}

export const DEFAULT_ALLOWED_TYPES: ExerciseTypeId[] = [
  'qcm',
  'fill_blank',
  'free_input',
  'drag_drop',
  'match_pairs',
  'sorting',
  'image_qcm',
];

export function getExerciseTypeInfo(typeId: string) {
  return EXERCISE_TYPES[typeId as ExerciseTypeId] || null;
}

export function getExerciseTypesByCategory(category: ExerciseCategoryId): ExerciseTypeId[] {
  return (Object.entries(EXERCISE_TYPES) as [ExerciseTypeId, typeof EXERCISE_TYPES[ExerciseTypeId]][])
    .filter(([, info]) => info.category === category)
    .map(([id]) => id);
}

export function getAllExerciseTypes(): ExerciseTypeId[] {
  return Object.keys(EXERCISE_TYPES) as ExerciseTypeId[];
}
