'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, Star, Trophy, ChevronRight, Check, X, Sparkles } from 'lucide-react';
import { DailyChallenge, getDailyChallenge, formatTimeRemaining, getStreakBonus } from '@/lib/daily-challenge';
import { playSound } from '@/lib/sounds';
import { VictoryCelebration } from '@/components/animations';

interface DailyChallengeWidgetProps {
  profileId: string;
  currentStreak: number;
  completedChallenges: string[];
  onComplete: (xpEarned: number) => void;
}

export default function DailyChallengeWidget({
  profileId,
  currentStreak,
  completedChallenges,
  onComplete
}: DailyChallengeWidgetProps) {
  const [challenge] = useState<DailyChallenge>(getDailyChallenge());
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [timeLeft, setTimeLeft] = useState(challenge.timeLimit || 60);
  const [timerActive, setTimerActive] = useState(false);

  const isCompleted = completedChallenges.includes(challenge.id);
  const streakBonus = getStreakBonus(currentStreak);

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timerActive, timeLeft]);

  const handleStart = () => {
    setIsPlaying(true);
    setTimerActive(true);
    playSound('click');
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    
    setSelectedAnswer(answer);
    setTimerActive(false);
    const correct = answer === String(challenge.correctAnswer);
    setIsCorrect(correct);

    if (correct) {
      playSound('correct');
      setShowCelebration(true);
      const totalXp = challenge.xpReward + (timeLeft > 0 ? challenge.bonusXp : 0) + streakBonus;
      
      setTimeout(() => {
        setShowCelebration(false);
        onComplete(totalXp);
      }, 2500);
    } else {
      playSound('incorrect');
    }
  };

  if (isCompleted) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-green-800">Défi du jour complété !</h3>
            <p className="text-sm text-green-600">Reviens demain pour un nouveau défi</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
          <Clock className="h-4 w-4" />
          <span>Prochain défi dans {formatTimeRemaining()}</span>
        </div>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl p-6 text-white"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-6 w-6 fill-white" />
            <span className="font-bold text-lg">Défi du Jour</span>
          </div>
          
          <h3 className="text-2xl font-bold mb-2">{challenge.title}</h3>
          <p className="text-white/80 mb-4">{challenge.description}</p>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full">
              <Star className="h-4 w-4 fill-white" />
              <span className="font-bold">{challenge.xpReward} XP</span>
            </div>
            {challenge.timeLimit && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full">
                <Clock className="h-4 w-4" />
                <span className="font-bold">{challenge.timeLimit}s</span>
              </div>
            )}
            {streakBonus > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-400/30 rounded-full">
                <Sparkles className="h-4 w-4" />
                <span className="font-bold">+{streakBonus} bonus</span>
              </div>
            )}
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            Relever le défi
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      <VictoryCelebration active={showCelebration} type="correct" xpGained={challenge.xpReward + streakBonus} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100"
      >
        {/* Timer */}
        {challenge.timeLimit && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500 fill-orange-500" />
              <span className="font-bold text-gray-900">{challenge.title}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono font-bold ${
              timeLeft <= 10 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'
            }`}>
              <Clock className="h-4 w-4" />
              {timeLeft}s
            </div>
          </div>
        )}

        {/* Question */}
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
          {challenge.question}
        </h3>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {challenge.options?.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = option === String(challenge.correctAnswer);
            
            let buttonClass = 'p-4 rounded-xl border-2 font-bold text-lg transition-all ';
            
            if (selectedAnswer) {
              if (isCorrectAnswer) {
                buttonClass += 'border-green-500 bg-green-50 text-green-700';
              } else if (isSelected && !isCorrect) {
                buttonClass += 'border-red-500 bg-red-50 text-red-700';
              } else {
                buttonClass += 'border-gray-200 bg-gray-50 text-gray-400';
              }
            } else {
              buttonClass += 'border-gray-200 hover:border-orange-400 hover:bg-orange-50 text-gray-700 cursor-pointer';
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={!!selectedAnswer}
                className={buttonClass}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Result */}
        <AnimatePresence>
          {selectedAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl text-center ${
                isCorrect ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              {isCorrect ? (
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span className="font-bold">Bravo ! +{challenge.xpReward + streakBonus} XP</span>
                </div>
              ) : (
                <div>
                  <p className="text-red-700 font-medium mb-2">Pas tout à fait...</p>
                  <p className="text-sm text-red-600">{challenge.hint}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
