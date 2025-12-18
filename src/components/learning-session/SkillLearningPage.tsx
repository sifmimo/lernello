'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Dumbbell, RotateCcw, Star, Clock, ChevronLeft, Loader2 } from 'lucide-react';
import { LearningSession, SessionType, SessionRecap } from '@/types/learning-session';
import { createLearningSession, getActiveSession } from '@/server/actions/learning-sessions';
import { LearningSessionFlow } from './LearningSessionFlow';
import { createClient } from '@/lib/supabase/client';

interface SkillLearningPageProps {
  skillId: string;
  skillCode: string;
  subjectCode: string;
}

interface SkillInfo {
  id: string;
  name: string;
  description: string;
  level: number;
  mastery: number;
  exercisesCompleted: number;
}

export function SkillLearningPage({ skillId, skillCode, subjectCode }: SkillLearningPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [skillInfo, setSkillInfo] = useState<SkillInfo | null>(null);
  const [activeSession, setActiveSession] = useState<LearningSession | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSkillInfo();
  }, [skillId]);

  const loadSkillInfo = async () => {
    setLoading(true);
    const supabase = createClient();
    const profileId = localStorage.getItem('activeProfileId');

    if (!profileId) {
      router.push('/profiles');
      return;
    }

    const { data: skill } = await supabase
      .from('skills')
      .select('id, name_key, display_name, description_key')
      .eq('id', skillId)
      .single();

    if (!skill) {
      setError('Compétence non trouvée');
      setLoading(false);
      return;
    }

    // Charger la traduction du nom
    let skillName = skill.display_name || skill.name_key;
    if (skill.name_key) {
      const { data: translation } = await supabase
        .from('content_translations')
        .select('value')
        .eq('key', skill.name_key)
        .eq('language', 'fr')
        .single();
      if (translation?.value) {
        skillName = translation.value;
      }
    }

    const { data: progress } = await supabase
      .from('student_skill_progress')
      .select('skill_level, mastery_level, attempts_count')
      .eq('student_id', profileId)
      .eq('skill_id', skillId)
      .single();

    setSkillInfo({
      id: skill.id,
      name: skillName,
      description: skill.description_key || '',
      level: progress?.skill_level || 1,
      mastery: progress?.mastery_level || 0,
      exercisesCompleted: progress?.attempts_count || 0,
    });

    const existingSession = await getActiveSession(profileId, skillId);
    if (existingSession) {
      setActiveSession(existingSession);
    }

    setLoading(false);
  };

  const startSession = async (type: SessionType, minutes: number = 5) => {
    setCreatingSession(true);
    setError(null);

    const profileId = localStorage.getItem('activeProfileId');
    if (!profileId) {
      router.push('/profiles');
      return;
    }

    const result = await createLearningSession({
      studentId: profileId,
      skillId,
      sessionType: type,
      targetMinutes: minutes,
    });

    if (result.error) {
      setError(result.error);
      setCreatingSession(false);
      return;
    }

    if (result.session) {
      setActiveSession(result.session);
    }

    setCreatingSession(false);
  };

  const handleSessionComplete = (recap: SessionRecap) => {
    setActiveSession(null);
    loadSkillInfo();
  };

  const handleContinueMore = () => {
    setActiveSession(null);
    startSession('practice', 5);
  };

  const handleSessionExit = () => {
    setActiveSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/30 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (activeSession && skillInfo) {
    return (
      <LearningSessionFlow
        session={activeSession}
        skillName={skillInfo.name}
        onComplete={handleSessionComplete}
        onExit={handleSessionExit}
        onContinueMore={handleContinueMore}
      />
    );
  }

  if (!skillInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">{error || 'Compétence non trouvée'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push(`/learn/${subjectCode}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Retour
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 text-white">
            <h1 className="text-2xl font-bold">{skillInfo.name}</h1>
            {skillInfo.description && (
              <p className="mt-2 opacity-90">{skillInfo.description}</p>
            )}

            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <Star
                    key={level}
                    className={`h-5 w-5 ${
                      level <= skillInfo.level
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-white/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm opacity-75">Niveau {skillInfo.level}</span>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Maîtrise</span>
                <span>{skillInfo.mastery}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${skillInfo.mastery}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="p-4 bg-red-50 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={() => startSession('learn', 5)}
              disabled={creatingSession}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center gap-4 hover:shadow-lg transition-all disabled:opacity-50"
            >
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-lg">Apprendre</p>
                <p className="text-sm opacity-90">Théorie + exercices guidés</p>
              </div>
              <div className="flex items-center gap-1 text-sm opacity-75">
                <Clock className="h-4 w-4" />
                ~5 min
              </div>
            </button>

            <button
              onClick={() => startSession('practice', 5)}
              disabled={creatingSession}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center gap-4 hover:shadow-lg transition-all disabled:opacity-50"
            >
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Dumbbell className="h-6 w-6" />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-lg">S'entraîner</p>
                <p className="text-sm opacity-90">Exercices de pratique</p>
              </div>
              <div className="flex items-center gap-1 text-sm opacity-75">
                <Clock className="h-4 w-4" />
                ~5 min
              </div>
            </button>

            <button
              onClick={() => startSession('review', 3)}
              disabled={creatingSession}
              className="w-full p-4 rounded-2xl border-2 border-gray-200 text-gray-700 flex items-center gap-4 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <RotateCcw className="h-6 w-6 text-gray-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-lg">Réviser</p>
                <p className="text-sm text-gray-500">Renforce tes acquis</p>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                ~3 min
              </div>
            </button>

            {creatingSession && (
              <div className="flex items-center justify-center gap-2 py-4 text-indigo-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Préparation de ta session...</span>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center">
              {skillInfo.exercisesCompleted} exercices complétés
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
