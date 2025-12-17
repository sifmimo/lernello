-- V5: Détection Émotionnelle
-- Adaptation selon l'état émotionnel détecté par les patterns d'interaction

CREATE TABLE IF NOT EXISTS emotion_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
    detected_emotion TEXT NOT NULL, -- 'engaged', 'frustrated', 'bored', 'tired', 'confident', 'struggling'
    confidence_score FLOAT DEFAULT 0.5,
    signals JSONB NOT NULL, -- {"response_time_avg": 5.2, "error_rate": 0.4, "click_patterns": "erratic"}
    action_taken TEXT, -- 'easier_exercise', 'encouragement', 'break_suggestion', 'difficulty_increase'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuration des règles de détection
CREATE TABLE IF NOT EXISTS emotion_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emotion TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    conditions JSONB NOT NULL, -- {"response_time_ratio": ">2", "consecutive_errors": ">=3"}
    priority INTEGER DEFAULT 1,
    suggested_action TEXT NOT NULL,
    message_template TEXT, -- Message de Lumi associé
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed des règles de détection
INSERT INTO emotion_rules (emotion, rule_name, conditions, priority, suggested_action, message_template) VALUES
    ('frustrated', 'consecutive_errors', '{"consecutive_errors": ">=3", "response_time_ratio": ">1.5"}', 1, 'easier_exercise', 'Je vois que c''est un peu difficile. On essaie quelque chose de plus simple ?'),
    ('frustrated', 'erratic_clicks', '{"click_variance": ">high", "abandon_attempts": ">=2"}', 2, 'encouragement', 'Pas de panique ! Prends ton temps, tu vas y arriver.'),
    ('bored', 'too_fast', '{"response_time_ratio": "<0.5", "success_rate": ">0.9"}', 1, 'difficulty_increase', 'Tu es trop fort ! On passe à quelque chose de plus challengeant ?'),
    ('tired', 'slow_responses', '{"response_time_ratio": ">2.5", "session_duration": ">20"}', 1, 'break_suggestion', 'Tu travailles depuis un moment. Une petite pause ?'),
    ('struggling', 'help_requests', '{"hint_requests": ">=3", "success_rate": "<0.3"}', 1, 'guided_help', 'Je vais t''aider pas à pas. Regarde bien...'),
    ('confident', 'streak_success', '{"consecutive_correct": ">=5", "response_time_ratio": "<1"}', 1, 'celebration', 'Waouh ! Tu es en feu ! 🔥')
ON CONFLICT DO NOTHING;

-- Index
CREATE INDEX IF NOT EXISTS idx_emotion_signals_profile ON emotion_signals(profile_id);
CREATE INDEX IF NOT EXISTS idx_emotion_signals_session ON emotion_signals(session_id);
CREATE INDEX IF NOT EXISTS idx_emotion_signals_emotion ON emotion_signals(detected_emotion);
