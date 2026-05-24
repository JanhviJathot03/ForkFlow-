const Stripe = require('stripe');

let stripe = null;

function getStripe() {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' });
  }
  return stripe;
}

function isStripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Create a Stripe Checkout Session for an agent purchase.
 * Returns { sessionId, checkoutUrl }
 */
async function createCheckoutSession({ agentId, agentName, amount, currency = 'usd', userId, paymentDbId }) {
  const s = getStripe();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  // amount is in ETH/USD as a float — convert to cents for Stripe
  const unitAmount = Math.round(Number(amount) * 100);

  const session = await s.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: agentName,
            description: `Access to AI Agent: ${agentName}`,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      agentId,
      userId,
      paymentDbId,
    },
    success_url: `${frontendUrl}/marketplace/${agentId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/marketplace/${agentId}?payment=cancelled`,
  });

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  };
}

/**
 * Retrieve a completed Checkout Session
 */
async function getSession(sessionId) {
  const s = getStripe();
  return s.checkout.sessions.retrieve(sessionId);
}

/**
 * Construct and verify a Stripe webhook event
 */
function constructWebhookEvent(rawBody, signature) {
  const s = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  return s.webhooks.constructEvent(rawBody, signature, secret);
}

module.exports = {
  isStripeEnabled,
  createCheckoutSession,
  getSession,
  constructWebhookEvent,
};
