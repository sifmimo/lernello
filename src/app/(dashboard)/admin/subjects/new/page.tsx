'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Loader2, BookOpen, Globe, GraduationCap, Languages, Bot } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Method {
  id: string;
  code: string;
  name_key: string;
}

interface AIModel {
  id: string;
  provider: string;
  model_name: string;
  display_name: string;
}

const countries = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algérie', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
];

const languages = [
  { code: 'fr', name: 'Français' },
  { code: 'ar', name: 'العربية' },
  { code: 'en', name: 'English' },
];

const methodNames: Record<string, string> = {
  'methods.standard': 'Méthode classique',
  'methods.montessori': 'Méthode Montessori',
  'methods.singapore': 'Méthode Singapour',
  'methods.gamified': 'Méthode ludique',
};

export default function NewSubjectPage() {
  const router = useRouter();
  const [methods, setMethods] = useState<Method[]>([]);
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    subjectName: '',
    country: 'FR',
    language: 'fr',
    method: '',
    aiModel: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    
    const [methodsRes, modelsRes] = await Promise.all([
      supabase.from('pedagogical_methods').select('id, code, name_key').eq('is_active', true).order('sort_order'),
      supabase.from('ai_model_config').select('id, provider, model_name, display_name').eq('is_active', true),
    ]);

    setMethods(methodsRes.data || []);
    setAIModels(modelsRes.data || []);
    
    if (methodsRes.data?.length) {
      setFormData(prev => ({ ...prev, method: methodsRes.data[0].code }));
    }
    if (modelsRes.data?.length) {
      const defaultModel = modelsRes.data.find((m: AIModel) => m.model_name.includes('gpt-4o')) || modelsRes.data[0];
      setFormData(prev => ({ ...prev, aiModel: defaultModel.id }));
    }
    
    setLoading(false);
  }

  async function handleGenerate() {
    if (!formData.subjectName.trim()) {
      setError('Veuillez entrer un nom de matière');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/admin/generate-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: formData.subjectName,
          country: formData.country,
          language: formData.language,
          method: formData.method,
          aiModelId: formData.aiModel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération');
      }

      router.push(`/admin/subjects/${data.subject.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-green-100">
            <BookOpen className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Générer une nouvelle matière</h1>
            <p className="text-muted-foreground">
              L'IA va créer la structure complète avec modules et compétences
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 border rounded-xl bg-card">
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <BookOpen className="h-4 w-4" />
                  Nom de la matière
                </label>
                <input
                  type="text"
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                  className="w-full p-3 border rounded-lg text-lg"
                  placeholder="Ex: Mathématiques, Français, Sciences..."
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Globe className="h-4 w-4" />
                    Pays (programme officiel)
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  >
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Languages className="h-4 w-4" />
                    Langue
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <GraduationCap className="h-4 w-4" />
                    Méthode pédagogique
                  </label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  >
                    {methods.map((method) => (
                      <option key={method.id} value={method.code}>
                        {methodNames[method.name_key] || method.name_key}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Bot className="h-4 w-4" />
                    Modèle IA
                  </label>
                  <select
                    value={formData.aiModel}
                    onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  >
                    {aiModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Génération intelligente</p>
                <p className="text-sm text-blue-700 mt-1">
                  L'IA va générer la structure de la matière basée sur le programme officiel du pays sélectionné.
                  Le contenu sera créé en statut <strong>brouillon</strong> et devra être validé avant publication.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/admin/subjects"
              className="flex-1 px-6 py-3 border rounded-lg text-center hover:bg-muted"
            >
              Annuler
            </Link>
            <button
              onClick={handleGenerate}
              disabled={generating || !formData.subjectName.trim()}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Générer la matière
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
