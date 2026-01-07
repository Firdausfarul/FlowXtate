"use client";

import { WalletConnectDialog } from "@/components/wallet-connect-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, DollarSign, Shield, Zap, Users } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Building2,
      title: "Tokenized Properties",
      description: "Invest in real estate with fractional ownership through blockchain tokens",
    },
    {
      icon: TrendingUp,
      title: "Native DEX Trading",
      description: "Buy and sell property tokens seamlessly using XRPL's built-in DEX",
    },
    {
      icon: DollarSign,
      title: "Daily Dividends",
      description: "Receive rental income automatically streamed to your wallet daily",
    },
    {
      icon: Shield,
      title: "Secure & Transparent",
      description: "All transactions recorded on the XRP Ledger for complete transparency",
    },
    {
      icon: Zap,
      title: "Instant Settlement",
      description: "Lightning-fast transactions with minimal fees on XRPL",
    },
    {
      icon: Users,
      title: "Exit Strategy",
      description: "Unique acquisition feature allows full property buyouts with automatic payout",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-yellow-50 to-white py-20 sm:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20">
              Built on XRP Ledger
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Democratizing{" "}
              <span className="bg-gradient-to-r from-yellow-600 to-yellow-400 bg-clip-text text-transparent">
                Real Estate
              </span>{" "}
              Investment
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              FlowXtate enables fractional real estate ownership through tokenization on the XRP Ledger.
              Invest in properties, earn daily dividends, and trade with ease.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <WalletConnectDialog>
                <Button size="lg" className="gap-2 text-base">
                  Get Started
                </Button>
              </WalletConnectDialog>
              <Button size="lg" variant="outline" className="gap-2 text-base">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Why Choose FlowXtate?
            </h2>
            <p className="text-lg text-muted-foreground">
              Experience the future of real estate investment with cutting-edge blockchain technology
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 transition-all hover:border-primary/50 hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-yellow-50 py-20">
        <div className="container">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-yellow-600">$1M+</div>
              <div className="text-muted-foreground">Total Value Locked</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-yellow-600">500+</div>
              <div className="text-muted-foreground">Active Investors</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-yellow-600">15</div>
              <div className="text-muted-foreground">Properties Listed</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Start Investing?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Connect your wallet and explore tokenized real estate opportunities today
            </p>
            <WalletConnectDialog>
              <Button size="lg" className="gap-2 text-base">
                Connect Wallet
              </Button>
            </WalletConnectDialog>
          </div>
        </div>
      </section>
    </div>
  );
}
