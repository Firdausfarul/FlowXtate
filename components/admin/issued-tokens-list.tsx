"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, CheckCircle2, Lock, Ban, Settings } from "lucide-react";
import Link from "next/link";

interface IssuedToken {
  propertyName: string;
  location: string;
  tokenCode: string;
  totalSupply: string;
  totalValuation: string;
  dailyYield: string;
  issuerAddress: string;
  issuerSeed: string;
  distributionAddress?: string;
  distributionSeed?: string;
  pricePerToken?: string;
  dexOfferTxHash?: string;
  createdAt: string;
  clawbackEnabled: boolean;
  freezeEnabled: boolean;
}

export function IssuedTokensList() {
  const [tokens, setTokens] = useState<IssuedToken[]>([]);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    // Load tokens from localStorage
    const storedTokens = localStorage.getItem('issued_tokens');
    if (storedTokens) {
      setTokens(JSON.parse(storedTokens));
    }
  }, []);

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const viewOnExplorer = (address: string) => {
    window.open(`https://testnet.xrpl.org/accounts/${address}`, '_blank');
  };

  if (tokens.length === 0) {
    return (
      <Card className="border-2 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-2xl">Issued Tokens</CardTitle>
          <CardDescription>
            No tokens issued yet. Click "Issue New Token" to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Issued Tokens</h3>
        <p className="text-gray-600">Manage your property tokens on XRPL Testnet</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tokens.map((token, index) => (
          <Card key={index} className="border-2 border-yellow-200 hover:border-yellow-400 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl text-gray-900">{token.propertyName}</CardTitle>
                  <CardDescription className="mt-1">{token.location}</CardDescription>
                </div>
                <Badge className="bg-yellow-500 text-white hover:bg-yellow-600 font-mono">
                  {token.tokenCode}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Token Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Total Supply</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {Number(token.totalSupply).toLocaleString()}
                  </p>
                </div>
                {token.totalValuation && (
                  <div>
                    <p className="text-xs text-gray-600">Valuation</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {Number(token.totalValuation).toLocaleString()} RLUSD
                    </p>
                  </div>
                )}
                {token.dailyYield && (
                  <div>
                    <p className="text-xs text-gray-600">Daily Yield</p>
                    <p className="text-sm font-semibold text-green-600">
                      {token.dailyYield}%
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-600">Created</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(token.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="flex gap-2">
                {token.clawbackEnabled && (
                  <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Clawback
                  </Badge>
                )}
                {token.freezeEnabled && (
                  <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 text-xs">
                    <Ban className="h-3 w-3 mr-1" />
                    Freeze
                  </Badge>
                )}
              </div>

              {/* Issuer Address */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Issuer Address</p>
                <p className="text-xs font-mono text-gray-900 break-all mb-2">
                  {token.issuerAddress}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyAddress(token.issuerAddress)}
                    className="flex-1 h-8 text-xs border-yellow-300 hover:bg-yellow-100"
                  >
                    {copiedAddress === token.issuerAddress ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewOnExplorer(token.issuerAddress)}
                    className="flex-1 h-8 text-xs border-yellow-300 hover:bg-yellow-100"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Explorer
                  </Button>
                </div>
              </div>

              {/* Distribution Wallet (if exists) */}
              {token.distributionAddress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Distribution Address</p>
                  <p className="text-xs font-mono text-gray-900 break-all mb-2">
                    {token.distributionAddress}
                  </p>
                  {token.pricePerToken && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-600">DEX Price per Token</p>
                      <p className="text-sm font-semibold text-blue-700">
                        {parseFloat(token.pricePerToken).toFixed(6)} XRP
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyAddress(token.distributionAddress!)}
                      className="flex-1 h-8 text-xs border-blue-300 hover:bg-blue-100"
                    >
                      {copiedAddress === token.distributionAddress ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewOnExplorer(token.distributionAddress!)}
                      className="flex-1 h-8 text-xs border-blue-300 hover:bg-blue-100"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Explorer
                    </Button>
                  </div>
                </div>
              )}

              {/* Warning about seed storage */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                <p className="text-xs text-red-700">
                  ⚠️ Seeds stored in localStorage (demo only!)
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t border-yellow-200">
              <Link href={`/admin/token?code=${token.tokenCode}`} className="w-full">
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Token
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
