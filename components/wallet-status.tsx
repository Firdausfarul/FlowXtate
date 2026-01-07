"use client";

import { useWallet } from '@/lib/wallet-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export function WalletStatus() {
  const { account, disconnect, isConnected } = useWallet();
  const [copied, setCopied] = useState(false);

  if (!isConnected || !account) {
    return null;
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (account?.address) {
      await navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 border-yellow-400 hover:border-yellow-500 hover:bg-yellow-50 bg-white">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-yellow-500 text-white text-xs font-semibold">
              {account.address.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline font-mono text-gray-900">{shortenAddress(account.address)}</span>
          <Badge className="ml-2 bg-green-500 text-white hover:bg-green-600 hidden sm:inline-flex border-0">
            Connected
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-white border-yellow-200">
        <DropdownMenuLabel className="flex items-center gap-2 text-gray-900">
          <span className="text-xl">✖️</span>
          Crossmark Wallet
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-yellow-200" />
        <div className="px-2 py-3">
          <div className="text-sm font-medium mb-2 text-gray-900">Wallet Address</div>
          <div className="text-xs text-gray-700 font-mono break-all bg-yellow-50 p-2 rounded border border-yellow-200">
            {account.address}
          </div>
        </div>
        <DropdownMenuSeparator className="bg-yellow-200" />
        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer text-gray-900 hover:bg-yellow-50">
          {copied ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy Address
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={disconnect} className="cursor-pointer text-red-600 hover:bg-red-50 font-medium">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
