'use client';

import { useState, useCallback } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, GripVertical, Volume2, RotateCcw } from 'lucide-react';
import { tts } from '@/lib/tts';

interface DragDropSortExerciseProps {
  content: {
    instruction: string;
    instruction_audio?: string;
    items: {
      id: string;
      text?: string;
      image?: string;
      audio?: string;
    }[];
    correct_order: string[];
    hint?: string;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, answer: string[]) => void;
  disabled?: boolean;
}

export function DragDropSortExercise({ content, onAnswer, disabled }: DragDropSortExerciseProps) {
  const [items, setItems] = useState(() => 
    [...content.items].sort(() => Math.random() - 0.5)
  );
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const speakText = (text: string) => {
    tts.speak(text);
  };

  const playAudio = (url?: string) => {
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(console.error);
    }
  };

  const handleSubmit = () => {
    if (showResult) return;
    const currentOrder = items.map(item => item.id);
    const correct = currentOrder.every((id, index) => id === content.correct_order[index]);
    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(correct, currentOrder);
  };

  const reset = () => {
    setItems([...content.items].sort(() => Math.random() - 0.5));
    setShowResult(false);
    setIsCorrect(false);
  };

  const hasImages = content.items.some(item => item.image);

  return (
    <div className="space-y-6">
      {/* Instruction */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {content.instruction}
          </h2>
          <button
            onClick={() => content.instruction_audio ? playAudio(content.instruction_audio) : speakText(content.instruction)}
            className="p-2 rounded-full bg-indigo-100 hover:bg-indigo-200 transition-colors"
          >
            <Volume2 className="h-5 w-5 text-indigo-600" />
          </button>
        </div>
        <p className="text-gray-500 text-sm">Glisse les éléments pour les remettre dans le bon ordre</p>
      </div>

      {/* Zone de tri */}
      <div className={`${hasImages ? 'max-w-2xl' : 'max-w-lg'} mx-auto`}>
        <Reorder.Group 
          axis="y" 
          values={items} 
          onReorder={setItems}
          className="space-y-3"
        >
          {items.map((item, index) => {
            const isInCorrectPosition = showResult && item.id === content.correct_order[index];
            const isInWrongPosition = showResult && item.id !== content.correct_order[index];

            return (
              <Reorder.Item
                key={item.id}
                value={item}
                disabled={disabled || showResult}
                className={`relative rounded-xl border-2 overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
                  isInCorrectPosition
                    ? 'border-green-500 bg-green-50'
                    : isInWrongPosition
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                }`}
                whileDrag={{ scale: 1.02, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Numéro d'ordre */}
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    isInCorrectPosition
                      ? 'bg-green-500 text-white'
                      : isInWrongPosition
                        ? 'bg-red-500 text-white'
                        : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Contenu */}
                  {item.image ? (
                    <div className="flex items-center gap-3 flex-1">
                      <img 
                        src={item.image} 
                        alt={item.text || ''} 
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      {item.text && (
                        <span className="font-medium text-gray-800">{item.text}</span>
                      )}
                    </div>
                  ) : (
                    <span className="flex-1 font-medium text-gray-800">{item.text}</span>
                  )}

                  {/* Audio */}
                  {item.audio && (
                    <button
                      onClick={(e) => { e.stopPropagation(); playAudio(item.audio); }}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                    >
                      <Volume2 className="h-4 w-4 text-gray-600" />
                    </button>
                  )}

                  {/* Grip handle */}
                  {!showResult && (
                    <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}

                  {/* Icône résultat */}
                  {showResult && (
                    <div className="flex-shrink-0">
                      {isInCorrectPosition ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>

      {/* Hint */}
      {content.hint && !showResult && (
        <div className="text-center">
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            {showHint ? 'Masquer l\'indice' : '💡 Besoin d\'un indice ?'}
          </button>
          <AnimatePresence>
            {showHint && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg"
              >
                {content.hint}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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
                    ? (content.feedback_correct || 'Parfait ! L\'ordre est correct ! 🎉') 
                    : (content.feedback_incorrect || 'L\'ordre n\'est pas tout à fait correct...')}
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
          disabled={disabled}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Vérifier l'ordre
        </motion.button>
      )}
    </div>
  );
}
