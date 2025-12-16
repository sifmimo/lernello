'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  FolderPlus, 
  BookOpen, 
  Globe, 
  Lock, 
  Star, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { 
  createUserModule, 
  createUserSkill, 
  getUserModules, 
  getUserSkills,
  toggleModulePublic,
  toggleSkillPublic 
} from '@/server/actions/user-content';
import { getUserPlan } from '@/server/actions/skill-content';
import type { UserModule, UserSkill, UserPlan } from '@/types/v2';

interface Subject {
  id: string;
  code: string;
  name_key: string;
}

interface Domain {
  id: string;
  code: string;
  name_key: string;
  subject_id: string;
}

export default function CreateContentPage() {
  const _router = useRouter();
  const [activeTab, setActiveTab] = useState<'modules' | 'skills'>('modules');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [userModules, setUserModules] = useState<UserModule[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newModule, setNewModule] = useState({
    subjectId: '',
    code: '',
    name: '',
    description: '',
  });

  const [newSkill, setNewSkill] = useState({
    moduleId: '',
    moduleType: 'official' as 'official' | 'user',
    code: '',
    name: '',
    description: '',
    difficultyLevel: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    const [subjectsResult, domainsResult, modulesResult, skillsResult, planResult] = await Promise.all([
      supabase.from('subjects').select('*').order('sort_order'),
      supabase.from('domains').select('*').order('sort_order'),
      getUserModules(),
      getUserSkills(),
      getUserPlan(),
    ]);

    setSubjects(subjectsResult.data || []);
    setDomains(domainsResult.data || []);
    setUserModules(modulesResult);
    setUserSkills(skillsResult);
    setUserPlan(planResult as UserPlan | null);
    setLoading(false);
  };

  const handleCreateModule = async () => {
    if (!newModule.subjectId || !newModule.code || !newModule.name) {
      setError('Tous les champs obligatoires doivent être remplis');
      return;
    }

    setCreating(true);
    setError(null);

    const result = await createUserModule(
      newModule.subjectId,
      newModule.code,
      newModule.name,
      newModule.description
    );

    if (result.success) {
      setSuccess('Module créé avec succès !');
      setNewModule({ subjectId: '', code: '', name: '', description: '' });
      setShowCreateModal(false);
      await loadData();
    } else {
      setError(result.error || 'Erreur lors de la création');
    }

    setCreating(false);
  };

  const handleCreateSkill = async () => {
    if (!newSkill.moduleId || !newSkill.code || !newSkill.name) {
      setError('Tous les champs obligatoires doivent être remplis');
      return;
    }

    setCreating(true);
    setError(null);

    const result = await createUserSkill(
      newSkill.moduleId,
      newSkill.moduleType,
      newSkill.code,
      newSkill.name,
      newSkill.description,
      newSkill.difficultyLevel
    );

    if (result.success) {
      setSuccess('Compétence créée avec succès !');
      setNewSkill({
        moduleId: '',
        moduleType: 'official',
        code: '',
        name: '',
        description: '',
        difficultyLevel: 1,
      });
      setShowCreateModal(false);
      await loadData();
    } else {
      setError(result.error || 'Erreur lors de la création');
    }

    setCreating(false);
  };

  const handleTogglePublic = async (type: 'module' | 'skill', id: string) => {
    if (type === 'module') {
      const result = await toggleModulePublic(id);
      if (result.success) {
        await loadData();
      }
    } else {
      const result = await toggleSkillPublic(id);
      if (result.success) {
        await loadData();
      }
    }
  };

  const planLimits = userPlan?.limits as { modules_per_month: number; skills_per_month: number } | undefined;
  const planUsage = userPlan?.current_usage as { modules: number; skills: number } | undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/learn"
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Créer du contenu</h1>
              <p className="text-gray-500 text-sm">Modules et compétences personnalisés</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            <Plus className="w-5 h-5" />
            Créer
          </button>
        </div>

        {/* Plan info */}
        {userPlan && (
          <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  userPlan.plan_type === 'premium' 
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                    : 'bg-gray-100'
                }`}>
                  <Star className={`w-5 h-5 ${userPlan.plan_type === 'premium' ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Plan {userPlan.plan_type === 'premium' ? 'Premium' : 'Gratuit'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {planUsage?.modules || 0}/{planLimits?.modules_per_month || 3} modules • 
                    {planUsage?.skills || 0}/{planLimits?.skills_per_month || 10} compétences ce mois
                  </p>
                </div>
              </div>
              {userPlan.plan_type === 'free' && (
                <button className="text-sm text-blue-500 font-medium hover:text-blue-600">
                  Passer en Premium
                </button>
              )}
            </div>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-600">×</button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-600">×</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'modules'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FolderPlus className="w-4 h-4 inline mr-2" />
            Mes modules ({userModules.length})
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'skills'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Mes compétences ({userSkills.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'modules' && (
          <div className="space-y-3">
            {userModules.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <FolderPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun module créé</h3>
                <p className="text-gray-500 mb-4">Créez votre premier module personnalisé</p>
                <button
                  onClick={() => { setActiveTab('modules'); setShowCreateModal(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  Créer un module
                </button>
              </div>
            ) : (
              userModules.map(module => (
                <div key={module.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FolderPlus className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{module.name}</h3>
                        <p className="text-sm text-gray-500">{module.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {module.rating_count > 0 && (
                        <div className="flex items-center gap-1 text-sm text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                          {module.rating_average.toFixed(1)}
                        </div>
                      )}
                      <button
                        onClick={() => handleTogglePublic('module', module.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          module.is_public 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        title={module.is_public ? 'Public' : 'Privé'}
                      >
                        {module.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {module.description && (
                    <p className="text-sm text-gray-500 mt-2">{module.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-3">
            {userSkills.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune compétence créée</h3>
                <p className="text-gray-500 mb-4">Créez votre première compétence personnalisée</p>
                <button
                  onClick={() => { setActiveTab('skills'); setShowCreateModal(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  Créer une compétence
                </button>
              </div>
            ) : (
              userSkills.map(skill => (
                <div key={skill.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{skill.name}</h3>
                        <p className="text-sm text-gray-500">
                          {skill.code} • Niveau {skill.difficulty_level}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {skill.rating_count > 0 && (
                        <div className="flex items-center gap-1 text-sm text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                          {skill.rating_average.toFixed(1)}
                        </div>
                      )}
                      <button
                        onClick={() => handleTogglePublic('skill', skill.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          skill.is_public 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        title={skill.is_public ? 'Public' : 'Privé'}
                      >
                        {skill.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {skill.description && (
                    <p className="text-sm text-gray-500 mt-2">{skill.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {activeTab === 'modules' ? 'Créer un module' : 'Créer une compétence'}
              </h2>

              {activeTab === 'modules' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matière *
                    </label>
                    <select
                      value={newModule.subjectId}
                      onChange={(e) => setNewModule({ ...newModule, subjectId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner une matière</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.code}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code *
                    </label>
                    <input
                      type="text"
                      value={newModule.code}
                      onChange={(e) => setNewModule({ ...newModule, code: e.target.value })}
                      placeholder="ex: fractions_avancees"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={newModule.name}
                      onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                      placeholder="ex: Fractions avancées"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newModule.description}
                      onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                      placeholder="Description du module..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de module
                    </label>
                    <select
                      value={newSkill.moduleType}
                      onChange={(e) => setNewSkill({ 
                        ...newSkill, 
                        moduleType: e.target.value as 'official' | 'user',
                        moduleId: ''
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="official">Module officiel</option>
                      <option value="user">Mon module</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Module *
                    </label>
                    <select
                      value={newSkill.moduleId}
                      onChange={(e) => setNewSkill({ ...newSkill, moduleId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner un module</option>
                      {newSkill.moduleType === 'official'
                        ? domains.map(d => (
                            <option key={d.id} value={d.id}>{d.code}</option>
                          ))
                        : userModules.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))
                      }
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code *
                    </label>
                    <input
                      type="text"
                      value={newSkill.code}
                      onChange={(e) => setNewSkill({ ...newSkill, code: e.target.value })}
                      placeholder="ex: addition_fractions"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                      placeholder="ex: Additionner des fractions"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Niveau de difficulté
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newSkill.difficultyLevel}
                      onChange={(e) => setNewSkill({ ...newSkill, difficultyLevel: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-center text-sm text-gray-500">
                      Niveau {newSkill.difficultyLevel}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newSkill.description}
                      onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                      placeholder="Description de la compétence..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Le contenu sera validé par l&apos;IA
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={activeTab === 'modules' ? handleCreateModule : handleCreateSkill}
                  disabled={creating}
                  className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    'Créer'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
