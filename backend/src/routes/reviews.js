const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { Review, Agent, User, Payment, Subscription } = require('../models');

const router = express.Router();

/**
 * Recalculate and update the agent's average rating.
 */
async function refreshAgentRating(agentId) {
  const reviews = await Review.findAll({ where: { agentId } });
  if (reviews.length === 0) return;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await Agent.update({ ratings: parseFloat(avg.toFixed(2)) }, { where: { id: agentId } });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reviews/:agentId
// List reviews for an agent (public)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const { rows: reviews, count: total } = await Review.findAndCountAll({
      where: { agentId },
      include: [{ model: User, as: 'user', attributes: ['id', 'walletAddress', 'username', 'avatarUrl'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    // Aggregate stats
    const allReviews = await Review.findAll({ where: { agentId } });
    const avgRating = allReviews.length
      ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      : 0;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allReviews.forEach((r) => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });

    res.json({
      success: true,
      reviews,
      pagination: { page, limit, total },
      stats: {
        averageRating: parseFloat(avgRating.toFixed(2)),
        totalReviews: allReviews.length,
        distribution,
      },
    });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reviews/:agentId
// Submit a review (requires purchase or subscription)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:agentId', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const agent = await Agent.findByPk(agentId);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    // Creators can review their own agents (for testing), but in production
    // you'd want to block this. We allow it here.
    const hasPurchase = await Payment.findOne({
      where: { agentId, payerId: userId, status: 'completed' },
    });
    const hasSub = await Subscription.findOne({
      where: { agentId, userId, status: 'active' },
    });
    const isCreator = agent.creatorId === userId;

    if (!hasPurchase && !hasSub && !isCreator) {
      return res.status(403).json({
        error: 'You must purchase or subscribe to this agent before reviewing it.',
      });
    }

    // Upsert: one review per user per agent
    const [review, created] = await Review.findOrCreate({
      where: { agentId, userId },
      defaults: { rating: parseInt(rating, 10), comment: comment || null },
    });

    if (!created) {
      await review.update({ rating: parseInt(rating, 10), comment: comment || null });
    }

    await refreshAgentRating(agentId);

    res.status(created ? 201 : 200).json({
      success: true,
      review,
      message: created ? 'Review submitted' : 'Review updated',
    });
  } catch (error) {
    console.error('Review submit error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/reviews/:agentId
// Delete own review
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:agentId', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params;
    const userId = req.user.userId;

    const review = await Review.findOne({ where: { agentId, userId } });
    if (!review) return res.status(404).json({ error: 'Review not found' });

    await review.destroy();
    await refreshAgentRating(agentId);

    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;
