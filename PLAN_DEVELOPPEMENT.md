# 📋 Plan de Développement — Lernello

> **Dernière mise à jour** : 2025-12-12  
> **Statut global** : 🟡 Phase 3 en cours

---

## 🎯 Objectif

Développer le MVP de Lernello en 12 semaines avec une approche itérative.

---

## 📌 Conventions

- ⬜ À faire
- 🔄 En cours
- ✅ Terminé
- ⏸️ Bloqué
- ❌ Annulé

---

## Phase 0 — Setup & Infrastructure (Semaine 1)

### 0.1 Environnement de développement

- ✅ Créer le repository GitHub
- ✅ Configurer le projet Supabase (via MCP)
- ✅ Créer le `docker-compose.yml` pour le développement local
- ✅ Créer le `Dockerfile.dev`
- ✅ Configurer les variables d'environnement (`.env.example`)
- ✅ Vérifier que Docker fonctionne correctement

### 0.2 Initialisation Next.js

- ✅ Initialiser le projet Next.js 15 avec TypeScript (dans Docker)
- ✅ Configurer ESLint + Prettier
- ✅ Configurer TailwindCSS
- ✅ Installer et configurer shadcn/ui
- ✅ Configurer la structure des dossiers (`src/`)
- ✅ Créer le fichier `next.config.js` avec les headers de sécurité

### 0.3 CI/CD

- ⬜ Configurer GitHub Actions (lint, type-check, tests)
- ⬜ Configurer Vercel pour le déploiement
- ⬜ Configurer les environnements (preview, production)

---

## Phase 1 — Base de données & Auth (Semaine 2)

### 1.1 Schéma Supabase

- ✅ Créer la table `users`
- ✅ Créer la table `student_profiles`
- ✅ Créer la table `parent_student_links`
- ✅ Créer la table `user_ai_settings` (clés API personnalisées)
- ✅ Configurer les politiques RLS pour chaque table
- ✅ Créer les index nécessaires

### 1.2 Authentification

- ✅ Configurer Supabase Auth
- ✅ Implémenter l'inscription parent (email/password)
- ✅ Implémenter la connexion
- ✅ Implémenter la déconnexion
- ✅ Implémenter la réinitialisation de mot de passe
- ⬜ Configurer OAuth Google (optionnel Phase 1)
- ✅ Créer le middleware d'authentification Next.js
- ✅ Créer les pages auth (`/login`, `/register`, `/forgot-password`)

### 1.3 Gestion des profils

- ✅ Créer le flux de création de profil élève
- ✅ Implémenter le switch entre profils élèves
- ✅ Créer le système de code PIN parental
- ✅ Créer la page de gestion des profils

---

## Phase 2 — Structure pédagogique (Semaine 3-4)

### 2.1 Schéma contenu pédagogique

- ✅ Créer la table `subjects`
- ✅ Créer la table `domains`
- ✅ Créer la table `skills`
- ✅ Créer la table `exercises`
- ✅ Créer la table `exercise_translations`
- ✅ Configurer les politiques RLS
- ✅ Créer les index

### 2.2 Seed data — Mathématiques Primaire

- ✅ Définir la structure des domaines (Nombres, Calcul, Géométrie, Mesures, Problèmes)
- ✅ Créer les compétences pour chaque domaine (niveau CP)
- ✅ Créer les compétences pour chaque domaine (niveau CE1)
- ✅ Créer les compétences pour chaque domaine (niveau CE2)
- ✅ Créer les compétences pour chaque domaine (niveau CM1)
- ✅ Créer les compétences pour chaque domaine (niveau CM2)
- ⬜ Définir les prérequis entre compétences
- ✅ Créer le script de seed

### 2.3 API Contenu

- ✅ Configurer Server Actions (alternative à tRPC)
- ✅ Créer les actions `subjects`
- ✅ Créer les actions `skills`
- ✅ Créer les actions `exercises`
- ✅ Créer les actions `profiles`

---

## Phase 3 — Interface élève de base (Semaine 5-6)

### 3.1 Layout & Navigation

- ✅ Créer le layout principal élève
- ✅ Créer la navigation (header/sidebar)
- ✅ Créer le sélecteur de langue (FR/AR/EN)
- ✅ Implémenter le support RTL pour l'arabe
- ✅ Créer les fichiers de traduction de base

### 3.2 Dashboard élève

- ✅ Créer la page d'accueil élève
- ✅ Afficher la progression globale
- ✅ Afficher les domaines disponibles
- ✅ Créer le composant de carte domaine
- ✅ Créer le bouton "Continuer l'apprentissage"

### 3.3 Navigation pédagogique

- ✅ Créer la page de liste des compétences par domaine
- ✅ Créer le composant de carte compétence avec statut
- ⬜ Implémenter la visualisation des prérequis
- ✅ Créer l'indicateur de maîtrise (0-100%)

---

## Phase 4 — Exercices (Semaine 7-8)

### 4.1 Schéma progression

- ✅ Créer la table `student_skill_progress`
- ✅ Créer la table `exercise_attempts`
- ✅ Créer la table `learning_sessions`
- ✅ Configurer RLS
- ✅ Créer les index

### 4.2 Types d'exercices

- ✅ Créer le composant de base `Exercise`
- ✅ Implémenter le type QCM
- ✅ Implémenter le type texte à trous
- ⬜ Implémenter le type drag & drop
- ✅ Implémenter le type saisie libre
- ✅ Créer les animations de feedback (correct/incorrect)
- ⬜ Implémenter le système d'indices

### 4.3 Logique de progression

- ⬜ Implémenter l'algorithme de calcul de maîtrise
- ⬜ Créer le service de sélection du prochain exercice
- ⬜ Implémenter la répétition espacée
- ⬜ Créer le router tRPC `progress`
- ⬜ Créer le router tRPC `learning`

### 4.4 Interface d'apprentissage

- ✅ Créer la page d'exercice
- ✅ Implémenter le flux question → réponse → feedback
- ✅ Créer l'écran de fin de session
- ✅ Créer le résumé de session
- ✅ Implémenter la sauvegarde automatique de progression

---

## Phase 5 — Intelligence Artificielle (Semaine 9-10)

### 5.1 Infrastructure IA (Architecture hybride)

- ⬜ Créer les Supabase Edge Functions pour l'IA
- ⬜ Configurer Inngest pour les background jobs
- ⬜ Créer le service d'abstraction IA (multi-provider)
- ⬜ Implémenter le client OpenAI
- ⬜ Implémenter le client Anthropic
- ⬜ Créer le système de cache Redis pour les réponses IA
- ⬜ Implémenter le rate limiting
- ⬜ Créer le flux async avec Realtime pour les tâches longues

### 5.2 Clés API personnalisées (BYOK)

- ⬜ Créer le service de chiffrement des clés (AES-256-GCM)
- ⬜ Implémenter la validation des clés API
- ⬜ Créer la table `user_ai_settings` avec limites
- ⬜ Créer la table `ai_usage_logs`
- ⬜ Créer le router tRPC `aiSettings`
- ⬜ Créer l'interface de configuration dans les réglages parent
- ⬜ Implémenter le sélecteur de provider/modèle
- ⬜ Implémenter le fallback en cas d'erreur
- ⬜ Créer le disclaimer UX obligatoire
- ⬜ Implémenter les limites quotidiennes/mensuelles
- ⬜ Créer le tableau de bord usage BYOK
- ⬜ Implémenter la détection d'abus
- ⬜ Implémenter le kill switch

### 5.3 Génération d'exercices

- ⬜ Créer les prompts de génération par type d'exercice
- ⬜ Implémenter la génération d'exercices QCM
- ⬜ Implémenter la génération d'exercices texte à trous
- ⬜ Créer le système de validation des exercices générés
- ⬜ Implémenter le fallback vers exercices pré-validés

### 5.4 Adaptation pédagogique

- ⬜ Créer les prompts d'explication
- ⬜ Implémenter les explications adaptées à l'âge
- ⬜ Implémenter les indices progressifs
- ⬜ Adapter le ton selon la méthode pédagogique choisie

---

## Phase 6 — Dashboard parent (Semaine 11)

### 6.1 Interface parent

- ⬜ Créer le layout parent (distinct de l'élève)
- ⬜ Créer la page de sélection de l'enfant
- ⬜ Créer le dashboard de progression par enfant
- ⬜ Afficher les compétences maîtrisées
- ⬜ Afficher les difficultés identifiées
- ⬜ Afficher le temps passé

### 6.2 Réglages parent

- ⬜ Créer la page de réglages
- ⬜ Section : Gestion des profils enfants
- ⬜ Section : Préférences pédagogiques par enfant
- ⬜ Section : Configuration IA (BYOK)
- ⬜ Section : Gestion du compte
- ⬜ Section : Export/Suppression des données (RGPD)

### 6.3 Statistiques

- ⬜ Créer les graphiques de progression dans le temps
- ⬜ Créer la vue détaillée par compétence
- ⬜ Implémenter le rapport hebdomadaire (optionnel)

---

## Phase 7 — Gamification & Motivation (Semaine 11)

### 7.1 Schéma gamification avancé

- ⬜ Créer la table `achievement_rules` (versionnée)
- ⬜ Créer la table `student_achievements`
- ⬜ Créer la table `learning_milestones`
- ⬜ Créer la table `student_milestone_progress`
- ⬜ Créer la table `parent_notifications`
- ⬜ Créer la table `encouragement_messages`
- ⬜ Configurer RLS pour chaque table
- ⬜ Créer les index

### 7.2 Moteur de règles d'achievement

- ⬜ Créer le service d'évaluation des règles (trigger_conditions)
- ⬜ Implémenter les différents types de triggers (skill_mastery, streak, time_goal)
- ⬜ Créer le système de versioning des règles
- ⬜ Seed des achievements de base (par catégorie)
- ⬜ Créer le router tRPC `achievements`

### 7.3 Jalons pédagogiques (Milestones)

- ⬜ Créer le service de calcul de progression vers jalons
- ⬜ Implémenter les types de milestones (domain_complete, level_up, skill_chain)
- ⬜ Créer les composants de visualisation de progression
- ⬜ Implémenter les animations de célébration
- ⬜ Créer le router tRPC `milestones`

### 7.4 Notifications parent

- ⬜ Créer le service de génération de notifications
- ⬜ Implémenter les types de notifications (milestone, struggle, weekly_summary)
- ⬜ Créer l'interface de liste des notifications
- ⬜ Implémenter le marquage lu/non-lu
- ⬜ Créer le router tRPC `parentNotifications`

### 7.5 Messages d'encouragement

- ⬜ Seed des messages par contexte et tranche d'âge (FR/AR/EN)
- ⬜ Créer le service de sélection contextuelle
- ⬜ Créer les composants d'affichage (toast, modal, inline)
- ⬜ Implémenter les animations de feedback positif

---

## Phase 8 — Tests & Polish (Semaine 12)

### 8.1 Tests unitaires

- ⬜ Tests des utilitaires (calcul maîtrise, etc.)
- ⬜ Tests des services IA
- ⬜ Tests des hooks personnalisés
- ⬜ Couverture > 80%

### 8.2 Tests E2E

- ⬜ Test du parcours inscription → création profil
- ⬜ Test du parcours connexion → exercice → progression
- ⬜ Test du dashboard parent
- ⬜ Test des réglages IA (BYOK)
- ⬜ Test du changement de langue

### 8.3 Performance

- ⬜ Audit Lighthouse
- ⬜ Optimiser les Core Web Vitals
- ⬜ Vérifier le lazy loading
- ⬜ Optimiser les requêtes DB

### 8.4 Accessibilité

- ⬜ Audit accessibilité (axe-core)
- ⬜ Tester la navigation clavier
- ⬜ Tester avec screen reader
- ⬜ Vérifier les contrastes

### 8.5 Sécurité

- ⬜ Audit des politiques RLS
- ⬜ Vérifier le chiffrement des clés API
- ⬜ Tester les headers de sécurité
- ⬜ Vérifier la conformité RGPD

### 8.6 Polish UI

- ⬜ Revue design complète
- ⬜ Vérifier la cohérence visuelle
- ⬜ Optimiser les animations
- ⬜ Tester sur mobile

---

## Phase 9 — Déploiement Production

### 9.1 Préparation

- ⬜ Configurer le domaine
- ⬜ Configurer SSL
- ⬜ Configurer Sentry (monitoring erreurs)
- ⬜ Configurer les analytics

### 9.2 Migration

- ⬜ Migrer la base de données production
- ⬜ Vérifier les variables d'environnement production
- ⬜ Déployer sur Vercel
- ⬜ Tests smoke en production

### 9.3 Documentation

- ⬜ README.md à jour
- ⬜ Guide de contribution
- ⬜ Documentation API (si nécessaire)

---

## 🔧 Outils & MCP utilisés

| Outil | Usage |
|-------|-------|
| **MCP Supabase** | Création projet, tables, migrations, RLS |
| **MCP GitHub** | Gestion repo, issues, PRs |
| **MCP Filesystem** | Gestion fichiers projet |
| **MCP Git** | Commits, branches |
| **Docker** | Environnement de développement isolé |

---

## 📊 Métriques de suivi

| Métrique | Cible | Actuel |
|----------|-------|--------|
| Tâches complétées | 100% | 0% |
| Couverture tests | > 80% | - |
| Lighthouse Score | > 90 | - |
| Accessibilité | AA | - |

---

## 📝 Notes

_Espace pour les notes importantes durant le développement_

---

## 🚧 Blocages actuels

_Aucun blocage pour le moment_

---

## 📅 Historique des mises à jour

| Date | Changement |
|------|------------|
| 2024-12-12 | Création du plan initial |
