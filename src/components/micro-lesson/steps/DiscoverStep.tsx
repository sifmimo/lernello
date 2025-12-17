'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiscoverContent } from '@/types/micro-lesson';
import { Eye, ChevronRight, Lightbulb, CheckCircle } from 'lucide-react';

interface DiscoverStepProps {
  discover: DiscoverContent;
  subjectColor: string;
  onComplete: () => void;
}

export function DiscoverStep({ discover, subjectColor, onComplete }: DiscoverStepProps) {
  const [currentDiscoveryStep, setCurrentDiscoveryStep] = useState(0);
  const [showAhaMoment, setShowAhaMoment] = useState(false);

  const steps = discover.guided_discovery || [];
  const totalSteps = steps.length;

  const handleNextDiscovery = () => {
    if (currentDiscoveryStep < totalSteps - 1) {
      setCurrentDiscoveryStep(prev => prev + 1);
    } else if (!showAhaMoment) {
      setShowAhaMoment(true);
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-4"
      >
        <div
          className="p-2 rounded-full"
          style={{ backgroundColor: `${subjectColor}20` }}
        >
          <Eye className="h-5 w-5" style={{ color: subjectColor }} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Observe et découvre</h3>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200"
      >
        <p className="text-lg text-amber-900 font-medium">
          🔍 {discover.observation_prompt}
        </p>
      </motion.div>

      {discover.visual_aid && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-gray-50 text-center"
        >
          <p className="text-gray-600 italic">{discover.visual_aid}</p>
        </motion.div>
      )}

      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {steps.slice(0, currentDiscoveryStep + 1).map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 ${
                index === currentDiscoveryStep
                  ? 'border-indigo-300 bg-indigo-50'
                  : 'border-green-300 bg-green-50'
              }`}
            >
              <div
                className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white font-bold ${
                  index < currentDiscoveryStep ? 'bg-green-500' : ''
                }`}
                style={{
                  backgroundColor: index === currentDiscoveryStep ? subjectColor : undefined,
                }}
              >
                {index < currentDiscoveryStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              <p className="text-gray-700 flex-1 pt-1">{step}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!showAhaMoment && currentDiscoveryStep < totalSteps && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleNextDiscovery}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium transition-all hover:shadow-lg"
          style={{ backgroundColor: subjectColor }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {currentDiscoveryStep < totalSteps - 1 ? (
            <>
              <span>Étape suivante</span>
              <ChevronRight className="h-5 w-5" />
            </>
          ) : (
            <>
              <Lightbulb className="h-5 w-5" />
              <span>J'ai compris !</span>
            </>
          )}
        </motion.button>
      )}

      <AnimatePresence>
        {showAhaMoment && discover.aha_moment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-yellow-100 to-amber-100 border-2 border-yellow-300 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-4xl"
              >
                💡
              </motion.div>
              <div>
                <h4 className="font-bold text-amber-900 mb-2">Eurêka !</h4>
                <p className="text-amber-800 text-lg">{discover.aha_moment}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
