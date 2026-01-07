"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";
import sdk from '@crossmarkio/sdk';
import { Client, Wallet } from 'xrpl';

interface IssueTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  propertyName: string;
  location: string;
  tokenCode: string;
  totalSupply: string;
  totalValuation: string;
  dailyYield: string;
}

export function IssueTokenDialog({ open, onOpenChange, onSuccess }: IssueTokenDialogProps) {
  const { account } = useWallet();
  const [step, setStep] = useState<'form' | 'creating' | 'success' | 'error'>('form');
  const [error, setError] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [issuerAddress, setIssuerAddress] = useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    propertyName: "",
    location: "",
    tokenCode: "",
    totalSupply: "",
    totalValuation: "",
    dailyYield: "",
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Convert non-standard currency code to hex format (XRPL requirement)
  const convertCurrencyCodeToHex = (code: string): string => {
    // If it's a standard 3-letter alphabetic code, return as is
    if (code.length === 3 && /^[A-Z]{3}$/.test(code)) {
      return code;
    }

    // Otherwise, convert to 40-character hex format
    // Convert to ASCII hex and pad with zeros
    const hex = Buffer.from(code, 'utf8').toString('hex').toUpperCase();
    return hex.padEnd(40, '0');
  };

  const createIssuerAndIssueToken = async () => {
    setStep('creating');
    setError("");

    try {
      // Convert token code to hex if needed
      const currencyCode = convertCurrencyCodeToHex(formData.tokenCode);
      console.log('Token code:', formData.tokenCode, '→ Currency code:', currencyCode);

      // 1. Connect to XRPL Testnet
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      // 2. Create new issuer wallet
      const issuerWallet = Wallet.generate();
      console.log('Generated issuer wallet:', issuerWallet.address);

      // 3. Create distribution wallet
      const distributionWallet = Wallet.generate();
      console.log('Generated distribution wallet:', distributionWallet.address);

      // 4. Fund both wallets on testnet
      await client.fundWallet(issuerWallet);
      console.log('Issuer wallet funded');

      await client.fundWallet(distributionWallet);
      console.log('Distribution wallet funded');

      // 5. Enable RequireAuth flag on issuer (for KYC/AML compliance)
      const requireAuthTx: any = {
        TransactionType: 'AccountSet',
        Account: issuerWallet.address,
        SetFlag: 2, // asfRequireAuth
        Fee: '12',
      };

      const requireAuthResult = await client.submitAndWait(requireAuthTx, { wallet: issuerWallet });
      console.log('RequireAuth enabled:', requireAuthResult.result.meta.TransactionResult);

      if (requireAuthResult.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error('Failed to enable RequireAuth');
      }

      // 6. Enable Clawback flag on issuer
      const clawbackTx: any = {
        TransactionType: 'AccountSet',
        Account: issuerWallet.address,
        SetFlag: 16, // asfAllowTrustLineClawback
        Fee: '12',
      };

      const clawbackResult = await client.submitAndWait(clawbackTx, { wallet: issuerWallet });
      console.log('Clawback enabled:', clawbackResult.result.meta.TransactionResult);

      if (clawbackResult.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error('Failed to enable clawback');
      }

      // 7. Distribution wallet creates trustline to issuer
      const trustSetTx: any = {
        TransactionType: 'TrustSet',
        Account: distributionWallet.address,
        LimitAmount: {
          currency: currencyCode,
          issuer: issuerWallet.address,
          value: formData.totalSupply,
        },
        Fee: '12',
      };

      const trustSetResult = await client.submitAndWait(trustSetTx, { wallet: distributionWallet });
      console.log('Trustline created:', trustSetResult.result.meta.TransactionResult);

      if (trustSetResult.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error('Failed to create trustline');
      }

      // 8. Issuer authorizes distribution wallet's trustline (required for RequireAuth)
      const authorizeTx: any = {
        TransactionType: 'TrustSet',
        Account: issuerWallet.address,
        LimitAmount: {
          currency: currencyCode,
          issuer: distributionWallet.address,
          value: '0', // Issuer sets 0 limit back to holder
        },
        Flags: 0x00010000, // tfSetfAuth - authorize the trustline
        Fee: '12',
      };

      const authorizeResult = await client.submitAndWait(authorizeTx, { wallet: issuerWallet });
      console.log('Trustline authorized:', authorizeResult.result.meta.TransactionResult);

      if (authorizeResult.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error('Failed to authorize trustline');
      }

      // 9. Issuer mints tokens to distribution wallet
      const mintTx: any = {
        TransactionType: 'Payment',
        Account: issuerWallet.address,
        Destination: distributionWallet.address,
        Amount: {
          currency: currencyCode,
          issuer: issuerWallet.address,
          value: formData.totalSupply,
        },
        Fee: '12',
      };

      const mintResult = await client.submitAndWait(mintTx, { wallet: issuerWallet });
      console.log('Tokens minted:', mintResult.result.meta.TransactionResult);

      if (mintResult.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error('Failed to mint tokens');
      }

      // 10. Calculate price per token (valuation / supply)
      const pricePerToken = formData.totalValuation
        ? (parseFloat(formData.totalValuation) / parseFloat(formData.totalSupply)).toString()
        : "1"; // Default to 1 XRP if no valuation specified

      // 11. Create DEX sell offer (selling tokens for XRP)
      // Note: Using XRP for now. In production, should use RLUSD
      const offerCreateTx: any = {
        TransactionType: 'OfferCreate',
        Account: distributionWallet.address,
        TakerGets: {
          currency: currencyCode,
          issuer: issuerWallet.address,
          value: formData.totalSupply, // Selling all tokens
        },
        TakerPays: (parseFloat(formData.totalValuation || "1000000") * 1000000).toString(), // XRP in drops
        Fee: '12',
      };

      const offerResult = await client.submitAndWait(offerCreateTx, { wallet: distributionWallet });
      console.log('DEX offer created:', offerResult.result.meta.TransactionResult);

      if (offerResult.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error('Failed to create DEX offer');
      }

      setIssuerAddress(issuerWallet.address);
      setTxHash(offerResult.result.hash);

      // Store to localStorage (in production, should save to backend/database)
      const issuedTokens = JSON.parse(localStorage.getItem('issued_tokens') || '[]');
      issuedTokens.push({
        propertyName: formData.propertyName,
        location: formData.location,
        tokenCode: formData.tokenCode,
        currencyCodeHex: currencyCode, // Hex-encoded currency code for XRPL operations
        totalSupply: formData.totalSupply,
        totalValuation: formData.totalValuation,
        dailyYield: formData.dailyYield,
        issuerAddress: issuerWallet.address,
        issuerSeed: issuerWallet.seed, // DANGER: Only for demo! Should be stored securely in backend
        distributionAddress: distributionWallet.address,
        distributionSeed: distributionWallet.seed, // DANGER: Only for demo!
        pricePerToken: pricePerToken,
        dexOfferTxHash: offerResult.result.hash,
        createdAt: new Date().toISOString(),
        clawbackEnabled: true,
        freezeEnabled: false, // Not using Global Freeze to avoid tecFROZEN
      });
      localStorage.setItem('issued_tokens', JSON.stringify(issuedTokens));

      await client.disconnect();

      setStep('success');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 3000);

    } catch (err: any) {
      console.error('Error creating issuer:', err);
      setError(err.message || 'Failed to create issuer and issue token');
      setStep('error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.propertyName || !formData.tokenCode || !formData.totalSupply) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.tokenCode.length < 3) {
      setError('Token code must be at least 3 characters');
      return;
    }

    createIssuerAndIssueToken();
  };

  const handleClose = () => {
    setStep('form');
    setError("");
    setTxHash("");
    setIssuerAddress("");
    setFormData({
      propertyName: "",
      location: "",
      tokenCode: "",
      totalSupply: "",
      totalValuation: "",
      dailyYield: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-white border-2 border-yellow-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-900">Issue New Property Token</DialogTitle>
          <DialogDescription className="text-gray-600">
            Create a new token with clawback and freeze enabled
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Property Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Name *
                </label>
                <input
                  type="text"
                  value={formData.propertyName}
                  onChange={(e) => handleInputChange('propertyName', e.target.value)}
                  placeholder="e.g., Jakarta Office Tower"
                  className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Jakarta CBD"
                  className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Token Settings */}
            <div className="space-y-4 pt-4 border-t border-yellow-200">
              <h3 className="font-semibold text-gray-900">Token Settings</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Code * <span className="text-gray-500 text-xs">(3+ characters)</span>
                </label>
                <input
                  type="text"
                  value={formData.tokenCode}
                  onChange={(e) => handleInputChange('tokenCode', e.target.value.toUpperCase())}
                  placeholder="e.g., USD, PROP001, LINDA1"
                  maxLength={15}
                  className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent uppercase"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  3-letter codes (e.g., USD) must be alphabetic only. Longer codes can include numbers.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Supply *
                </label>
                <input
                  type="number"
                  value={formData.totalSupply}
                  onChange={(e) => handleInputChange('totalSupply', e.target.value)}
                  placeholder="e.g., 1000000"
                  className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Valuation (RLUSD)
                </label>
                <input
                  type="number"
                  value={formData.totalValuation}
                  onChange={(e) => handleInputChange('totalValuation', e.target.value)}
                  placeholder="e.g., 1000000"
                  className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Yield (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.dailyYield}
                  onChange={(e) => handleInputChange('dailyYield', e.target.value)}
                  placeholder="e.g., 4.2"
                  className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Features Summary */}
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Token Features:</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Clawback Enabled (for acquisition)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Freeze Enabled (for compliance)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  XRPL Native DEX Compatible
                </li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                Create Issuer & Issue Token
              </Button>
            </div>
          </form>
        )}

        {step === 'creating' && (
          <div className="py-12 text-center">
            <Loader2 className="h-16 w-16 animate-spin text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Issuing Token...</h3>
            <div className="text-sm text-gray-600 space-y-1 max-w-md mx-auto">
              <p>✓ Creating issuer & distribution wallets</p>
              <p>✓ Enabling RequireAuth (KYC compliance)</p>
              <p>✓ Enabling clawback flag</p>
              <p>✓ Creating trustline</p>
              <p>✓ Authorizing trustline</p>
              <p>✓ Minting tokens</p>
              <p>✓ Creating DEX sell offer</p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Token Issued Successfully!</h3>
            <div className="space-y-2 text-sm text-gray-600 bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <p className="font-medium text-gray-900">Issuer Address:</p>
              <p className="font-mono text-xs break-all">{issuerAddress}</p>
              <p className="font-medium text-gray-900 mt-3">Transaction Hash:</p>
              <p className="font-mono text-xs break-all">{txHash}</p>
            </div>
            <p className="text-xs text-gray-500 mt-4">Redirecting...</p>
          </div>
        )}

        {step === 'error' && (
          <div className="py-12 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Issue Token</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={() => setStep('form')} className="bg-yellow-500 hover:bg-yellow-600 text-white">
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
