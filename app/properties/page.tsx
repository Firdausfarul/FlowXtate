"use client";

import { useState, useEffect } from "react";
import { PropertyCard } from "@/components/property-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterYield, setFilterYield] = useState("all");

  useEffect(() => {
    // Load properties from localStorage
    const storedTokens = localStorage.getItem('issued_tokens');
    if (storedTokens) {
      const tokens = JSON.parse(storedTokens);
      setProperties(tokens);
      setFilteredProperties(tokens);
    }
  }, []);

  useEffect(() => {
    // Apply filters and search
    let filtered = [...properties];

    // Search by name or location
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tokenCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by yield
    if (filterYield !== "all") {
      filtered = filtered.filter((p) => {
        const yield_ = parseFloat(p.dailyYield || "0");
        if (filterYield === "low") return yield_ < 3;
        if (filterYield === "medium") return yield_ >= 3 && yield_ < 5;
        if (filterYield === "high") return yield_ >= 5;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "yield-high") {
        return parseFloat(b.dailyYield || "0") - parseFloat(a.dailyYield || "0");
      }
      if (sortBy === "yield-low") {
        return parseFloat(a.dailyYield || "0") - parseFloat(b.dailyYield || "0");
      }
      if (sortBy === "price-high") {
        return parseFloat(b.pricePerToken || "0") - parseFloat(a.pricePerToken || "0");
      }
      if (sortBy === "price-low") {
        return parseFloat(a.pricePerToken || "0") - parseFloat(b.pricePerToken || "0");
      }
      return 0;
    });

    setFilteredProperties(filtered);
  }, [searchQuery, sortBy, filterYield, properties]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b-2 border-yellow-300">
        <div className="container px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Property Marketplace
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Invest in tokenized real estate with daily yields. Buy, sell, and trade property tokens 24/7 on XRPL DEX.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="border-b border-yellow-200 bg-white">
        <div className="container px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by property name, location, or token code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-yellow-300 focus:ring-yellow-500"
              />
            </div>

            {/* Yield Filter */}
            <Select value={filterYield} onValueChange={setFilterYield}>
              <SelectTrigger className="w-full md:w-48 border-yellow-300">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by yield" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Yields</SelectItem>
                <SelectItem value="low">Low (&lt; 3%)</SelectItem>
                <SelectItem value="medium">Medium (3-5%)</SelectItem>
                <SelectItem value="high">High (&gt; 5%)</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 border-yellow-300">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="yield-high">Highest Yield</SelectItem>
                <SelectItem value="yield-low">Lowest Yield</SelectItem>
                <SelectItem value="price-high">Highest Price</SelectItem>
                <SelectItem value="price-low">Lowest Price</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredProperties.length} of {properties.length} properties
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="container px-4 py-8">
        {filteredProperties.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {properties.length === 0 ? "No Properties Yet" : "No Results Found"}
            </h3>
            <p className="text-gray-600">
              {properties.length === 0
                ? "Check back later for available property tokens"
                : "Try adjusting your search or filters"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property, index) => (
              <PropertyCard key={index} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
