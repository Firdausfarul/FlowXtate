"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import { Client, Wallet } from "xrpl";
import { useWallet } from "@/lib/wallet-context";
import sdk from '@crossmarkio/sdk';

interface PropertyData {
  propertyName: string;
  tokenCode: string;
  currencyCodeHex?: string;
  issuerAddress: string;
}

interface TradingInterfaceProps {
  property: PropertyData;
}

export function TradingInterface({ property }: TradingInterfaceProps) {
  const { account } = useWallet();
  const [activeTab, setActiveTab] = useState("market");

  // Market tab state
  const [marketType, setMarketType] = useState<"buy" | "sell">("buy");
  const [marketAmount, setMarketAmount] = useState("");
  const [marketProcessing, setMarketProcessing] = useState(false);
  const [marketError, setMarketError] = useState("");

  // Limit tab state
  const [limitType, setLimitType] = useState<"buy" | "sell">("buy");
  const [limitAmount, setLimitAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [limitProcessing, setLimitProcessing] = useState(false);
  const [limitError, setLimitError] = useState("");

  const currencyCode = property.currencyCodeHex || property.tokenCode;

  const handleMarketTrade = async () => {
    if (!account || !marketAmount) return;

    setMarketProcessing(true);
    setMarketError("");

    try {
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      // Create OfferCreate transaction that will match immediately
      const offerTx: any = {
        TransactionType: 'OfferCreate',
        Account: account.address,
        TakerGets: marketType === "buy"
          ? (parseFloat(marketAmount) * 10 * 1000000).toString() // XRP in drops - 10x market price to ensure fill
          : {
              currency: currencyCode,
              issuer: property.issuerAddress,
              value: marketAmount,
            },
        TakerPays: marketType === "buy"
          ? {
              currency: currencyCode,
              issuer: property.issuerAddress,
              value: marketAmount,
            }
          : (parseFloat(marketAmount) * 10 * 1000000).toString(), // XRP in drops - 10x market price to ensure fill
        Flags: 0x00080000, // tfImmediateOrCancel - fill immediately or cancel
      };

      // Sign with Crossmark
      const signResponse: any = await sdk.methods.signAndSubmitAndWait({
        TransactionType: offerTx.TransactionType,
        Account: offerTx.Account,
        TakerGets: offerTx.TakerGets,
        TakerPays: offerTx.TakerPays,
        Flags: offerTx.Flags,
      });

      if (signResponse?.response?.data?.resp?.result?.meta?.TransactionResult !== 'tesSUCCESS') {
        throw new Error('Transaction failed');
      }

      await client.disconnect();

      setMarketAmount("");
      alert(`Successfully ${marketType === "buy" ? "bought" : "sold"} ${marketAmount} ${property.tokenCode}!`);
    } catch (err: any) {
      console.error('Market trade error:', err);
      setMarketError(err.message || 'Failed to execute trade');
    } finally {
      setMarketProcessing(false);
    }
  };

  const handleLimitOrder = async () => {
    if (!account || !limitAmount || !limitPrice) return;

    setLimitProcessing(true);
    setLimitError("");

    try {
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      // Calculate total XRP needed/received
      const totalXRP = parseFloat(limitAmount) * parseFloat(limitPrice);

      // Create limit order
      const offerTx: any = {
        TransactionType: 'OfferCreate',
        Account: account.address,
        TakerGets: limitType === "buy"
          ? (totalXRP * 1000000).toString() // XRP in drops (what seller gets)
          : {
              currency: currencyCode,
              issuer: property.issuerAddress,
              value: limitAmount,
            },
        TakerPays: limitType === "buy"
          ? {
              currency: currencyCode,
              issuer: property.issuerAddress,
              value: limitAmount,
            }
          : (totalXRP * 1000000).toString(), // XRP in drops (what buyer pays)
      };

      // Sign with Crossmark
      const signResponse: any = await sdk.methods.signAndSubmitAndWait({
        TransactionType: offerTx.TransactionType,
        Account: offerTx.Account,
        TakerGets: offerTx.TakerGets,
        TakerPays: offerTx.TakerPays,
      });

      if (signResponse?.response?.data?.resp?.result?.meta?.TransactionResult !== 'tesSUCCESS') {
        throw new Error('Transaction failed');
      }

      await client.disconnect();

      setLimitAmount("");
      setLimitPrice("");
      alert(`Limit order placed! ${limitType === "buy" ? "Buying" : "Selling"} ${limitAmount} ${property.tokenCode} at ${limitPrice} XRP each.`);
    } catch (err: any) {
      console.error('Limit order error:', err);
      setLimitError(err.message || 'Failed to place order');
    } finally {
      setLimitProcessing(false);
    }
  };

  return (
    <Card className="border-2 border-yellow-200">
      <CardHeader>
        <CardTitle className="text-xl">Trade {property.tokenCode}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="market">Market (Instant)</TabsTrigger>
            <TabsTrigger value="limit">Limit Order</TabsTrigger>
          </TabsList>

          {/* Market Tab */}
          <TabsContent value="market" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                onClick={() => setMarketType("buy")}
                variant={marketType === "buy" ? "default" : "outline"}
                className={marketType === "buy" ? "flex-1 bg-green-600 hover:bg-green-700" : "flex-1"}
              >
                Buy
              </Button>
              <Button
                onClick={() => setMarketType("sell")}
                variant={marketType === "sell" ? "default" : "outline"}
                className={marketType === "sell" ? "flex-1 bg-red-600 hover:bg-red-700" : "flex-1"}
              >
                Sell
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ({property.tokenCode})
              </label>
              <Input
                type="number"
                value={marketAmount}
                onChange={(e) => setMarketAmount(e.target.value)}
                placeholder="0.00"
                className="border-yellow-300"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Market Order:</strong> Your order will be filled instantly at the best available price.
              </p>
            </div>

            {marketError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">{marketError}</p>
              </div>
            )}

            <Button
              onClick={handleMarketTrade}
              disabled={marketProcessing || !marketAmount}
              className={`w-full ${marketType === "buy" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
            >
              {marketProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {marketType === "buy" ? "Buy" : "Sell"} {property.tokenCode}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </TabsContent>

          {/* Limit Tab */}
          <TabsContent value="limit" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                onClick={() => setLimitType("buy")}
                variant={limitType === "buy" ? "default" : "outline"}
                className={limitType === "buy" ? "flex-1 bg-green-600 hover:bg-green-700" : "flex-1"}
              >
                Buy
              </Button>
              <Button
                onClick={() => setLimitType("sell")}
                variant={limitType === "sell" ? "default" : "outline"}
                className={limitType === "sell" ? "flex-1 bg-red-600 hover:bg-red-700" : "flex-1"}
              >
                Sell
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ({property.tokenCode})
              </label>
              <Input
                type="number"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                placeholder="0.00"
                className="border-yellow-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (XRP per token)
              </label>
              <Input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="0.000000"
                step="0.000001"
                className="border-yellow-300"
              />
            </div>

            {limitAmount && limitPrice && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-lg font-bold text-gray-900">
                  {(parseFloat(limitAmount) * parseFloat(limitPrice)).toFixed(6)} XRP
                </p>
              </div>
            )}

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-900">
                <strong>Limit Order:</strong> Your order will only execute when someone fills it at your specified price.
                It may take time or never fill if no one matches your price.
              </p>
            </div>

            {limitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">{limitError}</p>
              </div>
            )}

            <Button
              onClick={handleLimitOrder}
              disabled={limitProcessing || !limitAmount || !limitPrice}
              className={`w-full ${limitType === "buy" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
            >
              {limitProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Place {limitType === "buy" ? "Buy" : "Sell"} Order
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
