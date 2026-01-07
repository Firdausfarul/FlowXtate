"use client";

import { useWallet } from '@/lib/wallet-context';
import { WalletConnectButton } from './wallet-connect-button';
import { WalletStatus } from './wallet-status';
import { Building2 } from 'lucide-react';

export function Header() {
  const { isConnected } = useWallet();

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-yellow-300 bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-md">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-transparent">
            FlowXtate
          </div>
        </div>

        <nav className="flex items-center gap-6">
          {isConnected ? (
            <WalletStatus />
          ) : (
            <WalletConnectButton />
          )}
        </nav>
      </div>
    </header>
  );
}
