"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Coins, Lock, Ban } from "lucide-react";
import { IssueTokenDialog } from "@/components/admin/issue-token-dialog";
import { IssuedTokensList } from "@/components/admin/issued-tokens-list";

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
          <h2 className="text-3xl font-bold text-gray-900">Token Management</h2>
          <p className="text-gray-600 mt-1">Issue and manage property tokens on XRPL</p>
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

      {/* Issue Token Dialog */}
      <IssueTokenDialog
        open={showIssueDialog}
        onOpenChange={setShowIssueDialog}
        onSuccess={handleTokenIssued}
      />
    </div>
  );
}
