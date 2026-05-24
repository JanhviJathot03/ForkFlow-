require('dotenv').config();

const db = require('../models');

async function seed() {
  try {
    await db.sequelize.authenticate();
    await db.sequelize.sync({ force: true });

    const user = await db.User.create({
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      email: 'creator@locus.dev',
      username: 'locus_creator',
      avatarUrl: '/avatars/creator.png',
      bio: 'Creator of premium AI agents',
      totalEarnings: 12.5,
      reputationScore: 4.9,
    });

    const buyer = await db.User.create({
      walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      email: 'buyer@locus.dev',
      username: 'agent_buyer',
    });

    const researchAgent = await db.Agent.create({
      creatorId: user.id,
      name: 'AI Research Agent',
      description: 'Summarizes crypto news and creates reports',
      category: 'research',
      promptTemplate: 'You are a crypto research assistant.',
      apiIntegrations: ['ollama', 'public-market-data'],
      features: ['Real-time data', 'PDF reports', 'Email alerts'],
      version: '1.0.0',
      pricingModel: 'purchase',
      purchasePrice: 0.05,
      isPublished: true,
      downloads: 234,
      ratings: 4.8,
    });

    const codingAgent = await db.Agent.create({
      creatorId: user.id,
      name: 'Coding Assistant',
      description: 'Generates and fixes React code',
      category: 'development',
      promptTemplate: 'You are a senior frontend engineer.',
      apiIntegrations: ['ollama', 'github'],
      features: ['Code generation', 'Bug fixes', 'Architecture help'],
      version: '1.0.0',
      pricingModel: 'subscription',
      monthlyCost: 0.02,
      isPublished: true,
      downloads: 567,
      ratings: 4.9,
    });

    await db.Payment.bulkCreate([
      {
        payerId: buyer.id,
        receiverId: user.id,
        agentId: researchAgent.id,
        amount: 0.05,
        paymentType: 'purchase',
        status: 'completed',
        locusPaymentId: 'demo-payment-1',
        metadata: { demo: true },
      },
      {
        payerId: buyer.id,
        receiverId: user.id,
        agentId: codingAgent.id,
        amount: 0.02,
        paymentType: 'subscription',
        status: 'completed',
        locusPaymentId: 'demo-payment-2',
        metadata: { demo: true },
      },
    ]);

    await db.Subscription.create({
      userId: buyer.id,
      agentId: codingAgent.id,
      monthlyCost: 0.02,
      status: 'active',
      autoRenew: true,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();