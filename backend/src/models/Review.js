const createModel = require('./modelFactory');

const Review = createModel('Reviews', {
  id: { type: 'uuid', primaryKey: true },
  agentId: { type: 'uuid', required: true },
  userId: { type: 'uuid', required: true },
  rating: { type: 'integer', required: true, min: 1, max: 5 },
  comment: { type: 'text' },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' },
});

module.exports = Review;
