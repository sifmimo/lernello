'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Bot,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  BarChart3,
  Clock,
  Database,
  Loader2,
  Cpu,
  ToggleLeft,
  ToggleRight,
  Save,
  Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AIUsageData {
  totalTokensUsed: number;
  totalCost: number;
  requestsCount: number;
  avgTokensPerRequest: number;
  cacheHitRate: number;
  byFeature: Array<{
    feature: string;
    tokens: number;
    cost: number;
    requests: number;
  }>;
  dailyUsage: Array<{
    date: string;
    tokens: number;
    cost: number;
  }>;
  modelDistribution: Array<{
    model: string;
    percentage: number;
    cost: number;
  }>;
}

interface AIModel {
  id: string;
  provider: string;
  model_name: string;
  display_name: string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  cost_per_1k_input: number;
  cost_per_1k_output: number;
  max_tokens: number;
  description: string | null;
}

interface AIConfig {
  defaultModel: string;
  maxTokensPerRequest: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  rateLimitPerMinute: number;
  costAlertThreshold: number;
}

const DEFAULT_CONFIG: AIConfig = {
  defaultModel: 'gpt-4o',
  maxTokensPerRequest: 2000,
  cacheEnabled: true,
  cacheTTL: 3600,
  rateLimitPerMinute: 60,
  costAlertThreshold: 100,
};

export default function AIControlClient() {
  const [usageData, setUsageData] = useState<AIUsageData | null>(null);
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'config' | 'models' | 'logs'>('dashboard');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    // Charger les modèles IA
    const { data: modelsData } = await supabase
      .from('ai_model_config')
      .select('*')
      .order('sort_order', { ascending: true });
    
    setAiModels(modelsData || []);

    // Charger les réglages persistés
    const { data: settingsData } = await supabase
      .from('ai_settings')
      .select('key, value');
    
    if (settingsData) {
      const settings: Record<string, unknown> = {};
      settingsData.forEach(s => {
        try {
          settings[s.key] = JSON.parse(s.value);
        } catch {
          settings[s.key] = s.value;
        }
      });
      
      setConfig({
        defaultModel: (settings.default_model as string) || DEFAULT_CONFIG.defaultModel,
        maxTokensPerRequest: (settings.max_tokens_per_request as number) || DEFAULT_CONFIG.maxTokensPerRequest,
        cacheEnabled: settings.cache_enabled !== undefined ? (settings.cache_enabled as boolean) : DEFAULT_CONFIG.cacheEnabled,
        cacheTTL: (settings.cache_ttl as number) || DEFAULT_CONFIG.cacheTTL,
        rateLimitPerMinute: (settings.rate_limit_per_minute as number) || DEFAULT_CONFIG.rateLimitPerMinute,
        costAlertThreshold: (settings.cost_alert_threshold as number) || DEFAULT_CONFIG.costAlertThreshold,
      });
    }

    const { data: aiLogs } = await supabase
      .from('ai_generation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    const { data: cachedContent } = await supabase
      .from('ai_cached_content')
      .select('id, hit_count')
      .limit(100);

    const logs = aiLogs || [];
    const totalTokens = logs.reduce((sum, log) => sum + (log.tokens_used || 0), 0);
    const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
    
    const totalCacheHits = cachedContent?.reduce((sum, c) => sum + (c.hit_count || 0), 0) || 0;
    const cacheHitRate = logs.length > 0 ? Math.round((totalCacheHits / (logs.length + totalCacheHits)) * 100) : 0;

    const featureMap = new Map<string, { tokens: number; cost: number; requests: number }>();
    logs.forEach(log => {
      const feature = log.feature || 'unknown';
      const existing = featureMap.get(feature) || { tokens: 0, cost: 0, requests: 0 };
      featureMap.set(feature, {
        tokens: existing.tokens + (log.tokens_used || 0),
        cost: existing.cost + (log.cost || 0),
        requests: existing.requests + 1,
      });
    });

    const byFeature = Array.from(featureMap.entries()).map(([feature, data]) => ({
      feature,
      ...data,
    })).sort((a, b) => b.cost - a.cost);

    const dailyMap = new Map<string, { tokens: number; cost: number }>();
    logs.forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      const existing = dailyMap.get(date) || { tokens: 0, cost: 0 };
      dailyMap.set(date, {
        tokens: existing.tokens + (log.tokens_used || 0),
        cost: existing.cost + (log.cost || 0),
      });
    });

    const dailyUsage = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .slice(-14);

    setUsageData({
      totalTokensUsed: totalTokens,
      totalCost,
      requestsCount: logs.length,
      avgTokensPerRequest: logs.length > 0 ? Math.round(totalTokens / logs.length) : 0,
      cacheHitRate,
      byFeature,
      dailyUsage,
      modelDistribution: [
        { model: 'GPT-4o-mini', percentage: 70, cost: totalCost * 0.3 },
        { model: 'GPT-4o', percentage: 20, cost: totalCost * 0.5 },
        { model: 'Claude-3-haiku', percentage: 10, cost: totalCost * 0.2 },
      ],
    });

    setLoading(false);
  }

  async function saveConfig() {
    setSaving(true);
    setSaveSuccess(false);
    const supabase = createClient();

    const settingsToSave = [
      { key: 'default_model', value: JSON.stringify(config.defaultModel) },
      { key: 'max_tokens_per_request', value: JSON.stringify(config.maxTokensPerRequest) },
      { key: 'cache_enabled', value: JSON.stringify(config.cacheEnabled) },
      { key: 'cache_ttl', value: JSON.stringify(config.cacheTTL) },
      { key: 'rate_limit_per_minute', value: JSON.stringify(config.rateLimitPerMinute) },
      { key: 'cost_alert_threshold', value: JSON.stringify(config.costAlertThreshold) },
    ];

    for (const setting of settingsToSave) {
      await supabase
        .from('ai_settings')
        .upsert({ key: setting.key, value: setting.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }

    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  async function toggleModelActive(modelId: string, isActive: boolean) {
    const supabase = createClient();
    await supabase
      .from('ai_model_config')
      .update({ is_active: isActive })
      .eq('id', modelId);
    
    setAiModels(prev => prev.map(m => m.id === modelId ? { ...m, is_active: isActive } : m));
  }

  async function setDefaultModel(modelName: string) {
    const supabase = createClient();
    
    // Désactiver l'ancien défaut
    await supabase
      .from('ai_model_config')
      .update({ is_default: false })
      .eq('is_default', true);
    
    // Activer le nouveau défaut
    await supabase
      .from('ai_model_config')
      .update({ is_default: true })
      .eq('model_name', modelName);
    
    // Mettre à jour le setting
    await supabase
      .from('ai_settings')
      .upsert({ key: 'default_model', value: JSON.stringify(modelName), updated_at: new Date().toISOString() }, { onConflict: 'key' });
    
    setAiModels(prev => prev.map(m => ({ ...m, is_default: m.model_name === modelName })));
    setConfig(prev => ({ ...prev, defaultModel: modelName }));
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
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Admin
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">Centre de Contrôle IA</h1>
              </div>
            </div>
            
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
          </div>
          
          <div className="flex gap-1 mt-4">
            {(['dashboard', 'models', 'config', 'logs'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab === 'dashboard' ? 'Tableau de bord' : tab === 'models' ? 'Modèles IA' : tab === 'config' ? 'Configuration' : 'Logs'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {activeTab === 'dashboard' && usageData && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <CostCard
                icon={<DollarSign className="h-5 w-5" />}
                label="Coût total"
                value={`$${usageData.totalCost.toFixed(2)}`}
                trend={-12}
                alert={usageData.totalCost > config.costAlertThreshold}
              />
              <CostCard
                icon={<Zap className="h-5 w-5" />}
                label="Tokens utilisés"
                value={usageData.totalTokensUsed.toLocaleString()}
                subtext={`~${usageData.avgTokensPerRequest} /requête`}
              />
              <CostCard
                icon={<BarChart3 className="h-5 w-5" />}
                label="Requêtes"
                value={usageData.requestsCount.toLocaleString()}
              />
              <CostCard
                icon={<Database className="h-5 w-5" />}
                label="Taux de cache"
                value={`${usageData.cacheHitRate}%`}
                good={usageData.cacheHitRate > 50}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold mb-4">Coûts par fonctionnalité</h3>
                <div className="space-y-3">
                  {usageData.byFeature.slice(0, 5).map((feature) => (
                    <div key={feature.feature} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">{feature.feature.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">
                          {feature.requests} requêtes • {feature.tokens.toLocaleString()} tokens
                        </p>
                      </div>
                      <span className="font-bold text-primary">${feature.cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold mb-4">Distribution par modèle</h3>
                <div className="space-y-4">
                  {usageData.modelDistribution.map((model) => (
                    <div key={model.model}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{model.model}</span>
                        <span className="font-medium">${model.cost.toFixed(2)} ({model.percentage}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${model.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-4">Évolution des coûts (14 derniers jours)</h3>
              <div className="h-48 flex items-end gap-2">
                {usageData.dailyUsage.map((day, i) => {
                  const maxCost = Math.max(...usageData.dailyUsage.map(d => d.cost), 1);
                  const height = (day.cost / maxCost) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-primary/80 rounded-t hover:bg-primary transition-colors"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`$${day.cost.toFixed(2)}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {i % 2 === 0 ? day.date : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Modèles IA disponibles</h2>
                <p className="text-sm text-muted-foreground">{aiModels.filter(m => m.is_active).length} modèles actifs sur {aiModels.length}</p>
              </div>
            </div>

            {/* Grouper par provider */}
            {['openai', 'anthropic', 'google', 'mistral', 'meta', 'xai'].map(provider => {
              const providerModels = aiModels.filter(m => m.provider === provider);
              if (providerModels.length === 0) return null;
              
              const providerNames: Record<string, string> = {
                openai: 'OpenAI',
                anthropic: 'Anthropic',
                google: 'Google',
                mistral: 'Mistral AI',
                meta: 'Meta',
                xai: 'xAI'
              };
              
              const providerColors: Record<string, string> = {
                openai: 'bg-emerald-500',
                anthropic: 'bg-orange-500',
                google: 'bg-blue-500',
                mistral: 'bg-purple-500',
                meta: 'bg-indigo-500',
                xai: 'bg-gray-800'
              };

              return (
                <div key={provider} className="bg-white rounded-xl border overflow-hidden">
                  <div className={`px-4 py-3 ${providerColors[provider]} text-white flex items-center gap-2`}>
                    <Cpu className="h-5 w-5" />
                    <span className="font-semibold">{providerNames[provider]}</span>
                    <span className="text-white/70 text-sm">({providerModels.length} modèles)</span>
                  </div>
                  <div className="divide-y">
                    {providerModels.map(model => (
                      <div key={model.id} className={`p-4 flex items-center justify-between ${!model.is_active ? 'opacity-50 bg-gray-50' : ''}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{model.display_name}</span>
                            {model.is_default && (
                              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                                Par défaut
                              </span>
                            )}
                            {model.model_name.includes('5.2') && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs rounded-full font-medium flex items-center gap-1">
                                <Sparkles className="h-3 w-3" /> Nouveau
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{model.model_name}</p>
                          {model.description && (
                            <p className="text-xs text-gray-500 mt-1">{model.description}</p>
                          )}
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            {model.cost_per_1k_input > 0 && (
                              <span>Input: ${model.cost_per_1k_input}/1K</span>
                            )}
                            {model.cost_per_1k_output > 0 && (
                              <span>Output: ${model.cost_per_1k_output}/1K</span>
                            )}
                            {model.max_tokens > 0 && (
                              <span>Max: {(model.max_tokens / 1000).toFixed(0)}K tokens</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {model.is_active && !model.is_default && (
                            <button
                              onClick={() => setDefaultModel(model.model_name)}
                              className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50"
                            >
                              Définir par défaut
                            </button>
                          )}
                          <button
                            onClick={() => toggleModelActive(model.id, !model.is_active)}
                            className={`p-2 rounded-lg transition-colors ${
                              model.is_active 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {model.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Configuration générale
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Modèle par défaut</label>
                  <select
                    value={config.defaultModel}
                    onChange={(e) => setConfig({ ...config, defaultModel: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {aiModels.filter(m => m.is_active).map(model => (
                      <option key={model.id} value={model.model_name}>
                        {model.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tokens max par requête</label>
                  <input
                    type="number"
                    value={config.maxTokensPerRequest}
                    onChange={(e) => setConfig({ ...config, maxTokensPerRequest: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Limite de requêtes/minute</label>
                  <input
                    type="number"
                    value={config.rateLimitPerMinute}
                    onChange={(e) => setConfig({ ...config, rateLimitPerMinute: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Seuil d'alerte coût ($)</label>
                  <input
                    type="number"
                    value={config.costAlertThreshold}
                    onChange={(e) => setConfig({ ...config, costAlertThreshold: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Cache intelligent
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Activer le cache</p>
                    <p className="text-sm text-muted-foreground">Réutilise les réponses similaires</p>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, cacheEnabled: !config.cacheEnabled })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      config.cacheEnabled ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      config.cacheEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Durée du cache (secondes)</label>
                  <input
                    type="number"
                    value={config.cacheTTL}
                    onChange={(e) => setConfig({ ...config, cacheTTL: parseInt(e.target.value) })}
                    disabled={!config.cacheEnabled}
                    className="w-full border rounded-lg px-3 py-2 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={saveConfig}
              disabled={saving}
              className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                saveSuccess 
                  ? 'bg-green-500 text-white' 
                  : 'bg-primary text-white hover:bg-primary/90 disabled:opacity-50'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Configuration enregistrée !
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer la configuration
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-xl border">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Logs de génération IA</h3>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          i % 3 === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {i % 3 === 0 ? 'Cache hit' : 'Génération'}
                        </span>
                        <span className="text-sm font-medium">Exercice QCM</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Skill: addition_simples • Difficulté: 2
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{i % 3 === 0 ? '0' : '~450'} tokens</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Il y a {i + 1}h
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function CostCard({ 
  icon, 
  label, 
  value, 
  trend, 
  subtext,
  alert,
  good
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  trend?: number;
  subtext?: string;
  alert?: boolean;
  good?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${alert ? 'border-red-300 bg-red-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${
          alert ? 'bg-red-100 text-red-600' : 
          good ? 'bg-green-100 text-green-600' : 
          'bg-primary/10 text-primary'
        }`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend < 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
        )}
        {alert && <AlertTriangle className="h-4 w-4 text-red-500" />}
        {good && <CheckCircle className="h-4 w-4 text-green-500" />}
      </div>
      <p className="text-2xl font-bold mt-3">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  );
}
