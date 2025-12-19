'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Volume2, Image as ImageIcon } from 'lucide-react';
import { tts } from '@/lib/tts';

interface ImageQCMExerciseProps {
  content: {
    question: string;
    question_audio?: string;
    question_image?: string;
    options: {
      text?: string;
      image?: string;
      audio?: string;
    }[];
    correct_index: number;
    explanation?: string;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, answer: number) => void;
  disabled?: boolean;
}

export function ImageQCMExercise({ content, onAnswer, disabled }: ImageQCMExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const playAudio = (url?: string) => {
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(console.error);
    }
  };

  const speakText = (text: string) => {
    tts.speak(text);
  };

  const handleSelect = (index: number) => {
    if (disabled || showResult) return;
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || showResult) return;
    const correct = selectedIndex === content.correct_index;
    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(correct, selectedIndex);
  };

  const hasImages = content.options.some(opt => opt.image);

  return (
    <div className="space-y-6">
      {/* Question avec média */}
      <div className="text-center space-y-4">
        {content.question_image && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative mx-auto max-w-md rounded-2xl overflow-hidden shadow-lg"
          >
            <img 
              src={content.question_image} 
              alt="Question" 
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </motion.div>
        )}
        
        <div className="flex items-center justify-center gap-3">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {content.question}
          </h2>
          <button
            onClick={() => content.question_audio ? playAudio(content.question_audio) : speakText(content.question)}
            className="p-2 rounded-full bg-indigo-100 hover:bg-indigo-200 transition-colors"
          >
            <Volume2 className="h-5 w-5 text-indigo-600" />
          </button>
        </div>
      </div>

      {/* Options avec images */}
      <div className={`grid gap-3 ${hasImages ? 'grid-cols-2' : 'grid-cols-1 max-w-lg mx-auto'}`}>
        {content.options.map((option, index) => (
          <motion.button
            key={index}
            whileHover={!showResult && !disabled ? { scale: 1.02 } : {}}
            whileTap={!showResult && !disabled ? { scale: 0.98 } : {}}
            onClick={() => handleSelect(index)}
            disabled={disabled || showResult}
            className={`relative rounded-2xl border-3 overflow-hidden transition-all ${
              showResult
                ? index === content.correct_index
                  ? 'border-green-500 bg-green-50 ring-4 ring-green-200'
                  : index === selectedIndex
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 opacity-50'
                : selectedIndex === index
                  ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-200'
                  : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
            }`}
          >
            {option.image ? (
              <div className="relative">
                <img 
                  src={option.image} 
                  alt={option.text || `Option ${index + 1}`}
                  className="w-full h-32 md:h-40 object-cover"
                />
                {option.text && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <span className="text-white font-medium">{option.text}</span>
                  </div>
                )}
                {/* Badge de sélection */}
                <div className={`absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center ${
                  showResult
                    ? index === content.correct_index
                      ? 'bg-green-500'
                      : index === selectedIndex
                        ? 'bg-red-500'
                        : 'bg-gray-300'
                    : selectedIndex === index
                      ? 'bg-indigo-500'
                      : 'bg-white/80'
                }`}>
                  {showResult && index === content.correct_index && (
                    <CheckCircle className="h-5 w-5 text-white" />
                  )}
                  {showResult && index === selectedIndex && index !== content.correct_index && (
                    <XCircle className="h-5 w-5 text-white" />
                  )}
                  {!showResult && (
                    <span className={`text-sm font-bold ${selectedIndex === index ? 'text-white' : 'text-gray-600'}`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 flex items-center gap-3">
                <span className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                  showResult
                    ? index === content.correct_index
                      ? 'bg-green-500 text-white'
                      : index === selectedIndex
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    : selectedIndex === index
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                }`}>
                  {showResult && index === content.correct_index ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : showResult && index === selectedIndex ? (
                    <XCircle className="h-5 w-5" />
                  ) : (
                    String.fromCharCode(65 + index)
                  )}
                </span>
                <span className="text-lg font-medium text-left flex-1">{option.text}</span>
                {option.audio && (
                  <button
                    onClick={(e) => { e.stopPropagation(); playAudio(option.audio); }}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    <Volume2 className="h-4 w-4 text-gray-600" />
                  </button>
                )}
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}
          >
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect 
                    ? (content.feedback_correct || 'Excellent ! 🎉') 
                    : (content.feedback_incorrect || 'Pas tout à fait...')}
                </p>
                {content.explanation && !isCorrect && (
                  <p className="mt-1 text-gray-700">{content.explanation}</p>
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
          disabled={selectedIndex === null || disabled}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Vérifier
        </motion.button>
      )}
    </div>
  );
}
