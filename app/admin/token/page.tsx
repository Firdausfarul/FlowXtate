"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { TrustlineHoldersList } from "@/components/admin/trustline-holders-list";
import { CheckAccountFlags } from "@/components/admin/check-account-flags";
import { Client } from "xrpl";
import Link from "next/link";

interface TokenData {
  propertyName: string;
  location: string;
  tokenCode: string;
  currencyCodeHex?: string;
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

function TokenManagementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenCode = searchParams.get('code') || '';

  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load token from localStorage
    const storedTokens = localStorage.getItem('issued_tokens');
    if (storedTokens) {
      const tokens = JSON.parse(storedTokens);
      const foundToken = tokens.find((t: TokenData) => t.tokenCode === tokenCode);
      setToken(foundToken || null);
    }
    setLoading(false);
  }, [tokenCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Token Not Found</h2>
          <Link href="/admin">
            <Button variant="outline" className="border-yellow-400">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-yellow-300">
        <div className="container px-4 py-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-4 hover:bg-yellow-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{token.propertyName}</h1>
                <Badge className="bg-yellow-500 text-white hover:bg-yellow-600 font-mono">
                  {token.tokenCode}
                </Badge>
              </div>
              <p className="text-gray-600">{token.location}</p>
            </div>
          </div>

          {/* Token Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Total Supply</p>
              <p className="text-lg font-bold text-gray-900">
                {Number(token.totalSupply).toLocaleString()}
              </p>
            </div>
            {token.totalValuation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Valuation</p>
                <p className="text-lg font-bold text-gray-900">
                  {Number(token.totalValuation).toLocaleString()} XRP
                </p>
              </div>
            )}
            {token.dailyYield && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Daily Yield</p>
                <p className="text-lg font-bold text-green-600">
                  {token.dailyYield}%
                </p>
              </div>
            )}
            {token.pricePerToken && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Price per Token</p>
                <p className="text-lg font-bold text-purple-600">
                  {parseFloat(token.pricePerToken).toFixed(6)} XRP
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Token Holders & Management */}
      <div className="container px-4 py-8 space-y-6">
        <CheckAccountFlags issuerAddress={token.issuerAddress} />
        <TrustlineHoldersList token={token} />
      </div>
    </div>
  );
}

export default function TokenManagementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    }>
      <TokenManagementContent />
    </Suspense>
  );
}
