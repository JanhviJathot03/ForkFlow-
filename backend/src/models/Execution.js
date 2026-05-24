const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Execution = sequelize.define('Execution', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  agentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  input: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  output: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('running', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'running',
  },
  durationMs: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tokensUsed: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'executions',
});

module.exports = Execution;
