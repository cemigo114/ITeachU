import { PrismaClient } from '@prisma/client';

let prisma = null;
let useDatabase = false;

try {
  if (process.env.DATABASE_URL) {
    prisma = new PrismaClient();
    useDatabase = true;
    console.log('🗄️  Database mode: PostgreSQL via Prisma');
  } else {
    console.log('📁 Database mode: JSON file fallback (no DATABASE_URL set)');
  }
} catch (error) {
  console.error('⚠️  Prisma init failed, falling back to JSON:', error.message);
}

export { prisma, useDatabase };

export async function verifyDatabaseTables() {
  if (!prisma || !useDatabase) return false;
  try {
    await prisma.user.findFirst();
    console.log('✅ Database tables verified (User table exists)');
    return true;
  } catch (error) {
    console.error('⚠️  Database tables not ready, falling back to JSON:', error.message);
    useDatabase = false;
    return false;
  }
}

export async function connectDatabase() {
  if (!prisma) return false;
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    useDatabase = false;
    return false;
  }
}

export async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect();
  }
}

// --- Conversation operations ---

export async function upsertConversation({ sessionId, model, systemPrompt, taskMetadata, messages, lastResponse }) {
  if (!prisma) return null;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.conversation.findUnique({
      where: { sessionId },
      include: { messages: { orderBy: { sequenceNumber: 'desc' }, take: 1 } }
    });

    if (existing) {
      const lastSeq = existing.messages[0]?.sequenceNumber ?? -1;
      const existingCount = lastSeq + 1;

      const newClientMessages = messages.slice(existingCount);
      const newRows = newClientMessages.map((msg, i) => ({
        conversationId: existing.id,
        role: msg.role,
        content: msg.content,
        sequenceNumber: existingCount + i
      }));

      if (lastResponse) {
        newRows.push({
          conversationId: existing.id,
          role: 'assistant',
          content: lastResponse,
          sequenceNumber: existingCount + newClientMessages.length
        });
      }

      if (newRows.length > 0) {
        await tx.message.createMany({ data: newRows });
      }

      return tx.conversation.update({
        where: { sessionId },
        data: { updatedAt: new Date() },
        include: { messages: { orderBy: { sequenceNumber: 'asc' } } }
      });
    }

    const allMessages = messages.map((msg, i) => ({
      role: msg.role,
      content: msg.content,
      sequenceNumber: i
    }));

    if (lastResponse) {
      allMessages.push({
        role: 'assistant',
        content: lastResponse,
        sequenceNumber: messages.length
      });
    }

    return tx.conversation.create({
      data: {
        sessionId,
        model: model || 'unknown',
        systemPrompt: systemPrompt || null,
        taskTitle: taskMetadata?.title || null,
        taskMetadata: taskMetadata || {},
        messages: { create: allMessages }
      },
      include: { messages: { orderBy: { sequenceNumber: 'asc' } } }
    });
  });
}

export async function getAllConversations() {
  if (!prisma) return [];

  const conversations = await prisma.conversation.findMany({
    include: {
      messages: { orderBy: { sequenceNumber: 'asc' } },
      evaluation: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return conversations;
}

// --- Evaluation operations ---

export async function upsertEvaluation(sessionId, evaluation) {
  if (!prisma) return null;

  const conversation = await prisma.conversation.findUnique({
    where: { sessionId }
  });
  if (!conversation) return null;

  return prisma.evaluation.upsert({
    where: { conversationId: conversation.id },
    create: {
      conversationId: conversation.id,
      totalScore: evaluation.totalScore,
      conceptArticulation: evaluation.categoryScores?.conceptArticulation || 0,
      logicCoherence: evaluation.categoryScores?.logicCoherence || 0,
      misconceptionCorrection: evaluation.categoryScores?.misconceptionCorrection || 0,
      cognitiveResilience: evaluation.categoryScores?.cognitiveResilience || 0,
      justifications: evaluation.justifications || {},
      rawResponse: evaluation.rawResponse || null,
      evaluatorModel: evaluation.evaluatorModel || null
    },
    update: {
      totalScore: evaluation.totalScore,
      conceptArticulation: evaluation.categoryScores?.conceptArticulation || 0,
      logicCoherence: evaluation.categoryScores?.logicCoherence || 0,
      misconceptionCorrection: evaluation.categoryScores?.misconceptionCorrection || 0,
      cognitiveResilience: evaluation.categoryScores?.cognitiveResilience || 0,
      justifications: evaluation.justifications || {},
      rawResponse: evaluation.rawResponse || null,
      evaluatorModel: evaluation.evaluatorModel || null
    }
  });
}

export async function getEvaluation(sessionId) {
  if (!prisma) return null;

  const conversation = await prisma.conversation.findUnique({
    where: { sessionId },
    include: { evaluation: true }
  });

  if (!conversation?.evaluation) return null;

  const eval_ = conversation.evaluation;
  return {
    categoryScores: {
      conceptArticulation: eval_.conceptArticulation,
      logicCoherence: eval_.logicCoherence,
      misconceptionCorrection: eval_.misconceptionCorrection,
      cognitiveResilience: eval_.cognitiveResilience
    },
    justifications: eval_.justifications,
    totalScore: eval_.totalScore
  };
}
