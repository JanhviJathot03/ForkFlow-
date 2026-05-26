const createModel = require('./modelFactory');

const Execution = createModel('Executions', {
  id: { type: 'uuid', primaryKey: true },
  agentId: { type: 'uuid', required: true },
  userId: { type: 'uuid', required: true },
  input: { type: 'text', required: true },
  output: { type: 'text' },
  status: { type: 'enum', values: ['running', 'completed', 'failed'], default: 'running' },
  durationMs: { type: 'integer' },
  tokensUsed: { type: 'integer' },
  errorMessage: { type: 'text' },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' },
});

module.exports = Execution;
