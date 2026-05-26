const createModel = require('./modelFactory');

const Agent = createModel('Agents', {
  id: { type: 'uuid', primaryKey: true },
  creatorId: { type: 'uuid', required: true },
  name: { type: 'string', required: true },
  description: { type: 'text', required: true },
  category: { type: 'string', required: true },
  promptTemplate: { type: 'text' },
  apiIntegrations: { type: 'json', default: [] },
  features: { type: 'json', default: [] },
  version: { type: 'string', default: '1.0.0' },
  forkedFromId: { type: 'uuid' },
  pricingModel: { type: 'enum', values: ['purchase', 'subscription', 'pay_per_use'], default: 'purchase' },
  monthlyCost: { type: 'decimal', default: 0 },
  payPerUsePrice: { type: 'decimal', default: 0 },
  purchasePrice: { type: 'decimal', default: 0 },
  isPublished: { type: 'boolean', default: false },
  downloads: { type: 'integer', default: 0 },
  ratings: { type: 'float', default: 0 },
  accessType: { type: 'enum', values: ['free', 'paid'], default: 'paid' },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' },
});

module.exports = Agent;