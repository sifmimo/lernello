'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicroLesson } from '@/types/micro-lesson';
import { MicroLessonCard } from './MicroLessonCard';
import { CelebrationOverlay, useCelebration } from './CelebrationOverlay';
import { getSubjectColor } from '@/lib/design-system/subject-themes';
import { generateMicroLesson, getMicroLessonsForSkill } from '@/server/actions/micro-lessons';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';

interface MicroLessonFlowProps {
  skillId: string;
  skillName: string;
  skillDescription?: string;
  domainName: string;
  subjectName: string;
  subjectCode: string;
  difficulty: number;
  studentAge: number;
  studentLearningStyle?: string;
  studentInterests?: string[];
  onComplete: (score: number) => void;
  onSkip?: () => void;
}

export function MicroLessonFlow({
  skillId,
  skillName,
  skillDescription,
  domainName,
  subjectName,
  subjectCode,
  difficulty,
  studentAge,
  studentLearningStyle,
  studentInterests,
  onComplete,
  onSkip,
}: MicroLessonFlowProps) {
  const [microLesson, setMicroLesson] = useState<MicroLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qualityScore, setQualityScore] = useState<number | null>(null);

  const { celebration, celebrate, CelebrationComponent } = useCelebration();
  const subjectColor = getSubjectColor(subjectCode);

  useEffect(() => {
    loadOrGenerateMicroLesson();
  }, [skillId]);

  const loadOrGenerateMicroLesson = async () => {
    setLoading(true);
    setError(null);

    try {
      const existingLessons = await getMicroLessonsForSkill(skillId);
      
      if (existingLessons.length > 0) {
        const bestLesson = existingLessons
          .filter(l => l.quality_score >= 60)
          .sort((a, b) => b.quality_score - a.quality_score)[0];
        
        if (bestLesson) {
          setMicroLesson(bestLesson);
          setQualityScore(bestLesson.quality_score);
          setLoading(false);
          return;
        }
      }

      await generateNewMicroLesson();
    } catch (err) {
      console.error('Error loading micro-lesson:', err);
      setError('Impossible de charger la micro-leçon');
      setLoading(false);
    }
  };

  const generateNewMicroLesson = async () => {
    setGenerating(true);
    setError(null);

    try {
      const result = await generateMicroLesson({
        skill_id: skillId,
        skill_name: skillName,
        skill_description: skillDescription,
        domain_name: domainName,
        subject_name: subjectName,
        subject_code: subjectCode,
        difficulty,
        student_age: studentAge,
        student_learning_style: studentLearningStyle,
        student_interests: studentInterests,
      });

      if (result.lesson) {
        setMicroLesson(result.lesson);
        setQualityScore(result.quality.total_score);
      } else {
        setError(result.error || 'Échec de la génération');
      }
    } catch (err) {
      console.error('Error generating micro-lesson:', err);
      setError('Erreur lors de la génération');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleComplete = (score: number) => {
    if (score >= 80) {
      celebrate('lesson_complete', 'Micro-leçon terminée ! 🎉');
    } else if (score >= 50) {
      celebrate('streak_3', 'Bien joué ! Continue comme ça 💪');
    }

    setTimeout(() => {
      onComplete(score);
    }, 2000);
  };

  const handleStepChange = (step: string, index: number) => {
    if (index > 0 && index % 2 === 0) {
      celebrate('correct_answer');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="h-12 w-12 text-indigo-600" />
        </motion.div>
        <p className="mt-4 text-gray-600">
          {generating ? 'Génération de ta micro-leçon personnalisée...' : 'Chargement...'}
        </p>
        {generating && (
          <p className="mt-2 text-sm text-gray-500">
            Cela peut prendre quelques secondes ✨
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <div className="text-5xl mb-4">😕</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Oups !</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={generateNewMicroLesson}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all hover:shadow-lg disabled:opacity-50"
            style={{ backgroundColor: subjectColor }}
          >
            {generating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
            Réessayer
          </button>
          {onSkip && (
            <button
              onClick={onSkip}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
            >
              Passer aux exercices
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!microLesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <Sparkles className="h-12 w-12 text-indigo-600 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Prêt à apprendre ?</h3>
        <p className="text-gray-600 mb-6">
          Génère une micro-leçon personnalisée pour {skillName}
        </p>
        <button
          onClick={generateNewMicroLesson}
          disabled={generating}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all hover:shadow-lg disabled:opacity-50"
          style={{ backgroundColor: subjectColor }}
        >
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Générer ma micro-leçon
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {qualityScore !== null && qualityScore < 75 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between"
        >
          <p className="text-sm text-amber-700">
            Cette leçon est en cours d'amélioration (score: {qualityScore}/100)
          </p>
          <button
            onClick={generateNewMicroLesson}
            disabled={generating}
            className="text-sm text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
            Régénérer
          </button>
        </motion.div>
      )}

      <MicroLessonCard
        lesson={microLesson}
        subjectColor={subjectColor}
        onComplete={handleComplete}
        onStepChange={handleStepChange}
        onClose={onSkip}
      />

      {CelebrationComponent}
    </div>
  );
}
