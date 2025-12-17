'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LearnContent } from '@/types/micro-lesson';
import { BookOpen, ChevronDown, ChevronUp, AlertTriangle, Lightbulb, Volume2 } from 'lucide-react';

interface LearnStepProps {
  learn: LearnContent;
  subjectColor: string;
  onComplete: () => void;
}

type ExplanationLevel = 'simple' | 'standard' | 'advanced';

export function LearnStep({ learn, subjectColor, onComplete }: LearnStepProps) {
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>('standard');
  const [showMistakes, setShowMistakes] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      onComplete();
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const currentExplanation = learn.explanation[explanationLevel];

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
          <BookOpen className="h-5 w-5" style={{ color: subjectColor }} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">À retenir</h3>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="p-5 rounded-2xl border-2"
        style={{ borderColor: subjectColor, backgroundColor: `${subjectColor}08` }}
      >
        <div className="flex items-start justify-between mb-3">
          <h4 className="text-xl font-bold text-gray-900">{learn.concept_name}</h4>
          <button
            onClick={() => speakText(currentExplanation)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Volume2 className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {(['simple', 'standard', 'advanced'] as ExplanationLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => {
                setExplanationLevel(level);
                handleInteraction();
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                explanationLevel === level
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor: explanationLevel === level ? subjectColor : undefined,
              }}
            >
              {level === 'simple' ? '🌱 Simple' : level === 'standard' ? '📚 Standard' : '🚀 Avancé'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={explanationLevel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-gray-700 text-lg leading-relaxed"
          >
            {currentExplanation}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      {learn.visual_representation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-gray-50 border border-gray-200"
        >
          <div className="flex items-center gap-2 mb-2 text-gray-600">
            <span className="text-lg">🎨</span>
            <span className="text-sm font-medium">Visualisation</span>
          </div>
          <p className="text-gray-600 italic">{learn.visual_representation.description}</p>
        </motion.div>
      )}

      {learn.key_formula && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-center"
        >
          <span className="text-sm text-indigo-600 font-medium">Formule clé</span>
          <p className="text-xl font-mono font-bold text-indigo-900 mt-1">{learn.key_formula}</p>
        </motion.div>
      )}

      {learn.mnemonic && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-purple-50 border border-purple-200"
        >
          <Lightbulb className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-sm text-purple-600 font-medium">Astuce pour retenir</span>
            <p className="text-purple-900 mt-1">{learn.mnemonic}</p>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-xl bg-emerald-50 border border-emerald-200"
      >
        <div className="flex items-center gap-2 text-emerald-700 font-medium mb-1">
          <span>✨</span>
          <span>L'essentiel</span>
        </div>
        <p className="text-emerald-900">{learn.key_takeaway}</p>
      </motion.div>

      {learn.common_mistakes && learn.common_mistakes.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={() => {
              setShowMistakes(!showMistakes);
              handleInteraction();
            }}
            className="flex items-center gap-2 text-amber-700 hover:text-amber-800 font-medium"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Erreurs fréquentes à éviter</span>
            {showMistakes ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <AnimatePresence>
            {showMistakes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2"
              >
                {learn.common_mistakes.map((mistake, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200"
                  >
                    <span className="text-amber-600">⚠️</span>
                    <p className="text-amber-800 text-sm">{mistake}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
