'use client';

import { useState } from 'react';
import { Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ShortAnswerExerciseProps {
  content: {
    question: string;
    expected_keywords?: string[];
    max_words?: number;
    sample_answer?: string;
  };
  onAnswer: (isCorrect: boolean, answer: string, keywordsFound: string[]) => void;
  disabled?: boolean;
  useAI?: boolean;
}

export function ShortAnswerExercise({ content, onAnswer, disabled, useAI = false }: ShortAnswerExerciseProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [keywordsFound, setKeywordsFound] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);

  const wordCount = userAnswer.trim().split(/\s+/).filter(w => w.length > 0).length;
  const maxWords = content.max_words || 50;

  const checkAnswer = async () => {
    if (disabled || showResult || !userAnswer.trim()) return;
    
    setChecking(true);

    // Vérification par mots-clés
    const keywords = content.expected_keywords || [];
    const found = keywords.filter(keyword => 
      userAnswer.toLowerCase().includes(keyword.toLowerCase())
    );
    
    setKeywordsFound(found);
    
    // Au moins 50% des mots-clés pour être correct (ou 2 minimum)
    const minRequired = Math.max(2, Math.ceil(keywords.length * 0.5));
    const correct = found.length >= minRequired || found.length === keywords.length;
    
    setIsCorrect(correct);
    setShowResult(true);
    setChecking(false);
    
    onAnswer(correct, userAnswer, found);
  };

  return (
    <div className="space-y-6">
      <p className="text-xl font-medium text-gray-800 text-center">
        {content.question}
      </p>

      <div className="relative">
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={disabled || showResult}
          placeholder="Écris ta réponse ici..."
          rows={4}
          className={`w-full p-4 rounded-xl border-2 resize-none transition-all ${
            showResult
              ? isCorrect
                ? 'border-green-500 bg-green-50'
                : 'border-orange-500 bg-orange-50'
              : 'border-gray-200 focus:border-indigo-500 focus:outline-none'
          }`}
        />
        <div className={`absolute bottom-3 right-3 text-sm ${
          wordCount > maxWords ? 'text-red-500' : 'text-gray-400'
        }`}>
          {wordCount}/{maxWords} mots
        </div>
      </div>

      {!showResult && (
        <div className="flex justify-center">
          <button
            onClick={checkAnswer}
            disabled={!userAnswer.trim() || wordCount > maxWords || disabled || checking}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {checking ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            {checking ? 'Vérification...' : 'Envoyer'}
          </button>
        </div>
      )}

      {showResult && (
        <div className="space-y-4">
          <div className={`flex items-center justify-center gap-3 p-4 rounded-xl ${
            isCorrect ? 'bg-green-100' : 'bg-orange-100'
          }`}>
            {isCorrect ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-orange-600" />
            )}
            <span className={`font-medium ${
              isCorrect ? 'text-green-800' : 'text-orange-800'
            }`}>
              {isCorrect ? 'Bonne réponse !' : 'Ta réponse peut être améliorée'}
            </span>
          </div>

          {content.expected_keywords && content.expected_keywords.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Mots-clés attendus :
              </p>
              <div className="flex flex-wrap gap-2">
                {content.expected_keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      keywordsFound.includes(keyword)
                        ? 'bg-green-200 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {keywordsFound.includes(keyword) ? '✓ ' : ''}{keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {content.sample_answer && (
            <div className="p-4 bg-indigo-50 rounded-xl">
              <p className="text-sm font-medium text-indigo-800 mb-1">
                Exemple de réponse :
              </p>
              <p className="text-indigo-700">{content.sample_answer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
