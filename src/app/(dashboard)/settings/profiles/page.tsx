"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, User, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface StudentProfile {
  id: string;
  display_name: string;
  birth_year: number | null;
  preferred_language: string;
  avatar_url: string | null;
}

export default function ProfilesSettingsPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    birth_year: "",
    preferred_language: "fr",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading profiles:", error);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Vous devez être connecté");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("student_profiles").insert({
      user_id: user.id,
      display_name: formData.display_name,
      birth_year: formData.birth_year ? parseInt(formData.birth_year) : null,
      preferred_language: formData.preferred_language,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setFormData({ display_name: "", birth_year: "", preferred_language: "fr" });
    setShowForm(false);
    setSaving(false);
    loadProfiles();
  }

  async function handleDelete(id: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce profil ?")) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("student_profiles")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erreur lors de la suppression: " + error.message);
    } else {
      loadProfiles();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Profils enfants</h1>

        {profiles.length === 0 && !showForm ? (
          <div className="text-center py-12 border rounded-xl bg-card">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-2">Aucun profil enfant</h2>
            <p className="text-muted-foreground mb-6">
              Créez un profil pour que votre enfant puisse commencer à apprendre
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Créer un profil
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-4 border rounded-xl bg-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{profile.display_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.birth_year
                          ? `Né(e) en ${profile.birth_year}`
                          : "Année non renseignée"}
                        {" • "}
                        {profile.preferred_language === "fr"
                          ? "Français"
                          : profile.preferred_language === "en"
                            ? "English"
                            : "العربية"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent"
              >
                <Plus className="h-4 w-4" />
                Ajouter un profil
              </button>
            )}
          </>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 p-6 border rounded-xl bg-card space-y-4"
          >
            <h2 className="text-lg font-semibold">Nouveau profil</h2>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Prénom ou surnom
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Emma"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Année de naissance (optionnel)
              </label>
              <input
                type="number"
                value={formData.birth_year}
                onChange={(e) =>
                  setFormData({ ...formData, birth_year: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="2017"
                min="2005"
                max="2023"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Langue préférée
              </label>
              <select
                value={formData.preferred_language}
                onChange={(e) =>
                  setFormData({ ...formData, preferred_language: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border hover:bg-accent"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Créer le profil
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
