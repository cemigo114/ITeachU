/**
 * Ingest task .docx files into the SQLite database.
 *
 * Usage:
 *   node scripts/ingest-tasks.js                          # defaults to ../Grade 6
 *   TASK_DOCX_ROOT="/path/to/Grade 7" node scripts/ingest-tasks.js
 *
 * Idempotent: uses INSERT OR REPLACE so re-running is safe.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../db/index.js';
import { parseDocx } from './parse-docx.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const TASK_DOCX_ROOT = process.env.TASK_DOCX_ROOT || path.join(ROOT, '..', 'Grade 6');

const DOMAIN_MAP = {
  'RP': 'Ratios & Proportions',
  'NS': 'The Number System',
  'EE': 'Expressions & Equations',
  'SP': 'Statistics & Probability',
  'G':  'Geometry',
  'NF': 'Number & Operations - Fractions',
  'OA': 'Operations & Algebraic Thinking',
  'NBT': 'Number & Operations in Base Ten',
  'MD': 'Measurement & Data',
  'F':  'Functions',
};

function normalizeStatementCode(filename) {
  const base = path.basename(filename, '.docx');
  // Handles both "6.SP.A.2_Title" and "6_EE_A_1_Title" formats
  const dotMatch = base.match(/^(\d+\.[A-Z]+\.[A-Z]\.\d+)/);
  if (dotMatch) return dotMatch[1];
  const underscoreMatch = base.match(/^(\d+)[._]([A-Z]+)[._]([A-Z])[._](\d+)/i);
  if (underscoreMatch) return `${underscoreMatch[1]}.${underscoreMatch[2]}.${underscoreMatch[3]}.${underscoreMatch[4]}`;
  return base.split('_')[0];
}

function getDomain(statementCode) {
  const m = statementCode.match(/^\d+\.([A-Z]+)\./);
  return m ? (DOMAIN_MAP[m[1]] || m[1]) : 'General';
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function generateAiIntro(title, studentPrompt, misconceptions) {
  const firstMisconception = misconceptions?.[0] || '';
  const misconceptionText = firstMisconception
    .replace(/^[^:]+:\s*/, '')  // strip label like "Additive Reasoning:"
    .replace(/\.$/, '');

  const promptPreview = studentPrompt?.split(/[.!?]/)[0] || title;

  return `Hi! I'm Zippy! 🎉\n\n${promptPreview}.\n\nHmm, I think ${misconceptionText.charAt(0).toLowerCase() + misconceptionText.slice(1)}... 🤔\n\nCan you help me understand this better?`;
}

function deriveGrade(statementCode) {
  const m = statementCode.match(/^(\d+)\./);
  return m ? m[1] : '6';
}

async function main() {
  const db = getDb();

  let docxDir = TASK_DOCX_ROOT;
  if (!fs.existsSync(docxDir)) {
    console.error('Task docx directory not found:', docxDir);
    console.error('Set TASK_DOCX_ROOT environment variable to the folder containing .docx files.');
    process.exit(1);
  }

  const files = fs.readdirSync(docxDir).filter(f => f.endsWith('.docx'));
  console.log(`Found ${files.length} .docx files in ${docxDir}`);

  const insTask = db.prepare(`
    INSERT OR REPLACE INTO task (
      id, slug, title, description,
      problem_statement, misconceptions, pattern_recognition,
      generalization, inference_prediction, mapping_data,
      teaching_prompt, target_concepts, correct_solution_pathway,
      ai_intro, ai_intro_es,
      standard_statement_code, standard_case_uuid, grade,
      domain, docx_path, image_url
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?, ?,
      ?, ?, ?
    )
  `);

  const insCollection = db.prepare(`
    INSERT OR IGNORE INTO collection (id, slug, title, description, type, grade, published, source)
    VALUES (?, ?, ?, ?, ?, ?, 1, 'derived')
  `);

  const insCollectionTask = db.prepare(`
    INSERT OR REPLACE INTO collection_tasks (collection_id, task_id, sort_order, required)
    VALUES (?, ?, ?, ?)
  `);

  // Try to look up standard UUIDs from the standards table if it exists
  let getStandardByCode = null;
  try {
    const tableCheck = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='standards_framework_item'"
    ).get();
    if (tableCheck) {
      getStandardByCode = db.prepare(
        "SELECT case_identifier_uuid FROM standards_framework_item WHERE statement_code = ? LIMIT 1"
      );
    }
  } catch { /* standards table may not exist yet */ }

  const collectionTracker = {};
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(docxDir, file);
    const statementCode = normalizeStatementCode(file);
    const grade = deriveGrade(statementCode);
    const domain = getDomain(statementCode);

    let parsed;
    try {
      parsed = await parseDocx(filePath);
    } catch (err) {
      console.warn(`  SKIP ${file}: parse error - ${err.message}`);
      failed++;
      continue;
    }

    let title = parsed.title || path.basename(file, '.docx').replace(/[_-]/g, ' ');
    // Strip leading standard-code prefix from title (e.g. "6.EE.A.4 Equivalent..." → "Equivalent...")
    title = title.replace(/^\d+[\s._]+[A-Z]+[\s._]+[A-Z][\s._]+\d+[\s._]*/i, '').trim() || title;
    const slug = slugify(`${statementCode}-${title}`);
    const id = slug;

    const standardUuid = getStandardByCode
      ? (getStandardByCode.get(statementCode)?.case_identifier_uuid || null)
      : null;

    const aiIntro = generateAiIntro(title, parsed.studentPrompt, parsed.misconceptions);
    const teachingPrompt = `Help Zippy understand ${title.toLowerCase()} by guiding them through the concept step by step.`;
    const targetConcepts = parsed.standardDescription
      ? [parsed.standardDescription.split(',')[0].trim()]
      : [];

    insTask.run(
      id,
      slug,
      title,
      parsed.standardDescription || '',
      parsed.studentPrompt || '',
      JSON.stringify(parsed.misconceptions || []),
      parsed.patternRecognition || '',
      parsed.generalization || '',
      parsed.inferencePrediction || '',
      JSON.stringify(parsed.mappingData || {}),
      teachingPrompt,
      JSON.stringify(targetConcepts),
      '',
      aiIntro,
      null,
      statementCode,
      standardUuid,
      grade,
      domain,
      file,
      null
    );

    // Track domain collections
    const collId = `grade-${grade}-${slugify(domain)}`;
    if (!collectionTracker[collId]) {
      collectionTracker[collId] = { grade, domain, tasks: [] };
      insCollection.run(
        collId,
        slugify(`grade-${grade}-${domain}`),
        `Grade ${grade} - ${domain}`,
        `Grade ${grade} ${domain} tasks`,
        'unit',
        parseInt(grade, 10)
      );
    }
    collectionTracker[collId].tasks.push(id);
    insCollectionTask.run(collId, id, collectionTracker[collId].tasks.length, collectionTracker[collId].tasks.length === 1 ? 1 : 0);

    inserted++;
    console.log(`  ✓ ${statementCode} - ${title}`);
  }

  console.log(`\nDone: ${inserted} tasks inserted, ${failed} failed`);
  console.log(`Collections created: ${Object.keys(collectionTracker).length}`);
  for (const [collId, info] of Object.entries(collectionTracker)) {
    console.log(`  ${collId}: ${info.tasks.length} tasks`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
