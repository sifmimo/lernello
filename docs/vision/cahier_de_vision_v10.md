# 📘 Cahier de Vision – V10
## Plateforme d'Apprentissage Scolaire Adaptative, Multilingue et Orientée Compétences
### Version consolidée - Décembre 2024

---

# 1. VISION & AMBITION

Créer une plateforme d'apprentissage scolaire universelle, **pilotée par l'IA**, centrée sur les **compétences réelles** de l'apprenant, indépendante de l'âge et de la classe scolaire.

> **Principe fondamental : On n'apprend pas selon son âge, mais selon ce que l'on maîtrise réellement.**

### Capacités d'adaptation
- Aux **programmes officiels** de différents pays
- À la **langue** choisie (FR, AR, EN)
- À la **méthode et au style pédagogiques** sélectionnés
- Au **niveau réel** de l'apprenant

---

# 2. OBJECTIFS STRATÉGIQUES

## 2.1 Objectifs Pédagogiques
- Apprentissage personnalisé, mesurable et progressif
- Validation des acquis par compétences réelles
- Respect des principes cognitifs (effort, compréhension, consolidation)
- IA au service de l'apprentissage, jamais substitutive à l'effort

## 2.2 Objectifs Produit & Business
- Plateforme **IA-native** et auto-générative
- Évolutive par nature (matières, pays, langues)
- Modèle freemium clair et soutenable
- Intelligence pédagogique propriétaire fondée sur l'usage réel

---

# 3. PUBLIC CIBLE

### Phase initiale
- Élèves du primaire (6-11 ans)
- Parents accompagnants

### Évolution future
- Enseignants
- Établissements scolaires
- Institutions éducatives

---

# 4. MODÈLE PÉDAGOGIQUE

## 4.1 Hiérarchie des Contenus

```
Matière
  └── Module (Domaine)
        └── Compétence (unité atomique)
              └── Exercices
```

La **compétence** est :
- La plus petite unité pédagogique exploitable
- Mesurable et validable
- Personnalisable selon la méthode pédagogique

## 4.2 Structure Standard d'une Compétence

1. **Métadonnées** (matière, module, langue, méthode, source)
2. **Intitulé** clair et actionnable
3. **Objectif pédagogique** mesurable
4. **Prérequis** explicites
5. **Mise en contexte** motivante
6. **Explication théorique** obligatoire
7. **Exemples guidés**
8. **Exercices progressifs** obligatoires (min. 10)
9. **Corrections** avec feedback explicatif
10. **Auto-évaluation**
11. **Synthèse / À retenir**

---

# 5. SESSIONS D'APPRENTISSAGE STRUCTURÉES

## 5.1 Principe Fondamental

> **Une session d'apprentissage = Un parcours complet avec début, milieu et fin.**

L'utilisateur ne "fait pas des exercices". Il **vit une session d'apprentissage** structurée, engageante et gratifiante.

## 5.2 Types de Sessions

| Type | Contenu | Durée |
|------|---------|-------|
| **Apprendre** | Théorie + exercices guidés | ~5 min |
| **S'entraîner** | Exercices de pratique | ~5 min |
| **Réviser** | Révision des acquis | ~3 min |

## 5.3 Structure d'une Session

```
[Théorie] → [Exercice 1] → [Exercice 2] → ... → [Récapitulatif]
    │            │              │                    │
    ▼            ▼              ▼                    ▼
 Lecture     Réponse        Réponse              Stats
 + Exemples  + Feedback     + Feedback           + XP
                                                 + Badges
```

## 5.4 Récapitulatif de Fin de Session

- Nombre de bonnes réponses
- Temps passé
- XP gagnés
- Badges débloqués
- Option "Continuer avec plus d'exercices"

---

# 6. SYSTÈME D'EXERCICES

## 6.1 Types d'Exercices Supportés

### Types Basiques
- **QCM** : Question à choix multiple (4 options)
- **Texte à trous** : Compléter les blanks dans une phrase
- **Réponse libre** : Saisie de texte avec évaluation IA

### Types Interactifs
- **Glisser-déposer** : Ordonner des éléments par manipulation
- **Association** : Relier des paires correspondantes
- **Tri/Classement** : Classer des éléments dans des catégories

### Types Multimédia
- **Écoute audio** : Écouter un audio et répondre à une question
- **Enregistrement vocal** : Enregistrer sa voix pour répondre
- **Vidéo interactive** : Regarder une vidéo et répondre à des questions

### Types Créatifs
- **Dessin** : Dessiner une réponse ou compléter un schéma
- **Animation interactive** : Interagir avec une animation pour apprendre

### Types Avancés
- **QCM avec images** : Choisir parmi des images
- **Zone cliquable** : Cliquer sur la bonne zone d'une image
- **Chronologie** : Placer des événements sur une frise chronologique
- **Puzzle** : Reconstituer une image ou un concept

### Configuration par Compétence
- L'admin peut configurer les types autorisés par compétence
- Types prioritaires (⭐) pour la génération IA
- Par défaut, tous les types basiques et interactifs sont activés

## 6.2 Pool d'Exercices

- Minimum **10 exercices** par compétence (pré-générés)
- Exercices validés et de qualité garantie
- Score de qualité automatique
- Rotation parfaite (jamais le même exercice 2x de suite)

## 6.3 Génération d'Exercices et Tokens

### Exercices Gratuits (via plateforme)
- **10 exercices gratuits** par compétence par utilisateur
- Générés via les tokens de la plateforme

### Exercices Supplémentaires
Au-delà de 10 exercices :
- L'utilisateur doit utiliser ses **tokens personnels**
- Ou configurer sa **clé API personnelle**
- Message d'information et validation explicite avant génération

> **Objectif : Responsabiliser l'usage de l'IA sans friction cachée**

---

# 7. ALGORITHME DE ROTATION

## 7.1 Sélection des Exercices

```typescript
// Principes de sélection
1. Récupérer le pool d'exercices actifs
2. Identifier les exercices non vus dans cette rotation
3. Si tous vus → nouvelle rotation
4. Varier les types (QCM, texte à trous, etc.)
5. Prioriser par score de qualité
```

## 7.2 Garanties

- **Jamais** le même exercice 2x de suite
- **Rotation complète** avant répétition
- **Variété des types** d'exercices
- **Difficulté adaptative** basée sur la performance

---

# 8. SYSTÈME TTS (TEXT-TO-SPEECH)

## 8.1 Service Unifié

- Un seul service TTS pour toute l'application
- Support natif (Web Speech API) et OpenAI TTS
- Paramètres configurables (voix, vitesse, pitch)

## 8.2 Fonctionnalités

- Lecture automatique des questions
- Bouton de lecture manuelle
- Option de désactivation globale
- Voix française de qualité (Amélie, Marie, etc.)

---

# 9. CONTENU OFFICIEL VS UTILISATEUR

## 9.1 Contenu Officiel

- Matières et modules définis par la plateforme
- Basé sur les programmes officiels
- Commun à tous les utilisateurs
- Modérable et améliorable

## 9.2 Contenu Utilisateur

- Création de modules et compétences dans les matières existantes
- Validation implicite par l'IA (cohérence avec la matière)
- Stocké dans l'espace personnel
- Partageable avec la communauté
- Clairement identifié comme contenu utilisateur

---

# 10. ACCÈS GRATUIT VS PREMIUM

### Accès Gratuit
- Création limitée de modules et compétences
- 10 exercices gratuits par compétence
- Découverte réelle mais encadrée

### Accès Premium
- Création illimitée
- Personnalisation avancée
- Accès complet aux capacités IA
- Suivi pédagogique approfondi

---

# 11. GAMIFICATION INTELLIGENTE

## 11.1 Système XP

- XP gagnés à chaque bonne réponse
- Bonus pour les séries de bonnes réponses
- Niveaux progressifs

## 11.2 Badges et Récompenses

- Badges significatifs (pas de manipulation)
- Streaks avec protection
- Progression visible sur la carte des compétences

## 11.3 Feedback

- Feedback immédiat (correct/incorrect)
- Animations et célébrations
- Confettis pour les bonnes performances

---

# 12. RÔLE DU PARENT

- Tableau de bord clair
- Vision précise des acquis et blocages
- Conseils concrets d'accompagnement
- Transparence totale sur le parcours
- Notifications de progression

---

# 13. INTERFACE UTILISATEUR

## 13.1 Vision UX/UI

Le meilleur rendu éducatif repose sur une **interface épurée, hiérarchisée et cohérente**, où chaque élément visuel a une fonction pédagogique claire.

L'UX privilégie des **interactions évidentes et naturelles**, accessibles sans explication, avec des zones d'action larges, une navigation fluide et une réduction maximale de la charge cognitive.

L'ensemble crée une **expérience calme, intuitive et fiable**, dans laquelle l'utilisateur se concentre exclusivement sur le contenu et la compréhension, sans effort d'appropriation de l'interface.

## 13.2 Principes de Design

### Typographie
- Lisible et généreuse, pensée pour l'apprentissage
- Contraste élevé pour une lecture confortable
- Hiérarchie claire entre question, options et instructions

### Palette de couleurs
- Sobre et fonctionnelle
- Utilisée pour **guider et confirmer**, jamais pour distraire
- États visuels distincts : neutre, sélectionné, correct, incorrect
- Pas de rouge agressif pour les erreurs (ton bienveillant)

### Animations
- Discrètes et intentionnelles
- Limitées aux transitions, feedbacks et changements d'état
- Durée courte (150-200ms)
- Aucune animation en boucle ou distrayante

### Composants
- Consistants, réutilisables et reconnaissables
- Zones d'action larges (minimum 48px)
- États visuels cohérents sur toute la plateforme

### Feedback
- Immédiat sur chaque action
- Bienveillant et non punitif
- Encourageant même en cas d'erreur
- Révélation progressive de la bonne réponse

## 13.3 Écran de Session

```
┌─────────────────────────────────────────────────────────────┐
│  ← [X]              ████████░░░░░░░░░░ 4/10              🔊 │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐
│  │              [CONTENU PRINCIPAL]                        │
│  │         Théorie / Question / Récapitulatif              │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐
│  │              [ZONE D'INTERACTION]                       │
│  │         Options / Input / Bouton Continuer              │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐
│  │  💡 Besoin d'aide ?                    [VÉRIFIER]       │
│  └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

## 13.4 Responsive Design

- Mobile-first
- Adaptation fluide tablette/desktop
- Zones tactiles optimisées pour tous les appareils
- Pas de scroll horizontal

---

# 14. INTELLIGENCE ARTIFICIELLE

## 14.1 Génération Dynamique

- Contenu généré à la demande si inexistant
- Stocké, traçable et réutilisable
- Base pédagogique qui s'enrichit avec l'usage

## 14.2 Parcours Adaptatif

L'IA analyse :
- Réponses et erreurs
- Temps de résolution
- Tentatives
- Préférences détectées

Règles :
- Alternance consolidation / défi
- Évitement de la sur-adaptation
- Exposition à des compétences légèrement plus complexes

## 14.3 Évaluation IA

- Évaluation sémantique des réponses libres
- Feedback personnalisé
- Indices progressifs (jamais la réponse brute)

---

# 15. ÉTHIQUE ET PROTECTION

## 15.1 IA Responsable

- L'IA ne fournit jamais la réponse brute par défaut
- Indices progressifs et guidage raisonné
- L'apprenant reste acteur de son apprentissage

## 15.2 Protection des Données

- RGPD by design
- Données minimisées et sécurisées
- Consentement parental explicite
- Aucune exploitation commerciale des données enfants

---

# 16. ARCHITECTURE TECHNIQUE

## 16.1 Stack Technique

- **Frontend** : Next.js 15, React, TailwindCSS
- **Backend** : Supabase (PostgreSQL, Auth, Storage)
- **IA** : OpenAI GPT-5.2 (par défaut)
- **Déploiement** : Docker, Netlify

## 16.2 Tables Principales

- `subjects` : Matières
- `domains` : Modules
- `skills` : Compétences
- `exercises` : Exercices
- `learning_sessions` : Sessions d'apprentissage
- `student_skill_progress` : Progression des élèves
- `student_exercise_rotation` : Rotation des exercices

---

# 17. MÉTRIQUES DE SUCCÈS

## 17.1 KPIs Techniques

| Métrique | Cible |
|----------|-------|
| Taux d'échec génération IA | 0% (pré-généré) |
| Exercices en doublon consécutif | 0% |
| Temps de chargement exercice | <200ms |
| Sessions abandonnées | <20% |

## 17.2 KPIs Utilisateur

| Métrique | Cible |
|----------|-------|
| Sessions complétées/jour | 2+ |
| Temps moyen par session | 5 min |
| Taux de retour J+1 | 60% |
| NPS | 50+ |

---

# 18. RECOMMANDATIONS D'AMÉLIORATION

## 18.1 Court Terme (Priorité Haute)

1. **Validation du contenu IA** : Ajouter une validation humaine pour les exercices générés
2. **Mode hors-ligne** : Permettre l'apprentissage sans connexion
3. **Notifications push** : Rappels pour maintenir les streaks
4. **Tests A/B** : Optimiser l'UX avec des tests utilisateurs

## 18.2 Moyen Terme

5. **Reconnaissance vocale** : Réponses orales pour les jeunes enfants
6. **Avatars personnalisables** : Renforcer l'engagement
7. **Défis entre amis** : Gamification sociale
8. **Rapports PDF** : Export des progrès pour les parents
9. **Mode enseignant** : Suivi de classe

## 18.3 Long Terme

10. **Nouvelles matières** : Français, Sciences, Histoire
11. **Nouveaux pays** : Programmes internationaux
12. **Application mobile native** : iOS et Android
13. **Intégration LMS** : Connexion avec les outils scolaires
14. **IA conversationnelle** : Tuteur virtuel interactif

---

# 19. VISION LONG TERME

- Référence mondiale de l'apprentissage par compétences
- Plateforme multi-matières et multi-pays
- Intelligence pédagogique propriétaire fondée sur des millions de parcours réels
- Éducation personnalisée, éthique et mesurable à grande échelle

---

# 20. CRITÈRES DE SUCCÈS

- ✅ L'apprenant progresse réellement
- ✅ Le parcours est compris et motivant
- ✅ Les parents constatent des résultats concrets
- ✅ La plateforme s'améliore automatiquement avec l'usage
- ✅ Chaque session donne envie de faire la suivante

---

*Document consolidé le 19/12/2024 - V10*
*Fusion des versions V1 à V9*
