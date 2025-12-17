'use client';

import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, RotateCcw, GripVertical } from 'lucide-react';

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
  image_url?: string;
}

interface TimelineContent {
  events: TimelineEvent[];
  time_range: {
    start: string;
    end: string;
  };
  show_dates?: boolean;
}

interface TimelineExerciseProps {
  content: TimelineContent;
  onAnswer: (isCorrect: boolean, answer: string[]) => void;
}

export function TimelineExercise({ content, onAnswer }: TimelineExerciseProps) {
  const { events, show_dates = false } = content;
  
  // Shuffle events initially
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const [orderedEvents, setOrderedEvents] = useState<TimelineEvent[]>(() => shuffleArray(events));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);

  const correctOrder = events.map(e => e.id);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...orderedEvents];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setOrderedEvents(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveEvent = useCallback((fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= orderedEvents.length) return;

    const newOrder = [...orderedEvents];
    [newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]];
    setOrderedEvents(newOrder);
  }, [orderedEvents]);

  const handleSubmit = () => {
    const userOrder = orderedEvents.map(e => e.id);
    const itemResults = userOrder.map((id, index) => id === correctOrder[index]);
    const correctCount = itemResults.filter(Boolean).length;
    const calculatedScore = Math.round((correctCount / events.length) * 100);

    setResults(itemResults);
    setScore(calculatedScore);
    setIsSubmitted(true);
    onAnswer(calculatedScore >= 80, userOrder);
  };

  const handleReset = () => {
    setOrderedEvents(shuffleArray(events));
    setIsSubmitted(false);
    setResults([]);
    setScore(0);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <p className="text-lg text-gray-800 font-medium">
          Place les événements dans l&apos;ordre chronologique
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Glisse et dépose les cartes pour les réorganiser
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Events */}
        <div className="space-y-4">
          {orderedEvents.map((event, index) => (
            <div
              key={event.id}
              draggable={!isSubmitted}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative flex items-start gap-4 pl-4 ${
                draggedIndex === index ? 'opacity-50' : ''
              } ${!isSubmitted ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              {/* Timeline dot */}
              <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isSubmitted
                  ? results[index]
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                  : 'bg-indigo-500 text-white'
              }`}>
                {isSubmitted ? (
                  results[index] ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </div>

              {/* Event card */}
              <div className={`flex-1 rounded-xl p-4 transition-all ${
                isSubmitted
                  ? results[index]
                    ? 'bg-green-50 border-2 border-green-200'
                    : 'bg-red-50 border-2 border-red-200'
                  : 'bg-white border-2 border-gray-200 hover:border-indigo-300 hover:shadow-md'
              }`}>
                <div className="flex items-start gap-3">
                  {!isSubmitted && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveEvent(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                      >
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <GripVertical className="h-4 w-4 text-gray-300" />
                      <button
                        onClick={() => moveEvent(index, 'down')}
                        disabled={index === orderedEvents.length - 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                      >
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{event.title}</h4>
                    {(show_dates || isSubmitted) && (
                      <p className={`text-sm mt-1 ${
                        isSubmitted && !results[index] ? 'text-red-600 font-medium' : 'text-indigo-600'
                      }`}>
                        {event.date}
                      </p>
                    )}
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                    )}
                  </div>

                  {event.image_url && (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Result */}
      {isSubmitted && (
        <div className={`flex items-center justify-center gap-3 p-4 rounded-xl ${
          score >= 80 ? 'bg-green-50 text-green-700' : score >= 50 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
        }`}>
          {score >= 80 ? (
            <CheckCircle className="h-6 w-6" />
          ) : (
            <XCircle className="h-6 w-6" />
          )}
          <span className="font-medium">
            Score : {score}% ({results.filter(Boolean).length}/{events.length} correct{results.filter(Boolean).length > 1 ? 's' : ''})
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Vérifier l&apos;ordre
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Recommencer
          </button>
        )}
      </div>
    </div>
  );
}
