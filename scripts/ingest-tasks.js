#!/usr/bin/env node
/**
 * CLI script for bulk-ingesting markdown task files into PostgreSQL.
 *
 * Usage:
 *   npm run ingest -- --dir "/path/to/New Item Bank"
 *   TASK_DIR="/path/to/New Item Bank" npm run ingest
 */
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { parseMarkdown } from './parse-markdown.js';

const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function deriveGrade(gradeLevel) {
  if (!gradeLevel) return '';
  const num = gradeLevel.match(/\d+/);
  if (num) return num[0];
  if (/high\s*school|hs/i.test(gradeLevel)) return 'HS';
  return gradeLevel;
}

function generateAiIntro(parsed) {
  const title = parsed.taskTitle || 'this task';
  const prompt = parsed.studentPrompt || '';
  const firstMisconception = parsed.misconceptions?.[0];
  const misconceptionText = firstMisconception
    ? typeof firstMisconception === 'string'
      ? firstMisconception
      : firstMisconception.title || firstMisconception.description || ''
    : '';

  const intro = `Hi! I'm Zippy! I need help with "${title}". ${prompt ? prompt.split('.').slice(0, 2).join('.') + '.' : ''} ${misconceptionText ? `I was thinking about it and got confused because ${misconceptionText.toLowerCase().replace(/^\*\*/, '').split('.')[0]}.` : ''} Can you help me understand?`;
  return intro.replace(/\s+/g, ' ').trim();
}

function generateTeachingPrompt(parsed) {
  return `Help Zippy understand ${parsed.taskTitle || 'the concept'} by teaching the key mathematical ideas step by step.`;
}

async function main() {
  const args = process.argv.slice(2);
  const dirFlagIdx = args.indexOf('--dir');
  const taskDir = dirFlagIdx !== -1 ? args[dirFlagIdx + 1] : process.env.TASK_DIR;
  const dryRun = args.includes('--dry-run');

  if (!taskDir) {
    console.error('Usage: npm run ingest -- --dir "/path/to/markdown/files"');
    process.exit(1);
  }

  console.log(`📂 Reading markdown files from: ${taskDir}`);
  if (dryRun) console.log('🔍 DRY RUN — no database writes');

  const files = (await readdir(taskDir)).filter(f => f.endsWith('.md'));
  console.log(`📄 Found ${files.length} .md files\n`);

  let inserted = 0, updated = 0, failed = 0;
  const collectionMap = new Map();
  const warnings = [];

  for (const file of files) {
    try {
      const content = await readFile(path.join(taskDir, file), 'utf-8');
      const parsed = parseMarkdown(content, file);

      if (!parsed.ccssCode || !parsed.taskTitle) {
        warnings.push(`⚠️  ${file}: missing ccssCode or taskTitle, skipping`);
        failed++;
        continue;
      }

      const grade = deriveGrade(parsed.gradeLevel);
      const slug = slugify(`${parsed.ccssCode}-${parsed.taskTitle}`);
      const aiIntro = generateAiIntro(parsed);
      const teachingPrompt = generateTeachingPrompt(parsed);

      const targetConcepts = [];
      if (parsed.studentPrompt) targetConcepts.push(parsed.taskTitle);
      if (parsed.patternRecognition) targetConcepts.push('Pattern Recognition');
      if (parsed.generalization) targetConcepts.push('Generalization');

      if (dryRun) {
        console.log(`  ✓ ${slug} (${grade} / ${parsed.domain})`);
      } else {
        const existing = await prisma.task.findUnique({ where: { slug } });
        await prisma.task.upsert({
          where: { slug },
          create: {
            slug,
            title: parsed.taskTitle,
            grade,
            domain: parsed.domain || '',
            ccssCode: parsed.ccssCode,
            cluster: parsed.cluster || null,
            standardStatement: parsed.standardStatement || null,
            studentPrompt: parsed.studentPrompt || null,
            misconceptions: parsed.misconceptions,
            patternRecognition: parsed.patternRecognition || null,
            generalization: parsed.generalization || null,
            inferencePrediction: parsed.inferencePrediction || null,
            mappingData: parsed.mappingData,
            teachingPrompt,
            targetConcepts,
            aiIntro,
            aiIntroEs: null,
            sourceFile: file,
          },
          update: {
            title: parsed.taskTitle,
            grade,
            domain: parsed.domain || '',
            ccssCode: parsed.ccssCode,
            cluster: parsed.cluster || null,
            standardStatement: parsed.standardStatement || null,
            studentPrompt: parsed.studentPrompt || null,
            misconceptions: parsed.misconceptions,
            patternRecognition: parsed.patternRecognition || null,
            generalization: parsed.generalization || null,
            inferencePrediction: parsed.inferencePrediction || null,
            mappingData: parsed.mappingData,
            teachingPrompt,
            targetConcepts,
            aiIntro,
            sourceFile: file,
          },
        });

        if (existing) {
          updated++;
          console.log(`  ↻ ${slug}`);
        } else {
          inserted++;
          console.log(`  + ${slug}`);
        }
      }

      const collKey = `${grade}-${slugify(parsed.domain || 'general')}`;
      if (!collectionMap.has(collKey)) {
        collectionMap.set(collKey, {
          grade,
          domain: parsed.domain || 'General',
          slugs: [],
        });
      }
      collectionMap.get(collKey).slugs.push(slug);
    } catch (err) {
      warnings.push(`❌ ${file}: ${err.message}`);
      failed++;
    }
  }

  if (!dryRun) {
    console.log('\n📦 Creating collections...');
    for (const [collKey, { grade, domain, slugs }] of collectionMap) {
      const collSlug = collKey;
      const collTitle = `${grade === 'HS' ? 'High School' : `Grade ${grade}`} — ${domain}`;

      const collection = await prisma.collection.upsert({
        where: { slug: collSlug },
        create: {
          slug: collSlug,
          title: collTitle,
          description: `${domain} tasks for ${grade === 'HS' ? 'High School' : `Grade ${grade}`}`,
          grade,
        },
        update: {
          title: collTitle,
          description: `${domain} tasks for ${grade === 'HS' ? 'High School' : `Grade ${grade}`}`,
          grade,
        },
      });

      for (let i = 0; i < slugs.length; i++) {
        const task = await prisma.task.findUnique({ where: { slug: slugs[i] } });
        if (!task) continue;
        await prisma.collectionTask.upsert({
          where: {
            collectionId_taskId: { collectionId: collection.id, taskId: task.id },
          },
          create: { collectionId: collection.id, taskId: task.id, sortOrder: i },
          update: { sortOrder: i },
        });
      }

      console.log(`  📁 ${collTitle} (${slugs.length} tasks)`);
    }
  }

  console.log(`\n✅ Done! ${inserted} inserted, ${updated} updated, ${failed} failed`);
  if (warnings.length) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(w => console.log(`  ${w}`));
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Fatal error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
