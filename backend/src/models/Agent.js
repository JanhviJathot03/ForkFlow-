const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Agent = sequelize.define('Agent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  promptTemplate: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  apiIntegrations: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  features: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  version: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1.0.0',
  },
  forkedFromId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  pricingModel: {
    type: DataTypes.ENUM('purchase', 'subscription', 'pay_per_use'),
    allowNull: false,
    defaultValue: 'purchase',
  },
  monthlyCost: {
    type: DataTypes.DECIMAL(18, 8),
    allowNull: false,
    defaultValue: 0,
  },
  payPerUsePrice: {
    type: DataTypes.DECIMAL(18, 8),
    allowNull: false,
    defaultValue: 0,
  },
  purchasePrice: {
    type: DataTypes.DECIMAL(18, 8),
    allowNull: false,
    defaultValue: 0,
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  downloads: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  ratings: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  accessType: {
    type: DataTypes.ENUM('free', 'paid'),
    allowNull: false,
    defaultValue: 'paid',
  },
}, {
  tableName: 'agents',
});

module.exports = Agent;