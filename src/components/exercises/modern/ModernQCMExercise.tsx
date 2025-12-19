'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { tts } from '@/lib/tts';
import { 
  Confetti, 
  Mascot, 
  FunFeedback, 
  FunButton, 
  FunOptionCard,
  ProgressBar,
  XPCounter,
  StreakFlame
} from '../fun';

interface ModernQCMExerciseProps {
  content: {
    question: string;
    instruction?: string;
    options: Array<{ text: string; emoji?: string; image?: string }> | string[];
    correct_index: number;
    explanation?: string;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, answer: number) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
  streak?: number;
  xp?: number;
}

export function ModernQCMExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression,
  streak = 0,
  xp = 0
}: ModernQCMExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const normalizedOptions = content.options.map(opt => 
    typeof opt === 'string' ? { text: opt } : opt
  );

  const handleSelect = (index: number) => {
    if (disabled || showResult) return;
    setSelectedIndex(index);
  };

  const handleSpeak = () => {
    tts.speak(content.question);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || showResult) return;
    const correct = selectedIndex === content.correct_index;
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    onAnswer(correct, selectedIndex);
  };

  const getOptionState = (index: number) => {
    if (!showResult) {
      return selectedIndex === index ? 'selected' : 'default';
    }
    if (index === content.correct_index) return 'correct';
    if (index === selectedIndex) return 'incorrect';
    return 'default';
  };

  const getMascotMood = () => {
    if (showResult) return isCorrect ? 'celebrating' : 'encouraging';
    if (selectedIndex !== null) return 'happy';
    return 'thinking';
  };

  const getMascotMessage = () => {
    if (showResult) {
      return isCorrect 
        ? "🎉 Bravo ! Tu as trouvé !" 
        : "💪 Pas grave, tu vas y arriver !";
    }
    if (selectedIndex !== null) return "Clique sur Vérifier !";
    return "Choisis la bonne réponse !";
  };

  return (
    <div className="relative">
      <Confetti trigger={showConfetti} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        {/* Header avec progression */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {streak > 0 && <StreakFlame count={streak} />}
              <XPCounter value={xp} />
            </div>
            {progression && (
              <span className="text-white/90 text-sm font-medium">
                Question {progression.current}/{progression.total}
              </span>
            )}
          </div>
          {progression && (
            <ProgressBar 
              current={progression.current} 
              total={progression.total} 
              showStars={true}
            />
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Mascotte */}
          <Mascot mood={getMascotMood()} message={getMascotMessage()} size="md" />

          {/* Instruction */}
          {content.instruction && (
            <p className="text-center text-gray-500 text-sm">
              {content.instruction}
            </p>
          )}

          {/* Question */}
          <div className="flex items-center justify-center gap-3">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl md:text-2xl font-bold text-gray-800 text-center"
            >
              {content.question}
            </motion.h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSpeak}
              className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
            >
              <Volume2 className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            {normalizedOptions.map((option, index) => (
              <FunOptionCard
                key={index}
                emoji={option.emoji}
                image={option.image}
                state={getOptionState(index)}
                onClick={() => handleSelect(index)}
                disabled={disabled || showResult}
                index={index}
              >
                {option.text}
              </FunOptionCard>
            ))}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {showResult && (
              <FunFeedback
                isCorrect={isCorrect}
                message={isCorrect ? content.feedback_correct : content.feedback_incorrect}
                explanation={!isCorrect ? content.explanation : undefined}
              />
            )}
          </AnimatePresence>

          {/* Bouton Vérifier */}
          {!showResult && (
            <FunButton
              onClick={handleSubmit}
              disabled={selectedIndex === null || disabled}
              fullWidth
              size="lg"
            >
              Vérifier
            </FunButton>
          )}
        </div>
      </motion.div>
    </div>
  );
}
