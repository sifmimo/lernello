-- Seed achievements de base

INSERT INTO achievement_rules (code, name_key, description_key, icon, category, trigger_type, trigger_conditions, xp_reward, version, is_active) VALUES
-- Catégorie: Premiers pas
('first_exercise', 'achievement.first_exercise.name', 'achievement.first_exercise.desc', 'star', 'getting_started', 'exercises_completed', '{"count": 1}', 10, 1, true),
('first_correct', 'achievement.first_correct.name', 'achievement.first_correct.desc', 'check-circle', 'getting_started', 'exercises_completed', '{"count": 1, "correct_only": true}', 15, 1, true),
('first_skill', 'achievement.first_skill.name', 'achievement.first_skill.desc', 'award', 'getting_started', 'skill_mastery', '{"mastery_threshold": 100, "skill_count": 1}', 50, 1, true),

-- Catégorie: Persévérance
('streak_3', 'achievement.streak_3.name', 'achievement.streak_3.desc', 'flame', 'persistence', 'streak', '{"days": 3}', 30, 1, true),
('streak_7', 'achievement.streak_7.name', 'achievement.streak_7.desc', 'flame', 'persistence', 'streak', '{"days": 7}', 75, 1, true),
('streak_14', 'achievement.streak_14.name', 'achievement.streak_14.desc', 'flame', 'persistence', 'streak', '{"days": 14}', 150, 1, true),
('streak_30', 'achievement.streak_30.name', 'achievement.streak_30.desc', 'zap', 'persistence', 'streak', '{"days": 30}', 300, 1, true),

-- Catégorie: Maîtrise
('skills_5', 'achievement.skills_5.name', 'achievement.skills_5.desc', 'target', 'mastery', 'skill_mastery', '{"mastery_threshold": 100, "skill_count": 5}', 100, 1, true),
('skills_10', 'achievement.skills_10.name', 'achievement.skills_10.desc', 'target', 'mastery', 'skill_mastery', '{"mastery_threshold": 100, "skill_count": 10}', 200, 1, true),
('skills_25', 'achievement.skills_25.name', 'achievement.skills_25.desc', 'trophy', 'mastery', 'skill_mastery', '{"mastery_threshold": 100, "skill_count": 25}', 500, 1, true),

-- Catégorie: Volume
('exercises_10', 'achievement.exercises_10.name', 'achievement.exercises_10.desc', 'book-open', 'volume', 'exercises_completed', '{"count": 10}', 20, 1, true),
('exercises_50', 'achievement.exercises_50.name', 'achievement.exercises_50.desc', 'book-open', 'volume', 'exercises_completed', '{"count": 50}', 75, 1, true),
('exercises_100', 'achievement.exercises_100.name', 'achievement.exercises_100.desc', 'books', 'volume', 'exercises_completed', '{"count": 100}', 150, 1, true),
('exercises_500', 'achievement.exercises_500.name', 'achievement.exercises_500.desc', 'library', 'volume', 'exercises_completed', '{"count": 500}', 400, 1, true),

-- Catégorie: Précision
('perfect_10', 'achievement.perfect_10.name', 'achievement.perfect_10.desc', 'check-circle', 'accuracy', 'exercises_completed', '{"count": 10, "correct_only": true}', 50, 1, true),
('perfect_50', 'achievement.perfect_50.name', 'achievement.perfect_50.desc', 'check-circle', 'accuracy', 'exercises_completed', '{"count": 50, "correct_only": true}', 150, 1, true),
('perfect_100', 'achievement.perfect_100.name', 'achievement.perfect_100.desc', 'medal', 'accuracy', 'exercises_completed', '{"count": 100, "correct_only": true}', 300, 1, true),

-- Catégorie: Temps
('time_30', 'achievement.time_30.name', 'achievement.time_30.desc', 'clock', 'time', 'time_goal', '{"minutes": 30, "period": "day"}', 25, 1, true),
('time_60', 'achievement.time_60.name', 'achievement.time_60.desc', 'clock', 'time', 'time_goal', '{"minutes": 60, "period": "day"}', 50, 1, true),
('time_weekly_120', 'achievement.time_weekly_120.name', 'achievement.time_weekly_120.desc', 'calendar', 'time', 'time_goal', '{"minutes": 120, "period": "week"}', 100, 1, true),

-- Catégorie: Domaines
('domain_complete', 'achievement.domain_complete.name', 'achievement.domain_complete.desc', 'folder-check', 'domains', 'domain_complete', '{"mastery_threshold": 80}', 250, 1, true),

-- Catégorie: Niveaux
('level_5', 'achievement.level_5.name', 'achievement.level_5.desc', 'trending-up', 'levels', 'level_up', '{"level": 5}', 100, 1, true),
('level_10', 'achievement.level_10.name', 'achievement.level_10.desc', 'trending-up', 'levels', 'level_up', '{"level": 10}', 250, 1, true),
('level_25', 'achievement.level_25.name', 'achievement.level_25.desc', 'crown', 'levels', 'level_up', '{"level": 25}', 500, 1, true)

ON CONFLICT (code) DO NOTHING;

-- Traductions FR
INSERT INTO translations (key, language, value) VALUES
('achievement.first_exercise.name', 'fr', 'Premier pas'),
('achievement.first_exercise.desc', 'fr', 'Complète ton premier exercice'),
('achievement.first_correct.name', 'fr', 'Bonne réponse !'),
('achievement.first_correct.desc', 'fr', 'Réponds correctement à ton premier exercice'),
('achievement.first_skill.name', 'fr', 'Compétence acquise'),
('achievement.first_skill.desc', 'fr', 'Maîtrise ta première compétence à 100%'),
('achievement.streak_3.name', 'fr', 'Régulier'),
('achievement.streak_3.desc', 'fr', 'Apprends 3 jours de suite'),
('achievement.streak_7.name', 'fr', 'Assidu'),
('achievement.streak_7.desc', 'fr', 'Apprends 7 jours de suite'),
('achievement.streak_14.name', 'fr', 'Déterminé'),
('achievement.streak_14.desc', 'fr', 'Apprends 14 jours de suite'),
('achievement.streak_30.name', 'fr', 'Inarrêtable'),
('achievement.streak_30.desc', 'fr', 'Apprends 30 jours de suite'),
('achievement.skills_5.name', 'fr', 'Apprenti'),
('achievement.skills_5.desc', 'fr', 'Maîtrise 5 compétences'),
('achievement.skills_10.name', 'fr', 'Compétent'),
('achievement.skills_10.desc', 'fr', 'Maîtrise 10 compétences'),
('achievement.skills_25.name', 'fr', 'Expert'),
('achievement.skills_25.desc', 'fr', 'Maîtrise 25 compétences'),
('achievement.exercises_10.name', 'fr', 'Curieux'),
('achievement.exercises_10.desc', 'fr', 'Complète 10 exercices'),
('achievement.exercises_50.name', 'fr', 'Travailleur'),
('achievement.exercises_50.desc', 'fr', 'Complète 50 exercices'),
('achievement.exercises_100.name', 'fr', 'Studieux'),
('achievement.exercises_100.desc', 'fr', 'Complète 100 exercices'),
('achievement.exercises_500.name', 'fr', 'Érudit'),
('achievement.exercises_500.desc', 'fr', 'Complète 500 exercices'),
('achievement.perfect_10.name', 'fr', 'Précis'),
('achievement.perfect_10.desc', 'fr', '10 bonnes réponses'),
('achievement.perfect_50.name', 'fr', 'Méticuleux'),
('achievement.perfect_50.desc', 'fr', '50 bonnes réponses'),
('achievement.perfect_100.name', 'fr', 'Perfectionniste'),
('achievement.perfect_100.desc', 'fr', '100 bonnes réponses'),
('achievement.time_30.name', 'fr', 'Concentré'),
('achievement.time_30.desc', 'fr', '30 minutes d''apprentissage en une journée'),
('achievement.time_60.name', 'fr', 'Passionné'),
('achievement.time_60.desc', 'fr', '1 heure d''apprentissage en une journée'),
('achievement.time_weekly_120.name', 'fr', 'Dévoué'),
('achievement.time_weekly_120.desc', 'fr', '2 heures d''apprentissage en une semaine'),
('achievement.domain_complete.name', 'fr', 'Maître du domaine'),
('achievement.domain_complete.desc', 'fr', 'Maîtrise toutes les compétences d''un domaine'),
('achievement.level_5.name', 'fr', 'Niveau 5'),
('achievement.level_5.desc', 'fr', 'Atteins le niveau 5'),
('achievement.level_10.name', 'fr', 'Niveau 10'),
('achievement.level_10.desc', 'fr', 'Atteins le niveau 10'),
('achievement.level_25.name', 'fr', 'Niveau 25'),
('achievement.level_25.desc', 'fr', 'Atteins le niveau 25')
ON CONFLICT (key, language) DO NOTHING;

-- Traductions AR
INSERT INTO translations (key, language, value) VALUES
('achievement.first_exercise.name', 'ar', 'الخطوة الأولى'),
('achievement.first_exercise.desc', 'ar', 'أكمل تمرينك الأول'),
('achievement.first_correct.name', 'ar', 'إجابة صحيحة!'),
('achievement.first_correct.desc', 'ar', 'أجب بشكل صحيح على تمرينك الأول'),
('achievement.first_skill.name', 'ar', 'مهارة مكتسبة'),
('achievement.first_skill.desc', 'ar', 'أتقن مهارتك الأولى بنسبة 100%'),
('achievement.streak_3.name', 'ar', 'منتظم'),
('achievement.streak_3.desc', 'ar', 'تعلم 3 أيام متتالية'),
('achievement.streak_7.name', 'ar', 'مجتهد'),
('achievement.streak_7.desc', 'ar', 'تعلم 7 أيام متتالية'),
('achievement.streak_14.name', 'ar', 'مصمم'),
('achievement.streak_14.desc', 'ar', 'تعلم 14 يومًا متتاليًا'),
('achievement.streak_30.name', 'ar', 'لا يمكن إيقافه'),
('achievement.streak_30.desc', 'ar', 'تعلم 30 يومًا متتاليًا'),
('achievement.skills_5.name', 'ar', 'متدرب'),
('achievement.skills_5.desc', 'ar', 'أتقن 5 مهارات'),
('achievement.skills_10.name', 'ar', 'ماهر'),
('achievement.skills_10.desc', 'ar', 'أتقن 10 مهارات'),
('achievement.skills_25.name', 'ar', 'خبير'),
('achievement.skills_25.desc', 'ar', 'أتقن 25 مهارة'),
('achievement.exercises_10.name', 'ar', 'فضولي'),
('achievement.exercises_10.desc', 'ar', 'أكمل 10 تمارين'),
('achievement.exercises_50.name', 'ar', 'مجتهد'),
('achievement.exercises_50.desc', 'ar', 'أكمل 50 تمرينًا'),
('achievement.exercises_100.name', 'ar', 'دؤوب'),
('achievement.exercises_100.desc', 'ar', 'أكمل 100 تمرين'),
('achievement.exercises_500.name', 'ar', 'عالم'),
('achievement.exercises_500.desc', 'ar', 'أكمل 500 تمرين')
ON CONFLICT (key, language) DO NOTHING;

-- Traductions EN
INSERT INTO translations (key, language, value) VALUES
('achievement.first_exercise.name', 'en', 'First Step'),
('achievement.first_exercise.desc', 'en', 'Complete your first exercise'),
('achievement.first_correct.name', 'en', 'Correct Answer!'),
('achievement.first_correct.desc', 'en', 'Answer your first exercise correctly'),
('achievement.first_skill.name', 'en', 'Skill Acquired'),
('achievement.first_skill.desc', 'en', 'Master your first skill at 100%'),
('achievement.streak_3.name', 'en', 'Regular'),
('achievement.streak_3.desc', 'en', 'Learn 3 days in a row'),
('achievement.streak_7.name', 'en', 'Dedicated'),
('achievement.streak_7.desc', 'en', 'Learn 7 days in a row'),
('achievement.streak_14.name', 'en', 'Determined'),
('achievement.streak_14.desc', 'en', 'Learn 14 days in a row'),
('achievement.streak_30.name', 'en', 'Unstoppable'),
('achievement.streak_30.desc', 'en', 'Learn 30 days in a row'),
('achievement.skills_5.name', 'en', 'Apprentice'),
('achievement.skills_5.desc', 'en', 'Master 5 skills'),
('achievement.skills_10.name', 'en', 'Skilled'),
('achievement.skills_10.desc', 'en', 'Master 10 skills'),
('achievement.skills_25.name', 'en', 'Expert'),
('achievement.skills_25.desc', 'en', 'Master 25 skills'),
('achievement.exercises_10.name', 'en', 'Curious'),
('achievement.exercises_10.desc', 'en', 'Complete 10 exercises'),
('achievement.exercises_50.name', 'en', 'Hard Worker'),
('achievement.exercises_50.desc', 'en', 'Complete 50 exercises'),
('achievement.exercises_100.name', 'en', 'Studious'),
('achievement.exercises_100.desc', 'en', 'Complete 100 exercises'),
('achievement.exercises_500.name', 'en', 'Scholar'),
('achievement.exercises_500.desc', 'en', 'Complete 500 exercises'),
('achievement.perfect_10.name', 'en', 'Precise'),
('achievement.perfect_10.desc', 'en', '10 correct answers'),
('achievement.perfect_50.name', 'en', 'Meticulous'),
('achievement.perfect_50.desc', 'en', '50 correct answers'),
('achievement.perfect_100.name', 'en', 'Perfectionist'),
('achievement.perfect_100.desc', 'en', '100 correct answers'),
('achievement.time_30.name', 'en', 'Focused'),
('achievement.time_30.desc', 'en', '30 minutes of learning in one day'),
('achievement.time_60.name', 'en', 'Passionate'),
('achievement.time_60.desc', 'en', '1 hour of learning in one day'),
('achievement.time_weekly_120.name', 'en', 'Devoted'),
('achievement.time_weekly_120.desc', 'en', '2 hours of learning in one week'),
('achievement.domain_complete.name', 'en', 'Domain Master'),
('achievement.domain_complete.desc', 'en', 'Master all skills in a domain'),
('achievement.level_5.name', 'en', 'Level 5'),
('achievement.level_5.desc', 'en', 'Reach level 5'),
('achievement.level_10.name', 'en', 'Level 10'),
('achievement.level_10.desc', 'en', 'Reach level 10'),
('achievement.level_25.name', 'en', 'Level 25'),
('achievement.level_25.desc', 'en', 'Reach level 25')
ON CONFLICT (key, language) DO NOTHING;
