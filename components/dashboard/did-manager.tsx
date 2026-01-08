"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Fingerprint, CheckCircle, AlertCircle } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";
import { Client } from "xrpl";
import sdk from '@crossmarkio/sdk';

interface DIDManagerProps {
  kycData: any;
  onUpdate: () => void;
}

export function DIDManager({ kycData, onUpdate }: DIDManagerProps) {
  const { account } = useWallet();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const createDID = async () => {
    if (!account) return;

    setCreating(true);
    setError("");

    try {
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      // Create DID document URI
      // Format: did:xrpl:<network>:<address>
      const didDocument = `did:xrpl:testnet:${account.address}`;

      // Create short DID identifier (max 256 bytes for DIDDocument field)
      const shortDID = `FlowXtate-${account.address.substring(0, 8)}`;

      // Create DIDSet transaction to register DID on-chain
      const didSetTx: any = {
        TransactionType: 'DIDSet',
        Account: account.address,
        DIDDocument: Buffer.from(shortDID).toString('hex').toUpperCase(),
        URI: Buffer.from(`https://flowxtate.com/did/${account.address}`).toString('hex').toUpperCase(),
        Fee: '12',
      };

      // Sign with Crossmark
      const signResponse: any = await sdk.methods.signAndSubmitAndWait({
        TransactionType: didSetTx.TransactionType,
        Account: didSetTx.Account,
        DIDDocument: didSetTx.DIDDocument,
        URI: didSetTx.URI,
      });

      if (signResponse?.response?.data?.resp?.result?.meta?.TransactionResult !== 'tesSUCCESS') {
        throw new Error('DID creation failed');
      }

      // Update KYC data with DID
      const storedKYC = localStorage.getItem('kyc_submissions') || '[]';
      const allKYC = JSON.parse(storedKYC);
      const updatedKYC = allKYC.map((k: any) =>
        k.address === account.address
          ? { ...k, didDocument, didCreatedAt: new Date().toISOString() }
          : k
      );

      // If no KYC exists, create one
      if (!updatedKYC.find((k: any) => k.address === account.address)) {
        updatedKYC.push({
          address: account.address,
          status: "not_started",
          didDocument,
          didCreatedAt: new Date().toISOString()
        });
      }

      localStorage.setItem('kyc_submissions', JSON.stringify(updatedKYC));

      await client.disconnect();
      onUpdate();
      alert('DID created successfully on XRPL!');
    } catch (err: any) {
      console.error('DID creation error:', err);
      setError(err.message || 'Failed to create DID');
    } finally {
      setCreating(false);
    }
  };

  const deleteDID = async () => {
    if (!account) return;
    if (!confirm('Are you sure you want to delete your DID? This cannot be undone.')) return;

    setCreating(true);
    setError("");

    try {
      // Delete DID by sending empty DIDSet transaction
      const didDeleteTx: any = {
        TransactionType: 'DIDSet',
        Account: account.address,
        Fee: '12',
      };

      const signResponse: any = await sdk.methods.signAndSubmitAndWait({
        TransactionType: didDeleteTx.TransactionType,
        Account: didDeleteTx.Account,
      });

      if (signResponse?.response?.data?.resp?.result?.meta?.TransactionResult !== 'tesSUCCESS') {
        throw new Error('DID deletion failed');
      }

      // Update localStorage
      const storedKYC = localStorage.getItem('kyc_submissions') || '[]';
      const allKYC = JSON.parse(storedKYC);
      const updatedKYC = allKYC.map((k: any) =>
        k.address === account.address
          ? { ...k, didDocument: undefined, didCreatedAt: undefined }
          : k
      );

      localStorage.setItem('kyc_submissions', JSON.stringify(updatedKYC));
      onUpdate();
      alert('DID deleted successfully');
    } catch (err: any) {
      console.error('DID deletion error:', err);
      setError(err.message || 'Failed to delete DID');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-purple-500" />
          Decentralized Identity (DID)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          DID is your unique, decentralized identity on the XRP Ledger.
          It's required for KYC compliance and enables secure, verifiable credentials.
        </p>

        {kycData?.didDocument ? (
          <div className="space-y-3">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-purple-900 mb-1">
                    DID Active
                  </p>
                  <p className="text-xs text-purple-700 font-mono break-all">
                    {kycData.didDocument}
                  </p>
                </div>
              </div>
              {kycData.didCreatedAt && (
                <p className="text-xs text-purple-600 mt-2">
                  Created: {new Date(kycData.didCreatedAt).toLocaleString()}
                </p>
              )}
            </div>

            <Button
              onClick={deleteDID}
              disabled={creating}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Delete DID
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                No DID found. Create one to enable KYC verification and trustline management.
              </p>
            </div>

            <Button
              onClick={createDID}
              disabled={creating}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Fingerprint className="h-4 w-4 mr-2" />
              {creating ? 'Creating DID...' : 'Create DID on XRPL'}
            </Button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900 font-semibold mb-1">What is DID?</p>
          <p className="text-xs text-blue-700">
            Decentralized Identifiers (DIDs) are a W3C standard for self-sovereign identity.
            Your DID is stored on the XRPL blockchain, giving you full control over your identity
            without relying on centralized authorities.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
