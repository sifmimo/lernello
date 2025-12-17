'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Lightbulb, Trophy, ArrowRight, Sparkles, Bot, MessageCircle, Star, Loader2, Wand2, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getAIHint, getEncouragement } from '@/server/actions/ai';
import { Lumi } from '@/components/lumi';
import { playSound } from '@/lib/sounds';
import { VictoryCelebration } from '@/components/animations';
import { fetchOrGenerateExercise, submitAnswerAndGetNext, rateExercise } from '@/server/actions/content';
import SkillTheory from '@/components/learning/SkillTheory';
import { getSkillContent } from '@/server/actions/skill-content';
import { updateDailyStreak } from '@/server/actions/streaks';
import { addXp } from '@/server/actions/xp';
import { tts } from '@/lib/tts';
import { SkillLearningFlow } from '@/components/skill-presentation';
import { getSkillPresentations } from '@/server/actions/skill-presentations';
import { SkillPresentation } from '@/types/skill-presentation';
import { ExerciseRenderer } from '@/components/exercises';
import { MicroLessonFlow } from '@/components/micro-lesson';

interface Exercise {
  id: string;
  type: string;
  content: Record<string, unknown>;
  difficulty: number;
  metadata?: Record<string, unknown>;
}

interface SessionStats {
  total: number;
  correct: number;
  startTime: Date;
}

export default function SkillExercisePage() {
  const router = useRouter();
  const params = useParams();
  const subject = params.subject as string;
  const skillCode = params.skill as string;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [stats, setStats] = useState<SessionStats>({ total: 0, correct: 0, startTime: new Date() });
  const [inputAnswer, setInputAnswer] = useState('');
  const [fillBlankAnswers, setFillBlankAnswers] = useState<string[]>([]);
  const [dragDropOrder, setDragDropOrder] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [aiEncouragement, setAiEncouragement] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [skillId, setSkillId] = useState<string | null>(null);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [exerciseStartTime, setExerciseStartTime] = useState<Date>(new Date());
  const [hintsUsedCount, setHintsUsedCount] = useState(0);
  const [progressReason, setProgressReason] = useState<string | null>(null);
  const [showTheory, setShowTheory] = useState(false);
  const [hasTheoryContent, setHasTheoryContent] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [currentSkillLevel, setCurrentSkillLevel] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'correct' | 'streak' | 'levelUp'>('correct');
  const [streakCount, setStreakCount] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [skillPresentation, setSkillPresentation] = useState<SkillPresentation | null>(null);
  const [showPresentation, setShowPresentation] = useState(false);
  const [presentationChecked, setPresentationChecked] = useState(false);
  const [showMicroLesson, setShowMicroLesson] = useState(false);
  const [domainName, setDomainName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [skillDescription, setSkillDescription] = useState('');
  const [studentAge, setStudentAge] = useState(9);
  const [studentInterests, setStudentInterests] = useState<string[]>([]);

  useEffect(() => {
    const profileId = localStorage.getItem('activeProfileId');
    if (!profileId) {
      router.push('/profiles');
      return;
    }
    
    const loadFirstExercise = async () => {
      const supabase = createClient();
      
      // D'abord récupérer l'ID de la matière
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('id')
        .eq('code', subject)
        .single();

      if (!subjectData) {
        setLoading(false);
        return;
      }

      // Récupérer les domaines de cette matière
      const { data: domainsData } = await supabase
        .from('domains')
        .select('id')
        .eq('subject_id', subjectData.id);

      const domainIds = domainsData?.map(d => d.id) || [];

      // Récupérer le skill en filtrant par les domaines de la matière
      const { data: skillData } = await supabase
        .from('skills')
        .select('id, name_key, display_name, description_key, domain_id')
        .eq('code', skillCode)
        .in('domain_id', domainIds)
        .single();

      if (!skillData) {
        setLoading(false);
        return;
      }

      setSkillId(skillData.id);
      setSkillName(skillData.display_name || skillData.name_key || skillCode);
      setSkillDescription(skillData.description_key || '');

      // Charger les infos du domaine et de la matière pour les micro-leçons V7
      try {
        const { data: domainData } = await supabase
          .from('domains')
          .select('name_key')
          .eq('id', skillData.domain_id)
          .single();
        
        if (domainData) {
          setDomainName(domainData.name_key || '');
        }
      } catch (e) {
        console.log('Domain data not available');
      }

      try {
        const { data: subjectInfo } = await supabase
          .from('subjects')
          .select('name_key')
          .eq('code', subject)
          .single();
        
        if (subjectInfo) {
          setSubjectName(subjectInfo.name_key || subject);
        }
      } catch (e) {
        setSubjectName(subject);
      }

      // Charger le profil étudiant pour les micro-leçons V7
      try {
        const { data: studentData } = await supabase
          .from('student_profiles')
          .select('birth_year')
          .eq('id', profileId)
          .single();
        
        if (studentData?.birth_year) {
          const currentYear = new Date().getFullYear();
          const calculatedAge = currentYear - studentData.birth_year;
          setStudentAge(Math.max(6, Math.min(12, calculatedAge)));
        }
      } catch (e) {
        console.log('Student age not available, using default');
      }

      // Charger la progression actuelle
      const { data: progressData } = await supabase
        .from('student_skill_progress')
        .select('skill_level, correct_count')
        .eq('student_id', profileId)
        .eq('skill_id', skillData.id)
        .limit(1);
      
      if (progressData?.[0]) {
        setCurrentSkillLevel(progressData[0].skill_level || 1);
        setCorrectCount(progressData[0].correct_count || 0);
      }

      const theoryContent = await getSkillContent(skillData.id);
      setHasTheoryContent(!!theoryContent?.content);

      // V7: Afficher les micro-leçons pour les nouveaux utilisateurs ou niveau bas
      const shouldShowMicroLesson = !progressData?.[0] || (progressData[0].skill_level || 1) <= 2;
      setShowMicroLesson(shouldShowMicroLesson);

      // Charger la présentation V4 comme fallback si disponible
      const presentations = await getSkillPresentations(skillData.id);
      if (presentations.length > 0) {
        const defaultPresentation = presentations.find(p => p.is_default) || presentations[0];
        setSkillPresentation(defaultPresentation);
        // Ne pas afficher l'ancienne présentation si on a les micro-leçons V7
        setShowPresentation(false);
      }
      setPresentationChecked(true);

      // Utiliser le système auto-alimenté
      console.log('[SkillClient] Fetching exercise for skill:', skillData.id, 'profile:', profileId);
      const result = await fetchOrGenerateExercise(skillData.id, profileId);
      console.log('[SkillClient] Exercise result:', result);
      
      if (result.success && result.exercise) {
        setExercises([result.exercise as Exercise]);
        setIsAIGenerated(result.isAIGenerated || false);
        setStats({ total: 1, correct: 0, startTime: new Date() });
        setExerciseStartTime(new Date());
      } else {
        console.error('[SkillClient] Failed to get exercise:', result.error);
      }
      setLoading(false);
    };
    
    loadFirstExercise();
  }, [router, skillCode, subject]);

  const currentExercise = exercises[currentIndex];

  // Lecture vocale de la question quand elle change (après interaction utilisateur)
  useEffect(() => {
    let cancelled = false;
    
    if (currentExercise && ttsEnabled && !showResult) {
      tts.stop();
      const timer = setTimeout(() => {
        if (!cancelled) {
          const question = currentExercise.content.question as string;
          if (question) tts.speakQuestion(question);
        }
      }, 400);
      return () => {
        cancelled = true;
        clearTimeout(timer);
        tts.stop();
      };
    }
    return () => {
      cancelled = true;
      tts.stop();
    };
  }, [currentExercise?.id, ttsEnabled, showResult]);

  // Lecture vocale du feedback
  useEffect(() => {
    if (showResult && ttsEnabled && aiEncouragement) {
      // Arrêter toute lecture en cours avant le feedback
      tts.stop();
      const timer = setTimeout(() => {
        tts.speakFeedback(aiEncouragement, isCorrect);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showResult, aiEncouragement, isCorrect, ttsEnabled]);

  const speakQuestion = () => {
    if (currentExercise) {
      const question = currentExercise.content.question as string;
      if (question) tts.speakQuestion(question);
    }
  };

  // Note: checkAnswer est maintenant géré par ExerciseRenderer via onAnswer callback
  const checkAnswer = useCallback(() => {
    // Cette fonction est conservée pour compatibilité mais n'est plus utilisée
    // Le nouveau ExerciseRenderer gère la validation directement
  }, []);

  const saveAttempt = async (_correct: boolean) => {
    // La sauvegarde est gérée par submitAnswerAndGetNext dans nextExercise
    // Cette fonction est conservée pour la compatibilité mais ne fait plus rien
  };

  const nextExercise = async () => {
    const profileId = localStorage.getItem('activeProfileId');
    if (!profileId || !skillId || !currentExercise) return;

    setLoadingNext(true);
    
    // Calculer le temps passé sur l'exercice
    const timeSpent = Math.round((new Date().getTime() - exerciseStartTime.getTime()) / 1000);
    
    // Soumettre la réponse et obtenir le prochain exercice
    const result = await submitAnswerAndGetNext(
      profileId,
      currentExercise.id,
      skillId,
      isCorrect,
      timeSpent,
      hintsUsedCount,
      { selected: selectedAnswer, input: inputAnswer }
    );

    if (result.success && result.nextExercise) {
      // Mettre à jour le compteur de bonnes réponses et le niveau
      if (isCorrect) {
        const newCorrectCount = correctCount + 1;
        setCorrectCount(newCorrectCount);
        
        // Calculer le nouveau niveau
        if (newCorrectCount >= 20) setCurrentSkillLevel(5);
        else if (newCorrectCount >= 15) setCurrentSkillLevel(4);
        else if (newCorrectCount >= 10) setCurrentSkillLevel(3);
        else if (newCorrectCount >= 6) setCurrentSkillLevel(2);
        else if (newCorrectCount >= 3) setCurrentSkillLevel(1);
      }
      
      // Ajouter le nouvel exercice
      setExercises(prev => [...prev, result.nextExercise as Exercise]);
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setInputAnswer('');
      setFillBlankAnswers([]);
      setDragDropOrder([]);
      setShowHint(false);
      setShowResult(false);
      setAiHint(null);
      setAiEncouragement(null);
      setHintLevel(0);
      setHintsUsedCount(0);
      setExerciseStartTime(new Date());
      setProgressReason(result.reason || null);
      setShowRating(false);
      setUserRating(0);
      
      // Mettre à jour le skillId si changé
      if (result.nextSkillId && result.nextSkillId !== skillId) {
        setSkillId(result.nextSkillId);
      }
      
      setStats(prev => ({ ...prev, total: prev.total + 1 }));
    } else {
      setSessionComplete(true);
    }
    
    setLoadingNext(false);
  };

  const requestAIHint = async () => {
    if (!currentExercise || loadingHint) return;
    setLoadingHint(true);
    setHintsUsedCount(prev => prev + 1);
    
    try {
      const content = currentExercise.content as Record<string, unknown>;
      const options = content.options as string[] | undefined;
      const correct = content.correct as number | undefined;
      const answer = content.answer as string | undefined;
      const items = content.items as string[] | undefined;
      const question = content.question as string || '';
      const hint = content.hint as string | undefined;
      
      const correctAnswer = currentExercise.type === 'qcm' 
        ? options?.[correct || 0] || ''
        : answer || items?.join(', ') || '';
      
      const result = await getAIHint(question, correctAnswer, hintLevel + 1);
      
      if (result.success && result.hint) {
        setAiHint(result.hint);
        setHintLevel(prev => prev + 1);
        setShowHint(true);
      } else {
        setAiHint(hint || 'Réfléchis bien à la question...');
        setShowHint(true);
      }
    } catch {
      const hint = (currentExercise.content as Record<string, unknown>).hint as string | undefined;
      setAiHint(hint || 'Réfléchis bien à la question...');
      setShowHint(true);
    }
    
    setLoadingHint(false);
  };

  const handleRating = async (rating: number) => {
    const profileId = localStorage.getItem('activeProfileId');
    if (!profileId || !currentExercise) return;
    
    setUserRating(rating);
    await rateExercise(currentExercise.id, profileId, rating, null, 'student');
  };

  const moveDragItem = (fromIndex: number, toIndex: number) => {
    const newOrder = [...dragDropOrder];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    setDragDropOrder(newOrder);
  };

  const initDragDrop = useCallback(() => {
    if (currentExercise?.type === 'drag_drop') {
      const items = (currentExercise.content as Record<string, unknown>).items as string[] | undefined;
      if (items && dragDropOrder.length === 0) {
        const shuffled = items.map((_, i) => i);
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setDragDropOrder(shuffled);
      }
    }
  }, [currentExercise, dragDropOrder.length]);

  useEffect(() => {
    initDragDrop();
  }, [initDragDrop]);

  // Calculer la progression vers le prochain niveau (déplacé ici pour être disponible dans sessionComplete)
  const levelThresholds = [0, 3, 6, 10, 15, 20];
  const nextLevelThreshold = levelThresholds[currentSkillLevel] || 20;
  const prevLevelThreshold = levelThresholds[currentSkillLevel - 1] || 0;
  const progressToNextLevel = Math.min(100, Math.round(((correctCount - prevLevelThreshold) / (nextLevelThreshold - prevLevelThreshold)) * 100));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-white to-indigo-50/30">
        <div className="text-center">
          <div className="relative mx-auto h-20 w-20">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-gray-500 font-medium">Préparation des exercices...</p>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const percentage = Math.round((stats.correct / stats.total) * 100);
    const duration = Math.round((new Date().getTime() - stats.startTime.getTime()) / 1000);
    const xpEarned = stats.correct * 10;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Carte principale */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden">
            {/* Header avec couleur selon performance */}
            <div className={`px-6 py-8 text-center ${
              percentage >= 80 
                ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
                : percentage >= 50 
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600'
            }`}>
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                {percentage >= 80 ? (
                  <Trophy className="h-10 w-10 text-white" />
                ) : percentage >= 50 ? (
                  <Star className="h-10 w-10 text-white" />
                ) : (
                  <Sparkles className="h-10 w-10 text-white" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-white">
                {percentage >= 80 ? 'Excellent !' : percentage >= 50 ? 'Bien joué !' : 'Continue !'}
              </h1>
              <p className="mt-2 text-white/80">
                {percentage >= 80 
                  ? 'Tu maîtrises cette compétence !' 
                  : percentage >= 50 
                    ? 'Tu progresses bien !'
                    : 'Chaque erreur est une leçon !'}
              </p>
            </div>

            {/* Stats */}
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-2xl bg-gray-50">
                  <p className="text-3xl font-bold text-gray-900">{percentage}%</p>
                  <p className="text-xs text-gray-500 mt-1">Précision</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-gray-50">
                  <p className="text-3xl font-bold text-gray-900">{stats.correct}/{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">Réponses</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-gray-50">
                  <p className="text-3xl font-bold text-gray-900">+{xpEarned}</p>
                  <p className="text-xs text-gray-500 mt-1">XP gagnés</p>
                </div>
              </div>

              {/* Barre de progression du niveau */}
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-indigo-700">Niveau {currentSkillLevel}</span>
                  <span className="text-xs text-indigo-600">{correctCount}/{nextLevelThreshold}</span>
                </div>
                <div className="h-3 bg-indigo-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressToNextLevel}%` }}
                  />
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <Link
                  href={`/learn/${subject}`}
                  className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors text-center"
                >
                  Retour
                </Link>
                <button
                  onClick={() => {
                    setCurrentIndex(0);
                    setSelectedAnswer(null);
                    setInputAnswer('');
                    setShowResult(false);
                    setSessionComplete(false);
                    setStats({ total: exercises.length, correct: 0, startTime: new Date() });
                    setStreakCount(0);
                  }}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 font-bold text-white hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Recommencer
                </button>
              </div>
            </div>
          </div>

          {/* Lumi encourageant */}
          <div className="mt-6 flex justify-center">
            <Lumi mood="celebrating" size="md" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 text-center">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Pas encore d'exercices</h1>
          <p className="mt-2 text-gray-500">Les exercices pour cette compétence arrivent bientôt !</p>
          <Link
            href={`/learn/${subject}`}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 font-bold text-white hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200"
          >
            <ArrowLeft className="h-5 w-5" />
            Retour
          </Link>
        </div>
      </div>
    );
  }

  const lumiMood = showResult 
    ? (isCorrect ? 'celebrating' : 'encouraging') 
    : (showHint ? 'thinking' : 'happy');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30">
      <VictoryCelebration 
        active={showCelebration} 
        type={celebrationType} 
        streakCount={streakCount}
        xpGained={isCorrect ? 10 : 0}
        onComplete={() => setShowCelebration(false)}
      />
      
      {/* Header moderne style Duolingo */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Bouton retour */}
            <Link 
              href={`/learn/${subject}`} 
              className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <XCircle className="h-5 w-5 text-gray-500" />
            </Link>
            
            {/* Barre de progression principale */}
            <div className="flex-1 mx-4">
              <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentIndex + (showResult ? 1 : 0)) / exercises.length) * 100}%` }}
                />
                {/* Indicateurs de progression */}
                <div className="absolute inset-0 flex items-center justify-between px-1">
                  {exercises.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`h-2 w-2 rounded-full transition-all ${
                        idx < currentIndex ? 'bg-white/80' : 
                        idx === currentIndex ? 'bg-white scale-125 shadow-sm' : 
                        'bg-gray-300/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Streak et XP */}
            <div className="flex items-center gap-3">
              {streakCount > 0 && (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-100 text-orange-600">
                  <span className="text-lg">🔥</span>
                  <span className="font-bold text-sm">{streakCount}</span>
                </div>
              )}
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                  ttsEnabled 
                    ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* V7 Micro-Lesson Flow */}
        {showMicroLesson && skillId && (
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden">
            <MicroLessonFlow
              skillId={skillId}
              skillName={skillName}
              skillDescription={skillDescription}
              domainName={domainName}
              subjectName={subjectName}
              subjectCode={subject}
              difficulty={currentSkillLevel}
              studentAge={studentAge}
              studentInterests={studentInterests}
              onComplete={(score) => {
                setShowMicroLesson(false);
                if (score >= 70) {
                  playSound('complete');
                }
              }}
              onSkip={() => setShowMicroLesson(false)}
            />
          </div>
        )}

        {/* V4 Skill Presentation (fallback) */}
        {!showMicroLesson && showPresentation && skillPresentation && skillId && (
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden">
            <SkillLearningFlow
              skillId={skillId}
              skillName={skillName}
              presentation={skillPresentation}
              onStartExercises={() => setShowPresentation(false)}
              onPresentationComplete={() => {}}
            />
          </div>
        )}

        {/* Exercises Section */}
        {!showMicroLesson && !showPresentation && (
          <div className="space-y-6">
            {/* Carte d'exercice principale */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden">
              {/* Header de la carte avec info skill */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="font-bold text-gray-900">{skillName || 'Exercice'}</h1>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <Star
                              key={level}
                              className={`h-4 w-4 ${
                                level <= currentSkillLevel
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">Niveau {currentSkillLevel}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1">
                    {isAIGenerated && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                        <Wand2 className="h-3 w-3" />
                        IA
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      Question {currentIndex + 1}/{exercises.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contenu de l'exercice */}
              <div className="p-6">
                {/* Boutons d'accès rapide */}
                <div className="flex items-center gap-3 mb-4">
                  {skillId && (
                    <button
                      onClick={() => setShowMicroLesson(true)}
                      className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
                    >
                      <Sparkles className="h-3 w-3" />
                      Micro-leçon V7
                    </button>
                  )}
                  {skillId && hasTheoryContent && (
                    <button
                      onClick={() => setShowTheory(!showTheory)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                      <BookOpen className="h-3 w-3" />
                      {showTheory ? 'Masquer la théorie' : 'Revoir la théorie'}
                    </button>
                  )}
                </div>

                {showTheory && skillId && (
                  <div className="mb-6 p-4 bg-indigo-50 rounded-2xl">
                    <SkillTheory skillId={skillId} skillName={skillName} />
                  </div>
                )}

                {/* Exercice V4 */}
                <ExerciseRenderer
                  key={`exercise-${currentExercise.id}-${currentIndex}`}
                  exercise={currentExercise}
                  onAnswer={(correct, answer) => {
                    setIsCorrect(correct);
                    setShowResult(true);
                    
                    if (correct) {
                      playSound('correct');
                      const newStreak = streakCount + 1;
                      setStreakCount(newStreak);
                      setStats(prev => ({ ...prev, correct: prev.correct + 1 }));
                      setCorrectCount(prev => prev + 1);
                      
                      const profileId = localStorage.getItem('activeProfileId');
                      if (profileId) {
                        updateDailyStreak(profileId).catch(console.error);
                        const xpAmount = 10 + (newStreak >= 3 ? 5 : 0);
                        addXp(profileId, xpAmount, 'exercise_correct').catch(console.error);
                      }
                      
                      if (newStreak >= 5 && newStreak % 5 === 0) {
                        setCelebrationType('streak');
                        setShowCelebration(true);
                        playSound('streak');
                        setTimeout(() => setShowCelebration(false), 2500);
                      } else {
                        setCelebrationType('correct');
                        setShowCelebration(true);
                        setTimeout(() => setShowCelebration(false), 1500);
                      }
                      
                      getEncouragement(newStreak >= 3 ? 'streak' : 'correct', newStreak)
                        .then(msg => setAiEncouragement(msg))
                        .catch(() => setAiEncouragement('Bravo ! 🎉'));
                    } else {
                      playSound('incorrect');
                      setStreakCount(0);
                      getEncouragement('incorrect')
                        .then(msg => setAiEncouragement(msg))
                        .catch(() => setAiEncouragement('Continue, tu vas y arriver ! 💪'));
                    }
                  }}
                  disabled={showResult}
                />
              </div>
            </div>

            {/* Carte d'aide IA */}
            {!showResult && (
              <div className="flex justify-center">
                <button
                  onClick={requestAIHint}
                  disabled={loadingHint}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
                >
                  {loadingHint ? (
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                  ) : (
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-sm font-medium">
                    {loadingHint ? 'Réflexion...' : 'Demander un indice'}
                  </span>
                </button>
              </div>
            )}

            {/* Indice IA */}
            {showHint && aiHint && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-1">
                      Indice niveau {hintLevel}
                    </p>
                    <p className="text-gray-700">{aiHint}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback après réponse */}
            {showResult && (
              <div className="space-y-4">
                {/* Message IA */}
                {aiEncouragement && (
                  <div className={`rounded-2xl p-5 ${
                    isCorrect 
                      ? 'bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200' 
                      : 'bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isCorrect 
                          ? 'bg-gradient-to-br from-emerald-400 to-green-500' 
                          : 'bg-gradient-to-br from-rose-400 to-red-500'
                      }`}>
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-white" />
                        ) : (
                          <MessageCircle className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold mb-1 ${
                          isCorrect ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {isCorrect ? 'Excellent !' : 'Pas de souci !'}
                        </p>
                        <p className="text-gray-700">{aiEncouragement}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bouton suivant */}
                <button
                  onClick={nextExercise}
                  disabled={loadingNext}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${
                    isCorrect
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-emerald-200'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-200'
                  } disabled:opacity-50`}
                >
                  {loadingNext ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Chargement...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Continuer
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </button>

                {/* Rating discret */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  <span className="text-xs text-gray-400">Cet exercice :</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRating(star)}
                        className="p-0.5 transition-transform hover:scale-125"
                      >
                        <Star
                          className={`h-5 w-5 transition-colors ${
                            star <= userRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-200 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Lumi flottant */}
      <div className="fixed bottom-6 right-6 z-50">
        <Lumi 
          mood={lumiMood} 
          size="sm" 
          message={undefined}
          showMessage={false}
        />
      </div>
    </div>
  );
}
