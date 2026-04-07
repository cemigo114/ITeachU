-- ITeachU Task Bank schema (SQLite)
-- Idempotent: uses CREATE TABLE IF NOT EXISTS throughout.

-- Standards (Learning Commons Knowledge Graph entities)
CREATE TABLE IF NOT EXISTS standards_framework (
  case_identifier_uuid TEXT PRIMARY KEY,
  name TEXT,
  academic_subject TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  in_language TEXT,
  adoption_status TEXT,
  date_modified TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS standards_framework_item (
  case_identifier_uuid TEXT PRIMARY KEY,
  identifier TEXT,
  statement_code TEXT,
  description TEXT,
  statement_type TEXT,
  normalized_statement_type TEXT,
  jurisdiction TEXT NOT NULL,
  academic_subject TEXT NOT NULL,
  grade_level TEXT,
  in_language TEXT,
  date_modified TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Tasks (parsed from .docx; all 6 sections stored)
CREATE TABLE IF NOT EXISTS task (
  id                       TEXT PRIMARY KEY,
  slug                     TEXT NOT NULL UNIQUE,
  title                    TEXT NOT NULL,
  description              TEXT,

  -- Section 1: Student Prompt (Low Entry Point)
  problem_statement        TEXT,

  -- Section 2: Possible Misconceptions (JSON array of strings)
  misconceptions           TEXT,

  -- Section 3: Pattern Recognition Prompt
  pattern_recognition      TEXT,

  -- Section 4: Generalization Question (Always/Sometimes/Never)
  generalization           TEXT,

  -- Section 5: Inference and Prediction
  inference_prediction     TEXT,

  -- Section 6: Mapping and Process Data (JSON object)
  mapping_data             TEXT,

  -- AI teaching metadata
  teaching_prompt          TEXT,
  target_concepts          TEXT,
  correct_solution_pathway TEXT,
  ai_intro                 TEXT,
  ai_intro_es              TEXT,

  -- Standard alignment
  standard_statement_code  TEXT NOT NULL,
  standard_case_uuid       TEXT,
  grade                    TEXT NOT NULL,

  -- Source tracking
  domain                   TEXT,
  docx_path                TEXT,
  image_url                TEXT,

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (standard_case_uuid) REFERENCES standards_framework_item(case_identifier_uuid)
);

CREATE INDEX IF NOT EXISTS idx_task_slug     ON task(slug);
CREATE INDEX IF NOT EXISTS idx_task_grade    ON task(grade);
CREATE INDEX IF NOT EXISTS idx_task_standard ON task(standard_case_uuid);
CREATE INDEX IF NOT EXISTS idx_task_domain   ON task(domain);

CREATE INDEX IF NOT EXISTS idx_sfi_statement_code       ON standards_framework_item(statement_code);
CREATE INDEX IF NOT EXISTS idx_sfi_jurisdiction_subject  ON standards_framework_item(jurisdiction, academic_subject);
CREATE INDEX IF NOT EXISTS idx_sfi_grade_level           ON standards_framework_item(grade_level);

-- Collections (derived from ingestion or hand-curated)
CREATE TABLE IF NOT EXISTS collection (
  id                   TEXT PRIMARY KEY,
  slug                 TEXT NOT NULL UNIQUE,
  title                TEXT NOT NULL,
  description          TEXT,
  type                 TEXT NOT NULL,          -- 'unit' | 'pathway' | 'grade'
  grade                INTEGER,
  parent_collection_id TEXT,
  published            INTEGER NOT NULL DEFAULT 1,
  source               TEXT NOT NULL DEFAULT 'derived',  -- 'derived' | 'curated'
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (parent_collection_id) REFERENCES collection(id)
);

CREATE INDEX IF NOT EXISTS idx_collection_grade  ON collection(grade);
CREATE INDEX IF NOT EXISTS idx_collection_source ON collection(source);

-- Join table: which tasks belong to which collection
CREATE TABLE IF NOT EXISTS collection_tasks (
  collection_id TEXT NOT NULL,
  task_id       TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  required      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, task_id),
  FOREIGN KEY (collection_id) REFERENCES collection(id),
  FOREIGN KEY (task_id)       REFERENCES task(id)
);

CREATE INDEX IF NOT EXISTS idx_ct_collection ON collection_tasks(collection_id);
CREATE INDEX IF NOT EXISTS idx_ct_task       ON collection_tasks(task_id);
