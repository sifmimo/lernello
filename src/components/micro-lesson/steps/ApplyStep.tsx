'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApplyContent } from '@/types/micro-lesson';
import { Rocket, CheckCircle, Send } from 'lucide-react';
import { EnhancedFeedbackDisplay } from '@/components/micro-lesson/EnhancedFeedbackDisplay';

interface ApplyStepProps {
  apply: ApplyContent;
  subjectColor: string;
  onComplete: (score: number) => void;
}

export function ApplyStep({ apply, subjectColor, onComplete }: ApplyStepProps) {
  const [answer, setAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (apply.input_type === 'free_response') {
      setIsCorrect(answer.trim().length > 10);
    } else if (apply.expected_answer) {
      const normalizedAnswer = answer.trim().toLowerCase();
      const normalizedExpected = apply.expected_answer.trim().toLowerCase();
      setIsCorrect(normalizedAnswer === normalizedExpected);
    } else {
      setIsCorrect(true);
    }
    setShowFeedback(true);
  };

  const handleComplete = () => {
    onComplete(isCorrect ? 100 : 50);
  };

  const renderInput = () => {
    switch (apply.input_type) {
      case 'free_response':
        return (
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={showFeedback}
            rows={4}
            className="w-full p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
            placeholder="Écris ta réponse ici..."
          />
        );

      case 'select':
        return (
          <div className="grid grid-cols-2 gap-3">
            {['Option A', 'Option B', 'Option C', 'Option D'].map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setAnswer(option)}
                disabled={showFeedback}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  answer === option
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${showFeedback ? 'opacity-70' : ''}`}
              >
                <span className="font-medium">{option}</span>
              </motion.button>
            ))}
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={showFeedback}
            className="w-full p-4 text-2xl text-center font-bold rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="Ta réponse..."
          />
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={showFeedback}
            className="w-full p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="Ta réponse..."
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div
          className="p-2 rounded-full"
          style={{ backgroundColor: `${subjectColor}20` }}
        >
          <Rocket className="h-5 w-5" style={{ color: subjectColor }} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">À toi de jouer !</h3>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200"
      >
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">🌍</span>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Situation réelle</h4>
            <p className="text-gray-700">{apply.context}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="p-5 rounded-2xl bg-white border-2 border-gray-100 shadow-sm"
      >
        <p className="text-lg font-medium text-gray-900 mb-4">
          🎯 {apply.challenge}
        </p>

        {renderInput()}
      </motion.div>

      {apply.real_world_connection && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200"
        >
          <div className="flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div>
              <span className="text-sm text-emerald-700 font-medium">Pourquoi c'est utile ?</span>
              <p className="text-emerald-800 mt-1">{apply.real_world_connection}</p>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showFeedback && (
          <EnhancedFeedbackDisplay
            isCorrect={isCorrect}
            feedbackCorrect="Bravo ! Tu as réussi à appliquer ce que tu as appris ! 🎉"
            feedbackIncorrect="Pas tout à fait, mais tu as fait un bon effort ! Continue comme ça 💪"
            correctAnswer={apply.expected_answer}
            onContinue={handleComplete}
            subjectColor={subjectColor}
            isFinal
          />
        )}
      </AnimatePresence>

      {!showFeedback && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={handleSubmit}
          disabled={!answer.trim()}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
          style={{ backgroundColor: subjectColor }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>Valider ma réponse</span>
          <Send className="h-5 w-5" />
        </motion.button>
      )}

      {apply.success_criteria && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-500"
        >
          ✓ {apply.success_criteria}
        </motion.p>
      )}
    </div>
  );
}
