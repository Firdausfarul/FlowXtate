"use client";

import { WalletConnectButton } from "@/components/wallet-connect-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, DollarSign, Shield, Zap, Users, ArrowRight, CheckCircle2, Coins, Clock } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Building2,
      title: "Tokenized Properties",
      description: "Own fractions of premium real estate starting at $10 through blockchain tokens",
    },
    {
      icon: TrendingUp,
      title: "Native DEX Trading",
      description: "Buy and sell property tokens 24/7 using XRPL's built-in decentralized exchange",
    },
    {
      icon: DollarSign,
      title: "Daily Dividends",
      description: "Earn rental income automatically distributed to your wallet every day",
    },
    {
      icon: Shield,
      title: "Secure & Transparent",
      description: "All transactions recorded immutably on the XRP Ledger for complete transparency",
    },
    {
      icon: Zap,
      title: "Instant Settlement",
      description: "Lightning-fast transactions with minimal fees ($0.01 average) on XRPL",
    },
    {
      icon: Users,
      title: "Exit Strategy",
      description: "Unique acquisition feature allows instant full property buyouts with automatic payout",
    },
  ];

  const properties = [
    { name: "Jakarta Office Tower", location: "Jakarta CBD", yield: "4.2%", price: "10 RLUSD", token: "PROP001" },
    { name: "Bali Luxury Villas", location: "Seminyak Beach", yield: "5.1%", price: "15 RLUSD", token: "PROP002" },
    { name: "Surabaya Mall", location: "City Center", yield: "3.8%", price: "25 RLUSD", token: "PROP003" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-white to-amber-50/30">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 h-72 w-72 bg-yellow-200/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 h-96 w-96 bg-amber-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container relative px-4 py-20 sm:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 bg-yellow-500 text-white hover:bg-yellow-600 text-sm font-semibold px-4 py-2">
              ✨ Built on XRP Ledger • Secure • Low Fees
            </Badge>
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-7xl text-gray-900">
              Invest in Real Estate
              <br />
              <span className="bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 bg-clip-text text-transparent">
                Starting at $10
              </span>
            </h1>
            <p className="mb-10 text-lg sm:text-xl max-w-2xl mx-auto text-gray-600 leading-relaxed">
              Own fractions of premium properties. Earn daily rental income. Trade 24/7 on-chain.
              <br />
              <strong className="text-yellow-700">No banks, no middlemen</strong>.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <WalletConnectButton>
                <Button size="lg" className="gap-2 text-base h-14 px-8 bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl transition-all">
                  <span className="text-xl">✖️</span>
                  Connect & Start Investing
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </WalletConnectButton>
              <Button size="lg" variant="outline" className="gap-2 text-base h-14 px-8 border-yellow-500 text-yellow-700 hover:bg-yellow-50">
                <Building2 className="h-5 w-5" />
                Browse Properties
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-yellow-600">3-5%</div>
                <div className="text-sm text-gray-600">Annual Yield</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-600">24/7</div>
                <div className="text-sm text-gray-600">Trading</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-600">$0.01</div>
                <div className="text-sm text-gray-600">Avg Fees</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl text-gray-900">
              How It <span className="text-yellow-600">Works</span>
            </h2>
            <p className="text-lg text-gray-600">
              Start investing in real estate in three simple steps
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500 text-white text-2xl font-bold shadow-lg">
                  1
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">Connect Crossmark</h3>
                <p className="text-gray-600">
                  Link your Crossmark wallet in seconds - no signup required
                </p>
              </div>
              <div className="hidden md:block absolute top-8 -right-4 text-4xl text-yellow-300">→</div>
            </div>
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500 text-white text-2xl font-bold shadow-lg">
                  2
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">Browse & Buy</h3>
                <p className="text-gray-600">
                  Choose properties and buy tokens directly on XRPL DEX
                </p>
              </div>
              <div className="hidden md:block absolute top-8 -right-4 text-4xl text-yellow-300">→</div>
            </div>
            <div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500 text-white text-2xl font-bold shadow-lg">
                  3
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">Earn Daily</h3>
                <p className="text-gray-600">
                  Receive rental income automatically streamed to your wallet
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-gradient-to-b from-yellow-50/50 to-white">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl text-gray-900">
              Featured <span className="text-yellow-600">Properties</span>
            </h2>
            <p className="text-lg text-gray-600">
              Premium real estate opportunities available now
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
            {properties.map((property, index) => (
              <Card key={index} className="overflow-hidden border-2 border-yellow-100 hover:border-yellow-400 transition-all hover:shadow-xl group">
                <div className="h-48 bg-gradient-to-br from-yellow-100 to-amber-200 flex items-center justify-center">
                  <Building2 className="h-24 w-24 text-yellow-500/30" />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <CardTitle className="text-lg text-gray-900">{property.name}</CardTitle>
                      <p className="text-sm text-gray-500">{property.location}</p>
                    </div>
                    <Badge className="bg-green-500 text-white">{property.yield}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Min. Investment</p>
                      <p className="text-lg font-bold text-yellow-600">{property.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Token</p>
                      <p className="text-sm font-mono font-semibold text-gray-900">{property.token}</p>
                    </div>
                  </div>
                  <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white" size="sm">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl text-gray-900">
              Why <span className="text-yellow-600">FlowXtate</span>?
            </h2>
            <p className="text-lg text-gray-600">
              The most advanced real estate investment platform on XRPL
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 border-yellow-100 transition-all hover:border-yellow-400 hover:shadow-xl group">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                      <Icon className="h-7 w-7 text-yellow-600" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-br from-yellow-500 to-amber-600 py-20 text-white">
        <div className="container px-4">
          <div className="grid gap-12 sm:grid-cols-3 max-w-4xl mx-auto">
            <div className="text-center">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <div className="mb-2 text-5xl font-bold">$1.2M+</div>
              <div className="text-yellow-100 text-lg">Total Value Locked</div>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <div className="mb-2 text-5xl font-bold">850+</div>
              <div className="text-yellow-100 text-lg">Active Investors</div>
            </div>
            <div className="text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <div className="mb-2 text-5xl font-bold">24</div>
              <div className="text-yellow-100 text-lg">Properties Listed</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32 bg-gradient-to-b from-yellow-50 to-white">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl text-gray-900">
              Start Building Your
              <br />
              <span className="text-yellow-600">Real Estate Portfolio</span>
            </h2>
            <p className="mb-10 text-xl text-gray-600 max-w-2xl mx-auto">
              Join hundreds of investors earning passive income through tokenized real estate on XRPL
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <WalletConnectButton>
                <Button size="lg" className="gap-2 text-lg bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl px-8 h-16">
                  <span className="text-2xl">✖️</span>
                  Connect Crossmark Now
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </WalletConnectButton>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600 flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                No KYC Required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Instant Trading
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Daily Dividends
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-yellow-200 py-12 bg-white">
        <div className="container px-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-transparent">
                FlowXtate
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Democratizing real estate investment on the XRP Ledger
            </p>
            <p className="text-xs text-gray-500">
              © 2024 FlowXtate. Built for hackathon purposes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
