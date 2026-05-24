const express = require('express');
const { generateToken } = require('../utils/auth');
const web3Service = require('../services/web3Service');
const { User } = require('../models');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register or login with wallet
 */
router.post('/register', async (req, res) => {
  try {
    const { walletAddress, email, username, signature, message } = req.body;
    const normalizedWalletAddress = walletAddress?.toLowerCase();

    if (!normalizedWalletAddress || !web3Service.isValidAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const allowInsecureLogin = process.env.DEV_ALLOW_INSECURE_LOGIN === 'true';

    if (!allowInsecureLogin) {
      const isValid = await web3Service.verifyWalletSignature(message, signature, walletAddress);
      if (!isValid) return res.status(401).json({ error: 'Invalid signature' });
    }

    const [user] = await User.findOrCreate({
      where: { walletAddress: normalizedWalletAddress },
      defaults: {
        walletAddress: normalizedWalletAddress,
        email: email || null,
        username: username || null,
      },
    });

    if (email || username) {
      await user.update({
        email: email ?? user.email,
        username: username ?? user.username,
      });
    }

    const userId = user.id;
    const token = generateToken(userId, walletAddress);

    res.json({
      success: true,
      token,
      user: {
        id: userId,
        walletAddress: user.walletAddress,
        email: user.email,
        username: user.username,
        devLogin: allowInsecureLogin,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * POST /api/auth/verify-wallet
 * Verify wallet ownership with signature
 */
router.post('/verify-wallet', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;
    const normalizedWalletAddress = walletAddress?.toLowerCase();

    const isValid = await web3Service.verifyWalletSignature(message, signature, walletAddress);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const [user] = await User.findOrCreate({
      where: { walletAddress: normalizedWalletAddress },
      defaults: { walletAddress: normalizedWalletAddress },
    });

    const token = generateToken(user.id, walletAddress);

    res.json({
      success: true,
      token,
      walletAddress: user.walletAddress,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Wallet verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * GET /api/auth/balance/:walletAddress
 * Get wallet balance
 */
router.get('/balance/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!web3Service.isValidAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const balance = await web3Service.getBalance(walletAddress);

    res.json({
      success: true,
      walletAddress,
      balance,
      currency: 'ETH',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

module.exports = router;
