import "./globals.css";
import Web3Provider from "../providers/Web3Provider";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { ThemeProvider } from "@/providers/ThemeProvider";
import RouteLoadingWrapper from "@/components/layout/RouteLoadingWrapper";
import { Inter } from "next/font/google";

// Font config
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// SEO Metadata
export const metadata = {
  title: {
    default: "Moove NFT Platform",
    template: "%s | Moove NFT Platform",
  },
  description:
    "Decentralized mobility platform for NFT-based vehicle rental passes",
  keywords: [
    "NFT",
    "mobility",
    "rental",
    "blockchain",
    "ethereum",
    "decentralized",
    "vehicle",
    "scooter",
    "bike",
  ],
  authors: [{ name: "Moove Team" }],
  creator: "Moove",
  publisher: "Moove",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://moove-nft.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://moove-nft.vercel.app",
    title: "Moove NFT Platform",
    description:
      "Decentralized mobility platform for NFT-based vehicle rental passes",
    siteName: "Moove NFT Platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "Moove NFT Platform",
    description:
      "Decentralized mobility platform for NFT-based vehicle rental passes",
    creator: "@moove",
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
  verification: {
    google: "your-google-verification-code",
  },
};

// Viewport configuration
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00d4aa" },
    { media: "(prefers-color-scheme: dark)", color: "#00d4aa" },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#00d4aa" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Moove" />
        <meta name="msapplication-TileColor" content="#00d4aa" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="web3-provider" content="wagmi" />
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
        <ThemeProvider>
          <Web3Provider>
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
                    Caricamento...
                  </span>
                </div>
              </div>
            </div>

            {/* Global modal container */}
            <div id="modal-root" />

            {/* Toast notifications container */}
            <div
              id="toast-root"
              className="fixed top-4 right-4 z-50 space-y-2"
            />

            {/* Route loading overlay */}
            <RouteLoadingWrapper />
          </Web3Provider>
        </ThemeProvider>

        {/* Enhanced analytics and debug tools */}
        {process.env.NODE_ENV === "production" && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  console.log('Moove NFT Platform loaded');
                  
                  // Track Web3 connection events
                  window.addEventListener('web3-connected', (e) => {
                    console.log('Web3 Connected:', e.detail);
                  });
                  
                  // Track theme changes
                  window.addEventListener('theme-changed', (e) => {
                    console.log('Theme Changed:', e.detail);
                  });
                `,
              }}
            />
          </>
        )}

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
                    console.log('Storage cleared');
                  },
                  checkTheme: () => {
                    console.log('HTML classes:', document.documentElement.classList.toString());
                    console.log('Saved theme:', localStorage.getItem('moove-theme'));
                  }
                };
                console.log('🚀 Moove Debug Tools:', window.mooveDebug);
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
