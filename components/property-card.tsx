"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, Coins, Lock, Ban } from "lucide-react";
import Link from "next/link";

interface Property {
  propertyName: string;
  location: string;
  tokenCode: string;
  totalSupply: string;
  totalValuation: string;
  dailyYield: string;
  issuerAddress: string;
  distributionAddress?: string;
  pricePerToken?: string;
  createdAt: string;
  clawbackEnabled: boolean;
  freezeEnabled: boolean;
}

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const pricePerToken = property.pricePerToken
    ? parseFloat(property.pricePerToken)
    : property.totalValuation && property.totalSupply
    ? parseFloat(property.totalValuation) / parseFloat(property.totalSupply)
    : 0;

  const minInvestment = pricePerToken * 100; // Minimum 100 tokens

  return (
    <Link href={`/property?code=${property.tokenCode}`}>
      <Card className="border-2 border-yellow-200 hover:border-yellow-400 transition-all hover:shadow-lg cursor-pointer h-full flex flex-col">
        <CardHeader className="pb-4">
          {/* Property Image Placeholder */}
          <div className="w-full h-48 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg mb-4 flex items-center justify-center">
            <div className="text-6xl">🏢</div>
          </div>

          {/* Property Name & Location */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                {property.propertyName}
              </h3>
              <Badge className="bg-yellow-500 text-white hover:bg-yellow-600 font-mono shrink-0">
                {property.tokenCode}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{property.location}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-4">
          {/* Daily Yield */}
          {property.dailyYield && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-gray-600">Daily Yield</span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {property.dailyYield}%
                </span>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Price per Token</p>
              <p className="text-sm font-semibold text-gray-900">
                {pricePerToken > 0 ? `${pricePerToken.toFixed(6)} XRP` : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Min. Investment</p>
              <p className="text-sm font-semibold text-gray-900">
                {minInvestment > 0 ? `${minInvestment.toFixed(2)} XRP` : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Supply</p>
              <p className="text-sm font-semibold text-gray-900">
                {Number(property.totalSupply).toLocaleString()}
              </p>
            </div>
            {property.totalValuation && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Valuation</p>
                <p className="text-sm font-semibold text-gray-900">
                  {Number(property.totalValuation).toLocaleString()} XRP
                </p>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="flex gap-2">
            {property.clawbackEnabled && (
              <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Clawback
              </Badge>
            )}
            {property.freezeEnabled && (
              <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 text-xs">
                <Ban className="h-3 w-3 mr-1" />
                Freeze
              </Badge>
            )}
            <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-700 text-xs">
              <Coins className="h-3 w-3 mr-1" />
              DEX
            </Badge>
          </div>
        </CardContent>

        <CardFooter className="pt-4 border-t border-yellow-200">
          <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
            View Details & Buy
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
