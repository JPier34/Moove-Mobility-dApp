"use client";

import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import LocationIndicator from "@/components/layout/LocationIndicator";
import { useTheme } from "@/providers/ThemeProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { useUserRoles } from "@/hooks/useContract";

export default function Header() {
  const pathname = usePathname();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { address, isConnected } = useAccount();
  const {
    isMasterAdmin,
    canMint,
    isLoading: rolesLoading,
  } = useUserRoles(address);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px - hide header
        setIsVisible(false);
      } else {
        // Scrolling up or at top - show header
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { label: "Marketplace", href: "/marketplace" },
    { label: "Auctions", href: "/auctions" },
    { label: "My Collection", href: "/my-collection" },
  ];

  // Admin items - only visible to users with admin permissions
  const adminItems = [{ label: "Admin Panel", href: "/admin", icon: "⚙️" }];

  // Check if user has admin access
  const hasAdminAccess =
    isConnected && !rolesLoading && (isMasterAdmin || canMint);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-full px-2 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center mr-2">
            <div className="text-2xl md:text-xl font-bold overflow-hidden text-moove-primary">
              m
              <span className="inline-block w-6 h-6 border-2 border-current rounded-full mx-1"></span>
              <span className="inline-block w-6 h-6 border-2 border-current rounded-full mr-1"></span>
              v e
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center md:space-x-5">
            {navItems.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 dark:text-gray-300 hover:text-moove-primary dark:hover:text-moove-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {/* Admin Section - Only visible to admins */}
            {hasAdminAccess && (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-300 dark:border-gray-600">
                {adminItems.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center space-x-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-medium"
                    title="Admin Panel"
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Location Indicator */}
            <LocationIndicator />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-300 dark:border-gray-600"
              title={`Switch to ${
                resolvedTheme === "dark" ? "light" : "dark"
              } mode`}
            >
              {resolvedTheme === "dark" ? "☀️" : "🌙"}
            </button>

            {/* Custom Connect Button for Wagmi v2 */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      "aria-hidden": true,
                      style: {
                        opacity: 0,
                        pointerEvents: "none",
                        userSelect: "none",
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            className="bg-moove-primary text-white px-4 py-2 rounded-lg hover:bg-moove-primary/90 transition-colors"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Wrong Network
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={openChainModal}
                            className="flex items-center bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-sm font-medium"
                          >
                            {chain.hasIcon && chain.iconUrl && (
                              <img
                                alt={chain.name ?? "Chain icon"}
                                src={chain.iconUrl}
                                className="w-4 h-4 mr-2"
                              />
                            )}
                            {chain.name}
                          </button>

                          <button
                            onClick={openAccountModal}
                            className="bg-moove-primary text-white px-4 py-2 rounded-lg hover:bg-moove-primary/90 transition-colors"
                          >
                            {account.displayName}
                            {account.displayBalance &&
                              ` (${account.displayBalance})`}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span
                  className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${
                    isMobileMenuOpen
                      ? "rotate-45 translate-y-1"
                      : "-translate-y-0.5"
                  }`}
                ></span>
                <span
                  className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${
                    isMobileMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                ></span>
                <span
                  className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${
                    isMobileMenuOpen
                      ? "-rotate-45 -translate-y-1"
                      : "translate-y-0.5"
                  }`}
                ></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-4">
            <div className="flex flex-col space-y-4">
              {/* Mobile Location Indicator */}
              <div className="px-2 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Current Location:
                </div>
                <LocationIndicator />
              </div>

              {navItems.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-600 dark:text-gray-300 hover:text-moove-primary dark:hover:text-moove-primary transition-colors px-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Admin Section - Only visible to admins */}
              {hasAdminAccess && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-2">
                    Admin Access:
                  </div>
                  {adminItems.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors px-2 font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Mobile theme toggle */}
              <div className="flex items-center justify-between px-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={toggleTheme}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300"
                >
                  <span>{resolvedTheme === "dark" ? "☀️" : "🌙"}</span>
                  <span>
                    {resolvedTheme === "dark" ? "Light" : "Dark"} Mode
                  </span>
                </button>
              </div>

              <div className="px-2">
                <ConnectButton />
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
