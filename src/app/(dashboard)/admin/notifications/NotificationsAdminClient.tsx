'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Bell, 
  Send,
  Users,
  Loader2,
  RefreshCw,
  Mail,
  Smartphone,
  Clock,
  CheckCircle,
  Filter,
  Search,
  Plus,
  Trash2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface NotificationTemplate {
  id: string;
  code: string;
  notification_type: string;
  title_template: string;
  message_template: string;
  action_label: string | null;
  priority: string;
  is_active: boolean;
}

interface SentNotification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  is_sent_push: boolean;
  is_sent_email: boolean;
  created_at: string;
}

export default function NotificationsAdminClient() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'sent' | 'send'>('templates');
  const [sendForm, setSendForm] = useState({
    template: '',
    targetType: 'all',
    customTitle: '',
    customMessage: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    
    const [templatesResult, notificationsResult] = await Promise.all([
      supabase.from('notification_templates').select('*').order('notification_type'),
      supabase.from('parent_notifications').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    setTemplates(templatesResult.data || []);
    setSentNotifications(notificationsResult.data || []);
    setLoading(false);
  }

  async function toggleTemplate(id: string, isActive: boolean) {
    const supabase = createClient();
    await supabase.from('notification_templates').update({ is_active: isActive }).eq('id', id);
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, is_active: isActive } : t));
  }

  async function sendNotification() {
    const supabase = createClient();
    
    const { data: users } = await supabase.from('users').select('id').eq('role', 'parent').limit(100);
    
    if (!users || users.length === 0) return;

    const notifications = users.map(user => ({
      parent_user_id: user.id,
      notification_type: 'custom',
      title: sendForm.customTitle,
      message: sendForm.customMessage,
      priority: 'normal',
    }));

    await supabase.from('parent_notifications').insert(notifications);
    
    setSendForm({ template: '', targetType: 'all', customTitle: '', customMessage: '' });
    loadData();
  }

  const typeLabels: Record<string, string> = {
    achievement: 'Réussite',
    streak: 'Streak',
    struggle: 'Difficulté',
    milestone: 'Étape',
    weekly_report: 'Rapport',
    suggestion: 'Suggestion',
    custom: 'Personnalisé',
  };

  const typeColors: Record<string, string> = {
    achievement: 'bg-green-100 text-green-700',
    streak: 'bg-orange-100 text-orange-700',
    struggle: 'bg-red-100 text-red-700',
    milestone: 'bg-blue-100 text-blue-700',
    weekly_report: 'bg-purple-100 text-purple-700',
    suggestion: 'bg-yellow-100 text-yellow-700',
    custom: 'bg-gray-100 text-gray-700',
  };

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
                <Bell className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">Notifications Parents</h1>
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
            {(['templates', 'sent', 'send'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab === 'templates' ? 'Templates' : tab === 'sent' ? 'Envoyées' : 'Envoyer'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {activeTab === 'templates' && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-600">
              <div className="col-span-3">Template</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-4">Message</div>
              <div className="col-span-1">Priorité</div>
              <div className="col-span-2">Statut</div>
            </div>

            <div className="divide-y">
              {templates.map((template) => (
                <div key={template.id} className={`grid grid-cols-12 gap-4 p-4 items-center ${!template.is_active ? 'bg-gray-50/50 opacity-60' : ''}`}>
                  <div className="col-span-3">
                    <p className="font-medium">{template.code}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{template.title_template}</p>
                  </div>
                  <div className="col-span-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[template.notification_type] || 'bg-gray-100'}`}>
                      {typeLabels[template.notification_type] || template.notification_type}
                    </span>
                  </div>
                  <div className="col-span-4">
                    <p className="text-sm text-gray-600 truncate">{template.message_template}</p>
                  </div>
                  <div className="col-span-1">
                    <span className={`text-xs ${template.priority === 'high' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {template.priority}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={() => toggleTemplate(template.id, !template.is_active)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        template.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {template.is_active ? 'Actif' : 'Inactif'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sent' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">{sentNotifications.length}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{sentNotifications.filter(n => n.is_read).length} lues</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="divide-y">
                {sentNotifications.map((notif) => (
                  <div key={notif.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[notif.notification_type] || 'bg-gray-100'}`}>
                            {typeLabels[notif.notification_type] || notif.notification_type}
                          </span>
                          <span className="font-medium">{notif.title}</span>
                          {notif.is_read && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <div className="flex items-center gap-2 mt-1 justify-end">
                          {notif.is_sent_push && <Smartphone className="h-3 w-3 text-blue-500" />}
                          {notif.is_sent_email && <Mail className="h-3 w-3 text-purple-500" />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {sentNotifications.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune notification envoyée</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'send' && (
          <div className="max-w-xl">
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Envoyer une notification
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Audience cible</label>
                  <select
                    value={sendForm.targetType}
                    onChange={(e) => setSendForm({ ...sendForm, targetType: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="all">Tous les parents</option>
                    <option value="active">Parents actifs (7 derniers jours)</option>
                    <option value="inactive">Parents inactifs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Titre</label>
                  <input
                    type="text"
                    value={sendForm.customTitle}
                    onChange={(e) => setSendForm({ ...sendForm, customTitle: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Titre de la notification"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <textarea
                    value={sendForm.customMessage}
                    onChange={(e) => setSendForm({ ...sendForm, customMessage: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={4}
                    placeholder="Contenu de la notification..."
                  />
                </div>

                <button
                  onClick={sendNotification}
                  disabled={!sendForm.customTitle || !sendForm.customMessage}
                  className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Envoyer la notification
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
