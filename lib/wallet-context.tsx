"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import sdk from '@crossmarkio/sdk';

export interface WalletAccount {
  address: string;
  publicKey?: string;
}

interface WalletContextType {
  account: WalletAccount | null;
  isConnected: boolean;
  isConnecting: boolean;
  isInstalled: boolean | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if Crossmark is installed
  useEffect(() => {
    const checkInstallation = async () => {
      try {
        const detected = await sdk.methods.detect(3000);
        setIsInstalled(detected);
      } catch (error) {
        console.log('Crossmark detection timed out');
        setIsInstalled(false);
      }
    };

    checkInstallation();
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // First detect Crossmark
      const detected = await sdk.methods.detect(5000);

      if (!detected) {
        throw new Error('Crossmark wallet is not installed. Please install it from https://crossmark.io');
      }

      // Use SDK's signInAndWait method
      const response: any = await sdk.methods.signInAndWait();

      if (response?.response?.data?.address) {
        const { address, publicKey } = response.response.data;

        setAccount({
          address,
          publicKey,
        });

        // Save to localStorage
        localStorage.setItem('crossmark_address', address);
      } else {
        throw new Error('Failed to connect to Crossmark wallet');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect to Crossmark wallet';
      setError(errorMessage);
      console.error('Crossmark connection error:', err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setError(null);
    localStorage.removeItem('crossmark_address');
  }, []);

  const value: WalletContextType = {
    account,
    isConnected: !!account,
    isConnecting,
    isInstalled,
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
