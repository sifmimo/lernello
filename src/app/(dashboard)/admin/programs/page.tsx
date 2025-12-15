'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe, Plus, Sparkles, Trash2, Edit, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Country {
  id: string;
  code: string;
  name: string;
  flag: string;
  has_program: boolean;
  subjects_count: number;
}

const availableCountries = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algérie', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
];

export default function ProgramsPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');

  useEffect(() => {
    loadCountries();
  }, []);

  async function loadCountries() {
    const supabase = createClient();
    
    const { data: programs } = await supabase
      .from('country_programs')
      .select(`
        id,
        country_code,
        country_name,
        country_flag,
        subjects:subjects(count)
      `);

    const countriesWithPrograms = (programs || []).map((p: any) => ({
      id: p.id,
      code: p.country_code,
      name: p.country_name,
      flag: p.country_flag,
      has_program: true,
      subjects_count: p.subjects?.[0]?.count || 0,
    }));

    setCountries(countriesWithPrograms);
    setLoading(false);
  }

  async function generateProgram(countryCode: string, countryName: string, countryFlag: string) {
    setGenerating(countryCode);
    
    try {
      const response = await fetch('/api/admin/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode, countryName, countryFlag }),
      });

      if (response.ok) {
        await loadCountries();
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error generating program:', error);
    } finally {
      setGenerating(null);
    }
  }

  async function deleteProgram(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) return;
    
    const supabase = createClient();
    await supabase.from('country_programs').delete().eq('id', id);
    await loadCountries();
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
            <div className="p-3 rounded-xl bg-blue-100">
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Programmes scolaires</h1>
              <p className="text-muted-foreground">
                Générer et gérer les programmes par pays
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Ajouter un pays
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {countries.map((country) => (
            <div
              key={country.id}
              className="p-4 rounded-xl border bg-card"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{country.flag}</span>
                  <div>
                    <h3 className="font-semibold">{country.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {country.subjects_count} matière{country.subjects_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Link
                    href={`/admin/programs/${country.code}`}
                    className="p-2 hover:bg-muted rounded-lg"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => deleteProgram(country.id)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {countries.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun programme configuré</p>
              <p className="text-sm">Cliquez sur "Ajouter un pays" pour commencer</p>
            </div>
          )}
        </div>
      </main>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Ajouter un programme</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Pays</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Sélectionner un pays</option>
                  {availableCountries
                    .filter(c => !countries.find(existing => existing.code === c.code))
                    .map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Génération IA</p>
                    <p className="text-xs text-blue-700">
                      L'IA va générer automatiquement les matières, modules et compétences
                      basés sur le programme officiel du pays sélectionné.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const country = availableCountries.find(c => c.code === selectedCountry);
                  if (country) {
                    generateProgram(country.code, country.name, country.flag);
                  }
                }}
                disabled={!selectedCountry || generating !== null}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Générer le programme
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
