const axios = require('axios');

const LOCUS_API_BASE = process.env.LOCUS_API_BASE || 'https://api.locus.app/v1';

function shouldMockPayments() {
  if (process.env.USE_MOCK_PAYMENTS === 'true') {
    return true;
  }

  return process.env.NODE_ENV !== 'production' || !process.env.LOCUS_API_KEY || !process.env.LOCUS_API_SECRET;
}

class LocusPaymentService {
  constructor() {
    this.apiKey = process.env.LOCUS_API_KEY;
    this.apiSecret = process.env.LOCUS_API_SECRET;
    this.mockPayments = shouldMockPayments();
  }

  getFrontendUrl() {
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  getApiUrl() {
    return process.env.API_URL || 'http://localhost:5000';
  }

  buildMockCheckoutUrl(paymentId) {
    return `${this.getFrontendUrl()}/dashboard?mockPaymentId=${paymentId}`;
  }

  buildMockPaymentId() {
    return `mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * Create a payment checkout for agent purchase/rent
   */
  async createCheckout(amount, userWalletAddress, agentId, paymentType = 'purchase') {
    if (this.mockPayments) {
      const paymentId = this.buildMockPaymentId();

      return {
        success: true,
        paymentId,
        checkoutUrl: this.buildMockCheckoutUrl(paymentId),
        amount: Number(amount),
      };
    }

    try {
      const response = await axios.post(
        `${LOCUS_API_BASE}/payments/create`,
        {
          amount: amount.toString(),
          currency: 'ETH', // Can be USDC, DAI, ETH, etc.
          description: `${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} - AI Agent ${agentId}`,
          customerWalletAddress: userWalletAddress,
          metadata: {
            agentId,
            paymentType,
            timestamp: Date.now(),
            environment: process.env.NODE_ENV || 'development',
          },
          returnUrl: `${this.getFrontendUrl()}/dashboard?payment=success`,
          cancelUrl: `${this.getFrontendUrl()}/dashboard?payment=cancelled`,
          webhookUrl: `${this.getApiUrl()}/api/payments/webhook`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'X-API-Secret': this.apiSecret,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        paymentId: response.data.id,
        checkoutUrl: response.data.checkoutUrl,
        amount: response.data.amount,
      };
    } catch (error) {
      console.error('Locus Payment Error:', error.message);
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(paymentId) {
    if (this.mockPayments || String(paymentId).startsWith('mock_')) {
      return {
        success: true,
        paymentId,
        status: 'completed',
        amount: '0',
        metadata: {
          environment: process.env.NODE_ENV || 'development',
          mock: true,
        },
      };
    }

    try {
      const response = await axios.get(
        `${LOCUS_API_BASE}/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'X-API-Secret': this.apiSecret,
          },
        }
      );

      return {
        success: true,
        paymentId: response.data.id,
        status: response.data.status, // completed, pending, failed
        amount: response.data.amount,
        metadata: response.data.metadata,
      };
    } catch (error) {
      console.error('Payment Verification Error:', error.message);
      throw new Error(`Failed to verify payment: ${error.message}`);
    }
  }

  /**
   * Process webhook from Locus payment confirmation
   */
  verifyWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha256', process.env.LOCUS_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }

  /**
   * Schedule creator payout
   */
  async scheduleCreatorPayout(creatorWalletAddress, amount, paymentId) {
    if (this.mockPayments) {
      return {
        success: true,
        payoutId: `mock_payout_${paymentId}`,
        status: 'scheduled',
      };
    }

    try {
      const response = await axios.post(
        `${LOCUS_API_BASE}/payouts/schedule`,
        {
          walletAddress: creatorWalletAddress,
          amount: amount.toString(),
          currency: 'ETH',
          relatedPaymentId: paymentId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'X-API-Secret': this.apiSecret,
          },
        }
      );

      return {
        success: true,
        payoutId: response.data.id,
        status: response.data.status,
      };
    } catch (error) {
      console.error('Payout Schedule Error:', error.message);
      throw new Error(`Failed to schedule payout: ${error.message}`);
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userWalletAddress, limit = 50) {
    if (this.mockPayments) {
      return {
        success: true,
        transactions: [],
        total: 0,
      };
    }

    try {
      const response = await axios.get(
        `${LOCUS_API_BASE}/transactions`,
        {
          params: {
            walletAddress: userWalletAddress,
            limit,
          },
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return {
        success: true,
        transactions: response.data.transactions,
        total: response.data.total,
      };
    } catch (error) {
      console.error('Transaction History Error:', error.message);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
  }
}

module.exports = new LocusPaymentService();
