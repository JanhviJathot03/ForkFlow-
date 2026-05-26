const createModel = require('./modelFactory');

const Subscription = createModel('Subscriptions', {
  id: { type: 'uuid', primaryKey: true },
  userId: { type: 'uuid', required: true },
  agentId: { type: 'uuid', required: true },
  monthlyCost: { type: 'decimal', required: true },
  startDate: { type: 'date', default: () => new Date() },
  endDate: { type: 'date' },
  autoRenew: { type: 'boolean', default: true },
  status: { type: 'enum', values: ['active', 'paused', 'cancelled', 'expired'], default: 'active' },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' },
});

module.exports = Subscription;