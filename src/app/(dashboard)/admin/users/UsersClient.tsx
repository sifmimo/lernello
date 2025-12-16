'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Search, Shield, User, Mail, Calendar, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UserData {
  id: string;
  email: string;
  role: string;
  created_at: string;
  profiles_count: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'email' | 'created_at' | 'role'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const supabase = createClient();
    
    const { data: usersData } = await supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        created_at,
        student_profiles(count)
      `)
      .order('created_at', { ascending: false });

    const formattedUsers = (usersData || []).map((u: any) => ({
      id: u.id,
      email: u.email || '',
      role: u.role || 'user',
      created_at: u.created_at,
      profiles_count: u.student_profiles?.[0]?.count || 0,
    }));

    setUsers(formattedUsers);
    setLoading(false);
  }

  async function updateRole(userId: string, newRole: string) {
    const supabase = createClient();
    await supabase.from('users').update({ role: newRole }).eq('id', userId);
    await loadUsers();
  }

  const filteredUsers = users
    .filter(u => 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const direction = sortDirection === 'asc' ? 1 : -1;
      return aVal < bVal ? -direction : direction;
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
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
            <div className="p-3 rounded-xl bg-red-100">
              <Users className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Utilisateurs</h1>
              <p className="text-muted-foreground">
                {users.length} utilisateur{users.length !== 1 ? 's' : ''} enregistré{users.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par email ou rôle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4">
                  <button 
                    onClick={() => toggleSort('email')}
                    className="flex items-center gap-1 font-semibold hover:text-primary"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                    <SortIcon field="email" />
                  </button>
                </th>
                <th className="text-left p-4">
                  <button 
                    onClick={() => toggleSort('role')}
                    className="flex items-center gap-1 font-semibold hover:text-primary"
                  >
                    <Shield className="h-4 w-4" />
                    Rôle
                    <SortIcon field="role" />
                  </button>
                </th>
                <th className="text-left p-4">
                  <span className="flex items-center gap-1 font-semibold">
                    <User className="h-4 w-4" />
                    Profils
                  </span>
                </th>
                <th className="text-left p-4">
                  <button 
                    onClick={() => toggleSort('created_at')}
                    className="flex items-center gap-1 font-semibold hover:text-primary"
                  >
                    <Calendar className="h-4 w-4" />
                    Inscription
                    <SortIcon field="created_at" />
                  </button>
                </th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t hover:bg-muted/30">
                  <td className="p-4">
                    <span className="font-medium">{user.email}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-700' 
                        : user.role === 'parent'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role === 'admin' && <Shield className="h-3 w-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-muted-foreground">{user.profiles_count}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <select
                      value={user.role}
                      onChange={(e) => updateRole(user.id, e.target.value)}
                      className="text-sm border rounded-lg px-2 py-1"
                    >
                      <option value="user">Utilisateur</option>
                      <option value="parent">Parent</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
