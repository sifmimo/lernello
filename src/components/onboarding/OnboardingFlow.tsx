'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import { Lumi } from '@/components/lumi';
import { playSound } from '@/lib/sounds';
import { VictoryCelebration } from '@/components/animations';
import { addXp } from '@/server/actions/xp';
import { updateDailyStreak } from '@/server/actions/streaks';

interface OnboardingFlowProps {
  childName: string;
  profileId: string;
  onComplete: () => void;
}

type OnboardingStep = 
  | 'welcome'
  | 'meet-lumi'
  | 'avatar-choice'
  | 'mini-quiz'
  | 'first-win'
  | 'world-teaser';

const avatarOptions = [
  { id: 'explorer', emoji: '🚀', label: 'Explorateur' },
  { id: 'scientist', emoji: '🔬', label: 'Scientifique' },
  { id: 'artist', emoji: '🎨', label: 'Artiste' },
];

export default function OnboardingFlow({ childName, profileId, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const nextStep = () => {
    const steps: OnboardingStep[] = ['welcome', 'meet-lumi', 'avatar-choice', 'mini-quiz', 'first-win', 'world-teaser'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
      playSound('click');
    } else {
      onComplete();
    }
  };

  const handleQuizAnswer = async (answer: number) => {
    setQuizAnswer(answer);
    if (answer === 2) {
      playSound('correct');
      setXpEarned(prev => prev + 10);
      // Persister les XP et le streak en base
      await addXp(profileId, 10, 'onboarding_quiz');
      await updateDailyStreak(profileId);
      setTimeout(() => {
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
          setStep('first-win');
        }, 2000);
      }, 500);
    } else {
      playSound('incorrect');
    }
  };

  const handleAvatarSelect = async (avatarId: string) => {
    setSelectedAvatar(avatarId);
    setXpEarned(prev => prev + 5);
    // Persister les XP pour le choix d'avatar
    await addXp(profileId, 5, 'onboarding_avatar');
    playSound('click');
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <VictoryCelebration active={showCelebration} type="correct" xpGained={10} />
      
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-lg"
      >
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <WelcomeStep name={childName} onNext={nextStep} />
          )}
          
          {step === 'meet-lumi' && (
            <MeetLumiStep name={childName} onNext={nextStep} />
          )}
          
          {step === 'avatar-choice' && (
            <AvatarChoiceStep
              selected={selectedAvatar}
              onSelect={handleAvatarSelect}
              onNext={nextStep}
            />
          )}
          
          {step === 'mini-quiz' && (
            <MiniQuizStep
              answer={quizAnswer}
              onAnswer={handleQuizAnswer}
            />
          )}
          
          {step === 'first-win' && (
            <FirstWinStep xpEarned={xpEarned} onNext={nextStep} />
          )}
          
          {step === 'world-teaser' && (
            <WorldTeaserStep onComplete={onComplete} />
          )}
        </AnimatePresence>
      </motion.div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {['welcome', 'meet-lumi', 'avatar-choice', 'mini-quiz', 'first-win', 'world-teaser'].map((s, i) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-all ${
              s === step ? 'bg-white w-6' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function WelcomeStep({ name, onNext }: { name: string; onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white rounded-3xl p-8 shadow-2xl text-center"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-6xl mb-6"
      >
        👋
      </motion.div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        Bienvenue {name} !
      </h1>
      
      <p className="text-gray-600 mb-8">
        Tu vas découvrir une aventure d'apprentissage incroyable !
      </p>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold text-lg flex items-center justify-center gap-2"
      >
        C'est parti !
        <ChevronRight className="h-5 w-5" />
      </motion.button>
    </motion.div>
  );
}

function MeetLumiStep({ name, onNext }: { name: string; onNext: () => void }) {
  const [lumiSpoke, setLumiSpoke] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLumiSpoke(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white rounded-3xl p-8 shadow-2xl text-center"
    >
      <div className="flex justify-center mb-6">
        <Lumi mood="waving" size="xl" animate />
      </div>
      
      <AnimatePresence>
        {lumiSpoke && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-indigo-50 rounded-2xl p-4 inline-block">
              <p className="text-lg text-indigo-900">
                Salut <span className="font-bold">{name}</span> ! 
                Je m'appelle <span className="font-bold text-indigo-600">Lumi</span> ! 
                Je serai ton compagnon d'apprentissage ! ✨
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <p className="text-gray-600 mb-6">
        Je t'aiderai à apprendre, te donnerai des indices et on célébrera tes victoires ensemble !
      </p>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold text-lg flex items-center justify-center gap-2"
      >
        Enchanté Lumi !
        <ChevronRight className="h-5 w-5" />
      </motion.button>
    </motion.div>
  );
}

function AvatarChoiceStep({ 
  selected, 
  onSelect, 
  onNext 
}: { 
  selected: string | null; 
  onSelect: (id: string) => void; 
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white rounded-3xl p-8 shadow-2xl text-center"
    >
      <div className="flex justify-center mb-4">
        <Lumi mood="curious" size="md" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Qui es-tu ?
      </h2>
      
      <p className="text-gray-600 mb-6">
        Choisis ton style d'aventurier !
      </p>
      
      <div className="grid grid-cols-3 gap-3 mb-6">
        {avatarOptions.map((avatar) => (
          <motion.button
            key={avatar.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(avatar.id)}
            className={`p-4 rounded-2xl border-2 transition-all ${
              selected === avatar.id
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-300'
            }`}
          >
            <div className="text-4xl mb-2">{avatar.emoji}</div>
            <div className="text-sm font-medium text-gray-700">{avatar.label}</div>
          </motion.button>
        ))}
      </div>
      
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-green-600 mb-4"
        >
          +5 XP pour avoir choisi ton avatar ! ⭐
        </motion.div>
      )}
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        disabled={!selected}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continuer
        <ChevronRight className="h-5 w-5" />
      </motion.button>
    </motion.div>
  );
}

function MiniQuizStep({ 
  answer, 
  onAnswer 
}: { 
  answer: number | null; 
  onAnswer: (answer: number) => void;
}) {
  const question = "Combien font 2 + 3 ?";
  const options = ["4", "6", "5", "7"];
  const correctIndex = 2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white rounded-3xl p-8 shadow-2xl text-center"
    >
      <div className="flex justify-center mb-4">
        <Lumi mood={answer === null ? 'thinking' : answer === correctIndex ? 'celebrating' : 'encouraging'} size="md" />
      </div>
      
      <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
        <Sparkles className="h-4 w-4" />
        Mini-défi
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {question}
      </h2>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        {options.map((option, index) => (
          <motion.button
            key={index}
            whileHover={answer === null ? { scale: 1.05 } : {}}
            whileTap={answer === null ? { scale: 0.95 } : {}}
            onClick={() => answer === null && onAnswer(index)}
            disabled={answer !== null}
            className={`p-4 rounded-2xl border-2 text-xl font-bold transition-all ${
              answer === null
                ? 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                : index === correctIndex
                ? 'border-green-500 bg-green-50 text-green-700'
                : index === answer
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200 opacity-50'
            }`}
          >
            {option}
          </motion.button>
        ))}
      </div>
      
      {answer !== null && answer !== correctIndex && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-600 mt-4"
        >
          Pas grave ! Lumi t'aidera à progresser ! 💪
        </motion.p>
      )}
    </motion.div>
  );
}

function FirstWinStep({ xpEarned, onNext }: { xpEarned: number; onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white rounded-3xl p-8 shadow-2xl text-center"
    >
      <div className="flex justify-center mb-4">
        <Lumi mood="celebrating" size="lg" />
      </div>
      
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.5, repeat: 3 }}
        className="text-5xl mb-4"
      >
        🎉
      </motion.div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Ta première victoire !
      </h2>
      
      <p className="text-gray-600 mb-4">
        Tu as gagné tes premiers points d'expérience !
      </p>
      
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.3 }}
        className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-2xl mb-6"
      >
        <span className="text-2xl font-bold">{xpEarned} XP</span>
      </motion.div>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold text-lg flex items-center justify-center gap-2"
      >
        Génial !
        <ChevronRight className="h-5 w-5" />
      </motion.button>
    </motion.div>
  );
}

function WorldTeaserStep({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white rounded-3xl p-8 shadow-2xl text-center"
    >
      <div className="flex justify-center mb-4">
        <Lumi mood="excited" size="lg" />
      </div>
      
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-5xl mb-4"
      >
        🏝️
      </motion.div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Ton monde t'attend !
      </h2>
      
      <p className="text-gray-600 mb-6">
        À chaque compétence maîtrisée, ton univers grandit et évolue. 
        Débloques des décorations, des badges et construis ton île !
      </p>
      
      <div className="flex justify-center gap-4 mb-6 text-3xl">
        <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }}>🌟</motion.span>
        <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}>🏆</motion.span>
        <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}>✨</motion.span>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onComplete}
        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold text-lg flex items-center justify-center gap-2"
      >
        Commencer l'aventure !
        <Sparkles className="h-5 w-5" />
      </motion.button>
    </motion.div>
  );
}
