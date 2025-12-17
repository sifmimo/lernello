'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, Sparkles, Gift } from 'lucide-react';
import { DECORATIONS, Decoration, RARITY_COLORS, checkDecorationUnlock } from '@/lib/decorations';
import { getUnlockedDecorations, unlockDecoration } from '@/server/actions/avatar';
import { getStudentDashboardStats } from '@/server/actions/progress';

interface DecorationShopProps {
  studentId: string;
}

export default function DecorationShop({ studentId }: DecorationShopProps) {
  const [unlockedCodes, setUnlockedCodes] = useState<string[]>([]);
  const [stats, setStats] = useState({ level: 1, totalXp: 0, currentStreak: 0, masteredSkills: 0 });
  const [selectedType, setSelectedType] = useState<'all' | 'avatar_accessory' | 'world_decoration' | 'badge_frame'>('all');
  const [loading, setLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    const [decorations, dashStats] = await Promise.all([
      getUnlockedDecorations(studentId),
      getStudentDashboardStats(studentId),
    ]);

    const codes = decorations.map(d => d.decoration_code);
    setUnlockedCodes(codes);
    setStats({
      level: dashStats.currentLevel,
      totalXp: dashStats.totalXp,
      currentStreak: dashStats.dailyStreak,
      masteredSkills: dashStats.masteredSkills,
    });

    // Check for new unlockable decorations
    const newUnlocks: string[] = [];
    for (const deco of DECORATIONS) {
      if (!codes.includes(deco.code) && checkDecorationUnlock(deco, {
        level: dashStats.currentLevel,
        totalXp: dashStats.totalXp,
        currentStreak: dashStats.dailyStreak,
        masteredSkills: dashStats.masteredSkills,
      })) {
        await unlockDecoration(studentId, deco.type, deco.code);
        newUnlocks.push(deco.code);
      }
    }

    if (newUnlocks.length > 0) {
      setUnlockedCodes(prev => [...prev, ...newUnlocks]);
      setNewlyUnlocked(newUnlocks);
    }

    setLoading(false);
  };

  const filteredDecorations = selectedType === 'all' 
    ? DECORATIONS 
    : DECORATIONS.filter(d => d.type === selectedType);

  const typeLabels = {
    all: 'Tout',
    avatar_accessory: 'Avatar',
    world_decoration: 'Monde',
    badge_frame: 'Cadres',
  };

  if (loading) {
    return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Gift className="h-6 w-6" />
          Boutique de décorations
        </h2>
        <p className="text-purple-100 mt-1">
          Débloque des récompenses en progressant !
        </p>
      </div>

      <div className="p-4 border-b flex gap-2 overflow-x-auto">
        {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedType === type
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {typeLabels[type]}
          </button>
        ))}
      </div>

      <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredDecorations.map(decoration => {
          const isUnlocked = unlockedCodes.includes(decoration.code);
          const canUnlock = checkDecorationUnlock(decoration, stats);
          const isNew = newlyUnlocked.includes(decoration.code);

          return (
            <DecorationCard
              key={decoration.code}
              decoration={decoration}
              isUnlocked={isUnlocked}
              canUnlock={canUnlock}
              isNew={isNew}
            />
          );
        })}
      </div>

      <div className="p-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {unlockedCodes.length} / {DECORATIONS.length} débloquées
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-gradient-to-r from-gray-400 to-gray-500" />
              Commun
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
              Rare
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-600" />
              Épique
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
              Légendaire
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DecorationCard({
  decoration,
  isUnlocked,
  canUnlock,
  isNew,
}: {
  decoration: Decoration;
  isUnlocked: boolean;
  canUnlock: boolean;
  isNew: boolean;
}) {
  return (
    <motion.div
      initial={isNew ? { scale: 0.8, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative p-4 rounded-xl border-2 text-center transition-all ${
        isUnlocked
          ? 'border-green-300 bg-green-50'
          : canUnlock
          ? 'border-purple-300 bg-purple-50'
          : 'border-gray-200 bg-gray-50 opacity-60'
      }`}
    >
      {isNew && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"
        >
          <Sparkles className="h-3 w-3" />
          NEW
        </motion.div>
      )}

      <div className={`absolute top-2 left-2 h-2 w-2 rounded-full bg-gradient-to-r ${RARITY_COLORS[decoration.rarity]}`} />

      <span className="text-4xl block mb-2">{decoration.emoji}</span>
      <h3 className="font-semibold text-gray-900 text-sm">{decoration.name}</h3>
      
      {isUnlocked ? (
        <div className="mt-2 flex items-center justify-center gap-1 text-green-600 text-xs">
          <Check className="h-3 w-3" />
          Débloqué
        </div>
      ) : (
        <div className="mt-2">
          <div className="flex items-center justify-center gap-1 text-gray-500 text-xs">
            <Lock className="h-3 w-3" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {decoration.unlockCondition.description}
          </p>
        </div>
      )}
    </motion.div>
  );
}
