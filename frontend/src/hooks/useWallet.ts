import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

type EthereumProvider = NonNullable<Window['ethereum']>;

export const useWallet = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [signer, setSigner] = useState<any>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    try {
      const ethereum = window.ethereum as EthereumProvider | undefined;

      if (!ethereum) {
        throw new Error('MetaMask not installed');
      }

      const accounts = (await ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      const provider = new ethers.BrowserProvider(ethereum as any);
      const signer = await provider.getSigner();
      const balance = await provider.getBalance(accounts[0]);

      setWallet({
        address: accounts[0],
        provider,
      });

      setSigner(signer);
      setBalance(ethers.formatEther(balance));
      setIsConnected(true);

      return accounts[0];
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const signMessage = async (message: string) => {
    try {
      if (!signer) throw new Error('Signer not initialized');

      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
    setSigner(null);
    setBalance('0');
    setIsConnected(false);
  };

  useEffect(() => {
    const handleAccountsChanged = (accounts: any) => {
      if (accounts.length === 0) {
        disconnectWallet();
      }
    };

    const ethereum = window.ethereum as EthereumProvider | undefined;

    if (ethereum) {
      ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  return {
    wallet,
    signer,
    balance,
    isConnected,
    connectWallet,
    signMessage,
    disconnectWallet,
  };
};
