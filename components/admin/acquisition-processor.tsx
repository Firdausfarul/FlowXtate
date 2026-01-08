"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Client, Wallet, xrpToDrops } from "xrpl";

interface AcquisitionRequest {
  propertyTokenCode: string;
  propertyName: string;
  buyerAddress: string;
  requiredAmount: string;
  status: "pending" | "processing" | "completed" | "failed";
  submittedAt: string;
}

interface TokenHolder {
  address: string;
  balance: string;
}

interface TokenData {
  tokenCode: string;
  currencyCodeHex?: string;
  issuerAddress: string;
  issuerSeed: string;
  totalValuation: string;
}

export function AcquisitionProcessor() {
  const [requests, setRequests] = useState<AcquisitionRequest[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRequests = () => {
    const storedRequests = localStorage.getItem("acquisition_requests") || "[]";
    const allRequests = JSON.parse(storedRequests);
    setRequests(allRequests);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

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

  const processAcquisition = async (request: AcquisitionRequest) => {
    setProcessing(request.propertyTokenCode);

    try {
      // Load token data
      const storedTokens = localStorage.getItem("issued_tokens") || "[]";
      const tokens: TokenData[] = JSON.parse(storedTokens);
      const token = tokens.find((t) => t.tokenCode === request.propertyTokenCode);

      if (!token) {
        throw new Error("Token not found");
      }

      const client = new Client("wss://s.altnet.rippletest.net:51233");
      await client.connect();

      const issuerWallet = Wallet.fromSeed(token.issuerSeed);

      // Step 1: Get all current token holders
      const currency = token.currencyCodeHex || token.tokenCode;
      const holders = await getTrustlineHolders(client, token.issuerAddress, currency);

      console.log("Current holders:", holders);

      if (holders.length === 0) {
        alert("No token holders found. Property may already be fully owned.");
        await client.disconnect();
        setProcessing(null);
        return;
      }

      // Step 2: Calculate total tokens in circulation
      const totalTokens = holders.reduce((sum, h) => sum + parseFloat(h.balance), 0);

      // Step 3: Calculate fair share for each holder
      const acquisitionAmount = parseFloat(request.requiredAmount);
      const fairShares = holders.map((holder) => ({
        address: holder.address,
        tokenBalance: parseFloat(holder.balance),
        sharePercentage: (parseFloat(holder.balance) / totalTokens) * 100,
        xrpAmount: (parseFloat(holder.balance) / totalTokens) * acquisitionAmount,
      }));

      console.log("Fair shares:", fairShares);

      // Confirm with admin
      const confirmMsg = `Process acquisition for ${request.propertyName}?\n\n` +
        `Buyer: ${request.buyerAddress}\n` +
        `Payment: ${request.requiredAmount} XRP\n\n` +
        `Current holders (${holders.length}):\n` +
        fairShares.map(fs =>
          `${fs.address.substring(0, 8)}...: ${fs.tokenBalance} tokens (${fs.sharePercentage.toFixed(2)}%) = ${fs.xrpAmount.toFixed(2)} XRP`
        ).join('\n') +
        `\n\nThis will:\n` +
        `1. Clawback all tokens from current holders\n` +
        `2. Send fair share XRP to each holder\n` +
        `3. Transfer all tokens to buyer\n\n` +
        `Continue?`;

      if (!confirm(confirmMsg)) {
        await client.disconnect();
        setProcessing(null);
        return;
      }

      // Step 4: Clawback tokens from all holders
      console.log("Starting clawback process...");
      for (const holder of holders) {
        try {
          const clawbackTx = {
            TransactionType: "Clawback" as const,
            Account: token.issuerAddress,
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

      // Step 5: Send fair share XRP to each holder
      console.log("Sending fair share payments...");
      for (const share of fairShares) {
        try {
          const paymentTx = {
            TransactionType: "Payment" as const,
            Account: token.issuerAddress,
            Destination: share.address,
            Amount: xrpToDrops(share.xrpAmount.toFixed(6)),
            Memos: [
              {
                Memo: {
                  MemoType: Buffer.from("acquisition_payout", "utf8").toString("hex").toUpperCase(),
                  MemoData: Buffer.from(
                    `${share.tokenBalance} tokens for ${request.propertyName}`,
                    "utf8"
                  ).toString("hex").toUpperCase(),
                },
              },
            ],
          };

          const prepared = await client.autofill(paymentTx);
          const signed = issuerWallet.sign(prepared);
          const result = await client.submitAndWait(signed.tx_blob);

          console.log(`Payment to ${share.address}: ${result.result.meta?.TransactionResult}`);
        } catch (err) {
          console.error(`Failed to pay ${share.address}:`, err);
        }
      }

      // Step 6: Transfer all tokens to buyer
      console.log("Transferring tokens to buyer...");
      try {
        const transferTx = {
          TransactionType: "Payment" as const,
          Account: token.issuerAddress,
          Destination: request.buyerAddress,
          Amount: {
            currency: currency,
            issuer: token.issuerAddress,
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

      // Update request status
      const updatedRequests = requests.map((r) =>
        r.propertyTokenCode === request.propertyTokenCode && r.buyerAddress === request.buyerAddress
          ? { ...r, status: "completed" as const }
          : r
      );
      localStorage.setItem("acquisition_requests", JSON.stringify(updatedRequests));
      setRequests(updatedRequests);

      alert("Acquisition completed successfully!");
    } catch (err) {
      console.error("Acquisition processing error:", err);
      alert("Failed to process acquisition: " + (err as Error).message);

      // Update request status to failed
      const updatedRequests = requests.map((r) =>
        r.propertyTokenCode === request.propertyTokenCode && r.buyerAddress === request.buyerAddress
          ? { ...r, status: "failed" as const }
          : r
      );
      localStorage.setItem("acquisition_requests", JSON.stringify(updatedRequests));
      setRequests(updatedRequests);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-yellow-500 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Acquisition Requests</CardTitle>
          <Button variant="outline" size="sm" onClick={loadRequests}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No acquisition requests</div>
        ) : (
          <div className="space-y-4">
            {requests.map((request, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-4 ${
                  request.status === "pending"
                    ? "border-yellow-300 bg-yellow-50"
                    : request.status === "completed"
                    ? "border-green-300 bg-green-50"
                    : "border-red-300 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{request.propertyName}</h4>
                    <p className="text-sm text-gray-600">Token: {request.propertyTokenCode}</p>
                  </div>
                  <Badge
                    className={
                      request.status === "pending"
                        ? "bg-yellow-500"
                        : request.status === "completed"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }
                  >
                    {request.status}
                  </Badge>
                </div>

                <div className="space-y-1 text-sm text-gray-700 mb-4">
                  <p>
                    <span className="font-medium">Buyer:</span> {request.buyerAddress}
                  </p>
                  <p>
                    <span className="font-medium">Amount:</span> {request.requiredAmount} XRP (130% TVL)
                  </p>
                  <p>
                    <span className="font-medium">Submitted:</span>{" "}
                    {new Date(request.submittedAt).toLocaleString()}
                  </p>
                </div>

                {request.status === "pending" && (
                  <div className="space-y-3">
                    <div className="bg-white border border-orange-200 rounded p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                        <p className="text-xs text-orange-900">
                          Verify payment received before processing. This action will clawback all tokens from current
                          holders and distribute fair share to them.
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => processAcquisition(request)}
                      disabled={processing !== null}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      {processing === request.propertyTokenCode ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Process Acquisition
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
