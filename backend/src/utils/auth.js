const jwt = require('jsonwebtoken');

const generateToken = (userId, walletAddress) => {
  return jwt.sign(
    { userId, walletAddress },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
