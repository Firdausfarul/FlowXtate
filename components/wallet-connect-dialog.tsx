"use client";

import { useState } from 'react';
import { useWallet } from '@/lib/wallet-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Loader2 } from 'lucide-react';

interface WalletConnectDialogProps {
  children?: React.ReactNode;
}

export function WalletConnectDialog({ children }: WalletConnectDialogProps) {
  const [open, setOpen] = useState(false);
  const { connect, isConnecting, error } = useWallet();

  const handleConnect = async (walletType: 'xaman' | 'crossmark' | 'testnet') => {
    try {
      await connect(walletType);
      setOpen(false);
    } catch (err) {
      // Error is handled in context
    }
  };

  const wallets = [
    {
      id: 'xaman' as const,
      name: 'Xaman',
      description: 'Connect with Xaman wallet',
      icon: '🦎',
      available: typeof window !== 'undefined' && !!(window as any).xaman,
    },
    {
      id: 'crossmark' as const,
      name: 'Crossmark',
      description: 'Connect with Crossmark wallet',
      icon: '✖️',
      available: typeof window !== 'undefined' && !!(window as any).crossmark,
    },
    {
      id: 'testnet' as const,
      name: 'Testnet Wallet',
      description: 'Create a new testnet wallet (for testing)',
      icon: '🧪',
      available: true,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="lg" className="gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Your Wallet</DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to FlowXtate
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {wallets.map((wallet) => (
            <Card
              key={wallet.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                !wallet.available && 'opacity-50'
              }`}
              onClick={() => wallet.available && handleConnect(wallet.id)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="text-3xl">{wallet.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold">{wallet.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {wallet.available
                      ? wallet.description
                      : 'Not installed'}
                  </p>
                </div>
                {isConnecting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
