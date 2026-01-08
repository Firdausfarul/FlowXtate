"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, MapPin } from "lucide-react";
import { TradingInterface } from "@/components/trading/trading-interface";
import { OrderbookDisplay } from "@/components/trading/orderbook-display";
import { ActiveOrders } from "@/components/trading/active-orders";
import Link from "next/link";
import { useWallet } from "@/lib/wallet-context";

interface PropertyData {
  propertyName: string;
  location: string;
  tokenCode: string;
  currencyCodeHex?: string;
  totalSupply: string;
  totalValuation: string;
  dailyYield: string;
  issuerAddress: string;
  distributionAddress?: string;
  pricePerToken?: string;
  createdAt: string;
}

function PropertyDetailContent() {
  const searchParams = useSearchParams();
  const { isConnected } = useWallet();
  const tokenCode = searchParams.get('code') || '';

  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load property from localStorage
    const storedTokens = localStorage.getItem('issued_tokens');
    if (storedTokens) {
      const tokens = JSON.parse(storedTokens);
      const foundProperty = tokens.find((t: PropertyData) => t.tokenCode === tokenCode);
      setProperty(foundProperty || null);
    }
    setLoading(false);
  }, [tokenCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h2>
          <Link href="/properties">
            <Button variant="outline" className="border-yellow-400">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
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
          <Link href="/properties">
            <Button variant="ghost" size="sm" className="mb-4 hover:bg-yellow-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{property.propertyName}</h1>
                <Badge className="bg-yellow-500 text-white hover:bg-yellow-600 font-mono">
                  {property.tokenCode}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <MapPin className="h-4 w-4" />
                <span>{property.location}</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {property.dailyYield && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Daily Yield</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <p className="text-lg font-bold text-green-600">{property.dailyYield}%</p>
                    </div>
                  </div>
                )}
                {property.totalValuation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Total Valuation</p>
                    <p className="text-lg font-bold text-gray-900">
                      {Number(property.totalValuation).toLocaleString()} XRP
                    </p>
                  </div>
                )}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Total Supply</p>
                  <p className="text-lg font-bold text-gray-900">
                    {Number(property.totalSupply).toLocaleString()}
                  </p>
                </div>
                {property.pricePerToken && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Initial Price</p>
                    <p className="text-lg font-bold text-gray-900">
                      {parseFloat(property.pricePerToken).toFixed(6)} XRP
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Property Image Placeholder */}
            <div className="hidden md:block ml-6">
              <div className="w-48 h-48 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
                <div className="text-7xl">🏢</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Section */}
      <div className="container px-4 py-8">
        {!isConnected ? (
          <Card className="border-2 border-yellow-200">
            <CardContent className="py-12 text-center">
              <p className="text-lg text-gray-600 mb-4">Connect your wallet to start trading</p>
              <p className="text-sm text-gray-500">Use Crossmark wallet to buy and sell property tokens</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: Orderbook + Trading */}
            <div className="lg:col-span-2 space-y-6">
              <OrderbookDisplay property={property} />
              <TradingInterface property={property} />
            </div>

            {/* Right: Active Orders */}
            <div>
              <ActiveOrders property={property} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertyDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    }>
      <PropertyDetailContent />
    </Suspense>
  );
}
