"use client";

import { useState } from 'react';
import { useWallet } from '@/lib/wallet-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface WalletConnectButtonProps {
  children?: React.ReactNode;
}

export function WalletConnectButton({ children }: WalletConnectButtonProps) {
  const [open, setOpen] = useState(false);
  const { connect, isConnecting, error } = useWallet();

  const { isInstalled: isCrossmarkAvailable } = useWallet();

  const handleConnect = async () => {
    if (!isCrossmarkAvailable) {
      window.open('https://crossmark.io', '_blank');
      return;
    }

    try {
      await connect();
      setOpen(false);
    } catch (err) {
      // Error handled in context
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="lg" className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-white">
            <span className="text-xl">✖️</span>
            Connect Crossmark
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-2 border-yellow-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl text-gray-900">
            <span className="text-3xl">✖️</span>
            Connect Crossmark Wallet
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            {isCrossmarkAvailable
              ? 'Click the button below to connect your Crossmark wallet to FlowXtate'
              : 'Crossmark extension not detected. Install it to get started.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full h-16 text-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Connecting...
              </>
            ) : isCrossmarkAvailable ? (
              <>
                <span className="text-2xl mr-2">✖️</span>
                Connect Crossmark
              </>
            ) : (
              <>
                <span className="text-2xl mr-2">⬇️</span>
                Download Crossmark
              </>
            )}
          </Button>
        </div>
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-300 p-4 text-sm text-red-800 font-medium">
            {error}
          </div>
        )}
        {!isCrossmarkAvailable && (
          <div className="text-sm text-gray-600 text-center pb-2 bg-yellow-50 p-3 rounded border border-yellow-200">
            After installing Crossmark, refresh this page to connect
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
