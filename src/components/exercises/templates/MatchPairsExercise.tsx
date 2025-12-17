'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Volume2, RotateCcw, Shuffle } from 'lucide-react';

interface MatchPairsExerciseProps {
  content: {
    instruction: string;
    pairs: {
      id: string;
      left: { text?: string; image?: string; audio?: string };
      right: { text?: string; image?: string; audio?: string };
    }[];
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, matches: Record<string, string>) => void;
  disabled?: boolean;
}

export function MatchPairsExercise({ content, onAnswer, disabled }: MatchPairsExerciseProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [wrongMatch, setWrongMatch] = useState<{ left: string; right: string } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const [shuffledRight] = useState(() => 
    [...content.pairs].sort(() => Math.random() - 0.5).map(p => ({ ...p.right, pairId: p.id }))
  );

  const playAudio = (url?: string) => {
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(console.error);
    }
  };

  const speakText = (text?: string) => {
    if (text && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const handleLeftClick = (pairId: string) => {
    if (disabled || showResult || matches[pairId]) return;
    setSelectedLeft(pairId);
    setWrongMatch(null);
    
    if (selectedRight) {
      checkMatch(pairId, selectedRight);
    }
  };

  const handleRightClick = (pairId: string) => {
    if (disabled || showResult || Object.values(matches).includes(pairId)) return;
    setSelectedRight(pairId);
    setWrongMatch(null);
    
    if (selectedLeft) {
      checkMatch(selectedLeft, pairId);
    }
  };

  const checkMatch = (leftId: string, rightId: string) => {
    if (leftId === rightId) {
      setMatches(prev => ({ ...prev, [leftId]: rightId }));
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setWrongMatch({ left: leftId, right: rightId });
      setTimeout(() => {
        setWrongMatch(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 800);
    }
  };

  const handleSubmit = () => {
    const allMatched = Object.keys(matches).length === content.pairs.length;
    const allCorrect = content.pairs.every(pair => matches[pair.id] === pair.id);
    setIsCorrect(allMatched && allCorrect);
    setShowResult(true);
    onAnswer(allMatched && allCorrect, matches);
  };

  const reset = () => {
    setMatches({});
    setSelectedLeft(null);
    setSelectedRight(null);
    setWrongMatch(null);
    setShowResult(false);
  };

  const allMatched = Object.keys(matches).length === content.pairs.length;
  const hasImages = content.pairs.some(p => p.left.image || p.right.image);

  const renderItem = (item: { text?: string; image?: string; audio?: string }, isMatched: boolean, isSelected: boolean, isWrong: boolean) => (
    <div className="relative">
      {item.image ? (
        <img 
          src={item.image} 
          alt={item.text || ''} 
          className="w-full h-24 object-cover rounded-lg"
        />
      ) : (
        <span className="text-base font-medium">{item.text}</span>
      )}
      {item.audio && (
        <button
          onClick={(e) => { e.stopPropagation(); playAudio(item.audio); }}
          className="absolute top-1 right-1 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm"
        >
          <Volume2 className="h-3 w-3 text-gray-600" />
        </button>
      )}
      {!item.audio && item.text && (
        <button
          onClick={(e) => { e.stopPropagation(); speakText(item.text); }}
          className="absolute top-1 right-1 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Volume2 className="h-3 w-3 text-gray-600" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Instruction */}
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          {content.instruction}
        </h2>
        <p className="text-gray-500 text-sm">Associe les éléments qui vont ensemble</p>
      </div>

      {/* Grille de matching */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        {/* Colonne gauche */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500 text-center mb-2">Éléments</p>
          {content.pairs.map((pair) => {
            const isMatched = !!matches[pair.id];
            const isSelected = selectedLeft === pair.id;
            const isWrong = wrongMatch?.left === pair.id;

            return (
              <motion.button
                key={`left-${pair.id}`}
                onClick={() => handleLeftClick(pair.id)}
                disabled={disabled || showResult || isMatched}
                animate={isWrong ? { x: [-5, 5, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`group w-full p-3 rounded-xl border-2 text-left transition-all ${
                  isMatched
                    ? 'border-green-400 bg-green-50 opacity-60'
                    : isWrong
                      ? 'border-red-500 bg-red-50'
                      : isSelected
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 shadow-md'
                        : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                }`}
              >
                {renderItem(pair.left, isMatched, isSelected, isWrong)}
                {isMatched && (
                  <CheckCircle className="absolute top-2 left-2 h-5 w-5 text-green-500" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Colonne droite */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500 text-center mb-2">Correspondances</p>
          {shuffledRight.map((item) => {
            const isMatched = Object.values(matches).includes(item.pairId);
            const isSelected = selectedRight === item.pairId;
            const isWrong = wrongMatch?.right === item.pairId;

            return (
              <motion.button
                key={`right-${item.pairId}`}
                onClick={() => handleRightClick(item.pairId)}
                disabled={disabled || showResult || isMatched}
                animate={isWrong ? { x: [-5, 5, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`group w-full p-3 rounded-xl border-2 text-left transition-all ${
                  isMatched
                    ? 'border-green-400 bg-green-50 opacity-60'
                    : isWrong
                      ? 'border-red-500 bg-red-50'
                      : isSelected
                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                }`}
              >
                {renderItem(item, isMatched, isSelected, isWrong)}
                {isMatched && (
                  <CheckCircle className="absolute top-2 left-2 h-5 w-5 text-green-500" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Compteur de paires */}
      <div className="text-center">
        <span className="text-sm text-gray-500">
          {Object.keys(matches).length} / {content.pairs.length} paires trouvées
        </span>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isCorrect ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                <p className={`font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect 
                    ? (content.feedback_correct || 'Toutes les paires sont correctes ! 🎉') 
                    : (content.feedback_incorrect || 'Certaines paires ne sont pas correctes.')}
                </p>
              </div>
              {!isCorrect && (
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Réessayer
                </button>
              )}
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
          disabled={!allMatched || disabled}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {allMatched ? 'Vérifier les paires' : `Trouve encore ${content.pairs.length - Object.keys(matches).length} paire(s)`}
        </motion.button>
      )}
    </div>
  );
}
