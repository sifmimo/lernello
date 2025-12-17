export interface SubjectTheme {
  code: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
  icon: string;
  lightBg: string;
  darkText: string;
}

export const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  math: {
    code: 'math',
    name: 'Mathématiques',
    primary: '#3B82F6',
    secondary: '#DBEAFE',
    accent: '#1D4ED8',
    gradient: 'from-blue-500 to-indigo-600',
    icon: '🔢',
    lightBg: 'bg-blue-50',
    darkText: 'text-blue-900',
  },
  french: {
    code: 'french',
    name: 'Français',
    primary: '#8B5CF6',
    secondary: '#EDE9FE',
    accent: '#6D28D9',
    gradient: 'from-violet-500 to-purple-600',
    icon: '📚',
    lightBg: 'bg-violet-50',
    darkText: 'text-violet-900',
  },
  sciences: {
    code: 'sciences',
    name: 'Sciences',
    primary: '#10B981',
    secondary: '#D1FAE5',
    accent: '#047857',
    gradient: 'from-emerald-500 to-teal-600',
    icon: '🔬',
    lightBg: 'bg-emerald-50',
    darkText: 'text-emerald-900',
  },
  history: {
    code: 'history',
    name: 'Histoire-Géographie',
    primary: '#F59E0B',
    secondary: '#FEF3C7',
    accent: '#D97706',
    gradient: 'from-amber-500 to-orange-600',
    icon: '🏛️',
    lightBg: 'bg-amber-50',
    darkText: 'text-amber-900',
  },
  informatique: {
    code: 'informatique',
    name: 'Informatique',
    primary: '#6366F1',
    secondary: '#E0E7FF',
    accent: '#4338CA',
    gradient: 'from-indigo-500 to-blue-600',
    icon: '💻',
    lightBg: 'bg-indigo-50',
    darkText: 'text-indigo-900',
  },
  music: {
    code: 'music',
    name: 'Musique',
    primary: '#EC4899',
    secondary: '#FCE7F3',
    accent: '#BE185D',
    gradient: 'from-pink-500 to-rose-600',
    icon: '🎵',
    lightBg: 'bg-pink-50',
    darkText: 'text-pink-900',
  },
  arts: {
    code: 'arts',
    name: 'Arts plastiques',
    primary: '#F97316',
    secondary: '#FFEDD5',
    accent: '#C2410C',
    gradient: 'from-orange-500 to-red-600',
    icon: '🎨',
    lightBg: 'bg-orange-50',
    darkText: 'text-orange-900',
  },
  english: {
    code: 'english',
    name: 'Anglais',
    primary: '#14B8A6',
    secondary: '#CCFBF1',
    accent: '#0D9488',
    gradient: 'from-teal-500 to-cyan-600',
    icon: '🇬🇧',
    lightBg: 'bg-teal-50',
    darkText: 'text-teal-900',
  },
};

export function getSubjectTheme(subjectCode: string): SubjectTheme {
  return SUBJECT_THEMES[subjectCode.toLowerCase()] || SUBJECT_THEMES.math;
}

export function getSubjectColor(subjectCode: string): string {
  return getSubjectTheme(subjectCode).primary;
}

export function getSubjectGradient(subjectCode: string): string {
  return getSubjectTheme(subjectCode).gradient;
}

export const DIFFICULTY_COLORS = {
  1: { bg: 'bg-green-100', text: 'text-green-700', label: 'Facile' },
  2: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Moyen' },
  3: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Difficile' },
  4: { bg: 'bg-red-100', text: 'text-red-700', label: 'Expert' },
  5: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Maître' },
};

export const MASTERY_LEVELS = {
  not_started: { color: '#E5E7EB', label: 'Non commencé', icon: '○' },
  learning: { color: '#FCD34D', label: 'En cours', icon: '◐' },
  practicing: { color: '#60A5FA', label: 'Pratique', icon: '◑' },
  mastered: { color: '#34D399', label: 'Maîtrisé', icon: '●' },
};
