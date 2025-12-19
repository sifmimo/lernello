'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  ExerciseContainer, 
  ExerciseQuestion, 
  ExerciseFeedback, 
  ExerciseActions,
  DraggableItem,
  DropZone 
} from '../shared';

interface DragDropExerciseProps {
  content: {
    question: string;
    instruction?: string;
    items: string[] | { id: string; text: string }[];
    correctOrder: number[] | string[];
    hint?: string;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, order: number[]) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
}

export function DragDropExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression 
}: DragDropExerciseProps) {
  const normalizedItems = content.items.map((item, idx) => 
    typeof item === 'string' ? { id: String(idx), text: item } : item
  );

  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleAddItem = (index: number) => {
    if (disabled || showResult || selectedOrder.includes(index)) return;
    setSelectedOrder(prev => [...prev, index]);
  };

  const handleRemoveItem = (orderIndex: number) => {
    if (disabled || showResult) return;
    setSelectedOrder(prev => prev.filter((_, i) => i !== orderIndex));
  };

  const handleSubmit = () => {
    if (showResult || selectedOrder.length !== normalizedItems.length) return;
    
    const correctOrder = content.correctOrder.map(o => 
      typeof o === 'string' ? parseInt(o) : o
    );
    
    const correct = selectedOrder.every((idx, pos) => idx === correctOrder[pos]);
    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(correct, selectedOrder);
  };

  const getItemState = (orderIndex: number) => {
    if (!showResult) return 'default';
    const correctOrder = content.correctOrder.map(o => 
      typeof o === 'string' ? parseInt(o) : o
    );
    return selectedOrder[orderIndex] === correctOrder[orderIndex] ? 'correct' : 'incorrect';
  };

  const availableItems = normalizedItems.filter((_, idx) => !selectedOrder.includes(idx));

  return (
    <ExerciseContainer progression={progression} showHelp={false}>
      <div className="space-y-6">
        <ExerciseQuestion 
          question={content.question}
          instruction={content.instruction || "Clique sur les éléments dans le bon ordre"}
        />

        <DropZone 
          isEmpty={selectedOrder.length === 0}
          label="Zone de placement"
        >
          {selectedOrder.map((itemIndex, orderIndex) => (
            <DraggableItem
              key={`placed-${orderIndex}`}
              state={getItemState(orderIndex)}
              disabled={disabled || showResult}
              showRemove={!showResult}
              onRemove={() => handleRemoveItem(orderIndex)}
            >
              <span className="text-xs text-[var(--exercise-text-secondary)] mr-1">
                {orderIndex + 1}.
              </span>
              {normalizedItems[itemIndex].text}
            </DraggableItem>
          ))}
        </DropZone>

        {availableItems.length > 0 && !showResult && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--exercise-text-secondary)]">Éléments disponibles</p>
            <div className="flex flex-wrap gap-2">
              {normalizedItems.map((item, index) => (
                !selectedOrder.includes(index) && (
                  <DraggableItem
                    key={`available-${index}`}
                    onClick={() => handleAddItem(index)}
                    disabled={disabled}
                  >
                    {item.text}
                  </DraggableItem>
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
            disabled={selectedOrder.length !== normalizedItems.length || disabled}
          />
        )}
      </div>
    </ExerciseContainer>
  );
}
