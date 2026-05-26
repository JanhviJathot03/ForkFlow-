const createModel = require('./modelFactory');

const User = createModel('Users', {
  id: { type: 'uuid', primaryKey: true },
  walletAddress: { type: 'string', unique: true, required: true },
  email: { type: 'string', unique: true },
  username: { type: 'string' },
  password: { type: 'string' },
  avatarUrl: { type: 'string' },
  bio: { type: 'text' },
  totalEarnings: { type: 'decimal', default: 0 },
  reputationScore: { type: 'float', default: 0 },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' },
});

module.exports = User;