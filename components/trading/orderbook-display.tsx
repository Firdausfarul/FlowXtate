"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Client } from "xrpl";

interface PropertyData {
  tokenCode: string;
  currencyCodeHex?: string;
  issuerAddress: string;
}

interface OrderbookDisplayProps {
  property: PropertyData;
}

interface OrderbookData {
  bestBid: { price: string; amount: string } | null;
  bestAsk: { price: string; amount: string } | null;
  spread: string | null;
}

export function OrderbookDisplay({ property }: OrderbookDisplayProps) {
  // Convert non-standard currency code to hex format (XRPL requirement)
  const formatCurrencyCode = (code: string): string => {
    if (!code) return "";
    if (code === "XRP") return "XRP";
    
    // If it's already a 40-char hex string, return it
    if (/^[0-9A-F]{40}$/i.test(code)) return code.toUpperCase();

    // If it's a standard 3-letter alphabetic code, return as is
    if (code.length === 3 && /^[A-Z0-9]{3}$/i.test(code)) {
      return code.toUpperCase();
    }

    // Browser-safe hex conversion for non-standard codes
    try {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(code);
      let hex = "";
      for (const b of bytes) {
        hex += b.toString(16).padStart(2, '0');
      }
      return hex.toUpperCase().padEnd(40, '0');
    } catch (e) {
      console.error("Hex conversion error:", e);
      return code.toUpperCase().padEnd(40, '0');
    }
  };

  const [orderbook, setOrderbook] = useState<OrderbookData>({
    bestBid: null,
    bestAsk: null,
    spread: null,
  });
  const [loading, setLoading] = useState(false);

  const currencyCode = formatCurrencyCode(property.tokenCode);

  const fetchOrderbook = async () => {
    setLoading(true);
    try {
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      // Get buy offers (bids) - people buying tokens for XRP
      const bidsResponse = await client.request({
        command: 'book_offers',
        taker_gets: {
          currency: currencyCode,
          issuer: property.issuerAddress,
        },
        taker_pays: { currency: 'XRP' },
        limit: 1,
      });

      // Get sell offers (asks) - people selling tokens for XRP
      const asksResponse = await client.request({
        command: 'book_offers',
        taker_gets: { currency: 'XRP' },
        taker_pays: {
          currency: currencyCode,
          issuer: property.issuerAddress,
        },
        limit: 1,
      });

      await client.disconnect();

      // Parse best bid (people buying tokens for XRP)
      // Taker gets token, taker pays XRP
      let bestBid = null;
      if (bidsResponse.result.offers.length > 0) {
        const offer = bidsResponse.result.offers[0];
        const tokenAmount = typeof offer.TakerGets === 'string'
          ? parseFloat(offer.TakerGets) / 1000000
          : parseFloat(offer.TakerGets.value);
        const xrpAmount = typeof offer.TakerPays === 'string'
          ? parseFloat(offer.TakerPays) / 1000000
          : parseFloat(offer.TakerPays.value);

        bestBid = {
          price: (xrpAmount / tokenAmount).toFixed(6), // XRP per token
          amount: tokenAmount.toFixed(2),
        };
      }

      // Parse best ask (people selling tokens for XRP)
      // Taker gets XRP, taker pays token
      let bestAsk = null;
      if (asksResponse.result.offers.length > 0) {
        const offer = asksResponse.result.offers[0];
        const xrpAmount = typeof offer.TakerGets === 'string'
          ? parseFloat(offer.TakerGets) / 1000000
          : parseFloat(offer.TakerGets.value);
        const tokenAmount = typeof offer.TakerPays === 'string'
          ? parseFloat(offer.TakerPays) / 1000000
          : parseFloat(offer.TakerPays.value);

        bestAsk = {
          price: (xrpAmount / tokenAmount).toFixed(6), // XRP per token
          amount: tokenAmount.toFixed(2),
        };
      }

      // Calculate spread
      let spread = null;
      if (bestBid && bestAsk) {
        const spreadValue = ((parseFloat(bestAsk.price) - parseFloat(bestBid.price)) / parseFloat(bestBid.price) * 100).toFixed(2);
        spread = spreadValue;
      }

      setOrderbook({ bestBid, bestAsk, spread });
    } catch (err) {
      console.error('Error fetching orderbook:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderbook();
    // Refresh every 10 seconds
    const interval = setInterval(fetchOrderbook, 10000);
    return () => clearInterval(interval);
  }, [property.issuerAddress, currencyCode]);

  return (
    <Card className="border-2 border-yellow-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Market Depth</CardTitle>
          <Button
            onClick={fetchOrderbook}
            disabled={loading}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Best Bid */}
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <p className="text-sm font-semibold text-green-900">Best Bid (Buy)</p>
            </div>
            {orderbook.bestBid ? (
              <>
                <p className="text-2xl font-bold text-green-600 mb-1">
                  {orderbook.bestBid.price} XRP
                </p>
                <p className="text-xs text-gray-600">
                  Amount: {orderbook.bestBid.amount} {property.tokenCode}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No bids</p>
            )}
          </div>

          {/* Best Ask */}
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <p className="text-sm font-semibold text-red-900">Best Ask (Sell)</p>
            </div>
            {orderbook.bestAsk ? (
              <>
                <p className="text-2xl font-bold text-red-600 mb-1">
                  {orderbook.bestAsk.price} XRP
                </p>
                <p className="text-xs text-gray-600">
                  Amount: {orderbook.bestAsk.amount} {property.tokenCode}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No asks</p>
            )}
          </div>
        </div>

        {/* Spread */}
        {orderbook.spread && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-600">Spread</p>
            <p className="text-lg font-semibold text-gray-900">{orderbook.spread}%</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
