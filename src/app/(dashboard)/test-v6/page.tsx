'use client';

import { useState } from 'react';
import { MathManipulationExercise } from '@/components/exercises/MathManipulationExercise';
import { DictationExercise } from '@/components/exercises/DictationExercise';
import { TimelineExercise } from '@/components/exercises/TimelineExercise';
import { AudioRecognitionExercise } from '@/components/exercises/AudioRecognitionExercise';
import { MatchingExercise } from '@/components/exercises/MatchingExercise';

export default function TestV6Page() {
  const [activeTab, setActiveTab] = useState<string>('math');
  const [results, setResults] = useState<Record<string, { correct: boolean; answer: unknown }>>({});

  const handleAnswer = (exerciseId: string) => (isCorrect: boolean, answer: unknown) => {
    setResults(prev => ({ ...prev, [exerciseId]: { correct: isCorrect, answer } }));
  };

  const tabs = [
    { id: 'math', label: 'Math Manipulation' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'matching', label: 'Matching' },
    { id: 'audio', label: 'Audio Recognition' },
    { id: 'dictation', label: 'Dictation' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Test Exercices V6</h1>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Exercise content */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {activeTab === 'math' && (
          <MathManipulationExercise
            content={{
              manipulation_type: 'number_line',
              config: { min: 0, max: 10, step: 1, initial: 0 },
              target: { value: 7 },
              instruction: 'Place le curseur sur le nombre 7',
              hints: ['Le nombre 7 est entre 6 et 8', 'Compte les graduations depuis 0'],
            }}
            onAnswer={handleAnswer('math')}
            showHint={true}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineExercise
            content={{
              events: [
                { id: '1', title: 'Invention de l\'écriture', date: '-3300', description: 'En Mésopotamie' },
                { id: '2', title: 'Construction des pyramides', date: '-2500', description: 'En Égypte' },
                { id: '3', title: 'Fondation de Rome', date: '-753', description: 'Par Romulus' },
                { id: '4', title: 'Chute de l\'Empire romain', date: '476', description: 'Fin de l\'Antiquité' },
              ],
              time_range: { start: '-4000', end: '500' },
              show_dates: false,
            }}
            onAnswer={handleAnswer('timeline')}
          />
        )}

        {activeTab === 'matching' && (
          <MatchingExercise
            content={{
              pairs: [
                { left: 'Chat', right: 'Miaou' },
                { left: 'Chien', right: 'Wouf' },
                { left: 'Vache', right: 'Meuh' },
                { left: 'Coq', right: 'Cocorico' },
              ],
              instruction: 'Associe chaque animal à son cri',
            }}
            onAnswer={handleAnswer('matching')}
          />
        )}

        {activeTab === 'audio' && (
          <AudioRecognitionExercise
            content={{
              question: 'Quel instrument entends-tu ?',
              options: ['Piano', 'Guitare', 'Violon', 'Flûte'],
              correct_answer: 0,
              replay_limit: 3,
            }}
            onAnswer={handleAnswer('audio')}
          />
        )}

        {activeTab === 'dictation' && (
          <DictationExercise
            content={{
              text: 'Le chat dort sur le canapé.',
              focus_rules: ['accord sujet-verbe', 'article défini'],
              max_replays: 3,
            }}
            onAnswer={handleAnswer('dictation')}
          />
        )}
      </div>

      {/* Results */}
      {Object.keys(results).length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-2">Résultats des tests :</h3>
          <div className="space-y-2">
            {Object.entries(results).map(([id, result]) => (
              <div key={id} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${result.correct ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium">{id}:</span>
                <span className={result.correct ? 'text-green-600' : 'text-red-600'}>
                  {result.correct ? 'Correct' : 'Incorrect'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
