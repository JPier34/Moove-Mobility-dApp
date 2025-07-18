"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletButton from "../wallet/WalletButton";
import { clsx } from "clsx";

const navigation = [
  { name: "Marketplace", href: "/marketplace" },
  { name: "Auctions", href: "/auctions" },
  { name: "My Collection", href: "/my-collection" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="text-2xl font-bold text-teal-600">Moove</div>
            <span className="ml-2 text-sm text-gray-500">NFT</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "text-teal-600 border-b-2 border-teal-600"
                    : "text-gray-700 hover:text-teal-600"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Wallet Button */}
          <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
            Connect Wallet
          </button>
        </div>
      </div>
    </header>
  );
}
