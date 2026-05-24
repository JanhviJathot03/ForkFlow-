const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]:', err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({ error: err.message });
  }

  return res.status(500).json({ error: 'Internal server error' });
};

module.exports = errorHandler;
