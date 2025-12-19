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

interface TimelineExerciseProps {
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
}

export function TimelineExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression 
}: TimelineExerciseProps) {
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

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
    onAnswer(correct, selectedOrder);
  };

  const getEventState = (orderIndex: number) => {
    if (!showResult) return 'default';
    const eventIndex = selectedOrder[orderIndex];
    return content.events[eventIndex].order === orderIndex ? 'correct' : 'incorrect';
  };

  const availableEvents = content.events.filter((_, idx) => !selectedOrder.includes(idx));

  return (
    <ExerciseContainer progression={progression} showHelp={false}>
      <div className="space-y-6">
        <ExerciseQuestion 
          question={content.question}
          instruction={content.instruction || "Place les événements dans l'ordre chronologique"}
        />

        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[var(--exercise-border-default)]" />
          
          <DropZone 
            isEmpty={selectedOrder.length === 0}
            label="Frise chronologique"
          >
            {selectedOrder.map((eventIndex, orderIndex) => (
              <div key={`placed-${orderIndex}`} className="flex items-center gap-3 w-full">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[var(--exercise-selection)] text-white flex items-center justify-center font-medium text-sm">
                  {orderIndex + 1}
                </div>
                <DraggableItem
                  state={getEventState(orderIndex)}
                  disabled={disabled || showResult}
                  showRemove={!showResult}
                  onRemove={() => handleRemoveEvent(orderIndex)}
                >
                  {content.events[eventIndex].text}
                </DraggableItem>
              </div>
            ))}
          </DropZone>
        </div>

        {availableEvents.length > 0 && !showResult && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--exercise-text-secondary)]">Événements à placer</p>
            <div className="flex flex-wrap gap-2">
              {content.events.map((event, index) => (
                !selectedOrder.includes(index) && (
                  <DraggableItem
                    key={`available-${index}`}
                    onClick={() => handleAddEvent(index)}
                    disabled={disabled}
                  >
                    {event.text}
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
            disabled={selectedOrder.length !== content.events.length || disabled}
          />
        )}
      </div>
    </ExerciseContainer>
  );
}
