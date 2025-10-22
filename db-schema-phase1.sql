-- ============================================
-- PHASE 1: AI Prompt Templates, Task Collections, Content Variants
-- MVP Schema - Simple & Practical
-- ============================================

-- ============================================
-- 1. AI PROMPT TEMPLATES (Reduce Duplication)
-- ============================================
CREATE TABLE ai_prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- 'base', 'task_intro', 'closing'

    -- Simple template with {{variable}} placeholders
    template_content TEXT NOT NULL,

    -- Example variables this template uses
    variables JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed base templates
INSERT INTO ai_prompt_templates (name, template_type, template_content, variables) VALUES
('zippy_base', 'base',
'You are **Zippy**, a curious and humble AI learner. Students teach you to solve problems.

RESPONSE LENGTH: Keep it SHORT and PUNCHY - 2-3 sentences max per response.

VISUAL COMMUNICATION: Use emojis (😊 🤔 🎉) and simple text visuals.',
'[]'),

('task_intro_pattern', 'task_intro',
'Hi! I''m Zippy! 🎉

I see {{data_point_1}} and {{data_point_2}}.

If {{incorrect_reasoning}}, but that doesn''t match! 🤔

Can you help me figure out what''s happening?',
'["data_point_1", "data_point_2", "incorrect_reasoning"]'),

('proficient_closing', 'closing',
'Thanks so much for teaching me! You explained all the key concepts clearly and helped me understand the whole pattern. I really learned a lot from you today!

🎯 Next Step: Share your teaching method with your classmates!',
'[]');

CREATE INDEX idx_prompt_templates_type ON ai_prompt_templates(template_type);

-- ============================================
-- 2. MODIFY TASK AI CONFIGS (Use Templates)
-- ============================================
-- For MVP: Add template references alongside existing system_prompt
-- Later: Remove system_prompt column after migration

CREATE TABLE task_ai_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL, -- Will add FK when tasks table exists
    personality_name VARCHAR(100) NOT NULL, -- 'Zippy', 'Skeptic Sam', etc.

    -- Template-based approach
    base_template_id UUID REFERENCES ai_prompt_templates(id),
    intro_template_id UUID REFERENCES ai_prompt_templates(id),
    closing_template_id UUID REFERENCES ai_prompt_templates(id),

    -- Task-specific values to inject into templates
    template_variables JSONB,
    /*
    Example for Stack of Cups:
    {
        "data_point_1": "2 cups = 16cm",
        "data_point_2": "4 cups = 20cm",
        "incorrect_reasoning": "1 cup = 8cm, so 8 cups = 64cm",
        "key_concept": "cups nest inside each other",
        "pattern_increment": "2cm per cup (the rim)"
    }
    */

    -- Initial misconception (simple version)
    initial_misconception TEXT NOT NULL,
    correction_triggers TEXT[], -- Array of simple strings

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(task_id, personality_name)
);

CREATE INDEX idx_task_ai_task ON task_ai_configs(task_id);

-- ============================================
-- 3. TASK COLLECTIONS (Organize Tasks)
-- ============================================
CREATE TABLE task_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,

    collection_type VARCHAR(50) NOT NULL
        CHECK (collection_type IN ('unit', 'pathway', 'grade_level', 'custom')),

    -- Simple hierarchy (one level only for MVP)
    parent_collection_id UUID REFERENCES task_collections(id),

    -- Display order
    sort_order INT DEFAULT 0,

    -- Visibility
    published BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_collections_type ON task_collections(collection_type, published);
CREATE INDEX idx_collections_parent ON task_collections(parent_collection_id);

-- ============================================
-- 4. COLLECTION TASKS (Link Tasks to Collections)
-- ============================================
CREATE TABLE collection_tasks (
    collection_id UUID NOT NULL REFERENCES task_collections(id) ON DELETE CASCADE,
    task_id UUID NOT NULL, -- Will add FK when tasks table exists

    order_in_collection INT NOT NULL,
    is_required BOOLEAN DEFAULT true,

    PRIMARY KEY (collection_id, task_id)
);

CREATE INDEX idx_collection_tasks_order ON collection_tasks(collection_id, order_in_collection);

-- ============================================
-- 5. TASK CONTENT VARIANTS (A/B Testing & Updates)
-- ============================================
CREATE TABLE task_content_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL, -- Will add FK when tasks table exists

    variant_name VARCHAR(100) NOT NULL, -- 'original', 'v2', 'simplified'
    is_default BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,

    -- Content (same structure as original task_content)
    problem_context TEXT NOT NULL,
    visual_assets JSONB,
    questions JSONB NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(task_id, variant_name)
);

CREATE INDEX idx_task_variants_active ON task_content_variants(task_id, active, is_default);

-- ============================================
-- SEED DATA: Grade 8 Math Collections
-- ============================================
INSERT INTO task_collections (title, slug, description, collection_type, sort_order) VALUES
('Grade 8 - Statistics & Probability', 'grade-8-stats', 'Data analysis, scatter plots, and linear models', 'unit', 1),
('Grade 8 - Algebra', 'grade-8-algebra', 'Linear equations, functions, and systems', 'unit', 2),
('Grade 6 - Ratios & Proportions', 'grade-6-ratios', 'Ratio reasoning and proportional relationships', 'unit', 3);

-- Get IDs for sub-collections
DO $$
DECLARE
    stats_id UUID;
BEGIN
    SELECT id INTO stats_id FROM task_collections WHERE slug = 'grade-8-stats';

    INSERT INTO task_collections (title, slug, description, collection_type, parent_collection_id, sort_order) VALUES
    ('Linear Models', 'linear-models', 'Finding patterns in data and creating equations', 'pathway', stats_id, 1),
    ('Data Displays', 'data-displays', 'Box plots, histograms, and scatter plots', 'pathway', stats_id, 2);
END $$;

-- ============================================
-- HELPER VIEW: Full Task Bundle (for frontend)
-- ============================================
CREATE OR REPLACE VIEW task_bundles AS
SELECT
    t.id,
    t.title,
    t.slug,
    t.description,
    t.grade_level,
    t.domain,

    -- Default content variant
    jsonb_build_object(
        'problem_context', tcv.problem_context,
        'visual_assets', tcv.visual_assets,
        'questions', tcv.questions
    ) as content,

    -- AI configurations
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'personality', tac.personality_name,
                'template_variables', tac.template_variables,
                'initial_misconception', tac.initial_misconception
            )
        )
        FROM task_ai_configs tac
        WHERE tac.task_id = t.id
    ) as ai_configs,

    -- Collections this task belongs to
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', tc.id,
                'title', tc.title,
                'type', tc.collection_type
            )
        )
        FROM collection_tasks ct
        JOIN task_collections tc ON ct.collection_id = tc.id
        WHERE ct.task_id = t.id
    ) as collections

FROM tasks t
LEFT JOIN task_content_variants tcv ON t.id = tcv.task_id AND tcv.is_default = true;

-- ============================================
-- NOTES FOR FRONTEND INTEGRATION
-- ============================================
/*
LocalStorage Schema for Session Persistence:

sessionStorage.setItem('iteachu_session', JSON.stringify({
    sessionId: 'uuid',
    taskId: 'uuid',
    personality: 'Zippy',
    messages: [
        {role: 'assistant', content: '...', timestamp: '...'},
        {role: 'user', content: '...', timestamp: '...'}
    ],
    progress: {
        turnCount: 5,
        checkpointsReached: ['understands_nesting'],
        deltaLearning: 40
    },
    startedAt: '2025-01-15T10:30:00Z'
}));

On page load: Check sessionStorage, show "Resume session?" prompt if exists
On session end: Clear sessionStorage, save to backend
*/
