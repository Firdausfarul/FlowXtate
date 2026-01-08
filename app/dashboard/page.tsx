"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, User, Shield, Plus } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";
import { KYCSubmissionForm } from "@/components/dashboard/kyc-submission-form";
import { TrustlineManager } from "@/components/dashboard/trustline-manager";
import { DIDManager } from "@/components/dashboard/did-manager";
import { useRouter } from "next/navigation";

export interface KYCData {
  address: string;
  status: "not_started" | "pending" | "approved" | "rejected";
  didDocument?: string;
  submittedAt?: string;
  approvedAt?: string;
  fullName?: string;
  email?: string;
  documentHash?: string;
}

export default function UserDashboard() {
  const { account, isConnected } = useWallet();
  const router = useRouter();
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [showKYCForm, setShowKYCForm] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }

    loadKYCData();
  }, [account, isConnected]);

  const loadKYCData = () => {
    if (!account) return;

    const storedKYC = localStorage.getItem('kyc_submissions');
    if (storedKYC) {
      const allKYC = JSON.parse(storedKYC);
      const userKYC = allKYC.find((k: KYCData) => k.address === account.address);
      setKycData(userKYC || { address: account.address, status: "not_started" });
    } else {
      setKycData({ address: account.address, status: "not_started" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-300">
            Not Started
          </Badge>
        );
    }
  };

  if (!isConnected || !account) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-yellow-300">
        <div className="container px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
              <p className="text-gray-600 font-mono text-sm">{account.address}</p>
            </div>
            <User className="h-12 w-12 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="container px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - KYC & DID */}
          <div className="lg:col-span-2 space-y-6">
            {/* KYC Status Card */}
            <Card className="border-2 border-yellow-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-yellow-500" />
                    KYC Verification
                  </CardTitle>
                  {kycData && getStatusBadge(kycData.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {kycData?.status === "not_started" && (
                  <div>
                    <p className="text-gray-600 mb-4">
                      Complete KYC verification to invest in tokenized real estate.
                      We use XRPL DID (Decentralized Identity) to secure your identity on-chain.
                    </p>
                    <Button
                      onClick={() => setShowKYCForm(true)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start KYC Verification
                    </Button>
                  </div>
                )}

                {kycData?.status === "pending" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-900 mb-2">
                      Your KYC submission is under review.
                    </p>
                    <p className="text-sm text-yellow-700">
                      Submitted: {kycData.submittedAt && new Date(kycData.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {kycData?.status === "approved" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-900 font-semibold mb-2">
                      KYC Verified
                    </p>
                    <p className="text-sm text-green-700 mb-1">
                      Name: {kycData.fullName}
                    </p>
                    <p className="text-sm text-green-700 mb-1">
                      Approved: {kycData.approvedAt && new Date(kycData.approvedAt).toLocaleDateString()}
                    </p>
                    {kycData.didDocument && (
                      <p className="text-xs text-green-600 mt-2 font-mono break-all">
                        DID: {kycData.didDocument}
                      </p>
                    )}
                  </div>
                )}

                {kycData?.status === "rejected" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-900 font-semibold mb-2">
                      KYC Rejected
                    </p>
                    <p className="text-sm text-red-700 mb-3">
                      Please contact support or submit a new application with correct information.
                    </p>
                    <Button
                      onClick={() => setShowKYCForm(true)}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Resubmit KYC
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* DID Manager */}
            <DIDManager kycData={kycData} onUpdate={loadKYCData} />

            {/* Trustline Manager - Only show if KYC approved */}
            {kycData?.status === "approved" && (
              <TrustlineManager kycData={kycData} />
            )}
          </div>

          {/* Right Column - Quick Stats */}
          <div className="space-y-6">
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">KYC Status</span>
                  <span className="text-sm font-semibold">
                    {kycData?.status === "approved" ? "✓ Verified" : "Unverified"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">DID Created</span>
                  <span className="text-sm font-semibold">
                    {kycData?.didDocument ? "✓ Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Trading Access</span>
                  <span className="text-sm font-semibold">
                    {kycData?.status === "approved" ? "✓ Enabled" : "Disabled"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">How it Works</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="font-bold text-yellow-600">1.</span>
                    <span>Submit KYC documents for verification</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-yellow-600">2.</span>
                    <span>Create DID on XRPL for decentralized identity</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-yellow-600">3.</span>
                    <span>Wait for admin approval</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-yellow-600">4.</span>
                    <span>Add trustlines to invest in properties</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-yellow-600">5.</span>
                    <span>Start trading property tokens on DEX</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* KYC Submission Modal */}
      {showKYCForm && (
        <KYCSubmissionForm
          onClose={() => setShowKYCForm(false)}
          onSubmit={loadKYCData}
        />
      )}
    </div>
  );
}
