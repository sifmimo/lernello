'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Lightbulb, Loader2, Volume2, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import { SessionExercise } from '@/types/learning-session';
import { tts } from '@/lib/tts';

interface ExerciseStepProps {
  exercise: SessionExercise;
  exerciseNumber: number;
  totalExercises: number;
  streak: number;
  ttsEnabled: boolean;
  onAnswer: (isCorrect: boolean, timeSpent: number) => void;
  onRate?: (exerciseId: string, rating: 'good' | 'bad') => void;
}

export function ExerciseStep({
  exercise,
  exerciseNumber,
  totalExercises,
  streak,
  ttsEnabled,
  onAnswer,
  onRate,
}: ExerciseStepProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // États pour les types d'exercices interactifs
  const [dragDropOrder, setDragDropOrder] = useState<number[]>([]);
  const [matchPairs, setMatchPairs] = useState<Record<number, number>>({});
  const [sortingItems, setSortingItems] = useState<Record<number, number>>({});
  const [timelineOrder, setTimelineOrder] = useState<number[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [puzzleOrder, setPuzzleOrder] = useState<number[]>([]);
  const [drawingCompleted, setDrawingCompleted] = useState(false);

  const content = exercise.content;
  const question = content.question || content.text || '';
  const hint = content.hint;

  // Lecture vocale automatique
  useEffect(() => {
    if (ttsEnabled && question) {
      // Arrêter toute lecture en cours avant de commencer
      tts.stop();
      const timer = setTimeout(() => {
        tts.speakQuestion(question);
      }, 300);
      return () => {
        clearTimeout(timer);
        tts.stop();
      };
    }
  }, [exercise.id, ttsEnabled, question]);

  const handleSpeak = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      await tts.speakQuestion(question);
    } catch (e) {
      console.error('[TTS] Error:', e);
    }
    setIsSpeaking(false);
  };

  const handleRate = (rating: 'good' | 'bad') => {
    if (hasRated || !onRate) return;
    onRate(exercise.id, rating);
    setHasRated(true);
  };

  const checkAnswer = useCallback((): boolean => {
    switch (exercise.type) {
      case 'qcm':
      case 'image_qcm':
        return selectedAnswer === content.correct;

      case 'fill_blank':
        if (!content.blanks) return false;
        const userAnswers = inputValue.split(',').map(a => a.trim().toLowerCase());
        return content.blanks.every((blank, i) => 
          userAnswers[i]?.toLowerCase() === blank.toLowerCase()
        );

      case 'free_input':
        const userAnswer = inputValue.trim().toLowerCase();
        const expectedAnswer = (content.answer || '').toLowerCase();
        if (userAnswer === expectedAnswer) return true;
        if (content.acceptedAnswers) {
          return content.acceptedAnswers.some(a => a.toLowerCase() === userAnswer);
        }
        return false;

      case 'drag_drop':
        if (!content.correctOrder || dragDropOrder.length === 0) return false;
        return JSON.stringify(dragDropOrder) === JSON.stringify(content.correctOrder);

      case 'match_pairs':
        if (!content.pairs) return false;
        const pairsCount = content.pairs.length;
        if (Object.keys(matchPairs).length !== pairsCount) return false;
        return content.pairs.every((_, i) => matchPairs[i] === i);

      case 'sorting':
        if (!content.items) return false;
        const itemsArray = content.items as Array<{ text: string; category: number }>;
        return itemsArray.every((item, i) => sortingItems[i] === item.category);

      case 'timeline':
        if (!content.events || timelineOrder.length === 0) return false;
        const sortedEvents = [...content.events].sort((a, b) => a.order - b.order);
        return timelineOrder.every((idx, pos) => content.events![idx].order === pos);

      case 'hotspot':
        return selectedHotspot === content.correctItem;

      case 'puzzle':
        if (!content.correctOrder || puzzleOrder.length === 0) return false;
        return JSON.stringify(puzzleOrder) === JSON.stringify(content.correctOrder);

      case 'drawing':
        return drawingCompleted;

      case 'animation':
        return selectedAnswer === content.correct;

      default:
        return false;
    }
  }, [exercise.type, selectedAnswer, inputValue, content, dragDropOrder, matchPairs, sortingItems, timelineOrder, selectedHotspot, puzzleOrder, drawingCompleted]);

  const handleSubmit = async () => {
    if (isSubmitting || showResult) return;
    setIsSubmitting(true);

    const correct = checkAnswer();
    setIsCorrect(correct);
    setShowResult(true);

    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    // Appeler onAnswer après un court délai pour laisser l'animation se jouer
    setTimeout(() => {
      setIsSubmitting(false);
      onAnswer(correct, timeSpent);
    }, 1000);
  };

  const canSubmit = () => {
    if (showResult) return false;
    switch (exercise.type) {
      case 'qcm':
      case 'image_qcm':
      case 'animation':
        return selectedAnswer !== null;
      case 'fill_blank':
      case 'free_input':
        return inputValue.trim().length > 0;
      case 'drag_drop':
        return dragDropOrder.length === (content.items as string[] || []).length;
      case 'match_pairs':
        return Object.keys(matchPairs).length === (content.pairs || []).length;
      case 'sorting':
        const sortingItemsArray = (content.items || []) as Array<{ text: string; category: number }>;
        return Object.keys(sortingItems).length === sortingItemsArray.length;
      case 'timeline':
        return timelineOrder.length === (content.events || []).length;
      case 'hotspot':
        return selectedHotspot !== null;
      case 'puzzle':
        return puzzleOrder.length === (content.pieces || []).length;
      case 'drawing':
        return drawingCompleted;
      default:
        return false;
    }
  };

  const getOptionText = (option: string | { text: string; description?: string }): string => {
    return typeof option === 'string' ? option : option.text;
  };

  const renderExerciseContent = () => {
    switch (exercise.type) {
      case 'qcm':
        return (
          <div className="grid grid-cols-1 gap-3 mt-6">
            {content.options?.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: showResult ? 1 : 1.02 }}
                whileTap={{ scale: showResult ? 1 : 0.98 }}
                onClick={() => !showResult && setSelectedAnswer(index)}
                disabled={showResult}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  showResult
                    ? index === content.correct
                      ? 'border-green-500 bg-green-50'
                      : selectedAnswer === index
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 opacity-50'
                    : selectedAnswer === index
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      showResult
                        ? index === content.correct
                          ? 'bg-green-500 text-white'
                          : selectedAnswer === index
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                        : selectedAnswer === index
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">{getOptionText(option)}</span>
                  </div>
                  {showResult && index === content.correct && (
                    <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                  )}
                  {showResult && selectedAnswer === index && index !== content.correct && (
                    <XCircle className="h-5 w-5 text-red-500 ml-auto" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        );

      case 'image_qcm':
        return (
          <div className="grid grid-cols-2 gap-4 mt-6">
            {content.options?.map((option, index) => {
              const optionObj = typeof option === 'object' ? option : { text: option };
              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: showResult ? 1 : 1.05 }}
                  whileTap={{ scale: showResult ? 1 : 0.95 }}
                  onClick={() => !showResult && setSelectedAnswer(index)}
                  disabled={showResult}
                  className={`p-4 rounded-2xl border-3 text-center transition-all flex flex-col items-center gap-2 ${
                    showResult
                      ? index === content.correct
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-300'
                        : selectedAnswer === index
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 opacity-50'
                      : selectedAnswer === index
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}
                >
                  {'emoji' in optionObj && optionObj.emoji && (
                    <span className="text-4xl">{optionObj.emoji}</span>
                  )}
                  <span className="font-bold text-gray-800">{optionObj.text}</span>
                  {'description' in optionObj && optionObj.description && (
                    <p className="text-xs text-gray-500">{optionObj.description}</p>
                  )}
                  {showResult && index === content.correct && (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  )}
                  {showResult && selectedAnswer === index && index !== content.correct && (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                </motion.button>
              );
            })}
          </div>
        );

      case 'fill_blank':
        const textParts = (content.text || '').split('___');
        return (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl text-lg">
              {textParts.map((part, i) => (
                <span key={i}>
                  {part}
                  {i < textParts.length - 1 && (
                    <input
                      type="text"
                      disabled={showResult}
                      className={`mx-1 px-3 py-1 w-24 text-center rounded-lg border-2 font-bold ${
                        showResult
                          ? isCorrect
                            ? 'border-green-500 bg-green-50'
                            : 'border-red-500 bg-red-50'
                          : 'border-indigo-300 focus:border-indigo-500'
                      }`}
                      value={inputValue.split(',')[i] || ''}
                      onChange={(e) => {
                        const parts = inputValue.split(',');
                        parts[i] = e.target.value;
                        setInputValue(parts.join(','));
                      }}
                    />
                  )}
                </span>
              ))}
            </div>
            {showResult && !isCorrect && content.blanks && (
              <p className="text-sm text-gray-600">
                Réponse attendue : <span className="font-bold">{content.blanks.join(', ')}</span>
              </p>
            )}
          </div>
        );

      case 'free_input':
        return (
          <div className="mt-6 space-y-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={showResult}
              placeholder="Ta réponse..."
              className={`w-full p-4 text-xl text-center rounded-xl border-2 font-bold ${
                showResult
                  ? isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-gray-200 focus:border-indigo-500'
              }`}
              onKeyDown={(e) => e.key === 'Enter' && canSubmit() && handleSubmit()}
            />
            {showResult && !isCorrect && (
              <p className="text-sm text-gray-600 text-center">
                Réponse attendue : <span className="font-bold">{content.answer}</span>
              </p>
            )}
          </div>
        );

      case 'drag_drop':
        const items = content.items as string[] || [];
        return (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-gray-500 mb-2">Clique sur les éléments dans le bon ordre :</p>
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl min-h-[60px]">
              {dragDropOrder.map((itemIndex, orderIndex) => (
                <motion.button
                  key={orderIndex}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    showResult
                      ? content.correctOrder?.[orderIndex] === itemIndex
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-indigo-500 text-white'
                  }`}
                  onClick={() => !showResult && setDragDropOrder(prev => prev.filter((_, i) => i !== orderIndex))}
                  disabled={showResult}
                >
                  {items[itemIndex]}
                </motion.button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                !dragDropOrder.includes(index) && (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-indigo-500 font-medium"
                    onClick={() => !showResult && setDragDropOrder(prev => [...prev, index])}
                    disabled={showResult}
                  >
                    {item}
                  </motion.button>
                )
              ))}
            </div>
          </div>
        );

      case 'match_pairs':
        const pairs = content.pairs || [];
        const shuffledRightIndices = useState(() => 
          [...Array(pairs.length).keys()].sort(() => Math.random() - 0.5)
        )[0];
        return (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                {pairs.map((pair, leftIndex) => (
                  <div
                    key={leftIndex}
                    className={`p-3 rounded-lg border-2 ${
                      matchPairs[leftIndex] !== undefined
                        ? showResult
                          ? matchPairs[leftIndex] === leftIndex
                            ? 'border-green-500 bg-green-50'
                            : 'border-red-500 bg-red-50'
                          : 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300'
                    }`}
                  >
                    {pair.left}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {shuffledRightIndices.map((rightIndex) => (
                  <motion.button
                    key={rightIndex}
                    whileHover={{ scale: showResult ? 1 : 1.02 }}
                    className={`w-full p-3 rounded-lg border-2 text-left ${
                      Object.values(matchPairs).includes(rightIndex)
                        ? 'border-gray-200 opacity-50'
                        : 'border-gray-300 hover:border-indigo-500'
                    }`}
                    onClick={() => {
                      if (showResult) return;
                      const unmatched = pairs.findIndex((_, i) => matchPairs[i] === undefined);
                      if (unmatched !== -1) {
                        setMatchPairs(prev => ({ ...prev, [unmatched]: rightIndex }));
                      }
                    }}
                    disabled={showResult || Object.values(matchPairs).includes(rightIndex)}
                  >
                    {pairs[rightIndex]?.right}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'sorting':
        const sortingItemsArray = (content.items || []) as Array<{ text: string; category: number }>;
        const categories = content.categories || [];
        return (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category, catIndex) => (
                <div key={catIndex} className="border-2 border-dashed border-gray-300 rounded-xl p-4 min-h-[100px]">
                  <h4 className="font-medium text-gray-700 mb-2">{category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(sortingItems)
                      .filter(([, cat]) => cat === catIndex)
                      .map(([itemIndex]) => {
                        const item = sortingItemsArray[parseInt(itemIndex)];
                        const isCorrectPlacement = item?.category === catIndex;
                        return (
                          <span
                            key={itemIndex}
                            className={`px-3 py-1 rounded-full text-sm ${
                              showResult
                                ? isCorrectPlacement
                                  ? 'bg-green-500 text-white'
                                  : 'bg-red-500 text-white'
                                : 'bg-indigo-500 text-white'
                            }`}
                          >
                            {item?.text}
                          </span>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl">
              {sortingItemsArray.map((item, index) => (
                sortingItems[index] === undefined && (
                  <div key={index} className="flex gap-1">
                    {categories.map((_, catIndex) => (
                      <motion.button
                        key={catIndex}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1 rounded-lg border border-gray-300 hover:border-indigo-500 text-sm"
                        onClick={() => !showResult && setSortingItems(prev => ({ ...prev, [index]: catIndex }))}
                        disabled={showResult}
                      >
                        {item.text} → {categories[catIndex]}
                      </motion.button>
                    ))}
                  </div>
                )
              ))}
            </div>
          </div>
        );

      case 'timeline':
        const events = content.events || [];
        return (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-gray-500 mb-2">📅 Place les événements dans l'ordre chronologique :</p>
            <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl min-h-[60px] border-2 border-dashed border-indigo-200">
              {timelineOrder.map((eventIndex, orderIndex) => (
                <motion.div
                  key={orderIndex}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                    showResult
                      ? events[eventIndex]?.order === orderIndex
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-indigo-500 text-white'
                  }`}
                >
                  <span className="text-xs opacity-75">{orderIndex + 1}.</span>
                  {events[eventIndex]?.text}
                  {!showResult && (
                    <button
                      onClick={() => setTimelineOrder(prev => prev.filter((_, i) => i !== orderIndex))}
                      className="ml-1 text-white/70 hover:text-white"
                    >×</button>
                  )}
                </motion.div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {events.map((event, index) => (
                !timelineOrder.includes(index) && (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-indigo-500 font-medium bg-white shadow-sm"
                    onClick={() => !showResult && setTimelineOrder(prev => [...prev, index])}
                    disabled={showResult}
                  >
                    {event.text}
                  </motion.button>
                )
              ))}
            </div>
          </div>
        );

      case 'hotspot':
        const hotspotItems = content.items as string[] || [];
        return (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
              <p className="text-gray-700 italic mb-2">🎯 Scénario :</p>
              <p className="text-gray-800 font-medium">{content.scenario}</p>
            </div>
            <p className="text-sm text-gray-500">Clique sur l'élément demandé :</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {hotspotItems.map((item, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: showResult ? 1 : 1.05 }}
                  whileTap={{ scale: showResult ? 1 : 0.95 }}
                  onClick={() => !showResult && setSelectedHotspot(item)}
                  disabled={showResult}
                  className={`p-4 rounded-xl border-2 text-center font-medium transition-all ${
                    showResult
                      ? item === content.correctItem
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : selectedHotspot === item
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 opacity-50'
                      : selectedHotspot === item
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {item}
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 'puzzle':
        const pieces = content.pieces || [];
        return (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-gray-500 mb-2">🧩 Reconstitue dans le bon ordre :</p>
            <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl min-h-[60px] border-2 border-dashed border-purple-200">
              {puzzleOrder.map((pieceIndex, orderIndex) => (
                <motion.div
                  key={orderIndex}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    showResult
                      ? content.correctOrder?.[orderIndex] === pieceIndex
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-purple-500 text-white'
                  }`}
                >
                  {pieces[pieceIndex]}
                  {!showResult && (
                    <button
                      onClick={() => setPuzzleOrder(prev => prev.filter((_, i) => i !== orderIndex))}
                      className="ml-2 text-white/70 hover:text-white"
                    >×</button>
                  )}
                </motion.div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {pieces.map((piece, index) => (
                !puzzleOrder.includes(index) && (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-purple-500 font-medium bg-white shadow-sm"
                    onClick={() => !showResult && setPuzzleOrder(prev => [...prev, index])}
                    disabled={showResult}
                  >
                    {piece}
                  </motion.button>
                )
              ))}
            </div>
          </div>
        );

      case 'drawing':
        return (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200">
              <p className="text-gray-700 mb-2">🎨 Instruction :</p>
              <p className="text-gray-800 font-medium text-lg">{content.instruction}</p>
            </div>
            <div className="p-6 bg-white rounded-xl border-2 border-dashed border-gray-300 min-h-[150px] flex flex-col items-center justify-center">
              <p className="text-gray-400 mb-4">Zone de dessin (simulation)</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => !showResult && setDrawingCompleted(!drawingCompleted)}
                disabled={showResult}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  drawingCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {drawingCompleted ? '✓ Dessin terminé' : 'Marquer comme terminé'}
              </motion.button>
            </div>
          </div>
        );

      case 'animation':
        return (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-cyan-200">
              <p className="text-gray-700 mb-2">✨ Animation :</p>
              <p className="text-gray-800 font-medium italic">{content.scenario}</p>
            </div>
            <p className="text-sm text-gray-600 font-medium">{content.action}</p>
            <div className="grid grid-cols-1 gap-3">
              {content.options?.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: showResult ? 1 : 1.02 }}
                  whileTap={{ scale: showResult ? 1 : 0.98 }}
                  onClick={() => !showResult && setSelectedAnswer(index)}
                  disabled={showResult}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    showResult
                      ? index === content.correct
                        ? 'border-green-500 bg-green-50'
                        : selectedAnswer === index
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 opacity-50'
                      : selectedAnswer === index
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        showResult
                          ? index === content.correct
                            ? 'bg-green-500 text-white'
                            : selectedAnswer === index
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                          : selectedAnswer === index
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="font-medium text-gray-800">{getOptionText(option)}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        );

      default:
        return <p className="text-gray-500">Type d'exercice non supporté: {exercise.type}</p>;
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Question {exerciseNumber}/{totalExercises}
            </span>
            {exercise.is_ai_generated && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 text-xs">
                <Sparkles className="h-3 w-3" />
                IA
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeak}
              disabled={isSpeaking}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              title="Lire la question"
            >
              <Volume2 className={`h-4 w-4 ${isSpeaking ? 'text-indigo-500 animate-pulse' : ''}`} />
            </button>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              exercise.difficulty <= 2
                ? 'bg-green-100 text-green-700'
                : exercise.difficulty <= 3
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}>
              Niveau {exercise.difficulty}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 leading-relaxed">
          {question}
        </h3>

        {renderExerciseContent()}

        {hint && !showResult && (
          <div className="mt-4">
            {showHint ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-amber-50 rounded-xl border border-amber-200"
              >
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-800">{hint}</p>
                </div>
              </motion.div>
            ) : (
              <button
                onClick={() => setShowHint(true)}
                className="flex items-center gap-2 text-amber-600 hover:text-amber-700 text-sm"
              >
                <Lightbulb className="h-4 w-4" />
                Voir un indice
              </button>
            )}
          </div>
        )}

        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-4 rounded-xl ${
              isCorrect
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isCorrect ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="font-bold text-green-700">Excellent ! 🎉</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-500" />
                    <span className="font-bold text-red-700">Pas tout à fait...</span>
                  </>
                )}
              </div>
              {onRate && !hasRated && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 mr-1">Cet exercice :</span>
                  <button
                    onClick={() => handleRate('good')}
                    className="p-1.5 rounded-full hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors"
                    title="Bon exercice"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRate('bad')}
                    className="p-1.5 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                    title="Mauvais exercice"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </div>
              )}
              {hasRated && (
                <span className="text-xs text-gray-400">Merci !</span>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit() || isSubmitting}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            canSubmit() && !isSubmitting
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Vérification...
            </span>
          ) : showResult ? (
            'Chargement...'
          ) : (
            'Vérifier'
          )}
        </button>
      </div>
    </div>
  );
}
