# 📘 Cahier de Vision – V6
## La Compétence Révolutionnaire : Multi-Modalité, Adaptabilité Universelle et Excellence Pédagogique
### Focus stratégique sur le cœur de l'apprentissage

---

# PRÉAMBULE — RAPPEL DE LA VISION

## Mission
Créer une plateforme d'apprentissage scolaire universelle, **pilotée par l'IA**, centrée sur les **compétences réelles** de l'apprenant, indépendante de l'âge et de la classe scolaire.

## Vision
Devenir la référence mondiale de l'apprentissage par compétences, offrant une expérience aussi désirable qu'un jeu tout en garantissant une progression pédagogique mesurable.

## Principe fondamental
> **On n'apprend pas selon son âge, mais selon ce que l'on maîtrise réellement.**

## Focus de cette version V6
Cette version se concentre exclusivement sur **la compétence** — l'unité atomique d'apprentissage — avec trois axes :

1. **Multi-modalité** : Une compétence accessible via texte, audio, vidéo, manipulation, jeu
2. **Adaptabilité universelle** : Support de toutes les matières et tous les sujets
3. **Excellence pédagogique** : Théorie et exercices de niveau expert, personnalisés

---

# PARTIE 1 : ANALYSE CRITIQUE DE L'EXISTANT

## 1.1 État actuel de l'implémentation

| Composant | Fichier | État | Évaluation |
|-----------|---------|------|------------|
| Types de présentation | `skill-presentation.ts` | ✅ Complet | 27 types de blocs, 25 formats |
| Rendu des blocs | `ContentBlockRenderer.tsx` | ✅ Fonctionnel | Switch sur 20+ types |
| Génération IA | `skill-presentations.ts` | ✅ Fonctionnel | GPT-4o, contexte matière |
| Exercices | `content-generator.ts` | ⚠️ Limité | 4 types seulement |

## 1.2 Faiblesses critiques

| Faiblesse | Impact | Gravité |
|-----------|--------|---------|
| **4 types d'exercices seulement** | Monotonie, inadaptation aux matières | 🔴 Critique |
| **Pas de modalité audio native** | Exclusion non-lecteurs | 🔴 Critique |
| **Pas de manipulation interactive** | Apprentissage kinesthésique absent | 🔴 Critique |
| **Pas de vidéo intégrée** | Format le plus engageant absent | 🟠 Haute |
| **Scoring présentation simpliste** | Mauvais matching profil/contenu | 🟠 Haute |

---

# PARTIE 2 : LA COMPÉTENCE MULTI-MODALE

## 2.1 Les 5 modalités d'apprentissage

| Modalité | Formats | Composants |
|----------|---------|------------|
| 👁️ **Visuel** | Images, animations, vidéos, schémas | `ImageBlock`, `AnimationBlock`, `VideoBlock` |
| 👂 **Auditif** | Audio, narration, musique, podcasts | `AudioBlock`, `NarrationBlock` |
| ✋ **Kinesthésique** | Drag & drop, manipulation, simulation | `ManipulationBlock`, `SimulationBlock` |
| 📖 **Lecture/Écriture** | Textes, notes, résumés | `TextBlock`, `SummaryBlock` |
| 🎮 **Ludique** | Jeux, défis, compétitions | `GameBlock`, `ChallengeBlock` |

## 2.2 Nouvelle table `content_modalities`

```sql
CREATE TABLE content_modalities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    supported_formats TEXT[] NOT NULL,
    renderer_components TEXT[] NOT NULL,
    requires_audio BOOLEAN DEFAULT FALSE,
    requires_visual BOOLEAN DEFAULT TRUE,
    requires_interaction BOOLEAN DEFAULT FALSE,
    engagement_multiplier FLOAT DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 2.3 Algorithme de sélection de modalité

**Facteurs de scoring :**
- Préférence d'apprentissage de l'élève (+40 pts)
- Âge (jeunes → visuel/kinesthésique, +20 pts)
- Contraintes d'accessibilité (ajustement)
- Capacités de l'appareil (audio, touch)
- Contexte de la matière (+15 pts)
- Variété (éviter répétition, -15 pts)

---

# PARTIE 3 : ADAPTABILITÉ PAR MATIÈRE

## 3.1 Profils de matière enrichis

### Mathématiques
- **Type** : Procédural
- **Modalité principale** : Kinesthésique
- **Templates théorie** : manipulation → concept → règle → exemples → synthèse
- **Exercices prioritaires** : manipulation interactive, calcul étape par étape, drag & drop
- **Feedback** : Montrer les étapes, proposer méthode alternative

### Français
- **Type** : Mixte
- **Modalité principale** : Lecture/Écriture + Auditif
- **Templates théorie** : observation texte → découverte règle → application
- **Exercices prioritaires** : texte à trous, conjugaison, dictée, expression écrite
- **Feedback** : Surligner le type d'erreur, montrer exemples similaires

### Sciences
- **Type** : Conditionnel
- **Modalité principale** : Visuel + Kinesthésique
- **Templates théorie** : question → hypothèse → expérience → conclusion
- **Exercices prioritaires** : simulation d'expérience, interprétation de données
- **Feedback** : Guider le raisonnement scientifique

### Histoire
- **Type** : Déclaratif
- **Modalité principale** : Visuel + Lecture
- **Templates théorie** : contexte → récit → personnages → causes → conséquences
- **Exercices prioritaires** : frise chronologique, analyse de source, carte interactive
- **Feedback** : Contextualiser, ajouter anecdote historique

### Musique
- **Type** : Procédural
- **Modalité principale** : Auditif
- **Templates théorie** : écoute → concept → notation → pratique
- **Exercices prioritaires** : reconnaissance audio, reproduction de rythme
- **Feedback** : Rejouer l'audio correct

### Informatique
- **Type** : Procédural
- **Modalité principale** : Kinesthésique
- **Templates théorie** : analogie → concept → démo → pratique → debug
- **Exercices prioritaires** : programmation par blocs, trouver le bug
- **Feedback** : Exécution pas à pas, surligner ligne d'erreur

---

# PARTIE 4 : TYPES D'EXERCICES UNIVERSELS

## 4.1 Taxonomie par niveau Bloom

| Niveau | Types d'exercices |
|--------|------------------|
| 1. Mémoriser | flashcard, qcm_simple, association |
| 2. Comprendre | qcm_explanation, reformulation |
| 3. Appliquer | fill_blank, calcul, conjugaison |
| 4. Analyser | classification, cause_effet |
| 5. Évaluer | critique, justification |
| 6. Créer | écriture créative, composition |

## 4.2 Nouveaux templates d'exercices

### Manipulation mathématique
- **Composant** : `MathManipulationExercise`
- **Types** : number_line, fraction_visual, geometry, balance, place_value
- **Évaluation** : Auto avec crédit partiel

### Dictée interactive
- **Composant** : `DictationExercise`
- **Features** : Vitesse ajustable, replay limité, surlignage erreurs
- **Évaluation** : IA assistée

### Simulation d'expérience
- **Composant** : `ScienceExperimentSimulation`
- **Features** : Variables, procédure interactive, collecte données
- **Évaluation** : IA assistée

### Analyse de source historique
- **Composant** : `SourceAnalysisExercise`
- **Features** : Document + questions d'analyse
- **Évaluation** : IA assistée

### Programmation par blocs
- **Composant** : `BlockProgrammingExercise`
- **Features** : Blocs visuels, exécution, debug
- **Évaluation** : Auto

---

# PARTIE 5 : PRIORITÉS DE MISE EN ŒUVRE

## Phase 1 : Fondations multi-modales (0-8 sem)
- 🔴 P0 : Table `content_modalities` + seed
- 🔴 P0 : Algorithme `ModalitySelector`
- 🟠 P1 : Composants audio (`AudioBlock`, `NarrationBlock`)
- 🟠 P1 : TTS pour tous les blocs texte

## Phase 2 : Profils de matière (8-14 sem)
- 🔴 P0 : Enrichir table `subject_profiles`
- 🔴 P0 : Créer les 6 profils détaillés
- 🟠 P1 : Adapter génération IA par matière

## Phase 3 : Templates d'exercices (14-22 sem)
- 🔴 P0 : Table `exercise_templates`
- 🔴 P0 : 5 nouveaux types d'exercices
- 🟠 P1 : Évaluation IA pour exercices ouverts

---

# SYNTHÈSE EXÉCUTIVE

## La transformation V5 → V6

La V5 a posé les bases de l'expérience utilisateur complète. La V6 transforme le **cœur pédagogique** en un système **multi-modal et universellement adaptable**.

## Les 3 révolutions

1. **Multi-modalité** : Chaque compétence accessible via 5 canaux sensoriels
2. **Adaptabilité matière** : Chaque discipline a son approche pédagogique propre
3. **Exercices universels** : 20+ types d'exercices couvrant tous les niveaux Bloom

## Indicateurs de succès

| Métrique | Cible 6 mois | Cible 12 mois |
|----------|--------------|---------------|
| Modalités actives par compétence | 3 | 5 |
| Matières avec profil complet | 4 | 8 |
| Types d'exercices disponibles | 12 | 25 |
| Score matching profil/présentation | 75% | 90% |

---

*Document généré le 17/12/2024 - V6*
*Focus : Compétence Multi-Modale, Adaptabilité Universelle*
