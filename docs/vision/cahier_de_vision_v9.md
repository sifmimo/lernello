# 📘 Cahier de Vision – V9
## Révolution de l'Apprentissage : Sessions Structurées, Progression Garantie, Expérience Inégalée
### Refonte complète de la partie "Apprendre" inspirée des leaders mondiaux

---

# DIAGNOSTIC CRITIQUE

## Problèmes Actuels Identifiés

### 🔴 Problème 1 : Micro-leçons Incohérentes
- Génération IA trop variable en qualité
- Contenu parfois hors sujet ou mal structuré
- Pas de validation humaine du contenu généré
- Exercices dans les micro-leçons souvent vides ou mal formatés

### 🔴 Problème 2 : Exercices en Boucle
- Le même exercice revient constamment
- La génération IA échoue silencieusement
- Le fallback retourne toujours les mêmes exercices
- Pas de vraie rotation garantie malgré le code V8

### 🔴 Problème 3 : Absence de Parcours Structuré
- L'utilisateur arrive sur une compétence sans contexte
- Pas de progression claire (début → fin)
- Pas de sentiment d'accomplissement
- Pas de session avec objectif défini

### 🔴 Problème 4 : UX Fragmentée
- Trop de composants différents (micro-leçon, présentation V4, exercices)
- Navigation confuse entre les modes
- Pas d'expérience unifiée type Duolingo

---

# VISION V9 : LA RÉVOLUTION

## Principe Fondamental

> **Une session d'apprentissage = Un parcours complet avec début, milieu et fin.**

L'utilisateur ne "fait pas des exercices". Il **vit une session d'apprentissage** structurée, engageante et gratifiante.

## Les 5 Piliers de la V9

### 1. 🎯 Sessions Structurées (Learning Sessions)
Chaque session a une structure claire et prévisible :
- **Durée définie** : 3, 5 ou 10 minutes
- **Objectif clair** : "Maîtriser les additions jusqu'à 20"
- **Progression visible** : Barre de progression avec étapes
- **Fin satisfaisante** : Récapitulatif + récompenses

### 2. 📚 Contenu Pré-Généré de Qualité
Fini la génération IA à la volée qui échoue :
- **Pool d'exercices validés** par compétence (minimum 20)
- **Contenu théorique structuré** et vérifié
- **Génération batch** en arrière-plan (pas en temps réel)
- **Fallback intelligent** vers contenu de qualité garantie

### 3. 🔄 Rotation Parfaite
Algorithme de sélection infaillible :
- **Jamais le même exercice 2x de suite**
- **Rotation complète** avant répétition
- **Variété des types** (QCM, texte à trous, libre)
- **Difficulté adaptative** basée sur la performance

### 4. 🎨 Interface Unifiée Style Duolingo
Une seule expérience cohérente :
- **Écran unique** pour toute la session
- **Animations fluides** entre les étapes
- **Feedback immédiat** et célébrations
- **Design épuré** et moderne

### 5. 🏆 Gamification Intelligente
Motivation sans manipulation :
- **XP et niveaux** clairs
- **Streaks** avec protection
- **Badges** significatifs
- **Progression visible** sur la carte

---

# ARCHITECTURE TECHNIQUE V9

## Nouveau Modèle de Données

### Table `learning_sessions`
```sql
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    
    -- Configuration
    session_type TEXT NOT NULL DEFAULT 'practice',
    -- 'learn' (théorie + exercices), 'practice' (exercices seuls), 'review' (révision)
    
    target_duration_minutes INTEGER NOT NULL DEFAULT 5,
    target_exercises INTEGER NOT NULL DEFAULT 5,
    
    -- État
    status TEXT NOT NULL DEFAULT 'in_progress',
    -- 'in_progress', 'completed', 'abandoned'
    
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER NOT NULL,
    
    -- Résultats
    exercises_completed INTEGER DEFAULT 0,
    exercises_correct INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Métadonnées
    exercises_order JSONB NOT NULL DEFAULT '[]',
    -- Liste ordonnée des exercise_id à présenter
    
    theory_shown BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_sessions_student ON learning_sessions(student_id);
CREATE INDEX idx_learning_sessions_skill ON learning_sessions(skill_id);
CREATE INDEX idx_learning_sessions_status ON learning_sessions(status);
```

### Table `skill_theory_content`
```sql
CREATE TABLE skill_theory_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    
    -- Contenu structuré
    title TEXT NOT NULL,
    introduction TEXT NOT NULL,
    -- Phrase d'accroche courte
    
    concept_explanation TEXT NOT NULL,
    -- Explication principale (2-3 paragraphes max)
    
    key_points JSONB NOT NULL DEFAULT '[]',
    -- ["Point clé 1", "Point clé 2", "Point clé 3"]
    
    examples JSONB NOT NULL DEFAULT '[]',
    -- [{"problem": "2+3", "solution": "5", "explanation": "On compte..."}]
    
    tips JSONB DEFAULT '[]',
    -- Astuces mnémotechniques
    
    common_mistakes JSONB DEFAULT '[]',
    -- Erreurs fréquentes à éviter
    
    -- Métadonnées
    language TEXT NOT NULL DEFAULT 'fr',
    difficulty_level INTEGER DEFAULT 1,
    estimated_read_time_seconds INTEGER DEFAULT 60,
    
    -- Qualité
    is_validated BOOLEAN DEFAULT FALSE,
    validation_score INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_skill_theory_skill_lang ON skill_theory_content(skill_id, language);
```

### Table `exercise_pool` (Enrichie)
```sql
-- Ajout de colonnes à la table exercises existante
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS pool_status TEXT DEFAULT 'active';
-- 'active', 'retired', 'flagged'

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS success_rate FLOAT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS avg_time_seconds FLOAT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 50;

-- Index pour sélection rapide
CREATE INDEX IF NOT EXISTS idx_exercises_pool ON exercises(skill_id, pool_status, quality_score DESC);
```

### Table `student_exercise_rotation`
```sql
CREATE TABLE student_exercise_rotation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    
    -- Rotation tracking
    current_rotation INTEGER DEFAULT 1,
    exercises_seen_this_rotation JSONB DEFAULT '[]',
    -- Liste des exercise_id vus dans cette rotation
    
    last_exercise_id UUID,
    last_exercise_type TEXT,
    
    -- Stats
    total_exercises_done INTEGER DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(student_id, skill_id)
);
```

---

## Algorithme de Session V9

### Création d'une Session

```typescript
async function createLearningSession(
  studentId: string,
  skillId: string,
  sessionType: 'learn' | 'practice' | 'review',
  targetMinutes: number = 5
): Promise<LearningSession> {
  
  // 1. Déterminer le nombre d'exercices selon la durée
  const exercisesPerMinute = 1.5; // ~40 secondes par exercice
  const targetExercises = Math.round(targetMinutes * exercisesPerMinute);
  
  // 2. Sélectionner les exercices avec rotation garantie
  const exercises = await selectExercisesForSession(
    studentId, 
    skillId, 
    targetExercises
  );
  
  // 3. Calculer les étapes totales
  const hasTheory = sessionType === 'learn';
  const totalSteps = (hasTheory ? 1 : 0) + exercises.length + 1; // +1 pour récap
  
  // 4. Créer la session
  const session = await db.learning_sessions.insert({
    student_id: studentId,
    skill_id: skillId,
    session_type: sessionType,
    target_duration_minutes: targetMinutes,
    target_exercises: targetExercises,
    total_steps: totalSteps,
    exercises_order: exercises.map(e => e.id),
    theory_shown: !hasTheory, // Si pas de théorie, marquer comme déjà vue
  });
  
  return session;
}
```

### Sélection d'Exercices avec Rotation Parfaite

```typescript
async function selectExercisesForSession(
  studentId: string,
  skillId: string,
  count: number
): Promise<Exercise[]> {
  
  // 1. Récupérer le pool d'exercices actifs
  const pool = await db.exercises
    .where({ skill_id: skillId, pool_status: 'active' })
    .orderBy('quality_score', 'desc');
  
  if (pool.length === 0) {
    throw new Error('Aucun exercice disponible');
  }
  
  // 2. Récupérer l'état de rotation de l'élève
  let rotation = await db.student_exercise_rotation
    .where({ student_id: studentId, skill_id: skillId })
    .first();
  
  if (!rotation) {
    rotation = await db.student_exercise_rotation.insert({
      student_id: studentId,
      skill_id: skillId,
      current_rotation: 1,
      exercises_seen_this_rotation: [],
    });
  }
  
  // 3. Identifier les exercices non vus dans cette rotation
  const seenIds = new Set(rotation.exercises_seen_this_rotation);
  let unseen = pool.filter(e => !seenIds.has(e.id));
  
  // 4. Si tous vus, nouvelle rotation
  if (unseen.length === 0) {
    await db.student_exercise_rotation.update(rotation.id, {
      current_rotation: rotation.current_rotation + 1,
      exercises_seen_this_rotation: [],
    });
    unseen = pool;
    seenIds.clear();
  }
  
  // 5. Sélectionner avec interleaving (varier les types)
  const selected: Exercise[] = [];
  let lastType: string | null = rotation.last_exercise_type;
  
  while (selected.length < count && unseen.length > 0) {
    // Prioriser un type différent du dernier
    let candidates = unseen.filter(e => e.type !== lastType);
    if (candidates.length === 0) candidates = unseen;
    
    // Prendre le meilleur (par quality_score)
    const next = candidates[0];
    selected.push(next);
    unseen = unseen.filter(e => e.id !== next.id);
    lastType = next.type;
  }
  
  // 6. Si pas assez, compléter avec des exercices déjà vus (mais variés)
  if (selected.length < count) {
    const remaining = pool
      .filter(e => !selected.find(s => s.id === e.id))
      .slice(0, count - selected.length);
    selected.push(...remaining);
  }
  
  return selected;
}
```

---

## Interface Utilisateur V9

### Structure de l'Écran de Session

```
┌─────────────────────────────────────────────────────────────┐
│  ← [X]              ████████░░░░░░░░░░ 4/10              🔊 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                                                     │   │
│  │              [CONTENU PRINCIPAL]                    │   │
│  │                                                     │   │
│  │         Théorie / Question / Récapitulatif          │   │
│  │                                                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │              [ZONE D'INTERACTION]                   │   │
│  │                                                     │   │
│  │         Options / Input / Bouton Continuer          │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  💡 Besoin d'aide ?                    [VÉRIFIER]   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Composants Clés

#### 1. SessionHeader
- Bouton fermer (avec confirmation)
- Barre de progression animée
- Indicateur d'étape (4/10)
- Bouton audio TTS

#### 2. SessionContent
- **Mode Théorie** : Titre, explication, exemples, points clés
- **Mode Exercice** : Question, options/input
- **Mode Récap** : Stats, XP gagné, badges

#### 3. SessionFooter
- Bouton d'aide (indice)
- Bouton d'action principal (Vérifier / Continuer)

### Animations et Transitions

```typescript
const transitions = {
  // Transition entre étapes
  stepChange: {
    exit: { opacity: 0, x: -50 },
    enter: { opacity: 1, x: 0 },
    duration: 300,
  },
  
  // Feedback correct
  correct: {
    backgroundColor: ['#fff', '#D1FAE5', '#fff'],
    scale: [1, 1.02, 1],
    duration: 500,
  },
  
  // Feedback incorrect
  incorrect: {
    x: [0, -10, 10, -5, 5, 0],
    duration: 400,
  },
  
  // Célébration fin de session
  celebration: {
    confetti: true,
    sound: 'complete',
    duration: 2000,
  },
};
```

---

## Flux Utilisateur V9

### 1. Arrivée sur une Compétence

```
[Carte Compétence]
     │
     ▼
┌─────────────────────────────────────┐
│  📐 Additions jusqu'à 20            │
│                                     │
│  ⭐⭐⭐☆☆  Niveau 3                 │
│  ████████░░ 75% maîtrisé            │
│                                     │
│  [🎓 Apprendre]  [💪 S'entraîner]   │
│                                     │
│  ⏱️ ~5 min                          │
└─────────────────────────────────────┘
```

### 2. Choix du Mode

- **Apprendre** : Théorie + 5 exercices guidés
- **S'entraîner** : 5-10 exercices de pratique
- **Réviser** : Exercices sur compétences vues récemment

### 3. Déroulement de la Session

```
[Théorie] → [Exercice 1] → [Exercice 2] → ... → [Récap]
    │            │              │                  │
    ▼            ▼              ▼                  ▼
 Lecture     Réponse        Réponse           Stats
 + Exemples  + Feedback     + Feedback        + XP
                                              + Badges
```

### 4. Fin de Session

```
┌─────────────────────────────────────────┐
│           🎉 Session terminée !          │
│                                         │
│           ⭐ +50 XP gagnés              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ✅ 4/5 bonnes réponses         │   │
│  │  ⏱️ 4 min 32 sec                │   │
│  │  🔥 Série de 3                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  🏆 Badge débloqué : "Apprenti Maths"   │
│                                         │
│  [Continuer]        [Retour]            │
└─────────────────────────────────────────┘
```

---

## Génération de Contenu V9

### Stratégie : Pré-génération Batch

Au lieu de générer à la volée (qui échoue souvent), on pré-génère :

1. **Au démarrage** : Générer 20 exercices par compétence
2. **En arrière-plan** : Job qui complète les pools insuffisants
3. **Validation** : Score de qualité automatique + review manuel

### Script de Pré-génération

```typescript
async function ensureExercisePool(skillId: string, minCount: number = 20) {
  const existing = await db.exercises
    .where({ skill_id: skillId, pool_status: 'active' })
    .count();
  
  if (existing >= minCount) return;
  
  const toGenerate = minCount - existing;
  const skill = await db.skills.find(skillId);
  
  // Générer en batch avec retry
  for (let i = 0; i < toGenerate; i++) {
    const type = EXERCISE_TYPES[i % EXERCISE_TYPES.length];
    
    let attempts = 0;
    while (attempts < 3) {
      try {
        const exercise = await generateExerciseWithAI({
          skillId,
          skillName: skill.name_key,
          exerciseType: type,
          // ... autres params
        });
        
        if (exercise && validateExercise(exercise)) {
          await db.exercises.insert({
            skill_id: skillId,
            type: exercise.type,
            content: exercise.content,
            difficulty: exercise.difficulty,
            is_ai_generated: true,
            is_validated: true,
            pool_status: 'active',
            quality_score: calculateQualityScore(exercise),
          });
          break;
        }
      } catch (e) {
        attempts++;
      }
    }
  }
}
```

### Validation Automatique

```typescript
function validateExercise(exercise: GeneratedExercise): boolean {
  // 1. Structure valide
  if (!exercise.type || !exercise.content) return false;
  
  // 2. Question présente et suffisamment longue
  const question = exercise.content.question || exercise.content.text;
  if (!question || question.length < 10) return false;
  
  // 3. Réponse présente
  if (exercise.type === 'qcm') {
    if (!exercise.content.options || exercise.content.options.length < 2) return false;
    if (exercise.content.correct === undefined) return false;
  } else if (exercise.type === 'fill_blank') {
    if (!exercise.content.blanks || exercise.content.blanks.length === 0) return false;
  } else if (exercise.type === 'free_input') {
    if (!exercise.content.answer) return false;
  }
  
  // 4. Pas de doublon
  // (vérifié lors de l'insertion)
  
  return true;
}
```

---

## Contenu Théorique V9

### Structure du Contenu Théorique

Chaque compétence a un contenu théorique structuré :

```json
{
  "title": "Les additions jusqu'à 20",
  "introduction": "Apprends à additionner des nombres pour compter plus vite !",
  "concept_explanation": "L'addition, c'est quand on met ensemble deux groupes pour savoir combien on a en tout. Par exemple, si tu as 3 bonbons et qu'on t'en donne 2, tu as maintenant 3 + 2 = 5 bonbons !",
  "key_points": [
    "Le signe + veut dire 'et' ou 'plus'",
    "On peut compter sur ses doigts pour vérifier",
    "L'ordre n'a pas d'importance : 3+2 = 2+3"
  ],
  "examples": [
    {
      "problem": "4 + 3 = ?",
      "solution": "7",
      "explanation": "On part de 4, puis on compte 3 de plus : 5, 6, 7"
    },
    {
      "problem": "8 + 5 = ?",
      "solution": "13",
      "explanation": "8 + 2 = 10, puis 10 + 3 = 13"
    }
  ],
  "tips": [
    "Pour les grands nombres, commence par le plus grand !",
    "Utilise tes doigts si tu as besoin"
  ],
  "common_mistakes": [
    "Oublier de compter le premier nombre",
    "Se tromper quand on dépasse 10"
  ]
}
```

### Affichage de la Théorie

```tsx
function TheoryStep({ theory, onComplete }) {
  const [currentSection, setCurrentSection] = useState(0);
  const sections = ['intro', 'concept', 'examples', 'tips'];
  
  return (
    <div className="space-y-6">
      {/* Titre */}
      <h2 className="text-2xl font-bold text-center">
        {theory.title}
      </h2>
      
      {/* Contenu progressif */}
      <AnimatePresence mode="wait">
        {currentSection === 0 && (
          <IntroSection text={theory.introduction} />
        )}
        {currentSection === 1 && (
          <ConceptSection 
            text={theory.concept_explanation}
            keyPoints={theory.key_points}
          />
        )}
        {currentSection === 2 && (
          <ExamplesSection examples={theory.examples} />
        )}
        {currentSection === 3 && (
          <TipsSection tips={theory.tips} />
        )}
      </AnimatePresence>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <button 
          onClick={() => setCurrentSection(s => s - 1)}
          disabled={currentSection === 0}
        >
          Précédent
        </button>
        
        {currentSection < sections.length - 1 ? (
          <button onClick={() => setCurrentSection(s => s + 1)}>
            Suivant
          </button>
        ) : (
          <button onClick={onComplete}>
            Commencer les exercices →
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## Métriques de Succès V9

### KPIs Techniques

| Métrique | Avant | Cible V9 |
|----------|-------|----------|
| Taux d'échec génération IA | ~30% | 0% (pré-généré) |
| Exercices en doublon consécutif | ~40% | 0% |
| Temps de chargement exercice | 2-5s | <200ms |
| Sessions abandonnées | ~50% | <20% |

### KPIs Utilisateur

| Métrique | Avant | Cible V9 |
|----------|-------|----------|
| Sessions complétées/jour | 0.5 | 2+ |
| Temps moyen par session | 3 min | 5 min |
| Taux de retour J+1 | 30% | 60% |
| NPS | N/A | 50+ |

---

## Plan d'Implémentation

### Phase 1 : Fondations (Jour 1)
- [ ] Créer les nouvelles tables (migrations)
- [ ] Implémenter `createLearningSession`
- [ ] Implémenter `selectExercisesForSession`

### Phase 2 : Interface (Jour 1-2)
- [ ] Créer `LearningSessionFlow` (composant principal)
- [ ] Créer `SessionHeader`, `SessionContent`, `SessionFooter`
- [ ] Implémenter les transitions et animations

### Phase 3 : Contenu (Jour 2)
- [ ] Créer le système de théorie structurée
- [ ] Générer le contenu théorique pour les compétences existantes
- [ ] Pré-générer un pool d'exercices

### Phase 4 : Intégration (Jour 2-3)
- [ ] Remplacer l'ancien système dans SkillClient
- [ ] Tester le flux complet
- [ ] Ajuster l'UX selon les tests

---

## Conclusion

La V9 transforme radicalement l'expérience d'apprentissage :

1. **Fiabilité** : Plus d'échecs de génération, contenu pré-validé
2. **Cohérence** : Une seule interface unifiée
3. **Engagement** : Sessions structurées avec objectifs clairs
4. **Progression** : Rotation parfaite, difficulté adaptative
5. **Satisfaction** : Célébrations, XP, badges

> **"Chaque session doit donner envie de faire la suivante."**

---

*Document créé le 18/12/2024 - V9*
*Focus : Sessions Structurées, Contenu Pré-généré, UX Unifiée*
