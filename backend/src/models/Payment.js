const createModel = require('./modelFactory');

const Payment = createModel('Payments', {
  id: { type: 'uuid', primaryKey: true },
  payerId: { type: 'uuid', required: true },
  receiverId: { type: 'uuid', required: true },
  agentId: { type: 'uuid', required: true },
  amount: { type: 'decimal', required: true },
  paymentType: { type: 'enum', values: ['purchase', 'subscription', 'pay_per_use', 'fork_royalty', 'rental'], required: true },
  rentalDays: { type: 'integer' },
  transactionHash: { type: 'string', unique: true },
  locusPaymentId: { type: 'string', unique: true },
  status: { type: 'enum', values: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  metadata: { type: 'json', default: {} },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' },
});

module.exports = Payment;