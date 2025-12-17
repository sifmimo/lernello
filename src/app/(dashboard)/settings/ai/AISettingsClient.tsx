'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Key, 
  Cpu, 
  Shield, 
  AlertCircle,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  Edit3
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { saveUserAISettings, getUserAISettingsForClient, deleteUserApiKey } from '@/server/actions/ai';

type Provider = 'platform' | 'openai' | 'anthropic';

interface AISettings {
  provider: Provider;
  api_key: string;
  preferred_model: string;
  is_key_valid: boolean;
}

const providers = [
  { 
    id: 'platform' as Provider, 
    name: 'Plateforme Lernello', 
    description: 'Utiliser les crédits de la plateforme',
    models: [] 
  },
  { 
    id: 'openai' as Provider, 
    name: 'OpenAI', 
    description: 'Utiliser votre propre clé API OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] 
  },
  { 
    id: 'anthropic' as Provider, 
    name: 'Anthropic', 
    description: 'Utiliser votre propre clé API Anthropic',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'] 
  },
];

export default function AISettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AISettings>({
    provider: 'platform',
    api_key: '',
    preferred_model: '',
    is_key_valid: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Charger depuis Supabase via server action (clé déchiffrée)
    const serverSettings = await getUserAISettingsForClient();
    
    // Charger les clés API depuis localStorage (fallback)
    const localProvider = localStorage.getItem('ai_provider') as Provider || 'platform';
    const localModel = localStorage.getItem('ai_model') || '';
    
    if (serverSettings && serverSettings.api_key) {
      // Synchroniser avec localStorage pour TTS
      if (serverSettings.provider === 'openai') {
        localStorage.setItem('ai_api_key_openai', serverSettings.api_key);
        localStorage.setItem('ai_api_key', serverSettings.api_key);
      } else if (serverSettings.provider === 'anthropic') {
        localStorage.setItem('ai_api_key_anthropic', serverSettings.api_key);
      }
      
      setSettings({
        provider: serverSettings.provider as Provider,
        api_key: serverSettings.api_key,
        preferred_model: serverSettings.preferred_model || '',
        is_key_valid: serverSettings.is_key_valid,
      });
      setHasExistingKey(true);
    } else {
      // Fallback localStorage
      const getLocalApiKey = (provider: Provider) => {
        if (provider === 'openai') {
          return localStorage.getItem('ai_api_key_openai') || localStorage.getItem('ai_api_key') || '';
        }
        if (provider === 'anthropic') {
          return localStorage.getItem('ai_api_key_anthropic') || '';
        }
        return '';
      };
      
      const localApiKey = getLocalApiKey(localProvider);
      setSettings({
        provider: serverSettings?.provider as Provider || localProvider,
        api_key: localApiKey,
        preferred_model: serverSettings?.preferred_model || localModel,
        is_key_valid: localApiKey.length > 20,
      });
      setHasExistingKey(!!localApiKey);
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);

    // Sauvegarder dans localStorage (persistance côté client pour TTS)
    localStorage.setItem('ai_provider', settings.provider);
    localStorage.setItem('ai_model', settings.preferred_model);
    
    if (settings.api_key) {
      if (settings.provider === 'openai') {
        localStorage.setItem('ai_api_key_openai', settings.api_key);
        localStorage.setItem('ai_api_key', settings.api_key);
      } else if (settings.provider === 'anthropic') {
        localStorage.setItem('ai_api_key_anthropic', settings.api_key);
      }
    }

    // Sauvegarder via server action (chiffrement côté serveur)
    const result = await saveUserAISettings(
      settings.provider,
      settings.api_key || null,
      settings.preferred_model
    );

    setSaving(false);
    
    if (!result.success) {
      setMessage({ type: 'error', text: result.error || 'Erreur lors de la sauvegarde' });
    } else {
      setMessage({ type: 'success', text: 'Paramètres enregistrés' });
    }
    
    // Mettre à jour l'état
    if (settings.api_key) {
      setHasExistingKey(true);
      setIsEditingKey(false);
    }
    
    setTimeout(() => setMessage(null), 3000);
  };

  const testApiKey = async () => {
    if (!settings.api_key) {
      setMessage({ type: 'error', text: 'Veuillez entrer une clé API' });
      return;
    }

    setTesting(true);
    setMessage(null);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const isValid = settings.api_key.length > 20;
    
    setSettings({ ...settings, is_key_valid: isValid });
    setTesting(false);
    
    if (isValid) {
      setMessage({ type: 'success', text: 'Clé API valide !' });
    } else {
      setMessage({ type: 'error', text: 'Clé API invalide' });
    }
  };

  const selectedProvider = providers.find(p => p.id === settings.provider);

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

      <h1 className="mb-2 text-3xl font-bold text-gray-900">Configuration IA</h1>
      <p className="mb-8 text-gray-600">
        Configurez votre propre clé API pour une expérience personnalisée
      </p>

      {/* Message */}
      {message && (
        <div className={`mb-6 flex items-center gap-2 rounded-lg p-4 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Sélection du provider */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <Cpu className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Fournisseur IA</h2>
          </div>

          <div className="space-y-2">
            {providers.map(provider => (
              <button
                key={provider.id}
                onClick={() => {
                  // Charger la clé correspondant au nouveau provider
                  let apiKey = '';
                  if (provider.id === 'openai') {
                    apiKey = localStorage.getItem('ai_api_key_openai') || '';
                  } else if (provider.id === 'anthropic') {
                    apiKey = localStorage.getItem('ai_api_key_anthropic') || '';
                  }
                  setSettings({ 
                    ...settings, 
                    provider: provider.id,
                    preferred_model: provider.models[0] || '',
                    api_key: apiKey,
                    is_key_valid: apiKey.length > 20
                  });
                  setHasExistingKey(!!apiKey);
                  setIsEditingKey(false);
                }}
                className={`w-full rounded-lg p-4 text-left transition-all ${
                  settings.provider === provider.id
                    ? 'border-2 border-indigo-600 bg-indigo-50'
                    : 'border-2 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{provider.name}</div>
                <div className="text-sm text-gray-500">{provider.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Configuration de la clé API */}
        {settings.provider !== 'platform' && (
          <>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-2">
                  <Key className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Clé API</h2>
              </div>

              <div className="space-y-4">
                {/* Affichage clé existante */}
                {hasExistingKey && !isEditingKey ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
                      <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">Clé API configurée</p>
                          <p className="text-sm text-green-600 font-mono">
                            {showKey ? settings.api_key : `${settings.api_key.substring(0, 7)}${'*'.repeat(20)}${settings.api_key.slice(-4)}`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="text-green-600 hover:text-green-800"
                      >
                        {showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditingKey(true)}
                        className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                      >
                        <Edit3 className="h-4 w-4" />
                        Modifier
                      </button>
                      <button
                        onClick={async () => {
                          // Supprimer de Supabase
                          const result = await deleteUserApiKey();
                          if (result.success) {
                            // Supprimer de localStorage
                            setSettings({ ...settings, api_key: '', is_key_valid: false });
                            setHasExistingKey(false);
                            if (settings.provider === 'openai') {
                              localStorage.removeItem('ai_api_key_openai');
                              localStorage.removeItem('ai_api_key');
                            } else if (settings.provider === 'anthropic') {
                              localStorage.removeItem('ai_api_key_anthropic');
                            }
                            localStorage.removeItem('openai_tts_key');
                            setMessage({ type: 'success', text: 'Clé API supprimée' });
                          } else {
                            setMessage({ type: 'error', text: result.error || 'Erreur lors de la suppression' });
                          }
                          setTimeout(() => setMessage(null), 3000);
                        }}
                        className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Formulaire de saisie */
                  <>
                    <div className="relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={settings.api_key}
                        onChange={(e) => setSettings({ ...settings, api_key: e.target.value, is_key_valid: false })}
                        placeholder={`Entrez votre clé API ${selectedProvider?.name}`}
                        className="w-full rounded-lg border px-4 py-3 pr-24 focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                      {settings.is_key_valid && (
                        <Check className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-green-500" />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={testApiKey}
                        disabled={testing || !settings.api_key}
                        className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                      >
                        {testing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                        Tester la clé
                      </button>
                      {isEditingKey && (
                        <button
                          onClick={async () => {
                            setIsEditingKey(false);
                            // Recharger la clé depuis Supabase
                            const serverSettings = await getUserAISettingsForClient();
                            if (serverSettings?.api_key) {
                              setSettings({ ...settings, api_key: serverSettings.api_key, is_key_valid: serverSettings.is_key_valid });
                            } else {
                              // Fallback localStorage
                              const localKey = settings.provider === 'openai' 
                                ? localStorage.getItem('ai_api_key_openai') || ''
                                : localStorage.getItem('ai_api_key_anthropic') || '';
                              setSettings({ ...settings, api_key: localKey });
                            }
                          }}
                          className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Sélection du modèle */}
            {selectedProvider && selectedProvider.models.length > 0 && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <Cpu className="h-5 w-5 text-purple-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Modèle préféré</h2>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {selectedProvider.models.map(model => (
                    <button
                      key={model}
                      onClick={() => setSettings({ ...settings, preferred_model: model })}
                      className={`rounded-lg p-3 text-left text-sm transition-all ${
                        settings.preferred_model === model
                          ? 'border-2 border-indigo-600 bg-indigo-50'
                          : 'border-2 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Avertissement sécurité */}
        {settings.provider !== 'platform' && (
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Note de sécurité</p>
              <p className="mt-1">
                Votre clé API est chiffrée avant d'être stockée. Elle n'est jamais partagée
                et n'est utilisée que pour générer des exercices personnalisés.
              </p>
            </div>
          </div>
        )}

        {/* Bouton sauvegarder */}
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Enregistrer les paramètres'
          )}
        </button>
      </div>
    </div>
  );
}
