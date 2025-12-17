'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Star, Lock, Play, ChevronRight } from 'lucide-react';
import { Adventure, ADVENTURES, getAvailableAdventures } from '@/lib/adventures';

interface AdventureListProps {
  studentLevel: number;
  completedAdventures: string[];
  onSelectAdventure: (adventure: Adventure) => void;
}

const DIFFICULTY_COLORS = {
  easy: 'from-green-400 to-emerald-500',
  medium: 'from-amber-400 to-orange-500',
  hard: 'from-red-400 to-rose-500',
};

const DIFFICULTY_LABELS = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};

export default function AdventureList({ studentLevel, completedAdventures, onSelectAdventure }: AdventureListProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  const availableAdventures = getAvailableAdventures(studentLevel);
  const filteredAdventures = selectedDifficulty === 'all' 
    ? ADVENTURES 
    : ADVENTURES.filter(a => a.difficulty === selectedDifficulty);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {(['all', 'easy', 'medium', 'hard'] as const).map(diff => (
          <button
            key={diff}
            onClick={() => setSelectedDifficulty(diff)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedDifficulty === diff
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {diff === 'all' ? 'Toutes' : DIFFICULTY_LABELS[diff]}
          </button>
        ))}
      </div>

      {/* Adventures Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAdventures.map((adventure, idx) => {
          const isAvailable = availableAdventures.some(a => a.id === adventure.id);
          const isCompleted = completedAdventures.includes(adventure.id);

          return (
            <motion.div
              key={adventure.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <AdventureCard
                adventure={adventure}
                isAvailable={isAvailable}
                isCompleted={isCompleted}
                onSelect={() => isAvailable && onSelectAdventure(adventure)}
              />
            </motion.div>
          );
        })}
      </div>

      {filteredAdventures.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucune aventure disponible avec ce filtre</p>
        </div>
      )}
    </div>
  );
}

function AdventureCard({
  adventure,
  isAvailable,
  isCompleted,
  onSelect
}: {
  adventure: Adventure;
  isAvailable: boolean;
  isCompleted: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={!isAvailable}
      className={`w-full text-left rounded-2xl overflow-hidden transition-all ${
        isAvailable
          ? 'hover:shadow-xl hover:scale-[1.02] cursor-pointer'
          : 'opacity-60 cursor-not-allowed'
      }`}
    >
      {/* Header with gradient */}
      <div className={`relative h-32 bg-gradient-to-br ${DIFFICULTY_COLORS[adventure.difficulty]} p-4`}>
        <div className="absolute top-4 right-4">
          {isCompleted ? (
            <div className="flex items-center gap-1 px-2 py-1 bg-white/30 backdrop-blur-sm rounded-full">
              <Star className="h-4 w-4 text-white fill-white" />
              <span className="text-xs font-bold text-white">Terminé</span>
            </div>
          ) : !isAvailable ? (
            <div className="flex items-center gap-1 px-2 py-1 bg-black/30 backdrop-blur-sm rounded-full">
              <Lock className="h-4 w-4 text-white" />
              <span className="text-xs font-bold text-white">Niv. {adventure.requiredLevel}</span>
            </div>
          ) : null}
        </div>
        
        <div className="absolute bottom-4 left-4">
          <span className="text-5xl">{adventure.thumbnail}</span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-4 border border-t-0 border-gray-100 rounded-b-2xl">
        <h3 className="font-bold text-gray-900 mb-1">{adventure.title}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{adventure.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {adventure.estimatedTime} min
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />
              {adventure.chapters.length} chapitres
            </span>
          </div>
          
          {isAvailable && !isCompleted && (
            <div className="flex items-center gap-1 text-indigo-600 font-medium text-sm">
              <Play className="h-4 w-4 fill-indigo-600" />
              Jouer
            </div>
          )}
          
          {isCompleted && (
            <div className="flex items-center gap-1 text-green-600 font-medium text-sm">
              Rejouer
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
