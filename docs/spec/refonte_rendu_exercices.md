# Spécification Technique : Refonte du Rendu des Exercices

**Version** : 1.0  
**Date** : 19 décembre 2024  
**Statut** : À implémenter

---

## 1. CONTEXTE ET OBJECTIFS

### 1.1 Problématique actuelle

Le rendu actuel des exercices présente plusieurs limitations :
- Interface visuellement chargée avec trop d'éléments décoratifs
- Incohérence stylistique entre les différents types d'exercices
- Animations parfois distrayantes
- Feedback visuel insuffisamment clair
- Charge cognitive élevée pour l'utilisateur

### 1.2 Objectifs de la refonte

Créer une expérience d'apprentissage **calme, intuitive et fiable** où l'utilisateur se concentre exclusivement sur le contenu et la compréhension, sans effort d'appropriation de l'interface.

---

## 2. PRINCIPES DIRECTEURS

### 2.1 Interface épurée et hiérarchisée

- Chaque élément visuel a une **fonction pédagogique claire**
- Suppression de tout élément décoratif sans utilité
- Hiérarchie visuelle évidente : question → zone d'interaction → feedback
- Espacement généreux entre les éléments

### 2.2 Interactions évidentes et naturelles

- Zones d'action **larges et facilement cliquables** (min 48px)
- Navigation fluide sans friction
- Aucune explication nécessaire pour comprendre l'interaction
- Réduction maximale de la charge cognitive

### 2.3 Feedback immédiat et bienveillant

- Retour visuel instantané sur chaque action
- Ton **encourageant et non punitif**
- Distinction claire entre états : neutre, sélectionné, correct, incorrect
- Pas de messages culpabilisants en cas d'erreur

---

## 3. SYSTÈME DE DESIGN

### 3.1 Typographie

| Élément | Police | Taille | Poids | Ligne |
|---------|--------|--------|-------|-------|
| Question principale | Inter | 20px (mobile) / 24px (desktop) | 600 | 1.4 |
| Options de réponse | Inter | 16px / 18px | 500 | 1.5 |
| Instructions | Inter | 14px / 16px | 400 | 1.5 |
| Feedback | Inter | 14px / 16px | 500 | 1.4 |
| Labels secondaires | Inter | 12px / 14px | 400 | 1.4 |

**Principes typographiques** :
- Lisibilité maximale avec contraste élevé (WCAG AA minimum)
- Espacement inter-lettres légèrement augmenté pour les jeunes lecteurs
- Pas de texte en majuscules sauf pour les labels courts

### 3.2 Palette de couleurs

#### Couleurs principales

| Usage | Couleur | Hex | Utilisation |
|-------|---------|-----|-------------|
| Fond principal | Blanc cassé | `#FAFAFA` | Arrière-plan des exercices |
| Texte principal | Gris foncé | `#1A1A1A` | Questions, options |
| Texte secondaire | Gris moyen | `#6B7280` | Instructions, labels |
| Bordure neutre | Gris clair | `#E5E7EB` | Contours des options |

#### Couleurs d'état

| État | Couleur | Hex | Utilisation |
|------|---------|-----|-------------|
| Sélection | Bleu doux | `#3B82F6` | Option sélectionnée |
| Sélection fond | Bleu très clair | `#EFF6FF` | Fond option sélectionnée |
| Succès | Vert doux | `#10B981` | Réponse correcte |
| Succès fond | Vert très clair | `#ECFDF5` | Fond réponse correcte |
| Erreur | Orange doux | `#F59E0B` | Réponse incorrecte (non punitif) |
| Erreur fond | Orange très clair | `#FFFBEB` | Fond réponse incorrecte |

**Principes chromatiques** :
- Couleurs sobres, jamais saturées
- Utilisation pour **guider et confirmer**, jamais pour distraire
- Pas de rouge vif pour les erreurs (trop punitif)
- Cohérence absolue entre tous les types d'exercices

### 3.3 Animations

#### Principes

- **Discrètes et intentionnelles**
- Limitées aux transitions, feedbacks et changements d'état
- Durée courte : 150-200ms pour les micro-interactions
- Easing naturel : `ease-out` pour les apparitions, `ease-in-out` pour les transitions

#### Animations autorisées

| Action | Animation | Durée | Easing |
|--------|-----------|-------|--------|
| Sélection option | Scale 1.02 + bordure | 150ms | ease-out |
| Validation réponse | Fade couleur | 200ms | ease-in-out |
| Apparition feedback | Slide up + fade | 200ms | ease-out |
| Ajout élément (drag) | Scale 0.95 → 1 | 150ms | ease-out |
| Suppression élément | Fade out | 100ms | ease-in |

#### Animations interdites

- Rebonds (bounce)
- Rotations
- Effets de particules
- Animations en boucle
- Shake sur erreur

### 3.4 Composants réutilisables

#### ExerciseContainer

```
┌─────────────────────────────────────────┐
│  [Progression: 3/10]      [Aide 💡]     │
├─────────────────────────────────────────┤
│                                         │
│  Question principale                    │
│  (grande, lisible, centrée)             │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Zone d'interaction                     │
│  (adaptée au type d'exercice)           │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Valider]                              │
│                                         │
└─────────────────────────────────────────┘
```

#### OptionButton (pour QCM)

- Hauteur minimale : 56px
- Padding : 16px horizontal, 12px vertical
- Border-radius : 12px
- Bordure : 2px solid
- États : default, hover, selected, correct, incorrect

#### InputField (pour réponses libres)

- Hauteur : 56px
- Padding : 16px
- Border-radius : 12px
- Bordure : 2px solid
- Focus ring visible et accessible

#### DraggableItem

- Padding : 12px 16px
- Border-radius : 8px
- Ombre légère au survol
- Curseur grab/grabbing

#### FeedbackBanner

- Position : sous la zone d'interaction
- Padding : 16px
- Border-radius : 12px
- Icône + message concis

---

## 4. SPÉCIFICATIONS PAR TYPE D'EXERCICE

### 4.1 QCM (Question à Choix Multiple)

#### Structure

```
┌─────────────────────────────────────────┐
│                                         │
│  "Combien font 7 + 5 ?"                 │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  A    12                        │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  B    11                        │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  C    13                        │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  D    10                        │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

#### Comportement

1. **État initial** : Options avec bordure grise, fond blanc
2. **Survol** : Bordure légèrement plus foncée
3. **Sélection** : Bordure bleue, fond bleu très clair, indicateur rempli
4. **Correct** : Bordure verte, fond vert clair, icône ✓
5. **Incorrect** : Bordure orange, fond orange clair (pas de ✗ agressif)
6. **Bonne réponse révélée** : Mise en évidence douce de la bonne option

#### Suppression

- Supprimer les lettres A/B/C/D dans des cercles colorés
- Utiliser un indicateur radio simple à gauche
- Pas d'animation de scale au survol (trop distrayant)

### 4.2 QCM avec Images (image_qcm)

#### Structure

```
┌─────────────────────────────────────────┐
│                                         │
│  "Quel animal vit dans l'eau ?"         │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────┐    ┌───────────┐         │
│  │           │    │           │         │
│  │   🐟      │    │   🐕      │         │
│  │  Poisson  │    │   Chien   │         │
│  └───────────┘    └───────────┘         │
│                                         │
│  ┌───────────┐    ┌───────────┐         │
│  │           │    │           │         │
│  │   🐈      │    │   🐦      │         │
│  │   Chat    │    │   Oiseau  │         │
│  └───────────┘    └───────────┘         │
│                                         │
└─────────────────────────────────────────┘
```

#### Comportement

- Grille 2x2 avec espacement uniforme (16px)
- Cartes carrées avec ratio 1:1
- Emoji/image centré, label en dessous
- Même système d'états que le QCM classique
- Pas de bordure épaisse (3px → 2px)

### 4.3 Texte à trous (fill_blank)

#### Structure

```
┌─────────────────────────────────────────┐
│                                         │
│  Complète la phrase :                   │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  "Le chat mange une [________]."        │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

#### Comportement

- Champ de saisie inline avec le texte
- Largeur adaptée au contenu attendu (min 80px, max 200px)
- Bordure inférieure uniquement (style soulignement)
- Focus : bordure bleue
- Correct : bordure verte, texte vert
- Incorrect : bordure orange, affichage de la réponse attendue en dessous

### 4.4 Réponse libre (free_input)

#### Structure

```
┌─────────────────────────────────────────┐
│                                         │
│  "Quel est le résultat de 15 - 8 ?"     │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Ta réponse...                  │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

#### Comportement

- Champ de saisie pleine largeur
- Placeholder discret
- Validation au clic ou touche Entrée
- Feedback clair sous le champ

### 4.5 Glisser-déposer (drag_drop)

#### Structure

```
┌─────────────────────────────────────────┐
│                                         │
│  Remets les mots dans l'ordre :         │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Zone de dépôt (ordonnée)               │
│  ┌─────────────────────────────────┐    │
│  │  1. [mot]  2. [mot]  3. [___]   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Éléments disponibles                   │
│  ┌──────┐ ┌──────┐ ┌──────┐            │
│  │ chat │ │mange │ │ le   │            │
│  └──────┘ └──────┘ └──────┘            │
│                                         │
└─────────────────────────────────────────┘
```

#### Comportement

- **Zone de dépôt** : fond légèrement grisé, bordure pointillée
- **Éléments** : boutons avec ombre légère
- **Interaction** : clic pour ajouter/retirer (pas de drag réel sur mobile)
- **Numérotation** : indicateurs de position discrets
- Animation d'ajout : scale 0.95 → 1

### 4.6 Association de paires (match_pairs)

#### Structure

```
┌─────────────────────────────────────────┐
│                                         │
│  Associe chaque mot à sa traduction :   │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Colonne A          Colonne B           │
│  ┌──────────┐       ┌──────────┐        │
│  │  Chat    │───────│  Cat     │        │
│  └──────────┘       └──────────┘        │
│  ┌──────────┐       ┌──────────┐        │
│  │  Chien   │       │  Bird    │        │
│  └──────────┘       └──────────┘        │
│  ┌──────────┐       ┌──────────┐        │
│  │  Oiseau  │       │  Dog     │        │
│  └──────────┘       └──────────┘        │
│                                         │
└─────────────────────────────────────────┘
```

#### Comportement

- Deux colonnes alignées
- Sélection séquentielle : gauche puis droite
- Ligne de connexion visuelle entre les paires formées
- Couleur de la ligne selon l'état (neutre, correct, incorrect)

### 4.7 Tri/Classement (sorting)

#### Structure

```
┌─────────────────────────────────────────┐
│                                         │
│  Classe ces aliments :                  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐  ┌─────────────┐       │
│  │  Fruits     │  │  Légumes    │       │
│  │  ─────────  │  │  ─────────  │       │
│  │  [pomme]    │  │  [carotte]  │       │
│  │  [banane]   │  │             │       │
│  └─────────────┘  └─────────────┘       │
│                                         │
│  Éléments à classer :                   │
│  [tomate] [orange] [salade]             │
│                                         │
└─────────────────────────────────────────┘
```

#### Comportement

- Catégories clairement identifiées avec titre
- Glisser ou cliquer pour assigner
- Possibilité de retirer un élément mal placé
- Feedback par élément après validation

### 4.8 Chronologie (timeline)

#### Structure

```
┌─────────────────────────────────────────┐
│                                         │
│  Place les événements dans l'ordre :    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ──●────────●────────●────────●──       │
│    1        2        3        4         │
│                                         │
│  Zone de placement :                    │
│  [Événement A] [Événement B] [___]      │
│                                         │
│  Événements disponibles :               │
│  [Événement C] [Événement D]            │
│                                         │
└─────────────────────────────────────────┘
```

#### Comportement

- Représentation visuelle de la frise (ligne horizontale)
- Positions numérotées
- Même interaction que drag_drop
- Suppression des dégradés de couleur

### 4.9 Zone cliquable (hotspot)

#### Structure

```
┌─────────────────────────────────────────┐
│                                         │
│  Clique sur le triangle :               │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │  ○   │ │  □   │ │  △   │ │  ◇   │   │
│  │Cercle│ │Carré │ │Trian.│ │Losang│   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│                                         │
└─────────────────────────────────────────┘
```

#### Comportement

- Grille d'éléments cliquables
- Un seul élément sélectionnable
- Mise en évidence claire de la sélection
- Suppression du scénario décoratif (gradient)

### 4.10 Puzzle

#### Structure

```
┌─────────────────────────────────────────┐
│                                         │
│  Reconstitue la phrase :                │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Zone de construction :                 │
│  [Le] [chat] [dort] [___]               │
│                                         │
│  Pièces disponibles :                   │
│  [sur] [le] [canapé]                    │
│                                         │
└─────────────────────────────────────────┘
```

#### Comportement

- Similaire à drag_drop
- Pièces visuellement distinctes
- Suppression des dégradés violet/rose

### 4.11 Dessin (drawing)

#### Structure

```
┌─────────────────────────────────────────┐
│                                         │
│  Dessine un cercle :                    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │      Zone de dessin             │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Effacer] [Terminer]                   │
│                                         │
└─────────────────────────────────────────┘
```

#### Comportement

- Canvas blanc avec bordure fine
- Outils minimalistes : crayon, gomme, couleurs de base
- Bouton "Terminer" pour valider
- Évaluation par l'IA avec feedback bienveillant

### 4.12 Animation interactive

#### Structure

```
┌─────────────────────────────────────────┐
│                                         │
│  Observe et réponds :                   │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │      Zone d'animation           │    │
│  │      [▶ Jouer]                  │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Question après visionnage...           │
│                                         │
└─────────────────────────────────────────┘
```

#### Comportement

- Animation contrôlée par l'utilisateur (play/pause)
- Question révélée après visionnage
- Possibilité de revoir l'animation

---

## 5. COMPOSANTS TECHNIQUES

### 5.1 Architecture des composants

```
src/components/exercises/
├── ExerciseContainer.tsx      # Conteneur principal
├── ExerciseQuestion.tsx       # Affichage de la question
├── ExerciseFeedback.tsx       # Bannière de feedback
├── ExerciseActions.tsx        # Boutons d'action
├── types/
│   ├── QCMExercise.tsx
│   ├── ImageQCMExercise.tsx
│   ├── FillBlankExercise.tsx
│   ├── FreeInputExercise.tsx
│   ├── DragDropExercise.tsx
│   ├── MatchPairsExercise.tsx
│   ├── SortingExercise.tsx
│   ├── TimelineExercise.tsx
│   ├── HotspotExercise.tsx
│   ├── PuzzleExercise.tsx
│   ├── DrawingExercise.tsx
│   └── AnimationExercise.tsx
├── shared/
│   ├── OptionButton.tsx
│   ├── InputField.tsx
│   ├── DraggableItem.tsx
│   ├── DropZone.tsx
│   └── ProgressIndicator.tsx
└── hooks/
    ├── useExerciseState.ts
    ├── useExerciseFeedback.ts
    └── useExerciseAnimation.ts
```

### 5.2 Technologies utilisées

| Technologie | Usage | Justification |
|-------------|-------|---------------|
| React 18+ | Composants | Stabilité, écosystème |
| Framer Motion | Animations | API déclarative, performance |
| TailwindCSS | Styles | Cohérence, maintenabilité |
| Radix UI | Primitives | Accessibilité native |
| React DnD | Drag & drop | Robustesse, accessibilité |

### 5.3 Tokens de design (CSS Variables)

```css
:root {
  /* Couleurs */
  --color-bg-primary: #FAFAFA;
  --color-bg-secondary: #F3F4F6;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B7280;
  --color-border-default: #E5E7EB;
  --color-border-hover: #D1D5DB;
  
  --color-selection: #3B82F6;
  --color-selection-bg: #EFF6FF;
  --color-success: #10B981;
  --color-success-bg: #ECFDF5;
  --color-warning: #F59E0B;
  --color-warning-bg: #FFFBEB;
  
  /* Espacements */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Rayons */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  
  /* Ombres */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  
  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-normal: 200ms ease-in-out;
}
```

---

## 6. ACCESSIBILITÉ

### 6.1 Exigences WCAG 2.1 AA

- Contraste texte/fond : minimum 4.5:1
- Zones cliquables : minimum 44x44px
- Focus visible sur tous les éléments interactifs
- Navigation clavier complète
- Labels ARIA appropriés
- Annonces pour lecteurs d'écran

### 6.2 Adaptations spécifiques

- Mode daltonien : ne pas se fier uniquement à la couleur
- Icônes accompagnant les états (✓ pour correct, etc.)
- Textes alternatifs pour les images
- Réduction des animations si `prefers-reduced-motion`

---

## 7. PERFORMANCE

### 7.1 Objectifs

| Métrique | Cible |
|----------|-------|
| First Contentful Paint | < 1s |
| Time to Interactive | < 2s |
| Cumulative Layout Shift | < 0.1 |
| Animation frame rate | 60fps |

### 7.2 Optimisations

- Lazy loading des composants d'exercice
- Préchargement du prochain exercice
- Animations GPU-accelerated (transform, opacity)
- Pas de re-render inutile (React.memo, useMemo)

---

## 8. PLAN D'IMPLÉMENTATION

### Phase 1 : Fondations (Semaine 1)

1. Création des tokens de design
2. Composants partagés (OptionButton, InputField, etc.)
3. ExerciseContainer et structure de base

### Phase 2 : Types basiques (Semaine 2)

4. QCM et QCM avec images
5. Texte à trous
6. Réponse libre

### Phase 3 : Types interactifs (Semaine 3)

7. Glisser-déposer
8. Association de paires
9. Tri/Classement

### Phase 4 : Types avancés (Semaine 4)

10. Chronologie
11. Zone cliquable
12. Puzzle
13. Dessin
14. Animation

### Phase 5 : Polish (Semaine 5)

15. Tests d'accessibilité
16. Optimisations performance
17. Tests utilisateurs
18. Ajustements finaux

---

## 9. CRITÈRES DE VALIDATION

### 9.1 Checklist par exercice

- [ ] Interface épurée sans élément superflu
- [ ] Hiérarchie visuelle claire
- [ ] Zones d'action ≥ 48px
- [ ] États visuels distincts et cohérents
- [ ] Animations ≤ 200ms
- [ ] Feedback immédiat et bienveillant
- [ ] Accessible au clavier
- [ ] Contraste WCAG AA
- [ ] Performance 60fps

### 9.2 Tests utilisateurs

- Compréhension immédiate de l'interaction (< 3s)
- Aucune confusion sur l'état actuel
- Feedback perçu comme encourageant
- Concentration maintenue sur le contenu

---

## 10. ANNEXES

### 10.1 Références visuelles

- Apple Human Interface Guidelines
- Material Design 3
- Duolingo (feedback bienveillant)
- Khan Academy (clarté pédagogique)

### 10.2 Ressources

- Figma : [Lien vers les maquettes]
- Storybook : [Lien vers la documentation des composants]
- Tests A/B : [Lien vers les résultats]
