"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Client, Wallet } from "xrpl";
import { RefreshCw, Snowflake, Wind, Ban, ExternalLink, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TokenData {
  propertyName: string;
  tokenCode: string;
  currencyCodeHex?: string;
  totalSupply: string;
  issuerAddress: string;
  issuerSeed: string;
  distributionAddress?: string;
  clawbackEnabled: boolean;
}

interface TrustlineHolder {
  account: string;
  balance: string;
  limit: string;
  frozen: boolean;
}

interface TrustlineHoldersListProps {
  token: TokenData;
}

export function TrustlineHoldersList({ token }: TrustlineHoldersListProps) {
  const [holders, setHolders] = useState<TrustlineHolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [globalFreezeEnabled, setGlobalFreezeEnabled] = useState(false);
  const [togglingGlobalFreeze, setTogglingGlobalFreeze] = useState(false);

  // Freeze dialog
  const [freezeDialog, setFreezeDialog] = useState<{
    open: boolean;
    holder: TrustlineHolder | null;
    action: "freeze" | "unfreeze";
  }>({ open: false, holder: null, action: "freeze" });
  const [freezing, setFreezing] = useState(false);

  // Clawback dialog
  const [clawbackDialog, setClawbackDialog] = useState<{
    open: boolean;
    holder: TrustlineHolder | null;
  }>({ open: false, holder: null });
  const [clawbackAmount, setClawbackAmount] = useState("");
  const [clawbacking, setClawbacking] = useState(false);

  const currencyCode = token.currencyCodeHex || token.tokenCode;

  const checkGlobalFreeze = async () => {
    try {
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      const accountInfo = await client.request({
        command: 'account_info',
        account: token.issuerAddress,
        ledger_index: 'validated',
      });

      // Check if asfGlobalFreeze flag (bit 7) is set
      const flags = accountInfo.result.account_data.Flags;
      const globalFreezeFlag = 0x00400000; // asfGlobalFreeze
      setGlobalFreezeEnabled((flags & globalFreezeFlag) !== 0);

      await client.disconnect();
    } catch (err: any) {
      console.error('Error checking global freeze:', err);
    }
  };

  const fetchTrustlines = async () => {
    setLoading(true);
    setError("");

    try {
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      // Get all accounts with trustlines to this issuer
      const response = await client.request({
        command: 'account_lines',
        account: token.issuerAddress,
        ledger_index: 'validated',
      });

      const trustlines: TrustlineHolder[] = response.result.lines
        .filter((line: any) => line.currency === currencyCode)
        .map((line: any) => ({
          account: line.account,
          balance: Math.abs(parseFloat(line.balance)).toString(),
          limit: line.limit,
          frozen: line.freeze === true || line.freeze_peer === true,
        }));

      setHolders(trustlines);
      await client.disconnect();
    } catch (err: any) {
      console.error('Error fetching trustlines:', err);
      setError(err.message || 'Failed to fetch trustlines');
    } finally {
      setLoading(false);
    }
  };

  const toggleGlobalFreeze = async () => {
    setTogglingGlobalFreeze(true);
    setError("");

    try {
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      const issuerWallet = Wallet.fromSeed(token.issuerSeed);

      // AccountSet to toggle Global Freeze flag
      const accountSetTx: any = {
        TransactionType: 'AccountSet',
        Account: token.issuerAddress,
        SetFlag: globalFreezeEnabled ? undefined : 7, // asfGlobalFreeze
        ClearFlag: globalFreezeEnabled ? 7 : undefined,
        Fee: '12',
      };

      const result = await client.submitAndWait(accountSetTx, { wallet: issuerWallet });

      if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Transaction failed: ${result.result.meta.TransactionResult}`);
      }

      await client.disconnect();

      // Refresh status
      await checkGlobalFreeze();
      await fetchTrustlines();
    } catch (err: any) {
      console.error('Error toggling global freeze:', err);
      setError(err.message || 'Failed to toggle global freeze');
    } finally {
      setTogglingGlobalFreeze(false);
    }
  };

  useEffect(() => {
    checkGlobalFreeze();
    fetchTrustlines();
  }, [token.issuerAddress, currencyCode]);

  const handleFreeze = async () => {
    if (!freezeDialog.holder) return;

    setFreezing(true);
    setError("");

    try {
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      const issuerWallet = Wallet.fromSeed(token.issuerSeed);

      // TrustSet transaction from issuer to freeze the trustline
      const trustSetTx: any = {
        TransactionType: 'TrustSet',
        Account: token.issuerAddress,
        LimitAmount: {
          currency: currencyCode,
          issuer: freezeDialog.holder.account,
          value: '0', // Issuer sets 0 limit back to holder
        },
        Flags: freezeDialog.action === 'freeze' ? 0x00040000 : 0x00080000, // tfSetFreeze or tfClearFreeze
        Fee: '12',
      };

      const result = await client.submitAndWait(trustSetTx, { wallet: issuerWallet });

      if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Transaction failed: ${result.result.meta.TransactionResult}`);
      }

      await client.disconnect();

      // Refresh holders list
      await fetchTrustlines();

      setFreezeDialog({ open: false, holder: null, action: "freeze" });
    } catch (err: any) {
      console.error('Error freezing trustline:', err);
      setError(err.message || 'Failed to freeze trustline');
    } finally {
      setFreezing(false);
    }
  };

  const handleClawback = async () => {
    if (!clawbackDialog.holder || !clawbackAmount) return;

    setClawbacking(true);
    setError("");

    try {
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      const issuerWallet = Wallet.fromSeed(token.issuerSeed);

      // Clawback transaction
      const clawbackTx: any = {
        TransactionType: 'Clawback',
        Account: token.issuerAddress,
        Amount: {
          currency: currencyCode,
          issuer: clawbackDialog.holder.account,
          value: clawbackAmount,
        },
        Fee: '12',
      };

      const result = await client.submitAndWait(clawbackTx, { wallet: issuerWallet });

      if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Transaction failed: ${result.result.meta.TransactionResult}`);
      }

      await client.disconnect();

      // Refresh holders list
      await fetchTrustlines();

      setClawbackDialog({ open: false, holder: null });
      setClawbackAmount("");
    } catch (err: any) {
      console.error('Error clawing back tokens:', err);
      setError(err.message || 'Failed to claw back tokens');
    } finally {
      setClawbacking(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-yellow-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Token Holders & Management</CardTitle>
            <div className="flex gap-2">
              {globalFreezeEnabled ? (
                <Button
                  onClick={toggleGlobalFreeze}
                  disabled={togglingGlobalFreeze}
                  variant="outline"
                  size="sm"
                  className="border-green-400 hover:bg-green-50 text-green-700"
                >
                  {togglingGlobalFreeze ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wind className="h-4 w-4 mr-2" />
                  )}
                  Unfreeze All
                </Button>
              ) : (
                <Button
                  onClick={toggleGlobalFreeze}
                  disabled={togglingGlobalFreeze}
                  variant="outline"
                  size="sm"
                  className="border-blue-400 hover:bg-blue-50 text-blue-700"
                >
                  {togglingGlobalFreeze ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Snowflake className="h-4 w-4 mr-2" />
                  )}
                  Freeze All
                </Button>
              )}
              <Button
                onClick={fetchTrustlines}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-yellow-400 hover:bg-yellow-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          {globalFreezeEnabled && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <Snowflake className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Global Freeze Active</p>
                <p className="text-sm text-blue-700">All trustlines for this token are frozen. No trading allowed.</p>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading && holders.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 animate-spin text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading token holders...</p>
            </div>
          ) : holders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Holders Yet</h3>
              <p className="text-gray-600">
                No accounts have created trustlines to this token yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {holders.map((holder, index) => (
                <Card key={index} className="border border-yellow-200 hover:border-yellow-400 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-mono text-gray-900 font-semibold">
                            {holder.account.slice(0, 8)}...{holder.account.slice(-6)}
                          </p>
                          {holder.frozen && (
                            <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 text-xs">
                              <Snowflake className="h-3 w-3 mr-1" />
                              Frozen
                            </Badge>
                          )}
                          <a
                            href={`https://testnet.xrpl.org/accounts/${holder.account}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-yellow-600 hover:text-yellow-700"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Balance: </span>
                            <span className="font-semibold text-gray-900">
                              {parseFloat(holder.balance).toLocaleString()} {token.tokenCode}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Trust Limit: </span>
                            <span className="font-semibold text-gray-900">
                              {parseFloat(holder.limit).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        {holder.frozen ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setFreezeDialog({ open: true, holder, action: "unfreeze" })}
                            className="border-blue-300 hover:bg-blue-50 text-blue-700"
                          >
                            <Wind className="h-4 w-4 mr-1" />
                            Unfreeze
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setFreezeDialog({ open: true, holder, action: "freeze" })}
                            className="border-blue-300 hover:bg-blue-50"
                          >
                            <Snowflake className="h-4 w-4 mr-1" />
                            Freeze
                          </Button>
                        )}

                        {token.clawbackEnabled && parseFloat(holder.balance) > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setClawbackDialog({ open: true, holder })}
                            className="border-red-300 hover:bg-red-50 text-red-700"
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Clawback
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Freeze Dialog */}
      <Dialog open={freezeDialog.open} onOpenChange={(open) => setFreezeDialog({ ...freezeDialog, open })}>
        <DialogContent className="bg-white border-2 border-blue-200">
          <DialogHeader>
            <DialogTitle>
              {freezeDialog.action === "freeze" ? "Freeze" : "Unfreeze"} Trustline
            </DialogTitle>
            <DialogDescription>
              {freezeDialog.action === "freeze"
                ? "This will prevent the account from trading this token until unfrozen."
                : "This will allow the account to trade this token again."}
            </DialogDescription>
          </DialogHeader>

          {freezeDialog.holder && (
            <div className="py-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">Account</p>
                <p className="text-sm font-mono font-semibold text-gray-900">
                  {freezeDialog.holder.account}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-sm font-semibold text-gray-900">
                  {parseFloat(freezeDialog.holder.balance).toLocaleString()} {token.tokenCode}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFreezeDialog({ open: false, holder: null, action: "freeze" })}
              disabled={freezing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFreeze}
              disabled={freezing}
              className={freezeDialog.action === "freeze" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}
            >
              {freezing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {freezeDialog.action === "freeze" ? <Snowflake className="h-4 w-4 mr-2" /> : <Wind className="h-4 w-4 mr-2" />}
                  {freezeDialog.action === "freeze" ? "Freeze" : "Unfreeze"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clawback Dialog */}
      <Dialog open={clawbackDialog.open} onOpenChange={(open) => setClawbackDialog({ ...clawbackDialog, open })}>
        <DialogContent className="bg-white border-2 border-red-200">
          <DialogHeader>
            <DialogTitle>Clawback Tokens</DialogTitle>
            <DialogDescription>
              Reclaim tokens from this account back to the issuer. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {clawbackDialog.holder && (
            <div className="py-4 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600">Account</p>
                <p className="text-sm font-mono font-semibold text-gray-900">
                  {clawbackDialog.holder.account}
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">Available Balance</p>
                <p className="text-lg font-bold text-gray-900">
                  {parseFloat(clawbackDialog.holder.balance).toLocaleString()} {token.tokenCode}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Clawback *
                </label>
                <Input
                  type="number"
                  value={clawbackAmount}
                  onChange={(e) => setClawbackAmount(e.target.value)}
                  placeholder="0.00"
                  max={parseFloat(clawbackDialog.holder.balance)}
                  className="border-red-300 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {parseFloat(clawbackDialog.holder.balance).toLocaleString()}
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-semibold">
                  ⚠️ Warning: This action cannot be undone
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setClawbackDialog({ open: false, holder: null });
                setClawbackAmount("");
              }}
              disabled={clawbacking}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClawback}
              disabled={
                clawbacking ||
                !clawbackAmount ||
                parseFloat(clawbackAmount) <= 0
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {clawbacking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Clawback Tokens
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
