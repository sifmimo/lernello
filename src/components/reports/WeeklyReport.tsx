'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  TrendingUp, 
  Clock, 
  Target, 
  Star, 
  AlertCircle,
  ChevronRight,
  Download
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface WeeklyReportProps {
  studentId: string;
  studentName: string;
}

interface ReportData {
  weekStart: string;
  weekEnd: string;
  totalTimeMinutes: number;
  exercisesCompleted: number;
  correctAnswers: number;
  skillsPracticed: number;
  skillsMastered: number;
  streakDays: number;
  xpEarned: number;
  highlights: string[];
  areasToImprove: string[];
  suggestions: string[];
}

export default function WeeklyReport({ studentId, studentName }: WeeklyReportProps) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateReport();
  }, [studentId]);

  const generateReport = async () => {
    const supabase = createClient();
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    // Fetch exercise attempts
    const { data: attempts } = await supabase
      .from('exercise_attempts')
      .select('is_correct, skill_id, time_spent_seconds')
      .eq('student_id', studentId)
      .gte('created_at', weekStart.toISOString());

    // Fetch skill progress
    const { data: progress } = await supabase
      .from('student_skill_progress')
      .select('skill_id, mastery_level, current_streak')
      .eq('student_id', studentId);

    // Fetch XP
    const { data: xpData } = await supabase
      .from('student_xp')
      .select('xp_earned_today, total_xp')
      .eq('student_id', studentId)
      .single();

    // Fetch streak
    const { data: streakData } = await supabase
      .from('daily_streaks')
      .select('current_streak')
      .eq('student_id', studentId)
      .single();

    const totalExercises = attempts?.length || 0;
    const correctAnswers = attempts?.filter(a => a.is_correct).length || 0;
    const accuracy = totalExercises > 0 ? Math.round((correctAnswers / totalExercises) * 100) : 0;
    const totalTime = attempts?.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0) || 0;
    const uniqueSkills = new Set(attempts?.map(a => a.skill_id) || []).size;
    const masteredSkills = progress?.filter(p => p.mastery_level >= 80).length || 0;

    // Generate highlights
    const highlights: string[] = [];
    if (totalExercises >= 20) highlights.push(`🎯 ${totalExercises} exercices complétés !`);
    if (accuracy >= 80) highlights.push(`⭐ ${accuracy}% de réussite`);
    if (streakData?.current_streak && streakData.current_streak >= 3) highlights.push(`🔥 Série de ${streakData.current_streak} jours`);
    if (masteredSkills > 0) highlights.push(`🏆 ${masteredSkills} compétences maîtrisées`);

    // Generate areas to improve
    const areasToImprove: string[] = [];
    const strugglingSkills = progress?.filter(p => p.mastery_level < 50) || [];
    if (strugglingSkills.length > 0) {
      areasToImprove.push(`${strugglingSkills.length} compétence(s) nécessitent plus de pratique`);
    }
    if (accuracy < 60 && totalExercises > 5) {
      areasToImprove.push('Le taux de réussite peut être amélioré');
    }

    // Generate suggestions
    const suggestions: string[] = [];
    if (totalExercises < 10) {
      suggestions.push('Encouragez des sessions quotidiennes de 10-15 minutes');
    }
    if (streakData?.current_streak === 0) {
      suggestions.push('Aidez à établir une routine d\'apprentissage régulière');
    }
    if (strugglingSkills.length > 0) {
      suggestions.push('Revoyez ensemble les concepts difficiles');
    }

    setReport({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: now.toISOString().split('T')[0],
      totalTimeMinutes: Math.round(totalTime / 60),
      exercisesCompleted: totalExercises,
      correctAnswers,
      skillsPracticed: uniqueSkills,
      skillsMastered: masteredSkills,
      streakDays: streakData?.current_streak || 0,
      xpEarned: xpData?.xp_earned_today || 0,
      highlights,
      areasToImprove,
      suggestions,
    });
    setLoading(false);
  };

  if (loading) {
    return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;
  }

  if (!report) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Impossible de générer le rapport</p>
      </div>
    );
  }

  const accuracy = report.exercisesCompleted > 0 
    ? Math.round((report.correctAnswers / report.exercisesCompleted) * 100) 
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Rapport hebdomadaire
            </h2>
            <p className="text-emerald-100 mt-1">
              {studentName} • Semaine du {new Date(report.weekStart).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl font-medium transition-colors">
            <Download className="h-5 w-5" />
            Exporter
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Target}
            label="Exercices"
            value={report.exercisesCompleted}
            color="indigo"
          />
          <StatCard
            icon={Star}
            label="Réussite"
            value={`${accuracy}%`}
            color="amber"
          />
          <StatCard
            icon={Clock}
            label="Temps"
            value={`${report.totalTimeMinutes}min`}
            color="emerald"
          />
          <StatCard
            icon={TrendingUp}
            label="XP gagnés"
            value={report.xpEarned}
            color="purple"
          />
        </div>

        {report.highlights.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Points forts cette semaine
            </h3>
            <div className="bg-amber-50 rounded-xl p-4">
              <ul className="space-y-2">
                {report.highlights.map((highlight, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-2 text-amber-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                    {highlight}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {report.areasToImprove.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Points d&apos;attention
            </h3>
            <div className="bg-orange-50 rounded-xl p-4">
              <ul className="space-y-2">
                {report.areasToImprove.map((area, i) => (
                  <li key={i} className="flex items-center gap-2 text-orange-800">
                    <ChevronRight className="h-4 w-4" />
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {report.suggestions.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Conseils pour la semaine prochaine
            </h3>
            <div className="bg-emerald-50 rounded-xl p-4">
              <ul className="space-y-2">
                {report.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-center gap-2 text-emerald-800">
                    <ChevronRight className="h-4 w-4" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-600',
    amber: 'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-2`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
