'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, Crown, Users, Clock, Star, Flame } from 'lucide-react';
import Link from 'next/link';
import { Tournament, generateMockTournament, formatTimeRemaining, SEASONAL_THEMES } from '@/lib/tournaments';
import { TournamentCard } from '@/components/tournaments';

export default function TournamentsPage() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>('');
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [userRank, setUserRank] = useState<number | undefined>(undefined);
  const [userScore, setUserScore] = useState<number | undefined>(undefined);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('activeProfileId');
    const name = localStorage.getItem('activeProfileName');
    if (id) setProfileId(id);
    if (name) setProfileName(name);
    
    setCurrentTournament(generateMockTournament());
  }, []);

  const handleJoin = () => {
    setUserRank(8);
    setUserScore(450);
  };

  if (!currentTournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const theme = SEASONAL_THEMES[currentTournament.theme as keyof typeof SEASONAL_THEMES];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
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
            <div className={`w-16 h-16 bg-gradient-to-br ${theme.colors[0]} ${theme.colors[1]} rounded-2xl flex items-center justify-center text-3xl`}>
              {currentTournament.emoji}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tournois</h1>
              <p className="text-gray-500">Affronte d'autres joueurs et gagne des récompenses !</p>
            </div>
          </div>
        </div>

        {/* Current Tournament */}
        <div className="mb-8">
          <TournamentCard
            tournament={currentTournament}
            currentUserRank={userRank}
            currentUserScore={userScore}
            onJoin={handleJoin}
            onViewLeaderboard={() => setShowLeaderboard(true)}
          />
        </div>

        {/* Full Leaderboard */}
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Classement complet</h2>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  Fermer
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {currentTournament.leaderboard.map((entry, idx) => {
                const isCurrentUser = userRank === entry.rank;
                
                return (
                  <div
                    key={entry.playerId}
                    className={`flex items-center gap-4 p-4 ${
                      isCurrentUser ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      idx === 0 ? 'bg-amber-400 text-white' : 
                      idx === 1 ? 'bg-gray-300 text-gray-700' : 
                      idx === 2 ? 'bg-orange-300 text-white' : 
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {idx < 3 ? (
                        idx === 0 ? <Crown className="h-5 w-5" /> :
                        <Medal className="h-5 w-5" />
                      ) : entry.rank}
                    </div>

                    <span className="text-2xl">{entry.playerAvatar}</span>
                    
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {entry.playerName}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">
                            Toi
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{entry.exercisesCompleted} exercices</span>
                        <span>{entry.accuracy}% précision</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">{entry.score}</p>
                      <p className="text-xs text-gray-400">points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Rules */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Règles du tournoi
          </h3>
          <ul className="space-y-2">
            {currentTournament.rules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2 text-gray-600">
                <Star className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
