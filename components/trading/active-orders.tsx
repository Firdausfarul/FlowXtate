"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, X, TrendingUp, TrendingDown } from "lucide-react";
import { Client } from "xrpl";
import { useWallet } from "@/lib/wallet-context";
import sdk from '@crossmarkio/sdk';

interface PropertyData {
  tokenCode: string;
  currencyCodeHex?: string;
  issuerAddress: string;
}

interface ActiveOrdersProps {
  property: PropertyData;
}

interface Order {
  sequence: number;
  type: "buy" | "sell";
  amount: string;
  price: string;
  total: string;
}

export function ActiveOrders({ property }: ActiveOrdersProps) {
  const { account } = useWallet();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const currencyCode = property.currencyCodeHex || property.tokenCode;

  const fetchOrders = async () => {
    if (!account) return;

    setLoading(true);
    try {
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      const response = await client.request({
        command: 'account_offers',
        account: account.address,
        ledger_index: 'validated',
      });

      // Filter offers for this token only
      const tokenOffers = (response.result.offers || [])
        .filter((offer: any) => {
          const takerGets = offer.taker_gets;
          const takerPays = offer.taker_pays;

          const getsMatch = typeof takerGets === 'object' &&
                            takerGets.currency === currencyCode &&
                            takerGets.issuer === property.issuerAddress;
          const paysMatch = typeof takerPays === 'object' &&
                            takerPays.currency === currencyCode &&
                            takerPays.issuer === property.issuerAddress;

          return getsMatch || paysMatch;
        })
        .map((offer: any) => {
          const takerGets = offer.taker_gets;
          const takerPays = offer.taker_pays;

          // Determine if this is a buy or sell order
          // BUY: TakerGets = XRP (string), TakerPays = tokens (object)
          // SELL: TakerGets = tokens (object), TakerPays = XRP (string)
          const isBuy = typeof takerGets === 'string';

          let amount, price, total;

          if (isBuy) {
            // Buying tokens with XRP
            amount = parseFloat(takerPays.value); // Tokens buying
            total = parseFloat(takerGets) / 1000000; // XRP offering (in drops)
            price = total / amount;
          } else {
            // Selling tokens for XRP
            amount = parseFloat(takerGets.value); // Tokens selling
            total = parseFloat(takerPays) / 1000000; // XRP receiving (in drops)
            price = total / amount;
          }

          return {
            sequence: offer.seq,
            type: (isBuy ? "buy" : "sell") as "buy" | "sell",
            amount: amount.toFixed(2),
            price: price.toFixed(6),
            total: total.toFixed(6),
          };
        });

      setOrders(tokenOffers);
      await client.disconnect();
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (sequence: number) => {
    if (!account) return;

    setCancelling(sequence);
    try {
      const cancelTx: any = {
        TransactionType: 'OfferCancel',
        Account: account.address,
        OfferSequence: sequence,
      };

      const signResponse: any = await sdk.methods.signAndSubmitAndWait({
        TransactionType: cancelTx.TransactionType,
        Account: cancelTx.Account,
        OfferSequence: cancelTx.OfferSequence,
      });

      if (signResponse?.response?.data?.resp?.result?.meta?.TransactionResult === 'tesSUCCESS') {
        await fetchOrders(); // Refresh orders list
      } else {
        throw new Error('Cancel failed');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert('Failed to cancel order');
    } finally {
      setCancelling(null);
    }
  };

  useEffect(() => {
    if (account) {
      fetchOrders();
      // Refresh every 10 seconds
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [account?.address, property.issuerAddress, currencyCode]);

  if (!account) {
    return null;
  }

  return (
    <Card className="border-2 border-yellow-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Your Orders</CardTitle>
          <Button
            onClick={fetchOrders}
            disabled={loading}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No active orders</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.sequence}
                className={`border-2 rounded-lg p-3 ${
                  order.type === "buy"
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {order.type === "buy" ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <Badge
                      variant="outline"
                      className={
                        order.type === "buy"
                          ? "border-green-400 bg-green-100 text-green-700"
                          : "border-red-400 bg-red-100 text-red-700"
                      }
                    >
                      {order.type.toUpperCase()}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => handleCancelOrder(order.sequence)}
                    disabled={cancelling === order.sequence}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-red-100"
                  >
                    {cancelling === order.sequence ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold">
                      {order.amount} {property.tokenCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold">{order.price} XRP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-semibold">{order.total} XRP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
