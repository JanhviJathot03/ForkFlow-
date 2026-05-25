const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { Agent, User, Payment, Subscription, Execution, Review } = require('../models');

const router = express.Router();

/**
 * GET /api/agents
 * List all agents (paginated)
 */
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const category = req.query.category || null;

    const where = {};
    if (category) {
      where.category = category;
    }

    const { rows: agents, count: total } = await Agent.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'walletAddress', 'username', 'email'] }],
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      agents,
      pagination: { page, limit, total },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

/**
 * GET /api/agents/:id
 * Get agent details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findByPk(id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'walletAddress', 'username', 'email'] }],
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ success: true, agent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

/**
 * POST /api/agents
 * Create new agent (requires auth)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, category, promptTemplate, features, pricingModel, price } = req.body;
    const userId = req.user.userId;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description required' });
    }

    const normalizedPricingModel = pricingModel || 'purchase';
    const parsedPrice = Number.isFinite(Number(price)) ? Number(price) : 0;
    const priceFields = {
      monthlyCost: normalizedPricingModel === 'subscription' ? parsedPrice : 0,
      payPerUsePrice: normalizedPricingModel === 'pay_per_use' ? parsedPrice : 0,
      purchasePrice: normalizedPricingModel === 'purchase' ? parsedPrice : 0,
    };

    const newAgent = await Agent.create({
      name,
      description,
      category: category || 'research',
      promptTemplate,
      features: Array.isArray(features) ? features : [],
      creatorId: userId,
      pricingModel: normalizedPricingModel,
      ...priceFields,
      isPublished: true,
    });

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      agent: newAgent,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

/**
 * PUT /api/agents/:id
 * Update agent (requires auth)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, features } = req.body;
    const userId = req.user.userId;

    const agent = await Agent.findByPk(id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    if (agent.creatorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this agent' });
    }

    await agent.update({
      name: name ?? agent.name,
      description: description ?? agent.description,
      features: features ?? agent.features,
    });

    res.json({ success: true, message: 'Agent updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

/**
 * DELETE /api/agents/:id
 * Delete agent (requires auth)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const agent = await Agent.findByPk(id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    if (agent.creatorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this agent' });
    }

    await agent.destroy();

    res.json({ success: true, message: 'Agent deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

/**
 * POST /api/agents/:id/fork
 * Fork an agent
 */
router.post('/:id/fork', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, description } = req.body;

    const sourceAgent = await Agent.findByPk(id);

    if (!sourceAgent) {
      return res.status(404).json({ error: 'Original agent not found' });
    }

    const forkedAgent = await Agent.create({
      name: name || `${sourceAgent.name} Fork`,
      description: description || sourceAgent.description,
      category: sourceAgent.category,
      promptTemplate: sourceAgent.promptTemplate,
      features: sourceAgent.features,
      creatorId: userId,
      forkedFromId: sourceAgent.id,
      pricingModel: sourceAgent.pricingModel,
      monthlyCost: sourceAgent.monthlyCost,
      payPerUsePrice: sourceAgent.payPerUsePrice,
      purchasePrice: sourceAgent.purchasePrice,
      isPublished: false,
    });

    res.status(201).json({
      success: true,
      message: 'Agent forked successfully',
      agent: forkedAgent,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fork agent' });
  }
});

/**
 * PATCH /api/agents/:id/publish
 * Publish or unpublish an agent
 */
router.patch('/:id/publish', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;
    const userId = req.user.userId;

    const agent = await Agent.findByPk(id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    if (agent.creatorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to publish this agent' });
    }

    const nextPublished = typeof isPublished === 'boolean' ? isPublished : !agent.isPublished;

    await agent.update({ isPublished: nextPublished });

    res.json({
      success: true,
      message: nextPublished ? 'Agent published' : 'Agent unpublished',
      agent,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update publish status' });
  }
});

/**
 * GET /api/agents/:id/stats
 * Get real agent analytics
 */
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const agent = await Agent.findByPk(id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    if (agent.creatorId !== userId) {
      return res.status(403).json({ error: 'Only the creator can view stats' });
    }

    const [completedPayments, executions, reviews] = await Promise.all([
      Payment.findAll({ where: { agentId: id, status: 'completed' } }),
      Execution.findAll({ where: { agentId: id } }),
      Review.findAll({ where: { agentId: id } }),
    ]);

    const totalEarnings = completedPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const avgRating = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
    const lastExecution = executions.length
      ? executions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
      : null;

    res.json({
      success: true,
      stats: {
        agentId: agent.id,
        totalExecutions: executions.length,
        completedExecutions: executions.filter((e) => e.status === 'completed').length,
        failedExecutions: executions.filter((e) => e.status === 'failed').length,
        totalEarnings: parseFloat(totalEarnings.toFixed(8)),
        averageRating: parseFloat(avgRating.toFixed(2)),
        totalReviews: reviews.length,
        totalDownloads: agent.downloads,
        lastExecuted: lastExecution?.createdAt || null,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/agents/:id/access
 * Check if the current user has access to an agent
 */
router.get('/:id/access', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const agent = await Agent.findByPk(id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const completedPayment = await Payment.findOne({
      where: {
        agentId: id,
        payerId: userId,
        status: 'completed',
      },
    });

    const activeSubscription = await Subscription.findOne({
      where: {
        agentId: id,
        userId,
        status: 'active',
      },
    });

    res.json({
      success: true,
      hasAccess: Boolean(completedPayment || activeSubscription),
      via: completedPayment ? 'purchase' : activeSubscription ? 'subscription' : null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check access' });
  }
});

module.exports = router;
