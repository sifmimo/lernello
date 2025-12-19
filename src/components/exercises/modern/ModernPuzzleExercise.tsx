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
  ProgressBar,
  XPCounter,
  StreakFlame
} from '../fun';

interface ModernPuzzleExerciseProps {
  content: {
    question: string;
    instruction?: string;
    pieces: string[];
    correctOrder: number[];
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, order: number[]) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
  streak?: number;
  xp?: number;
}

export function ModernPuzzleExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression,
  streak = 0,
  xp = 0
}: ModernPuzzleExerciseProps) {
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleAddPiece = (index: number) => {
    if (disabled || showResult || selectedOrder.includes(index)) return;
    setSelectedOrder(prev => [...prev, index]);
  };

  const handleRemovePiece = (orderIndex: number) => {
    if (disabled || showResult) return;
    setSelectedOrder(prev => prev.filter((_, i) => i !== orderIndex));
  };

  const handleSubmit = () => {
    if (showResult || selectedOrder.length !== content.pieces.length) return;
    
    const correct = selectedOrder.every((pieceIndex, pos) => 
      pieceIndex === content.correctOrder[pos]
    );
    
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    onAnswer(correct, selectedOrder);
  };

  const getPieceState = (orderIndex: number) => {
    if (!showResult) return true;
    return selectedOrder[orderIndex] === content.correctOrder[orderIndex];
  };

  const availablePieces = content.pieces.filter((_, idx) => !selectedOrder.includes(idx));

  return (
    <div className="relative">
      <Confetti trigger={showConfetti} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {streak > 0 && <StreakFlame count={streak} />}
              <XPCounter value={xp} />
            </div>
            {progression && (
              <span className="text-white/90 text-sm font-medium">
                {progression.current}/{progression.total}
              </span>
            )}
          </div>
          {progression && (
            <ProgressBar current={progression.current} total={progression.total} />
          )}
        </div>

        <div className="p-6 space-y-6">
          <Mascot 
            mood={showResult ? (isCorrect ? 'celebrating' : 'encouraging') : 'thinking'} 
            message={showResult 
              ? (isCorrect ? "🧩 Puzzle résolu !" : "💪 Pas dans le bon ordre !") 
              : "Reconstitue le puzzle !"
            } 
          />

          <div className="flex items-center justify-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 text-center">
              {content.question}
            </h2>
            <button
              onClick={() => tts.speak(content.question)}
              className="p-2 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>

          {/* Puzzle Assembly Area */}
          <div className="bg-gradient-to-br from-pink-50 to-fuchsia-50 rounded-2xl p-4 border-2 border-dashed border-pink-200 min-h-[100px]">
            {selectedOrder.length === 0 ? (
              <div className="text-center text-gray-400 py-6">
                <span className="text-4xl">🧩</span>
                <p className="mt-2">Clique sur les pièces pour les assembler</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 justify-center">
                {selectedOrder.map((pieceIndex, orderIndex) => {
                  const isPieceCorrect = getPieceState(orderIndex);
                  return (
                    <motion.div
                      key={`placed-${orderIndex}`}
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className={`relative px-4 py-3 rounded-xl font-bold shadow-lg ${
                        showResult
                          ? isPieceCorrect
                            ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-white'
                            : 'bg-gradient-to-r from-red-400 to-orange-400 text-white'
                          : 'bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white'
                      }`}
                    >
                      {content.pieces[pieceIndex]}
                      {!showResult && (
                        <button
                          onClick={() => handleRemovePiece(orderIndex)}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white text-gray-500 shadow-md hover:text-red-500 flex items-center justify-center text-sm"
                        >
                          ×
                        </button>
                      )}
                      {showResult && (
                        <span className="absolute -top-2 -right-2 text-lg">
                          {isPieceCorrect ? '✅' : '❌'}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Pieces */}
          {availablePieces.length > 0 && !showResult && (
            <div className="space-y-3">
              <p className="text-center text-gray-500 font-medium">Pièces disponibles :</p>
              <div className="flex flex-wrap justify-center gap-3">
                {content.pieces.map((piece, index) => (
                  !selectedOrder.includes(index) && (
                    <motion.button
                      key={`available-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.1, rotate: 3 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleAddPiece(index)}
                      className="px-4 py-3 rounded-xl bg-white border-2 border-pink-200 text-gray-700 font-bold shadow-md hover:border-pink-400 hover:bg-pink-50"
                    >
                      🧩 {piece}
                    </motion.button>
                  )
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {showResult && (
              <FunFeedback
                isCorrect={isCorrect}
                message={isCorrect ? content.feedback_correct : content.feedback_incorrect}
              />
            )}
          </AnimatePresence>

          {!showResult && (
            <FunButton
              onClick={handleSubmit}
              disabled={selectedOrder.length !== content.pieces.length || disabled}
              fullWidth
              size="lg"
            >
              {selectedOrder.length === content.pieces.length 
                ? 'Vérifier le puzzle' 
                : `Encore ${content.pieces.length - selectedOrder.length} pièce(s)`}
            </FunButton>
          )}
        </div>
      </motion.div>
    </div>
  );
}
