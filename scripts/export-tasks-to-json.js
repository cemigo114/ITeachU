#!/usr/bin/env node
/**
 * Export tasks from PostgreSQL into src/data/tasks.json.
 * Existing tasks in the JSON that are NOT in the DB are preserved.
 *
 * Usage:
 *   npm run export-tasks
 */
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();
const JSON_PATH = path.join(__dirname, '../src/data/tasks.json');

function formatGrade(grade) {
  if (!grade) return '';
  if (grade === 'HS') return 'High School';
  if (/^\d+$/.test(grade)) return `Grade ${grade}`;
  return grade;
}

function deriveDescription(task) {
  if (task.studentPrompt) {
    // Take first sentence, strip markdown/LaTeX, truncate to ~100 chars
    const plain = task.studentPrompt
      .replace(/\$[^$]*\$/g, '[math]')
      .replace(/[*_`#]/g, '')
      .replace(/^["']|["']$/g, '')
      .trim();
    const first = plain.split(/[.!?]/)[0].trim();
    return first.length > 10 ? first.slice(0, 120) : `Teach AI about ${task.title}`;
  }
  return `Teach AI about ${task.title}`;
}

function dbTaskToJson(task) {
  const misconceptionsArray = Array.isArray(task.misconceptions)
    ? task.misconceptions.map((m) =>
        typeof m === 'string' ? m : `${m.title || ''}: ${m.description || ''}`.trim()
      )
    : [];

  return {
    id: task.slug,
    slug: task.slug,
    title: task.title,
    grade: formatGrade(task.grade),
    domain: task.domain,
    standard: task.ccssCode || '',
    standardDescription: task.standardStatement || '',
    description: deriveDescription(task),
    problemStatement: task.studentPrompt || '',
    teachingPrompt: task.teachingPrompt || '',
    targetConcepts: task.targetConcepts || [],
    misconceptions: misconceptionsArray,
    aiIntro: task.aiIntro || '',
    aiIntroES: task.aiIntroEs || '',
    sections: {
      studentPrompt: task.studentPrompt || '',
      misconceptions: misconceptionsArray,
      patternRecognition: task.patternRecognition || '',
      generalization: task.generalization || '',
      inference: task.inferencePrediction || '',
      mappingData: task.mappingData || null,
    },
  };
}

async function main() {
  const raw = await readFile(JSON_PATH, 'utf-8');
  const existing = JSON.parse(raw);
  const tasksObj = existing.tasks || {};

  const dbTasks = await prisma.task.findMany();
  console.log(`📦 Found ${dbTasks.length} tasks in DB`);

  let added = 0;
  let updated = 0;

  for (const task of dbTasks) {
    const converted = dbTaskToJson(task);
    if (tasksObj[task.slug]) {
      updated++;
    } else {
      added++;
    }
    tasksObj[task.slug] = converted;
  }

  await writeFile(JSON_PATH, JSON.stringify({ tasks: tasksObj }, null, 2), 'utf-8');
  console.log(`✅ Done! ${added} added, ${updated} updated in tasks.json`);
  console.log(`   Total tasks in file: ${Object.keys(tasksObj).length}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Fatal error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
