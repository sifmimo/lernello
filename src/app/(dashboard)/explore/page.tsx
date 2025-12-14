'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  FolderPlus, 
  BookOpen, 
  Star, 
  User,
  Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getPublicModules, getPublicSkills, rateContent } from '@/server/actions/user-content';
import type { UserModule, UserSkill } from '@/types/v2';

interface Subject {
  id: string;
  code: string;
  name_key: string;
}

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<'modules' | 'skills'>('modules');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [publicModules, setPublicModules] = useState<UserModule[]>([]);
  const [publicSkills, setPublicSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [ratingModal, setRatingModal] = useState<{ type: 'module' | 'skill'; id: string } | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject]);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    const [subjectsResult, modulesResult, skillsResult] = await Promise.all([
      supabase.from('subjects').select('*').order('sort_order'),
      getPublicModules(selectedSubject || undefined),
      getPublicSkills(),
    ]);

    setSubjects(subjectsResult.data || []);
    setPublicModules(modulesResult);
    setPublicSkills(skillsResult);
    setLoading(false);
  };

  const handleSubmitRating = async () => {
    if (!ratingModal || userRating === 0) return;

    setSubmittingRating(true);
    await rateContent(
      ratingModal.type,
      ratingModal.id,
      userRating,
      ratingComment || undefined
    );
    setRatingModal(null);
    setUserRating(0);
    setRatingComment('');
    setSubmittingRating(false);
    await loadData();
  };

  const filteredModules = publicModules.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSkills = publicSkills.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/learn"
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Explorer</h1>
            <p className="text-gray-500 text-sm">Contenu partagé par la communauté</p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les matières</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.code}</option>
            ))}
          </select>
        </div>

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
            Modules ({filteredModules.length})
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
            Compétences ({filteredSkills.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'modules' && (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredModules.length === 0 ? (
              <div className="col-span-2 bg-white rounded-2xl p-8 text-center border border-gray-100">
                <FolderPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun module public</h3>
                <p className="text-gray-500">Soyez le premier à partager un module !</p>
              </div>
            ) : (
              filteredModules.map(module => (
                <div key={module.id} className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FolderPlus className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{module.name}</h3>
                        <p className="text-sm text-gray-500">{module.code}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setRatingModal({ type: 'module', id: module.id })}
                      className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors"
                    >
                      <Star className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {module.rating_count > 0 ? module.rating_average.toFixed(1) : 'Noter'}
                      </span>
                    </button>
                  </div>
                  {module.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{module.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{module.rating_count} avis</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredSkills.length === 0 ? (
              <div className="col-span-2 bg-white rounded-2xl p-8 text-center border border-gray-100">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune compétence publique</h3>
                <p className="text-gray-500">Soyez le premier à partager une compétence !</p>
              </div>
            ) : (
              filteredSkills.map(skill => (
                <div key={skill.id} className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
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
                    <button
                      onClick={() => setRatingModal({ type: 'skill', id: skill.id })}
                      className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors"
                    >
                      <Star className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {skill.rating_count > 0 ? skill.rating_average.toFixed(1) : 'Noter'}
                      </span>
                    </button>
                  </div>
                  {skill.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{skill.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{skill.rating_count} avis</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Rating Modal */}
        {ratingModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Noter ce contenu</h2>
              
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setUserRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= userRating
                          ? 'text-amber-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Commentaire (optionnel)..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setRatingModal(null);
                    setUserRating(0);
                    setRatingComment('');
                  }}
                  className="flex-1 py-2 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={userRating === 0 || submittingRating}
                  className="flex-1 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium hover:from-amber-500 hover:to-orange-600 disabled:opacity-50"
                >
                  {submittingRating ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    'Envoyer'
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
