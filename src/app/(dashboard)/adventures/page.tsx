'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Star, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Adventure, ADVENTURES } from '@/lib/adventures';
import { AdventureList, AdventurePlayer } from '@/components/adventures';

export default function AdventuresPage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>('');
  const [studentLevel, setStudentLevel] = useState(1);
  const [completedAdventures, setCompletedAdventures] = useState<string[]>([]);
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('activeProfileId');
    const name = localStorage.getItem('activeProfileName');
    if (id) setProfileId(id);
    if (name) setProfileName(name);
    
    const completed = localStorage.getItem(`adventures_${id}`) || '[]';
    setCompletedAdventures(JSON.parse(completed));
  }, []);

  const handleAdventureComplete = (rewards: { xp: number; badges: string[]; decorations: string[] }) => {
    if (selectedAdventure && profileId) {
      const newCompleted = [...completedAdventures, selectedAdventure.id];
      setCompletedAdventures(newCompleted);
      localStorage.setItem(`adventures_${profileId}`, JSON.stringify(newCompleted));
    }
    setSelectedAdventure(null);
  };

  if (selectedAdventure && profileId) {
    return (
      <AdventurePlayer
        adventure={selectedAdventure}
        profileId={profileId}
        onComplete={handleAdventureComplete}
        onExit={() => setSelectedAdventure(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Aventures</h1>
              <p className="text-gray-500">Vis des histoires incroyables en résolvant des énigmes !</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{ADVENTURES.length}</p>
                <p className="text-sm text-gray-500">Aventures</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Star className="h-5 w-5 text-green-600 fill-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedAdventures.length}</p>
                <p className="text-sm text-gray-500">Terminées</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((completedAdventures.length / ADVENTURES.length) * 100)}%
                </p>
                <p className="text-sm text-gray-500">Progression</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Adventures List */}
        <AdventureList
          studentLevel={studentLevel}
          completedAdventures={completedAdventures}
          onSelectAdventure={setSelectedAdventure}
        />
      </div>
    </div>
  );
}
