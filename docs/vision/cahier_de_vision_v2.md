# 📘 Cahier de Vision – V2
## Plateforme d’apprentissage scolaire adaptative, multilingue et orientée compétences  

---

## 1. Vision & ambition

Créer une plateforme d’apprentissage scolaire universelle, **pilotée par l’IA**, centrée sur les **compétences réelles** de l’apprenant, indépendante de l’âge et de la classe scolaire, capable de s’adapter :
- aux **programmes officiels** de différents pays,
- à la **langue** choisie,
- à la **méthode et au style pédagogiques** sélectionnés par l’utilisateur,

tout en garantissant une expérience **pédagogiquement cohérente, sécurisée, éthique, motivante et scalable**.

👉 Principe fondamental :  
**On n’apprend pas selon son âge, mais selon ce que l’on maîtrise réellement.**

---

## 2. Objectifs stratégiques

### 2.1 Objectifs pédagogiques

- Apprentissage personnalisé, mesurable et progressif
- Validation des acquis par compétences réelles
- Respect des principes cognitifs (effort, compréhension, consolidation)
- IA au service de l’apprentissage, jamais substitutive à l’effort de l’apprenant

### 2.2 Objectifs produit & business

- Plateforme **IA-native** et auto-générative
- Évolutive par nature (matières, pays, langues)
- Modèle freemium clair, compréhensible et soutenable
- Construction d’une **intelligence pédagogique propriétaire** fondée sur l’usage réel

---

## 3. Public cible

### Phase initiale
- Élèves du primaire
- Parents accompagnants

### Évolution
- Enseignants
- Établissements scolaires
- Institutions éducatives

---

## 4. Périmètre initial

- **Matière** : Mathématiques  
- **Niveau** : Primaire  
- **Programme officiel** : France  
- **Langues disponibles** :
  - Français
  - Arabe
  - Anglais

---

## 5. Séparation structurante : Pays, Programme, Langue

- Le **programme scolaire** sert uniquement de cadre de référence officiel.
- Il structure les **matières, modules et compétences**.
- Il n’impose ni ordre, ni rythme, ni méthode pédagogique.

La **langue d’apprentissage** :
- est indépendante du programme,
- peut être modifiée à tout moment,
- ne remet jamais en cause la progression pédagogique.

---

## 6. Modèle pédagogique fondamental

### 6.1 Hiérarchie des contenus

- **Matière**  
  ↳ **Module**  
  ↳ **Compétence** (unité pédagogique atomique)

👉 La **compétence** est :
- la plus petite unité pédagogique exploitable,
- mesurable,
- validable,
- personnalisable.

---

### 6.2 Prévention de la sur-atomisation

- Les compétences sont définies à un **niveau pédagogique pertinent**.
- Aucune micro-compétence purement technique.
- Chaque compétence :
  - est reliée à des prérequis explicites,
  - s’inscrit dans une vision globale du module,
  - inclut des liens vers des compétences parentes ou associées.

---

## 7. Structure standard obligatoire d’une compétence

Chaque compétence générée, qu’elle soit officielle ou utilisateur, respecte une structure stricte et non négociable :

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

👉 Cette structure garantit un **socle pédagogique minimal de qualité**, quelle que soit l’origine du contenu.

---

## 8. Méthodes et styles pédagogiques

### 8.1 Principe fondamental

- **La méthode et le style pédagogiques s’appliquent exclusivement au niveau de la compétence.**
- L’utilisateur est **entièrement libre de choisir la méthode pédagogique** qu’il souhaite pour la génération du contenu.
- La **méthode utilisée est toujours explicitement indiquée** dans les métadonnées de la compétence.
- Une méthode par défaut peut être définie par matière par l’administrateur.

---

### 8.2 Gouvernance pédagogique

- Les méthodes officielles de la plateforme sont validées et documentées.
- L’administrateur peut :
  - définir des méthodes par défaut,
  - recommander certaines méthodes par matière,
  - ajuster les paramètres pédagogiques globaux.
- Le choix de la méthode par l’utilisateur ne modifie jamais :
  - les objectifs pédagogiques,
  - la structure obligatoire d’une compétence.

---

### 8.3 Gestion du contenu officiel par l'administrateur

L'administrateur est responsable de la création et de la gestion du contenu officiel de la plateforme.

#### Génération de matières via IA

L'administrateur peut **générer une matière complète** (avec ses modules et compétences) en sélectionnant :
- le **pays** (programme officiel de référence),
- la **méthode pédagogique** à appliquer,
- la **langue** de génération,
- la **niveau scolaire** si la matière n'est pas disponible dans le programme officiel, créer une matière adaptée au niveau scolaire selectionné et signaler que la matière est ajoutée par la plateforme,
- le **modèle IA** à utiliser pour la génération.

L'IA génère alors :
- la structure de la matière,
- les modules correspondants,
- les compétences avec leurs prérequis et ordre de progression.

**Note importante** : Le contenu des compétences (exercices, explications) se crée au fur et à mesure de l'utilisation de la plateforme, selon les règles de génération dynamique déjà implémentées.

#### Gestion CRUD complète

L'administrateur peut à tout moment :
- **Modifier** une matière, un module ou une compétence existante,
- **Ajouter** de nouveaux modules ou compétences,
- **Supprimer** des éléments individuels ou une matière complète,
- **Réordonner** les modules et compétences.

#### Validation avant publication

Tout contenu créé ou modifié par l'administrateur est soumis à un processus de validation :
- Le contenu est d'abord en statut **"brouillon"** (draft),
- L'administrateur peut **prévisualiser** le contenu avant validation,
- Une fois validé, le contenu passe en statut **"publié"** (published),
- Seul le contenu publié est visible par tous les utilisateurs de la plateforme.

Ce processus garantit la qualité et la cohérence pédagogique du contenu officiel.

---

## 9. Contenu officiel vs contenu utilisateur


- Les **matières et modules officiels** sont définis automatiquement par la plateforme à partir du programme officiel du pays sélectionné.
- Une **liste initiale de compétences** est créée et maintenue par la plateforme.
- Ce contenu est :
  - commun à tous les utilisateurs,
  - modérable,
  - améliorable dans le temps.

---

### 9.2 Contenu généré par les utilisateurs (validation implicite)

Par mesure de sécurité pédagogique et éthique :

- Les utilisateurs **ne peuvent pas créer de nouvelles matières**.
- Ils peuvent uniquement :
  - ajouter des **modules**,
  - ajouter des **compétences**,
  **au sein des matières existantes sur la plateforme**.

👉 Lors de toute génération :
- L’IA vérifie automatiquement que le contenu généré :
  - correspond bien à la **matière sélectionnée**,
  - respecte le cadre pédagogique attendu,
  - ne sort pas du domaine disciplinaire.
- Cette vérification constitue une **validation implicite de sécurité**.

Le contenu utilisateur :
- est stocké dans l’espace personnel,
- peut être partagé partiellement ou totalement :
  - avec des utilisateurs spécifiques,
  - avec un groupe,
  - ou publiquement.
- est **clairement identifié** comme contenu utilisateur,
- peut être **noté par la communauté**.

👉 Aucune ambiguïté entre contenu officiel et contenu utilisateur.

---

## 10. Accès gratuit vs premium

### Accès gratuit
- Création limitée de modules et compétences
- Enrichissement restreint
- Découverte réelle mais encadrée

### Accès premium
- Création illimitée
- Personnalisation avancée
- Accès complet aux capacités IA
- Suivi pédagogique approfondi

---

## 11. Exercices, tokens et responsabilité IA

- Chaque compétence contient obligatoirement des exercices.
- Les compétences officielles peuvent être enrichies par les utilisateurs :
  - jusqu’à **10 exercices par compétence**,
  - via les tokens fournis par la plateforme.

Au-delà de **10 exercices par compétence** :
- l’utilisateur peut générer des exercices supplémentaires uniquement :
  - avec ses **tokens personnels**,
  - via sa **clé API personnelle**.

👉 Un message d’information clair est affiché pour prévenir l’utilisateur à chaque changement de mode.

Objectif :
**responsabiliser l’usage de l’IA sans créer de friction cachée**.

---

## 12. Intelligence artificielle pédagogique

### 12.1 Génération dynamique

- Si un contenu n’existe pas → génération IA immédiate.
- Le contenu est stocké, traçable et réutilisable.
- La base pédagogique s’enrichit naturellement avec l’usage.

---

### 12.2 Parcours adaptatif maîtrisé

L’IA analyse :
- réponses,
- erreurs,
- temps de résolution,
- tentatives,
- préférences détectées.

Règles clés :
- alternance consolidation / défi,
- évitement de la sur-adaptation,
- exposition volontaire à des compétences légèrement plus complexes.

---

## 13. Motivation & engagement

- Progression visualisée par compétences réelles
- Feedback explicatif et bienveillant
- Gamification raisonnée :
  - badges non compétitifs,
  - défis personnalisés,
  - valorisation de l’effort et de la persévérance

---

## 14. Rôle du parent

- Tableau de bord clair
- Vision précise des acquis et blocages
- Conseils concrets d’accompagnement
- Transparence totale sur le parcours de l’enfant

---

## 15. Données & intelligence pédagogique propriétaire

Données anonymisées :
- progression par compétence,
- typologie des erreurs,
- efficacité des méthodes,
- temps de compréhension.

Utilisation :
- amélioration continue des parcours,
- détection des blocages récurrents,
- affinement des recommandations pédagogiques.

---

## 16. Éthique, confiance et protection des enfants

### 16.1 IA responsable

- L’IA ne fournit jamais la réponse brute par défaut.
- Indices progressifs et guidage raisonné.
- L’apprenant reste acteur de son apprentissage.

### 16.2 Protection des données

- RGPD by design
- Données minimisées et sécurisées
- Consentement parental explicite
- Aucune exploitation commerciale des données enfants

---

## 17. Architecture & évolutivité

- Plateforme IA-native
- Contenus générés dynamiquement
- Paramétrage pédagogique plutôt que logique figée
- Ajout futur sans refonte :
  - nouvelles matières,
  - nouveaux pays,
  - nouvelles langues

---

## 18. Vision long terme

- Référence mondiale de l’apprentissage par compétences
- Plateforme multi-matières et multi-pays
- Intelligence pédagogique propriétaire fondée sur des millions de parcours réels
- Éducation personnalisée, éthique et mesurable à grande échelle

---

## 19. Critères de succès

- L’apprenant progresse réellement
- Le parcours est compris et motivant
- Les parents constatent des résultats concrets
- La plateforme s’améliore automatiquement avec l’usage

---
