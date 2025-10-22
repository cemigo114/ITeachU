# Knowledge Graph Integration Plan

## Overview

The [Learning Commons Knowledge Graph](https://github.com/learning-commons-org/knowledge-graph) provides structured educational data including:
- **StandardsFramework** - Educational standards frameworks (Common Core, state standards)
- **StandardsFrameworkItem** - Individual standards and learning objectives
- **LearningComponent** - Granular skills/concepts
- **Relationships** - Connections between all entities

This plan shows how to use it as the data layer for ITeachU tasks.

---

## 🎯 Strategic Benefits

### Why Use Knowledge Graph?

1. **Standards Alignment** ✅
   - Every ITeachU task automatically linked to CCSS standards
   - Track which standards students have practiced
   - Generate reports showing standards coverage

2. **Learning Progressions** ✅
   - Use prerequisite relationships from knowledge graph
   - Auto-suggest next tasks based on learning pathway
   - Lock tasks until prerequisites completed

3. **Multi-State Support** ✅
   - Map tasks aligned to CCSS → state-specific standards
   - Same task works for CA, TX, NY standards
   - Teachers filter by their state

4. **Granular Skills** ✅
   - LearningComponents = specific misconceptions/skills
   - Track student mastery at skill level (not just task level)
   - AI uses skills to personalize misconception targeting

---

## 📊 Current ITeachU Schema vs Knowledge Graph

### What We Have Now:
```sql
tasks (
  id, title, grade_level, domain, standards (JSONB array)
)
```

### What Knowledge Graph Provides:
```sql
standards_framework_item (
  caseIdentifierUUID, statementCode, description,
  gradeLevel (JSON), jurisdiction, academicSubject
)

learning_component (
  identifier, description, academicSubject
)

relationships (
  relationshipType, sourceEntity, targetEntity
  -- Types: hasChild, isChildOf, isRelatedTo, exactMatch
)
```

---

## 🏗️ Integration Architecture

### Phase 1: Import Knowledge Graph (Foundation)

**Setup:**
1. Download CSV files from S3 (see README.md links)
2. Import into PostgreSQL using provided scripts
3. Create indexes on frequently queried fields

**Tables to Import:**
- ✅ `standards_framework` - Framework metadata
- ✅ `standards_framework_item` - Individual standards (CCSS.MATH.8.F.B.4, etc.)
- ✅ `learning_component` - Granular skills
- ✅ `relationships` - All connections

**Script:**
```bash
# Download CSV files
curl -L "https://aidt-knowledge-graph-datasets-public-prod.s3.us-west-2.amazonaws.com/knowledge-graph/v1.0.0/csv/StandardsFramework.csv" -o StandardsFramework.csv
curl -L "https://aidt-knowledge-graph-datasets-public-prod.s3.us-west-2.amazonaws.com/knowledge-graph/v1.0.0/csv/StandardsFrameworkItem.csv" -o StandardsFrameworkItem.csv
curl -L "https://aidt-knowledge-graph-datasets-public-prod.s3.us-west-2.amazonaws.com/knowledge-graph/v1.0.0/csv/LearningComponent.csv" -o LearningComponent.csv
curl -L "https://aidt-knowledge-graph-datasets-public-prod.s3.us-west-2.amazonaws.com/knowledge-graph/v1.0.0/csv/Relationships.csv" -o Relationships.csv

# Import to PostgreSQL
psql -U postgres -d iteachu -f import_scripts/postgresql/create_tables.sql
psql -U postgres -d iteachu -f import_scripts/postgresql/load_data.sql
```

**Estimated Time:** 1 hour
**Storage:** ~500MB (compressed CSV), ~2GB (database)

---

### Phase 2: Link Tasks to Standards

**Goal:** Connect each ITeachU task to StandardsFrameworkItem records

**Schema Change:**
```sql
-- Add to existing tasks table
ALTER TABLE tasks
  ADD COLUMN primary_standard_uuid TEXT REFERENCES standards_framework_item(caseIdentifierUUID),
  ADD COLUMN secondary_standards_uuids TEXT[]; -- Array of related standards

-- Or create junction table (better for many-to-many)
CREATE TABLE task_standards (
  task_id UUID REFERENCES tasks(id),
  standard_uuid TEXT REFERENCES standards_framework_item(caseIdentifierUUID),
  alignment_type VARCHAR(20), -- 'primary', 'secondary', 'supports'
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  PRIMARY KEY (task_id, standard_uuid)
);
```

**Example Mapping:**
```sql
-- Stack of Cups task
INSERT INTO task_standards VALUES (
  'stack_of_cups_uuid',
  'c4401baa-b0e5-496c-92c3-352fda95e5ae', -- CCSS.MATH.8.F.B.4 UUID
  'primary',
  1.00
);

-- Smoothie Recipe task
INSERT INTO task_standards VALUES (
  'smoothie_recipe_uuid',
  '<6.RP.A.3 UUID>', -- Find from knowledge graph
  'primary',
  1.00
);
```

**Query to Find Standards:**
```sql
-- Find CCSS.MATH.8.F.B.4
SELECT * FROM standards_framework_item
WHERE "statementCode" = '8.F.B.4';

-- Find all Grade 8 math standards
SELECT * FROM standards_framework_item
WHERE EXISTS (
  SELECT 1 FROM json_array_elements_text("gradeLevel") AS elem
  WHERE elem = '8'
)
AND "academicSubject" = 'Mathematics'
AND "jurisdiction" = 'Multi-State';
```

**Estimated Time:** 2-3 hours
**Manual Work:** Map existing 2 tasks, create script to help map future tasks

---

### Phase 3: Use Learning Components for Misconceptions

**Goal:** Link task misconceptions to LearningComponents for granular tracking

**Schema Change:**
```sql
-- Enhance misconceptions table
ALTER TABLE task_misconceptions
  ADD COLUMN learning_component_ids TEXT[]; -- Array of LearningComponent identifiers

-- Track student mastery at skill level
CREATE TABLE student_learning_components (
  student_id UUID REFERENCES users(id),
  learning_component_id TEXT REFERENCES learning_component(identifier),

  -- Mastery tracking
  proficiency_level VARCHAR(20), -- 'emerging', 'developing', 'proficient', 'advanced'
  attempts_count INT DEFAULT 0,
  last_assessed TIMESTAMPTZ,

  -- Evidence
  evidence JSONB, -- Tasks where this component appeared

  PRIMARY KEY (student_id, learning_component_id)
);
```

**Example Usage:**
```sql
-- Stack of Cups uses these learning components:
-- 1. "Linear patterns" component
-- 2. "Function notation" component
-- 3. "Slope interpretation" component

-- Find relevant learning components
SELECT * FROM learning_component
WHERE "academicSubject" = 'Mathematics'
AND "description" ILIKE '%linear%pattern%';

-- Link to misconception
INSERT INTO task_misconceptions (
  task_id,
  misconception_id,
  learning_component_ids
) VALUES (
  'stack_of_cups',
  'proportional_reasoning_error',
  ARRAY['<linear_pattern_uuid>', '<slope_interp_uuid>']
);
```

**Estimated Time:** 4-5 hours
**Manual Work:** Categorize misconceptions, map to learning components

---

### Phase 4: Build Learning Progressions

**Goal:** Use Knowledge Graph relationships to create task sequences

**Query Learning Progressions:**
```sql
-- Find prerequisites for a standard using hasChild relationships
WITH RECURSIVE prerequisites AS (
  -- Base case: Find parent of target standard
  SELECT parent."caseIdentifierUUID", parent."statementCode", parent."description", 1 AS depth
  FROM relationships r
  JOIN standards_framework_item parent
    ON parent."caseIdentifierUUID" = r."sourceEntityValue"
  WHERE r."relationshipType" = 'hasChild'
    AND r."targetEntityValue" = '<8.F.B.4 UUID>'

  UNION ALL

  -- Recursive: Find grandparents
  SELECT parent."caseIdentifierUUID", parent."statementCode", parent."description", p.depth + 1
  FROM relationships r
  JOIN standards_framework_item parent
    ON parent."caseIdentifierUUID" = r."sourceEntityValue"
  JOIN prerequisites p
    ON p."caseIdentifierUUID" = r."targetEntityValue"
  WHERE r."relationshipType" = 'hasChild'
    AND p.depth < 3 -- Limit recursion depth
)
SELECT * FROM prerequisites ORDER BY depth;
```

**Use in Task Collections:**
```sql
-- Auto-generate collection based on learning progression
-- Example: "Linear Functions Pathway"

-- Step 1: Find all standards in 8.F domain
SELECT * FROM standards_framework_item
WHERE "statementCode" LIKE '8.F.%'
ORDER BY "statementCode";

-- Step 2: Find ITeachU tasks mapped to those standards
SELECT t.*, s."statementCode", s."description"
FROM tasks t
JOIN task_standards ts ON t.id = ts.task_id
JOIN standards_framework_item s ON ts.standard_uuid = s."caseIdentifierUUID"
WHERE s."statementCode" LIKE '8.F.%'
ORDER BY s."statementCode";

-- Step 3: Create collection with prerequisite order
INSERT INTO task_collections (id, title, type)
VALUES ('linear_functions_pathway', 'Grade 8 Linear Functions', 'pathway');

INSERT INTO collection_tasks (collection_id, task_id, order_in_collection, requires_task_id)
-- Auto-populated based on standard hierarchy
```

**Estimated Time:** 6-8 hours
**Automation:** Write script to generate collections from standard hierarchies

---

### Phase 5: Multi-State Standards Mapping

**Goal:** Allow teachers to filter tasks by their state standards

**Query State-Specific Standards:**
```sql
-- Find California equivalent of CCSS.MATH.8.F.B.4
SELECT target.*
FROM relationships r
JOIN standards_framework_item source
  ON source."caseIdentifierUUID" = r."sourceEntityValue"
JOIN standards_framework_item target
  ON target."caseIdentifierUUID" = r."targetEntityValue"
WHERE source."statementCode" = '8.F.B.4'
  AND source."jurisdiction" = 'Multi-State' -- CCSS
  AND target."jurisdiction" = 'California'
  AND r."relationshipType" IN ('exactMatch', 'isRelatedTo');
```

**UI Feature:**
```javascript
// Teacher selects their state
const [teacherState, setTeacherState] = useState('California');

// API fetches tasks aligned to CA standards
GET /api/tasks?jurisdiction=California&grade=8

// Backend translates CA standards → CCSS → ITeachU tasks
// Returns same tasks but shows CA standard codes
```

**Estimated Time:** 3-4 hours
**Impact:** Makes ITeachU usable in 15+ states with no content changes

---

## 🔧 Technical Implementation

### Backend API Endpoints

```javascript
// server.js additions

// Get standard by code
app.get('/api/standards/:code', async (req, res) => {
  const { code } = req.params;
  const result = await db.query(
    'SELECT * FROM standards_framework_item WHERE "statementCode" = $1',
    [code]
  );
  res.json(result.rows[0]);
});

// Get tasks by standard
app.get('/api/standards/:uuid/tasks', async (req, res) => {
  const { uuid } = req.params;
  const result = await db.query(`
    SELECT t.*, s."statementCode", s."description" as standard_description
    FROM tasks t
    JOIN task_standards ts ON t.id = ts.task_id
    JOIN standards_framework_item s ON ts.standard_uuid = s."caseIdentifierUUID"
    WHERE s."caseIdentifierUUID" = $1
  `, [uuid]);
  res.json(result.rows);
});

// Get learning progression for a task
app.get('/api/tasks/:id/progression', async (req, res) => {
  const { id } = req.params;
  // Recursive query to find prerequisite standards
  // Map to prerequisite tasks
  res.json({ prerequisites: [...], next_tasks: [...] });
});

// Get student learning component mastery
app.get('/api/students/:id/components', async (req, res) => {
  const { id } = req.params;
  const result = await db.query(`
    SELECT lc.*, slc.proficiency_level, slc.attempts_count
    FROM student_learning_components slc
    JOIN learning_component lc ON slc.learning_component_id = lc.identifier
    WHERE slc.student_id = $1
  `, [id]);
  res.json(result.rows);
});
```

### Frontend Integration

```javascript
// TaskCollectionBrowser enhancements

const [filterByState, setFilterByState] = useState('Multi-State'); // CCSS

useEffect(() => {
  // Fetch collections filtered by jurisdiction
  fetch(`/api/collections?jurisdiction=${filterByState}`)
    .then(res => res.json())
    .then(data => setCollections(data));
}, [filterByState]);

// Show standard alignment in task cards
<div className="text-xs text-gray-500 mt-2">
  Aligned to: {task.standardCode} - {task.standardDescription}
</div>
```

---

## 📈 Phased Rollout Timeline

### Week 1: Foundation
- [ ] Import Knowledge Graph data to PostgreSQL
- [ ] Create indexes on frequently queried fields
- [ ] Write basic query functions (get standard by code, etc.)

### Week 2: Task Mapping
- [ ] Add task_standards junction table
- [ ] Map existing 2 tasks to standards
- [ ] Create admin UI to map new tasks easily

### Week 3: Learning Components
- [ ] Link misconceptions to learning components
- [ ] Track student_learning_components in sessions
- [ ] Show skill mastery in student dashboard

### Week 4: Progressions
- [ ] Build learning progression queries
- [ ] Auto-generate task collections from standard hierarchies
- [ ] Add "Suggested Next Task" feature

### Week 5: Multi-State
- [ ] Add state filter to task browser
- [ ] Map CCSS → state standards via relationships
- [ ] Show state-specific standard codes in UI

---

## 🎯 Quick Wins (Do First)

1. **Standards Badge** (2 hours)
   - Add `standard_code` field to tasks
   - Show badge on task cards: "CCSS 8.F.B.4"
   - Query knowledge graph for description tooltip

2. **Prerequisite Locking** (3 hours)
   - Use `hasChild` relationships
   - Lock tasks until prerequisites completed
   - Show "Complete Task X first" message

3. **Skill Tracking** (4 hours)
   - Link 1-2 learning components per task
   - Track in `student_learning_components` table
   - Show "Skills Practiced" in session summary

---

## 📊 Data Volume Estimates

**Knowledge Graph Size:**
- StandardsFrameworkItem: ~80,000 rows (all states, all subjects)
- LearningComponent: ~15,000 rows
- Relationships: ~200,000 rows

**Filtered for ITeachU (Math only, Grades 6-8):**
- StandardsFrameworkItem: ~500 rows
- LearningComponent: ~1,000 rows
- Relationships: ~3,000 rows

**Storage Impact:** +200MB for filtered subset

---

## 🚨 Potential Challenges

### Challenge 1: Performance
- **Issue:** Recursive queries for learning progressions can be slow
- **Solution:** Cache progression trees, materialize common paths

### Challenge 2: Data Quality
- **Issue:** Not all LearningComponents may be relevant to ITeachU
- **Solution:** Curate subset, create custom components where needed

### Challenge 3: Maintenance
- **Issue:** Knowledge Graph updates quarterly, need to re-import
- **Solution:** Create migration script, version data imports

---

## 📝 Summary: Should We Do This?

### ✅ **YES** - Recommended Integrations:

1. **Standards Alignment** - High value, low effort
   - Map tasks to StandardsFrameworkItem
   - Show standard codes in UI
   - Enable filtering by grade/subject

2. **Learning Progressions** - High value, medium effort
   - Use hasChild relationships
   - Create prerequisite-based task sequences
   - Auto-suggest next tasks

3. **Multi-State Support** - Medium value, medium effort
   - Makes product usable in 15+ states
   - Minimal content changes needed

### ⚠️ **MAYBE** - Consider After MVP:

4. **Granular Skill Tracking** - High effort
   - Requires careful mapping of misconceptions → components
   - Complex data model
   - Better for v2.0 after validating core product

---

## 🎬 Recommended First Step

**Proof of Concept (4 hours):**

1. Download StandardsFrameworkItem.csv
2. Import to local PostgreSQL
3. Query for CCSS.MATH.8.F.B.4 and CCSS.MATH.6.RP.A.3
4. Add `standard_uuid` column to tasks table
5. Link Stack of Cups → 8.F.B.4
6. Show standard code badge in UI

If this works well and feels valuable → proceed with full integration.
If it feels like overkill → keep standards in JSONB array (current approach).

---

**Next Steps:** Review this plan and decide which phases to implement.
