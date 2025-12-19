'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Volume2, HelpCircle, ChevronRight } from 'lucide-react';
import { tts } from '@/lib/tts';

interface QCMOption {
  text: string;
  is_correct: boolean;
  feedback: string;
  misconception?: string;
}

interface ProfessionalQCMProps {
  question: {
    text: string;
    context?: string;
    visual?: string;
    audio?: string;
  };
  options: QCMOption[];
  explanation: {
    short: string;
    detailed: string;
  };
  related_concept?: string;
  onAnswer: (isCorrect: boolean, selectedIndex: number) => void;
  subjectColor?: string;
  disabled?: boolean;
}

export function ProfessionalQCM({
  question,
  options,
  explanation,
  related_concept,
  onAnswer,
  subjectColor = '#6366F1',
  disabled = false,
}: ProfessionalQCMProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showDetailedExplanation, setShowDetailedExplanation] = useState(false);

  const correctIndex = options.findIndex(opt => opt.is_correct);
  const isCorrect = selectedIndex === correctIndex;

  const speakText = (text: string) => {
    tts.speak(text);
  };

  const handleSelect = (index: number) => {
    if (disabled || showResult) return;
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || showResult) return;
    setShowResult(true);
    onAnswer(selectedIndex === correctIndex, selectedIndex);
  };

  return (
    <div className="space-y-6">
      {question.context && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gray-50 border border-gray-200"
        >
          <p className="text-gray-600 italic">{question.context}</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        {question.visual && (
          <div className="mb-4 rounded-2xl overflow-hidden shadow-lg max-w-md mx-auto">
            <img
              src={question.visual}
              alt="Question"
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {question.text}
          </h2>
          <button
            onClick={() => speakText(question.text)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            style={{ color: subjectColor }}
          >
            <Volume2 className="h-5 w-5" />
          </button>
        </div>
      </motion.div>

      <div className="grid gap-3">
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrectOption = option.is_correct;
          const showAsCorrect = showResult && isCorrectOption;
          const showAsIncorrect = showResult && isSelected && !isCorrectOption;

          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={!showResult && !disabled ? { scale: 1.02 } : {}}
              whileTap={!showResult && !disabled ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(index)}
              disabled={disabled || showResult}
              className={`relative p-4 rounded-2xl border-3 text-left transition-all ${
                showAsCorrect
                  ? 'border-green-500 bg-green-50 ring-4 ring-green-200'
                  : showAsIncorrect
                  ? 'border-red-500 bg-red-50'
                  : isSelected
                  ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-200'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              } ${showResult && !isSelected && !isCorrectOption ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    showAsCorrect
                      ? 'bg-green-500 text-white'
                      : showAsIncorrect
                      ? 'bg-red-500 text-white'
                      : isSelected
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  style={{
                    backgroundColor: isSelected && !showResult ? subjectColor : undefined,
                  }}
                >
                  {showAsCorrect ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : showAsIncorrect ? (
                    <XCircle className="h-5 w-5" />
                  ) : (
                    String.fromCharCode(65 + index)
                  )}
                </div>
                <span className="text-lg font-medium flex-1">{option.text}</span>
              </div>

              {showResult && isSelected && !isCorrectOption && option.misconception && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t border-red-200"
                >
                  <p className="text-sm text-red-700">
                    <strong>Erreur fréquente :</strong> {option.misconception}
                  </p>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-5 rounded-2xl ${
              isCorrect
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300'
                : 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className={`p-2 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}
              >
                {isCorrect ? (
                  <CheckCircle className="h-6 w-6 text-white" />
                ) : (
                  <XCircle className="h-6 w-6 text-white" />
                )}
              </motion.div>

              <div className="flex-1">
                <h4 className={`font-bold text-lg mb-1 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect ? '🎉 Excellent !' : '😊 Pas tout à fait...'}
                </h4>

                <p className={`${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {selectedIndex !== null && options[selectedIndex]?.feedback}
                </p>

                <div className="mt-3 p-3 rounded-xl bg-white/70">
                  <p className="text-gray-700">{explanation.short}</p>
                </div>

                {!isCorrect && (
                  <button
                    onClick={() => setShowDetailedExplanation(!showDetailedExplanation)}
                    className="mt-3 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    <HelpCircle className="h-4 w-4" />
                    {showDetailedExplanation ? 'Masquer' : 'Voir'} l'explication détaillée
                  </button>
                )}

                <AnimatePresence>
                  {showDetailedExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200"
                    >
                      <p className="text-indigo-800">{explanation.detailed}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {related_concept && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    <span>📚</span>
                    <span>Concept lié : {related_concept}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showResult && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={selectedIndex === null || disabled}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ backgroundColor: subjectColor }}
        >
          Vérifier ma réponse
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      )}
    </div>
  );
}
