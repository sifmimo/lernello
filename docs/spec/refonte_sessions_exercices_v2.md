# Spécification Technique : Refonte V2 du Système de Sessions et Exercices

**Version** : 2.0  
**Date** : 26 décembre 2024  
**Statut** : À implémenter  
**Cible** : Apprentissage scolaire primaire (CP-CM2) - Toutes matières

---

## SOMMAIRE

1. [Audit du Système Actuel](#1-audit-du-système-actuel)
2. [Vision et Objectifs V2](#2-vision-et-objectifs-v2)
3. [Architecture des Sessions Avancées](#3-architecture-des-sessions-avancées)
4. [Système d'Exercices Enrichi](#4-système-dexercices-enrichi)
5. [Parcours Pédagogiques Intelligents](#5-parcours-pédagogiques-intelligents)
6. [Gamification Avancée](#6-gamification-avancée)
7. [Accessibilité et Multimodalité](#7-accessibilité-et-multimodalité)
8. [Analytics et Reporting](#8-analytics-et-reporting)
9. [Modèle de Données](#9-modèle-de-données)
10. [Plan d'Implémentation](#10-plan-dimplémentation)

---

## 1. AUDIT DU SYSTÈME ACTUEL

### 1.1 État des Lieux

#### Sessions d'Apprentissage Actuelles
| Composant | État | Limitations |
|-----------|------|-------------|
| `learning_sessions` | ✅ Fonctionnel | Types limités (learn/practice/review) |
| `LearningSessionFlow` | ✅ Fonctionnel | Flow linéaire, pas d'adaptation temps réel |
| `TheoryStep` | ✅ Fonctionnel | Contenu statique, peu interactif |
| `ExerciseStep` | ✅ Fonctionnel | Pas de hints progressifs, feedback basique |
| `RecapStep` | ✅ Fonctionnel | Statistiques simples |

#### Types d'Exercices Existants (12 types modern + 10 templates)
- QCM, ImageQCM, FillBlank, FreeInput, DragDrop, MatchPairs
- Sorting, Timeline, Hotspot, Puzzle, Drawing, Animation
- MathManipulation, Dictation, AudioRecognition

### 1.2 Points Forts à Conserver
1. Architecture modulaire des composants
2. Système de rotation évitant les répétitions
3. Génération IA des exercices
4. Design épuré Apple-like
5. TTS intégré

### 1.3 Lacunes Identifiées

| Catégorie | Problème | Impact |
|-----------|----------|--------|
| Personnalisation | Pas d'adaptation profil/âge | Expérience uniforme |
| Progression | Difficulté statique | Frustration ou ennui |
| Engagement | Gamification superficielle | Motivation court terme |
| Feedback | Corrections sans explication | Apprentissage incomplet |
| Matières | Focus math/français | Couverture incomplète |
| Parents | Pas de visibilité temps réel | Manque de suivi |

---

## 2. VISION ET OBJECTIFS V2

### 2.1 Vision
> Créer le système d'apprentissage le plus complet pour le primaire, avec une expérience personnalisée qui s'adapte à chaque enfant et transforme l'apprentissage en aventure.

### 2.2 Objectifs Clés
| Objectif | Métrique Cible |
|----------|----------------|
| Engagement | +50% temps de session |
| Rétention | 80% retour J+7 |
| Efficacité | +30% progression maîtrise |
| Couverture | 100% programme primaire |
| Satisfaction | NPS > 70 |

### 2.3 Principes Directeurs
1. **L'enfant au centre** : UX optimisée enfant
2. **Apprentissage invisible** : Le jeu véhicule l'apprentissage
3. **Progression visible** : Sentiment constant d'accomplissement
4. **Échec bienveillant** : L'erreur est une étape
5. **Accessibilité universelle** : Aucun enfant exclu

---

## 3. ARCHITECTURE DES SESSIONS AVANCÉES

### 3.1 Types de Sessions Enrichis

```typescript
type SessionType = 
  | 'discover'      // Première découverte
  | 'learn'         // Théorie + exercices guidés
  | 'practice'      // Entraînement libre
  | 'challenge'     // Défi chronométré
  | 'review'        // Révision espacée (Leitner)
  | 'diagnostic'    // Évaluation du niveau
  | 'remediation'   // Correction des lacunes
  | 'adventure'     // Session gamifiée narrative
  | 'daily_mix'     // Mix personnalisé quotidien
  | 'exam_prep'     // Préparation évaluation
  | 'collaborative';// Session multi-joueurs
```

### 3.2 Structure de Session Dynamique

```
INTRO (30s) → WARM-UP (1-2min) → CORE (3-10min) → CONSOLIDATE (2-3min) → BONUS (si succès) → RECAP (1min)
```

| Phase | Objectif | Contenu |
|-------|----------|---------|
| Intro | Contextualiser | Animation, objectif affiché |
| Warm-up | Réactiver | 2-3 exercices faciles sur prérequis |
| Core | Apprendre | Exercices adaptés au niveau |
| Consolidate | Ancrer | Exercices de synthèse |
| Bonus | Récompenser | Mini-jeu fun |
| Recap | Célébrer | Stats, XP, badges |

### 3.3 Moteur d'Adaptation Temps Réel

```typescript
interface AdaptiveEngine {
  adjustDifficulty(performance: SessionPerformance): DifficultyLevel;
  selectNextExercise(context: ExerciseContext): Exercise;
  shouldIntervene(streak: StreakInfo): Intervention | null;
  estimateOptimalDuration(engagement: EngagementMetrics): number;
}

interface SessionPerformance {
  correctRate: number;
  avgResponseTime: number;
  currentStreak: number;
  mistakePattern: MistakeType[];
  engagementScore: number;
  frustrationIndicators: number;
}
```

### 3.4 Gestion États Émotionnels

| État | Indicateurs | Action |
|------|-------------|--------|
| `confident` | Réussites consécutives, temps rapide | Augmenter difficulté |
| `learning` | Mix succès/erreurs | Maintenir |
| `struggling` | Erreurs fréquentes | Simplifier + encourager |
| `frustrated` | Abandon, erreurs répétées | Pause suggérée |
| `bored` | Temps très rapide, inattention | Challenge bonus |

---

## 4. SYSTÈME D'EXERCICES ENRICHI

### 4.1 Taxonomie par Niveau Cognitif (Bloom)

| Niveau | Types d'Exercices |
|--------|-------------------|
| 1. Mémoriser | QCM simple, Flashcard |
| 2. Comprendre | QCM explicatif, Vrai/Faux justifié |
| 3. Appliquer | Texte à trous, Problème guidé |
| 4. Analyser | Classement, Détection d'erreur |
| 5. Évaluer | Argumentation, Choix justifié |
| 6. Créer | Rédaction, Composition |

### 4.2 Nouveaux Types d'Exercices

#### Mathématiques
- `number_builder` : Construire un nombre
- `visual_fraction` : Manipuler fractions
- `geometry_builder` : Construire formes
- `graph_reading` : Interpréter graphiques
- `pattern_complete` : Compléter suites
- `word_problem_steps` : Problème par étapes

#### Français
- `sentence_builder` : Construire phrase
- `conjugation_wheel` : Roue conjugaison
- `spelling_bee` : Épeler avec audio
- `grammar_detective` : Trouver erreurs
- `reading_comprehension` : Questions sur texte
- `dictation_progressive` : Dictée mot par mot
- `phoneme_recognition` : Reconnaissance sons

#### Sciences
- `experiment_simulator` : Simuler expérience
- `lifecycle_ordering` : Ordonner cycle vie
- `classification_tree` : Classer dans arbre
- `hypothesis_test` : Tester hypothèse

#### Histoire/Géographie
- `map_explorer` : Carte interactive
- `era_sorting` : Classer par époque
- `source_comparison` : Comparer documents

#### Autres
- `rhythm_tap` : Taper un rythme (musique)
- `color_mixer` : Mélanger couleurs (arts)
- `listen_repeat` : Écouter répéter (anglais)
- `decision_scenario` : Scénario EMC

### 4.3 Système de Hints Progressifs

```typescript
interface HintLevel {
  level: 1 | 2 | 3;
  type: 'direction' | 'elimination' | 'partial' | 'visual' | 'example' | 'step_by_step';
  content: string;
  costXP: number;
}
```

### 4.4 Feedback Enrichi

```typescript
interface EnrichedFeedback {
  isCorrect: boolean;
  message: string;
  animation: 'confetti' | 'stars' | 'thumbs_up' | 'gentle_correction';
  explanation?: { text: string; visual?: ReactNode; audio?: string };
  xpGained: number;
  encouragement?: string;
}
```

---

## 5. PARCOURS PÉDAGOGIQUES INTELLIGENTS

### 5.1 Système de Prérequis
```typescript
interface Prerequisite {
  skillId: string;
  requiredSkillId: string;
  requiredMastery: number; // 0-100
  importance: 'required' | 'recommended' | 'helpful';
}
```

### 5.2 Révision Espacée (Leitner)

| Boîte | Intervalle | Action si correct | Action si incorrect |
|-------|------------|-------------------|---------------------|
| 1 | 1 jour | → Boîte 2 | Reste |
| 2 | 3 jours | → Boîte 3 | → Boîte 1 |
| 3 | 7 jours | → Boîte 4 | → Boîte 2 |
| 4 | 14 jours | → Boîte 5 | → Boîte 3 |
| 5 | 30 jours | Maîtrisé | → Boîte 4 |

### 5.3 Types de Parcours

| Type | Description |
|------|-------------|
| `curriculum` | Programme officiel |
| `remediation` | Rattrapage lacunes |
| `acceleration` | Parcours avancé |
| `thematic` | Thème spécifique |
| `exam_prep` | Préparation évaluation |
| `summer_review` | Révisions vacances |

---

## 6. GAMIFICATION AVANCÉE

### 6.1 Système XP Enrichi

| Action | XP Base | Bonus |
|--------|---------|-------|
| Exercice correct | +10 | +5 premier essai, +3 sans hint |
| Exercice incorrect | +2 | - |
| Streak 3 | +10 | - |
| Streak 5 | +20 | - |
| Streak 10 | +50 | - |
| Session complète | +25 | +50 si 100% |
| Objectif quotidien | +30 | - |
| Compétence maîtrisée | +100 | - |

**Multiplicateurs** : x1.5 weekend, x2 streak mode, x1.5 challenge

### 6.2 Système de Badges

| Catégorie | Exemples |
|-----------|----------|
| Progression | Premier Pas, Centurion (100 ex), Millionnaire (1000 ex) |
| Maîtrise | Maître Débutant, Génie des Maths, Académicien |
| Streaks | Semaine Parfaite (7j), Mois de Feu (30j), Centenaire (100j) |
| Performance | Sans Faute, Éclair (vitesse), Autonome (sans hints) |
| Exploration | Touche-à-tout, Hibou Savant (nuit), Lève-tôt |
| Social | Challenger, Champion, Bon Camarade |

### 6.3 Récompenses et Shop

- **Daily Rewards** : Récompenses croissantes jour 1-7
- **Milestones** : Récompenses aux paliers
- **Shop** : Avatars, thèmes, power-ups (monnaie virtuelle)

### 6.4 Défis

| Type | Fréquence | Exemple |
|------|-----------|---------|
| Daily Challenge | Quotidien | "10 exercices sans erreur" |
| Weekly Challenge | Hebdo | "50 exercices de maths" |
| Tournament | Événement | Classement sur une semaine |
| Friend Challenge | À la demande | Défi 1v1 |

### 6.5 Lumi Compagnon IA Évolué

| Situation | Réaction Lumi |
|-----------|---------------|
| Bonne réponse | Expression joyeuse + encouragement |
| Série de 5 | Célébration animée |
| Erreur | Expression encourageante + conseil |
| Struggle | Offre aide/pause |
| Inactivité | Rappel ludique |
| Achievement | Célébration spéciale |

---

## 7. ACCESSIBILITÉ ET MULTIMODALITÉ

### 7.1 Options d'Accessibilité

| Catégorie | Options |
|-----------|---------|
| Vision | Contraste élevé, taille police, mode daltonien |
| Audition | Feedback visuel, sous-titres |
| Motricité | Grandes cibles, mode tap unique, temps étendu |
| Cognitif | UI simplifiée, mode focus, pas-à-pas |
| Dyslexie | Police OpenDyslexic, espacement, syllabes |

### 7.2 Profil d'Apprentissage

```typescript
interface LearningProfile {
  preferredModality: ('visual' | 'auditory' | 'kinesthetic' | 'reading')[];
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
  attentionSpan: 'short' | 'medium' | 'long';
  learningPace: 'slow' | 'normal' | 'fast';
  specialNeeds: ('dyslexia' | 'dyscalculia' | 'adhd' | 'autism')[];
}
```

---

## 8. ANALYTICS ET REPORTING

### 8.1 Dashboard Parent

| Section | Contenu |
|---------|---------|
| Résumé semaine | Temps, exercices, précision, XP, streak |
| Progression | Graphique évolution, compétences |
| Calendrier | Activité par jour |
| Recommandations | Focus suggéré, parcours |
| Alertes | Difficultés, inactivité, réussites |

### 8.2 Rapports Périodiques

- **Hebdomadaire** : Email résumé performance
- **Mensuel** : Bilan complet + recommandations
- **Trimestriel** : Rapport détaillé exportable PDF

### 8.3 Patterns d'Erreur Analysés

| Matière | Types d'erreurs détectées |
|---------|---------------------------|
| Math | Calcul, valeur position, confusion opération |
| Français | Orthographe phonétique, accord, conjugaison |
| Général | Compréhension consigne, inattention |

---

## 9. MODÈLE DE DONNÉES

### 9.1 Nouvelles Tables Principales

```sql
-- Sessions enrichies
CREATE TABLE learning_sessions_v2 (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES student_profiles(id),
    session_type TEXT NOT NULL,
    phases JSONB NOT NULL DEFAULT '[]',
    current_phase TEXT DEFAULT 'intro',
    skill_ids UUID[] NOT NULL,
    difficulty_current INTEGER DEFAULT 1,
    status TEXT DEFAULT 'in_progress',
    exercises_completed INTEGER DEFAULT 0,
    exercises_correct INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    engagement_score INTEGER,
    emotional_state TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Révision espacée
CREATE TABLE spaced_repetition_items (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES student_profiles(id),
    exercise_id UUID REFERENCES exercises(id),
    box_level INTEGER DEFAULT 1 CHECK (box_level BETWEEN 1 AND 5),
    next_review_at TIMESTAMPTZ NOT NULL,
    total_reviews INTEGER DEFAULT 0,
    consecutive_correct INTEGER DEFAULT 0,
    UNIQUE(student_id, exercise_id)
);

-- Badges V2
CREATE TABLE badges_v2 (
    id UUID PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL,
    rarity TEXT DEFAULT 'common',
    conditions JSONB NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    is_secret BOOLEAN DEFAULT FALSE
);

-- Parcours pédagogiques
CREATE TABLE learning_paths (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    path_type TEXT NOT NULL,
    skills JSONB NOT NULL,
    target_grades INTEGER[],
    estimated_duration_minutes INTEGER
);

-- Profil d'apprentissage
CREATE TABLE learning_profiles (
    id UUID PRIMARY KEY,
    student_id UUID UNIQUE REFERENCES student_profiles(id),
    preferred_modality TEXT[] DEFAULT ARRAY['visual'],
    attention_span TEXT DEFAULT 'medium',
    learning_pace TEXT DEFAULT 'normal',
    special_needs TEXT[] DEFAULT '{}',
    accessibility_settings JSONB DEFAULT '{}'
);

-- Défis quotidiens
CREATE TABLE daily_challenges (
    id UUID PRIMARY KEY,
    date DATE NOT NULL,
    challenge_type TEXT NOT NULL,
    target_value INTEGER NOT NULL,
    reward_type TEXT NOT NULL,
    reward_value INTEGER NOT NULL
);
```

---

## 10. PLAN D'IMPLÉMENTATION

### Phase 1 : Fondations (Semaines 1-2)
- [x] Migrations DB V2
- [ ] Refactoring types sessions
- [ ] Moteur adaptatif basique
- [ ] LearningSessionFlowV2

### Phase 2 : Sessions Enrichies (Semaines 3-4)
- [ ] Phases de session
- [ ] Adaptation difficulté temps réel
- [ ] Hints progressifs
- [ ] Feedback enrichi

### Phase 3 : Exercices (Semaines 5-7)
- [ ] 5 nouveaux types math
- [ ] 5 nouveaux types français
- [ ] Types sciences/histoire
- [ ] Générateur IA amélioré

### Phase 4 : Gamification (Semaines 8-9)
- [ ] Système XP enrichi
- [ ] Badges V2
- [ ] Défis quotidiens
- [ ] Lumi réactions

### Phase 5 : Analytics (Semaines 10-11)
- [ ] Dashboard parent
- [ ] Rapports périodiques
- [ ] Détection patterns erreur

### Phase 6 : Polish (Semaine 12)
- [ ] Accessibilité
- [ ] Performance
- [ ] Tests E2E
- [ ] Documentation

---

## ANNEXES

### A. Couverture Programme Par Classe

| Matière | CP | CE1 | CE2 | CM1 | CM2 |
|---------|:--:|:---:|:---:|:---:|:---:|
| Maths | ✓ | ✓ | ✓ | ✓ | ✓ |
| Français | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sciences | - | - | ✓ | ✓ | ✓ |
| Histoire | - | - | ✓ | ✓ | ✓ |
| Géographie | - | - | ✓ | ✓ | ✓ |
| Anglais | ✓ | ✓ | ✓ | ✓ | ✓ |
| EMC | ✓ | ✓ | ✓ | ✓ | ✓ |

### B. Métriques de Succès

| KPI | Baseline | Cible V2 |
|-----|----------|----------|
| Session moyenne | 4 min | 8 min |
| Exercices/session | 5 | 10 |
| Retour J+1 | 40% | 70% |
| Retour J+7 | 25% | 50% |
| Compétences maîtrisées/mois | 2 | 5 |

### C. Références
- Taxonomie de Bloom
- Système Leitner (révision espacée)
- Duolingo (gamification)
- Khan Academy (parcours adaptatifs)
- Apple HIG (design)
