'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  completedSteps: Record<string, boolean>;
  labels?: Record<string, string>;
}

export function ProgressIndicator({
  steps,
  currentStep,
  completedSteps,
  labels,
}: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = completedSteps[step];
        const isCurrent = index === currentStep;
        const isPast = index < currentStep;

        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isCompleted
                    ? '#10B981'
                    : isCurrent
                    ? '#FFFFFF'
                    : 'rgba(255,255,255,0.3)',
                }}
                className={`relative flex items-center justify-center h-8 w-8 rounded-full transition-colors ${
                  isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <span
                    className={`text-sm font-bold ${
                      isCurrent ? 'text-indigo-600' : 'text-white/70'
                    }`}
                  >
                    {index + 1}
                  </span>
                )}
              </motion.div>
              {labels && (
                <span
                  className={`mt-1 text-xs font-medium ${
                    isCurrent || isCompleted ? 'text-white' : 'text-white/60'
                  }`}
                >
                  {labels[step]}
                </span>
              )}
            </div>

            {index < steps.length - 1 && (
              <div className="flex-1 mx-2">
                <div className="h-1 rounded-full bg-white/20 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: isPast || isCompleted ? '100%' : '0%',
                    }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
