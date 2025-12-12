-- Migration: seed_math_primary_content
-- Version: 20251212172633

-- Seed Mathematics subject
INSERT INTO public.subjects (code, name_key, icon, sort_order) VALUES
('math', 'subjects.math', 'calculator', 1);

-- Get math subject id and seed domains
WITH math_subject AS (SELECT id FROM public.subjects WHERE code = 'math')
INSERT INTO public.domains (subject_id, code, name_key, description_key, icon, sort_order)
SELECT 
    math_subject.id,
    domain.code,
    domain.name_key,
    domain.description_key,
    domain.icon,
    domain.sort_order
FROM math_subject, (VALUES
    ('numbers', 'domains.numbers', 'domains.numbers_desc', 'hash', 1),
    ('calculation', 'domains.calculation', 'domains.calculation_desc', 'plus', 2),
    ('geometry', 'domains.geometry', 'domains.geometry_desc', 'triangle', 3),
    ('measures', 'domains.measures', 'domains.measures_desc', 'ruler', 4),
    ('problems', 'domains.problems', 'domains.problems_desc', 'lightbulb', 5)
) AS domain(code, name_key, description_key, icon, sort_order);

-- Seed skills for Numbers domain (CP level)
WITH numbers_domain AS (SELECT id FROM public.domains WHERE code = 'numbers')
INSERT INTO public.skills (domain_id, code, name_key, description_key, difficulty_level, sort_order)
SELECT 
    numbers_domain.id,
    skill.code,
    skill.name_key,
    skill.description_key,
    skill.difficulty,
    skill.sort_order
FROM numbers_domain, (VALUES
    ('count_to_10', 'skills.count_to_10', 'skills.count_to_10_desc', 1, 1),
    ('count_to_20', 'skills.count_to_20', 'skills.count_to_20_desc', 1, 2),
    ('count_to_100', 'skills.count_to_100', 'skills.count_to_100_desc', 2, 3),
    ('compare_numbers', 'skills.compare_numbers', 'skills.compare_numbers_desc', 2, 4),
    ('order_numbers', 'skills.order_numbers', 'skills.order_numbers_desc', 2, 5),
    ('tens_units', 'skills.tens_units', 'skills.tens_units_desc', 3, 6)
) AS skill(code, name_key, description_key, difficulty, sort_order);

-- Seed skills for Calculation domain
WITH calc_domain AS (SELECT id FROM public.domains WHERE code = 'calculation')
INSERT INTO public.skills (domain_id, code, name_key, description_key, difficulty_level, sort_order)
SELECT 
    calc_domain.id,
    skill.code,
    skill.name_key,
    skill.description_key,
    skill.difficulty,
    skill.sort_order
FROM calc_domain, (VALUES
    ('add_to_5', 'skills.add_to_5', 'skills.add_to_5_desc', 1, 1),
    ('add_to_10', 'skills.add_to_10', 'skills.add_to_10_desc', 1, 2),
    ('subtract_to_5', 'skills.subtract_to_5', 'skills.subtract_to_5_desc', 1, 3),
    ('subtract_to_10', 'skills.subtract_to_10', 'skills.subtract_to_10_desc', 2, 4),
    ('add_to_20', 'skills.add_to_20', 'skills.add_to_20_desc', 2, 5),
    ('doubles', 'skills.doubles', 'skills.doubles_desc', 2, 6)
) AS skill(code, name_key, description_key, difficulty, sort_order);

-- Seed sample exercises for count_to_10
WITH skill AS (SELECT id FROM public.skills WHERE code = 'count_to_10')
INSERT INTO public.exercises (skill_id, type, difficulty, content, is_ai_generated)
SELECT 
    skill.id,
    'qcm',
    1,
    jsonb_build_object(
        'question', 'Combien y a-t-il de pommes ?',
        'image', '🍎🍎🍎',
        'options', jsonb_build_array('2', '3', '4', '5'),
        'correct_answer', '3',
        'explanation', 'Il y a 3 pommes. On compte : 1, 2, 3 !',
        'hint', 'Compte chaque pomme une par une.'
    ),
    false
FROM skill;

-- Seed achievement rules
INSERT INTO public.achievement_rules (code, version, name_key, description_key, icon, category, trigger_conditions) VALUES
('first_exercise', 1, 'achievements.first_exercise', 'achievements.first_exercise_desc', 'star', 'milestone', '{"type": "exercise_count", "count": 1}'::jsonb),
('five_correct', 1, 'achievements.five_correct', 'achievements.five_correct_desc', 'trophy', 'skill', '{"type": "correct_streak", "count": 5}'::jsonb),
('first_skill', 1, 'achievements.first_skill', 'achievements.first_skill_desc', 'award', 'skill', '{"type": "skill_mastery", "count": 1, "level": 0.8}'::jsonb),
('week_streak', 1, 'achievements.week_streak', 'achievements.week_streak_desc', 'flame', 'streak', '{"type": "daily_streak", "days": 7}'::jsonb);

-- Seed learning milestones
INSERT INTO public.learning_milestones (code, name_key, description_key, milestone_type, criteria, reward_type) VALUES
('numbers_master', 'milestones.numbers_master', 'milestones.numbers_master_desc', 'domain_complete', '{"domain_code": "numbers", "mastery_threshold": 0.8}'::jsonb, 'badge'),
('first_domain', 'milestones.first_domain', 'milestones.first_domain_desc', 'domain_complete', '{"any_domain": true, "mastery_threshold": 0.8}'::jsonb, 'celebration');
