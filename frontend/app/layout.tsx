import "./globals.css";
import SimplifiedAppProvider from "../providers/SimplifiedAppProvider";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import RouteLoadingWrapper from "@/components/layout/RouteLoadingWrapper";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Inter } from "next/font/google";

// Font configuration
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// SEO Metadata
export const metadata = {
  title: {
    default: "Moove Mobility - NFT Vehicle Rental Platform",
    template: "%s | Moove Mobility",
  },
  description:
    "Revolutionary NFT-based vehicle rental platform on Sepolia Ethereum. Rent scooters, bikes, and vehicles using blockchain technology. Decentralized mobility solutions for developers and users.",
  keywords: [
    "NFT",
    "mobility",
    "vehicle rental",
    "scooter rental",
    "bike rental",
    "blockchain",
    "ethereum",
    "sepolia",
    "decentralized",
    "smart contracts",
    "Web3",
    "dApp",
    "cryptocurrency",
    "digital assets",
    "sustainable transport",
    "urban mobility",
  ],
  authors: [{ name: "Moove Mobility Team" }],
  creator: "Moove Mobility",
  publisher: "Moove Mobility",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // NOTE: Update this URL after Vercel deployment
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://moove-mobility.vercel.app"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Moove Mobility - NFT Vehicle Rental Platform",
    description:
      "Revolutionary NFT-based vehicle rental platform on Sepolia Ethereum. Rent scooters, bikes, and vehicles using blockchain technology.",
    siteName: "Moove Mobility",
    images: [
      {
        url: "/src/og/og.png",
        width: 1200,
        height: 630,
        alt: "Moove Mobility - NFT Vehicle Rental Platform",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

// Viewport configuration
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00d4aa" },
    { media: "(prefers-color-scheme: dark)", color: "#00d4aa" },
  ],
};

// JSON-LD Structured Data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Moove Mobility",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  description:
    "Revolutionary NFT-based vehicle rental platform on Sepolia Ethereum",
  offers: {
    "@type": "Offer",
    category: "Vehicle Rental",
  },
  featureList: [
    "NFT-based vehicle rentals",
    "Blockchain technology",
    "Decentralized mobility",
    "Smart contracts",
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <head>
        {/* JSON-LD for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`
        ${inter.className} 
        min-h-screen 
        bg-gradient-to-br from-gray-50 to-moove-50 
        text-gray-100 
        antialiased
        selection:bg-moove-primary/20 
        selection:text-moove-secondary
      `}
      >
        <SimplifiedAppProvider>
          {/* App main structure */}
          <div className="flex min-h-screen flex-col">
            {/* Header */}
            <Header />

            {/* Main content area */}
            <main className="flex-1 relative">
              {/* Theme-aware background pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,170,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,170,0.05),transparent_50%)] pointer-events-none" />

              {/* Page content */}
              <div className="relative z-10">{children}</div>
            </main>

            <Footer />
          </div>

          {/* Theme-aware loading overlay */}
          <div
            id="loading-overlay"
            className="hidden fixed inset-0 bg-black/50 dark:bg-black/70 z-50 items-center justify-center"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-moove-primary border-t-transparent"></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Loading...
                </span>
              </div>
            </div>
          </div>

          {/* Global modal container */}
          <div id="modal-root" />

          {/* Toast notifications container */}
          <div id="toast-root" className="fixed top-4 right-4 z-50 space-y-2" />

          {/* Route loading overlay */}
          <RouteLoadingWrapper />
        </SimplifiedAppProvider>

        {/* Vercel Analytics & Speed Insights */}
        <Analytics />
        <SpeedInsights />

        {/* Development helper scripts */}
        {process.env.NODE_ENV === "development" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.mooveDebug = {
                  showGrid: () => document.body.classList.toggle('debug-grid'),
                  darkMode: () => document.documentElement.classList.toggle('dark'),
                  clearStorage: () => {
                    localStorage.clear();
                    sessionStorage.clear();
                    console.log('✅ Storage cleared');
                  },
                  checkTheme: () => {
                    console.log('HTML classes:', document.documentElement.classList.toString());
                    console.log('Saved theme:', localStorage.getItem('moove-theme'));
                  },
                  checkWallet: () => {
                    console.log('Wallet state:', {
                      isConnected: window.ethereum?.isConnected?.() || false,
                      accounts: window.ethereum?.selectedAddress || null,
                      chainId: window.ethereum?.chainId || null,
                      wagmiStore: localStorage.getItem('moove-wagmi-store')
                    });
                  },
                  forceWalletReconnect: () => {
                    if (window.forceWalletReconnect) {
                      window.forceWalletReconnect();
                      console.log('✅ Reconnecting wallet...');
                    } else {
                      console.log('⚠️ Force reconnect not available yet');
                    }
                  }
                };
                console.log('🚀 Moove Debug Tools available:', Object.keys(window.mooveDebug));
                console.log('💡 Try: window.mooveDebug.checkWallet()');
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
