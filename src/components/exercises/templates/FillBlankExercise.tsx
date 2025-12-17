'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Volume2, Lightbulb } from 'lucide-react';

interface FillBlankExerciseProps {
  content: {
    text: string;
    blanks: {
      id: string;
      answer: string;
      alternatives?: string[];
      hint?: string;
    }[];
    context_image?: string;
    audio?: string;
    explanation?: string;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, answers: Record<string, string>) => void;
  disabled?: boolean;
}

export function FillBlankExercise({ content, onAnswer, disabled }: FillBlankExerciseProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [blankResults, setBlankResults] = useState<Record<string, boolean>>({});
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const playAudio = (url?: string) => {
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(console.error);
    }
  };

  const handleInputChange = (blankId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [blankId]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      const nextBlank = content.blanks[currentIndex + 1];
      if (nextBlank && inputRefs.current[nextBlank.id]) {
        inputRefs.current[nextBlank.id]?.focus();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (showResult) return;

    const results: Record<string, boolean> = {};
    let allCorrect = true;

    content.blanks.forEach(blank => {
      const userAnswer = (answers[blank.id] || '').trim().toLowerCase();
      const correctAnswer = blank.answer.toLowerCase();
      const alternatives = blank.alternatives?.map(a => a.toLowerCase()) || [];
      
      const isBlankCorrect = userAnswer === correctAnswer || alternatives.includes(userAnswer);
      results[blank.id] = isBlankCorrect;
      if (!isBlankCorrect) allCorrect = false;
    });

    setBlankResults(results);
    setIsCorrect(allCorrect);
    setShowResult(true);
    onAnswer(allCorrect, answers);
  };

  const renderTextWithBlanks = () => {
    const parts = content.text.split(/(\[BLANK:\d+\])/g);
    
    return parts.map((part, index) => {
      const blankMatch = part.match(/\[BLANK:(\d+)\]/);
      
      if (blankMatch) {
        const blankIndex = parseInt(blankMatch[1]) - 1;
        const blank = content.blanks[blankIndex];
        if (!blank) return null;

        const result = blankResults[blank.id];
        const hasResult = showResult && result !== undefined;

        return (
          <span key={index} className="inline-flex items-center mx-1 relative">
            <input
              ref={el => { inputRefs.current[blank.id] = el; }}
              type="text"
              value={answers[blank.id] || ''}
              onChange={(e) => handleInputChange(blank.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, blankIndex)}
              disabled={disabled || showResult}
              placeholder="..."
              className={`w-32 px-3 py-2 text-center font-bold rounded-lg border-2 border-dashed transition-all ${
                hasResult
                  ? result
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-red-500 bg-red-50 text-red-700'
                  : 'border-indigo-300 bg-indigo-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
              }`}
              style={{ minWidth: `${Math.max(blank.answer.length * 12, 80)}px` }}
            />
            {hasResult && !result && (
              <span className="absolute -bottom-6 left-0 right-0 text-xs text-green-600 font-medium text-center">
                {blank.answer}
              </span>
            )}
            {blank.hint && !showResult && (
              <button
                onClick={() => setActiveHint(activeHint === blank.id ? null : blank.id)}
                className="ml-1 p-1 rounded-full hover:bg-yellow-100 transition-colors"
              >
                <Lightbulb className={`h-4 w-4 ${activeHint === blank.id ? 'text-yellow-500' : 'text-gray-400'}`} />
              </button>
            )}
          </span>
        );
      }
      
      return <span key={index}>{part}</span>;
    });
  };

  const allFilled = content.blanks.every(blank => answers[blank.id]?.trim());

  return (
    <div className="space-y-6">
      {/* Image de contexte */}
      {content.context_image && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mx-auto max-w-md rounded-2xl overflow-hidden shadow-lg"
        >
          <img 
            src={content.context_image} 
            alt="Contexte" 
            className="w-full h-40 object-cover"
          />
        </motion.div>
      )}

      {/* Bouton audio */}
      {content.audio && (
        <div className="flex justify-center">
          <button
            onClick={() => playAudio(content.audio)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 hover:bg-indigo-200 transition-colors"
          >
            <Volume2 className="h-5 w-5 text-indigo-600" />
            <span className="text-indigo-700 font-medium">Écouter</span>
          </button>
        </div>
      )}

      {/* Texte avec trous */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <p className="text-xl leading-loose text-gray-800">
          {renderTextWithBlanks()}
        </p>
      </div>

      {/* Indice actif */}
      <AnimatePresence>
        {activeHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
          >
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-800">
                {content.blanks.find(b => b.id === activeHint)?.hint}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}
          >
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect 
                    ? (content.feedback_correct || 'Parfait ! Tous les mots sont corrects ! 🎉') 
                    : (content.feedback_incorrect || 'Certains mots ne sont pas corrects.')}
                </p>
                {content.explanation && !isCorrect && (
                  <p className="mt-2 text-gray-700">{content.explanation}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton valider */}
      {!showResult && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!allFilled || disabled}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Vérifier
        </motion.button>
      )}
    </div>
  );
}
