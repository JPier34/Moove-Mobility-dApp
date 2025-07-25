import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:from-gray-600 dark:via-gray-600 dark:to-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Moove NFT
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Decentralized platform for micro-mobility vehicle NFTs. Rent, own,
              and customize your urban transportation.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white  mb-4">
              Platform
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/marketplace"
                  className="text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400"
                >
                  Marketplace
                </Link>
              </li>
              <li>
                <Link
                  href="/auctions"
                  className="text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400"
                >
                  Auctions
                </Link>
              </li>
              <li>
                <Link
                  href="/my-collection"
                  className="text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400"
                >
                  My Collection
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Contact
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>support@moove.io</li>
              <li>Milan, Italy</li>
              <li>+39 02 1234 5678</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © 2024 Moove NFT Platform. Built for blockchain innovation.
          </p>
        </div>
      </div>
    </footer>
  );
}
