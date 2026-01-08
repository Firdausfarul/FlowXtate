"use client";

import { useWallet } from '@/lib/wallet-context';
import { WalletConnectButton } from './wallet-connect-button';
import { WalletStatus } from './wallet-status';
import { Building2, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export function Header() {
  const { isConnected } = useWallet();

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-yellow-300 bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-md">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-transparent">
              FlowXtate
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-4">
          <Link href="/properties">
            <Button variant="ghost" size="sm" className="text-gray-700 hover:text-yellow-600 hover:bg-yellow-50">
              Properties
            </Button>
          </Link>
          {isConnected && (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-700 hover:text-yellow-600 hover:bg-yellow-50">
                  <User className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="sm" className="border-yellow-400 hover:bg-yellow-50">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            </>
          )}
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
