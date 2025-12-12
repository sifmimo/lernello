'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, User, Settings, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface StudentProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  birth_year: number | null;
  preferred_language: string | null;
}

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const [newProfile, setNewProfile] = useState({
    display_name: '',
    birth_year: new Date().getFullYear() - 8,
    preferred_language: 'fr',
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('student_profiles')
      .select('id, display_name, avatar_url, birth_year, preferred_language')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  const createProfile = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { error } = await supabase.from('student_profiles').insert({
      user_id: user.id,
      display_name: newProfile.display_name,
      birth_year: newProfile.birth_year,
      preferred_language: newProfile.preferred_language,
    });

    if (!error) {
      setShowCreateForm(false);
      setNewProfile({ display_name: '', birth_year: new Date().getFullYear() - 8, preferred_language: 'fr' });
      loadProfiles();
    }
  };

  const selectProfile = (profile: StudentProfile) => {
    setSelectedProfile(profile);
    // Stocker le profil sélectionné et rediriger vers le dashboard élève
    localStorage.setItem('activeProfileId', profile.id);
    localStorage.setItem('activeProfileName', profile.display_name);
    router.push('/learn');
  };

  const handleParentAccess = () => {
    setShowPinModal(true);
    setPin('');
    setPinError('');
  };

  const verifyPin = () => {
    // PIN par défaut pour le MVP: 1234
    // En production, le PIN sera stocké de manière sécurisée
    const correctPin = localStorage.getItem('parentPin') || '1234';
    if (pin === correctPin) {
      setShowPinModal(false);
      router.push('/dashboard');
    } else {
      setPinError('Code PIN incorrect');
    }
  };

  const avatarColors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
    'bg-orange-500', 'bg-pink-500', 'bg-teal-500'
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <Image src="/logo.svg" alt="Lernello" width={60} height={60} className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Qui apprend aujourd'hui ?</h1>
          <p className="mt-2 text-gray-600">Choisis ton profil pour commencer</p>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {profiles.map((profile, index) => (
            <button
              key={profile.id}
              onClick={() => selectProfile(profile)}
              className="group flex flex-col items-center rounded-2xl bg-white p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <div className={`flex h-20 w-20 items-center justify-center rounded-full ${avatarColors[index % avatarColors.length]} text-3xl font-bold text-white`}>
                {profile.display_name.charAt(0).toUpperCase()}
              </div>
              <span className="mt-4 text-lg font-semibold text-gray-900">{profile.display_name}</span>
              {profile.birth_year && (
                <span className="text-sm text-gray-500">
                  {new Date().getFullYear() - profile.birth_year} ans
                </span>
              )}
            </button>
          ))}

          {/* Add Profile Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-300 p-6 transition-all hover:border-indigo-400 hover:bg-white"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Plus className="h-10 w-10" />
            </div>
            <span className="mt-4 text-lg font-medium text-gray-500">Ajouter un profil</span>
          </button>
        </div>

        {/* Parent Access */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={handleParentAccess}
            className="flex items-center gap-2 rounded-lg bg-gray-800 px-6 py-3 font-medium text-white hover:bg-gray-700"
          >
            <Lock className="h-5 w-5" />
            Accès parent
          </button>
        </div>

        {/* Create Profile Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="mb-6 text-xl font-bold text-gray-900">Nouveau profil</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prénom</label>
                  <input
                    type="text"
                    value={newProfile.display_name}
                    onChange={(e) => setNewProfile({ ...newProfile, display_name: e.target.value })}
                    placeholder="Ex: Lucas"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Année de naissance</label>
                  <select
                    value={newProfile.birth_year}
                    onChange={(e) => setNewProfile({ ...newProfile, birth_year: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none"
                  >
                    {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 4 - i).map((year) => (
                      <option key={year} value={year}>{year} ({new Date().getFullYear() - year} ans)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Langue préférée</label>
                  <select
                    value={newProfile.preferred_language}
                    onChange={(e) => setNewProfile({ ...newProfile, preferred_language: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="fr">Français</option>
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={createProfile}
                  disabled={!newProfile.display_name.trim()}
                  className="flex-1 rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PIN Modal */}
        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="mb-2 text-xl font-bold text-gray-900">Accès parent</h2>
              <p className="mb-6 text-sm text-gray-600">Entrez le code PIN parental</p>
              
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="mb-2 block w-full rounded-lg border border-gray-300 px-4 py-4 text-center text-2xl tracking-widest focus:border-indigo-500 focus:outline-none"
              />
              
              {pinError && <p className="mb-4 text-center text-sm text-red-600">{pinError}</p>}
              
              <p className="mb-4 text-center text-xs text-gray-500">Code par défaut: 1234</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={verifyPin}
                  disabled={pin.length !== 4}
                  className="flex-1 rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
