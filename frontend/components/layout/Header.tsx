"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "../ui/Button";
import { clsx } from "clsx";
import WalletButton from "../wallet/WalletButton";

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
            <div className="text-2xl font-bold text-moove-primary">Moove</div>
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
                    ? "text-moove-primary border-b-2 border-moove-primary"
                    : "text-gray-700 hover:text-moove-primary"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <WalletButton />
        </div>
      </div>
    </header>
  );
}
