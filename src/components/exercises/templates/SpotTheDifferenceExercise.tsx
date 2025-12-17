'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Eye, RotateCcw } from 'lucide-react';

interface SpotTheDifferenceExerciseProps {
  content: {
    instruction: string;
    image1: string;
    image2: string;
    differences: {
      id: string;
      x: number;
      y: number;
      radius: number;
      description?: string;
    }[];
    time_limit_seconds?: number;
    feedback_correct?: string;
    feedback_incomplete?: string;
  };
  onAnswer: (isCorrect: boolean, foundDifferences: string[]) => void;
  disabled?: boolean;
}

export function SpotTheDifferenceExercise({ content, onAnswer, disabled }: SpotTheDifferenceExerciseProps) {
  const [foundDifferences, setFoundDifferences] = useState<string[]>([]);
  const [wrongClicks, setWrongClicks] = useState<{ x: number; y: number }[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [activeImage, setActiveImage] = useState<1 | 2>(1);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>, imageNum: 1 | 2) => {
    if (disabled || showResult) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clickedDifference = content.differences.find(diff => {
      const distance = Math.sqrt(Math.pow(x - diff.x, 2) + Math.pow(y - diff.y, 2));
      return distance <= diff.radius && !foundDifferences.includes(diff.id);
    });

    if (clickedDifference) {
      setFoundDifferences(prev => [...prev, clickedDifference.id]);
      setWrongClicks([]);
    } else {
      setWrongClicks(prev => [...prev, { x, y }]);
      setTimeout(() => {
        setWrongClicks(prev => prev.filter(click => click.x !== x || click.y !== y));
      }, 500);
    }
  };

  const handleSubmit = () => {
    const allFound = foundDifferences.length === content.differences.length;
    setIsCorrect(allFound);
    setShowResult(true);
    onAnswer(allFound, foundDifferences);
  };

  const reset = () => {
    setFoundDifferences([]);
    setWrongClicks([]);
    setShowResult(false);
  };

  const progress = (foundDifferences.length / content.differences.length) * 100;

  return (
    <div className="space-y-6">
      {/* Instruction */}
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          {content.instruction}
        </h2>
        <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
          <Eye className="h-4 w-4" />
          Clique sur les différences entre les deux images
        </p>
      </div>

      {/* Barre de progression */}
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>{foundDifferences.length} / {content.differences.length} différences trouvées</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Sélecteur d'image (mobile) */}
      <div className="flex justify-center gap-2 md:hidden">
        <button
          onClick={() => setActiveImage(1)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeImage === 1 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Image 1
        </button>
        <button
          onClick={() => setActiveImage(2)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeImage === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Image 2
        </button>
      </div>

      {/* Images */}
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2].map((imageNum) => (
          <div
            key={imageNum}
            className={`relative rounded-2xl overflow-hidden shadow-lg cursor-crosshair ${
              activeImage !== imageNum ? 'hidden md:block' : ''
            }`}
            onClick={(e) => handleImageClick(e, imageNum as 1 | 2)}
          >
            <img
              src={imageNum === 1 ? content.image1 : content.image2}
              alt={`Image ${imageNum}`}
              className="w-full h-64 md:h-80 object-cover"
              draggable={false}
            />
            
            {/* Différences trouvées */}
            {foundDifferences.map(diffId => {
              const diff = content.differences.find(d => d.id === diffId);
              if (!diff) return null;
              return (
                <motion.div
                  key={diffId}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${diff.x}%`,
                    top: `${diff.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-green-500 bg-green-500/20" />
                    <CheckCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-green-500" />
                  </div>
                </motion.div>
              );
            })}

            {/* Clics erronés */}
            {wrongClicks.map((click, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute pointer-events-none"
                style={{
                  left: `${click.x}%`,
                  top: `${click.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <XCircle className="h-8 w-8 text-red-500" />
              </motion.div>
            ))}

            {/* Différences non trouvées (après résultat) */}
            {showResult && !isCorrect && content.differences
              .filter(diff => !foundDifferences.includes(diff.id))
              .map(diff => (
                <motion.div
                  key={diff.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${diff.x}%`,
                    top: `${diff.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="h-12 w-12 rounded-full border-4 border-dashed border-amber-500 bg-amber-500/20 animate-pulse" />
                </motion.div>
              ))}

            {/* Label */}
            <div className="absolute top-2 left-2 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
              Image {imageNum}
            </div>
          </div>
        ))}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl ${isCorrect ? 'bg-green-100' : 'bg-amber-100'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isCorrect ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Eye className="h-6 w-6 text-amber-600" />
                )}
                <p className={`font-bold ${isCorrect ? 'text-green-800' : 'text-amber-800'}`}>
                  {isCorrect 
                    ? (content.feedback_correct || 'Bravo ! Tu as trouvé toutes les différences ! 🎉') 
                    : (content.feedback_incomplete || `Tu as trouvé ${foundDifferences.length} différence(s) sur ${content.differences.length}.`)}
                </p>
              </div>
              {!isCorrect && (
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Réessayer
                </button>
              )}
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
          disabled={disabled}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
        >
          {foundDifferences.length === content.differences.length 
            ? 'Valider mes réponses' 
            : `J'ai trouvé ${foundDifferences.length} différence(s)`}
        </motion.button>
      )}
    </div>
  );
}
