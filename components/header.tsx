"use client";

import { useWallet } from '@/lib/wallet-context';
import { WalletConnectDialog } from './wallet-connect-dialog';
import { WalletStatus } from './wallet-status';

export function Header() {
  const { isConnected } = useWallet();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-400 bg-clip-text text-transparent">
            FlowXtate
          </div>
        </div>

        <nav className="flex items-center gap-6">
          {isConnected ? (
            <WalletStatus />
          ) : (
            <WalletConnectDialog />
          )}
        </nav>
      </div>
    </header>
  );
}
