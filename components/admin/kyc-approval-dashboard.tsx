"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, User, Clock, Link2, FileText } from "lucide-react";
import { Client, Wallet } from "xrpl";

interface KYCSubmission {
  address: string;
  status: string;
  fullName: string;
  email: string;
  phone?: string;
  country?: string;
  documentType?: string;
  documentNumber?: string;
  dateOfBirth?: string;
  documentHash?: string;
  didDocument?: string;
  submittedAt: string;
}

interface TrustlineAuthRequest {
  userAddress: string;
  userName: string;
  tokenCode: string;
  propertyName: string;
  issuerAddress: string;
  currencyCodeHex: string;
  requestedAt: string;
}

export function KYCApprovalDashboard() {
  const [kycSubmissions, setKycSubmissions] = useState<KYCSubmission[]>([]);
  const [authRequests, setAuthRequests] = useState<TrustlineAuthRequest[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedKYC, setExpandedKYC] = useState<string | null>(null);

  useEffect(() => {
    loadKYCSubmissions();
    loadAuthRequests();
  }, []);

  const loadKYCSubmissions = () => {
    const storedKYC = localStorage.getItem('kyc_submissions') || '[]';
    const allKYC = JSON.parse(storedKYC);
    setKycSubmissions(allKYC.filter((k: KYCSubmission) => k.status === 'pending'));
  };

  const loadAuthRequests = () => {
    const pending = localStorage.getItem('pending_trustline_auth') || '[]';
    setAuthRequests(JSON.parse(pending));
  };

  const handleKYCApproval = async (submission: KYCSubmission, approve: boolean) => {
    setProcessing(submission.address);

    try {
      // Update KYC status
      const storedKYC = localStorage.getItem('kyc_submissions') || '[]';
      const allKYC = JSON.parse(storedKYC);
      const updatedKYC = allKYC.map((k: KYCSubmission) =>
        k.address === submission.address
          ? {
              ...k,
              status: approve ? 'approved' : 'rejected',
              approvedAt: approve ? new Date().toISOString() : undefined,
              rejectedAt: !approve ? new Date().toISOString() : undefined,
            }
          : k
      );

      localStorage.setItem('kyc_submissions', JSON.stringify(updatedKYC));
      loadKYCSubmissions();

      alert(`KYC ${approve ? 'approved' : 'rejected'} for ${submission.fullName}`);
    } catch (err) {
      console.error('KYC approval error:', err);
      alert('Failed to process KYC');
    } finally {
      setProcessing(null);
    }
  };

  const handleTrustlineAuthorization = async (request: TrustlineAuthRequest) => {
    setProcessing(request.userAddress + request.tokenCode);

    try {
      // Get issuer wallet from token
      const storedTokens = localStorage.getItem('issued_tokens');
      if (!storedTokens) throw new Error('No tokens found');

      const tokens = JSON.parse(storedTokens);
      const token = tokens.find((t: any) => t.issuerAddress === request.issuerAddress);
      if (!token || !token.issuerSeed) throw new Error('Issuer wallet not found');

      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();

      const issuerWallet = Wallet.fromSeed(token.issuerSeed);

      // Authorize trustline using TrustSet with tfSetfAuth flag
      const authorizeTx: any = {
        TransactionType: 'TrustSet',
        Account: issuerWallet.address,
        LimitAmount: {
          currency: request.currencyCodeHex,
          issuer: request.userAddress,
          value: '0', // Issuer sets 0 limit back to user
        },
        Flags: 0x00010000, // tfSetfAuth - authorize the trustline
        Fee: '12',
      };

      const result = await client.submitAndWait(authorizeTx, { wallet: issuerWallet });
      const resultMeta = result.result.meta as any;

      if (resultMeta?.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Authorization failed: ${resultMeta?.TransactionResult}`);
      }

      // Update user's trustline status
      const storedTrustlines = localStorage.getItem('user_trustlines') || '[]';
      const allTrustlines = JSON.parse(storedTrustlines);
      const updatedTrustlines = allTrustlines.map((t: any) =>
        t.issuerAddress === request.issuerAddress && t.tokenCode === request.tokenCode
          ? { ...t, status: 'authorized', authorizedAt: new Date().toISOString() }
          : t
      );
      localStorage.setItem('user_trustlines', JSON.stringify(updatedTrustlines));

      // Remove from pending auth queue
      const updatedRequests = authRequests.filter(
        r => !(r.userAddress === request.userAddress && r.tokenCode === request.tokenCode)
      );
      localStorage.setItem('pending_trustline_auth', JSON.stringify(updatedRequests));

      await client.disconnect();
      loadAuthRequests();

      alert(`Trustline authorized for ${request.userName}`);
    } catch (err: any) {
      console.error('Trustline authorization error:', err);
      alert(err.message || 'Failed to authorize trustline');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KYC Submissions */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-500" />
            Pending KYC Submissions ({kycSubmissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {kycSubmissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending KYC submissions
            </div>
          ) : (
            <div className="space-y-4">
              {kycSubmissions.map((submission) => (
                <div
                  key={submission.address}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {submission.fullName}
                      </h4>
                      <p className="text-sm text-gray-600 font-mono mb-1">
                        {submission.address}
                      </p>
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setExpandedKYC(
                          expandedKYC === submission.address ? null : submission.address
                        )
                      }
                    >
                      {expandedKYC === submission.address ? 'Hide' : 'View Details'}
                    </Button>
                  </div>

                  {expandedKYC === submission.address && (
                    <div className="mb-4 bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <p className="font-medium">{submission.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <p className="font-medium">{submission.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Country:</span>
                          <p className="font-medium">{submission.country || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">DOB:</span>
                          <p className="font-medium">{submission.dateOfBirth || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Document Type:</span>
                          <p className="font-medium">{submission.documentType || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Document Number:</span>
                          <p className="font-medium">{submission.documentNumber || 'N/A'}</p>
                        </div>
                      </div>

                      {submission.didDocument && (
                        <div className="pt-2 border-t">
                          <span className="text-xs text-gray-600">DID:</span>
                          <p className="text-xs font-mono text-purple-600 break-all">
                            {submission.didDocument}
                          </p>
                        </div>
                      )}

                      {submission.documentHash && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <FileText className="h-3 w-3" />
                          Document Hash: {submission.documentHash}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleKYCApproval(submission, true)}
                      disabled={processing === submission.address}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleKYCApproval(submission, false)}
                      disabled={processing === submission.address}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trustline Authorization Requests */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-green-500" />
            Trustline Authorization Requests ({authRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {authRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending trustline authorizations
            </div>
          ) : (
            <div className="space-y-3">
              {authRequests.map((request, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {request.userName}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {request.userAddress.substring(0, 8)}...
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-600">Property:</span>
                      <span className="text-sm font-medium">{request.propertyName}</span>
                      <Badge className="bg-yellow-500 text-white font-mono text-xs">
                        {request.tokenCode}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      Requested: {new Date(request.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleTrustlineAuthorization(request)}
                    disabled={processing === request.userAddress + request.tokenCode}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {processing === request.userAddress + request.tokenCode
                      ? 'Authorizing...'
                      : 'Authorize'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
