const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  agentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  monthlyCost: {
    type: DataTypes.DECIMAL(18, 8),
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  autoRenew: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'cancelled', 'expired'),
    allowNull: false,
    defaultValue: 'active',
  },
}, {
  tableName: 'subscriptions',
});

module.exports = Subscription;