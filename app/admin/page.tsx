"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Coins, Lock, Ban, Users } from "lucide-react";
import { IssueTokenDialog } from "@/components/admin/issue-token-dialog";
import { IssuedTokensList } from "@/components/admin/issued-tokens-list";
import { KYCApprovalDashboard } from "@/components/admin/kyc-approval-dashboard";

export default function AdminPage() {
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTokenIssued = () => {
    setShowIssueDialog(false);
    setRefreshKey(prev => prev + 1); // Refresh the issued tokens list
  };

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600 mt-1">Manage tokens, KYC, and user authorizations</p>
        </div>
        <Button
          size="lg"
          onClick={() => setShowIssueDialog(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          <Plus className="h-5 w-5 mr-2" />
          Issue New Token
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tokens" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-yellow-100">
          <TabsTrigger value="tokens" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
            <Coins className="h-4 w-4 mr-2" />
            Token Management
          </TabsTrigger>
          <TabsTrigger value="kyc" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            KYC & Approvals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="space-y-6">
          {/* Feature Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-2 border-yellow-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Coins className="h-8 w-8 text-yellow-600" />
                  <Badge className="bg-green-500 text-white">Active</Badge>
                </div>
                <CardTitle className="text-xl mt-2">Token Issuance</CardTitle>
                <CardDescription>
                  Create property tokens with custom supply and settings
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-yellow-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Lock className="h-8 w-8 text-yellow-600" />
                  <Badge className="bg-yellow-500 text-white">Enabled</Badge>
                </div>
                <CardTitle className="text-xl mt-2">Clawback</CardTitle>
                <CardDescription>
                  Retrieve tokens for acquisition scenarios
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-yellow-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Ban className="h-8 w-8 text-yellow-600" />
                  <Badge className="bg-blue-500 text-white">Enabled</Badge>
                </div>
                <CardTitle className="text-xl mt-2">Freeze</CardTitle>
                <CardDescription>
                  Freeze tokens or trustlines when needed
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Issued Tokens List */}
          <IssuedTokensList key={refreshKey} />
        </TabsContent>

        <TabsContent value="kyc" className="space-y-6">
          <KYCApprovalDashboard />
        </TabsContent>
      </Tabs>

      {/* Issue Token Dialog */}
      <IssueTokenDialog
        open={showIssueDialog}
        onOpenChange={setShowIssueDialog}
        onSuccess={handleTokenIssued}
      />
    </div>
  );
}
