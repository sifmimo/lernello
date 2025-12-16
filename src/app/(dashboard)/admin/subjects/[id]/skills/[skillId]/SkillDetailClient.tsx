'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  Loader2,
  BookOpen,
  Target,
  Lightbulb,
  FileText,
  ListChecks,
  GraduationCap,
  Sparkles,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SkillContent {
  id?: string;
  skill_id: string;
  objective: string;
  context: string;
  theory: string;
  synthesis: string;
  enrichments: Record<string, unknown>;
  pedagogical_method: string;
  source: string;
  is_validated: boolean;
  language: string;
}

interface SkillExample {
  id: string;
  skill_id: string;
  title: string;
  problem: string;
  solution: string;
  explanation: string;
  sort_order: number;
}

interface SkillSelfAssessment {
  id: string;
  skill_id: string;
  question: string;
  type: 'yes_no' | 'scale' | 'open';
  sort_order: number;
}

interface Skill {
  id: string;
  code: string;
  name_key: string;
  description_key: string;
  difficulty_level: number;
  sort_order: number;
  status: string;
  prerequisites: string[];
  domain_id: string;
}

interface Props {
  params: Promise<{ id: string; skillId: string }>;
}

export default function SkillDetailClient({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [skill, setSkill] = useState<Skill | null>(null);
  const [content, setContent] = useState<SkillContent | null>(null);
  const [examples, setExamples] = useState<SkillExample[]>([]);
  const [assessments, setAssessments] = useState<SkillSelfAssessment[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('metadata');
  
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [descValue, setDescValue] = useState('');

  useEffect(() => {
    loadSkill();
  }, [resolvedParams.skillId]);

  async function loadSkill() {
    const supabase = createClient();
    
    const { data: skillData } = await supabase
      .from('skills')
      .select('*')
      .eq('id', resolvedParams.skillId)
      .single();

    if (!skillData) {
      router.push(`/admin/subjects/${resolvedParams.id}`);
      return;
    }

    const { data: contentData } = await supabase
      .from('skill_content')
      .select('*')
      .eq('skill_id', resolvedParams.skillId)
      .single();

    const { data: examplesData } = await supabase
      .from('skill_examples')
      .select('*')
      .eq('skill_id', resolvedParams.skillId)
      .order('sort_order');

    const { data: assessmentsData } = await supabase
      .from('skill_self_assessments')
      .select('*')
      .eq('skill_id', resolvedParams.skillId)
      .order('sort_order');

    const keys = [skillData.name_key, skillData.description_key].filter(Boolean);
    const { data: translationsData } = await supabase
      .from('content_translations')
      .select('key, value')
      .in('key', keys);

    const translationsMap: Record<string, string> = {};
    (translationsData || []).forEach((t: { key: string; value: string }) => {
      translationsMap[t.key] = t.value;
    });

    setSkill(skillData);
    setContent(contentData || {
      skill_id: resolvedParams.skillId,
      objective: '',
      context: '',
      theory: '',
      synthesis: '',
      enrichments: {},
      pedagogical_method: 'standard',
      source: 'official',
      is_validated: false,
      language: 'fr',
    });
    setExamples(examplesData || []);
    setAssessments(assessmentsData || []);
    setTranslations(translationsMap);
    setNameValue(translationsMap[skillData.name_key] || skillData.name_key);
    setDescValue(translationsMap[skillData.description_key] || '');
    setLoading(false);
  }

  async function saveContent() {
    if (!content || !skill) return;
    setSaving(true);

    const supabase = createClient();

    if (content.id) {
      await supabase
        .from('skill_content')
        .update({
          objective: content.objective,
          context: content.context,
          theory: content.theory,
          synthesis: content.synthesis,
          enrichments: content.enrichments,
          pedagogical_method: content.pedagogical_method,
          is_validated: content.is_validated,
        })
        .eq('id', content.id);
    } else {
      const { data } = await supabase
        .from('skill_content')
        .insert({
          skill_id: skill.id,
          objective: content.objective,
          context: content.context,
          theory: content.theory,
          synthesis: content.synthesis,
          enrichments: content.enrichments,
          pedagogical_method: content.pedagogical_method,
          source: 'official',
          is_validated: false,
          language: 'fr',
        })
        .select()
        .single();
      
      if (data) setContent(data);
    }

    setSaving(false);
  }

  async function saveName() {
    if (!skill) return;
    const supabase = createClient();
    
    await supabase.from('content_translations').upsert({
      key: skill.name_key,
      language: 'fr',
      value: nameValue,
    }, { onConflict: 'key,language' });

    if (skill.description_key) {
      await supabase.from('content_translations').upsert({
        key: skill.description_key,
        language: 'fr',
        value: descValue,
      }, { onConflict: 'key,language' });
    }

    setTranslations(prev => ({
      ...prev,
      [skill.name_key]: nameValue,
      [skill.description_key]: descValue,
    }));
    setEditingName(false);
  }

  async function updateDifficulty(level: number) {
    if (!skill) return;
    const supabase = createClient();
    
    await supabase
      .from('skills')
      .update({ difficulty_level: level })
      .eq('id', skill.id);
    
    setSkill({ ...skill, difficulty_level: level });
  }

  async function publishSkill() {
    if (!skill) return;
    setSaving(true);

    const supabase = createClient();
    await supabase
      .from('skills')
      .update({ status: 'published' })
      .eq('id', skill.id);

    if (content?.id) {
      await supabase
        .from('skill_content')
        .update({ is_validated: true })
        .eq('id', content.id);
    }

    setSkill({ ...skill, status: 'published' });
    if (content) setContent({ ...content, is_validated: true });
    setSaving(false);
  }

  async function unpublishSkill() {
    if (!skill) return;
    setSaving(true);

    const supabase = createClient();
    await supabase
      .from('skills')
      .update({ status: 'draft' })
      .eq('id', skill.id);

    setSkill({ ...skill, status: 'draft' });
    setSaving(false);
  }

  async function addExample() {
    if (!skill) return;
    const supabase = createClient();

    const { data } = await supabase
      .from('skill_examples')
      .insert({
        skill_id: skill.id,
        title: 'Nouvel exemple',
        problem: '',
        solution: '',
        explanation: '',
        sort_order: examples.length + 1,
        language: 'fr',
      })
      .select()
      .single();

    if (data) setExamples([...examples, data]);
  }

  async function updateExample(id: string, field: string, value: string) {
    const supabase = createClient();
    await supabase
      .from('skill_examples')
      .update({ [field]: value })
      .eq('id', id);

    setExamples(examples.map(e => e.id === id ? { ...e, [field]: value } : e));
  }

  async function deleteExample(id: string) {
    if (!confirm('Supprimer cet exemple ?')) return;
    const supabase = createClient();
    await supabase.from('skill_examples').delete().eq('id', id);
    setExamples(examples.filter(e => e.id !== id));
  }

  async function addAssessment() {
    if (!skill) return;
    const supabase = createClient();

    const { data } = await supabase
      .from('skill_self_assessments')
      .insert({
        skill_id: skill.id,
        question: 'Nouvelle question',
        type: 'yes_no',
        sort_order: assessments.length + 1,
        language: 'fr',
      })
      .select()
      .single();

    if (data) setAssessments([...assessments, data]);
  }

  async function updateAssessment(id: string, field: string, value: string) {
    const supabase = createClient();
    await supabase
      .from('skill_self_assessments')
      .update({ [field]: value })
      .eq('id', id);

    setAssessments(assessments.map(a => a.id === id ? { ...a, [field]: value } : a));
  }

  async function deleteAssessment(id: string) {
    if (!confirm('Supprimer cette question ?')) return;
    const supabase = createClient();
    await supabase.from('skill_self_assessments').delete().eq('id', id);
    setAssessments(assessments.filter(a => a.id !== id));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!skill) return null;

  const sections = [
    { id: 'metadata', label: 'Métadonnées', icon: FileText },
    { id: 'objective', label: 'Objectif', icon: Target },
    { id: 'context', label: 'Contexte', icon: Lightbulb },
    { id: 'theory', label: 'Théorie', icon: BookOpen },
    { id: 'examples', label: 'Exemples', icon: GraduationCap },
    { id: 'assessments', label: 'Auto-évaluation', icon: ListChecks },
    { id: 'synthesis', label: 'Synthèse', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/admin/subjects/${resolvedParams.id}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la matière
            </Link>
            <div className="flex gap-2">
              <button
                onClick={saveContent}
                disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 inline-flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Enregistrer
              </button>
              {skill.status === 'draft' ? (
                <button
                  onClick={publishSkill}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Publier
                </button>
              ) : (
                <button
                  onClick={unpublishSkill}
                  disabled={saving}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 inline-flex items-center gap-2"
                >
                  <EyeOff className="h-4 w-4" />
                  Dépublier
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          {editingName ? (
            <div className="space-y-3">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="text-2xl font-bold border rounded-lg px-3 py-2 w-full"
                placeholder="Nom de la compétence"
              />
              <textarea
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                rows={2}
                placeholder="Description de la compétence"
              />
              <div className="flex gap-2">
                <button onClick={saveName} className="px-3 py-1 bg-green-600 text-white rounded-lg inline-flex items-center gap-1">
                  <Check className="h-4 w-4" /> Enregistrer
                </button>
                <button onClick={() => setEditingName(false)} className="px-3 py-1 border rounded-lg inline-flex items-center gap-1">
                  <X className="h-4 w-4" /> Annuler
                </button>
              </div>
            </div>
          ) : (
            <div onClick={() => setEditingName(true)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-lg -m-2">
              <h1 className="text-2xl font-bold">
                {translations[skill.name_key] || skill.name_key}
              </h1>
              <p className="text-muted-foreground mt-1">
                {translations[skill.description_key] || 'Cliquez pour ajouter une description'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  skill.status === 'published' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {skill.status === 'published' ? 'Publié' : 'Brouillon'}
                </span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Niveau {skill.difficulty_level}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors ${
                activeSection === section.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <section.icon className="h-4 w-4" />
              {section.label}
            </button>
          ))}
        </div>

        <div className="border rounded-xl p-6 bg-card">
          {activeSection === 'metadata' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Métadonnées</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Niveau de difficulté</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => updateDifficulty(level)}
                        className={`w-10 h-10 rounded-lg border ${
                          skill.difficulty_level >= level
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Méthode pédagogique</label>
                  <select
                    value={content?.pedagogical_method || 'standard'}
                    onChange={(e) => content && setContent({ ...content, pedagogical_method: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="standard">Classique</option>
                    <option value="montessori">Montessori</option>
                    <option value="singapore">Singapour</option>
                    <option value="gamified">Ludique</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'objective' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Objectif pédagogique mesurable
              </h3>
              <p className="text-sm text-muted-foreground">
                Définissez un objectif clair et mesurable que l'apprenant doit atteindre.
              </p>
              <textarea
                value={content?.objective || ''}
                onChange={(e) => content && setContent({ ...content, objective: e.target.value })}
                className="w-full border rounded-lg p-3"
                rows={4}
                placeholder="Ex: À la fin de cette compétence, l'apprenant sera capable de..."
              />
            </div>
          )}

          {activeSection === 'context' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Mise en contexte motivante
              </h3>
              <p className="text-sm text-muted-foreground">
                Expliquez pourquoi cette compétence est importante et utile dans la vie quotidienne.
              </p>
              <textarea
                value={content?.context || ''}
                onChange={(e) => content && setContent({ ...content, context: e.target.value })}
                className="w-full border rounded-lg p-3"
                rows={4}
                placeholder="Ex: Savoir compter est très utile quand tu vas faire les courses..."
              />
            </div>
          )}

          {activeSection === 'theory' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Explication théorique
              </h3>
              <p className="text-sm text-muted-foreground">
                Contenu pédagogique qui explique le concept de manière claire et progressive.
              </p>
              <textarea
                value={content?.theory || ''}
                onChange={(e) => content && setContent({ ...content, theory: e.target.value })}
                className="w-full border rounded-lg p-3"
                rows={8}
                placeholder="Expliquez le concept ici..."
              />
            </div>
          )}

          {activeSection === 'examples' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Exemples guidés
                </h3>
                <button
                  onClick={addExample}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg inline-flex items-center gap-1 text-sm"
                >
                  <Plus className="h-4 w-4" /> Ajouter
                </button>
              </div>
              
              {examples.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucun exemple. Cliquez sur "Ajouter" pour créer un exemple guidé.
                </p>
              ) : (
                <div className="space-y-4">
                  {examples.map((example, index) => (
                    <div key={example.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={example.title}
                          onChange={(e) => updateExample(example.id, 'title', e.target.value)}
                          className="font-medium border-0 bg-transparent focus:ring-0 p-0"
                          placeholder={`Exemple ${index + 1}`}
                        />
                        <button
                          onClick={() => deleteExample(example.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Problème</label>
                        <textarea
                          value={example.problem}
                          onChange={(e) => updateExample(example.id, 'problem', e.target.value)}
                          className="w-full border rounded p-2 text-sm"
                          rows={2}
                          placeholder="Énoncé du problème..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Solution</label>
                        <textarea
                          value={example.solution}
                          onChange={(e) => updateExample(example.id, 'solution', e.target.value)}
                          className="w-full border rounded p-2 text-sm"
                          rows={2}
                          placeholder="Solution détaillée..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Explication</label>
                        <textarea
                          value={example.explanation}
                          onChange={(e) => updateExample(example.id, 'explanation', e.target.value)}
                          className="w-full border rounded p-2 text-sm"
                          rows={2}
                          placeholder="Pourquoi cette solution fonctionne..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'assessments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <ListChecks className="h-5 w-5" />
                  Questions d'auto-évaluation
                </h3>
                <button
                  onClick={addAssessment}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg inline-flex items-center gap-1 text-sm"
                >
                  <Plus className="h-4 w-4" /> Ajouter
                </button>
              </div>
              
              {assessments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune question. Ajoutez des questions pour aider l'apprenant à s'auto-évaluer.
                </p>
              ) : (
                <div className="space-y-3">
                  {assessments.map((assessment) => (
                    <div key={assessment.id} className="border rounded-lg p-3 flex items-start gap-3">
                      <select
                        value={assessment.type}
                        onChange={(e) => updateAssessment(assessment.id, 'type', e.target.value)}
                        className="border rounded p-1 text-sm"
                      >
                        <option value="yes_no">Oui/Non</option>
                        <option value="scale">Échelle</option>
                        <option value="open">Ouverte</option>
                      </select>
                      <input
                        type="text"
                        value={assessment.question}
                        onChange={(e) => updateAssessment(assessment.id, 'question', e.target.value)}
                        className="flex-1 border-0 bg-transparent focus:ring-0 p-0"
                        placeholder="Question d'auto-évaluation..."
                      />
                      <button
                        onClick={() => deleteAssessment(assessment.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'synthesis' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Synthèse / À retenir
              </h3>
              <p className="text-sm text-muted-foreground">
                Résumé des points clés que l'apprenant doit retenir.
              </p>
              <textarea
                value={content?.synthesis || ''}
                onChange={(e) => content && setContent({ ...content, synthesis: e.target.value })}
                className="w-full border rounded-lg p-3"
                rows={4}
                placeholder="Points essentiels à retenir..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
