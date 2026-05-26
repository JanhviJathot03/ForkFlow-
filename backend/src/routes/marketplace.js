const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { Agent, User } = require('../models');

const router = express.Router();

/**
 * GET /api/marketplace
 * Browse agents in marketplace
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 12, 1);
    const category = req.query.category || null;
    const sort = req.query.sort || 'trending';

    const where = { isPublished: true };
    if (category) {
      where.category = category;
    }

    const order =
      sort === 'newest'
        ? [['createdAt', 'DESC']]
        : sort === 'rating'
          ? [['ratings', 'DESC']]
          : [['downloads', 'DESC'], ['ratings', 'DESC']];

    const { rows: agents, count: total } = await Agent.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'walletAddress', 'username', 'avatarUrl'],
        },
      ],
      order,
      limit,
      offset: (page - 1) * limit,
    });

    res.json({
      success: true,
      agents,
      pagination: { page, limit, total },
    });
  } catch (error) {
    console.error('Marketplace error:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace agents' });
  }
});

/**
 * GET /api/marketplace/search
 * Search agents
 */
router.get('/search', async (req, res) => {
  try {
    const { q, category, priceMin = 0, priceMax = 100, rating = 0 } = req.query;

    // Get all published agents
    let results = Agent.findAll({
      where: { isPublished: true },
    });

    // Filter by search query
    if (q) {
      const queryLower = q.toLowerCase();
      results = results.filter(agent =>
        agent.name.toLowerCase().includes(queryLower) ||
        agent.description.toLowerCase().includes(queryLower) ||
        agent.category.toLowerCase().includes(queryLower)
      );
    }

    // Filter by category
    if (category) {
      results = results.filter(agent => agent.category === category);
    }

    // Filter by rating
    if (Number(rating) > 0) {
      results = results.filter(agent => agent.ratings >= Number(rating));
    }

    // Sort by downloads and rating
    results.sort((a, b) => {
      if (b.downloads !== a.downloads) {
        return b.downloads - a.downloads;
      }
      return b.ratings - a.ratings;
    });

    // Add creator info
    results = results.map(agent => {
      const creator = User.findByPk(agent.creatorId);
      if (creator) {
        agent.creator = {
          id: creator.id,
          walletAddress: creator.walletAddress,
          username: creator.username,
          avatarUrl: creator.avatarUrl,
        };
      }
      return agent;
    });

    // Limit results
    results = results.slice(0, 24);

    res.json({
      success: true,
      results,
      query: q,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * GET /api/marketplace/categories
 * Get agent categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categoryNames = [
      { id: 'research', name: 'Research' },
      { id: 'development', name: 'Development' },
      { id: 'content', name: 'Content Creation' },
      { id: 'finance', name: 'Finance' },
      { id: 'social', name: 'Social Media' },
      { id: 'customer-support', name: 'Customer Support' },
    ];

    const counts = categoryNames.map(categoryItem => {
      const agents = Agent.findAll({
        where: { category: categoryItem.id, isPublished: true },
      });
      return {
        ...categoryItem,
        count: agents.length,
      };
    });

    res.json({
      success: true,
      categories: counts,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/marketplace/trending
 * Get trending agents
 */
router.get('/trending', async (req, res) => {
  try {
    const trending = await Agent.findAll({
      where: { isPublished: true },
      order: [['downloads', 'DESC'], ['ratings', 'DESC']],
      limit: 6,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'walletAddress', 'username', 'avatarUrl'],
        },
      ],
    });

    res.json({
      success: true,
      trending,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending agents' });
  }
});

module.exports = router;
