const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { Op } = require('sequelize');
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

    const where = {
      isPublished: true,
      [Op.and]: [],
    };

    const priceConditions = [];
    if (priceMin !== undefined && priceMin !== null) {
      priceConditions.push({ purchasePrice: { [Op.gte]: Number(priceMin) } });
    }
    if (priceMax !== undefined && priceMax !== null) {
      priceConditions.push({ purchasePrice: { [Op.lte]: Number(priceMax) } });
    }

    if (priceConditions.length > 0) {
      where[Op.and].push(...priceConditions);
    }

    if (q) {
      where[Op.and].push({
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } },
          { category: { [Op.iLike]: `%${q}%` } },
        ],
      });
    }

    if (category) {
      where.category = category;
    }

    if (Number(rating) > 0) {
      where.ratings = { [Op.gte]: Number(rating) };
    }

    if (where[Op.and].length === 0) {
      delete where[Op.and];
    }

    const results = await Agent.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'walletAddress', 'username', 'avatarUrl'],
        },
      ],
      order: [['downloads', 'DESC'], ['ratings', 'DESC']],
      limit: 24,
    });

    res.json({
      success: true,
      results,
      query: q,
    });
  } catch (error) {
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

    const counts = await Promise.all(
      categoryNames.map(async (categoryItem) => ({
        ...categoryItem,
        count: await Agent.count({
          where: { category: categoryItem.id, isPublished: true },
        }),
      }))
    );

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
