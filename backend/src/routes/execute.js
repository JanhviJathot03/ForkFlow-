const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { Agent, Payment, Subscription, Execution, User } = require('../models');
const aiService = require('../services/aiService');

const router = express.Router();

/**
 * Check whether a user has paid access to an agent.
 * Creators always have access to their own agents.
 */
async function hasAccess(userId, agent) {
  // Creator always has access
  if (agent.creatorId === userId) return { granted: true, via: 'creator' };

  // Free agents (price = 0) are open to all
  const price = Math.max(
    parseFloat(agent.purchasePrice || 0),
    parseFloat(agent.monthlyCost || 0),
    parseFloat(agent.payPerUsePrice || 0)
  );
  if (price === 0) return { granted: true, via: 'free' };

  const completedPayment = await Payment.findOne({
    where: { agentId: agent.id, payerId: userId, status: 'completed' },
  });
  if (completedPayment) return { granted: true, via: 'purchase' };

  const activeSub = await Subscription.findOne({
    where: { agentId: agent.id, userId, status: 'active' },
  });
  if (activeSub) return { granted: true, via: 'subscription' };

  return { granted: false, via: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/execute/:agentId/chat
// Multi-turn chatbot endpoint — accepts full conversation history
// Body: { messages: [{ role: 'user'|'assistant', content: string }] }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:agentId/chat', authenticateToken, async (req, res) => {
  const { agentId } = req.params;
  const { messages } = req.body;   // full history including the new user message
  const userId = req.user.userId;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Last message must be from the user
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user' || !lastMessage.content?.trim()) {
    return res.status(400).json({ error: 'Last message must be a non-empty user message' });
  }

  const agent = await Agent.findByPk(agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  if (!agent.isPublished && agent.creatorId !== userId) {
    return res.status(403).json({ error: 'Agent is not published' });
  }

  const access = await hasAccess(userId, agent);
  if (!access.granted) {
    return res.status(403).json({
      error: 'Access denied. Purchase or subscribe to this agent first.',
      requiresPayment: true,
    });
  }

  // Build the system prompt — agent's own template + domain context
  const systemPrompt = buildSystemPrompt(agent);

  // Record this turn as an execution
  const execution = await Execution.create({
    agentId: agent.id,
    userId,
    input: lastMessage.content.trim(),
    status: 'running',
  });

  const startTime = Date.now();

  try {
    let reply;

    if (aiService.hasCloudAI()) {
      reply = await aiService.chatWithHistory(systemPrompt, messages);
    } else {
      // Ollama / fallback: flatten history into a single prompt
      const flat = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      reply = await aiService.chat(`${systemPrompt}\n\n${flat}\nAssistant:`);
    }

    const durationMs = Date.now() - startTime;

    await execution.update({ output: reply, status: 'completed', durationMs });
    await agent.update({ downloads: (agent.downloads || 0) + 1 });

    // Pay-per-use billing per message
    if (agent.pricingModel === 'pay_per_use' && parseFloat(agent.payPerUsePrice) > 0) {
      await Payment.create({
        payerId: userId,
        receiverId: agent.creatorId,
        agentId: agent.id,
        amount: agent.payPerUsePrice,
        paymentType: 'pay_per_use',
        status: 'completed',
        metadata: { executionId: execution.id, auto: true },
      });
      const receiver = await User.findByPk(agent.creatorId);
      if (receiver) {
        await receiver.update({
          totalEarnings: (parseFloat(receiver.totalEarnings || 0) + parseFloat(agent.payPerUsePrice)).toFixed(8),
        });
      }
    }

    return res.json({
      success: true,
      reply,
      executionId: execution.id,
      durationMs,
      accessVia: access.via,
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    await execution.update({ status: 'failed', errorMessage: error.message, durationMs });
    console.error('Chat execution error:', error);
    return res.status(500).json({ error: 'Agent chat failed', details: error.message });
  }
});

/**
 * Build a rich system prompt from the agent's config.
 * This locks the agent into its domain and persona.
 */
function buildSystemPrompt(agent) {
  const categoryPersonas = {
    research:    'You are a research specialist. You find, analyze, and synthesize information with precision. Cite sources when possible, structure your answers clearly, and always prioritize accuracy.',
    development: 'You are an expert software engineer. You write clean, efficient code, explain technical concepts clearly, debug problems systematically, and follow best practices.',
    content:     'You are a creative content strategist. You craft compelling copy, suggest engaging ideas, adapt tone to the audience, and help with writing, editing, and storytelling.',
    finance:     'You are a financial analyst. You explain financial concepts clearly, analyze data, discuss market trends, and help with budgeting, investing, and financial planning. Always note that this is not financial advice.',
    social:      'You are a social media expert. You understand platform algorithms, create engaging content strategies, write captions, suggest hashtags, and help grow online presence.',
  };

  const persona = categoryPersonas[agent.category?.toLowerCase()] || 'You are a helpful AI assistant.';

  const parts = [
    `You are "${agent.name}", a specialized AI agent.`,
    persona,
  ];

  if (agent.description) {
    parts.push(`About you: ${agent.description}`);
  }

  if (Array.isArray(agent.features) && agent.features.length > 0) {
    parts.push(`Your capabilities include: ${agent.features.join(', ')}.`);
  }

  if (agent.promptTemplate) {
    parts.push(`Additional instructions:\n${agent.promptTemplate}`);
  }

  parts.push('Keep responses focused, helpful, and relevant to your domain. Be conversational but professional.');

  return parts.join('\n\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/execute/:agentId  (legacy single-turn, kept for compatibility)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:agentId', authenticateToken, async (req, res) => {
  const { agentId } = req.params;
  const { input } = req.body;
  const userId = req.user.userId;

  if (!input || !input.trim()) {
    return res.status(400).json({ error: 'Input is required' });
  }

  const agent = await Agent.findByPk(agentId);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  if (!agent.isPublished && agent.creatorId !== userId) {
    return res.status(403).json({ error: 'Agent is not published' });
  }

  const access = await hasAccess(userId, agent);
  if (!access.granted) {
    return res.status(403).json({
      error: 'Access denied. Purchase or subscribe to this agent first.',
      requiresPayment: true,
    });
  }

  // Create execution record
  const execution = await Execution.create({
    agentId: agent.id,
    userId,
    input: input.trim(),
    status: 'running',
  });

  const startTime = Date.now();

  try {
    // Use structured system+user call when a promptTemplate exists (better for OpenAI)
    let output;
    if (agent.promptTemplate) {
      output = await aiService.chatWithSystem(agent.promptTemplate, input.trim());
    } else {
      output = await aiService.chat(input.trim());
    }
    const durationMs = Date.now() - startTime;

    await execution.update({
      output,
      status: 'completed',
      durationMs,
    });

    // Increment agent execution counter (reuse downloads field or add a real one)
    // We track executions via the Execution table, so just update the agent's
    // downloads as a proxy for "uses" until a dedicated field is added.
    await agent.update({ downloads: (agent.downloads || 0) + 1 });

    // For pay_per_use: create a payment record automatically
    if (agent.pricingModel === 'pay_per_use' && parseFloat(agent.payPerUsePrice) > 0) {
      const payer = await User.findByPk(userId);
      if (payer) {
        const ppuPayment = await Payment.create({
          payerId: userId,
          receiverId: agent.creatorId,
          agentId: agent.id,
          amount: agent.payPerUsePrice,
          paymentType: 'pay_per_use',
          status: 'completed',
          metadata: { executionId: execution.id, auto: true },
        });

        const receiver = await User.findByPk(agent.creatorId);
        if (receiver) {
          const current = parseFloat(receiver.totalEarnings || 0);
          await receiver.update({
            totalEarnings: (current + parseFloat(agent.payPerUsePrice)).toFixed(8),
          });
        }
      }
    }

    return res.json({
      success: true,
      executionId: execution.id,
      output,
      durationMs,
      accessVia: access.via,
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    await execution.update({
      status: 'failed',
      errorMessage: error.message,
      durationMs,
    });

    console.error('Agent execution error:', error);
    return res.status(500).json({ error: 'Agent execution failed', details: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/execute/:agentId/history
// Get execution history for an agent (creator only)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:agentId/history', authenticateToken, async (req, res) => {
  const { agentId } = req.params;
  const userId = req.user.userId;

  const agent = await Agent.findByPk(agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  if (agent.creatorId !== userId) {
    return res.status(403).json({ error: 'Only the creator can view execution history' });
  }

  const executions = await Execution.findAll({
    where: { agentId },
    include: [{ model: User, as: 'user', attributes: ['id', 'walletAddress', 'username'] }],
    order: [['createdAt', 'DESC']],
    limit: 50,
  });

  res.json({ success: true, executions });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/execute/my/history
// Get the current user's own execution history
// ─────────────────────────────────────────────────────────────────────────────
router.get('/my/history', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  const executions = await Execution.findAll({
    where: { userId },
    include: [{ model: Agent, as: 'agent', attributes: ['id', 'name', 'category'] }],
    order: [['createdAt', 'DESC']],
    limit: 50,
  });

  res.json({ success: true, executions });
});

module.exports = router;
