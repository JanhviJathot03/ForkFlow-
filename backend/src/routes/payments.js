const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const locusPayment = require('../services/locusPayment');
const stripeService = require('../services/stripeService');
const { Payment, Agent, User, Subscription } = require('../models');

const router = express.Router();

function isMockCheckoutEnabled() {
  if (process.env.USE_MOCK_PAYMENTS === 'true') return true;
  return process.env.NODE_ENV !== 'production' || !process.env.LOCUS_API_KEY || !process.env.LOCUS_API_SECRET;
}

function getManualPaymentInstructions() {
  return process.env.PAYMENT_INSTRUCTIONS || 'Contact support for manual payment instructions.';
}

function getManualPaymentReceiver() {
  return process.env.PAYMENT_RECEIVER || 'N/A';
}

/**
 * Grant access after a completed payment (purchase or subscription).
 * For subscriptions, creates/updates a Subscription row.
 * Updates creator totalEarnings.
 */
async function grantAccess(payment) {
  // Update creator earnings
  const receiver = await User.findByPk(payment.receiverId);
  if (receiver) {
    const current = parseFloat(receiver.totalEarnings || 0);
    await receiver.update({ totalEarnings: (current + parseFloat(payment.amount)).toFixed(8) });
  }

  // For subscriptions, create a Subscription record
  if (payment.paymentType === 'subscription') {
    const existing = await Subscription.findOne({
      where: { userId: payment.payerId, agentId: payment.agentId, status: 'active' },
    });
    if (!existing) {
      await Subscription.create({
        userId: payment.payerId,
        agentId: payment.agentId,
        monthlyCost: payment.amount,
        status: 'active',
        autoRenew: false,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }
  }

  // Increment agent downloads counter
  const agent = await Agent.findByPk(payment.agentId);
  if (agent) {
    await agent.update({ downloads: (agent.downloads || 0) + 1 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/stripe/create-session
// Create a Stripe Checkout Session (test mode)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/stripe/create-session', authenticateToken, async (req, res) => {
  try {
    if (!stripeService.isStripeEnabled()) {
      return res.status(400).json({ error: 'Stripe is not configured. Set STRIPE_SECRET_KEY.' });
    }

    const { agentId, paymentType = 'purchase' } = req.body;
    const userId = req.user.userId;

    const agent = await Agent.findByPk(agentId);
    const payer = await User.findByPk(userId);

    if (!agent || !payer) {
      return res.status(404).json({ error: 'Agent or user not found' });
    }

    // Determine amount based on pricing model
    let amount;
    if (paymentType === 'subscription') {
      amount = parseFloat(agent.monthlyCost);
    } else if (paymentType === 'pay_per_use') {
      amount = parseFloat(agent.payPerUsePrice);
    } else {
      amount = parseFloat(agent.purchasePrice);
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Agent has no valid price set' });
    }

    // Create a pending payment record first
    const pendingPayment = await Payment.create({
      payerId: payer.id,
      receiverId: agent.creatorId,
      agentId: agent.id,
      amount,
      paymentType,
      status: 'pending',
      metadata: { stripe: true },
    });

    const { sessionId, checkoutUrl } = await stripeService.createCheckoutSession({
      agentId: agent.id,
      agentName: agent.name,
      amount,
      userId,
      paymentDbId: pendingPayment.id,
    });

    await pendingPayment.update({
      locusPaymentId: sessionId,
      metadata: { stripe: true, sessionId },
    });

    res.json({ success: true, sessionId, checkoutUrl, paymentId: pendingPayment.id });
  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/stripe/verify/:sessionId
// Verify a completed Stripe session and grant access
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stripe/verify/:sessionId', authenticateToken, async (req, res) => {
  try {
    if (!stripeService.isStripeEnabled()) {
      return res.status(400).json({ error: 'Stripe is not configured' });
    }

    const { sessionId } = req.params;
    const session = await stripeService.getSession(sessionId);

    if (session.payment_status !== 'paid') {
      return res.json({ success: false, status: session.payment_status });
    }

    const paymentDbId = session.metadata?.paymentDbId;
    let payment = paymentDbId ? await Payment.findByPk(paymentDbId) : null;

    if (!payment) {
      payment = await Payment.findOne({ where: { locusPaymentId: sessionId } });
    }

    if (payment && payment.status !== 'completed') {
      await payment.update({ status: 'completed' });
      await grantAccess(payment);
    }

    res.json({
      success: true,
      status: 'completed',
      agentId: session.metadata?.agentId,
      paymentId: payment?.id,
    });
  } catch (error) {
    console.error('Stripe verify error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/stripe/webhook
// Stripe webhook — raw body required (mounted before express.json())
// ─────────────────────────────────────────────────────────────────────────────
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripeService.constructWebhookEvent(req.body, sig);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paymentDbId = session.metadata?.paymentDbId;

      let payment = paymentDbId ? await Payment.findByPk(paymentDbId) : null;
      if (!payment) {
        payment = await Payment.findOne({ where: { locusPaymentId: session.id } });
      }

      if (payment && payment.status !== 'completed') {
        await payment.update({ status: 'completed' });
        await grantAccess(payment);
        console.log(`✓ Stripe payment ${session.id} completed for agent ${payment.agentId}`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/initiate
// Legacy Locus checkout (mock or real)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/initiate', authenticateToken, async (req, res) => {
  try {
    const { agentId, amount, paymentType = 'purchase' } = req.body;
    const userWalletAddress = req.user.walletAddress;
    const agent = await Agent.findByPk(agentId);
    const payer = await User.findByPk(req.user.userId);

    if (!agentId || !amount) {
      return res.status(400).json({ error: 'Agent ID and amount required' });
    }

    if (!agent || !payer) {
      return res.status(404).json({ error: 'Agent or user not found' });
    }

    const pendingPayment = await Payment.create({
      payerId: payer.id,
      receiverId: agent.creatorId,
      agentId: agent.id,
      amount,
      paymentType,
      status: 'pending',
      metadata: { walletAddress: userWalletAddress },
    });

    const payment = await locusPayment.createCheckout(amount, userWalletAddress, agentId, paymentType);

    await pendingPayment.update({
      locusPaymentId: payment.paymentId,
      metadata: { ...pendingPayment.metadata, checkoutUrl: payment.checkoutUrl },
    });

    res.json({ success: true, ...payment });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/manual/initiate
// Manual payment — creates pending record, returns instructions
// ─────────────────────────────────────────────────────────────────────────────
router.post('/manual/initiate', authenticateToken, async (req, res) => {
  try {
    const { agentId, amount, paymentType = 'purchase' } = req.body;
    const agent = await Agent.findByPk(agentId);
    const payer = await User.findByPk(req.user.userId);

    if (!agentId || !amount) {
      return res.status(400).json({ error: 'Agent ID and amount required' });
    }

    if (!agent || !payer) {
      return res.status(404).json({ error: 'Agent or user not found' });
    }

    const pendingPayment = await Payment.create({
      payerId: payer.id,
      receiverId: agent.creatorId,
      agentId: agent.id,
      amount,
      paymentType,
      status: 'pending',
      metadata: {
        manual: true,
        instructions: getManualPaymentInstructions(),
        receiver: getManualPaymentReceiver(),
      },
    });

    res.json({
      success: true,
      paymentId: pendingPayment.id,
      status: pendingPayment.status,
      instructions: pendingPayment.metadata.instructions,
      receiver: pendingPayment.metadata.receiver,
    });
  } catch (error) {
    console.error('Manual payment initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate manual payment' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/payments/manual/:id/confirm
// Admin/dev: mark a manual payment as completed and grant access
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/manual/:id/confirm', authenticateToken, async (req, res) => {
  try {
    if (process.env.DEV_ALLOW_MANUAL_CONFIRM !== 'true') {
      return res.status(403).json({ error: 'Manual confirmation disabled' });
    }

    const { id } = req.params;
    const payment = await Payment.findByPk(id);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status === 'completed') {
      return res.json({ success: true, payment });
    }

    await payment.update({
      status: 'completed',
      metadata: {
        ...payment.metadata,
        confirmedBy: req.user.userId,
        confirmedAt: new Date().toISOString(),
      },
    });

    await grantAccess(payment);

    res.json({ success: true, payment });
  } catch (error) {
    console.error('Manual payment confirm error:', error);
    res.status(500).json({ error: 'Failed to confirm manual payment' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/pending
// Admin: list all pending manual payments
// ─────────────────────────────────────────────────────────────────────────────
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    // Simple admin check — in production replace with a real role check
    const requestingUser = await User.findByPk(req.user.userId);
    if (!requestingUser) return res.status(404).json({ error: 'User not found' });

    const pendingPayments = await Payment.findAll({
      where: { status: 'pending' },
      include: [
        { model: Agent, as: 'agent', attributes: ['id', 'name', 'category'] },
        { model: User, as: 'payer', attributes: ['id', 'walletAddress', 'username'] },
        { model: User, as: 'receiver', attributes: ['id', 'walletAddress', 'username'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, payments: pendingPayments });
  } catch (error) {
    console.error('Pending payments fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/:id
// Check payment status — returns full record for checkout page
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const paymentRecord = await Payment.findByPk(id, {
      include: [
        { model: Agent, as: 'agent', attributes: ['id', 'name', 'category', 'pricingModel'] },
        { model: User, as: 'payer', attributes: ['id', 'walletAddress', 'username'] },
      ],
    });

    if (paymentRecord) {
      return res.json({
        success: true,
        paymentId: id,
        status: paymentRecord.status,
        amount: paymentRecord.amount,
        paymentType: paymentRecord.paymentType,
        metadata: paymentRecord.metadata,
        agent: paymentRecord.agent,
        payer: paymentRecord.payer,
        createdAt: paymentRecord.createdAt,
      });
    }

    // Fall back to Locus API for non-DB payments
    const payment = await locusPayment.verifyPayment(id);
    res.json({ success: true, ...payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/webhook
// Locus payment webhook
// ─────────────────────────────────────────────────────────────────────────────
router.post('/webhook', async (req, res) => {
  try {
    const { signature } = req.headers;
    const payload = req.body;

    const isValid = locusPayment.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const { paymentId, status, amount, metadata } = payload;
    const paymentRecord = await Payment.findOne({ where: { locusPaymentId: paymentId } });

    if (status === 'completed') {
      if (paymentRecord) {
        await paymentRecord.update({ status: 'completed' });
        await grantAccess(paymentRecord);
      } else {
        const newPayment = await Payment.create({
          payerId: metadata.userId || metadata.payerId,
          receiverId: metadata.creatorId || metadata.receiverId,
          agentId: metadata.agentId,
          amount,
          paymentType: metadata.paymentType || 'purchase',
          locusPaymentId: paymentId,
          status: 'completed',
          metadata,
        });
        await grantAccess(newPayment);
      }

      console.log(`✓ Locus payment ${paymentId} confirmed for agent ${metadata.agentId}`);

      try {
        await locusPayment.scheduleCreatorPayout(metadata.creatorWalletAddress, amount, paymentId);
      } catch (err) {
        console.error('Payout scheduling error:', err);
      }
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/history/:walletAddress
// User payment history
// ─────────────────────────────────────────────────────────────────────────────
router.get('/history/:walletAddress', authenticateToken, async (req, res) => {
  try {
    const storedPayments = await Payment.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { payerId: req.user.userId },
          { receiverId: req.user.userId },
        ],
      },
      include: [
        { model: Agent, as: 'agent', attributes: ['id', 'name'] },
        { model: User, as: 'receiver', attributes: ['id', 'walletAddress', 'username'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, storedPayments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
