'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User, 
  Zap, 
  Clock, 
  Volume2,
  Palette,
  Save,
  Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface StudentProfile {
  id: string;
  display_name: string;
}

interface Preferences {
  difficulty_level: 'easy' | 'medium' | 'hard' | 'adaptive';
  session_duration: number;
  sound_enabled: boolean;
  animations_enabled: boolean;
  hint_delay: number;
  theme: 'light' | 'dark' | 'colorful';
}

const defaultPreferences: Preferences = {
  difficulty_level: 'adaptive',
  session_duration: 15,
  sound_enabled: true,
  animations_enabled: true,
  hint_delay: 30,
  theme: 'colorful',
};

export default function PreferencesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfile) {
      loadPreferences(selectedProfile);
    }
  }, [selectedProfile]);

  const loadProfiles = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    const { data } = await supabase
      .from('student_profiles')
      .select('id, display_name')
      .eq('user_id', user.id)
      .order('created_at');

    if (data && data.length > 0) {
      setProfiles(data);
      setSelectedProfile(data[0].id);
    }
    setLoading(false);
  };

  const loadPreferences = async (profileId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('student_preferences')
      .select('*')
      .eq('student_id', profileId)
      .single();

    if (data) {
      setPreferences({
        difficulty_level: data.difficulty_level || defaultPreferences.difficulty_level,
        session_duration: data.session_duration || defaultPreferences.session_duration,
        sound_enabled: data.sound_enabled ?? defaultPreferences.sound_enabled,
        animations_enabled: data.animations_enabled ?? defaultPreferences.animations_enabled,
        hint_delay: data.hint_delay || defaultPreferences.hint_delay,
        theme: data.theme || defaultPreferences.theme,
      });
    } else {
      setPreferences(defaultPreferences);
    }
  };

  const savePreferences = async () => {
    if (!selectedProfile) return;
    
    setSaving(true);
    const supabase = createClient();

    await supabase
      .from('student_preferences')
      .upsert({
        student_id: selectedProfile,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link
        href="/settings"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux paramètres
      </Link>

      <h1 className="mb-8 text-3xl font-bold text-gray-900">Préférences pédagogiques</h1>

      {profiles.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <User className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-600">Aucun profil enfant</p>
          <Link
            href="/settings/profiles"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-700"
          >
            Créer un profil
          </Link>
        </div>
      ) : (
        <>
          {/* Sélecteur de profil */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Profil enfant
            </label>
            <select
              value={selectedProfile || ''}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="w-full rounded-lg border px-4 py-2 focus:border-indigo-500 focus:outline-none"
            >
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Préférences */}
          <div className="space-y-6">
            {/* Niveau de difficulté */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Niveau de difficulté</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { value: 'easy', label: 'Facile' },
                  { value: 'medium', label: 'Moyen' },
                  { value: 'hard', label: 'Difficile' },
                  { value: 'adaptive', label: 'Adaptatif' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setPreferences({ ...preferences, difficulty_level: option.value as Preferences['difficulty_level'] })}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      preferences.difficulty_level === option.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-gray-500">
                {preferences.difficulty_level === 'adaptive' 
                  ? "Le niveau s'adapte automatiquement selon les performances"
                  : `Exercices de niveau ${preferences.difficulty_level === 'easy' ? 'facile' : preferences.difficulty_level === 'medium' ? 'moyen' : 'difficile'}`}
              </p>
            </div>

            {/* Durée de session */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Durée de session</h2>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={preferences.session_duration}
                  onChange={(e) => setPreferences({ ...preferences, session_duration: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="w-20 text-right font-medium text-gray-900">
                  {preferences.session_duration} min
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Durée recommandée par session d'apprentissage
              </p>
            </div>

            {/* Sons et animations */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <Volume2 className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Sons et animations</h2>
              </div>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-gray-700">Sons activés</span>
                  <button
                    onClick={() => setPreferences({ ...preferences, sound_enabled: !preferences.sound_enabled })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      preferences.sound_enabled ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        preferences.sound_enabled ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-gray-700">Animations activées</span>
                  <button
                    onClick={() => setPreferences({ ...preferences, animations_enabled: !preferences.animations_enabled })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      preferences.animations_enabled ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        preferences.animations_enabled ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>

            {/* Délai des indices */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Palette className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Délai avant indices</h2>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="10"
                  value={preferences.hint_delay}
                  onChange={(e) => setPreferences({ ...preferences, hint_delay: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="w-20 text-right font-medium text-gray-900">
                  {preferences.hint_delay} sec
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Temps avant qu'un indice soit proposé
              </p>
            </div>

            {/* Thème */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-pink-100 p-2">
                  <Palette className="h-5 w-5 text-pink-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Thème visuel</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'light', label: 'Clair', color: 'bg-white border-2' },
                  { value: 'dark', label: 'Sombre', color: 'bg-gray-800' },
                  { value: 'colorful', label: 'Coloré', color: 'bg-gradient-to-r from-indigo-500 to-purple-500' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setPreferences({ ...preferences, theme: option.value as Preferences['theme'] })}
                    className={`flex flex-col items-center gap-2 rounded-lg p-3 transition-all ${
                      preferences.theme === option.value
                        ? 'ring-2 ring-indigo-600 ring-offset-2'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`h-8 w-full rounded ${option.color}`} />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bouton sauvegarder */}
          <div className="mt-8">
            <button
              onClick={savePreferences}
              disabled={saving}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium text-white transition-all ${
                saved
                  ? 'bg-green-600'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } disabled:opacity-50`}
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : saved ? (
                <>
                  <Save className="h-5 w-5" />
                  Enregistré !
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Enregistrer les préférences
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
