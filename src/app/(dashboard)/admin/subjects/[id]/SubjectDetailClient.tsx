'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BookOpen, 
  Save, 
  Trash2, 
  Plus, 
  Edit, 
  Check, 
  X, 
  Loader2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette matière et tout son contenu ?')) return;

    const supabase = createClient();
    await supabase.from('subjects').delete().eq('id', subject.id);
    router.push('/admin/subjects');
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
                      <div key={skill.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Niv. {skill.difficulty_level}
                          </span>
                          {editingItem === skill.name_key ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="border rounded px-2 py-1"
                                autoFocus
                              />
                              <button onClick={() => updateTranslation(skill.name_key, editValue)} className="p-1 text-green-600">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => setEditingItem(null)} className="p-1 text-red-600">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span 
                              className="cursor-pointer hover:text-primary"
                              onClick={() => startEdit(skill.name_key, getName(skill.name_key))}
                            >
                              {getName(skill.name_key)}
                              <Edit className="inline h-3 w-3 ml-1 opacity-50" />
                            </span>
                          )}
                        </div>
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
