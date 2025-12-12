'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, Calendar, Zap, DollarSign, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface UsageData {
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  dailyBreakdown: { date: string; tokens: number; cost: number }[];
}

export default function AIUsageDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dailyUsage, setDailyUsage] = useState<UsageData | null>(null);
  const [monthlyUsage, setMonthlyUsage] = useState<UsageData | null>(null);
  const [limits, setLimits] = useState({ daily: 50000, monthly: 500000 });

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: dailyData } = await supabase
      .from('ai_usage_logs')
      .select('tokens_used, cost, created_at')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString());

    const { data: monthlyData } = await supabase
      .from('ai_usage_logs')
      .select('tokens_used, cost, created_at')
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString());

    const { data: settings } = await supabase
      .from('user_ai_settings')
      .select('daily_limit, monthly_limit')
      .eq('user_id', user.id)
      .single();

    if (settings) {
      setLimits({
        daily: settings.daily_limit || 50000,
        monthly: settings.monthly_limit || 500000,
      });
    }

    const processDailyData = (data: { tokens_used: number; cost: number; created_at: string }[] | null) => {
      if (!data) return { totalTokens: 0, totalCost: 0, requestCount: 0, dailyBreakdown: [] };
      return {
        totalTokens: data.reduce((sum, d) => sum + (d.tokens_used || 0), 0),
        totalCost: data.reduce((sum, d) => sum + (d.cost || 0), 0),
        requestCount: data.length,
        dailyBreakdown: [],
      };
    };

    const processMonthlyData = (data: { tokens_used: number; cost: number; created_at: string }[] | null) => {
      if (!data) return { totalTokens: 0, totalCost: 0, requestCount: 0, dailyBreakdown: [] };
      
      const dailyMap = new Map<string, { tokens: number; cost: number }>();
      data.forEach(d => {
        const date = new Date(d.created_at).toISOString().split('T')[0];
        const existing = dailyMap.get(date) || { tokens: 0, cost: 0 };
        dailyMap.set(date, {
          tokens: existing.tokens + (d.tokens_used || 0),
          cost: existing.cost + (d.cost || 0),
        });
      });

      return {
        totalTokens: data.reduce((sum, d) => sum + (d.tokens_used || 0), 0),
        totalCost: data.reduce((sum, d) => sum + (d.cost || 0), 0),
        requestCount: data.length,
        dailyBreakdown: Array.from(dailyMap.entries()).map(([date, stats]) => ({
          date,
          tokens: stats.tokens,
          cost: stats.cost,
        })),
      };
    };

    setDailyUsage(processDailyData(dailyData));
    setMonthlyUsage(processMonthlyData(monthlyData));
    setLoading(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min(100, (used / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  const dailyPercentage = getUsagePercentage(dailyUsage?.totalTokens || 0, limits.daily);
  const monthlyPercentage = getUsagePercentage(monthlyUsage?.totalTokens || 0, limits.monthly);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/settings/ai" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Utilisation IA</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-blue-100 p-2">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Aujourd&apos;hui</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Tokens utilisés</span>
                  <span className="font-medium">{formatNumber(dailyUsage?.totalTokens || 0)} / {formatNumber(limits.daily)}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200">
                  <div 
                    className={`h-full rounded-full ${getUsageColor(dailyPercentage)}`}
                    style={{ width: `${dailyPercentage}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-gray-500">Requêtes</p>
                  <p className="text-xl font-bold text-gray-900">{dailyUsage?.requestCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Coût estimé</p>
                  <p className="text-xl font-bold text-gray-900">${(dailyUsage?.totalCost || 0).toFixed(4)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-purple-100 p-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Ce mois</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Tokens utilisés</span>
                  <span className="font-medium">{formatNumber(monthlyUsage?.totalTokens || 0)} / {formatNumber(limits.monthly)}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200">
                  <div 
                    className={`h-full rounded-full ${getUsageColor(monthlyPercentage)}`}
                    style={{ width: `${monthlyPercentage}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-gray-500">Requêtes</p>
                  <p className="text-xl font-bold text-gray-900">{monthlyUsage?.requestCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Coût estimé</p>
                  <p className="text-xl font-bold text-gray-900">${(monthlyUsage?.totalCost || 0).toFixed(4)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {(dailyPercentage >= 80 || monthlyPercentage >= 80) && (
          <div className="mt-6 rounded-xl bg-yellow-50 border border-yellow-200 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Attention aux limites</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Vous approchez de vos limites d&apos;utilisation. Pensez à ajuster vos paramètres ou à augmenter vos limites.
                </p>
              </div>
            </div>
          </div>
        )}

        {monthlyUsage && monthlyUsage.dailyBreakdown.length > 0 && (
          <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Historique journalier</h2>
            <div className="space-y-2">
              {monthlyUsage.dailyBreakdown.slice(-7).reverse().map(day => (
                <div key={day.date} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{formatNumber(day.tokens)} tokens</span>
                    <span className="text-sm text-gray-500">${day.cost.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
