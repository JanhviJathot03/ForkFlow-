const sequelize = require('../config/database');
const User = require('./User');
const Agent = require('./Agent');
const Payment = require('./Payment');
const Subscription = require('./Subscription');
const Execution = require('./Execution');
const Review = require('./Review');

User.hasMany(Agent, { foreignKey: 'creatorId', as: 'agents' });
Agent.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

Agent.hasMany(Agent, { foreignKey: 'forkedFromId', as: 'forks' });
Agent.belongsTo(Agent, { foreignKey: 'forkedFromId', as: 'originalAgent' });

User.hasMany(Payment, { foreignKey: 'payerId', as: 'sentPayments' });
User.hasMany(Payment, { foreignKey: 'receiverId', as: 'receivedPayments' });
Payment.belongsTo(User, { foreignKey: 'payerId', as: 'payer' });
Payment.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

Agent.hasMany(Payment, { foreignKey: 'agentId', as: 'payments' });
Payment.belongsTo(Agent, { foreignKey: 'agentId', as: 'agent' });

User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Agent.hasMany(Subscription, { foreignKey: 'agentId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Subscription.belongsTo(Agent, { foreignKey: 'agentId', as: 'agent' });

// Executions
User.hasMany(Execution, { foreignKey: 'userId', as: 'executions' });
Agent.hasMany(Execution, { foreignKey: 'agentId', as: 'executions' });
Execution.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Execution.belongsTo(Agent, { foreignKey: 'agentId', as: 'agent' });

// Reviews
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Agent.hasMany(Review, { foreignKey: 'agentId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Review.belongsTo(Agent, { foreignKey: 'agentId', as: 'agent' });

const models = {
  sequelize,
  User,
  Agent,
  Payment,
  Subscription,
  Execution,
  Review,
};

module.exports = models;