'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Volume2, Keyboard, Mic, MicOff } from 'lucide-react';

interface TypeAnswerExerciseProps {
  content: {
    question: string;
    question_image?: string;
    question_audio?: string;
    correct_answer: string;
    alternatives?: string[];
    case_sensitive?: boolean;
    accept_partial?: boolean;
    hint?: string;
    keyboard_layout?: 'letters' | 'numbers' | 'special';
    show_virtual_keyboard?: boolean;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, answer: string) => void;
  disabled?: boolean;
}

export function TypeAnswerExercise({ content, onAnswer, disabled }: TypeAnswerExerciseProps) {
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const playAudio = (url?: string) => {
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(console.error);
    }
  };

  const normalizeAnswer = (text: string) => {
    let normalized = text.trim();
    if (!content.case_sensitive) {
      normalized = normalized.toLowerCase();
    }
    return normalized.replace(/\s+/g, ' ');
  };

  const checkAnswer = (userAnswer: string) => {
    const normalizedUser = normalizeAnswer(userAnswer);
    const normalizedCorrect = normalizeAnswer(content.correct_answer);
    
    if (normalizedUser === normalizedCorrect) return true;
    
    if (content.alternatives) {
      return content.alternatives.some(alt => normalizeAnswer(alt) === normalizedUser);
    }
    
    if (content.accept_partial) {
      return normalizedCorrect.includes(normalizedUser) || normalizedUser.includes(normalizedCorrect);
    }
    
    return false;
  };

  const handleSubmit = () => {
    if (!answer.trim() || showResult) return;
    const correct = checkAnswer(answer);
    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(correct, answer);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleVirtualKey = (key: string) => {
    if (key === 'BACK') {
      setAnswer(prev => prev.slice(0, -1));
    } else if (key === 'SPACE') {
      setAnswer(prev => prev + ' ');
    } else {
      setAnswer(prev => prev + key);
    }
    inputRef.current?.focus();
  };

  const virtualKeyboard = {
    letters: [
      ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
      ['W', 'X', 'C', 'V', 'B', 'N', 'BACK'],
      ['SPACE']
    ],
    numbers: [
      ['7', '8', '9'],
      ['4', '5', '6'],
      ['1', '2', '3'],
      ['0', ',', 'BACK']
    ],
    special: [
      ['é', 'è', 'ê', 'ë', 'à', 'â', 'ù', 'û'],
      ['ô', 'î', 'ï', 'ç', 'œ', 'æ'],
      ['BACK']
    ]
  };

  const currentKeyboard = virtualKeyboard[content.keyboard_layout || 'letters'];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

      {/* Zone de saisie */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || showResult}
            placeholder="Tape ta réponse..."
            className={`w-full px-6 py-4 text-center text-2xl font-bold rounded-2xl border-3 transition-all ${
              showResult
                ? isCorrect
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
            }`}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          
          {/* Icône de résultat */}
          {showResult && (
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
              {isCorrect ? <CheckCircle className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
            </div>
          )}
        </div>

        {/* Bonne réponse si incorrect */}
        {showResult && !isCorrect && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-center text-lg"
          >
            <span className="text-gray-600">La bonne réponse était : </span>
            <span className="font-bold text-green-600">{content.correct_answer}</span>
          </motion.p>
        )}
      </div>

      {/* Clavier virtuel */}
      {content.show_virtual_keyboard && !showResult && (
        <div className="max-w-md mx-auto space-y-2">
          {currentKeyboard.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1">
              {row.map((key) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleVirtualKey(key)}
                  disabled={disabled}
                  className={`rounded-lg font-bold transition-all ${
                    key === 'SPACE'
                      ? 'px-16 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600'
                      : key === 'BACK'
                        ? 'px-4 py-3 bg-red-100 hover:bg-red-200 text-red-600'
                        : 'w-10 h-10 bg-white border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 text-gray-800 shadow-sm'
                  }`}
                >
                  {key === 'SPACE' ? '␣' : key === 'BACK' ? '⌫' : key}
                </motion.button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Indice */}
      {content.hint && !showResult && (
        <div className="text-center">
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            {showHint ? 'Masquer l\'indice' : '💡 Besoin d\'un indice ?'}
          </button>
          <AnimatePresence>
            {showHint && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg"
              >
                {content.hint}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}
          >
            <div className="flex items-center gap-3">
              {isCorrect ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <p className={`font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {isCorrect 
                  ? (content.feedback_correct || 'Excellent ! C\'est la bonne réponse ! 🎉') 
                  : (content.feedback_incorrect || 'Ce n\'est pas tout à fait ça...')}
              </p>
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
          disabled={!answer.trim() || disabled}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Vérifier
        </motion.button>
      )}
    </div>
  );
}
