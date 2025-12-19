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

interface ModernTimelineExerciseProps {
  content: {
    question: string;
    instruction?: string;
    events: { text: string; order: number }[];
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, order: number[]) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
  streak?: number;
  xp?: number;
}

export function ModernTimelineExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression,
  streak = 0,
  xp = 0
}: ModernTimelineExerciseProps) {
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleAddEvent = (index: number) => {
    if (disabled || showResult || selectedOrder.includes(index)) return;
    setSelectedOrder(prev => [...prev, index]);
  };

  const handleRemoveEvent = (orderIndex: number) => {
    if (disabled || showResult) return;
    setSelectedOrder(prev => prev.filter((_, i) => i !== orderIndex));
  };

  const handleSubmit = () => {
    if (showResult || selectedOrder.length !== content.events.length) return;
    
    const correct = selectedOrder.every((eventIndex, position) => 
      content.events[eventIndex].order === position
    );
    
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    onAnswer(correct, selectedOrder);
  };

  const getEventState = (orderIndex: number) => {
    if (!showResult) return 'default';
    const eventIndex = selectedOrder[orderIndex];
    return content.events[eventIndex].order === orderIndex;
  };

  const availableEvents = content.events.filter((_, idx) => !selectedOrder.includes(idx));

  return (
    <div className="relative">
      <Confetti trigger={showConfetti} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 p-4">
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
              ? (isCorrect ? "🎉 Chronologie parfaite !" : "💪 L'ordre n'est pas bon !") 
              : "Place dans l'ordre !"
            } 
          />

          <div className="flex items-center justify-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 text-center">
              {content.question}
            </h2>
            <button
              onClick={() => tts.speak(content.question)}
              className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-indigo-400 to-purple-400 rounded-full" />
            
            <div className="space-y-4 pl-4">
              {selectedOrder.length === 0 ? (
                <div className="ml-8 p-6 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-center text-gray-400">
                  <p>📅 Clique sur les événements pour les placer ici</p>
                </div>
              ) : (
                selectedOrder.map((eventIndex, orderIndex) => {
                  const isEventCorrect = getEventState(orderIndex);
                  return (
                    <motion.div
                      key={`placed-${orderIndex}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3"
                    >
                      <motion.div
                        className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                          showResult
                            ? isEventCorrect
                              ? 'bg-gradient-to-br from-emerald-400 to-cyan-400'
                              : 'bg-gradient-to-br from-red-400 to-orange-400'
                            : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                        }`}
                      >
                        {orderIndex + 1}
                      </motion.div>
                      
                      <motion.div
                        layout
                        className={`flex-1 p-4 rounded-2xl font-medium shadow-md ${
                          showResult
                            ? isEventCorrect
                              ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-2 border-red-200'
                            : 'bg-white text-gray-700 border-2 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{content.events[eventIndex].text}</span>
                          {!showResult && (
                            <button
                              onClick={() => handleRemoveEvent(orderIndex)}
                              className="text-gray-400 hover:text-red-500 text-xl"
                            >
                              ×
                            </button>
                          )}
                          {showResult && (
                            <span className="text-xl">{isEventCorrect ? '✅' : '❌'}</span>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Available Events */}
          {availableEvents.length > 0 && !showResult && (
            <div className="space-y-3">
              <p className="text-center text-gray-500 font-medium">Événements à placer :</p>
              <div className="flex flex-wrap justify-center gap-2">
                {content.events.map((event, index) => (
                  !selectedOrder.includes(index) && (
                    <motion.button
                      key={`available-${index}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddEvent(index)}
                      className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium shadow-lg"
                    >
                      {event.text}
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
              disabled={selectedOrder.length !== content.events.length || disabled}
              fullWidth
              size="lg"
            >
              {selectedOrder.length === content.events.length 
                ? 'Vérifier l\'ordre' 
                : `Encore ${content.events.length - selectedOrder.length} événement(s)`}
            </FunButton>
          )}
        </div>
      </motion.div>
    </div>
  );
}
