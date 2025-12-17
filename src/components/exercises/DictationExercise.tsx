'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, CheckCircle, XCircle } from 'lucide-react';

interface DictationContent {
  audio_url?: string;
  text: string;
  focus_rules?: string[];
  difficulty_words?: string[];
  playback_speed_options?: number[];
  max_replays?: number;
}

interface DictationExerciseProps {
  content: DictationContent;
  onAnswer: (isCorrect: boolean, answer: string, errors?: string[]) => void;
}

export function DictationExercise({ content, onAnswer }: DictationExerciseProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [userText, setUserText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ word: string; expected: string; type: string }[]>([]);
  const [score, setScore] = useState(0);

  const { text, audio_url, max_replays = 3, playback_speed_options = [0.75, 1, 1.25] } = content;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio && !audio_url) {
      // Use TTS if no audio URL
      if ('speechSynthesis' in window) {
        if (isPlaying) {
          speechSynthesis.cancel();
          setIsPlaying(false);
        } else {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'fr-FR';
          utterance.rate = playbackSpeed * 0.8;
          utterance.onend = () => setIsPlaying(false);
          speechSynthesis.speak(utterance);
          setIsPlaying(true);
          setPlayCount(prev => prev + 1);
        }
      }
      return;
    }

    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (playCount < max_replays) {
        audio.playbackRate = playbackSpeed;
        audio.play();
        setIsPlaying(true);
        setPlayCount(prev => prev + 1);
      }
    }
  };

  const changeSpeed = () => {
    const currentIndex = playback_speed_options.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % playback_speed_options.length;
    const newSpeed = playback_speed_options[nextIndex];
    setPlaybackSpeed(newSpeed);
    
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = newSpeed;
    }
  };

  const normalizeText = (t: string): string => {
    return t
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,!?;:'"()-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const compareTexts = (expected: string, actual: string) => {
    const expectedWords = expected.split(/\s+/);
    const actualWords = actual.split(/\s+/);
    const foundErrors: { word: string; expected: string; type: string }[] = [];
    let correctCount = 0;

    expectedWords.forEach((expectedWord, index) => {
      const actualWord = actualWords[index] || '';
      const normalizedExpected = normalizeText(expectedWord);
      const normalizedActual = normalizeText(actualWord);

      if (normalizedExpected === normalizedActual) {
        // Check for accent/case differences
        if (expectedWord.toLowerCase() !== actualWord.toLowerCase()) {
          foundErrors.push({
            word: actualWord,
            expected: expectedWord,
            type: 'accent'
          });
        } else {
          correctCount++;
        }
      } else if (actualWord === '') {
        foundErrors.push({
          word: '___',
          expected: expectedWord,
          type: 'missing'
        });
      } else {
        foundErrors.push({
          word: actualWord,
          expected: expectedWord,
          type: 'spelling'
        });
      }
    });

    // Check for extra words
    if (actualWords.length > expectedWords.length) {
      for (let i = expectedWords.length; i < actualWords.length; i++) {
        foundErrors.push({
          word: actualWords[i],
          expected: '',
          type: 'extra'
        });
      }
    }

    return {
      errors: foundErrors,
      score: Math.round((correctCount / expectedWords.length) * 100)
    };
  };

  const handleSubmit = () => {
    const result = compareTexts(text, userText);
    setErrors(result.errors);
    setScore(result.score);
    setIsSubmitted(true);
    
    const isCorrect = result.score >= 80;
    onAnswer(isCorrect, userText, result.errors.map(e => `${e.word} → ${e.expected} (${e.type})`));
  };

  const handleReset = () => {
    setUserText('');
    setIsSubmitted(false);
    setErrors([]);
    setScore(0);
    setPlayCount(0);
  };

  const highlightErrors = () => {
    if (!isSubmitted || errors.length === 0) return userText;

    const expectedWords = text.split(/\s+/);
    const actualWords = userText.split(/\s+/);

    return actualWords.map((word, index) => {
      const error = errors.find(e => e.word === word && expectedWords[index] === e.expected);
      if (error) {
        const colorClass = error.type === 'spelling' ? 'bg-red-200' :
                          error.type === 'accent' ? 'bg-yellow-200' :
                          error.type === 'extra' ? 'bg-orange-200' : '';
        return `<span class="${colorClass} px-1 rounded">${word}</span>`;
      }
      return word;
    }).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Audio player */}
      {audio_url && <audio ref={audioRef} src={audio_url} preload="metadata" />}
      
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Volume2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Dictée</h3>
              <p className="text-sm text-gray-500">
                Écoutes restantes : {Math.max(0, max_replays - playCount)}/{max_replays}
              </p>
            </div>
          </div>
          
          <button
            onClick={changeSpeed}
            className="px-3 py-1.5 rounded-full bg-white text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {playbackSpeed}x
          </button>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={togglePlay}
            disabled={playCount >= max_replays && !isPlaying}
            className={`h-16 w-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
              playCount >= max_replays && !isPlaying
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-purple-500 to-indigo-600 hover:shadow-xl'
            }`}
          >
            {isPlaying ? (
              <Pause className="h-7 w-7" />
            ) : (
              <Play className="h-7 w-7 ml-1" />
            )}
          </button>
        </div>

        {playCount >= max_replays && (
          <p className="text-center text-sm text-amber-600 mt-3">
            Tu as utilisé toutes tes écoutes. Écris ce que tu as retenu !
          </p>
        )}
      </div>

      {/* Writing area */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Écris ce que tu entends :
        </label>
        {isSubmitted ? (
          <div 
            className="w-full p-4 rounded-xl border-2 border-gray-200 bg-gray-50 min-h-[120px] text-gray-800"
            dangerouslySetInnerHTML={{ __html: highlightErrors() }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            placeholder="Écris la dictée ici..."
            className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all min-h-[120px] text-gray-800"
            disabled={isSubmitted}
          />
        )}
      </div>

      {/* Result */}
      {isSubmitted && (
        <div className="space-y-4">
          <div className={`flex items-center justify-between p-4 rounded-xl ${
            score >= 80 ? 'bg-green-50' : score >= 50 ? 'bg-yellow-50' : 'bg-red-50'
          }`}>
            <div className="flex items-center gap-3">
              {score >= 80 ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <span className={`font-medium ${
                score >= 80 ? 'text-green-700' : score >= 50 ? 'text-yellow-700' : 'text-red-700'
              }`}>
                Score : {score}%
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {errors.length} erreur{errors.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Error details */}
          {errors.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3">Corrections :</h4>
              <div className="space-y-2">
                {errors.slice(0, 5).map((error, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-0.5 rounded ${
                      error.type === 'spelling' ? 'bg-red-100 text-red-700' :
                      error.type === 'accent' ? 'bg-yellow-100 text-yellow-700' :
                      error.type === 'missing' ? 'bg-gray-100 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {error.word}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="text-green-700 font-medium">{error.expected || '(à supprimer)'}</span>
                    <span className="text-gray-400 text-xs">
                      ({error.type === 'spelling' ? 'orthographe' :
                        error.type === 'accent' ? 'accent' :
                        error.type === 'missing' ? 'manquant' : 'en trop'})
                    </span>
                  </div>
                ))}
                {errors.length > 5 && (
                  <p className="text-sm text-gray-500">
                    Et {errors.length - 5} autre{errors.length - 5 > 1 ? 's' : ''} erreur{errors.length - 5 > 1 ? 's' : ''}...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Correct text */}
          <div className="bg-green-50 rounded-xl p-4">
            <h4 className="font-medium text-green-800 mb-2">Texte correct :</h4>
            <p className="text-green-700">{text}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!userText.trim()}
            className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Vérifier ma dictée
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
