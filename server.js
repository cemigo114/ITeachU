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

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📊 Backend assessment enabled - logs hidden from frontend`);
});
