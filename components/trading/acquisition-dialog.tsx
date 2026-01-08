"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";
import { Client, Wallet, xrpToDrops } from "xrpl";
import sdk from '@crossmarkio/sdk';

interface AcquisitionDialogProps {
  property: {
    propertyName: string;
    tokenCode: string;
    totalValuation: string;
    issuerAddress: string;
    currencyCodeHex?: string;
  };
  onClose: () => void;
}

interface TokenHolder {
  address: string;
  balance: string;
}

export function AcquisitionDialog({ property, onClose }: AcquisitionDialogProps) {
  const { account } = useWallet();
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("");

  // Calculate 130% TVL
  const requiredAmount = (Number(property.totalValuation) * 1.3).toFixed(2);

  const getTrustlineHolders = async (
    client: Client,
    issuerAddress: string,
    currency: string
  ): Promise<TokenHolder[]> => {
    try {
      const response = await client.request({
        command: "account_lines",
        account: issuerAddress,
        ledger_index: "validated",
      });

      const holders: TokenHolder[] = [];
      for (const line of response.result.lines) {
        if (line.currency === currency && parseFloat(line.balance) < 0) {
          holders.push({
            address: line.account,
            balance: Math.abs(parseFloat(line.balance)).toString(),
          });
        }
      }

      return holders;
    } catch (error) {
      console.error("Error fetching trustline holders:", error);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    setSubmitting(true);
    setStatus("Preparing acquisition...");

    try {
      // Get token data from localStorage
      const storedTokens = localStorage.getItem("issued_tokens") || "[]";
      const tokens = JSON.parse(storedTokens);
      const token = tokens.find((t: any) => t.tokenCode === property.tokenCode);

      if (!token) {
        throw new Error("Token not found");
      }

      const client = new Client("wss://s.altnet.rippletest.net:51233");
      await client.connect();

      const issuerWallet = Wallet.fromSeed(token.issuerSeed);
      const currency = property.currencyCodeHex || property.tokenCode;

      // Step 1: Get all current token holders
      setStatus("Fetching current token holders...");
      const holders = await getTrustlineHolders(client, property.issuerAddress, currency);

      if (holders.length === 0) {
        alert("No token holders found. Property may already be fully owned.");
        await client.disconnect();
        setSubmitting(false);
        return;
      }

      // Step 2: Calculate fair shares
      const totalTokens = holders.reduce((sum, h) => sum + parseFloat(h.balance), 0);
      const acquisitionAmount = parseFloat(requiredAmount);

      const fairShares = holders.map((holder) => ({
        address: holder.address,
        tokenBalance: parseFloat(holder.balance),
        sharePercentage: (parseFloat(holder.balance) / totalTokens) * 100,
        xrpAmount: (parseFloat(holder.balance) / totalTokens) * acquisitionAmount,
      }));

      console.log("Fair shares:", fairShares);

      // Step 3: User pays acquisition amount via Crossmark
      setStatus(`Sending ${requiredAmount} XRP payment...`);

      const paymentTx = {
        TransactionType: "Payment",
        Account: account.address,
        Destination: property.issuerAddress,
        Amount: xrpToDrops(requiredAmount),
        Memos: [
          {
            Memo: {
              MemoType: Buffer.from("acquisition", "utf8").toString("hex").toUpperCase(),
              MemoData: Buffer.from(property.tokenCode, "utf8").toString("hex").toUpperCase(),
            },
          },
        ],
      };

      const paymentResult: any = await sdk.methods.signAndSubmitAndWait(paymentTx);
      console.log("Payment result:", paymentResult);

      if (paymentResult?.response?.data?.resp?.result?.meta?.TransactionResult !== "tesSUCCESS") {
        throw new Error("Payment failed: " + (paymentResult?.response?.data?.resp?.result?.meta?.TransactionResult || "Unknown error"));
      }

      // Step 4: Automatic clawback from all holders
      setStatus("Clawing back tokens from current holders...");
      for (const holder of holders) {
        try {
          const clawbackTx = {
            TransactionType: "Clawback" as const,
            Account: property.issuerAddress,
            Amount: {
              currency: currency,
              issuer: holder.address,
              value: holder.balance,
            },
          };

          const prepared = await client.autofill(clawbackTx);
          const signed = issuerWallet.sign(prepared);
          const result = await client.submitAndWait(signed.tx_blob);

          console.log(`Clawback from ${holder.address}: ${result.result.meta?.TransactionResult}`);
        } catch (err) {
          console.error(`Failed to clawback from ${holder.address}:`, err);
        }
      }

      // Step 5: Distribute fair share to each holder
      setStatus("Distributing fair shares to previous holders...");
      for (const share of fairShares) {
        try {
          const distributeTx = {
            TransactionType: "Payment" as const,
            Account: property.issuerAddress,
            Destination: share.address,
            Amount: xrpToDrops(share.xrpAmount.toFixed(6)),
            Memos: [
              {
                Memo: {
                  MemoType: Buffer.from("acquisition_payout", "utf8").toString("hex").toUpperCase(),
                  MemoData: Buffer.from(
                    `${share.tokenBalance} tokens for ${property.propertyName}`,
                    "utf8"
                  ).toString("hex").toUpperCase(),
                },
              },
            ],
          };

          const prepared = await client.autofill(distributeTx);
          const signed = issuerWallet.sign(prepared);
          const result = await client.submitAndWait(signed.tx_blob);

          console.log(`Payment to ${share.address}: ${result.result.meta?.TransactionResult}`);
        } catch (err) {
          console.error(`Failed to pay ${share.address}:`, err);
        }
      }

      // Step 6: Transfer all tokens to buyer
      setStatus("Transferring tokens to you...");
      try {
        const transferTx = {
          TransactionType: "Payment" as const,
          Account: property.issuerAddress,
          Destination: account.address,
          Amount: {
            currency: currency,
            issuer: property.issuerAddress,
            value: totalTokens.toString(),
          },
        };

        const prepared = await client.autofill(transferTx);
        const signed = issuerWallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);

        console.log(`Transfer to buyer: ${result.result.meta?.TransactionResult}`);
      } catch (err) {
        console.error("Failed to transfer tokens to buyer:", err);
      }

      await client.disconnect();

      setStatus("Acquisition completed successfully!");
      alert(
        `Property acquired successfully!\n\n` +
        `You paid: ${requiredAmount} XRP\n` +
        `Previous holders (${holders.length}) received their fair share\n` +
        `You now own ${totalTokens} ${property.tokenCode} tokens`
      );
      onClose();
    } catch (err) {
      console.error("Acquisition error:", err);
      alert("Failed to complete acquisition: " + (err as Error).message);
    } finally {
      setSubmitting(false);
      setStatus("");
    }
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Property Acquisition</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{property.propertyName}</h3>
              <p className="text-sm text-gray-600 mb-1">Token: {property.tokenCode}</p>
              <p className="text-sm text-gray-600">Total Valuation: {Number(property.totalValuation).toLocaleString()} XRP</p>
            </div>

            {/* Acquisition Requirements */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-2">Acquisition Process (Automatic)</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Required payment: <span className="font-bold">{requiredAmount} XRP</span> (130% of TVL)</li>
                      <li>• You pay via Crossmark wallet</li>
                      <li>• System automatically clawbacks all tokens from current holders</li>
                      <li>• Current holders receive fair share of your payment</li>
                      <li>• All tokens are transferred to you immediately</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <Label>Issuer Address (Payment Destination)</Label>
                <Input value={property.issuerAddress} readOnly className="font-mono text-sm bg-gray-50" />
              </div>

              <div>
                <Label>Required Payment Amount</Label>
                <Input
                  value={`${requiredAmount} XRP`}
                  readOnly
                  className="font-bold text-lg bg-green-50 border-green-300"
                />
              </div>
            </div>

            {/* Status or Instructions */}
            {submitting && status ? (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
                  <p className="text-sm text-yellow-900 font-semibold">{status}</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-900 font-semibold mb-2">What happens next:</p>
                <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Crossmark wallet will prompt you to sign payment of {requiredAmount} XRP</li>
                  <li>After payment succeeds, system automatically processes acquisition</li>
                  <li>All current token holders are clawed back and compensated</li>
                  <li>All {property.tokenCode} tokens are transferred to your wallet</li>
                  <li>You become the sole owner of {property.propertyName}</li>
                </ol>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Acquire Property Now"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}