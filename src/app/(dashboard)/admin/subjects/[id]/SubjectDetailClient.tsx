'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Edit, 
  Check, 
  X, 
  Loader2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Skill {
  id: string;
  code: string;
  name_key: string;
  difficulty_level: number;
  sort_order: number;
  status: string;
}

interface Domain {
  id: string;
  code: string;
  name_key: string;
  description_key: string;
  sort_order: number;
  status: string;
  skills: Skill[];
}

interface Subject {
  id: string;
  code: string;
  name_key: string;
  description_key: string;
  icon: string;
  status: string;
  language: string;
  method_code: string;
  domains: Domain[];
}

interface Translation {
  key: string;
  value: string;
}

export default function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [recommendingTypes, setRecommendingTypes] = useState(false);
  const [recommendResult, setRecommendResult] = useState<{ success: number; failed: number; total: number } | null>(null);

  useEffect(() => {
    loadSubject();
  }, [resolvedParams.id]);

  async function loadSubject() {
    const supabase = createClient();
    
    const { data: subjectData } = await supabase
      .from('subjects')
      .select(`
        *,
        domains (
          *,
          skills (*)
        )
      `)
      .eq('id', resolvedParams.id)
      .single();

    if (!subjectData) {
      router.push('/admin/subjects');
      return;
    }

    // Charger les traductions
    const allKeys = [
      subjectData.name_key,
      subjectData.description_key,
      ...(subjectData.domains || []).flatMap((d: Domain) => [
        d.name_key,
        d.description_key,
        ...(d.skills || []).map((s: Skill) => s.name_key),
      ]),
    ].filter(Boolean);

    const { data: translationsData } = await supabase
      .from('content_translations')
      .select('key, value')
      .in('key', allKeys);

    const translationsMap: Record<string, string> = {};
    (translationsData || []).forEach((t: Translation) => {
      translationsMap[t.key] = t.value;
    });

    setSubject(subjectData as Subject);
    setTranslations(translationsMap);
    setExpandedDomains(new Set((subjectData.domains || []).map((d: Domain) => d.id)));
    setLoading(false);
  }

  async function updateTranslation(key: string, value: string) {
    const supabase = createClient();
    await supabase.from('content_translations').upsert({
      key,
      language: subject?.language || 'fr',
      value,
    }, { onConflict: 'key,language' });
    
    setTranslations(prev => ({ ...prev, [key]: value }));
    setEditingItem(null);
  }

  async function publishSubject() {
    if (!subject) return;
    setSaving(true);

    const supabase = createClient();
    
    await supabase.from('subjects').update({ status: 'published' }).eq('id', subject.id);
    await supabase.from('domains').update({ status: 'published' }).eq('subject_id', subject.id);
    
    for (const domain of subject.domains) {
      await supabase.from('skills').update({ status: 'published' }).eq('domain_id', domain.id);
    }

    setSubject({ ...subject, status: 'published' });
    setSaving(false);
  }

  async function unpublishSubject() {
    if (!subject) return;
    setSaving(true);

    const supabase = createClient();
    await supabase.from('subjects').update({ status: 'draft' }).eq('id', subject.id);
    
    setSubject({ ...subject, status: 'draft' });
    setSaving(false);
  }

  async function deleteSubject() {
    if (!subject) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette matière et tout son contenu ? Cette action est irréversible.')) return;

    setSaving(true);
    const supabase = createClient();
    
    try {
      // Supprimer en cascade : exercices -> skills -> domains -> subject
      for (const domain of subject.domains || []) {
        for (const skill of domain.skills || []) {
          // Supprimer les exercices de la compétence
          await supabase.from('exercises').delete().eq('skill_id', skill.id);
          // Supprimer la progression des élèves
          await supabase.from('student_skill_progress').delete().eq('skill_id', skill.id);
          // Supprimer les tentatives d'exercices
          await supabase.from('exercise_attempts').delete().eq('skill_id', skill.id);
          // Supprimer le contenu de la compétence
          await supabase.from('skill_content').delete().eq('skill_id', skill.id);
          // Supprimer les présentations
          await supabase.from('skill_presentations').delete().eq('skill_id', skill.id);
          // Supprimer les compétences débloquées
          await supabase.from('student_unlocked_skills').delete().eq('skill_id', skill.id);
          // Supprimer la rotation des exercices
          await supabase.from('student_exercise_rotation').delete().eq('skill_id', skill.id);
          // Supprimer les sessions d'apprentissage
          await supabase.from('learning_sessions').delete().eq('skill_id', skill.id);
        }
        // Supprimer les compétences du domaine
        await supabase.from('skills').delete().eq('domain_id', domain.id);
      }
      // Supprimer les domaines
      await supabase.from('domains').delete().eq('subject_id', subject.id);
      // Supprimer les traductions liées
      const translationKeys = [
        subject.name_key,
        subject.description_key,
        ...(subject.domains || []).flatMap(d => [
          d.name_key,
          d.description_key,
          ...(d.skills || []).map(s => s.name_key),
        ]),
      ].filter(Boolean);
      if (translationKeys.length > 0) {
        await supabase.from('content_translations').delete().in('key', translationKeys);
      }
      // Supprimer la matière
      const { error } = await supabase.from('subjects').delete().eq('id', subject.id);
      
      if (error) {
        console.error('Error deleting subject:', error);
        alert(`Erreur lors de la suppression: ${error.message}`);
        setSaving(false);
        return;
      }
      
      router.push('/admin/subjects');
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Erreur lors de la suppression de la matière');
      setSaving(false);
    }
  }

  async function addDomain() {
    if (!subject) return;
    const supabase = createClient();
    
    const newCode = `domain_${Date.now()}`;
    const { data: domain } = await supabase.from('domains').insert({
      subject_id: subject.id,
      code: newCode,
      name_key: `domains.${newCode}`,
      description_key: `domains.${newCode}_desc`,
      icon: '📚',
      sort_order: (subject.domains?.length || 0) + 1,
      status: 'draft',
    }).select().single();

    if (domain) {
      await supabase.from('content_translations').insert([
        { key: `domains.${newCode}`, language: subject.language || 'fr', value: 'Nouveau module' },
        { key: `domains.${newCode}_desc`, language: subject.language || 'fr', value: 'Description du module' },
      ]);
      
      await loadSubject();
    }
  }

  async function deleteDomain(domainId: string) {
    if (!confirm('Supprimer ce module et toutes ses compétences ?')) return;
    
    const supabase = createClient();
    await supabase.from('domains').delete().eq('id', domainId);
    await loadSubject();
  }

  async function addSkill(domainId: string, domain: Domain) {
    const supabase = createClient();
    
    const newCode = `skill_${Date.now()}`;
    await supabase.from('skills').insert({
      domain_id: domainId,
      code: newCode,
      name_key: `skills.${newCode}`,
      difficulty_level: 1,
      sort_order: (domain.skills?.length || 0) + 1,
      status: 'draft',
    });

    await supabase.from('content_translations').insert({
      key: `skills.${newCode}`,
      language: subject?.language || 'fr',
      value: 'Nouvelle compétence',
    });

    await loadSubject();
  }

  async function deleteSkill(skillId: string) {
    if (!confirm('Supprimer cette compétence ?')) return;
    
    const supabase = createClient();
    await supabase.from('skills').delete().eq('id', skillId);
    await loadSubject();
  }

  function toggleDomain(domainId: string) {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domainId)) {
        next.delete(domainId);
      } else {
        next.add(domainId);
      }
      return next;
    });
  }

  function startEdit(key: string, currentValue: string) {
    setEditingItem(key);
    setEditValue(currentValue);
  }

  async function recommendExerciseTypes() {
    if (!subject) return;
    if (!confirm('Voulez-vous que l\'IA détermine automatiquement les types d\'exercices adaptés pour toutes les compétences de cette matière ?')) return;

    setRecommendingTypes(true);
    setRecommendResult(null);

    try {
      const response = await fetch('/api/admin/recommend-exercise-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: subject.id,
          language: subject.language || 'fr',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la recommandation');
      }

      setRecommendResult(data.result);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setRecommendingTypes(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subject) return null;

  const getName = (key: string) => translations[key] || key;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/admin/subjects"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux matières
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{subject.icon}</span>
            <div>
              {editingItem === subject.name_key ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="text-2xl font-bold border rounded px-2 py-1"
                    autoFocus
                  />
                  <button onClick={() => updateTranslation(subject.name_key, editValue)} className="p-1 text-green-600">
                    <Check className="h-5 w-5" />
                  </button>
                  <button onClick={() => setEditingItem(null)} className="p-1 text-red-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <h1 
                  className="text-2xl font-bold cursor-pointer hover:text-primary"
                  onClick={() => startEdit(subject.name_key, getName(subject.name_key))}
                >
                  {getName(subject.name_key)}
                  <Edit className="inline h-4 w-4 ml-2 opacity-50" />
                </h1>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  subject.status === 'published' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {subject.status === 'published' ? 'Publié' : 'Brouillon'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {subject.domains?.length || 0} modules • {subject.domains?.reduce((acc, d) => acc + (d.skills?.length || 0), 0) || 0} compétences
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {subject.status === 'draft' ? (
              <button
                onClick={publishSubject}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Publier
              </button>
            ) : (
              <button
                onClick={unpublishSubject}
                disabled={saving}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 inline-flex items-center gap-2"
              >
                <EyeOff className="h-4 w-4" />
                Dépublier
              </button>
            )}
            <button
              onClick={deleteSubject}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          </div>
        </div>

        {/* Bouton de recommandation des types d'exercices */}
        <div className="mb-6 p-4 border rounded-xl bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <div>
                <h3 className="font-semibold">Types d'exercices IA</h3>
                <p className="text-sm text-muted-foreground">
                  L'IA détermine automatiquement les types d'exercices adaptés à chaque compétence
                </p>
              </div>
            </div>
            <button
              onClick={recommendExerciseTypes}
              disabled={recommendingTypes}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {recommendingTypes ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Réinitialiser les types
                </>
              )}
            </button>
          </div>
          {recommendResult && (
            <div className="mt-3 p-3 bg-white rounded-lg border">
              <p className="text-sm">
                <span className="font-medium text-green-600">{recommendResult.success}</span> compétences mises à jour
                {recommendResult.failed > 0 && (
                  <span className="text-red-600 ml-2">({recommendResult.failed} échecs)</span>
                )}
                <span className="text-muted-foreground ml-2">sur {recommendResult.total} total</span>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {subject.domains?.sort((a, b) => a.sort_order - b.sort_order).map((domain) => (
            <div key={domain.id} className="border rounded-xl bg-card overflow-hidden">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                onClick={() => toggleDomain(domain.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedDomains.has(domain.id) ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                  {editingItem === domain.name_key ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="font-semibold border rounded px-2 py-1"
                        autoFocus
                      />
                      <button onClick={() => updateTranslation(domain.name_key, editValue)} className="p-1 text-green-600">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditingItem(null)} className="p-1 text-red-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <span 
                      className="font-semibold cursor-pointer hover:text-primary"
                      onClick={(e) => { e.stopPropagation(); startEdit(domain.name_key, getName(domain.name_key)); }}
                    >
                      {getName(domain.name_key)}
                      <Edit className="inline h-3 w-3 ml-1 opacity-50" />
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    ({domain.skills?.length || 0} compétences)
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteDomain(domain.id); }}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {expandedDomains.has(domain.id) && (
                <div className="border-t p-4 bg-muted/30">
                  <div className="space-y-2">
                    {domain.skills?.sort((a, b) => a.sort_order - b.sort_order).map((skill) => (
                      <div key={skill.id} className="flex items-center justify-between p-3 bg-background rounded-lg border hover:border-primary/50 transition-colors">
                        <Link
                          href={`/admin/subjects/${subject.id}/skills/${skill.id}`}
                          className="flex items-center gap-3 flex-1"
                        >
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Niv. {skill.difficulty_level}
                          </span>
                          <span className="hover:text-primary">
                            {getName(skill.name_key)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            skill.status === 'published' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {skill.status === 'published' ? 'Publié' : 'Brouillon'}
                          </span>
                        </Link>
                        <button
                          onClick={() => deleteSkill(skill.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addSkill(domain.id, domain)}
                    className="mt-3 w-full p-2 border-2 border-dashed rounded-lg text-muted-foreground hover:text-primary hover:border-primary inline-flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une compétence
                  </button>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addDomain}
            className="w-full p-4 border-2 border-dashed rounded-xl text-muted-foreground hover:text-primary hover:border-primary inline-flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Ajouter un module
          </button>
        </div>
      </main>
    </div>
  );
}
