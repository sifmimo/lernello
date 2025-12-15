'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Plus, Trash2, Edit, Loader2, Eye, EyeOff, Sparkles, Save, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Subject {
  id: string;
  code: string;
  name_key: string;
  description_key: string;
  icon: string;
  sort_order: number;
  is_official: boolean;
  status: string;
  language: string;
  domains_count?: number;
  skills_count?: number;
}

const subjectNames: Record<string, string> = {
  'subjects.math': 'Mathématiques',
  'subjects.french': 'Français',
  'subjects.science': 'Sciences',
  'subjects.history': 'Histoire',
  'subjects.geography': 'Géographie',
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ 
    code: '', 
    name_key: '', 
    description_key: '',
    icon: '',
    sort_order: 1 
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    const supabase = createClient();
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .order('sort_order');
    
    setSubjects(data || []);
    setLoading(false);
  }

  async function saveSubject() {
    const supabase = createClient();
    
    if (editingId) {
      await supabase
        .from('subjects')
        .update(formData)
        .eq('id', editingId);
    } else {
      await supabase
        .from('subjects')
        .insert({
          ...formData,
          is_official: true,
        });
    }
    
    setFormData({ code: '', name_key: '', description_key: '', icon: '', sort_order: 1 });
    setEditingId(null);
    setShowAddForm(false);
    await loadSubjects();
  }

  async function deleteSubject(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) return;
    
    const supabase = createClient();
    await supabase.from('subjects').delete().eq('id', id);
    await loadSubjects();
  }

  function startEdit(subject: Subject) {
    setFormData({ 
      code: subject.code, 
      name_key: subject.name_key, 
      description_key: subject.description_key,
      icon: subject.icon,
      sort_order: subject.sort_order,
    });
    setEditingId(subject.id);
    setShowAddForm(true);
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
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'administration
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-100">
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Matières</h1>
              <p className="text-muted-foreground">
                Gérer les matières officielles de la plateforme
              </p>
            </div>
          </div>
          <Link
            href="/admin/subjects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4" />
            Générer une matière
          </Link>
        </div>

        {showAddForm && (
          <div className="mb-6 p-4 border rounded-xl bg-card">
            <h3 className="font-semibold mb-4">{editingId ? 'Modifier' : 'Nouvelle'} matière</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="math"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Clé de nom</label>
                <input
                  type="text"
                  value={formData.name_key}
                  onChange={(e) => setFormData({ ...formData, name_key: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="subjects.math"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icône</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="calculator"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ordre</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-muted inline-flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Annuler
              </button>
              <button
                onClick={saveSubject}
                disabled={!formData.code || !formData.name_key}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </button>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/admin/subjects/${subject.id}`}
              className="p-4 rounded-xl border bg-card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{subject.icon}</span>
                  <div>
                    <h3 className="font-semibold">{subjectNames[subject.name_key] || subject.name_key}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        subject.status === 'published' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {subject.status === 'published' ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {subject.status === 'published' ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
              </div>
            </Link>
          ))}

          {subjects.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune matière configurée</p>
              <p className="text-sm mt-2">Cliquez sur "Générer une matière" pour commencer</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
