# 📐 Cahier des Spécifications Techniques
## Plateforme Lernello — Architecture & Technologies

---

## 1. Vue d'ensemble technique

### 1.1 Philosophie architecturale

| Principe | Description |
|----------|-------------|
| **Modularité** | Chaque domaine métier (compétences, parcours, IA) est un module indépendant |
| **Scalabilité horizontale** | Architecture stateless permettant l'ajout de serveurs à la demande |
| **API-first** | Toute fonctionnalité exposée via API avant interface |
| **Type-safety** | TypeScript end-to-end pour réduire les bugs runtime |
| **Event-driven** | Communication asynchrone entre services pour le découplage |

### 1.2 Stack technologique retenue

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  Next.js 15 (App Router) + React 19 + TypeScript                │
│  TailwindCSS + shadcn/ui + Framer Motion                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (HYBRIDE)                             │
│  Next.js API Routes + tRPC ──► CRUD, Auth, Realtime             │
│  Supabase Edge Functions ────► IA, Tâches longues (Deno, 400s)  │
│  Inngest ────────────────────► Background jobs, Queues          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      INTELLIGENCE IA                             │
│  OpenAI GPT-4o / Claude 3.5 + LangChain                         │
│  pgvector (embeddings) + Redis (cache IA)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     INFRASTRUCTURE                               │
│  Docker (dev) + Vercel (frontend) + Supabase Cloud              │
│  Redis Cloud + CDN (Cloudflare)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Architecture backend hybride — Justification

| Couche | Technologie | Timeout | Usage |
|--------|-------------|---------|-------|
| **API synchrone** | Next.js API Routes + tRPC | 10-60s | CRUD, Auth, requêtes rapides |
| **IA & Tâches longues** | Supabase Edge Functions | 400s | Génération exercices, évaluations IA |
| **Background jobs** | Inngest | Illimité | Analytics, notifications, batch IA |

**Pourquoi cette séparation ?**

- Next.js serverless (Vercel) a des limites de timeout strictes
- La génération IA peut prendre 10-30s selon la complexité
- Les tâches batch (analytics, cleanup) ne doivent pas bloquer l'UX

```
┌──────────────────────────────────────────────────────────────────┐
│                    FLUX REQUÊTES                                  │
└──────────────────────────────────────────────────────────────────┘

Requête rapide (< 5s):
  Client ──► Next.js API ──► Supabase DB ──► Response

Requête IA (5-30s):
  Client ──► Next.js API ──► Supabase Edge Function ──► OpenAI/Claude
                                    │
                                    └──► Cache Redis ──► Response

Tâche longue (async):
  Client ──► Next.js API ──► Inngest Queue ──► Worker ──► Webhook/Realtime
```

---

## 2. Frontend

### 2.1 Framework principal

| Technologie | Version | Justification |
|-------------|---------|---------------|
| **Next.js** | 15.x | SSR/SSG hybride, App Router, optimisation SEO, Server Components |
| **React** | 19.x | Concurrent rendering, Suspense, Server Components natifs |
| **TypeScript** | 5.x | Type-safety, autocomplétion, refactoring sécurisé |

### 2.2 UI & Design System

| Technologie | Usage |
|-------------|-------|
| **TailwindCSS** | Utility-first CSS, design system cohérent |
| **shadcn/ui** | Composants accessibles, personnalisables, non-opinionated |
| **Framer Motion** | Animations fluides pour la gamification |
| **Lucide Icons** | Iconographie cohérente et légère |

### 2.3 State Management

| Technologie | Usage |
|-------------|-------|
| **Zustand** | État global léger (préférences, session UI) |
| **TanStack Query** | Cache serveur, synchronisation, mutations |
| **React Hook Form + Zod** | Formulaires performants avec validation |

### 2.4 Structure des dossiers

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Routes authentification
│   ├── (dashboard)/         # Espace élève/parent
│   ├── (learning)/          # Interface d'apprentissage
│   └── api/                 # API Routes + tRPC
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── learning/            # Composants exercices
│   ├── dashboard/           # Tableaux de bord
│   └── common/              # Composants partagés
├── lib/
│   ├── supabase/            # Client Supabase
│   ├── trpc/                # Configuration tRPC
│   └── utils/               # Utilitaires
├── stores/                  # Zustand stores
├── types/                   # Types TypeScript globaux
└── i18n/                    # Internationalisation
```

### 2.5 Internationalisation (i18n)

| Technologie | Usage |
|-------------|-------|
| **next-intl** | Routing i18n, traductions, formatage |
| **Format** | JSON structuré par namespace |

```
i18n/
├── locales/
│   ├── fr/
│   │   ├── common.json
│   │   ├── learning.json
│   │   └── dashboard.json
│   ├── ar/
│   └── en/
└── config.ts
```

**Support RTL** : TailwindCSS avec les classes `rtl:` pour l'arabe.

---

## 3. Backend

### 3.1 Architecture API

| Technologie | Usage |
|-------------|-------|
| **tRPC** | API type-safe end-to-end, zéro code generation |
| **Zod** | Validation des entrées/sorties |
| **Next.js API Routes** | Hébergement des endpoints |

### 3.2 Supabase (Backend-as-a-Service)

| Service | Usage |
|---------|-------|
| **Auth** | Authentification (email, OAuth, magic link) |
| **Database** | PostgreSQL managé avec Row Level Security |
| **Realtime** | Synchronisation temps réel (progression) |
| **Storage** | Assets pédagogiques (images, audio) |
| **Edge Functions** | Logique serveur distribuée |

### 3.3 Sécurité

| Mécanisme | Implémentation |
|-----------|----------------|
| **RLS (Row Level Security)** | Politiques PostgreSQL par utilisateur |
| **JWT** | Tokens signés Supabase |
| **Rate Limiting** | Upstash Redis |
| **CORS** | Configuration stricte Next.js |
| **CSP** | Content Security Policy headers |

---

## 4. Base de données

### 4.1 PostgreSQL (Supabase)

#### Schéma principal

```sql
-- Utilisateurs et profils
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('student', 'parent', 'teacher')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    birth_year INTEGER,
    preferred_language TEXT DEFAULT 'fr',
    preferred_method TEXT DEFAULT 'adaptive',
    country_program TEXT DEFAULT 'FR',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE parent_student_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- Structure pédagogique
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_key TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name_key TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(subject_id, code)
);

CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name_key TEXT NOT NULL,
    description_key TEXT,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10),
    prerequisites UUID[] DEFAULT '{}',
    estimated_duration_minutes INTEGER DEFAULT 15,
    country_programs TEXT[] DEFAULT '{FR}',
    sort_order INTEGER DEFAULT 0,
    UNIQUE(domain_id, code)
);

-- Contenu pédagogique
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('qcm', 'fill_blank', 'drag_drop', 'free_input', 'interactive')) NOT NULL,
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5) DEFAULT 3,
    content JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exercise_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exercise_id, language)
);

-- Progression élève
CREATE TABLE student_skill_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    mastery_level NUMERIC(3,2) CHECK (mastery_level BETWEEN 0 AND 1) DEFAULT 0,
    attempts_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    mastered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, skill_id)
);

CREATE TABLE exercise_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    answer JSONB,
    time_spent_seconds INTEGER,
    hints_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions d'apprentissage
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    exercises_completed INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    skills_practiced UUID[] DEFAULT '{}'
);

-- =============================================
-- GAMIFICATION & MOTIVATION (Modèle avancé)
-- =============================================

-- Règles d'achievement versionnées
CREATE TABLE achievement_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    name_key TEXT NOT NULL,
    description_key TEXT,
    icon TEXT,
    category TEXT CHECK (category IN ('skill', 'streak', 'milestone', 'special')) NOT NULL,
    target_audience TEXT CHECK (target_audience IN ('student', 'parent', 'both')) DEFAULT 'student',
    trigger_conditions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(code, version)
);

-- Exemple de trigger_conditions :
-- {
--   "type": "skill_mastery",
--   "conditions": {
--     "skill_count": 5,
--     "mastery_level": 0.8,
--     "domain": "numbers"
--   }
-- }

-- Badges obtenus par les élèves
CREATE TABLE student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES achievement_rules(id) ON DELETE CASCADE,
    rule_version INTEGER NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    context JSONB DEFAULT '{}',
    is_seen_by_student BOOLEAN DEFAULT FALSE,
    is_seen_by_parent BOOLEAN DEFAULT FALSE,
    UNIQUE(student_id, rule_id, rule_version)
);

-- Jalons pédagogiques (milestones)
CREATE TABLE learning_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_key TEXT NOT NULL,
    description_key TEXT,
    milestone_type TEXT CHECK (milestone_type IN ('domain_complete', 'level_up', 'skill_chain', 'time_goal')) NOT NULL,
    criteria JSONB NOT NULL,
    reward_type TEXT CHECK (reward_type IN ('badge', 'unlock', 'celebration')) DEFAULT 'celebration',
    reward_data JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Exemple de criteria pour milestone :
-- {
--   "type": "domain_complete",
--   "domain_id": "uuid",
--   "mastery_threshold": 0.8
-- }

-- Progression vers les jalons
CREATE TABLE student_milestone_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES learning_milestones(id) ON DELETE CASCADE,
    progress_percent NUMERIC(5,2) CHECK (progress_percent BETWEEN 0 AND 100) DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, milestone_id)
);

-- Notifications parent (distinctes des achievements enfant)
CREATE TABLE parent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    notification_type TEXT CHECK (notification_type IN (
        'milestone_reached', 
        'struggle_detected', 
        'streak_broken', 
        'weekly_summary',
        'skill_mastered',
        'recommendation'
    )) NOT NULL,
    title_key TEXT NOT NULL,
    body_key TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parent_notifications_parent ON parent_notifications(parent_id);
CREATE INDEX idx_parent_notifications_unread ON parent_notifications(parent_id, is_read) WHERE is_read = FALSE;

-- Messages d'encouragement contextuels
CREATE TABLE encouragement_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    context_type TEXT CHECK (context_type IN (
        'correct_answer',
        'incorrect_answer', 
        'streak_continue',
        'comeback',
        'struggle',
        'mastery'
    )) NOT NULL,
    min_age INTEGER,
    max_age INTEGER,
    language TEXT NOT NULL,
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Analytics anonymisées
CREATE TABLE learning_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Index optimisés

```sql
-- Index pour les requêtes fréquentes
CREATE INDEX idx_student_progress_student ON student_skill_progress(student_id);
CREATE INDEX idx_student_progress_skill ON student_skill_progress(skill_id);
CREATE INDEX idx_student_progress_mastery ON student_skill_progress(mastery_level);
CREATE INDEX idx_exercise_attempts_student ON exercise_attempts(student_id);
CREATE INDEX idx_exercise_attempts_created ON exercise_attempts(created_at DESC);
CREATE INDEX idx_exercises_skill ON exercises(skill_id);
CREATE INDEX idx_skills_domain ON skills(domain_id);

-- Index GIN pour JSONB
CREATE INDEX idx_exercises_content ON exercises USING GIN(content);
CREATE INDEX idx_exercises_metadata ON exercises USING GIN(metadata);
```

### 4.3 Row Level Security (RLS)

```sql
-- Politique: les élèves ne voient que leur propre progression
ALTER TABLE student_skill_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY student_own_progress ON student_skill_progress
    FOR ALL
    USING (
        student_id IN (
            SELECT sp.id FROM student_profiles sp
            WHERE sp.user_id = auth.uid()
        )
    );

-- Politique: les parents voient la progression de leurs enfants
CREATE POLICY parent_view_children_progress ON student_skill_progress
    FOR SELECT
    USING (
        student_id IN (
            SELECT psl.student_id FROM parent_student_links psl
            WHERE psl.parent_id = auth.uid()
        )
    );
```

### 4.4 pgvector pour l'IA

```sql
-- Extension pour les embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Table des embeddings de contenu
CREATE TABLE content_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL,
    content_id UUID NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_embeddings_vector ON content_embeddings 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## 5. Cache & Performance

### 5.1 Redis (Upstash)

| Usage | TTL |
|-------|-----|
| Sessions utilisateur | 24h |
| Cache réponses IA | 1h |
| Rate limiting | 1min |
| Leaderboards temps réel | 5min |
| Préférences utilisateur | 1h |

### 5.2 Stratégie de cache

```typescript
// Hiérarchie de cache
const cacheStrategy = {
  // L1: React Query (client)
  clientCache: {
    staleTime: 5 * 60 * 1000, // 5 min
    cacheTime: 30 * 60 * 1000, // 30 min
  },
  
  // L2: Redis (serveur)
  serverCache: {
    userProgress: 300, // 5 min
    exercises: 3600, // 1h
    aiResponses: 3600, // 1h
  },
  
  // L3: CDN (edge)
  cdnCache: {
    staticAssets: 86400 * 30, // 30 jours
    translations: 86400, // 1 jour
  }
};
```

---

## 6. Intelligence Artificielle

### 6.1 Architecture IA

```
┌────────────────────────────────────────────────────────────┐
│                    ORCHESTRATEUR IA                         │
│                     (LangChain.js)                          │
└────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   GÉNÉRATION     │ │   ADAPTATION     │ │   ÉVALUATION     │
│   DE CONTENU     │ │   PÉDAGOGIQUE    │ │   & DIAGNOSTIC   │
│   (GPT-4o)       │ │   (Claude 3.5)   │ │   (Fine-tuned)   │
└──────────────────┘ └──────────────────┘ └──────────────────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               ▼
                    ┌──────────────────┐
                    │   CACHE REDIS    │
                    │   + pgvector     │
                    └──────────────────┘
```

### 6.2 Modèles utilisés

| Modèle | Usage | Justification |
|--------|-------|---------------|
| **GPT-4o** | Génération d'exercices | Qualité, multilingue |
| **Claude 3.5 Sonnet** | Explications pédagogiques | Ton adapté enfants |
| **text-embedding-3-small** | Embeddings contenu | Recherche sémantique |

### 6.3 Prompts structurés

```typescript
// Exemple de prompt pour génération d'exercice
const exerciseGenerationPrompt = {
  system: `Tu es un expert en pédagogie ${method} pour les mathématiques.
    Langue: ${language}
    Âge cible: ${ageRange}
    Tu génères des exercices adaptés, progressifs et engageants.`,
  
  user: `Génère un exercice de type ${type} pour la compétence:
    "${skillName}"
    
    Niveau de difficulté: ${difficulty}/5
    Prérequis maîtrisés: ${prerequisites.join(', ')}
    
    Format de sortie JSON:
    {
      "question": "...",
      "options": [...],
      "correctAnswer": "...",
      "explanation": "...",
      "hint": "..."
    }`
};
```

### 6.4 Garde-fous IA

| Mécanisme | Implémentation |
|-----------|----------------|
| **Validation JSON** | Zod schemas stricts |
| **Filtrage contenu** | OpenAI Moderation API |
| **Limite tokens** | max_tokens paramétré |
| **Fallback** | Contenu pré-validé si échec IA |
| **Review humain** | Flag pour contenu généré, review asynchrone |

### 6.5 Clés API personnalisées (BYOK - Bring Your Own Key)

Le parent/adulte peut configurer ses propres clés API pour bénéficier d'une utilisation illimitée de l'IA.

#### 6.5.1 Providers supportés

| Provider | Modèles disponibles |
|----------|---------------------|
| **OpenAI** | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo |
| **Anthropic** | claude-3-5-sonnet, claude-3-opus, claude-3-haiku |
| **Plateforme** | Utilisation des crédits Lernello (par défaut) |

#### 6.5.2 Schéma base de données

```sql
-- Table des configurations IA par utilisateur
CREATE TABLE user_ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT CHECK (provider IN ('platform', 'openai', 'anthropic')) DEFAULT 'platform',
    preferred_model TEXT,
    api_key_encrypted TEXT,
    is_key_valid BOOLEAN DEFAULT FALSE,
    last_validated_at TIMESTAMPTZ,
    usage_this_month INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_user_ai_settings_user ON user_ai_settings(user_id);
```

#### 6.5.3 Sécurité des clés API

| Mesure | Implémentation |
|--------|----------------|
| **Chiffrement** | AES-256-GCM côté serveur |
| **Stockage** | Clé de chiffrement dans variable d'environnement |
| **Transmission** | HTTPS uniquement, jamais en clair côté client |
| **Validation** | Test de la clé avant sauvegarde |
| **Accès** | Déchiffrement uniquement au moment de l'appel API |

```typescript
// Service de gestion des clés API
interface AIKeyService {
  // Chiffre et stocke la clé
  saveApiKey(userId: string, provider: string, apiKey: string): Promise<void>;
  
  // Valide la clé auprès du provider
  validateApiKey(provider: string, apiKey: string): Promise<boolean>;
  
  // Récupère la clé déchiffrée (usage interne uniquement)
  getDecryptedKey(userId: string): Promise<string | null>;
  
  // Supprime la clé
  deleteApiKey(userId: string): Promise<void>;
}
```

#### 6.5.4 Interface réglages adulte

```typescript
// Structure des réglages IA
interface AISettings {
  provider: 'platform' | 'openai' | 'anthropic';
  preferredModel: string;
  hasCustomKey: boolean; // Ne jamais exposer la clé
  isKeyValid: boolean;
  usageThisMonth: number;
}

// Modèles disponibles par provider
const availableModels = {
  platform: [
    { id: 'auto', name: 'Automatique (recommandé)' }
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o (recommandé)' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (économique)' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet (recommandé)' },
    { id: 'claude-3-opus-latest', name: 'Claude 3 Opus (premium)' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku (économique)' },
  ]
};
```

#### 6.5.5 Flux d'utilisation

```
┌─────────────────────────────────────────────────────────────┐
│              FLUX CONFIGURATION CLÉ API                      │
└─────────────────────────────────────────────────────────────┘

1. Parent accède aux Réglages > Intelligence Artificielle
                    │
                    ▼
2. Choix du provider (Plateforme / OpenAI / Anthropic)
                    │
                    ▼
3. Si provider externe:
   └──► Saisie de la clé API
   └──► Validation en temps réel
   └──► Chiffrement et stockage
                    │
                    ▼
4. Sélection du modèle préféré
                    │
                    ▼
5. Sauvegarde et confirmation
```

#### 6.5.6 Fallback et gestion d'erreurs

| Scénario | Comportement |
|----------|--------------|
| Clé invalide | Notification + retour au mode plateforme |
| Quota dépassé | Notification + proposition upgrade ou BYOK |
| Erreur provider | Retry 3x puis fallback plateforme |
| Clé expirée | Email de notification + désactivation |

#### 6.5.7 Encadrement légal & UX (BYOK)

**Disclaimer obligatoire** (affiché avant activation)

```
⚠️ En utilisant votre propre clé API :

• Vous êtes responsable des coûts facturés par le provider (OpenAI/Anthropic)
• Les requêtes transitent par les serveurs du provider choisi
• Lernello ne stocke pas les réponses générées avec votre clé
• Vous pouvez désactiver cette option à tout moment

En activant cette fonctionnalité, vous acceptez ces conditions.
```

**Limites configurables par le parent**

```sql
-- Ajout à la table user_ai_settings
ALTER TABLE user_ai_settings ADD COLUMN daily_limit INTEGER DEFAULT 100;
ALTER TABLE user_ai_settings ADD COLUMN monthly_limit INTEGER DEFAULT 2000;
ALTER TABLE user_ai_settings ADD COLUMN current_daily_usage INTEGER DEFAULT 0;
ALTER TABLE user_ai_settings ADD COLUMN current_monthly_usage INTEGER DEFAULT 0;
ALTER TABLE user_ai_settings ADD COLUMN last_reset_daily TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_ai_settings ADD COLUMN last_reset_monthly TIMESTAMPTZ DEFAULT NOW();
```

**Logs d'utilisation**

```sql
-- Table de logs pour audit et détection d'abus
CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    tokens_used INTEGER NOT NULL,
    cost_estimate NUMERIC(10,6),
    request_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_logs_user ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_logs_created ON ai_usage_logs(created_at DESC);
```

**Interface parent - Tableau de bord BYOK**

| Fonctionnalité | Description |
|----------------|-------------|
| **Usage en temps réel** | Tokens consommés aujourd'hui/ce mois |
| **Historique** | Graphique des 30 derniers jours |
| **Limites** | Configurer limites quotidiennes/mensuelles |
| **Alertes** | Notification à 80% et 100% du quota |
| **Kill switch** | Bouton de désactivation immédiate |

**Détection d'abus**

```typescript
// Règles de détection automatique
const abuseDetectionRules = {
  // Requêtes anormalement fréquentes
  maxRequestsPerMinute: 10,
  maxRequestsPerHour: 100,
  
  // Patterns suspects
  flagPatterns: [
    'répétition identique > 5x',
    'requêtes à heures inhabituelles (minuit-6h)',
    'pics soudains (10x la moyenne)',
  ],
  
  // Actions automatiques
  onSuspicion: 'notify_parent',
  onConfirmedAbuse: 'disable_byok',
};
```

---

## 7. Authentification & Sécurité

### 7.1 Flux d'authentification

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUX AUTHENTIFICATION                     │
└─────────────────────────────────────────────────────────────┘

Parent (compte principal):
  Email/Password ──► Supabase Auth ──► JWT ──► Session

Élève (profil lié):
  Code PIN parental ──► Validation locale ──► Profil élève actif

OAuth supporté:
  Google / Apple ──► Supabase OAuth ──► Linking compte
```

### 7.2 Protection des données enfants (RGPD/COPPA)

| Exigence | Implémentation |
|----------|----------------|
| Consentement parental | Vérification email parent obligatoire |
| Données minimales | Pas de données personnelles enfant directes |
| Droit à l'oubli | Endpoint de suppression complète |
| Export données | Génération JSON sur demande |
| Pseudonymisation | IDs opaques, pas de PII dans analytics |

### 7.3 Headers de sécurité

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
];
```

---

## 8. Infrastructure & Déploiement

### 8.1 Environnements

| Environnement | Usage | Infrastructure |
|---------------|-------|----------------|
| **Local** | Développement | Docker Compose |
| **Preview** | Review branches | Vercel Preview |
| **Staging** | Tests intégration | Vercel + Supabase Branch |
| **Production** | Utilisateurs finaux | Vercel + Supabase Cloud |

### 8.2 Docker (développement)

```yaml
# docker-compose.yml
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  supabase-studio:
    image: supabase/studio:latest
    ports:
      - "3001:3000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

volumes:
  redis_data:
```

### 8.3 CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test:unit

  e2e:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm playwright install --with-deps
      - run: pnpm test:e2e

  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: [quality, e2e]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 8.4 Monitoring & Observabilité

| Outil | Usage |
|-------|-------|
| **Vercel Analytics** | Web Vitals, performance |
| **Sentry** | Error tracking, performance |
| **Supabase Dashboard** | Métriques DB, Auth |
| **Upstash Console** | Métriques Redis |

---

## 9. Tests

### 9.1 Stratégie de tests

| Type | Outil | Couverture cible |
|------|-------|------------------|
| **Unit** | Vitest | 80% logique métier |
| **Integration** | Vitest + MSW | API endpoints |
| **E2E** | Playwright | Parcours critiques |
| **Visual** | Playwright | Composants UI |

### 9.2 Structure des tests

```
tests/
├── unit/
│   ├── lib/
│   │   ├── mastery-calculator.test.ts
│   │   └── exercise-generator.test.ts
│   └── components/
├── integration/
│   ├── api/
│   │   ├── progress.test.ts
│   │   └── exercises.test.ts
│   └── hooks/
├── e2e/
│   ├── auth.spec.ts
│   ├── learning-flow.spec.ts
│   └── parent-dashboard.spec.ts
└── fixtures/
    ├── exercises.json
    └── users.json
```

---

## 10. APIs & Endpoints

### 10.1 Structure tRPC

```typescript
// src/lib/trpc/routers/index.ts
export const appRouter = router({
  auth: authRouter,
  student: studentRouter,
  progress: progressRouter,
  exercises: exercisesRouter,
  learning: learningRouter,
  ai: aiRouter,
  parent: parentRouter,
  analytics: analyticsRouter,
});

// Exemple router
export const progressRouter = router({
  getBySkill: protectedProcedure
    .input(z.object({ skillId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.studentSkillProgress.findFirst({
        where: {
          studentId: ctx.session.studentId,
          skillId: input.skillId,
        },
      });
    }),
  
  updateMastery: protectedProcedure
    .input(z.object({
      skillId: z.string().uuid(),
      isCorrect: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Logique de mise à jour du mastery
    }),
});
```

### 10.2 Endpoints principaux

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/trpc/student.profile` | GET | Profil élève actif |
| `/api/trpc/progress.skills` | GET | Progression par compétences |
| `/api/trpc/exercises.next` | GET | Prochain exercice recommandé |
| `/api/trpc/exercises.submit` | POST | Soumettre réponse |
| `/api/trpc/learning.session` | POST | Démarrer/terminer session |
| `/api/trpc/ai.generateExercise` | POST | Générer exercice IA |
| `/api/trpc/parent.dashboard` | GET | Données tableau de bord parent |

---

## 11. Performance & Optimisation

### 11.1 Objectifs Core Web Vitals

| Métrique | Cible | Stratégie |
|----------|-------|-----------|
| **LCP** | < 2.5s | Server Components, Image optimization |
| **FID** | < 100ms | Code splitting, lazy loading |
| **CLS** | < 0.1 | Skeleton loaders, fixed dimensions |
| **TTFB** | < 200ms | Edge caching, Supabase connection pooling |

### 11.2 Optimisations Next.js

```typescript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      { hostname: '*.supabase.co' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/*'],
  },
};
```

### 11.3 Lazy Loading composants lourds

```typescript
// Chargement dynamique des composants exercices
const InteractiveExercise = dynamic(
  () => import('@/components/learning/InteractiveExercise'),
  { 
    loading: () => <ExerciseSkeleton />,
    ssr: false 
  }
);
```

---

## 12. Accessibilité (a11y)

### 12.1 Standards

| Standard | Niveau cible |
|----------|--------------|
| **WCAG** | 2.1 AA |
| **Navigation clavier** | Complète |
| **Screen readers** | Compatible |
| **Contraste** | Ratio 4.5:1 minimum |

### 12.2 Implémentation

```typescript
// Composant accessible
export function ExerciseButton({ 
  children, 
  isCorrect,
  ...props 
}: ExerciseButtonProps) {
  return (
    <button
      role="option"
      aria-selected={props.selected}
      aria-describedby={isCorrect ? 'correct-feedback' : 'incorrect-feedback'}
      className={cn(
        "focus-visible:ring-2 focus-visible:ring-offset-2",
        "focus-visible:ring-primary"
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

---

## 13. Offline & PWA (Phase 2)

### 13.1 Service Worker Strategy

| Ressource | Stratégie |
|-----------|-----------|
| App shell | Cache first |
| Exercices | Stale while revalidate |
| Progression | Network first + queue |
| Assets | Cache first (30 jours) |

### 13.2 Sync différé

```typescript
// Background sync pour progression offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

async function syncProgress() {
  const queue = await getOfflineQueue();
  for (const item of queue) {
    await api.progress.sync(item);
  }
}
```

---

## 14. Scalabilité

### 14.1 Projections de charge

| Phase | Utilisateurs | Requêtes/min | Stratégie |
|-------|--------------|--------------|-----------|
| MVP | 1K | 500 | Single region |
| Growth | 50K | 25K | Multi-region + cache |
| Scale | 500K | 250K | CDN + read replicas |

### 14.2 Stratégies de scaling

| Composant | Scaling |
|-----------|---------|
| **Frontend** | Vercel Edge (auto-scale) |
| **Database** | Supabase (connection pooling, read replicas) |
| **Redis** | Upstash (serverless, auto-scale) |
| **IA** | Queue + rate limiting + cache agressif |

---

## 15. Estimations & Planning

### 15.1 Phase 1 — MVP (12 semaines)

| Semaine | Livrables |
|---------|-----------|
| 1-2 | Setup projet, CI/CD, Design System |
| 3-4 | Auth, Profils, Base de données |
| 5-6 | Structure compétences, Exercices (types basiques) |
| 7-8 | Parcours élève, Progression |
| 9-10 | Intégration IA, Génération exercices |
| 11-12 | Dashboard parent, Tests, Polish |

### 15.2 Métriques de succès technique

| Métrique | Cible |
|----------|-------|
| Uptime | 99.9% |
| Temps de réponse API | < 200ms p95 |
| Core Web Vitals | Tous "Good" |
| Couverture tests | > 80% |
| Incidents critiques/mois | 0 |

---

## 16. Dépendances principales

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "@trpc/server": "^11.0.0",
    "@trpc/client": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@tanstack/react-query": "^5.50.0",
    "zustand": "^4.5.0",
    "zod": "^3.23.0",
    "next-intl": "^3.17.0",
    "tailwindcss": "^3.4.0",
    "framer-motion": "^11.3.0",
    "lucide-react": "^0.400.0",
    "openai": "^4.50.0",
    "langchain": "^0.2.0",
    "@upstash/redis": "^1.34.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.9.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "@playwright/test": "^1.45.0",
    "eslint": "^9.0.0",
    "prettier": "^3.3.0"
  }
}
```

---

## 17. Variables d'environnement

```bash
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Redis
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# IA
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Monitoring
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=
```

---

## ✅ Résumé des choix technologiques

| Domaine | Technologie | Raison |
|---------|-------------|--------|
| **Frontend** | Next.js 15 + React 19 | Performance, SEO, DX |
| **Styling** | TailwindCSS + shadcn/ui | Design minimaliste, accessibilité |
| **Backend** | tRPC + Supabase | Type-safety, temps réel, auth intégrée |
| **Database** | PostgreSQL + pgvector | Relationnel + IA embeddings |
| **Cache** | Redis (Upstash) | Performance, sessions, rate limiting |
| **IA** | OpenAI + LangChain | Qualité génération, orchestration |
| **Infra** | Docker + Vercel | Dev local cohérent, déploiement simplifié |
| **Tests** | Vitest + Playwright | Rapide, moderne, E2E complet |

Ce stack garantit une plateforme **performante**, **scalable**, **type-safe** et **maintenable** sur le long terme.
