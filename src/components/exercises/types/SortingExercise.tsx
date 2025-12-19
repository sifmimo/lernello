'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExerciseContainer, 
  ExerciseQuestion, 
  ExerciseFeedback, 
  ExerciseActions,
  DraggableItem 
} from '../shared';

interface SortingExerciseProps {
  content: {
    question: string;
    instruction?: string;
    categories: string[];
    items: { text: string; category: number }[];
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, sorting: Record<number, number>) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
}

export function SortingExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression 
}: SortingExerciseProps) {
  const [sorting, setSorting] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleAssign = (itemIndex: number, categoryIndex: number) => {
    if (disabled || showResult) return;
    setSorting(prev => ({ ...prev, [itemIndex]: categoryIndex }));
  };

  const handleRemove = (itemIndex: number) => {
    if (disabled || showResult) return;
    setSorting(prev => {
      const newSorting = { ...prev };
      delete newSorting[itemIndex];
      return newSorting;
    });
  };

  const handleSubmit = () => {
    if (showResult) return;
    
    const allSorted = Object.keys(sorting).length === content.items.length;
    const allCorrect = content.items.every((item, idx) => sorting[idx] === item.category);
    
    setIsCorrect(allSorted && allCorrect);
    setShowResult(true);
    onAnswer(allSorted && allCorrect, sorting);
  };

  const getItemState = (itemIndex: number) => {
    if (!showResult) return 'default';
    return sorting[itemIndex] === content.items[itemIndex].category ? 'correct' : 'incorrect';
  };

  const allSorted = Object.keys(sorting).length === content.items.length;
  const unsortedItems = content.items.filter((_, idx) => sorting[idx] === undefined);

  return (
    <ExerciseContainer progression={progression} showHelp={false}>
      <div className="space-y-6">
        <ExerciseQuestion 
          question={content.question}
          instruction={content.instruction || "Classe les éléments dans les bonnes catégories"}
        />

        <div className="grid grid-cols-2 gap-4">
          {content.categories.map((category, catIndex) => (
            <div 
              key={catIndex}
              className="p-4 rounded-[var(--exercise-radius-md)] border-2 border-dashed border-[var(--exercise-border-default)] bg-[var(--exercise-bg-secondary)] min-h-[100px]"
            >
              <h4 className="font-medium text-[var(--exercise-text-primary)] mb-3 text-center">
                {category}
              </h4>
              <div className="flex flex-wrap gap-2 justify-center">
                {content.items.map((item, itemIndex) => (
                  sorting[itemIndex] === catIndex && (
                    <DraggableItem
                      key={itemIndex}
                      state={getItemState(itemIndex)}
                      disabled={disabled || showResult}
                      showRemove={!showResult}
                      onRemove={() => handleRemove(itemIndex)}
                    >
                      {item.text}
                    </DraggableItem>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>

        {unsortedItems.length > 0 && !showResult && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--exercise-text-secondary)]">Éléments à classer</p>
            <div className="p-4 rounded-[var(--exercise-radius-md)] bg-[var(--exercise-bg-primary)] border border-[var(--exercise-border-default)]">
              {content.items.map((item, itemIndex) => (
                sorting[itemIndex] === undefined && (
                  <div key={itemIndex} className="inline-flex gap-1 mr-2 mb-2">
                    {content.categories.map((cat, catIndex) => (
                      <motion.button
                        key={catIndex}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAssign(itemIndex, catIndex)}
                        disabled={disabled}
                        className="px-3 py-2 rounded-[var(--exercise-radius-sm)] border border-[var(--exercise-border-default)] bg-white hover:border-[var(--exercise-selection)] hover:bg-[var(--exercise-selection-bg)] text-sm font-medium text-[var(--exercise-text-primary)] transition-all duration-[var(--exercise-transition-fast)]"
                      >
                        {item.text} → {cat}
                      </motion.button>
                    ))}
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {showResult && (
            <ExerciseFeedback
              isCorrect={isCorrect}
              message={isCorrect ? content.feedback_correct : content.feedback_incorrect}
            />
          )}
        </AnimatePresence>

        {!showResult && (
          <ExerciseActions
            onSubmit={handleSubmit}
            disabled={!allSorted || disabled}
          />
        )}
      </div>
    </ExerciseContainer>
  );
}
