"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Client } from "xrpl";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface AccountFlagsProps {
  issuerAddress: string;
}

export function CheckAccountFlags({ issuerAddress }: AccountFlagsProps) {
  const [loading, setLoading] = useState(false);
  const [flags, setFlags] = useState<any>(null);

  const checkFlags = async () => {
    setLoading(true);
    try {
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      const accountInfo = await client.request({
        command: 'account_info',
        account: issuerAddress,
        ledger_index: 'validated',
      });

      const accountFlags = accountInfo.result.account_data.Flags;

      // Flag bit masks (Ledger State Flags)
      const asfRequireDest = 0x00010000; // Bit 16 (lsfRequireDestTag)
      const asfRequireAuth = 0x00040000; // Bit 18 (lsfRequireAuth)
      const asfDisallowXRP = 0x00080000; // Bit 19 (lsfDisallowXRP)
      const asfDisableMaster = 0x00100000; // Bit 20 (lsfDisableMaster)
      const asfNoFreeze = 0x00200000; // Bit 21 (lsfNoFreeze)
      const asfGlobalFreeze = 0x00400000; // Bit 22 (lsfGlobalFreeze)
      const asfDefaultRipple = 0x00800000; // Bit 23 (lsfDefaultRipple)
      const asfDepositAuth = 0x01000000; // Bit 24 (lsfDepositAuth)
      const asfDisallowIncomingPayChan = 0x10000000; // Bit 28
      const asfAllowTrustLineClawback = 0x80000000; // Bit 31 (lsfAllowTrustLineClawback)

      setFlags({
        raw: accountFlags,
        RequireDest: (accountFlags & asfRequireDest) !== 0,
        RequireAuth: (accountFlags & asfRequireAuth) !== 0,
        DisallowXRP: (accountFlags & asfDisallowXRP) !== 0,
        DisableMaster: (accountFlags & asfDisableMaster) !== 0,
        NoFreeze: (accountFlags & asfNoFreeze) !== 0,
        GlobalFreeze: (accountFlags & asfGlobalFreeze) !== 0,
        DefaultRipple: (accountFlags & asfDefaultRipple) !== 0,
        DepositAuth: (accountFlags & asfDepositAuth) !== 0,
        DisallowIncomingPayChan: (accountFlags & asfDisallowIncomingPayChan) !== 0,
        AllowTrustLineClawback: (accountFlags & asfAllowTrustLineClawback) !== 0,
      });

      await client.disconnect();
    } catch (err) {
      console.error('Error checking flags:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasConflict = flags?.NoFreeze && flags?.AllowTrustLineClawback;

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Account Flags Debug</CardTitle>
          <Button
            onClick={checkFlags}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-purple-400"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Check Flags
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {flags && (
          <div className="space-y-4">
            {hasConflict && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 mb-1">FLAG CONFLICT DETECTED!</p>
                    <p className="text-sm text-red-700">
                      NoFreeze and AllowTrustLineClawback are both enabled. This is invalid and will cause tecNO_PERMISSION errors.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-2">Raw Flags Value</p>
              <p className="text-sm font-mono font-semibold text-gray-900">
                {flags.raw} (0x{flags.raw.toString(16).toUpperCase()})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FlagBadge
                name="AllowTrustLineClawback"
                enabled={flags.AllowTrustLineClawback}
                important={true}
                description="Required for clawback"
              />
              <FlagBadge
                name="RequireAuth"
                enabled={flags.RequireAuth}
                important={true}
                description="KYC/AML compliance"
              />
              <FlagBadge
                name="NoFreeze"
                enabled={flags.NoFreeze}
                important={true}
                description="Conflicts with clawback"
              />
              <FlagBadge
                name="GlobalFreeze"
                enabled={flags.GlobalFreeze}
                description="All trustlines frozen"
              />
              <FlagBadge
                name="RequireDest"
                enabled={flags.RequireDest}
                description="Destination tag required"
              />
              <FlagBadge
                name="DisallowXRP"
                enabled={flags.DisallowXRP}
                description="Cannot receive XRP"
              />
              <FlagBadge
                name="DefaultRipple"
                enabled={flags.DefaultRipple}
                description="Rippling enabled"
              />
              <FlagBadge
                name="DepositAuth"
                enabled={flags.DepositAuth}
                description="Requires deposit auth"
              />
              <FlagBadge
                name="DisallowIncomingPayChan"
                enabled={flags.DisallowIncomingPayChan}
                description="Wrong flag! (SetFlag 14)"
              />
            </div>
          </div>
        )}

        {!flags && (
          <p className="text-sm text-gray-600 text-center py-8">
            Click "Check Flags" to view account flags
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function FlagBadge({
  name,
  enabled,
  important,
  description,
}: {
  name: string;
  enabled: boolean;
  important?: boolean;
  description?: string;
}) {
  return (
    <div
      className={`p-3 rounded-lg border ${
        important
          ? enabled
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
          : enabled
          ? 'bg-blue-50 border-blue-200'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        {enabled ? (
          <CheckCircle2 className={`h-4 w-4 ${important ? 'text-green-600' : 'text-blue-600'}`} />
        ) : (
          <XCircle className={`h-4 w-4 ${important ? 'text-red-600' : 'text-gray-400'}`} />
        )}
        <p className="text-xs font-semibold text-gray-900">{name}</p>
      </div>
      {description && <p className="text-xs text-gray-600">{description}</p>}
    </div>
  );
}
