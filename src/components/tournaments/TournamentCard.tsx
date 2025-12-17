'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, Users, Star, ChevronRight, Medal, Crown, Zap } from 'lucide-react';
import { Tournament, formatTimeRemaining, SEASONAL_THEMES } from '@/lib/tournaments';

interface TournamentCardProps {
  tournament: Tournament;
  currentUserRank?: number;
  currentUserScore?: number;
  onJoin: () => void;
  onViewLeaderboard: () => void;
}

export default function TournamentCard({
  tournament,
  currentUserRank,
  currentUserScore,
  onJoin,
  onViewLeaderboard
}: TournamentCardProps) {
  const theme = SEASONAL_THEMES[tournament.theme as keyof typeof SEASONAL_THEMES];
  const timeRemaining = formatTimeRemaining(tournament.endDate);
  const isParticipating = currentUserRank !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-white shadow-xl"
    >
      {/* Header with gradient */}
      <div className={`relative h-40 bg-gradient-to-br ${theme.colors[0]} ${theme.colors[1]} p-6`}>
        <div className="absolute inset-0 bg-black/10" />
        
        {/* Floating emoji decorations */}
        <div className="absolute top-4 right-4 text-4xl opacity-30 animate-bounce">
          {tournament.emoji}
        </div>
        <div className="absolute bottom-4 right-12 text-3xl opacity-20">
          {tournament.emoji}
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl">{tournament.emoji}</span>
            <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
              <span className="text-xs font-bold text-white uppercase tracking-wide">
                {tournament.status === 'active' ? 'En cours' : tournament.status === 'upcoming' ? 'Bientôt' : 'Terminé'}
              </span>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-1">{tournament.title}</h2>
          <p className="text-white/80 text-sm">{tournament.description}</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">{timeRemaining}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">{tournament.leaderboard.length} joueurs</span>
          </div>
        </div>
        
        {isParticipating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-full">
              <Medal className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-700">#{currentUserRank}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 rounded-full">
              <Zap className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-bold text-indigo-700">{currentUserScore} pts</span>
            </div>
          </div>
        )}
      </div>

      {/* Rewards preview */}
      <div className="p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Récompenses</h3>
        <div className="flex items-center gap-3 mb-4">
          {tournament.rewards.slice(0, 3).map((reward, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
                idx === 0 ? 'bg-amber-50' : idx === 1 ? 'bg-gray-100' : 'bg-orange-50'
              }`}
            >
              {idx === 0 ? (
                <Crown className="h-5 w-5 text-amber-500" />
              ) : idx === 1 ? (
                <Medal className="h-5 w-5 text-gray-400" />
              ) : (
                <Medal className="h-5 w-5 text-orange-400" />
              )}
              <div>
                <p className="text-xs text-gray-500">#{reward.rank as number}</p>
                <p className="text-sm font-bold text-gray-700">{reward.xp} XP</p>
              </div>
            </div>
          ))}
        </div>

        {/* Top 3 leaderboard preview */}
        <div className="space-y-2 mb-4">
          {tournament.leaderboard.slice(0, 3).map((entry, idx) => (
            <div
              key={entry.playerId}
              className={`flex items-center gap-3 p-2 rounded-xl ${
                idx === 0 ? 'bg-amber-50' : 'bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-gray-300 text-gray-700' : 'bg-orange-300 text-white'
              }`}>
                {entry.rank}
              </div>
              <span className="text-xl">{entry.playerAvatar}</span>
              <span className="flex-1 font-medium text-gray-700">{entry.playerName}</span>
              <span className="font-bold text-gray-900">{entry.score} pts</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!isParticipating && tournament.status === 'active' && (
            <button
              onClick={onJoin}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Trophy className="h-5 w-5" />
              Participer
            </button>
          )}
          
          <button
            onClick={onViewLeaderboard}
            className={`${isParticipating ? 'flex-1' : ''} py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2`}
          >
            Classement
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
