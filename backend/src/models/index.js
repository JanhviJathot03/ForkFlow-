const LocalStore = require('../services/localStorageService');
const sequelize = require('../config/database'); // Mock sequelize instance

const User = require('./User');
const Agent = require('./Agent');
const Payment = require('./Payment');
const Subscription = require('./Subscription');
const Execution = require('./Execution');
const Review = require('./Review');

// Mock associations (no actual relationship logic needed for local storage)
// These are kept for API compatibility with existing code
const associations = {
  setupAssociations: () => {
    // Associations are mocked for local storage - relationships handled in business logic
  },
};

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