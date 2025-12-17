'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, Plus, Clock, CheckCircle, X } from 'lucide-react';
import { 
  getFamilyChallenges, 
  createFamilyChallenge, 
  FamilyChallenge 
} from '@/server/actions/family';

const CHALLENGE_TEMPLATES = [
  {
    type: 'weekly_exercises',
    title: 'Champion de la semaine',
    description: 'Complète {target} exercices cette semaine',
    defaultTarget: 20,
    icon: '🏆',
  },
  {
    type: 'streak_goal',
    title: 'Série gagnante',
    description: 'Maintiens une série de {target} jours',
    defaultTarget: 7,
    icon: '🔥',
  },
  {
    type: 'skill_mastery',
    title: 'Maître des compétences',
    description: 'Maîtrise {target} nouvelles compétences',
    defaultTarget: 3,
    icon: '⭐',
  },
  {
    type: 'accuracy_goal',
    title: 'Précision parfaite',
    description: 'Obtiens {target}% de bonnes réponses sur 10 exercices',
    defaultTarget: 80,
    icon: '🎯',
  },
  {
    type: 'time_goal',
    title: 'Temps d\'apprentissage',
    description: 'Apprends pendant {target} minutes cette semaine',
    defaultTarget: 60,
    icon: '⏱️',
  },
];

interface FamilyChallengesProps {
  parentUserId: string;
  studentId: string;
  studentName: string;
}

export default function FamilyChallenges({ 
  parentUserId, 
  studentId, 
  studentName 
}: FamilyChallengesProps) {
  const [challenges, setChallenges] = useState<FamilyChallenge[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof CHALLENGE_TEMPLATES[0] | null>(null);
  const [customTarget, setCustomTarget] = useState(10);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadChallenges();
  }, [studentId]);

  const loadChallenges = async () => {
    const data = await getFamilyChallenges(studentId);
    setChallenges(data);
    setLoading(false);
  };

  const handleCreateChallenge = async () => {
    if (!selectedTemplate) return;
    
    setCreating(true);
    const description = selectedTemplate.description.replace('{target}', String(customTarget));
    
    await createFamilyChallenge(
      parentUserId,
      studentId,
      selectedTemplate.type,
      selectedTemplate.title,
      description,
      customTarget,
      7
    );

    await loadChallenges();
    setShowCreateModal(false);
    setSelectedTemplate(null);
    setCreating(false);
  };

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />;
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                Défis Famille
              </h2>
              <p className="text-indigo-100 mt-1">
                Motivez {studentName} avec des défis personnalisés
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl font-medium transition-colors"
            >
              <Plus className="h-5 w-5" />
              Nouveau défi
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeChallenges.length === 0 && completedChallenges.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun défi en cours</p>
              <p className="text-sm text-gray-400 mt-1">
                Créez un défi pour motiver {studentName} !
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeChallenges.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    Défis en cours
                  </h3>
                  <div className="space-y-3">
                    {activeChallenges.map(challenge => (
                      <ChallengeCard key={challenge.id} challenge={challenge} />
                    ))}
                  </div>
                </div>
              )}

              {completedChallenges.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Défis complétés
                  </h3>
                  <div className="space-y-3">
                    {completedChallenges.slice(0, 3).map(challenge => (
                      <ChallengeCard key={challenge.id} challenge={challenge} completed />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Créer un défi</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Choisissez un type de défi pour {studentName}
                </p>

                <div className="space-y-3 mb-6">
                  {CHALLENGE_TEMPLATES.map(template => (
                    <button
                      key={template.type}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setCustomTarget(template.defaultTarget);
                      }}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selectedTemplate?.type === template.type
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{template.title}</p>
                          <p className="text-sm text-gray-500">
                            {template.description.replace('{target}', String(template.defaultTarget))}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedTemplate && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Objectif personnalisé
                    </label>
                    <input
                      type="number"
                      value={customTarget}
                      onChange={e => setCustomTarget(Number(e.target.value))}
                      min={1}
                      max={100}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      {selectedTemplate.description.replace('{target}', String(customTarget))}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleCreateChallenge}
                  disabled={!selectedTemplate || creating}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {creating ? 'Création...' : 'Créer le défi'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ChallengeCard({ 
  challenge, 
  completed = false 
}: { 
  challenge: FamilyChallenge; 
  completed?: boolean;
}) {
  const progress = Math.min(100, Math.round((challenge.currentValue / challenge.targetValue) * 100));
  const template = CHALLENGE_TEMPLATES.find((t: typeof CHALLENGE_TEMPLATES[0]) => t.type === challenge.challengeType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border ${
        completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{template?.icon || '🎯'}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">{challenge.title}</h4>
            {completed && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Complété !
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{challenge.description}</p>
          
          {!completed && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Progression</span>
                <span className="font-medium text-indigo-600">
                  {challenge.currentValue} / {challenge.targetValue}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
