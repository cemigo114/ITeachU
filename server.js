import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Store for conversation logs (in production, use a database)
const conversationLogs = [];

// Store for sessions (in production, use a database)
const sessions = new Map(); // sessionId -> session data

app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.VITE_ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Log conversation for backend assessment (hidden from frontend)
    const conversationLog = {
      timestamp: new Date().toISOString(),
      messages: req.body.messages,
      response: data.content[0].text,
      model: req.body.model
    };

    conversationLogs.push(conversationLog);

    // In production: Save to database for teacher dashboard analysis
    // For now, just log to console that assessment is happening
    console.log(`📊 Conversation logged for backend assessment (${conversationLogs.length} total)`);

    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Teacher-only endpoint to get conversation logs and assessments
app.get('/api/teacher/conversations', (req, res) => {
  // In production: Add authentication middleware
  res.json({
    count: conversationLogs.length,
    conversations: conversationLogs.map((log, idx) => ({
      id: idx,
      timestamp: log.timestamp,
      turnCount: log.messages.length,
      // Assessment logic would go here (analyzing conversation content)
      // For now, just return metadata
    }))
  });
});

// Session management endpoints
app.post('/api/sessions', (req, res) => {
  try {
    const { sessionId, sessionData } = req.body;

    if (!sessionId || !sessionData) {
      return res.status(400).json({ error: 'sessionId and sessionData required' });
    }

    // Store session (in production: save to database)
    sessions.set(sessionId, {
      ...sessionData,
      updatedAt: new Date().toISOString()
    });

    console.log(`💾 Session saved: ${sessionId} (${sessionData.messages?.length || 0} messages)`);

    res.json({ success: true, sessionId });
  } catch (error) {
    console.error('Session save error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Session fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    sessions.delete(sessionId);
    console.log(`🗑️  Session deleted: ${sessionId}`);

    res.json({ success: true });
  } catch (error) {
    console.error('Session delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get task collections
app.get('/api/collections', (req, res) => {
  try {
    // In production: Fetch from database
    // For now: Return from JSON file
    const collections = require('./src/data/taskCollections.json');
    res.json(collections);
  } catch (error) {
    console.error('Collections fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get educational standards (Connecticut Mathematics - 746 standards from Knowledge Graph)
app.get('/api/standards', (req, res) => {
  try {
    const standards = require('./src/data/ct-math-standards.json');
    res.json(standards);
  } catch (error) {
    console.error('Standards fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get standard by ID or code
app.get('/api/standards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const standards = require('./src/data/ct-math-standards.json');
    const standard = standards.standards.find(s => s.id === id || s.code === id);

    if (!standard) {
      return res.status(404).json({ error: 'Standard not found' });
    }

    res.json(standard);
  } catch (error) {
    console.error('Standard fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📊 Backend assessment enabled - logs hidden from frontend`);
  console.log(`💾 Session persistence enabled`);
  console.log(`📚 Task collections API ready`);
  console.log(`🎯 Standards alignment API ready`);
});
