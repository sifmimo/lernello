'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Star, Sparkles, TreePine, Mountain, Castle } from 'lucide-react';
import { getWorld, WorldConfig } from '@/server/actions/world';
import { getUnlockedDecorations } from '@/server/actions/avatar';

interface LearningWorldProps {
  studentId: string;
  masteredSkillsCount: number;
}

const ZONES = [
  { id: 'starter_island', name: 'Île du Départ', emoji: '🏝️', requiredSkills: 0, color: 'from-green-400 to-emerald-500' },
  { id: 'math_forest', name: 'Forêt des Nombres', emoji: '🌲', requiredSkills: 3, color: 'from-emerald-500 to-teal-500' },
  { id: 'science_mountain', name: 'Montagne des Sciences', emoji: '⛰️', requiredSkills: 6, color: 'from-blue-400 to-indigo-500' },
  { id: 'language_castle', name: 'Château des Mots', emoji: '🏰', requiredSkills: 10, color: 'from-purple-400 to-pink-500' },
  { id: 'creativity_cloud', name: 'Nuage Créatif', emoji: '☁️', requiredSkills: 15, color: 'from-pink-400 to-rose-500' },
  { id: 'master_temple', name: 'Temple des Maîtres', emoji: '🏛️', requiredSkills: 20, color: 'from-amber-400 to-orange-500' },
];

const DECORATIONS_CATALOG = [
  { code: 'tree_basic', name: 'Arbre', emoji: '🌳', type: 'world_decoration' },
  { code: 'flower_garden', name: 'Jardin fleuri', emoji: '🌸', type: 'world_decoration' },
  { code: 'pond', name: 'Étang', emoji: '💧', type: 'world_decoration' },
  { code: 'campfire', name: 'Feu de camp', emoji: '🔥', type: 'world_decoration' },
  { code: 'telescope', name: 'Télescope', emoji: '🔭', type: 'world_decoration' },
  { code: 'rainbow', name: 'Arc-en-ciel', emoji: '🌈', type: 'world_decoration' },
  { code: 'treasure', name: 'Coffre au trésor', emoji: '💎', type: 'world_decoration' },
  { code: 'rocket', name: 'Fusée', emoji: '🚀', type: 'world_decoration' },
];

export default function LearningWorld({ studentId, masteredSkillsCount }: LearningWorldProps) {
  const [world, setWorld] = useState<WorldConfig | null>(null);
  const [unlockedDecorations, setUnlockedDecorations] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorld();
  }, [studentId]);

  const loadWorld = async () => {
    const [worldData, decorations] = await Promise.all([
      getWorld(studentId),
      getUnlockedDecorations(studentId),
    ]);
    setWorld(worldData);
    setUnlockedDecorations(decorations.map(d => d.decoration_code));
    setLoading(false);
  };

  const isZoneUnlocked = (requiredSkills: number) => {
    return masteredSkillsCount >= requiredSkills;
  };

  if (loading) {
    return (
      <div className="animate-pulse h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl" />
    );
  }

  return (
    <div className="bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 rounded-2xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              Mon Univers
            </h2>
            <p className="text-gray-600">Niveau {world?.worldLevel || 1} • {masteredSkillsCount} compétences maîtrisées</p>
          </div>
          <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full">
            <Star className="h-5 w-5 text-amber-500" />
            <span className="font-semibold">{world?.unlockedZones?.length || 1} zones débloquées</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {ZONES.map((zone, index) => {
            const unlocked = isZoneUnlocked(zone.requiredSkills);
            const isSelected = selectedZone === zone.id;

            return (
              <motion.button
                key={zone.id}
                whileHover={unlocked ? { scale: 1.05, y: -5 } : {}}
                whileTap={unlocked ? { scale: 0.95 } : {}}
                onClick={() => unlocked && setSelectedZone(isSelected ? null : zone.id)}
                className={`relative p-4 rounded-2xl text-left transition-all ${
                  unlocked
                    ? `bg-gradient-to-br ${zone.color} text-white shadow-lg cursor-pointer`
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                } ${isSelected ? 'ring-4 ring-white ring-offset-2' : ''}`}
              >
                {!unlocked && (
                  <div className="absolute inset-0 bg-gray-400/50 rounded-2xl flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-2">
                      <Lock className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                )}
                <span className="text-4xl block mb-2">{zone.emoji}</span>
                <h3 className="font-bold text-sm">{zone.name}</h3>
                <p className="text-xs opacity-80">
                  {unlocked ? 'Débloqué !' : `${zone.requiredSkills} compétences requises`}
                </p>
                {index === 0 && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full"
                  >
                    START
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {selectedZone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              {ZONES.find(z => z.id === selectedZone)?.emoji}
              {ZONES.find(z => z.id === selectedZone)?.name}
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">Décorations disponibles :</p>
              <div className="flex flex-wrap gap-2">
                {DECORATIONS_CATALOG.map(deco => {
                  const isUnlocked = unlockedDecorations.includes(deco.code);
                  const isPlaced = world?.placedDecorations?.some(
                    p => p.decorationCode === deco.code
                  );

                  return (
                    <motion.div
                      key={deco.code}
                      whileHover={isUnlocked ? { scale: 1.1 } : {}}
                      className={`p-3 rounded-xl text-center ${
                        isUnlocked
                          ? isPlaced
                            ? 'bg-green-100 border-2 border-green-500'
                            : 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                          : 'bg-gray-100 opacity-50'
                      }`}
                    >
                      <span className="text-2xl block">{deco.emoji}</span>
                      <span className="text-xs text-gray-600">{deco.name}</span>
                      {!isUnlocked && <Lock className="h-3 w-3 mx-auto mt-1 text-gray-400" />}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 rounded-full p-2">
                  <TreePine className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">Astuce</p>
                  <p className="text-sm text-amber-700">
                    Maîtrise plus de compétences pour débloquer de nouvelles décorations et zones !
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-6 bg-white/60 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mountain className="h-6 w-6 text-indigo-500" />
              <div>
                <p className="font-medium text-gray-900">Prochaine zone</p>
                <p className="text-sm text-gray-600">
                  {(() => {
                    const nextZone = ZONES.find(z => !isZoneUnlocked(z.requiredSkills));
                    if (!nextZone) return 'Toutes les zones sont débloquées !';
                    const remaining = nextZone.requiredSkills - masteredSkillsCount;
                    return `${remaining} compétence${remaining > 1 ? 's' : ''} pour débloquer ${nextZone.name}`;
                  })()}
                </p>
              </div>
            </div>
            <Castle className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
