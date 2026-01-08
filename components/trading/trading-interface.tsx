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

// RLUSD issuer on XRPL
const RLUSD_ISSUER = "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV";

export function TradingInterface({ property }: TradingInterfaceProps) {
  const { account } = useWallet();
  const [activeTab, setActiveTab] = useState("market");

  // Convert non-standard currency code to hex format (XRPL requirement)
  const formatCurrencyCode = (code: string): string => {
    if (!code) return "";
    if (code === "XRP") return "XRP";
    if (code === "RLUSD") return "RLUSD";
    
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

  // Market tab state (Path Payment)
  const [srcCurrency, setSrcCurrency] = useState("XRP");
  const [destCurrency, setDestCurrency] = useState(property.tokenCode);
  const [srcAmount, setSrcAmount] = useState("");
  const [destAmount, setDestAmount] = useState("");
  const [marketProcessing, setMarketProcessing] = useState(false);
  const [marketError, setMarketError] = useState("");
  const [estimatedPath, setEstimatedPath] = useState<any>(null);

  // Limit tab state
  const [limitType, setLimitType] = useState<"buy" | "sell">("buy");
  const [limitAmount, setLimitAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [limitProcessing, setLimitProcessing] = useState(false);
  const [limitError, setLimitError] = useState("");

  const findPath = async (sendMax: boolean = false) => {
    if (!account || (!srcAmount && !destAmount)) return;

    let client: Client | null = null;
    try {
      client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      const srcCurrencyCode = formatCurrencyCode(srcCurrency);
      const destCurrencyCode = formatCurrencyCode(destCurrency);

      const sAmt = srcAmount && parseFloat(srcAmount) > 0 ? srcAmount : "1";
      const dAmt = destAmount && parseFloat(destAmount) > 0 ? destAmount : "1";

      const sourceAmount = srcCurrency === "XRP"
        ? Math.floor(parseFloat(sAmt) * 1000000).toString()
        : srcCurrency === "RLUSD"
        ? {
            currency: "RLUSD",
            issuer: RLUSD_ISSUER,
            value: sAmt.toString(),
          }
        : {
            currency: srcCurrencyCode,
            issuer: property.issuerAddress,
            value: sAmt.toString(),
          };

      const destinationAmount = destCurrency === "XRP"
        ? Math.floor(parseFloat(dAmt) * 1000000).toString()
        : destCurrency === "RLUSD"
        ? {
            currency: "RLUSD",
            issuer: RLUSD_ISSUER,
            value: dAmt.toString(),
          }
        : {
            currency: destCurrencyCode,
            issuer: property.issuerAddress,
            value: dAmt.toString(),
          };

      console.log('Path find request:', {
        source_account: account.address,
        destination_account: account.address,
        destination_amount: destinationAmount,
        send_max: sendMax ? sourceAmount : undefined
      });

      const pathRequest: any = {
        command: 'ripple_path_find',
        source_account: account.address,
        destination_account: account.address,
        destination_amount: destinationAmount,
      };

      if (sendMax) {
        pathRequest.send_max = sourceAmount;
      }

      const pathResult = await client.request(pathRequest);
      console.log('Path find result:', pathResult);

      if (pathResult.result.alternatives && pathResult.result.alternatives.length > 0) {
        const bestPath = pathResult.result.alternatives[0];
        setEstimatedPath(bestPath);

        if (sendMax && (!destAmount || destAmount === "1")) {
          const destVal = typeof bestPath.destination_amount === 'string'
            ? parseFloat(bestPath.destination_amount) / 1000000
            : parseFloat(bestPath.destination_amount.value);
          setDestAmount(destVal.toFixed(6));
        } else if (!sendMax && (!srcAmount || srcAmount === "1")) {
          const srcVal = typeof bestPath.source_amount === 'string'
            ? parseFloat(bestPath.source_amount) / 1000000
            : parseFloat(bestPath.source_amount.value);
          setSrcAmount(srcVal.toFixed(6));
        }
      }
    } catch (err) {
      console.error('Path finding error:', err);
    } finally {
      if (client) await client.disconnect();
    }
  };

  const handleMarketTrade = async () => {
    if (!account || !srcAmount || !destAmount) return;

    setMarketProcessing(true);
    setMarketError("");

    try {
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      const srcCurrencyCode = formatCurrencyCode(srcCurrency);
      const destCurrencyCode = formatCurrencyCode(destCurrency);

      // Prepare amounts for Payment transaction
      const sendMaxAmount = srcCurrency === "XRP"
        ? Math.floor(parseFloat(srcAmount) * 1000000).toString()
        : srcCurrency === "RLUSD"
        ? {
            currency: "RLUSD",
            issuer: RLUSD_ISSUER,
            value: srcAmount,
          }
        : {
            currency: srcCurrencyCode,
            issuer: property.issuerAddress,
            value: srcAmount,
          };

      const destinationAmount = destCurrency === "XRP"
        ? Math.floor(parseFloat(destAmount) * 1000000).toString()
        : destCurrency === "RLUSD"
        ? {
            currency: "RLUSD",
            issuer: RLUSD_ISSUER,
            value: destAmount,
          }
        : {
            currency: destCurrencyCode,
            issuer: property.issuerAddress,
            value: destAmount,
          };

      // Create Payment transaction with path
      const paymentTx: any = {
        TransactionType: 'Payment',
        Account: account.address,
        Destination: account.address, // Self payment
        Amount: destinationAmount,
        SendMax: sendMaxAmount,
        Flags: 0x00020000, // tfPartialPayment - allow partial payment
      };

      // Add paths if we found any
      if (estimatedPath?.paths_computed) {
        paymentTx.Paths = estimatedPath.paths_computed;
      }

      await client.disconnect();

      // Sign with Crossmark
      const signResponse: any = await sdk.methods.signAndSubmitAndWait(paymentTx);

      if (signResponse?.response?.data?.resp?.result?.meta?.TransactionResult !== 'tesSUCCESS') {
        throw new Error('Transaction failed');
      }

      setSrcAmount("");
      setDestAmount("");
      setEstimatedPath(null);
      alert(`Successfully swapped ${srcAmount} ${srcCurrency} for ~${destAmount} ${destCurrency}!`);
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

      const currencyCode = formatCurrencyCode(property.tokenCode);

      // Calculate total XRP needed/received
      const totalXRP = parseFloat(limitAmount) * parseFloat(limitPrice);

      // Create limit order
      const offerTx: any = {
        TransactionType: 'OfferCreate',
        Account: account.address,
        TakerGets: limitType === "buy"
          ? Math.floor(totalXRP * 1000000).toString() // XRP in drops (what seller gets)
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
          : Math.floor(totalXRP * 1000000).toString(), // XRP in drops (what buyer pays)
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
            <TabsTrigger value="market">Swap (Path Payment)</TabsTrigger>
            <TabsTrigger value="limit">Limit Order</TabsTrigger>
          </TabsList>

          {/* Market Tab - Path Payment Swap */}
          <TabsContent value="market" className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
              {/* Source Currency */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  You Send
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={srcAmount}
                    onChange={(e) => {
                      setSrcAmount(e.target.value);
                      if (e.target.value && destAmount) findPath(true);
                    }}
                    placeholder="0.00"
                    className="flex-1 border-blue-300"
                  />
                  <select
                    value={srcCurrency}
                    onChange={(e) => setSrcCurrency(e.target.value)}
                    className="px-3 py-2 border-2 border-blue-300 rounded-md font-semibold bg-white"
                  >
                    <option value="XRP">XRP</option>
                    <option value="RLUSD">RLUSD</option>
                    <option value={property.tokenCode}>{property.tokenCode}</option>
                  </select>
                </div>
              </div>

              {/* Swap Arrow */}
              <div className="flex justify-center">
                <div className="bg-white rounded-full p-2 border-2 border-blue-300">
                  <ArrowRight className="h-5 w-5 text-blue-600 rotate-90" />
                </div>
              </div>

              {/* Destination Currency */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  You Receive (Estimated)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={destAmount}
                    onChange={(e) => {
                      setDestAmount(e.target.value);
                      if (e.target.value && srcAmount) findPath(false);
                    }}
                    placeholder="0.00"
                    className="flex-1 border-purple-300"
                  />
                  <select
                    value={destCurrency}
                    onChange={(e) => setDestCurrency(e.target.value)}
                    className="px-3 py-2 border-2 border-purple-300 rounded-md font-semibold bg-white"
                  >
                    <option value="XRP">XRP</option>
                    <option value="RLUSD">RLUSD</option>
                    <option value={property.tokenCode}>{property.tokenCode}</option>
                  </select>
                </div>
              </div>

              {/* Quick Currency Swap Button */}
              <Button
                onClick={() => {
                  const tempCur = srcCurrency;
                  const tempAmt = srcAmount;
                  setSrcCurrency(destCurrency);
                  setDestCurrency(tempCur);
                  setSrcAmount(destAmount);
                  setDestAmount(tempAmt);
                }}
                variant="outline"
                size="sm"
                className="w-full border-blue-300"
              >
                Swap Currencies
              </Button>
            </div>

            {/* Path Info */}
            {estimatedPath && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-900 mb-1">Path Found!</p>
                <p className="text-xs text-green-700">
                  Exchange rate: 1 {srcCurrency} = {
                    (parseFloat(destAmount) / parseFloat(srcAmount)).toFixed(6)
                  } {destCurrency}
                </p>
              </div>
            )}

            {/* Find Path Button */}
            <Button
              onClick={() => findPath(true)}
              variant="outline"
              className="w-full border-blue-400 text-blue-700 hover:bg-blue-50"
              disabled={!srcAmount && !destAmount}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Find Best Path
            </Button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>Path Payment:</strong> Uses XRPL's built-in DEX to find the best exchange path between currencies.
                The actual amount may vary slightly based on liquidity.
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
              disabled={marketProcessing || !srcAmount || !destAmount}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {marketProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing Swap...
                </>
              ) : (
                <>
                  Swap {srcCurrency} for {destCurrency}
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