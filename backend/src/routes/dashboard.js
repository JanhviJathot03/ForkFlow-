const express = require('express');
const { Op } = require('sequelize');
const { Agent, Payment, Subscription, User } = require('../models');

const router = express.Router();

/**
 * GET /api/dashboard/earnings
 * Get creator earnings summary
 */
router.get('/earnings', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [receivedPayments, subscriptions] = await Promise.all([
      Payment.findAll({
        where: {
          receiverId: userId,
          status: 'completed',
        },
      }),
      Subscription.findAll({
        where: { userId },
      }),
    ]);

    const totalEarnings = receivedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const now = new Date();
    const thisMonth = receivedPayments
      .filter((payment) => new Date(payment.updatedAt).getMonth() === now.getMonth() && new Date(payment.updatedAt).getFullYear() === now.getFullYear())
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const thisWeek = receivedPayments
      .filter((payment) => {
        const updatedAt = new Date(payment.updatedAt);
        const diffInDays = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
        return diffInDays <= 7;
      })
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const thisDay = receivedPayments
      .filter((payment) => new Date(payment.updatedAt).toDateString() === now.toDateString())
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const earnings = {
      totalEarnings: Number(totalEarnings.toFixed(8)),
      thisMonth: Number(thisMonth.toFixed(8)),
      thisWeek: Number(thisWeek.toFixed(8)),
      thisDay: Number(thisDay.toFixed(8)),
      currency: 'ETH',
      activeSubscriptions: subscriptions.length,
    };

    res.json({ success: true, earnings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

/**
 * GET /api/dashboard/agents
 * Get user's agents
 */
router.get('/agents', async (req, res) => {
  try {
    const userId = req.user.userId;

    const agents = await Agent.findAll({
      where: { creatorId: userId },
      order: [['createdAt', 'DESC']],
    });

    const earningsByAgent = await Promise.all(
      agents.map(async (agent) => {
        const payments = await Payment.findAll({
          where: {
            agentId: agent.id,
            receiverId: userId,
            status: 'completed',
          },
        });

        return {
          id: agent.id,
          name: agent.name,
          status: agent.isPublished ? 'published' : 'draft',
          earnings: Number(payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0).toFixed(8)),
          views: agent.downloads,
          executions: payments.length,
        };
      })
    );

    res.json({ success: true, agents: earningsByAgent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

/**
 * GET /api/dashboard/subscriptions
 * Get user's subscriptions
 */
router.get('/subscriptions', async (req, res) => {
  try {
    const userId = req.user.userId;

    const subscriptions = await Subscription.findAll({
      where: { userId },
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const mappedSubscriptions = subscriptions.map((subscription) => ({
      id: subscription.id,
      agentId: subscription.agentId,
      agentName: subscription.agent?.name || 'Unknown Agent',
      monthlyPrice: Number(subscription.monthlyCost),
      nextBillingDate: subscription.endDate || null,
      status: subscription.status,
    }));

    res.json({ success: true, subscriptions: mappedSubscriptions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

/**
 * GET /api/dashboard/analytics
 * Get detailed analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = '30d' } = req.query;

    const agents = await Agent.findAll({ where: { creatorId: userId } });
    const agentIds = agents.map((agent) => agent.id);

    const payments = agentIds.length
      ? await Payment.findAll({
          where: {
            agentId: { [Op.in]: agentIds },
            status: 'completed',
          },
          order: [['updatedAt', 'ASC']],
        })
      : [];

    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const uniqueUsers = new Set(payments.map((payment) => payment.payerId)).size;
    const totalExecutions = payments.length;
    const averageRating = agents.length
      ? agents.reduce((sum, agent) => sum + Number(agent.ratings || 0), 0) / agents.length
      : 0;

    const chartDataMap = new Map();
    payments.forEach((payment) => {
      const dateKey = new Date(payment.updatedAt).toISOString().slice(0, 10);
      const current = chartDataMap.get(dateKey) || { date: dateKey, earnings: 0, executions: 0 };
      current.earnings += Number(payment.amount || 0);
      current.executions += 1;
      chartDataMap.set(dateKey, current);
    });

    const analytics = {
      period,
      totalExecutions,
      uniqueUsers,
      totalRevenue: Number(totalRevenue.toFixed(8)),
      averageRating: Number(averageRating.toFixed(2)),
      chartData: Array.from(chartDataMap.values()),
    };

    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
