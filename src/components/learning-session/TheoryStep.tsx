'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Lightbulb, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import { SkillTheoryContent } from '@/types/learning-session';

interface TheoryStepProps {
  theory: SkillTheoryContent;
  skillName: string;
  ttsEnabled: boolean;
  onComplete: () => void;
}

type Section = 'intro' | 'concept' | 'examples' | 'tips';

export function TheoryStep({ theory, skillName, ttsEnabled, onComplete }: TheoryStepProps) {
  const [currentSection, setCurrentSection] = useState<Section>('intro');
  const sections: Section[] = ['intro', 'concept', 'examples', 'tips'];
  const currentIndex = sections.indexOf(currentSection);

  const goNext = () => {
    if (currentIndex < sections.length - 1) {
      setCurrentSection(sections[currentIndex + 1]);
    } else {
      onComplete();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentSection(sections[currentIndex - 1]);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{theory.title}</h2>
            <p className="text-sm opacity-90">{skillName}</p>
          </div>
        </div>
        <div className="flex gap-1 mt-4">
          {sections.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= currentIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-6 min-h-[300px]">
        <AnimatePresence mode="wait">
          {currentSection === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <p className="text-xl text-gray-800 leading-relaxed">
                {theory.introduction}
              </p>
              <div className="p-4 bg-indigo-50 rounded-xl">
                <p className="text-indigo-800 font-medium">
                  📚 Dans cette leçon, tu vas apprendre...
                </p>
              </div>
            </motion.div>
          )}

          {currentSection === 'concept' && (
            <motion.div
              key="concept"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {theory.concept_explanation}
              </p>
              {theory.key_points.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h4 className="font-semibold text-gray-900">À retenir :</h4>
                  <ul className="space-y-2">
                    {theory.key_points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {currentSection === 'examples' && (
            <motion.div
              key="examples"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Exemples
              </h4>
              {theory.examples.map((example, i) => (
                <div key={i} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="font-medium text-amber-900">{example.problem}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-amber-600">→</span>
                    <span className="font-bold text-amber-800">{example.solution}</span>
                  </div>
                  <p className="mt-2 text-sm text-amber-700">{example.explanation}</p>
                </div>
              ))}
            </motion.div>
          )}

          {currentSection === 'tips' && (
            <motion.div
              key="tips"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {theory.tips.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-green-500" />
                    Astuces
                  </h4>
                  {theory.tips.map((tip, i) => (
                    <div key={i} className="p-3 bg-green-50 rounded-xl text-green-800">
                      💡 {tip}
                    </div>
                  ))}
                </div>
              )}
              {theory.common_mistakes.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Erreurs à éviter
                  </h4>
                  {theory.common_mistakes.map((mistake, i) => (
                    <div key={i} className="p-3 bg-red-50 rounded-xl text-red-800">
                      ⚠️ {mistake}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          Précédent
        </button>

        <button
          onClick={goNext}
          className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all"
        >
          {currentIndex === sections.length - 1 ? 'Commencer les exercices' : 'Suivant'}
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
