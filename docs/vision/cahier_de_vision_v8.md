# Cahier de Vision V8 - Système d'Exercices Professionnel

**Focus : Système d'exercices inspiré des meilleures pratiques mondiales**

---

## Audit du Système Actuel

### Problèmes Identifiés

1. **Répétition en boucle** : Les mêmes exercices reviennent constamment car :
   - La génération IA échoue silencieusement
   - Le fallback retourne toujours les mêmes exercices existants
   - Pas de tracking efficace des exercices déjà vus

2. **Logique de sélection défaillante** :
   - Fenêtre de 24h trop courte pour éviter les répétitions
   - Randomisation insuffisante parmi les exercices disponibles
   - Pas de rotation garantie avant répétition

3. **Génération IA non fiable** :
   - Échecs silencieux sans fallback intelligent
   - Pas de validation de la qualité des exercices générés
   - Doublons possibles malgré le prompt

4. **Absence de répétition espacée** :
   - Pas d'algorithme de type Leitner ou Half-Life Regression
   - Pas de tracking de la "force" de mémorisation par exercice
   - Pas d'adaptation au rythme d'oubli de l'élève

---

## Vision V8 : Système d'Exercices Professionnel

### Principes Fondamentaux (inspirés de Duolingo, Khan Academy, Anki)

#### 1. Rotation Garantie Avant Répétition
> **Règle d'or : Un exercice ne peut PAS être présenté deux fois avant que TOUS les exercices disponibles aient été vus.**

```
Pool d'exercices : [A, B, C, D, E]
Session 1 : A (marqué comme "vu")
Session 2 : B, C, D (tous différents de A)
Session 3 : E (dernier non vu)
Session 4 : Rotation complète → A peut revenir
```

#### 2. Répétition Espacée Intelligente (Half-Life Regression)
Chaque exercice a une "demi-vie" de mémoire qui détermine quand le revoir :

| Performance | Demi-vie | Prochain review |
|-------------|----------|-----------------|
| Correct 1ère fois | 2 jours | +2 jours |
| Correct après erreur | 1 jour | +1 jour |
| Incorrect | 4 heures | +4h (prioritaire) |
| Correct 3x consécutives | 7 jours | +7 jours |

#### 3. Interleaving (Entrelacement)
Ne jamais présenter deux exercices du même type consécutivement :
- QCM → Fill Blank → Free Input → QCM
- Évite l'ennui et renforce la flexibilité cognitive

#### 4. Difficulté Adaptative Progressive
```
Zone de Développement Proximal (ZDP) :
- 70% exercices dans la zone de confort (consolidation)
- 30% exercices légèrement au-dessus (défi)
```

---

## Section 11 : Exercices, Tokens et Responsabilité IA (Mise à jour V8)

### 11.1 Quota et Génération

- Chaque compétence contient obligatoirement des exercices
- Les compétences peuvent être enrichies jusqu'à **10 exercices par compétence** via tokens plateforme
- Au-delà de 10 exercices : tokens personnels ou clé API personnelle requis
- **Message de validation obligatoire** avant chaque génération au-delà du quota

### 11.2 Algorithme de Sélection d'Exercices (NOUVEAU)

```typescript
interface ExerciseSelection {
  // 1. Pool Management
  getAvailablePool(skillId, studentId): Exercise[]
  
  // 2. Rotation Tracking
  markAsSeen(exerciseId, studentId): void
  getUnseenExercises(skillId, studentId): Exercise[]
  resetRotation(skillId, studentId): void // Quand tous vus
  
  // 3. Spaced Repetition
  calculateNextReview(exerciseId, performance): Date
  getPriorityExercises(skillId, studentId): Exercise[] // Basé sur demi-vie
  
  // 4. Selection Logic
  selectNextExercise(skillId, studentId): Exercise {
    // Priorité 1: Exercices jamais vus dans cette rotation
    // Priorité 2: Exercices dont la demi-vie est expirée
    // Priorité 3: Exercices avec le plus d'erreurs récentes
    // Priorité 4: Génération IA si quota non atteint
  }
}
```

### 11.3 Table de Tracking des Exercices (NOUVEAU)

```sql
CREATE TABLE student_exercise_history (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES student_profiles(id),
  exercise_id UUID REFERENCES exercises(id),
  skill_id UUID REFERENCES skills(id),
  
  -- Rotation tracking
  rotation_number INTEGER DEFAULT 1,
  seen_in_current_rotation BOOLEAN DEFAULT FALSE,
  
  -- Spaced repetition
  half_life_hours FLOAT DEFAULT 24,
  next_review_at TIMESTAMPTZ,
  strength FLOAT DEFAULT 0.5, -- 0 à 1
  
  -- Performance
  attempts_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  last_correct BOOLEAN,
  consecutive_correct INTEGER DEFAULT 0,
  
  UNIQUE(student_id, exercise_id)
);
```

### 11.4 Algorithme de Sélection Détaillé

```
FONCTION selectNextExercise(skillId, studentId):
  
  1. RÉCUPÉRER tous les exercices de la compétence
  2. RÉCUPÉRER l'historique de l'élève pour ces exercices
  
  3. FILTRER les exercices non vus dans la rotation actuelle
     SI aucun exercice non vu:
       RÉINITIALISER la rotation (tous marqués comme non vus)
       INCRÉMENTER le numéro de rotation
  
  4. PARMI les exercices non vus:
     a. PRIORISER ceux dont next_review_at < maintenant (demi-vie expirée)
     b. PRIORISER ceux avec strength < 0.5 (mal maîtrisés)
     c. VARIER le type (pas le même type que le précédent)
  
  5. SI moins de 3 exercices disponibles ET quota non atteint:
     GÉNÉRER un nouvel exercice avec l'IA
     VALIDER la qualité (pas de doublon, format correct)
     SAUVEGARDER et RETOURNER
  
  6. SÉLECTIONNER l'exercice avec le score de priorité le plus élevé
  7. MARQUER comme vu dans la rotation actuelle
  8. RETOURNER l'exercice
```

### 11.5 Calcul de la Demi-Vie (Half-Life Regression)

```typescript
function updateHalfLife(history: ExerciseHistory, isCorrect: boolean): number {
  const baseHalfLife = history.half_life_hours || 24;
  
  if (isCorrect) {
    // Correct: augmenter la demi-vie (mémorisation renforcée)
    const multiplier = history.consecutive_correct >= 3 ? 2.5 : 2.0;
    return Math.min(baseHalfLife * multiplier, 720); // Max 30 jours
  } else {
    // Incorrect: réduire la demi-vie (besoin de révision rapide)
    return Math.max(baseHalfLife * 0.5, 4); // Min 4 heures
  }
}

function calculateStrength(history: ExerciseHistory): number {
  const hoursSinceReview = (Date.now() - history.last_attempt_at) / 3600000;
  const halfLife = history.half_life_hours;
  
  // Formule de décroissance exponentielle
  return Math.pow(2, -hoursSinceReview / halfLife);
}
```

### 11.6 Interleaving (Entrelacement des Types)

```typescript
function selectWithInterleaving(
  candidates: Exercise[], 
  lastExerciseType: ExerciseType
): Exercise {
  // Filtrer pour éviter le même type consécutif
  const differentType = candidates.filter(e => e.type !== lastExerciseType);
  
  if (differentType.length > 0) {
    return selectByPriority(differentType);
  }
  
  // Fallback si un seul type disponible
  return selectByPriority(candidates);
}
```

---

## 11.7 Génération IA Améliorée

### Validation Anti-Doublon

```typescript
async function generateUniqueExercise(config: GenerationConfig): Promise<Exercise | null> {
  const existingQuestions = await getExistingQuestions(config.skillId);
  
  // Inclure les questions existantes dans le prompt
  const prompt = buildPromptWithExclusions(config, existingQuestions);
  
  const generated = await callAI(prompt);
  
  // Validation post-génération
  if (isDuplicate(generated.question, existingQuestions)) {
    // Retry avec température plus élevée
    return generateUniqueExercise({ ...config, temperature: 0.95 });
  }
  
  if (!isValidFormat(generated)) {
    return null; // Ne pas sauvegarder un exercice mal formé
  }
  
  return generated;
}

function isDuplicate(newQuestion: string, existing: string[]): boolean {
  return existing.some(q => 
    similarity(newQuestion, q) > 0.8 // Seuil de similarité
  );
}
```

### Types d'Exercices Variés

Pour chaque compétence, générer un mix équilibré :
- **2-3 QCM** (reconnaissance)
- **2-3 Fill Blank** (rappel partiel)
- **2-3 Free Input** (rappel complet)
- **1-2 Drag & Drop** (organisation)

---

## 11.8 Interface Utilisateur

### Indicateurs de Progression

```
┌─────────────────────────────────────────┐
│ Compétence: Saluer en allemand          │
│                                         │
│ Exercices: 7/10 générés                 │
│ ████████░░ 80% maîtrisés                │
│                                         │
│ Rotation: 3/7 vus cette session         │
│ ○ ○ ○ ● ● ● ●                          │
│                                         │
│ Prochain review: dans 2 jours           │
└─────────────────────────────────────────┘
```

### Message de Quota

```
┌─────────────────────────────────────────┐
│ ⚠️ Quota atteint (10/10 exercices)      │
│                                         │
│ Pour générer plus d'exercices:          │
│ • Utilisez vos tokens personnels        │
│ • Ou configurez votre clé API           │
│                                         │
│ [Continuer avec les exercices actuels]  │
│ [Configurer mes tokens]                 │
└─────────────────────────────────────────┘
```

---

## 11.9 Métriques de Qualité

### KPIs du Système d'Exercices

| Métrique | Objectif | Mesure |
|----------|----------|--------|
| Taux de répétition immédiate | < 5% | Même exercice 2x de suite |
| Couverture de rotation | 100% | Tous exercices vus avant répétition |
| Taux de rétention J+7 | > 80% | Correct après 7 jours |
| Variété des types | Équilibré | Distribution QCM/Fill/Free |
| Temps moyen par exercice | 30-90s | Adapté à la difficulté |

---

## Résumé des Changements V8

1. **Rotation garantie** : Impossible de voir le même exercice deux fois avant d'avoir vu tous les autres
2. **Répétition espacée** : Algorithme Half-Life Regression pour optimiser la mémorisation
3. **Interleaving** : Alternance des types d'exercices pour éviter l'ennui
4. **Tracking robuste** : Table dédiée pour l'historique par élève/exercice
5. **Génération fiable** : Validation anti-doublon et retry intelligent
6. **Transparence** : Indicateurs clairs de progression et quota

---

## Implémentation Prioritaire

### Phase 1 : Rotation Garantie (Critique)
- [ ] Créer table `student_exercise_history`
- [ ] Implémenter tracking des exercices vus
- [ ] Modifier `getOrCreateExercise` pour respecter la rotation

### Phase 2 : Répétition Espacée
- [ ] Ajouter calcul de demi-vie
- [ ] Implémenter priorité basée sur strength
- [ ] Ajouter next_review_at

### Phase 3 : Interleaving
- [ ] Tracker le dernier type d'exercice
- [ ] Filtrer pour varier les types

### Phase 4 : UI/UX
- [ ] Afficher indicateurs de rotation
- [ ] Message de quota clair
- [ ] Feedback de progression
