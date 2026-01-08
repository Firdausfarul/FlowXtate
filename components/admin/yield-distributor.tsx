"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { Client, Wallet, xrpToDrops } from "xrpl";

interface YieldRate {
  tokenCode: string;
  propertyName: string;
  dailyYieldRate: number;
  status: string;
  lastDistribution: string;
}

interface DistributionResult {
  tokenCode: string;
  status: "success" | "error" | "processing";
  message: string;
  totalDistributed?: number;
  recipientCount?: number;
}

export function YieldDistributor() {
  const [loading, setLoading] = useState(false);
  const [yieldRates, setYieldRates] = useState<YieldRate[]>([]);
  const [distributionResults, setDistributionResults] = useState<DistributionResult[]>([]);
  const [autoDistribute, setAutoDistribute] = useState(false);

  const fetchYieldRates = async () => {
    try {
      // Fetch from localStorage (in production, this would be a real API/database call)
      const storedTokens = localStorage.getItem('issued_tokens');
      if (!storedTokens) {
        setYieldRates([]);
        return;
      }

      const tokens = JSON.parse(storedTokens);

      // Convert tokens to yield rate format
      const rates: YieldRate[] = tokens.map((token: any) => ({
        tokenCode: token.tokenCode,
        propertyName: token.propertyName,
        dailyYieldRate: parseFloat(token.dailyYield) / 30, // Convert monthly to daily
        status: "active",
        lastDistribution: token.createdAt,
      }));

      setYieldRates(rates);

      // Also call the API to simulate the integration (logs only)
      try {
        const response = await fetch('/api/yield-rates');
        const data = await response.json();
        console.log('API response:', data);
      } catch (apiErr) {
        console.log('API call failed (non-critical in demo mode):', apiErr);
      }
    } catch (err) {
      console.error('Failed to fetch yield rates:', err);
      alert('Failed to fetch yield rates');
    }
  };

  const getTrustlineHolders = async (
    client: Client,
    issuerAddress: string,
    currencyCode: string
  ) => {
    try {
      const response = await client.request({
        command: 'account_lines',
        account: issuerAddress,
        ledger_index: 'validated',
      });

      // Filter for the specific currency and get holders with positive balances
      const holders = response.result.lines
        .filter((line: any) => line.currency === currencyCode)
        .map((line: any) => ({
          account: line.account,
          balance: parseFloat(line.balance) * -1, // Negative from issuer perspective
        }))
        .filter((holder: any) => holder.balance > 0);

      return holders;
    } catch (err) {
      console.error('Error fetching trustline holders:', err);
      return [];
    }
  };

  const distributeYield = async (tokenCode: string) => {
    setLoading(true);

    // Update result to processing
    setDistributionResults(prev => [
      ...prev.filter(r => r.tokenCode !== tokenCode),
      { tokenCode, status: "processing", message: "Processing distribution..." }
    ]);

    try {
      // Get token data from localStorage
      const storedTokens = localStorage.getItem('issued_tokens');
      if (!storedTokens) {
        throw new Error('No tokens found');
      }

      const tokens = JSON.parse(storedTokens);
      const token = tokens.find((t: any) => t.tokenCode === tokenCode);

      if (!token) {
        throw new Error(`Token ${tokenCode} not found`);
      }

      // Get yield rate
      const yieldRate = yieldRates.find(y => y.tokenCode === tokenCode);
      if (!yieldRate) {
        throw new Error(`Yield rate for ${tokenCode} not found`);
      }

      // Connect to XRPL
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      // Get issuer wallet
      const issuerWallet = Wallet.fromSeed(token.issuerSeed);

      // Convert currency code to hex
      const currencyCodeHex = token.currencyCodeHex ||
        Buffer.from(token.tokenCode.padEnd(3, '\0')).toString('hex').toUpperCase().padEnd(40, '0');

      // Get all trustline holders
      const holders = await getTrustlineHolders(client, issuerWallet.address, currencyCodeHex);

      if (holders.length === 0) {
        throw new Error('No token holders found');
      }

      // Calculate total supply held by users
      const totalHeld = holders.reduce((sum: number, h: any) => sum + h.balance, 0);

      // Distribute yield proportionally
      let totalDistributed = 0;
      const payments = [];

      for (const holder of holders) {
        // Calculate holder's share of daily yield
        const holderShare = (holder.balance / totalHeld) * yieldRate.dailyYieldRate;

        if (holderShare > 0) {
          const paymentTx: any = {
            TransactionType: 'Payment',
            Account: issuerWallet.address,
            Destination: holder.account,
            Amount: xrpToDrops(holderShare.toFixed(6)),
          };

          const prepared = await client.autofill(paymentTx);
          const signed = issuerWallet.sign(prepared);
          const result = await client.submitAndWait(signed.tx_blob);

          if (result.result.meta?.TransactionResult === 'tesSUCCESS') {
            totalDistributed += holderShare;
            payments.push({
              account: holder.account,
              amount: holderShare,
              status: 'success'
            });
          } else {
            payments.push({
              account: holder.account,
              amount: holderShare,
              status: 'failed'
            });
          }
        }
      }

      await client.disconnect();

      // Update distribution result
      setDistributionResults(prev => [
        ...prev.filter(r => r.tokenCode !== tokenCode),
        {
          tokenCode,
          status: "success",
          message: `Distributed ${totalDistributed.toFixed(6)} XRP to ${holders.length} holders`,
          totalDistributed,
          recipientCount: holders.length,
        }
      ]);

      // Save distribution record to localStorage
      const distributionRecord = {
        tokenCode,
        date: new Date().toISOString(),
        totalDistributed,
        recipientCount: holders.length,
        payments,
      };

      const storedDistributions = localStorage.getItem('yield_distributions') || '[]';
      const distributions = JSON.parse(storedDistributions);
      distributions.push(distributionRecord);
      localStorage.setItem('yield_distributions', JSON.stringify(distributions));

    } catch (err: any) {
      console.error('Distribution error:', err);
      setDistributionResults(prev => [
        ...prev.filter(r => r.tokenCode !== tokenCode),
        {
          tokenCode,
          status: "error",
          message: err.message || 'Distribution failed',
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const distributeAllYields = async () => {
    for (const yieldRate of yieldRates) {
      if (yieldRate.status === 'active') {
        await distributeYield(yieldRate.tokenCode);
        // Wait a bit between distributions
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "processing":
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-purple-500" />
          Automatic Yield Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-sm text-purple-900 font-semibold mb-1">Daily Yield Automation</p>
          <p className="text-xs text-purple-700">
            Fetch yield rates from API and automatically distribute XRP rewards to token holders
            based on their proportional holdings.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={fetchYieldRates}
            variant="outline"
            size="sm"
            className="border-purple-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Fetch Yield Rates
          </Button>
          <Button
            onClick={distributeAllYields}
            disabled={loading || yieldRates.length === 0}
            size="sm"
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Coins className="h-4 w-4 mr-2" />
            {loading ? 'Distributing...' : 'Distribute All'}
          </Button>
        </div>

        {/* Yield Rates */}
        {yieldRates.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Current Yield Rates</h4>
            {yieldRates.map((rate, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {rate.propertyName}
                    </span>
                    <Badge className="bg-purple-500 text-white font-mono text-xs">
                      {rate.tokenCode}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        rate.status === 'active'
                          ? 'border-green-300 bg-green-50 text-green-700 text-xs'
                          : 'border-gray-300 bg-gray-50 text-gray-700 text-xs'
                      }
                    >
                      {rate.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    Daily Rate: {rate.dailyYieldRate} XRP
                  </p>
                  <p className="text-xs text-gray-500">
                    Monthly: ~{(rate.dailyYieldRate * 30).toFixed(2)} XRP
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => distributeYield(rate.tokenCode)}
                  disabled={loading || rate.status !== 'active'}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  Distribute
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Distribution Results */}
        {distributionResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Distribution Results</h4>
            {distributionResults.map((result, index) => (
              <div
                key={index}
                className={`border rounded-lg p-3 ${
                  result.status === 'success'
                    ? 'border-green-200 bg-green-50'
                    : result.status === 'error'
                    ? 'border-red-200 bg-red-50'
                    : 'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-2">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{result.tokenCode}</span>
                      <Badge variant="outline" className="text-xs">
                        {result.recipientCount || 0} holders
                      </Badge>
                    </div>
                    <p className="text-xs">{result.message}</p>
                    {result.totalDistributed && (
                      <p className="text-xs font-semibold mt-1">
                        Total: {result.totalDistributed.toFixed(6)} XRP
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-900 font-semibold mb-1">Demo Mode</p>
          <p className="text-xs text-yellow-700">
            This is using a dummy API endpoint. In production, this would connect to a real
            backend service with proper scheduling (cron jobs) for automatic daily distributions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
