'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, CheckCircle, XCircle } from 'lucide-react';

interface AudioRecognitionContent {
  audio_url?: string;
  question: string;
  audio_type?: 'note' | 'interval' | 'chord' | 'rhythm' | 'instrument' | 'melody' | 'word';
  options: string[];
  correct_answer: number;
  replay_limit?: number;
}

interface AudioRecognitionExerciseProps {
  content: AudioRecognitionContent;
  onAnswer: (isCorrect: boolean, answer: number) => void;
}

export function AudioRecognitionExercise({ content, onAnswer }: AudioRecognitionExerciseProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const { audio_url, question, options, correct_answer, replay_limit = 3 } = content;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  const playAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    } else if (playCount < replay_limit) {
      audio.play();
      setIsPlaying(true);
      setPlayCount(prev => prev + 1);
    }
  };

  const handleSelect = (index: number) => {
    if (!isSubmitted) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    const correct = selectedAnswer === correct_answer;
    setIsCorrect(correct);
    setIsSubmitted(true);
    onAnswer(correct, selectedAnswer);
  };

  const handleReset = () => {
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setIsCorrect(false);
    setPlayCount(0);
  };

  return (
    <div className="space-y-6">
      {/* Audio player */}
      {audio_url && <audio ref={audioRef} src={audio_url} preload="metadata" />}

      {/* Question */}
      <div className="text-center">
        <p className="text-lg text-gray-800 font-medium">{question}</p>
      </div>

      {/* Audio control */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <button
            onClick={playAudio}
            disabled={playCount >= replay_limit && !isPlaying}
            className={`h-24 w-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${
              isPlaying
                ? 'bg-gradient-to-br from-green-400 to-green-600 animate-pulse'
                : playCount >= replay_limit
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-purple-500 to-indigo-600 hover:shadow-2xl hover:scale-105'
            }`}
          >
            {isPlaying ? (
              <Pause className="h-10 w-10" />
            ) : (
              <Play className="h-10 w-10 ml-1" />
            )}
          </button>
          
          {/* Sound waves animation */}
          {isPlaying && (
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-20" />
              <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-10" style={{ animationDelay: '0.2s' }} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Volume2 className="h-4 w-4" />
          <span>
            {playCount >= replay_limit
              ? 'Plus d\'écoutes disponibles'
              : `${replay_limit - playCount} écoute${replay_limit - playCount > 1 ? 's' : ''} restante${replay_limit - playCount > 1 ? 's' : ''}`
            }
          </span>
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={isSubmitted}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              isSubmitted
                ? index === correct_answer
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : index === selectedAnswer
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-gray-50 text-gray-400'
                : selectedAnswer === index
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isSubmitted
                  ? index === correct_answer
                    ? 'bg-green-500 text-white'
                    : index === selectedAnswer
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                  : selectedAnswer === index
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {String.fromCharCode(65 + index)}
              </div>
              <span className="font-medium">{option}</span>
              
              {isSubmitted && index === correct_answer && (
                <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
              )}
              {isSubmitted && index === selectedAnswer && index !== correct_answer && (
                <XCircle className="h-5 w-5 text-red-500 ml-auto" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Result */}
      {isSubmitted && (
        <div className={`flex items-center justify-center gap-3 p-4 rounded-xl ${
          isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {isCorrect ? (
            <>
              <CheckCircle className="h-6 w-6" />
              <span className="font-medium">Bravo ! Tu as bien reconnu le son !</span>
            </>
          ) : (
            <>
              <XCircle className="h-6 w-6" />
              <span className="font-medium">
                La bonne réponse était : {options[correct_answer]}
              </span>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Valider ma réponse
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Recommencer
          </button>
        )}
      </div>
    </div>
  );
}
