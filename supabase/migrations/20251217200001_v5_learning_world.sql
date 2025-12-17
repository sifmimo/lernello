-- V5: Mon Univers d'Apprentissage
-- Monde virtuel qui se construit avec la progression

CREATE TABLE IF NOT EXISTS learning_worlds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE UNIQUE,
    world_name TEXT DEFAULT 'Mon Île',
    theme TEXT DEFAULT 'island', -- 'island', 'forest', 'space', 'underwater'
    level INTEGER DEFAULT 1,
    total_buildings INTEGER DEFAULT 0,
    total_decorations INTEGER DEFAULT 0,
    total_inhabitants INTEGER DEFAULT 0,
    last_visited_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bâtiments débloqués dans le monde
CREATE TABLE IF NOT EXISTS world_buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID REFERENCES learning_worlds(id) ON DELETE CASCADE,
    building_type TEXT NOT NULL, -- 'library', 'lab', 'castle', 'school', 'workshop', 'garden'
    name TEXT NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 1,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    unlocked_by_module_id UUID,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Décorations gagnées
CREATE TABLE IF NOT EXISTS world_decorations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID REFERENCES learning_worlds(id) ON DELETE CASCADE,
    decoration_type TEXT NOT NULL, -- 'tree', 'flower', 'statue', 'fountain', 'flag', 'lamp'
    name TEXT NOT NULL,
    rarity TEXT DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    unlocked_by TEXT, -- 'streak_7', 'badge_xxx', 'achievement_xxx'
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habitants du monde (personnages)
CREATE TABLE IF NOT EXISTS world_inhabitants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID REFERENCES learning_worlds(id) ON DELETE CASCADE,
    character_type TEXT NOT NULL, -- 'scholar', 'wizard', 'explorer', 'artist', 'scientist'
    name TEXT NOT NULL,
    personality TEXT,
    dialogue_lines JSONB DEFAULT '[]',
    unlocked_by TEXT,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catalogue des éléments débloquables
CREATE TABLE IF NOT EXISTS world_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type TEXT NOT NULL, -- 'building', 'decoration', 'inhabitant'
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    rarity TEXT DEFAULT 'common',
    unlock_condition JSONB NOT NULL, -- {"type": "module_complete", "module_id": "xxx"} ou {"type": "streak", "days": 7}
    visual_asset TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed du catalogue
INSERT INTO world_catalog (item_type, code, name, description, rarity, unlock_condition) VALUES
    ('building', 'library', 'Bibliothèque', 'Un lieu de savoir et de découverte', 'common', '{"type": "skills_mastered", "count": 5}'),
    ('building', 'lab', 'Laboratoire', 'Pour les expériences scientifiques', 'rare', '{"type": "module_complete", "subject": "sciences"}'),
    ('building', 'castle', 'Château du Savoir', 'Le cœur de ton univers', 'epic', '{"type": "skills_mastered", "count": 20}'),
    ('building', 'workshop', 'Atelier', 'Où la créativité prend vie', 'common', '{"type": "skills_mastered", "count": 10}'),
    ('decoration', 'tree_knowledge', 'Arbre de la Connaissance', 'Grandit avec ton savoir', 'common', '{"type": "streak", "days": 3}'),
    ('decoration', 'fountain_wisdom', 'Fontaine de Sagesse', 'Source d''inspiration', 'rare', '{"type": "streak", "days": 7}'),
    ('decoration', 'statue_champion', 'Statue du Champion', 'En l''honneur de tes exploits', 'epic', '{"type": "streak", "days": 30}'),
    ('decoration', 'golden_flag', 'Drapeau Doré', 'Symbole de persévérance', 'legendary', '{"type": "streak", "days": 100}'),
    ('inhabitant', 'scholar', 'Le Savant', 'Expert en mathématiques', 'common', '{"type": "badge", "badge_code": "math_master"}'),
    ('inhabitant', 'explorer', 'L''Explorateur', 'Toujours en quête de découvertes', 'rare', '{"type": "modules_explored", "count": 5}'),
    ('inhabitant', 'wizard', 'Le Magicien des Mots', 'Maître du langage', 'rare', '{"type": "badge", "badge_code": "word_wizard"}')
ON CONFLICT (code) DO NOTHING;

-- Index
CREATE INDEX IF NOT EXISTS idx_learning_worlds_profile ON learning_worlds(profile_id);
CREATE INDEX IF NOT EXISTS idx_world_buildings_world ON world_buildings(world_id);
CREATE INDEX IF NOT EXISTS idx_world_decorations_world ON world_decorations(world_id);
