'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, X, CheckCircle, XCircle, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { Lumi } from '@/components/lumi';
import { VictoryCelebration } from '@/components/animations';
import { playSound } from '@/lib/sounds';
import { createClient } from '@/lib/supabase/client';
import { fetchOrGenerateExercise, submitAnswerAndGetNext } from '@/server/actions/content';
import { updateDailyStreak } from '@/server/actions/streaks';
import { addXp } from '@/server/actions/xp';
import { tts } from '@/lib/tts';

interface QuickSessionProps {
  onClose: () => void;
  profileId: string;
  profileName: string;
}

interface Exercise {
  id: string;
  type: 'qcm' | 'fill_blank' | 'free_input';
  content: {
    question: string;
    options?: string[];
    correct?: number;
    answer?: string;
    text?: string;
    blanks?: string[];
  };
  difficulty: number;
}

const SESSION_DURATION = 180;
const MAX_EXERCISES = 5;

export default function QuickSession({ onClose, profileId, profileName }: QuickSessionProps) {
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [skillId, setSkillId] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
  const [inputAnswer, setInputAnswer] = useState('');
  const [fillBlankAnswers, setFillBlankAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [stats, setStats] = useState({ total: 0, correct: 0, xpEarned: 0 });
  const [showCelebration, setShowCelebration] = useState(false);
  const [exerciseStartTime, setExerciseStartTime] = useState<Date>(new Date());
  const [ttsEnabled, setTtsEnabled] = useState(true);

  useEffect(() => {
    loadRandomExercise();
  }, []);

  useEffect(() => {
    if (sessionComplete || loading) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setSessionComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionComplete, loading]);

  const loadRandomExercise = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: skills } = await supabase
      .from('skills')
      .select('id')
      .eq('status', 'published')
      .limit(10);

    if (skills && skills.length > 0) {
      const randomSkill = skills[Math.floor(Math.random() * skills.length)];
      setSkillId(randomSkill.id);
      
      const result = await fetchOrGenerateExercise(randomSkill.id, profileId);
      if (result.success && result.exercise) {
        setExercise(result.exercise as Exercise);
        setExerciseStartTime(new Date());
      }
    }
    setLoading(false);
  };

  // Lecture vocale de la question
  useEffect(() => {
    if (exercise && ttsEnabled && !showResult && !loading) {
      tts.stop();
      const timer = setTimeout(() => {
        tts.speakQuestion(exercise.content.question);
      }, 300);
      return () => {
        clearTimeout(timer);
        tts.stop();
      };
    }
    return () => tts.stop();
  }, [exercise?.id, ttsEnabled, showResult, loading]);

  const speakQuestion = () => {
    if (exercise) {
      tts.speakQuestion(exercise.content.question);
    }
  };

  const checkAnswer = useCallback(() => {
    if (!exercise || showResult) return;

    let correct = false;
    if (exercise.type === 'qcm') {
      correct = selectedAnswer === exercise.content.correct;
    } else if (exercise.type === 'free_input') {
      correct = inputAnswer.trim().toLowerCase() === exercise.content.answer?.toLowerCase();
    } else if (exercise.type === 'fill_blank') {
      const blanks = exercise.content.blanks || [];
      correct = blanks.every((blank, i) => 
        fillBlankAnswers[i]?.trim().toLowerCase() === blank.toLowerCase()
      );
    }

    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      playSound('correct');
      const xp = 10;
      setStats(prev => ({
        total: prev.total + 1,
        correct: prev.correct + 1,
        xpEarned: prev.xpEarned + xp
      }));
      
      // Mettre à jour streak et XP en base
      updateDailyStreak(profileId).catch(console.error);
      addXp(profileId, xp, 'quick_session').catch(console.error);
      
      if ((stats.correct + 1) % 3 === 0) {
        setShowCelebration(true);
        playSound('streak');
        setTimeout(() => setShowCelebration(false), 2000);
      }
    } else {
      playSound('incorrect');
      setStats(prev => ({ ...prev, total: prev.total + 1 }));
    }
  }, [exercise, selectedAnswer, inputAnswer, fillBlankAnswers, showResult, stats.correct]);

  const nextExercise = async () => {
    if (!skillId || !exercise) return;

    const timeSpent = Math.round((new Date().getTime() - exerciseStartTime.getTime()) / 1000);
    
    await submitAnswerAndGetNext(
      profileId,
      exercise.id,
      skillId,
      isCorrect,
      timeSpent,
      0,
      { selected: selectedAnswer, input: inputAnswer }
    );

    if (stats.total >= MAX_EXERCISES - 1 || timeLeft <= 0) {
      setSessionComplete(true);
      playSound('complete');
      return;
    }

    setSelectedAnswer(null);
    setInputAnswer('');
    setFillBlankAnswers([]);
    setShowResult(false);
    await loadRandomExercise();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((SESSION_DURATION - timeLeft) / SESSION_DURATION) * 100;

  if (loading && !exercise) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 text-center">
          <Lumi mood="thinking" size="lg" />
          <p className="mt-4 text-gray-600">Préparation de ta session...</p>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <VictoryCelebration active={true} type="complete" xpGained={stats.xpEarned} />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
        >
          <Lumi mood={percentage >= 60 ? 'celebrating' : 'encouraging'} size="lg" />
          
          <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
            {percentage >= 80 ? 'Incroyable !' : percentage >= 60 ? 'Bien joué !' : 'Bel effort !'}
          </h2>
          
          <p className="text-gray-600 mb-6">
            Tu as terminé ta session rapide !
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-blue-600/70">Exercices</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-green-600">{stats.correct}</p>
              <p className="text-xs text-green-600/70">Réussis</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-yellow-600">+{stats.xpEarned}</p>
              <p className="text-xs text-yellow-600/70">XP</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold"
          >
            Terminer
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col">
      <VictoryCelebration active={showCelebration} type="streak" streakCount={stats.correct} />
      
      <header className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl">
            <X className="h-6 w-6" />
          </button>
          
          {/* Bouton lecture vocale */}
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`p-2 rounded-xl transition-colors ${
              ttsEnabled ? 'bg-white/30' : 'bg-white/10'
            }`}
            title={ttsEnabled ? 'Désactiver la voix' : 'Activer la voix'}
          >
            {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
          
          {ttsEnabled && (
            <button
              onClick={speakQuestion}
              className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium hover:bg-white/30"
            >
              🔊 Relire
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
          <Clock className="h-5 w-5" />
          <span className="font-bold text-lg">{formatTime(timeLeft)}</span>
        </div>
        
        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
          <Zap className="h-5 w-5 text-yellow-300" />
          <span className="font-bold">{stats.xpEarned} XP</span>
        </div>
      </header>

      <div className="h-1 bg-white/20">
        <motion.div
          className="h-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
        />
      </div>

      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          key={exercise?.id}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl"
        >
          <div className="flex justify-center mb-4">
            <Lumi 
              mood={showResult ? (isCorrect ? 'celebrating' : 'encouraging') : 'curious'} 
              size="sm" 
            />
          </div>

          <div className="text-center mb-2">
            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
              <Zap className="h-3 w-3" />
              3 minutes chrono
            </span>
          </div>

          {exercise && (
            <>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-6">
                {exercise.content.question}
              </h2>

              {exercise.type === 'qcm' && exercise.content.options && (
                <div className="space-y-3 mb-6">
                  {exercise.content.options.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={!showResult ? { scale: 1.02 } : {}}
                      whileTap={!showResult ? { scale: 0.98 } : {}}
                      onClick={() => !showResult && setSelectedAnswer(index)}
                      disabled={showResult}
                      className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all ${
                        showResult
                          ? index === exercise.content.correct
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : index === selectedAnswer
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 text-gray-400'
                          : selectedAnswer === index
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs mr-3">
                        {String.fromCharCode(65 + index)}
                      </span>
                      {option}
                    </motion.button>
                  ))}
                </div>
              )}

              {exercise.type === 'free_input' && (
                <div className="mb-6">
                  <input
                    type="text"
                    value={inputAnswer}
                    onChange={(e) => setInputAnswer(e.target.value)}
                    disabled={showResult}
                    placeholder="Ta réponse..."
                    className={`w-full rounded-xl border-2 px-6 py-4 text-center text-xl font-bold ${
                      showResult
                        ? isCorrect
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 focus:border-indigo-500 focus:outline-none'
                    }`}
                    onKeyDown={(e) => e.key === 'Enter' && !showResult && checkAnswer()}
                  />
                  {showResult && !isCorrect && (
                    <p className="mt-2 text-center text-gray-600">
                      Réponse : <strong className="text-green-600">{exercise.content.answer}</strong>
                    </p>
                  )}
                </div>
              )}

              {exercise.type === 'fill_blank' && exercise.content.text && (
                <div className="mb-6">
                  <div className="text-lg leading-relaxed text-center">
                    {exercise.content.text.split('___').map((part, index, array) => (
                      <span key={index}>
                        {part}
                        {index < array.length - 1 && (
                          <input
                            type="text"
                            value={fillBlankAnswers[index] || ''}
                            onChange={(e) => {
                              const newAnswers = [...fillBlankAnswers];
                              newAnswers[index] = e.target.value;
                              setFillBlankAnswers(newAnswers);
                            }}
                            disabled={showResult}
                            className={`mx-1 w-20 rounded-lg border-2 px-2 py-1 text-center font-bold transition-all ${
                              showResult
                                ? fillBlankAnswers[index]?.trim().toLowerCase() === exercise.content.blanks?.[index]?.toLowerCase()
                                  ? 'border-green-500 bg-green-50 text-green-700'
                                  : 'border-red-500 bg-red-50 text-red-700'
                                : 'border-indigo-300 focus:border-indigo-500 focus:outline-none'
                            }`}
                            placeholder="..."
                          />
                        )}
                      </span>
                    ))}
                  </div>
                  {showResult && !isCorrect && exercise.content.blanks && (
                    <p className="mt-3 text-center text-gray-600">
                      Réponses : <strong className="text-green-600">{exercise.content.blanks.join(', ')}</strong>
                    </p>
                  )}
                </div>
              )}

              <AnimatePresence mode="wait">
                {showResult ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <div className={`flex items-center justify-center gap-2 p-3 rounded-xl ${
                      isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isCorrect ? (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Bravo ! +10 XP</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5" />
                          <span className="font-medium">Pas cette fois !</span>
                        </>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={nextExercise}
                      className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                    >
                      Suivant
                      <ArrowRight className="h-5 w-5" />
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={checkAnswer}
                    disabled={selectedAnswer === null && inputAnswer === '' && fillBlankAnswers.length === 0}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50"
                  >
                    Vérifier
                  </motion.button>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </main>

      <footer className="p-4 text-center text-white/80 text-sm">
        {stats.total} / {MAX_EXERCISES} exercices • {stats.correct} réussis
      </footer>
    </div>
  );
}
