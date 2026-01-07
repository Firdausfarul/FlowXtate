"use client";

import { useWallet } from "@/lib/wallet-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// ADMIN ADDRESSES - Update ini dengan address admin yang sah
const ADMIN_ADDRESSES = [
  // Tambahkan address admin di sini
  // Contoh: "rN7n7otQDd6FczFgLdlqtyMVrn3HMbjqvK"
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { account, isConnected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not connected
    if (!isConnected) {
      router.push("/");
      return;
    }

    // Check if user is admin (for production, should check against database)
    // For now, allowing all connected users for demo purposes
    // Uncomment below for production:
    /*
    if (!ADMIN_ADDRESSES.includes(account?.address || "")) {
      router.push("/");
    }
    */
  }, [isConnected, account, router]);

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b-2 border-yellow-300 bg-white">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Property Token Management</p>
            </div>
            <div className="px-4 py-2 bg-yellow-50 border border-yellow-300 rounded-lg">
              <p className="text-xs text-gray-600">Admin</p>
              <p className="text-sm font-mono font-semibold text-gray-900">
                {account?.address.slice(0, 8)}...{account?.address.slice(-6)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="container px-4 py-8">
        {children}
      </div>
    </div>
  );
}
