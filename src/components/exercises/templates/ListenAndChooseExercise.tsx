'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Volume2, Play, Pause, RotateCcw } from 'lucide-react';

interface ListenAndChooseExerciseProps {
  content: {
    instruction: string;
    audio_url: string;
    audio_text?: string;
    options: {
      id: string;
      text?: string;
      image?: string;
    }[];
    correct_id: string;
    play_limit?: number;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, answer: string) => void;
  disabled?: boolean;
}

export function ListenAndChooseExercise({ content, onAnswer, disabled }: ListenAndChooseExerciseProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playLimit = content.play_limit || 3;

  useEffect(() => {
    audioRef.current = new Audio(content.audio_url);
    audioRef.current.onended = () => setIsPlaying(false);
    audioRef.current.onplay = () => setIsPlaying(true);
    audioRef.current.onpause = () => setIsPlaying(false);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [content.audio_url]);

  const handlePlay = () => {
    if (!audioRef.current || playCount >= playLimit) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
      setPlayCount(prev => prev + 1);
      setHasPlayed(true);
    }
  };

  const handleSelect = (id: string) => {
    if (disabled || showResult || !hasPlayed) return;
    setSelectedId(id);
  };

  const handleSubmit = () => {
    if (!selectedId || showResult) return;
    const correct = selectedId === content.correct_id;
    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(correct, selectedId);
  };

  const hasImages = content.options.some(opt => opt.image);

  return (
    <div className="space-y-6">
      {/* Instruction */}
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          {content.instruction}
        </h2>
        <p className="text-gray-500 text-sm">Écoute attentivement puis choisis la bonne réponse</p>
      </div>

      {/* Lecteur audio stylisé */}
      <div className="flex justify-center">
        <motion.div 
          className="relative"
          animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <button
            onClick={handlePlay}
            disabled={playCount >= playLimit && !isPlaying}
            className={`relative h-24 w-24 rounded-full flex items-center justify-center transition-all ${
              isPlaying 
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-300'
                : playCount >= playLimit
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:shadow-lg hover:shadow-indigo-300'
            }`}
          >
            {isPlaying ? (
              <Pause className="h-10 w-10 text-white" />
            ) : (
              <Play className="h-10 w-10 text-white ml-1" />
            )}
            
            {/* Cercles d'animation audio */}
            {isPlaying && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-indigo-300"
                  animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-indigo-300"
                  animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.3 }}
                />
              </>
            )}
          </button>
          
          {/* Compteur d'écoutes */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm text-gray-500">
            {playCount}/{playLimit} écoutes
          </div>
        </motion.div>
      </div>

      {/* Message si pas encore écouté */}
      {!hasPlayed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-amber-600 bg-amber-50 p-3 rounded-lg"
        >
          👆 Clique sur le bouton pour écouter avant de répondre
        </motion.p>
      )}

      {/* Options */}
      <div className={`grid gap-3 ${hasImages ? 'grid-cols-2' : 'grid-cols-1 max-w-lg mx-auto'} ${!hasPlayed ? 'opacity-50 pointer-events-none' : ''}`}>
        {content.options.map((option) => {
          const isSelected = selectedId === option.id;
          const isCorrectOption = showResult && option.id === content.correct_id;
          const isWrongSelection = showResult && isSelected && option.id !== content.correct_id;

          return (
            <motion.button
              key={option.id}
              whileHover={!showResult && !disabled && hasPlayed ? { scale: 1.02 } : {}}
              whileTap={!showResult && !disabled && hasPlayed ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(option.id)}
              disabled={disabled || showResult || !hasPlayed}
              className={`relative rounded-2xl border-3 overflow-hidden transition-all ${
                isCorrectOption
                  ? 'border-green-500 bg-green-50 ring-4 ring-green-200'
                  : isWrongSelection
                    ? 'border-red-500 bg-red-50'
                    : isSelected
                      ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-200'
                      : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              {option.image ? (
                <div className="relative">
                  <img 
                    src={option.image} 
                    alt={option.text || `Option`}
                    className="w-full h-32 md:h-40 object-cover"
                  />
                  {option.text && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <span className="text-white font-medium">{option.text}</span>
                    </div>
                  )}
                  <div className={`absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center ${
                    isCorrectOption ? 'bg-green-500' : isWrongSelection ? 'bg-red-500' : isSelected ? 'bg-indigo-500' : 'bg-white/80'
                  }`}>
                    {isCorrectOption && <CheckCircle className="h-5 w-5 text-white" />}
                    {isWrongSelection && <XCircle className="h-5 w-5 text-white" />}
                  </div>
                </div>
              ) : (
                <div className="p-4 flex items-center gap-3">
                  <span className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                    isCorrectOption ? 'bg-green-500 text-white' : isWrongSelection ? 'bg-red-500 text-white' : isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isCorrectOption ? <CheckCircle className="h-5 w-5" /> : isWrongSelection ? <XCircle className="h-5 w-5" /> : '•'}
                  </span>
                  <span className="text-lg font-medium text-left flex-1">{option.text}</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}
          >
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              )}
              <div>
                <p className={`font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect 
                    ? (content.feedback_correct || 'Excellent ! Tu as bien compris ! 🎧') 
                    : (content.feedback_incorrect || 'Ce n\'est pas la bonne réponse.')}
                </p>
                {content.audio_text && (
                  <p className="mt-2 text-gray-700 italic">« {content.audio_text} »</p>
                )}
              </div>
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
          disabled={!selectedId || disabled || !hasPlayed}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Vérifier
        </motion.button>
      )}
    </div>
  );
}
