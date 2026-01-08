"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Plus, CheckCircle, Clock, XCircle, ExternalLink } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";
import { Client } from "xrpl";
import sdk from '@crossmarkio/sdk';
import Link from "next/link";

interface TrustlineManagerProps {
  kycData: any;
}

interface Property {
  tokenCode: string;
  propertyName: string;
  issuerAddress: string;
  currencyCodeHex?: string;
}

// RLUSD issuer on XRPL
const RLUSD_ISSUER = "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV";

interface UserTrustline {
  tokenCode: string;
  propertyName: string;
  issuerAddress: string;
  status: "pending_auth" | "authorized" | "active";
  balance?: string;
  limit: string;
  createdAt: string;
}

export function TrustlineManager({ kycData }: TrustlineManagerProps) {
  const { account } = useWallet();
  const [properties, setProperties] = useState<Property[]>([]);
  const [userTrustlines, setUserTrustlines] = useState<UserTrustline[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [trustlineLimit, setTrustlineLimit] = useState("1000000");

  useEffect(() => {
    loadProperties();
    loadUserTrustlines();
  }, [account]);

  const loadProperties = () => {
    const storedTokens = localStorage.getItem('issued_tokens');
    const tokenProperties = storedTokens ? JSON.parse(storedTokens) : [];

    // Add RLUSD as an additional trustline option
    const rlusdProperty: Property = {
      tokenCode: "RLUSD",
      propertyName: "Ripple USD",
      issuerAddress: RLUSD_ISSUER,
      currencyCodeHex: "USD",
    };

    setProperties([rlusdProperty, ...tokenProperties]);
  };

  const loadUserTrustlines = () => {
    if (!account) return;

    const storedTrustlines = localStorage.getItem('user_trustlines') || '[]';
    const allTrustlines = JSON.parse(storedTrustlines);
    const userLines = allTrustlines.filter((t: UserTrustline) =>
      t.issuerAddress && account.address
    );
    setUserTrustlines(userLines);
  };

  const createTrustline = async () => {
    if (!account || !selectedProperty) return;

    setLoading(true);

    try {
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      // Convert currency code to hex
      const currencyCode = selectedProperty.currencyCodeHex ||
        Buffer.from(selectedProperty.tokenCode.padEnd(3, '\0')).toString('hex').toUpperCase().padEnd(40, '0');

      const isRLUSD = selectedProperty.tokenCode === "RLUSD";

      // Step 1: User creates trustline via Crossmark
      const trustSetTx: any = {
        TransactionType: 'TrustSet',
        Account: account.address,
        LimitAmount: {
          currency: currencyCode,
          issuer: selectedProperty.issuerAddress,
          value: trustlineLimit,
        },
        Fee: '12',
      };

      // Sign with Crossmark
      const signResponse: any = await sdk.methods.signAndSubmitAndWait({
        TransactionType: trustSetTx.TransactionType,
        Account: trustSetTx.Account,
        LimitAmount: trustSetTx.LimitAmount,
      });

      if (signResponse?.response?.data?.resp?.result?.meta?.TransactionResult !== 'tesSUCCESS') {
        throw new Error('Trustline creation failed');
      }

      // Step 2: Automatically authorize the trustline using issuer wallet (only for property tokens, not RLUSD)
      if (!isRLUSD) {
        // Get token data to access issuer seed
        const storedTokens = localStorage.getItem('issued_tokens') || '[]';
        const tokens = JSON.parse(storedTokens);
        const token = tokens.find((t: any) => t.tokenCode === selectedProperty.tokenCode);

        if (!token) {
          throw new Error('Token not found');
        }

        const { Wallet } = await import('xrpl');
        const issuerWallet = Wallet.fromSeed(token.issuerSeed);

        const authorizeTx: any = {
          TransactionType: 'TrustSet',
          Account: issuerWallet.address,
          LimitAmount: {
            currency: currencyCode,
            issuer: account.address,
            value: '0',
          },
          Flags: 0x00010000, // tfSetfAuth - authorize the trustline
          Fee: '12',
        };

        const prepared = await client.autofill(authorizeTx);
        const signed = issuerWallet.sign(prepared);
        const authResult = await client.submitAndWait(signed.tx_blob);

        console.log('Trustline authorization result:', authResult.result.meta?.TransactionResult);

        if (authResult.result.meta?.TransactionResult !== 'tesSUCCESS') {
          throw new Error('Trustline authorization failed');
        }
      } else {
        console.log('RLUSD trustline created - no authorization needed');
      }

      // Save trustline to localStorage with authorized status
      const newTrustline: UserTrustline = {
        tokenCode: selectedProperty.tokenCode,
        propertyName: selectedProperty.propertyName,
        issuerAddress: selectedProperty.issuerAddress,
        status: "authorized", // Automatically authorized
        limit: trustlineLimit,
        createdAt: new Date().toISOString(),
      };

      const storedTrustlines = localStorage.getItem('user_trustlines') || '[]';
      const allTrustlines = JSON.parse(storedTrustlines);
      allTrustlines.push(newTrustline);
      localStorage.setItem('user_trustlines', JSON.stringify(allTrustlines));

      await client.disconnect();
      loadUserTrustlines();
      setSelectedProperty(null);
      alert('Trustline created and automatically authorized! You can now trade this token.');
    } catch (err: any) {
      console.error('Trustline creation error:', err);
      alert(err.message || 'Failed to create trustline');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "authorized":
      case "active":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Authorized
          </Badge>
        );
      case "pending_auth":
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Pending Auth
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Unknown
          </Badge>
        );
    }
  };

  const availableProperties = properties.filter(p =>
    !userTrustlines.find(t => t.tokenCode === p.tokenCode)
  );

  return (
    <Card className="border-2 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-green-500" />
          Trustline Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Create trustlines to property tokens to enable trading.
          Trustlines are automatically authorized after creation.
        </p>

        {/* Existing Trustlines */}
        {userTrustlines.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">My Trustlines</h4>
            {userTrustlines.map((trustline, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {trustline.propertyName}
                    </span>
                    <Badge className="bg-yellow-500 text-white font-mono text-xs">
                      {trustline.tokenCode}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    Limit: {parseFloat(trustline.limit).toLocaleString()}
                  </p>
                  {trustline.balance && (
                    <p className="text-xs text-gray-500">
                      Balance: {parseFloat(trustline.balance).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(trustline.status)}
                  {(trustline.status === "authorized" || trustline.status === "active") && (
                    <Link href={`/property?code=${trustline.tokenCode}`}>
                      <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Trade
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Trustline */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Add Trustline</h4>

          {availableProperties.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">
                You have trustlines to all available properties.
              </p>
              <Link href="/properties">
                <Button variant="outline" size="sm" className="mt-3">
                  Browse Properties
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {!selectedProperty ? (
                <div className="grid gap-2">
                  {availableProperties.map((property, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedProperty(property)}
                    >
                      <div>
                        <span className="font-semibold text-gray-900">
                          {property.propertyName}
                        </span>
                        <Badge className="bg-yellow-500 text-white font-mono text-xs ml-2">
                          {property.tokenCode}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Creating trustline for:
                    </p>
                    <p className="text-sm text-blue-700">
                      {selectedProperty.propertyName} ({selectedProperty.tokenCode})
                    </p>
                  </div>

                  <div className="mb-3">
                    <label className="text-xs text-blue-900 font-semibold">
                      Trust Limit (max tokens you can hold)
                    </label>
                    <input
                      type="number"
                      value={trustlineLimit}
                      onChange={(e) => setTrustlineLimit(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-blue-300 rounded-md"
                      placeholder="1000000"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProperty(null)}
                      disabled={loading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={createTrustline}
                      disabled={loading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      {loading ? 'Creating...' : 'Create Trustline'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-900 font-semibold mb-1">Automatic Authorization</p>
          <p className="text-xs text-green-700">
            After creating a trustline, it will be automatically authorized.
            You can start trading immediately after the transaction completes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
