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

interface PuzzleExerciseProps {
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
}

export function PuzzleExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression 
}: PuzzleExerciseProps) {
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

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
    onAnswer(correct, selectedOrder);
  };

  const getPieceState = (orderIndex: number) => {
    if (!showResult) return 'default';
    return selectedOrder[orderIndex] === content.correctOrder[orderIndex] ? 'correct' : 'incorrect';
  };

  const availablePieces = content.pieces.filter((_, idx) => !selectedOrder.includes(idx));

  return (
    <ExerciseContainer progression={progression} showHelp={false}>
      <div className="space-y-6">
        <ExerciseQuestion 
          question={content.question}
          instruction={content.instruction || "Reconstitue dans le bon ordre"}
        />

        <DropZone 
          isEmpty={selectedOrder.length === 0}
          label="Zone de construction"
        >
          {selectedOrder.map((pieceIndex, orderIndex) => (
            <DraggableItem
              key={`placed-${orderIndex}`}
              state={getPieceState(orderIndex)}
              disabled={disabled || showResult}
              showRemove={!showResult}
              onRemove={() => handleRemovePiece(orderIndex)}
            >
              {content.pieces[pieceIndex]}
            </DraggableItem>
          ))}
        </DropZone>

        {availablePieces.length > 0 && !showResult && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--exercise-text-secondary)]">Pièces disponibles</p>
            <div className="flex flex-wrap gap-2">
              {content.pieces.map((piece, index) => (
                !selectedOrder.includes(index) && (
                  <DraggableItem
                    key={`available-${index}`}
                    onClick={() => handleAddPiece(index)}
                    disabled={disabled}
                  >
                    {piece}
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
            disabled={selectedOrder.length !== content.pieces.length || disabled}
          />
        )}
      </div>
    </ExerciseContainer>
  );
}
