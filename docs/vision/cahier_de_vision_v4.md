# 📘 Cahier de Vision – V4
## La Compétence Universelle : Présentation, Format et Adaptabilité
### Évolution stratégique centrée sur le cœur pédagogique de Lernello

---

# PRÉAMBULE

Cette version V4 se concentre exclusivement sur **la compétence** — l'unité atomique d'apprentissage de Lernello. L'objectif est de transformer la compétence actuelle (rigide, orientée mathématiques) en un **modèle universel, flexible et profondément adaptable** capable de :

- S'adapter à **n'importe quelle matière** (maths, français, histoire, sciences, langues, arts, musique...)
- Couvrir **n'importe quel sujet** (académique, professionnel, loisir, vie quotidienne)
- Supporter **n'importe quelle méthode pédagogique** (traditionnelle, Montessori, Freinet, classe inversée, apprentissage par projet...)
- Offrir une **présentation personnalisée** selon le profil de l'apprenant

---

# PARTIE 1 : ANALYSE CRITIQUE DE LA COMPÉTENCE ACTUELLE

## 1.1 Structure existante

### Tables actuelles

| Table | Champs clés | Limitation |
|-------|-------------|------------|
| `skills` | code, name_key, difficulty_level, prerequisites | Métadonnées pauvres, pas de typage sémantique |
| `skill_content` | objective, theory, synthesis | Structure rigide, mono-format (texte) |
| `skill_examples` | problem, solution, explanation | Format unique, pas de variantes |
| `exercises` | type (qcm, fill_blank...), content | Types limités, pas d'adaptabilité matière |

### Forces actuelles

| Force | Description |
|-------|-------------|
| **Structure hiérarchique claire** | Subject → Domain → Skill permet une organisation logique |
| **Prérequis gérés** | Le champ `prerequisites` permet des parcours adaptatifs |
| **Multi-pays** | `country_programs` permet l'adaptation aux programmes nationaux |
| **Génération IA** | Infrastructure existante pour le contenu auto-généré |

### Faiblesses identifiées

| Faiblesse | Impact | Gravité |
|-----------|--------|---------|
| **Mono-format textuel** | Impossible d'intégrer vidéo, audio, animations | 🔴 Critique |
| **Absence de typage sémantique** | La compétence "additionner" et "conjuguer" ont la même structure | 🔴 Critique |
| **Rigidité pédagogique** | Un seul champ `pedagogical_method` sans impact réel | 🟠 Haute |
| **Pas de variantes de présentation** | Même contenu pour tous les profils | 🟠 Haute |
| **Exercices déconnectés du contexte** | Pas de lien avec la vie réelle ou les intérêts de l'élève | 🟡 Moyenne |
| **Pas de compétences transversales** | Impossible de lier "résolution de problèmes" à plusieurs matières | 🟡 Moyenne |

## 1.2 Opportunités inexploitées

1. **Personnalisation profonde** : Adapter la présentation selon le style d'apprentissage (visuel, auditif, kinesthésique)
2. **Contextualisation dynamique** : Ancrer les exercices dans les centres d'intérêt de l'enfant
3. **Multi-modalité** : Offrir plusieurs chemins vers la maîtrise (texte, vidéo, manipulation, jeu)
4. **Métacognition** : Aider l'enfant à comprendre COMMENT il apprend, pas seulement QUOI
5. **Transfert de compétences** : Montrer comment une compétence s'applique dans différents contextes

---

# PARTIE 2 : LA COMPÉTENCE UNIVERSELLE — NOUVEAU MODÈLE

## 2.1 Philosophie fondamentale

> **Une compétence n'est pas un contenu à mémoriser, mais une capacité à agir dans un contexte donné.**

### Les 5 dimensions d'une compétence universelle

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPÉTENCE UNIVERSELLE                   │
├─────────────────────────────────────────────────────────────┤
│  1. IDENTITÉ        Quoi ? (définition sémantique)          │
│  2. MANIFESTATION   Comment ça se voit ? (observables)      │
│  3. ACQUISITION     Comment on l'apprend ? (parcours)       │
│  4. APPLICATION     Où ça sert ? (contextes)                │
│  5. ÉVOLUTION       Vers quoi ça mène ? (progression)       │
└─────────────────────────────────────────────────────────────┘
```

## 2.2 Nouveau modèle de données

### Table `skills` (évoluée)

```sql
-- Évolution de la table skills
ALTER TABLE skills ADD COLUMN IF NOT EXISTS skill_type TEXT;
-- Types : cognitive, procedural, metacognitive, socio_emotional, psychomotor

ALTER TABLE skills ADD COLUMN IF NOT EXISTS domain_type TEXT;
-- Types : academic, life_skill, creative, physical, social

ALTER TABLE skills ADD COLUMN IF NOT EXISTS bloom_level INTEGER;
-- 1: Mémoriser, 2: Comprendre, 3: Appliquer, 4: Analyser, 5: Évaluer, 6: Créer

ALTER TABLE skills ADD COLUMN IF NOT EXISTS transferability TEXT;
-- Types : specific (lié à un domaine), transferable (multi-domaines), universal

ALTER TABLE skills ADD COLUMN IF NOT EXISTS learning_styles TEXT[];
-- ['visual', 'auditory', 'kinesthetic', 'reading_writing']

ALTER TABLE skills ADD COLUMN IF NOT EXISTS age_adaptations JSONB;
-- { "6-7": {...}, "8-9": {...}, "10-11": {...} }

ALTER TABLE skills ADD COLUMN IF NOT EXISTS cultural_contexts TEXT[];
-- ['western', 'asian', 'african', 'universal']

ALTER TABLE skills ADD COLUMN IF NOT EXISTS tags TEXT[];
-- Tags libres pour recherche et recommandation
```

### Nouvelle table `skill_presentations`

```sql
CREATE TABLE skill_presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    
    -- Identité de la présentation
    presentation_type TEXT NOT NULL,
    -- Types : 'story', 'direct', 'discovery', 'game', 'project', 'dialogue'
    
    target_profile JSONB NOT NULL DEFAULT '{}',
    -- { "age_range": [6,8], "learning_style": "visual", "interests": ["sport"] }
    
    -- Contenu structuré (non plus texte brut)
    content_blocks JSONB NOT NULL,
    -- Array de blocs : voir structure ci-dessous
    
    -- Métadonnées
    language TEXT NOT NULL DEFAULT 'fr',
    pedagogical_approach TEXT,
    -- 'montessori', 'freinet', 'traditional', 'flipped', 'project_based'
    
    estimated_duration_minutes INTEGER DEFAULT 15,
    engagement_score FLOAT DEFAULT 0,
    effectiveness_score FLOAT DEFAULT 0,
    
    is_default BOOLEAN DEFAULT FALSE,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Structure des `content_blocks`

```json
{
  "blocks": [
    {
      "type": "hook",
      "format": "story",
      "content": {
        "text": "Imagine que tu es un explorateur...",
        "character": "lumi",
        "emotion": "curious"
      }
    },
    {
      "type": "concept",
      "format": "visual",
      "content": {
        "image_url": "/assets/fractions-pizza.svg",
        "alt_text": "Une pizza coupée en parts égales",
        "caption": "Couper en parts égales, c'est diviser !"
      }
    },
    {
      "type": "concept",
      "format": "animation",
      "content": {
        "animation_id": "fraction-visual-intro",
        "interactive": true,
        "narration": "Regarde ce qui se passe quand on coupe..."
      }
    },
    {
      "type": "example",
      "format": "guided",
      "content": {
        "problem": "Tu as 8 bonbons à partager entre 2 amis...",
        "steps": [
          { "instruction": "Combien d'amis ?", "answer": "2" },
          { "instruction": "Combien de bonbons chacun ?", "answer": "4" }
        ],
        "visual_support": "/assets/candy-division.svg"
      }
    },
    {
      "type": "practice",
      "format": "micro_exercise",
      "content": {
        "exercise_template_id": "division-simple",
        "difficulty": 1,
        "feedback_style": "encouraging"
      }
    },
    {
      "type": "synthesis",
      "format": "mnemonic",
      "content": {
        "phrase": "Partager, c'est diviser en parts égales !",
        "visual_anchor": "🍕➗👨‍👩‍👧‍👦",
        "audio_id": "synthesis-division"
      }
    },
    {
      "type": "real_world",
      "format": "scenario",
      "content": {
        "context": "Au goûter d'anniversaire",
        "situation": "Tu dois partager le gâteau entre tous les invités",
        "connection_to_skill": "C'est exactement une division !"
      }
    }
  ]
}
```

### Types de blocs disponibles

| Type | Description | Formats supportés |
|------|-------------|-------------------|
| `hook` | Accroche pour capter l'attention | story, question, challenge, mystery, game |
| `concept` | Explication du concept | text, visual, animation, video, audio, interactive |
| `example` | Exemple guidé | guided, worked_out, video_demo, peer_example |
| `practice` | Mini-exercice intégré | micro_exercise, quick_check, drag_drop |
| `synthesis` | Résumé mémorisable | mnemonic, visual_summary, key_points, song |
| `real_world` | Lien avec la vie réelle | scenario, career, hobby, daily_life |
| `metacognition` | Réflexion sur l'apprentissage | self_check, strategy_tip, growth_mindset |
| `extension` | Pour aller plus loin | deep_dive, curiosity, historical, fun_fact |

### Nouvelle table `skill_contexts`

```sql
CREATE TABLE skill_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    
    context_type TEXT NOT NULL,
    -- 'daily_life', 'career', 'hobby', 'other_subject', 'game', 'story'
    
    context_name TEXT NOT NULL,
    -- Ex: "Cuisine", "Architecte", "Football", "Sciences", "Minecraft"
    
    description TEXT NOT NULL,
    -- Comment la compétence s'applique dans ce contexte
    
    example_situation TEXT,
    -- Situation concrète
    
    exercise_templates JSONB DEFAULT '[]',
    -- Templates d'exercices contextualisés
    
    interest_tags TEXT[] DEFAULT '{}',
    -- Pour matcher avec les intérêts de l'élève
    
    age_appropriate_range INT4RANGE DEFAULT '[6,18]',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Nouvelle table `skill_progressions`

```sql
CREATE TABLE skill_progressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    
    progression_type TEXT NOT NULL,
    -- 'prerequisite', 'leads_to', 'parallel', 'reinforces', 'applies_in'
    
    related_skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    
    relationship_strength FLOAT DEFAULT 1.0,
    -- 0.0 à 1.0 : force du lien
    
    description TEXT,
    -- Explication du lien
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(skill_id, related_skill_id, progression_type)
);
```

---

# PARTIE 3 : ADAPTABILITÉ PAR MATIÈRE

## 3.1 Le problème de l'homogénéité

Actuellement, toutes les compétences ont la même structure, que ce soit :
- **Mathématiques** : Additionner des nombres à 2 chiffres
- **Français** : Conjuguer les verbes du 1er groupe au présent
- **Histoire** : Situer la Révolution française dans le temps
- **Sciences** : Comprendre le cycle de l'eau
- **Musique** : Reconnaître les notes sur une portée

Chacune de ces compétences nécessite une **approche pédagogique différente**.

## 3.2 Profils de matière

### Nouvelle table `subject_profiles`

```sql
CREATE TABLE subject_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE UNIQUE,
    
    -- Nature de la matière
    knowledge_type TEXT NOT NULL,
    -- 'declarative' (savoir), 'procedural' (savoir-faire), 'conditional' (savoir-quand)
    
    primary_modality TEXT NOT NULL,
    -- 'logical', 'linguistic', 'visual_spatial', 'musical', 'bodily', 'interpersonal'
    
    -- Structure des compétences dans cette matière
    skill_structure JSONB NOT NULL,
    -- Définit les champs spécifiques à cette matière
    
    -- Templates de présentation par défaut
    default_presentation_templates JSONB DEFAULT '[]',
    
    -- Types d'exercices privilégiés
    preferred_exercise_types TEXT[] DEFAULT '{}',
    
    -- Configuration de la progression
    progression_model TEXT DEFAULT 'linear',
    -- 'linear', 'spiral', 'mastery_based', 'project_based'
    
    -- Configuration de l'évaluation
    assessment_approach JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3.3 Exemples de profils par matière

### Mathématiques

```json
{
  "knowledge_type": "procedural",
  "primary_modality": "logical",
  "skill_structure": {
    "required_fields": ["objective", "theory", "procedure_steps", "examples"],
    "optional_fields": ["visual_representation", "common_errors", "mental_math_tips"],
    "exercise_types": ["qcm", "free_input", "drag_drop", "interactive_manipulation"],
    "feedback_style": "immediate_with_steps"
  },
  "default_presentation_templates": [
    {
      "name": "Découverte guidée",
      "blocks": ["hook_problem", "manipulation", "concept", "examples", "practice", "synthesis"]
    },
    {
      "name": "Méthode traditionnelle",
      "blocks": ["concept", "rule", "examples", "exercises", "synthesis"]
    }
  ],
  "progression_model": "mastery_based",
  "assessment_approach": {
    "mastery_threshold": 80,
    "spaced_repetition": true,
    "error_analysis": true
  }
}
```

### Français (Conjugaison)

```json
{
  "knowledge_type": "procedural",
  "primary_modality": "linguistic",
  "skill_structure": {
    "required_fields": ["rule", "pattern", "examples", "exceptions"],
    "optional_fields": ["etymology", "memory_trick", "common_errors"],
    "exercise_types": ["fill_blank", "conjugation_table", "sentence_completion", "dictation"],
    "feedback_style": "highlight_pattern"
  },
  "default_presentation_templates": [
    {
      "name": "Découverte par l'observation",
      "blocks": ["hook_text", "observation", "pattern_discovery", "rule", "practice", "exceptions"]
    }
  ],
  "progression_model": "spiral",
  "assessment_approach": {
    "context_variety": true,
    "oral_component": true
  }
}
```

### Histoire

```json
{
  "knowledge_type": "declarative",
  "primary_modality": "visual_spatial",
  "skill_structure": {
    "required_fields": ["period", "key_events", "key_figures", "causes", "consequences"],
    "optional_fields": ["primary_sources", "maps", "timeline_position", "connections_today"],
    "exercise_types": ["timeline", "qcm", "source_analysis", "map_interaction"],
    "feedback_style": "contextual_explanation"
  },
  "default_presentation_templates": [
    {
      "name": "Récit historique",
      "blocks": ["hook_story", "context", "narrative", "key_facts", "timeline", "connections"]
    }
  ],
  "progression_model": "thematic",
  "assessment_approach": {
    "source_criticism": true,
    "causality_understanding": true
  }
}
```

### Sciences

```json
{
  "knowledge_type": "conditional",
  "primary_modality": "logical",
  "skill_structure": {
    "required_fields": ["phenomenon", "explanation", "scientific_method", "real_world_examples"],
    "optional_fields": ["experiment", "hypothesis", "variables", "data_interpretation"],
    "exercise_types": ["experiment_simulation", "hypothesis_testing", "data_analysis", "qcm"],
    "feedback_style": "scientific_reasoning"
  },
  "default_presentation_templates": [
    {
      "name": "Démarche d'investigation",
      "blocks": ["observation", "question", "hypothesis", "experiment", "conclusion", "application"]
    }
  ],
  "progression_model": "inquiry_based",
  "assessment_approach": {
    "process_over_content": true,
    "experimental_skills": true
  }
}
```

### Musique

```json
{
  "knowledge_type": "procedural",
  "primary_modality": "musical",
  "skill_structure": {
    "required_fields": ["concept", "audio_examples", "practice_exercises"],
    "optional_fields": ["notation", "history", "famous_pieces"],
    "exercise_types": ["audio_recognition", "rhythm_practice", "notation_reading", "singing"],
    "feedback_style": "audio_with_visual"
  },
  "default_presentation_templates": [
    {
      "name": "Écoute active",
      "blocks": ["audio_hook", "guided_listening", "concept", "practice", "creation"]
    }
  ],
  "progression_model": "skill_tree",
  "assessment_approach": {
    "performance_based": true,
    "ear_training": true
  }
}
```

---

# PARTIE 4 : ADAPTABILITÉ PAR MÉTHODE PÉDAGOGIQUE

## 4.1 Les grandes approches pédagogiques

| Approche | Philosophie | Mots-clés |
|----------|-------------|-----------|
| **Traditionnelle** | Transmission directe du savoir | Explication → Exercices → Évaluation |
| **Montessori** | L'enfant acteur, manipulation concrète | Autonomie, matériel, auto-correction |
| **Freinet** | Apprentissage par l'expérience et le projet | Tâtonnement, expression, coopération |
| **Classe inversée** | Contenu à la maison, pratique en classe | Vidéo, autonomie, accompagnement |
| **Apprentissage par problèmes** | Le problème comme point de départ | Situation-problème, recherche, solution |
| **Gamification** | Le jeu comme vecteur d'apprentissage | Défis, récompenses, progression |

## 4.2 Configuration par méthode pédagogique

### Nouvelle table `pedagogical_methods`

```sql
CREATE TABLE pedagogical_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Configuration de la présentation
    presentation_config JSONB NOT NULL,
    
    -- Configuration des exercices
    exercise_config JSONB NOT NULL,
    
    -- Configuration du feedback
    feedback_config JSONB NOT NULL,
    
    -- Configuration de la progression
    progression_config JSONB NOT NULL,
    
    -- Configuration de l'évaluation
    assessment_config JSONB NOT NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4.3 Exemples de configuration par méthode

### Méthode Montessori

```json
{
  "code": "montessori",
  "name": "Montessori",
  "presentation_config": {
    "structure": ["manipulation_first", "concept_emerges", "abstraction_later"],
    "teacher_role": "guide",
    "student_role": "explorer",
    "materials": "concrete_manipulatives",
    "pacing": "self_directed",
    "blocks_priority": ["interactive_manipulation", "self_discovery", "peer_teaching"]
  },
  "exercise_config": {
    "types_priority": ["manipulation", "sorting", "matching", "building"],
    "correction": "self_correction",
    "repetition": "until_mastery",
    "context": "prepared_environment"
  },
  "feedback_config": {
    "timing": "built_into_material",
    "source": "self_discovery",
    "tone": "neutral_observational",
    "show_correct_answer": false
  },
  "progression_config": {
    "model": "individual_mastery",
    "prerequisites": "strict",
    "branching": "allowed",
    "pace": "student_controlled"
  },
  "assessment_config": {
    "method": "observation",
    "frequency": "continuous",
    "comparison": "self_only",
    "visible_to_student": true
  }
}
```

### Méthode Traditionnelle

```json
{
  "code": "traditional",
  "name": "Traditionnelle",
  "presentation_config": {
    "structure": ["rule_first", "examples", "practice"],
    "teacher_role": "transmitter",
    "student_role": "receiver",
    "materials": "textbook",
    "pacing": "teacher_directed",
    "blocks_priority": ["concept", "rule", "examples", "exercises"]
  },
  "exercise_config": {
    "types_priority": ["qcm", "fill_blank", "free_input"],
    "correction": "teacher_correction",
    "repetition": "scheduled",
    "context": "academic"
  },
  "feedback_config": {
    "timing": "immediate",
    "source": "system",
    "tone": "evaluative",
    "show_correct_answer": true
  },
  "progression_config": {
    "model": "linear",
    "prerequisites": "flexible",
    "branching": "limited",
    "pace": "group_based"
  },
  "assessment_config": {
    "method": "testing",
    "frequency": "periodic",
    "comparison": "norm_referenced",
    "visible_to_student": true
  }
}
```

### Classe Inversée

```json
{
  "code": "flipped",
  "name": "Classe inversée",
  "presentation_config": {
    "structure": ["video_at_home", "practice_in_class", "deep_dive_guided"],
    "teacher_role": "coach",
    "student_role": "active_learner",
    "materials": "video_interactive",
    "pacing": "hybrid",
    "blocks_priority": ["video", "self_check", "collaborative_practice"]
  },
  "exercise_config": {
    "types_priority": ["interactive", "collaborative", "project"],
    "correction": "peer_and_teacher",
    "repetition": "as_needed",
    "context": "applied"
  },
  "feedback_config": {
    "timing": "during_practice",
    "source": "multiple",
    "tone": "coaching",
    "show_correct_answer": "after_attempt"
  },
  "progression_config": {
    "model": "competency_based",
    "prerequisites": "diagnostic",
    "branching": "extensive",
    "pace": "differentiated"
  },
  "assessment_config": {
    "method": "formative_continuous",
    "frequency": "continuous",
    "comparison": "criterion_referenced",
    "visible_to_student": true
  }
}
```

### Apprentissage par le Jeu

```json
{
  "code": "game_based",
  "name": "Apprentissage par le jeu",
  "presentation_config": {
    "structure": ["challenge_first", "learn_to_win", "mastery_unlocks"],
    "teacher_role": "game_master",
    "student_role": "player",
    "materials": "game_mechanics",
    "pacing": "engagement_driven",
    "blocks_priority": ["challenge", "mini_game", "reward", "story"]
  },
  "exercise_config": {
    "types_priority": ["game", "challenge", "puzzle", "competition"],
    "correction": "game_feedback",
    "repetition": "voluntary_replay",
    "context": "game_narrative"
  },
  "feedback_config": {
    "timing": "instant",
    "source": "game_system",
    "tone": "celebratory",
    "show_correct_answer": "as_power_up"
  },
  "progression_config": {
    "model": "level_based",
    "prerequisites": "skill_tree",
    "branching": "player_choice",
    "pace": "challenge_adjusted"
  },
  "assessment_config": {
    "method": "achievement_tracking",
    "frequency": "continuous",
    "comparison": "leaderboard_optional",
    "visible_to_student": true
  }
}
```

---

# PARTIE 5 : PRÉSENTATION ADAPTATIVE

## 5.1 Principe fondamental

> **Une compétence, mille présentations possibles.**

La même compétence (ex: "Comprendre les fractions") peut être présentée de façons radicalement différentes selon :

1. **L'âge de l'apprenant** : 6 ans vs 10 ans
2. **Son style d'apprentissage** : visuel vs auditif vs kinesthésique
3. **Ses centres d'intérêt** : football, cuisine, jeux vidéo
4. **La méthode pédagogique choisie** : Montessori vs traditionnelle
5. **Son niveau actuel** : découverte vs révision vs approfondissement
6. **Le moment de la journée** : session longue vs micro-session

## 5.2 Système de sélection de présentation

### Algorithme de choix

```
ENTRÉE:
  - skill_id
  - student_profile (age, learning_style, interests, method_preference)
  - context (time_available, energy_level, previous_attempts)

PROCESSUS:
  1. Récupérer toutes les présentations pour cette compétence
  2. Filtrer par langue et âge approprié
  3. Scorer chaque présentation selon :
     - Match avec learning_style (+30 points)
     - Match avec interests (+25 points)
     - Match avec pedagogical_method (+20 points)
     - Engagement score historique (+15 points)
     - Effectiveness score historique (+10 points)
  4. Appliquer bonus/malus selon contexte :
     - Temps disponible : favoriser formats courts ou longs
     - Énergie : favoriser formats engageants ou calmes
     - Tentatives précédentes : varier les approches
  5. Sélectionner la présentation avec le score le plus élevé
  
SORTIE:
  - presentation_id
  - confidence_score
```

### Table de tracking des présentations

```sql
CREATE TABLE presentation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES skill_presentations(id),
    student_id UUID REFERENCES students(id),
    
    -- Métriques d'engagement
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    time_spent_seconds INTEGER,
    blocks_viewed INTEGER,
    interactions_count INTEGER,
    
    -- Métriques d'efficacité
    pre_assessment_score FLOAT,
    post_assessment_score FLOAT,
    retention_score_7d FLOAT,
    
    -- Feedback explicite
    student_rating INTEGER CHECK (student_rating BETWEEN 1 AND 5),
    student_feedback TEXT,
    
    -- Contexte
    device_type TEXT,
    session_context JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 5.3 Génération IA de présentations

### Prompt template pour génération de présentation

```
Tu es un expert en pédagogie différenciée. Génère une présentation de compétence.

COMPÉTENCE: {skill_name}
OBJECTIF: {skill_objective}
MATIÈRE: {subject_name}

PROFIL ÉLÈVE:
- Âge: {age} ans
- Style d'apprentissage préféré: {learning_style}
- Centres d'intérêt: {interests}
- Niveau actuel: {current_level}

MÉTHODE PÉDAGOGIQUE: {pedagogical_method}
CONFIGURATION: {method_config}

CONTRAINTES:
- Durée cible: {duration} minutes
- Format principal: {preferred_format}
- Langue: {language}

Génère une présentation structurée en blocs JSON suivant ce schéma:
{block_schema}

RÈGLES:
1. Commence par un hook engageant lié aux intérêts de l'élève
2. Utilise des exemples concrets adaptés à son âge
3. Inclus au minimum 1 bloc interactif
4. Termine par une synthèse mémorisable
5. Respecte strictement la méthode pédagogique choisie
```

---

# PARTIE 6 : TYPES D'EXERCICES UNIVERSELS

## 6.1 Taxonomie des exercices

### Par nature cognitive (Bloom)

| Niveau Bloom | Types d'exercices | Exemples |
|--------------|------------------|----------|
| **1. Mémoriser** | flashcard, qcm_simple, association | "Quelle est la capitale de la France ?" |
| **2. Comprendre** | qcm_explanation, reformulation, vrai_faux_justifié | "Explique avec tes mots ce qu'est une fraction" |
| **3. Appliquer** | fill_blank, calcul, conjugaison, procedure | "Conjugue le verbe manger au présent" |
| **4. Analyser** | tri, classification, comparaison, déduction | "Classe ces nombres du plus petit au plus grand" |
| **5. Évaluer** | critique, choix_justifié, débat | "Quel personnage a eu raison ? Justifie" |
| **6. Créer** | production, projet, invention | "Invente un problème de maths avec des pizzas" |

### Par modalité

| Modalité | Types d'exercices | Matières privilégiées |
|----------|------------------|----------------------|
| **Textuel** | qcm, fill_blank, free_input | Toutes |
| **Visuel** | matching, sorting, diagram_completion | Maths, Sciences, Histoire |
| **Auditif** | dictation, audio_recognition, transcription | Langues, Musique |
| **Kinesthésique** | drag_drop, manipulation, simulation | Maths, Sciences, Géographie |
| **Interactif** | simulation, game, exploration | Sciences, Techno |

## 6.2 Structure d'exercice universelle

### Nouvelle table `exercise_templates`

```sql
CREATE TABLE exercise_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Classification
    exercise_type TEXT NOT NULL,
    bloom_level INTEGER CHECK (bloom_level BETWEEN 1 AND 6),
    modality TEXT NOT NULL,
    
    -- Compatibilité
    compatible_subjects TEXT[] DEFAULT '{}',
    compatible_skills_types TEXT[] DEFAULT '{}',
    
    -- Structure
    content_schema JSONB NOT NULL,
    -- Schéma JSON décrivant la structure du contenu
    
    -- Rendu
    renderer_component TEXT NOT NULL,
    -- Nom du composant React à utiliser
    
    -- Évaluation
    evaluation_type TEXT NOT NULL,
    -- 'auto', 'ai_assisted', 'manual'
    
    evaluation_config JSONB DEFAULT '{}',
    
    -- Métadonnées
    supports_hints BOOLEAN DEFAULT TRUE,
    supports_partial_credit BOOLEAN DEFAULT FALSE,
    estimated_time_seconds INTEGER DEFAULT 60,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 6.3 Exemples de templates d'exercices

### Template : QCM Universel

```json
{
  "code": "qcm_universal",
  "name": "Question à choix multiples",
  "exercise_type": "qcm",
  "bloom_level": 2,
  "modality": "textual",
  "compatible_subjects": ["*"],
  "content_schema": {
    "type": "object",
    "required": ["question", "options", "correct_index"],
    "properties": {
      "question": {
        "type": "string",
        "description": "La question posée"
      },
      "question_media": {
        "type": "object",
        "description": "Média optionnel (image, audio, vidéo)",
        "properties": {
          "type": { "enum": ["image", "audio", "video"] },
          "url": { "type": "string" }
        }
      },
      "options": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "text": { "type": "string" },
            "media": { "type": "object" }
          }
        },
        "minItems": 2,
        "maxItems": 6
      },
      "correct_index": { "type": "integer" },
      "explanations": {
        "type": "object",
        "properties": {
          "correct": { "type": "string" },
          "incorrect": { "type": "array", "items": { "type": "string" } }
        }
      }
    }
  },
  "renderer_component": "QCMExercise",
  "evaluation_type": "auto"
}
```

### Template : Texte à trous adaptatif

```json
{
  "code": "fill_blank_adaptive",
  "name": "Texte à compléter",
  "exercise_type": "fill_blank",
  "bloom_level": 3,
  "modality": "textual",
  "compatible_subjects": ["french", "languages", "history", "sciences"],
  "content_schema": {
    "type": "object",
    "required": ["text_with_blanks", "answers"],
    "properties": {
      "text_with_blanks": {
        "type": "string",
        "description": "Texte avec {0}, {1}... pour les trous"
      },
      "answers": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "correct": { "type": "array", "items": { "type": "string" } },
            "hint": { "type": "string" },
            "input_type": { "enum": ["free", "dropdown", "drag"] }
          }
        }
      },
      "context_image": { "type": "string" },
      "audio_support": { "type": "string" }
    }
  },
  "renderer_component": "FillBlankExercise",
  "evaluation_type": "auto",
  "evaluation_config": {
    "case_sensitive": false,
    "accent_sensitive": true,
    "allow_synonyms": true
  }
}
```

### Template : Manipulation interactive (Maths)

```json
{
  "code": "interactive_manipulation",
  "name": "Manipulation interactive",
  "exercise_type": "interactive",
  "bloom_level": 3,
  "modality": "kinesthetic",
  "compatible_subjects": ["math"],
  "content_schema": {
    "type": "object",
    "required": ["manipulation_type", "config", "target"],
    "properties": {
      "manipulation_type": {
        "enum": ["number_line", "fraction_visual", "geometry", "balance", "place_value"]
      },
      "config": {
        "type": "object",
        "description": "Configuration spécifique au type"
      },
      "target": {
        "type": "object",
        "description": "État cible à atteindre"
      },
      "instructions": { "type": "string" },
      "hints": { "type": "array", "items": { "type": "string" } }
    }
  },
  "renderer_component": "InteractiveManipulation",
  "evaluation_type": "auto"
}
```

### Template : Analyse de source (Histoire)

```json
{
  "code": "source_analysis",
  "name": "Analyse de document",
  "exercise_type": "analysis",
  "bloom_level": 4,
  "modality": "visual",
  "compatible_subjects": ["history", "geography", "civics"],
  "content_schema": {
    "type": "object",
    "required": ["source", "questions"],
    "properties": {
      "source": {
        "type": "object",
        "properties": {
          "type": { "enum": ["text", "image", "map", "chart", "artifact"] },
          "content": { "type": "string" },
          "url": { "type": "string" },
          "metadata": {
            "type": "object",
            "properties": {
              "author": { "type": "string" },
              "date": { "type": "string" },
              "origin": { "type": "string" }
            }
          }
        }
      },
      "questions": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "question": { "type": "string" },
            "type": { "enum": ["identification", "interpretation", "critique"] },
            "answer_type": { "enum": ["qcm", "free", "highlight"] },
            "rubric": { "type": "object" }
          }
        }
      }
    }
  },
  "renderer_component": "SourceAnalysis",
  "evaluation_type": "ai_assisted"
}
```

---

# PARTIE 7 : RECOMMANDATIONS DE MISE EN ŒUVRE

## 7.1 Priorités d'implémentation

### Phase 1 : Fondations (0-6 semaines)

| Priorité | Tâche | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 P0 | Migration `skills` : ajout skill_type, bloom_level, tags | Faible | Critique |
| 🔴 P0 | Création table `skill_presentations` | Moyen | Critique |
| 🔴 P0 | Création table `pedagogical_methods` + seed données | Moyen | Critique |
| 🟠 P1 | Migration données existantes vers nouveau format | Moyen | Haut |
| 🟠 P1 | Composant `ContentBlockRenderer` (switch par type) | Moyen | Haut |

### Phase 2 : Adaptabilité (6-12 semaines)

| Priorité | Tâche | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 P0 | Création table `subject_profiles` + config par matière | Moyen | Critique |
| 🔴 P0 | Algorithme de sélection de présentation | Élevé | Critique |
| 🟠 P1 | Création table `skill_contexts` | Faible | Haut |
| 🟠 P1 | Génération IA de présentations alternatives | Élevé | Haut |
| 🟡 P2 | Table `presentation_analytics` + tracking | Moyen | Moyen |

### Phase 3 : Exercices universels (12-18 semaines)

| Priorité | Tâche | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 P0 | Table `exercise_templates` + templates de base | Moyen | Critique |
| 🟠 P1 | Nouveaux composants d'exercices (5 minimum) | Élevé | Haut |
| 🟠 P1 | Système d'évaluation par template | Moyen | Haut |
| 🟡 P2 | Évaluation IA pour exercices ouverts | Élevé | Moyen |

## 7.2 Migrations SQL à créer

### Migration 1 : Évolution table skills

```sql
-- 20251217_001_evolve_skills_table.sql

ALTER TABLE skills 
ADD COLUMN IF NOT EXISTS skill_type TEXT DEFAULT 'cognitive',
ADD COLUMN IF NOT EXISTS domain_type TEXT DEFAULT 'academic',
ADD COLUMN IF NOT EXISTS bloom_level INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS transferability TEXT DEFAULT 'specific',
ADD COLUMN IF NOT EXISTS learning_styles TEXT[] DEFAULT '{visual,auditory}',
ADD COLUMN IF NOT EXISTS age_adaptations JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

COMMENT ON COLUMN skills.skill_type IS 'cognitive, procedural, metacognitive, socio_emotional, psychomotor';
COMMENT ON COLUMN skills.bloom_level IS '1:Remember, 2:Understand, 3:Apply, 4:Analyze, 5:Evaluate, 6:Create';
COMMENT ON COLUMN skills.transferability IS 'specific, transferable, universal';
```

### Migration 2 : Présentations de compétences

```sql
-- 20251217_002_skill_presentations.sql

CREATE TABLE IF NOT EXISTS skill_presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    presentation_type TEXT NOT NULL,
    target_profile JSONB NOT NULL DEFAULT '{}',
    content_blocks JSONB NOT NULL,
    language TEXT NOT NULL DEFAULT 'fr',
    pedagogical_approach TEXT,
    estimated_duration_minutes INTEGER DEFAULT 15,
    engagement_score FLOAT DEFAULT 0,
    effectiveness_score FLOAT DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skill_presentations_skill ON skill_presentations(skill_id);
CREATE INDEX idx_skill_presentations_type ON skill_presentations(presentation_type);
CREATE INDEX idx_skill_presentations_approach ON skill_presentations(pedagogical_approach);

ALTER TABLE skill_presentations ENABLE ROW LEVEL SECURITY;
CREATE POLICY skill_presentations_read ON skill_presentations FOR SELECT USING (true);
```

### Migration 3 : Méthodes pédagogiques

```sql
-- 20251217_003_pedagogical_methods.sql

CREATE TABLE IF NOT EXISTS pedagogical_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    presentation_config JSONB NOT NULL,
    exercise_config JSONB NOT NULL,
    feedback_config JSONB NOT NULL,
    progression_config JSONB NOT NULL,
    assessment_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pedagogical_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY pedagogical_methods_read ON pedagogical_methods FOR SELECT USING (true);

-- Seed data
INSERT INTO pedagogical_methods (code, name, description, presentation_config, exercise_config, feedback_config, progression_config, assessment_config)
VALUES 
('traditional', 'Traditionnelle', 'Méthode transmissive classique', 
 '{"structure": ["rule_first", "examples", "practice"]}',
 '{"types_priority": ["qcm", "fill_blank", "free_input"]}',
 '{"timing": "immediate", "show_correct_answer": true}',
 '{"model": "linear"}',
 '{"method": "testing"}'),
 
('montessori', 'Montessori', 'Apprentissage par manipulation autonome',
 '{"structure": ["manipulation_first", "concept_emerges"]}',
 '{"types_priority": ["manipulation", "sorting", "matching"]}',
 '{"timing": "built_into_material", "show_correct_answer": false}',
 '{"model": "individual_mastery"}',
 '{"method": "observation"}'),
 
('game_based', 'Apprentissage par le jeu', 'Gamification de l''apprentissage',
 '{"structure": ["challenge_first", "learn_to_win"]}',
 '{"types_priority": ["game", "challenge", "puzzle"]}',
 '{"timing": "instant", "tone": "celebratory"}',
 '{"model": "level_based"}',
 '{"method": "achievement_tracking"}');
```

## 7.3 Composants React à créer

### Structure de dossiers

```
src/components/
├── skill-presentation/
│   ├── SkillPresenter.tsx          # Orchestrateur principal
│   ├── PresentationSelector.tsx     # Algorithme de sélection
│   └── blocks/
│       ├── HookBlock.tsx           # Bloc accroche
│       ├── ConceptBlock.tsx        # Bloc concept
│       ├── ExampleBlock.tsx        # Bloc exemple
│       ├── PracticeBlock.tsx       # Bloc pratique
│       ├── SynthesisBlock.tsx      # Bloc synthèse
│       ├── RealWorldBlock.tsx      # Bloc vie réelle
│       └── MetacognitionBlock.tsx  # Bloc métacognition
│
├── exercises/
│   ├── ExerciseRenderer.tsx        # Routeur vers le bon composant
│   ├── templates/
│   │   ├── QCMExercise.tsx
│   │   ├── FillBlankExercise.tsx
│   │   ├── DragDropExercise.tsx
│   │   ├── InteractiveManipulation.tsx
│   │   ├── SourceAnalysis.tsx
│   │   ├── AudioRecognition.tsx
│   │   └── ...
│   └── evaluation/
│       ├── AutoEvaluator.ts
│       └── AIEvaluator.ts
```

---

# PARTIE 8 : VISION LONG TERME

## 8.1 La compétence comme ADN pédagogique

À terme, chaque compétence dans Lernello doit être un **écosystème pédagogique complet** capable de :

1. **S'auto-adapter** à n'importe quel profil d'apprenant
2. **S'auto-enrichir** via les contributions IA et utilisateurs
3. **S'auto-évaluer** via les métriques d'efficacité
4. **Se connecter** à d'autres compétences de façon intelligente
5. **Évoluer** avec les avancées pédagogiques et technologiques

## 8.2 Indicateurs de succès

| Métrique | Cible 6 mois | Cible 12 mois |
|----------|--------------|---------------|
| Présentations par compétence (moyenne) | 3 | 5 |
| Matières supportées | 3 | 8 |
| Méthodes pédagogiques actives | 3 | 6 |
| Taux de correspondance profil/présentation | 70% | 85% |
| Score d'engagement moyen | 4.0/5 | 4.3/5 |
| Templates d'exercices disponibles | 10 | 25 |

## 8.3 Ce que cela débloque

- **Pour l'enfant** : Une expérience d'apprentissage vraiment personnalisée
- **Pour le parent** : Le choix de la méthode pédagogique qui lui correspond
- **Pour l'enseignant** : Un outil adaptable à sa pédagogie
- **Pour Lernello** : L'expansion naturelle vers toutes les matières et tous les publics

---

# SYNTHÈSE EXÉCUTIVE

## La transformation V3 → V4

La V3 a posé les bases d'une expérience émotionnelle. La V4 transforme le **cœur pédagogique** de Lernello en un système **universel et infiniment adaptable**.

## Les 3 révolutions

1. **De rigide à fluide** : Une compétence peut prendre mille formes
2. **De mono-matière à universel** : Le même moteur pour toutes les disciplines
3. **De standardisé à personnalisé** : Chaque enfant vit une expérience unique

## Prochaines étapes immédiates

1. ✅ Valider cette vision avec l'équipe produit
2. 🔲 Créer les 3 migrations SQL fondamentales
3. 🔲 Implémenter `SkillPresenter` et les premiers blocs
4. 🔲 Migrer les compétences existantes vers le nouveau format
5. 🔲 Tester avec une matière pilote (Français) en plus des Maths

---

*Document généré le 17/12/2024 - V4*
*Focus : Compétence Universelle - Présentation, Format, Adaptabilité*
*Prochaine révision : Post-implémentation Phase 1*
