const { ethers } = require('ethers');

class Web3Service {
  constructor() {
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = null;

    const privateKey = process.env.ETHEREUM_PRIVATE_KEY?.trim();

    if (privateKey && privateKey !== 'your_private_key_for_contract_deployment') {
      const isHexKey = ethers.isHexString(privateKey, 32);

      if (isHexKey) {
        this.signer = new ethers.Wallet(privateKey, this.provider);
      } else {
        console.warn('ETHEREUM_PRIVATE_KEY is not a valid 32-byte hex key. Signer disabled.');
      }
    }
  }

  /**
   * Verify wallet signature
   */
  async verifyWalletSignature(message, signature, walletAddress) {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      console.error('Wallet verification error:', error);
      return false;
    }
  }

  /**
   * Get wallet balance (ETH)
   */
  async getBalance(walletAddress) {
    try {
      const balance = await this.provider.getBalance(walletAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Balance fetch error:', error);
      throw new Error('Failed to fetch balance');
    }
  }

  /**
   * Check if wallet is valid
   */
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  /**
   * Get network info
   */
  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      return {
        name: network.name,
        chainId: network.chainId,
        ensAddress: network.ensAddress,
      };
    } catch (error) {
      console.error('Network info error:', error);
      throw new Error('Failed to fetch network info');
    }
  }
}

module.exports = new Web3Service();
