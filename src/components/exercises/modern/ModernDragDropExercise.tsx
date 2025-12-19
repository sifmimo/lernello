'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Volume2, GripVertical } from 'lucide-react';
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

interface ModernDragDropExerciseProps {
  content: {
    question: string;
    instruction?: string;
    items: string[] | { id: string; text: string }[];
    correctOrder: number[] | string[];
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, order: number[]) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
  streak?: number;
  xp?: number;
}

interface DragItem {
  id: string;
  text: string;
  originalIndex: number;
}

export function ModernDragDropExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression,
  streak = 0,
  xp = 0
}: ModernDragDropExerciseProps) {
  const normalizedItems: DragItem[] = content.items.map((item, idx) => ({
    id: `item-${idx}`,
    text: typeof item === 'string' ? item : item.text,
    originalIndex: idx
  }));

  const [items, setItems] = useState<DragItem[]>(() => 
    [...normalizedItems].sort(() => Math.random() - 0.5)
  );
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [itemResults, setItemResults] = useState<Record<string, boolean>>({});

  const handleSubmit = () => {
    if (showResult) return;
    
    const correctOrder = content.correctOrder.map(o => 
      typeof o === 'string' ? parseInt(o) : o
    );
    
    const results: Record<string, boolean> = {};
    let allCorrect = true;
    
    items.forEach((item, pos) => {
      const isItemCorrect = item.originalIndex === correctOrder[pos];
      results[item.id] = isItemCorrect;
      if (!isItemCorrect) allCorrect = false;
    });

    setItemResults(results);
    setIsCorrect(allCorrect);
    setShowResult(true);
    
    if (allCorrect) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    onAnswer(allCorrect, items.map(i => i.originalIndex));
  };

  const handleSpeak = () => {
    tts.speak(content.question);
  };

  const getItemClasses = (item: DragItem) => {
    if (!showResult) {
      return 'bg-gradient-to-r from-violet-500 to-purple-500 text-white';
    }
    return itemResults[item.id]
      ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-white'
      : 'bg-gradient-to-r from-red-400 to-orange-400 text-white';
  };

  return (
    <div className="relative">
      <Confetti trigger={showConfetti} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 p-4">
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
              ? (isCorrect ? "🎉 Parfait !" : "💪 Essaie encore !") 
              : "Glisse pour réordonner !"
            } 
          />

          <div className="flex items-center justify-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 text-center">
              {content.question}
            </h2>
            <button
              onClick={handleSpeak}
              className="p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>

          {content.instruction && (
            <p className="text-center text-gray-500 text-sm">{content.instruction}</p>
          )}

          {/* Drag & Drop Area */}
          <div className="max-w-md mx-auto">
            <Reorder.Group
              axis="y"
              values={items}
              onReorder={setItems}
              className="space-y-3"
            >
              {items.map((item, index) => (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  disabled={disabled || showResult}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                    className={`flex items-center gap-3 p-4 rounded-2xl shadow-lg ${getItemClasses(item)}`}
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/20 font-bold">
                      {index + 1}
                    </div>
                    <GripVertical className="h-5 w-5 opacity-50" />
                    <span className="flex-1 font-semibold">{item.text}</span>
                    
                    {showResult && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-xl"
                      >
                        {itemResults[item.id] ? '✅' : '❌'}
                      </motion.span>
                    )}
                  </motion.div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>

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
              disabled={disabled}
              fullWidth
              size="lg"
            >
              Vérifier l'ordre
            </FunButton>
          )}
        </div>
      </motion.div>
    </div>
  );
}
