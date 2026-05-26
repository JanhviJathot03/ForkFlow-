const express = require('express');
const aiService = require('../services/aiService');

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({
    success: true,
    provider: aiService.activeProvider(),
    hasCloudAI: aiService.hasCloudAI(),
    ollamaUrl: aiService.ollamaBaseUrl,
    ollamaModel: aiService.ollamaModel,
    chatModel: aiService.chatModel,
  });
});

router.post('/ideas', async (req, res) => {
  try {
    const result = await aiService.generateAgentIdeas(req.body || {});
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate agent ideas' });
  }
});

router.post('/prompt-template', async (req, res) => {
  try {
    const result = await aiService.generatePromptTemplate(req.body || {});
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate prompt template' });
  }
});

router.post('/summarize', async (req, res) => {
  try {
    const { text = '' } = req.body || {};
    const result = await aiService.summarize(text);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to summarize text' });
  }
});

module.exports = router;