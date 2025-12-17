'use client';

import { ContentBlock } from '@/types/skill-presentation';
import { useState } from 'react';
import { ChevronRight, CheckCircle, Eye } from 'lucide-react';

interface ExampleBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
}

export function ExampleBlock({ block, onInteraction }: ExampleBlockProps) {
  const { format, content } = block;
  const [currentStep, setCurrentStep] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  const steps = content.steps || [];

  const renderGuidedFormat = () => (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
        <h3 className="text-white font-semibold">Exemple guidé</h3>
      </div>
      
      <div className="p-6">
        <p className="text-lg text-gray-800 mb-6">{content.problem}</p>
        
        {content.visual_support && (
          <img 
            src={content.visual_support} 
            alt="Support visuel" 
            className="mb-6 rounded-lg max-h-40 mx-auto"
          />
        )}

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`rounded-lg border-2 p-4 transition-all ${
                index < currentStep 
                  ? 'border-green-300 bg-green-50' 
                  : index === currentStep 
                    ? 'border-indigo-300 bg-indigo-50' 
                    : 'border-gray-200 bg-gray-50 opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  index < currentStep 
                    ? 'bg-green-500 text-white' 
                    : index === currentStep 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-300 text-gray-600'
                }`}>
                  {index < currentStep ? <CheckCircle className="h-5 w-5" /> : index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{step.instruction}</p>
                  {index <= currentStep && (
                    <p className="text-indigo-600 font-semibold mt-1">→ {step.answer}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {currentStep < steps.length && (
          <button
            onClick={() => { setCurrentStep(prev => prev + 1); onInteraction?.(); }}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Étape suivante
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );

  const renderWorkedOutFormat = () => (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4">
        <h3 className="text-white font-semibold">Exemple résolu</h3>
      </div>
      
      <div className="p-6">
        <p className="text-lg text-gray-800 mb-4">{content.problem}</p>
        
        <button
          onClick={() => { setShowSolution(!showSolution); onInteraction?.(); }}
          className="flex items-center gap-2 text-orange-600 font-medium hover:text-orange-700"
        >
          <Eye className="h-5 w-5" />
          {showSolution ? 'Masquer la solution' : 'Voir la solution'}
        </button>

        {showSolution && steps.length > 0 && (
          <div className="mt-4 space-y-2 border-l-4 border-orange-300 pl-4">
            {steps.map((step, index) => (
              <div key={index} className="text-gray-700">
                <span className="font-medium text-orange-600">Étape {index + 1}:</span> {step.instruction}
                <span className="block text-gray-900 font-semibold ml-4">= {step.answer}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  switch (format) {
    case 'guided': return renderGuidedFormat();
    case 'worked_out': return renderWorkedOutFormat();
    default: return renderGuidedFormat();
  }
}
