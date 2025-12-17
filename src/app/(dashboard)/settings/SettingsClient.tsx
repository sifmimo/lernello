'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Shield, 
  ChevronRight,
  Download,
  LogOut,
  Settings,
  Cpu,
  Globe,
  Volume2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UserData {
  email: string;
  created_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [parentalPin, setParentalPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    setUser({
      email: user.email || '',
      created_at: user.created_at || ''
    });

    const { data: settings } = await supabase
      .from('user_settings')
      .select('parental_pin')
      .eq('user_id', user.id)
      .single();

    if (settings?.parental_pin) {
      setParentalPin(settings.parental_pin);
    }

    setLoading(false);
  };

  const updatePin = async () => {
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setPinError('Le code PIN doit contenir 4 chiffres');
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        parental_pin: newPin,
        updated_at: new Date().toISOString()
      });

    if (error) {
      setPinError('Erreur lors de la mise à jour');
    } else {
      setParentalPin(newPin);
      setNewPin('');
      setShowPinForm(false);
      setPinError('');
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem('activeProfileId');
    localStorage.removeItem('activeProfileName');
    router.push('/login');
  };

  const handleExportData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { data: profiles } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id);

    const { data: progress } = await supabase
      .from('student_skill_progress')
      .select('*')
      .in('student_id', (profiles || []).map((p: { id: string }) => p.id));

    const exportData = {
      user: { email: user.email },
      profiles,
      progress,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lernello-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
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
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Paramètres</h1>

      {/* Compte */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Compte</h2>
        <div className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">Email</span>
            </div>
            <span className="text-gray-500">{user?.email}</span>
          </div>
          <div className="border-t" />
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">Membre depuis</span>
            </div>
            <span className="text-gray-500">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'}
            </span>
          </div>
        </div>
      </section>

      {/* Profils enfants */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Profils enfants</h2>
        <div className="space-y-2">
          <Link
            href="/settings/profiles"
            className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">Gérer les profils enfants</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Link>
          <Link
            href="/settings/preferences"
            className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">Préférences pédagogiques</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Link>
          <Link
            href="/settings/ai"
            className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Cpu className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">Configuration IA (BYOK)</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Link>
          <Link
            href="/settings/voice"
            className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">Paramètres vocaux</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Link>
        </div>
      </section>

      {/* Sécurité */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Sécurité</h2>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <div>
                <span className="text-gray-700">Code PIN parental</span>
                <p className="text-sm text-gray-500">
                  {parentalPin ? `****` : 'Non configuré'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPinForm(!showPinForm)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              {parentalPin ? 'Modifier' : 'Configurer'}
            </button>
          </div>

          {showPinForm && (
            <div className="mt-4 border-t pt-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nouveau code PIN (4 chiffres)
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 rounded-lg border px-4 py-2 focus:border-indigo-500 focus:outline-none"
                  placeholder="1234"
                />
                <button
                  onClick={updatePin}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                >
                  Enregistrer
                </button>
              </div>
              {pinError && (
                <p className="mt-2 text-sm text-red-600">{pinError}</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Données */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Données</h2>
        <div className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
          <button
            onClick={handleExportData}
            className="flex w-full items-center justify-between py-2 text-left transition-colors hover:text-indigo-600"
          >
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">Exporter mes données</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </section>

      {/* Déconnexion */}
      <section>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 p-4 text-red-600 transition-colors hover:bg-red-100"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Se déconnecter</span>
        </button>
      </section>
    </div>
  );
}
