'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Volume2, VolumeX, Star, Trophy, Sparkles } from 'lucide-react';
import { Adventure, AdventureChapter, AdventureDialogue } from '@/lib/adventures';
import { Lumi } from '@/components/lumi';
import { VictoryCelebration } from '@/components/animations';
import { playSound } from '@/lib/sounds';
import { tts } from '@/lib/tts';
import { addXp } from '@/server/actions/xp';

interface AdventurePlayerProps {
  adventure: Adventure;
  profileId: string;
  onComplete: (rewards: { xp: number; badges: string[]; decorations: string[] }) => void;
  onExit: () => void;
}

type GamePhase = 'dialogue' | 'challenge' | 'reward' | 'complete';

const BACKGROUNDS: Record<string, string> = {
  beach: 'from-amber-200 via-sky-300 to-blue-400',
  jungle: 'from-green-600 via-emerald-500 to-lime-400',
  cave: 'from-slate-800 via-purple-900 to-indigo-900',
  launchpad: 'from-orange-400 via-red-500 to-purple-600',
  space: 'from-indigo-900 via-purple-900 to-black',
  station: 'from-slate-700 via-blue-800 to-indigo-900',
  mountain: 'from-slate-400 via-blue-300 to-sky-200',
  tower: 'from-purple-800 via-violet-900 to-slate-900',
  throne: 'from-amber-600 via-red-700 to-purple-900',
};

export default function AdventurePlayer({ adventure, profileId, onComplete, onExit }: AdventurePlayerProps) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('dialogue');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [earnedRewards, setEarnedRewards] = useState<{ xp: number; badges: string[]; decorations: string[] }>({
    xp: 0,
    badges: [],
    decorations: []
  });

  const currentChapter = adventure.chapters[currentChapterIndex];
  const currentDialogue = currentChapter?.dialogues[dialogueIndex];
  const isLastDialogue = dialogueIndex >= currentChapter?.dialogues.length - 1;
  const isLastChapter = currentChapterIndex >= adventure.chapters.length - 1;

  useEffect(() => {
    if (phase === 'dialogue' && currentDialogue && ttsEnabled) {
      // Arrêter toute lecture en cours avant de parler
      tts.stop();
      const timer = setTimeout(() => {
        tts.speakLumi(currentDialogue.text);
      }, 200);
      return () => {
        clearTimeout(timer);
        tts.stop();
      };
    }
    return () => tts.stop();
  }, [dialogueIndex, phase, currentDialogue, ttsEnabled]);

  const handleNextDialogue = () => {
    if (isLastDialogue) {
      setPhase('challenge');
    } else {
      setDialogueIndex(prev => prev + 1);
    }
  };

  const handleAnswer = async (answer: string) => {
    setSelectedAnswer(answer);
    const correct = answer === String(currentChapter.challenge.correctAnswer);
    setIsCorrect(correct);

    if (correct) {
      playSound('correct');
      setShowCelebration(true);
      
      const rewards = currentChapter.rewards;
      await addXp(profileId, rewards.xp, 'adventure');
      
      setEarnedRewards(prev => ({
        xp: prev.xp + rewards.xp,
        badges: rewards.badge ? [...prev.badges, rewards.badge] : prev.badges,
        decorations: rewards.decoration ? [...prev.decorations, rewards.decoration] : prev.decorations
      }));

      setTimeout(() => {
        setShowCelebration(false);
        setPhase('reward');
      }, 2000);
    } else {
      playSound('incorrect');
    }
  };

  const handleNextChapter = () => {
    if (isLastChapter) {
      setPhase('complete');
    } else {
      setCurrentChapterIndex(prev => prev + 1);
      setDialogueIndex(0);
      setPhase('dialogue');
      setSelectedAnswer(null);
      setIsCorrect(null);
    }
  };

  const handleComplete = () => {
    onComplete(earnedRewards);
  };

  const bgGradient = BACKGROUNDS[currentChapter?.backgroundImage] || BACKGROUNDS.beach;

  return (
    <div className={`fixed inset-0 z-50 bg-gradient-to-br ${bgGradient} overflow-hidden`}>
      <VictoryCelebration active={showCelebration} type="correct" xpGained={currentChapter?.rewards.xp || 0} />
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Quitter</span>
        </button>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
          >
            {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
            <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
            <span className="font-bold text-white">{earnedRewards.xp} XP</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="absolute top-20 left-4 right-4 z-10">
        <div className="flex items-center gap-2">
          {adventure.chapters.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-2 rounded-full transition-colors ${
                idx < currentChapterIndex
                  ? 'bg-green-400'
                  : idx === currentChapterIndex
                  ? 'bg-white'
                  : 'bg-white/30'
              }`}
            />
          ))}
        </div>
        <p className="text-white/80 text-sm mt-2 text-center">
          Chapitre {currentChapterIndex + 1} : {currentChapter?.title}
        </p>
      </div>

      {/* Main Content */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pt-32">
        <AnimatePresence mode="wait">
          {phase === 'dialogue' && currentDialogue && (
            <DialoguePhase
              key="dialogue"
              dialogue={currentDialogue}
              character={currentChapter.character}
              onNext={handleNextDialogue}
            />
          )}

          {phase === 'challenge' && (
            <ChallengePhase
              key="challenge"
              chapter={currentChapter}
              selectedAnswer={selectedAnswer}
              isCorrect={isCorrect}
              onAnswer={handleAnswer}
            />
          )}

          {phase === 'reward' && (
            <RewardPhase
              key="reward"
              chapter={currentChapter}
              onNext={handleNextChapter}
              isLastChapter={isLastChapter}
            />
          )}

          {phase === 'complete' && (
            <CompletePhase
              key="complete"
              adventure={adventure}
              rewards={earnedRewards}
              onComplete={handleComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DialoguePhase({ 
  dialogue, 
  character, 
  onNext 
}: { 
  dialogue: AdventureDialogue; 
  character: string;
  onNext: () => void;
}) {
  const getSpeakerDisplay = () => {
    switch (dialogue.speaker) {
      case 'narrator':
        return { name: 'Narrateur', avatar: '📖' };
      case 'lumi':
        return { name: 'Lumi', avatar: null };
      case 'character':
        return { name: 'Personnage', avatar: character };
    }
  };

  const speaker = getSpeakerDisplay();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="w-full max-w-2xl"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          {dialogue.speaker === 'lumi' ? (
            <Lumi mood={dialogue.emotion as any || 'happy'} size="md" />
          ) : (
            <div className="text-5xl">{speaker.avatar}</div>
          )}
          
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 mb-2">{speaker.name}</p>
            <p className="text-xl text-gray-800 leading-relaxed">{dialogue.text}</p>
          </div>
        </div>

        <button
          onClick={onNext}
          className="mt-6 w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          Continuer
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
}

function ChallengePhase({
  chapter,
  selectedAnswer,
  isCorrect,
  onAnswer
}: {
  chapter: AdventureChapter;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  onAnswer: (answer: string) => void;
}) {
  const [showHint, setShowHint] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full max-w-2xl"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            {chapter.challenge.storyContext}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{chapter.challenge.question}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {chapter.challenge.options?.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = option === String(chapter.challenge.correctAnswer);
            
            let buttonClass = 'p-4 rounded-2xl border-2 font-bold text-lg transition-all ';
            
            if (selectedAnswer) {
              if (isCorrectAnswer) {
                buttonClass += 'border-green-500 bg-green-50 text-green-700';
              } else if (isSelected && !isCorrect) {
                buttonClass += 'border-red-500 bg-red-50 text-red-700';
              } else {
                buttonClass += 'border-gray-200 bg-gray-50 text-gray-400';
              }
            } else {
              buttonClass += 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700';
            }

            return (
              <button
                key={idx}
                onClick={() => !selectedAnswer && onAnswer(option)}
                disabled={!!selectedAnswer}
                className={buttonClass}
              >
                {option}
              </button>
            );
          })}
        </div>

        {!selectedAnswer && (
          <button
            onClick={() => setShowHint(true)}
            className="w-full py-3 text-indigo-600 font-medium hover:bg-indigo-50 rounded-xl transition-colors"
          >
            💡 Besoin d'un indice ?
          </button>
        )}

        {showHint && !selectedAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-indigo-50 rounded-xl"
          >
            <p className="text-indigo-700">{chapter.challenge.hint}</p>
          </motion.div>
        )}

        {selectedAnswer && !isCorrect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 bg-amber-50 rounded-xl text-center"
          >
            <p className="text-amber-700 font-medium">Essaie encore ! {chapter.challenge.hint}</p>
            <button
              onClick={() => {
                onAnswer('');
              }}
              className="mt-2 px-6 py-2 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
            >
              Réessayer
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function RewardPhase({
  chapter,
  onNext,
  isLastChapter
}: {
  chapter: AdventureChapter;
  onNext: () => void;
  isLastChapter: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="w-full max-w-md text-center"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-6xl mb-4"
        >
          🎉
        </motion.div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Chapitre terminé !</h2>
        <p className="text-gray-600 mb-6">{chapter.challenge.storyContext}</p>

        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 rounded-full">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-yellow-700">+{chapter.rewards.xp} XP</span>
          </div>
          
          {chapter.rewards.decoration && (
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <span className="font-bold text-purple-700">Décoration !</span>
            </div>
          )}
          
          {chapter.rewards.badge && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="font-bold text-amber-700">Badge !</span>
            </div>
          )}
        </div>

        <button
          onClick={onNext}
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          {isLastChapter ? 'Terminer l\'aventure' : 'Chapitre suivant'}
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
}

function CompletePhase({
  adventure,
  rewards,
  onComplete
}: {
  adventure: Adventure;
  rewards: { xp: number; badges: string[]; decorations: string[] };
  onComplete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md text-center"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-7xl mb-4"
        >
          🏆
        </motion.div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Aventure terminée !</h2>
        <p className="text-gray-600 mb-6">{adventure.title}</p>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl">
            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            <span className="text-xl font-bold text-yellow-700">{rewards.xp} XP gagnés</span>
          </div>
          
          {rewards.badges.length > 0 && (
            <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
              <p className="font-bold text-purple-700">{rewards.badges.length} badge(s) débloqué(s) !</p>
            </div>
          )}
          
          {rewards.decorations.length > 0 && (
            <div className="p-3 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl">
              <p className="font-bold text-blue-700">{rewards.decorations.length} décoration(s) gagnée(s) !</p>
            </div>
          )}
        </div>

        <button
          onClick={onComplete}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
        >
          Retour aux aventures
        </button>
      </div>
    </motion.div>
  );
}
