"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Client, Wallet as XRPLWallet } from 'xrpl';

export interface WalletAccount {
  address: string;
  publicKey?: string;
}

interface WalletContextType {
  account: WalletAccount | null;
  isConnected: boolean;
  isConnecting: boolean;
  client: Client | null;
  connect: (walletType: 'xaman' | 'crossmark' | 'testnet') => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize XRPL client
  useEffect(() => {
    const initClient = async () => {
      try {
        const xrplClient = new Client('wss://s.altnet.rippletest.net:51233'); // Testnet
        await xrplClient.connect();
        setClient(xrplClient);
      } catch (err) {
        console.error('Failed to connect to XRPL:', err);
        setError('Failed to connect to XRPL network');
      }
    };

    initClient();

    return () => {
      if (client?.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  const connectXaman = useCallback(async () => {
    try {
      setError(null);
      // Check if Xaman extension is available
      if (typeof window !== 'undefined' && (window as any).xaman) {
        const xaman = (window as any).xaman;
        const accounts = await xaman.request({ method: 'xrpl_getAccounts' });

        if (accounts && accounts.length > 0) {
          setAccount({
            address: accounts[0].address,
            publicKey: accounts[0].publicKey,
          });
        }
      } else {
        throw new Error('Xaman wallet not found. Please install Xaman extension.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Xaman wallet');
      throw err;
    }
  }, []);

  const connectCrossmark = useCallback(async () => {
    try {
      setError(null);
      // Check if Crossmark extension is available
      if (typeof window !== 'undefined' && (window as any).crossmark) {
        const crossmark = (window as any).crossmark;
        const response = await crossmark.signInAndWait();

        if (response && response.response && response.response.data) {
          setAccount({
            address: response.response.data.address,
            publicKey: response.response.data.publicKey,
          });
        }
      } else {
        throw new Error('Crossmark wallet not found. Please install Crossmark extension.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Crossmark wallet');
      throw err;
    }
  }, []);

  const connectTestnet = useCallback(async () => {
    try {
      setError(null);
      if (!client) {
        throw new Error('XRPL client not initialized');
      }

      // For hackathon/testing: create a testnet wallet
      const wallet = XRPLWallet.generate();

      // Fund the wallet on testnet
      await client.fundWallet(wallet);

      setAccount({
        address: wallet.address,
        publicKey: wallet.publicKey,
      });

      // Store wallet seed in localStorage for demo purposes
      if (typeof window !== 'undefined') {
        localStorage.setItem('xrpl_testnet_seed', wallet.seed || '');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create testnet wallet');
      throw err;
    }
  }, [client]);

  const connect = useCallback(async (walletType: 'xaman' | 'crossmark' | 'testnet') => {
    setIsConnecting(true);
    setError(null);

    try {
      switch (walletType) {
        case 'xaman':
          await connectXaman();
          break;
        case 'crossmark':
          await connectCrossmark();
          break;
        case 'testnet':
          await connectTestnet();
          break;
      }
    } catch (err) {
      console.error('Connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [connectXaman, connectCrossmark, connectTestnet]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setError(null);

    // Clear testnet wallet from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('xrpl_testnet_seed');
    }
  }, []);

  // Try to restore testnet wallet on mount
  useEffect(() => {
    const restoreTestnetWallet = async () => {
      if (typeof window !== 'undefined') {
        const seed = localStorage.getItem('xrpl_testnet_seed');
        if (seed && client) {
          try {
            const wallet = XRPLWallet.fromSeed(seed);
            setAccount({
              address: wallet.address,
              publicKey: wallet.publicKey,
            });
          } catch (err) {
            console.error('Failed to restore wallet:', err);
            localStorage.removeItem('xrpl_testnet_seed');
          }
        }
      }
    };

    if (client) {
      restoreTestnetWallet();
    }
  }, [client]);

  const value: WalletContextType = {
    account,
    isConnected: !!account,
    isConnecting,
    client,
    connect,
    disconnect,
    error,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
