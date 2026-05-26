// Seed script - creates dummy users and sample agents
const { User, Agent } = require('../models');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');

    // Clear existing data (optional - comment out to keep data)
    // const { LocalStore } = require('../services/localStorageService');
    // LocalStore.clear();

    // Create User 1: Agent Builder
    const user1Password = await bcrypt.hash('password123', 10);
    const user1 = await User.create({
      email: 'builder@locus.app',
      username: 'AI Builder',
      password: user1Password,
      walletAddress: '0x1234567890123456789012345678901234567890',
      bio: 'Professional AI agent creator',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=builder',
      totalEarnings: 0,
      reputationScore: 0,
    });

    console.log('✓ Created User 1 (Builder)');
    console.log(`  Email: ${user1.email} | Password: password123`);

    // Create User 2: Agent Buyer/Renter
    const user2Password = await bcrypt.hash('password456', 10);
    const user2 = await User.create({
      email: 'buyer@locus.app',
      username: 'Tech Enthusiast',
      password: user2Password,
      walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      bio: 'Looking for awesome AI agents',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=buyer',
      totalEarnings: 0,
      reputationScore: 0,
    });

    console.log('✓ Created User 2 (Buyer)');
    console.log(`  Email: ${user2.email} | Password: password456`);

    // Create sample agents by User 1
    const agent1 = await Agent.create({
      creatorId: user1.id,
      name: 'Research Assistant Pro',
      description: 'Intelligent research agent that gathers and summarizes information from multiple sources. Perfect for academic research, market analysis, and competitive intelligence.',
      category: 'research',
      promptTemplate: 'You are an expert research assistant. Help users gather and organize information about topics they are interested in.',
      features: ['Document Summarization', 'Source Finding', 'Fact Checking', 'Citation Generation'],
      pricingModel: 'subscription',
      monthlyCost: 9.99,
      payPerUsePrice: 0,
      purchasePrice: 0,
      isPublished: true,
      downloads: 0,
      ratings: 0,
      accessType: 'paid',
      apiIntegrations: ['Web Search', 'Database'],
    });

    console.log('✓ Created Agent 1: Research Assistant Pro');

    const agent2 = await Agent.create({
      creatorId: user1.id,
      name: 'Content Writer GPT',
      description: 'Create high-quality content for blogs, social media, and marketing campaigns. Supports multiple tones and styles with AI-powered creativity.',
      category: 'content',
      promptTemplate: 'You are a professional content writer. Create engaging, well-researched content based on user requirements.',
      features: ['Blog Posts', 'Social Media', 'Email Campaigns', 'SEO Optimization'],
      pricingModel: 'pay_per_use',
      monthlyCost: 0,
      payPerUsePrice: 0.99,
      purchasePrice: 0,
      isPublished: true,
      downloads: 0,
      ratings: 0,
      accessType: 'paid',
      apiIntegrations: ['Grammar Check', 'Plagiarism Detection'],
    });

    console.log('✓ Created Agent 2: Content Writer GPT');

    const agent3 = await Agent.create({
      creatorId: user1.id,
      name: 'Code Helper - Free',
      description: 'Free agent to help with coding questions, debugging, and code reviews. Great for learning and quick fixes.',
      category: 'development',
      promptTemplate: 'You are an expert programmer. Help users with their coding questions and provide clean, efficient solutions.',
      features: ['Code Review', 'Debugging', 'Documentation', 'Best Practices'],
      pricingModel: 'purchase',
      monthlyCost: 0,
      payPerUsePrice: 0,
      purchasePrice: 0,
      isPublished: true,
      downloads: 0,
      ratings: 0,
      accessType: 'free',
      apiIntegrations: ['Stack Overflow'],
    });

    console.log('✓ Created Agent 3: Code Helper - Free');

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║ 🎉 Database seeded successfully!                      ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log('║ Dummy Accounts:                                        ║');
    console.log('║ 1. Builder Account:                                    ║');
    console.log('║    Email: builder@locus.app                            ║');
    console.log('║    Password: password123                               ║');
    console.log('║                                                        ║');
    console.log('║ 2. Buyer Account:                                      ║');
    console.log('║    Email: buyer@locus.app                              ║');
    console.log('║    Password: password456                               ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log('║ Sample Agents Created:                                 ║');
    console.log('║ • Research Assistant Pro (Subscription: $9.99/mo)      ║');
    console.log('║ • Content Writer GPT (Pay-per-use: $0.99 each)         ║');
    console.log('║ • Code Helper - Free (Free)                            ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    return { user1, user2, agents: [agent1, agent2, agent3] };
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    throw error;
  }
}

module.exports = seedDatabase;
