# Plan de Développement — Migration vers Cahier de Vision V2

**Dernière mise à jour :** 14 décembre 2024
**Statut :** ✅ IMPLÉMENTÉ

---

## 0. Résumé de l'Implémentation

| Phase | Statut | Fichiers créés |
|-------|--------|----------------|
| Phase 1 — Structure Compétence | ✅ Terminé | Migration SQL, types, server actions, composant UI |
| Phase 2 — Contenu Utilisateur | ✅ Terminé | Migration SQL, server actions, pages create/explore |
| Phase 3 — Méthodes Pédagogiques | ✅ Terminé | Migration SQL avec seed des 4 méthodes |
| Phase 4 — Quotas Freemium | ✅ Terminé | Migration SQL, logique de vérification |
| Phase 5 — Partage Communauté | ✅ Terminé | Server actions, UI notation/partage |

### Fichiers créés

**Migrations SQL :**
- `supabase/migrations/20251214230000_v2_skill_content_structure.sql`
- `supabase/migrations/20251214230100_v2_user_content_and_sharing.sql`
- `supabase/migrations/20251214230200_v2_pedagogical_methods.sql`
- `supabase/migrations/20251214230300_v2_quotas_freemium.sql`

**Types TypeScript :**
- `src/types/v2.ts`

**Server Actions :**
- `src/server/actions/skill-content.ts`
- `src/server/actions/user-content.ts`

**Composants UI :**
- `src/components/learning/SkillTheory.tsx`

**Pages :**
- `src/app/(dashboard)/create/page.tsx`
- `src/app/(dashboard)/explore/page.tsx`

**Tests :**
- `src/__tests__/server/skill-content.test.ts`
- `src/__tests__/server/user-content.test.ts`

---

## 1. Analyse des Écarts

### 1.1 Éléments Implémentés ✅

| Fonctionnalité | État | Détails |
|----------------|------|---------|
| **Hiérarchie Matière → Domaine → Compétence** | ✅ Complet | Tables `subjects`, `domains`, `skills` |
| **Exercices multi-types** | ✅ Complet | QCM, fill_blank, drag_drop, free_input |
| **Progression par compétence** | ✅ Complet | Table `student_skill_progress` avec mastery_level |
| **Génération IA d'exercices** | ✅ Complet | OpenAI/Anthropic avec BYOK |
| **Indices IA progressifs** | ✅ Complet | 3 niveaux d'indices |
| **Feedback et encouragements IA** | ✅ Complet | Messages contextuels |
| **Dashboard parent** | ✅ Basique | Vue progression enfants |
| **Notifications parent** | ✅ Complet | Table et UI |
| **Gamification badges** | ✅ Complet | Tables `achievement_rules`, `student_achievements` |
| **Multi-langue (i18n)** | ✅ Complet | FR, AR, EN avec RTL |
| **Profils élèves multiples** | ✅ Complet | Un parent peut avoir plusieurs enfants |
| **Configuration IA personnalisée** | ✅ Complet | BYOK avec limites quotidiennes |

### 1.2 Écarts Majeurs — À Implémenter 🔴

| Fonctionnalité V2 | État Actuel | Priorité |
|-------------------|-------------|----------|
| **Structure standard obligatoire d'une compétence (13 points)** | ❌ Non implémenté | P0 |
| **Contenu officiel vs contenu utilisateur** | ❌ Non implémenté | P0 |
| **Méthodes et styles pédagogiques** | ❌ Non implémenté | P1 |
| **Limite 10 exercices par compétence (tokens plateforme)** | ❌ Non implémenté | P1 |
| **Modules créés par utilisateurs** | ❌ Non implémenté | P1 |
| **Partage de contenu utilisateur** | ❌ Non implémenté | P2 |
| **Notation du contenu par la communauté** | ⚠️ Partiel (rating exercices uniquement) | P2 |
| **Validation implicite IA du contenu généré** | ❌ Non implémenté | P1 |
| **Accès gratuit vs premium (limites création)** | ❌ Non implémenté | P1 |

### 1.3 Écarts Détaillés

#### 1.3.1 Structure Standard Obligatoire d'une Compétence

**Vision V2 exige 13 éléments obligatoires :**

1. Métadonnées (matière, module, langue, méthode, style, source)
2. Intitulé clair et actionnable
3. Objectif pédagogique mesurable
4. Prérequis
5. Mise en contexte motivante
6. **Explication théorique obligatoire**
7. Exemples guidés
8. **Exercices progressifs obligatoires**
9. Corrections avec feedback explicatif
10. Auto-évaluation
11. Synthèse / À retenir
12. Enrichissements optionnels
13. Traçabilité et interactions

**État actuel :** Seuls les exercices et les métadonnées basiques existent.

#### 1.3.2 Contenu Officiel vs Utilisateur

**Vision V2 :**
- Matières = plateforme uniquement (utilisateurs ne peuvent pas en créer)
- Modules = créables par utilisateurs dans matières existantes
- Compétences = créables par utilisateurs dans modules existants
- Distinction claire visuelle contenu officiel/utilisateur
- Validation implicite IA lors de la génération

**État actuel :** Aucune distinction, pas de création utilisateur.

#### 1.3.3 Méthodes Pédagogiques

**Vision V2 :**
- Méthode par défaut configurable par matière (admin)
- Utilisateur choisit sa méthode lors de la génération
- Méthode explicitement indiquée dans les métadonnées

**État actuel :** Champ `preferred_method` existe mais non exploité.

#### 1.3.4 Gestion Tokens/Quotas

**Vision V2 :**
- 10 exercices max par compétence avec tokens plateforme
- Au-delà = tokens personnels ou clé API
- Message d'information clair à chaque changement de mode

**État actuel :** BYOK implémenté mais pas de limite par compétence.

---

## 2. Plan de Développement

### Phase 1 — Structure Compétence Complète (2 semaines)

#### Semaine 1 : Modèle de données

| Tâche | Effort | Détail |
|-------|--------|--------|
| Migration DB : `skill_content` | 2h | Table pour contenu structuré par compétence |
| Migration DB : `skill_theory` | 1h | Explications théoriques |
| Migration DB : `skill_examples` | 1h | Exemples guidés |
| Migration DB : `skill_synthesis` | 1h | Synthèse / À retenir |
| Migration DB : ajout champs métadonnées skills | 1h | pedagogical_method, source, etc. |
| Types TypeScript | 2h | Interfaces complètes |

**Migration SQL proposée :**
```sql
-- Contenu structuré d'une compétence
CREATE TABLE skill_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE UNIQUE,
    objective TEXT NOT NULL,
    context TEXT,
    theory TEXT NOT NULL,
    synthesis TEXT,
    enrichments JSONB DEFAULT '{}',
    pedagogical_method TEXT DEFAULT 'standard',
    source TEXT CHECK (source IN ('official', 'user', 'ai')) DEFAULT 'official',
    created_by UUID REFERENCES users(id),
    is_validated BOOLEAN DEFAULT FALSE,
    language TEXT NOT NULL DEFAULT 'fr',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exemples guidés
CREATE TABLE skill_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    problem TEXT NOT NULL,
    solution TEXT NOT NULL,
    explanation TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    language TEXT NOT NULL DEFAULT 'fr',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-évaluation
CREATE TABLE skill_self_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    type TEXT CHECK (type IN ('yes_no', 'scale', 'open')) DEFAULT 'yes_no',
    language TEXT NOT NULL DEFAULT 'fr',
    sort_order INTEGER DEFAULT 0
);
```

#### Semaine 2 : Génération IA structurée

| Tâche | Effort | Détail |
|-------|--------|--------|
| Prompt IA pour génération complète compétence | 4h | Structure 13 points |
| Validation Zod du contenu généré | 2h | Schéma strict |
| UI affichage compétence complète | 4h | Théorie, exemples, synthèse |
| Tests unitaires | 2h | Validation structure |

### Phase 2 — Contenu Officiel vs Utilisateur (2 semaines)

#### Semaine 3 : Modèle et backend

| Tâche | Effort | Détail |
|-------|--------|--------|
| Migration DB : modules utilisateur | 2h | `user_modules` table |
| Migration DB : compétences utilisateur | 2h | `user_skills` table |
| Migration DB : champs source sur tables existantes | 1h | `is_official`, `created_by` |
| RLS policies pour contenu utilisateur | 3h | Isolation données |
| API création module | 2h | Server action |
| API création compétence | 3h | Avec validation IA |

**Migration SQL proposée :**
```sql
-- Ajout source sur skills existants
ALTER TABLE skills ADD COLUMN is_official BOOLEAN DEFAULT TRUE;
ALTER TABLE skills ADD COLUMN created_by UUID REFERENCES users(id);

-- Ajout source sur exercises
ALTER TABLE exercises ADD COLUMN created_by UUID REFERENCES users(id);
ALTER TABLE exercises ADD COLUMN is_official BOOLEAN DEFAULT TRUE;

-- Modules utilisateur (dans matières officielles)
CREATE TABLE user_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    rating_average NUMERIC(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subject_id, created_by, code)
);

-- Compétences utilisateur (dans modules officiels ou utilisateur)
CREATE TABLE user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID, -- Peut référencer domains (officiel) ou user_modules
    module_type TEXT CHECK (module_type IN ('official', 'user')) NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    difficulty_level INTEGER DEFAULT 1,
    is_public BOOLEAN DEFAULT FALSE,
    rating_average NUMERIC(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Semaine 4 : UI et validation IA

| Tâche | Effort | Détail |
|-------|--------|--------|
| UI création module | 4h | Formulaire + validation |
| UI création compétence | 4h | Avec génération IA |
| Validation implicite IA | 3h | Vérification appartenance matière |
| Badge visuel contenu utilisateur | 2h | Distinction claire |
| Tests E2E | 2h | Parcours création |

### Phase 3 — Méthodes Pédagogiques (1 semaine)

#### Semaine 5

| Tâche | Effort | Détail |
|-------|--------|--------|
| Migration DB : `pedagogical_methods` | 1h | Table référentiel |
| Migration DB : méthode par défaut par matière | 1h | Champ sur subjects |
| UI sélection méthode lors génération | 3h | Dropdown avec descriptions |
| Intégration méthode dans prompts IA | 2h | Adaptation génération |
| Affichage méthode dans métadonnées | 1h | Badge sur compétence |

**Migration SQL proposée :**
```sql
CREATE TABLE pedagogical_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_key TEXT NOT NULL,
    description_key TEXT,
    prompt_instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);

INSERT INTO pedagogical_methods (code, name_key, description_key, prompt_instructions) VALUES
('standard', 'methods.standard', 'methods.standard_desc', 'Approche classique et structurée'),
('montessori', 'methods.montessori', 'methods.montessori_desc', 'Apprentissage par manipulation et découverte autonome'),
('singapore', 'methods.singapore', 'methods.singapore_desc', 'Méthode de Singapour : concret → imagé → abstrait'),
('gamified', 'methods.gamified', 'methods.gamified_desc', 'Approche ludique avec défis et récompenses');

ALTER TABLE subjects ADD COLUMN default_method TEXT REFERENCES pedagogical_methods(code) DEFAULT 'standard';
```

### Phase 4 — Quotas et Freemium (1 semaine)

#### Semaine 6

| Tâche | Effort | Détail |
|-------|--------|--------|
| Migration DB : compteurs exercices par compétence | 1h | Tracking usage |
| Migration DB : plans utilisateur (free/premium) | 2h | Limites différenciées |
| Logique limite 10 exercices/compétence | 3h | Avec message transition |
| UI indicateur quota | 2h | Barre de progression |
| Message transition tokens perso | 2h | Modal explicatif |
| Tests | 2h | Scénarios limites |

**Migration SQL proposée :**
```sql
-- Compteur exercices générés par compétence
CREATE TABLE skill_exercise_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform_generated INTEGER DEFAULT 0,
    user_generated INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(skill_id, user_id)
);

-- Plans utilisateur
CREATE TABLE user_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    plan_type TEXT CHECK (plan_type IN ('free', 'premium')) DEFAULT 'free',
    limits JSONB DEFAULT '{"modules_per_month": 3, "skills_per_month": 10, "ai_requests_per_day": 20}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);
```

### Phase 5 — Partage et Communauté (2 semaines)

#### Semaine 7 : Backend partage

| Tâche | Effort | Détail |
|-------|--------|--------|
| Migration DB : `content_shares` | 2h | Partages ciblés |
| Migration DB : `content_ratings` | 1h | Notes communauté |
| API partage contenu | 3h | Avec niveaux (privé, groupe, public) |
| API notation contenu | 2h | Étoiles + commentaires |

#### Semaine 8 : UI et découverte

| Tâche | Effort | Détail |
|-------|--------|--------|
| UI partage depuis compétence | 3h | Modal de partage |
| UI exploration contenu public | 4h | Galerie avec filtres |
| UI notation et commentaires | 2h | Inline sur contenu |
| Tests E2E | 2h | Parcours partage |

---

## 3. Résumé Effort Total

| Phase | Durée | Effort estimé |
|-------|-------|---------------|
| Phase 1 — Structure Compétence | 2 semaines | 20h |
| Phase 2 — Contenu Officiel/Utilisateur | 2 semaines | 24h |
| Phase 3 — Méthodes Pédagogiques | 1 semaine | 8h |
| Phase 4 — Quotas et Freemium | 1 semaine | 12h |
| Phase 5 — Partage et Communauté | 2 semaines | 17h |
| **Total** | **8 semaines** | **~81h** |

---

## 4. Ordre de Priorité Recommandé

1. **Phase 1** — Fondation : sans structure complète, le contenu pédagogique reste superficiel
2. **Phase 2** — Différenciation : essentiel pour la croissance et l'engagement
3. **Phase 4** — Monétisation : prépare le modèle freemium
4. **Phase 3** — Personnalisation : améliore l'expérience mais non bloquant
5. **Phase 5** — Viralité : multiplicateur de valeur mais dépend des phases précédentes

---

## 5. Risques et Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Complexité génération IA 13 points | Moyen | Génération par blocs, fallbacks |
| Validation IA contenu utilisateur | Élevé | Prompts stricts, review asynchrone |
| Migration données existantes | Faible | Rétrocompatibilité, migration optionnelle |
| UX création contenu trop complexe | Moyen | Wizard étape par étape |
