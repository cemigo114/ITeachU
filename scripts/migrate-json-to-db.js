/**
 * One-time migration: import existing JSON data into PostgreSQL.
 *
 * Usage:
 *   DATABASE_URL="postgres://..." node scripts/migrate-json-to-db.js
 *
 * Safe to run multiple times — skips conversations that already exist (by sessionId).
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function migrate() {
  const dataDir = path.join(process.cwd(), 'data');

  // --- Conversations ---
  const convPath = path.join(dataDir, 'conversations.json');
  if (fs.existsSync(convPath)) {
    const conversations = JSON.parse(fs.readFileSync(convPath, 'utf-8'));
    console.log(`Found ${conversations.length} conversations to migrate`);

    for (const conv of conversations) {
      const existing = await prisma.conversation.findUnique({
        where: { sessionId: conv.sessionId }
      });
      if (existing) {
        console.log(`  Skipping ${conv.sessionId} (already exists)`);
        continue;
      }

      const messages = (conv.messages || []).map((msg, i) => ({
        role: msg.role,
        content: msg.content,
        sequenceNumber: i
      }));

      if (conv.lastResponse) {
        messages.push({
          role: 'assistant',
          content: conv.lastResponse,
          sequenceNumber: messages.length
        });
      }

      await prisma.conversation.create({
        data: {
          sessionId: conv.sessionId,
          model: conv.model || 'unknown',
          systemPrompt: conv.system || null,
          taskTitle: conv.taskMetadata?.title || null,
          taskMetadata: conv.taskMetadata || {},
          createdAt: new Date(conv.timestamp),
          updatedAt: new Date(conv.updatedAt || conv.timestamp),
          messages: { create: messages }
        }
      });
      console.log(`  Migrated ${conv.sessionId} (${messages.length} messages)`);
    }
  } else {
    console.log('No conversations.json found, skipping');
  }

  // --- Evaluations ---
  const evalPath = path.join(dataDir, 'evaluations.json');
  if (fs.existsSync(evalPath)) {
    const evalEntries = JSON.parse(fs.readFileSync(evalPath, 'utf-8'));
    console.log(`Found ${evalEntries.length} evaluations to migrate`);

    for (const [sessionId, evaluation] of evalEntries) {
      const conversation = await prisma.conversation.findUnique({
        where: { sessionId }
      });
      if (!conversation) {
        console.log(`  Skipping eval for ${sessionId} (conversation not found)`);
        continue;
      }

      const existingEval = await prisma.evaluation.findUnique({
        where: { conversationId: conversation.id }
      });
      if (existingEval) {
        console.log(`  Skipping eval for ${sessionId} (already exists)`);
        continue;
      }

      await prisma.evaluation.create({
        data: {
          conversationId: conversation.id,
          totalScore: evaluation.totalScore || 0,
          conceptArticulation: evaluation.categoryScores?.conceptArticulation || 0,
          logicCoherence: evaluation.categoryScores?.logicCoherence || 0,
          misconceptionCorrection: evaluation.categoryScores?.misconceptionCorrection || 0,
          cognitiveResilience: evaluation.categoryScores?.cognitiveResilience || 0,
          justifications: evaluation.justifications || {}
        }
      });
      console.log(`  Migrated eval for ${sessionId} (score: ${evaluation.totalScore})`);
    }
  } else {
    console.log('No evaluations.json found, skipping');
  }

  console.log('\nMigration complete!');
}

migrate()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
