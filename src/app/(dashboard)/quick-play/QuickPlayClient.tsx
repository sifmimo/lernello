'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Zap, 
  Clock, 
  Star, 
  Trophy,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2,
  Home,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Lumi } from '@/components/lumi';

interface QuickExercise {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  skillName: string;
}

type SessionState = 'intro' | 'playing' | 'result';

export default function QuickPlayClient() {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>('intro');
  const [exercises, setExercises] = useState<QuickExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(180);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (sessionState !== 'playing' || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionState, timeLeft]);

  async function loadProfile() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profiles } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (profiles && profiles.length > 0) {
      setProfileId(profiles[0].id);
    }
  }

  async function startSession() {
    setLoading(true);
    const supabase = createClient();

    const { data: skills } = await supabase
      .from('skills')
      .select('id, name_key')
      .limit(10);

    const quickExercises: QuickExercise[] = [
      {
        id: '1',
        type: 'qcm',
        question: 'Combien font 7 + 5 ?',
        options: ['10', '11', '12', '13'],
        correctAnswer: '12',
        skillName: 'Addition'
      },
      {
        id: '2',
        type: 'qcm',
        question: 'Quel est le double de 8 ?',
        options: ['14', '15', '16', '18'],
        correctAnswer: '16',
        skillName: 'Multiplication'
      },
      {
        id: '3',
        type: 'qcm',
        question: 'Combien font 15 - 7 ?',
        options: ['6', '7', '8', '9'],
        correctAnswer: '8',
        skillName: 'Soustraction'
      },
    ];

    setExercises(quickExercises);
    setAnswers(new Array(quickExercises.length).fill(null));
    setCurrentIndex(0);
    setTimeLeft(180);
    setSessionState('playing');
    setLoading(false);
  }

  function handleAnswer(answer: string) {
    if (showFeedback) return;
    
    setSelectedAnswer(answer);
    setShowFeedback(true);

    const isCorrect = answer === exercises[currentIndex].correctAnswer;
    if (isCorrect) {
      setXpEarned(prev => prev + 10);
    }

    const newAnswers = [...answers];
    newAnswers[currentIndex] = answer;
    setAnswers(newAnswers);

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer(null);
      
      if (currentIndex < exercises.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        endSession();
      }
    }, 1500);
  }

  function endSession() {
    setSessionState('result');
    const correctCount = answers.filter((a, i) => a === exercises[i]?.correctAnswer).length;
  }

  function restartSession() {
    setSessionState('intro');
    setExercises([]);
    setAnswers([]);
    setCurrentIndex(0);
    setXpEarned(0);
    setTimeLeft(180);
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const correctCount = answers.filter((a, i) => a === exercises[i]?.correctAnswer).length;
  const currentExercise = exercises[currentIndex];

  if (sessionState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold mb-2">Défi Express</h1>
            <p className="text-muted-foreground mb-6">
              3 exercices en 3 minutes chrono !
            </p>

            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium">3 min</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-sm font-medium">3 exercices</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium">+30 XP</p>
              </div>
            </div>

            <Lumi 
              message="Prêt pour un défi rapide ? C'est parti !" 
              mood="excited"
              size="sm"
            />

            <button
              onClick={startSession}
              disabled={loading}
              className="w-full mt-6 py-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  C'est parti !
                </>
              )}
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sessionState === 'playing' && currentExercise) {
    const isCorrect = selectedAnswer === currentExercise.correctAnswer;

    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="font-bold">Défi Express</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold ${
              timeLeft <= 30 ? 'bg-red-100 text-red-600' : 'bg-gray-100'
            }`}>
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            {exercises.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full ${
                  i < currentIndex ? 'bg-green-500' :
                  i === currentIndex ? 'bg-primary' :
                  'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <div className="text-center mb-6">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {currentExercise.skillName}
              </span>
              <h2 className="text-2xl font-bold mt-2">
                {currentExercise.question}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {currentExercise.options?.map((option, i) => {
                const isSelected = selectedAnswer === option;
                const isCorrectOption = option === currentExercise.correctAnswer;
                
                let buttonClass = 'p-4 rounded-2xl border-2 font-bold text-lg transition-all ';
                
                if (showFeedback) {
                  if (isCorrectOption) {
                    buttonClass += 'border-green-500 bg-green-50 text-green-700';
                  } else if (isSelected && !isCorrectOption) {
                    buttonClass += 'border-red-500 bg-red-50 text-red-700';
                  } else {
                    buttonClass += 'border-gray-200 opacity-50';
                  }
                } else {
                  buttonClass += 'border-gray-200 hover:border-primary hover:bg-primary/5';
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(option)}
                    disabled={showFeedback}
                    className={buttonClass}
                  >
                    {option}
                    {showFeedback && isCorrectOption && (
                      <CheckCircle className="h-5 w-5 inline ml-2 text-green-500" />
                    )}
                    {showFeedback && isSelected && !isCorrectOption && (
                      <XCircle className="h-5 w-5 inline ml-2 text-red-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {showFeedback && (
              <div className={`mt-4 p-4 rounded-xl text-center ${
                isCorrect ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
              }`}>
                {isCorrect ? (
                  <p className="font-bold">Bravo ! +10 XP 🎉</p>
                ) : (
                  <p className="font-bold">Pas tout à fait, mais continue ! 💪</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} sur {exercises.length}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (sessionState === 'result') {
    const percentage = Math.round((correctCount / exercises.length) * 100);
    const message = percentage >= 80 ? "Incroyable ! Tu es un champion !" :
                   percentage >= 50 ? "Bien joué ! Continue comme ça !" :
                   "Pas mal ! Tu vas t'améliorer !";

    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-12 w-12 text-white" />
            </div>

            <h1 className="text-3xl font-bold mb-2">Défi terminé !</h1>
            
            <div className="flex justify-center gap-8 my-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{correctCount}/{exercises.length}</p>
                <p className="text-sm text-muted-foreground">Bonnes réponses</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-yellow-500">+{xpEarned}</p>
                <p className="text-sm text-muted-foreground">XP gagnés</p>
              </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-4 mb-6">
              <div 
                className="bg-gradient-to-r from-primary to-purple-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <Lumi 
              message={message}
              mood={percentage >= 50 ? "happy" : "encouraging"}
              size="sm"
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={restartSession}
                className="flex-1 py-3 border-2 border-primary text-primary rounded-2xl font-bold hover:bg-primary/5 flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-5 w-5" />
                Rejouer
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <Home className="h-5 w-5" />
                Accueil
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
