import "./globals.css";
import Web3Provider from "../providers/Web3Provider";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { ThemeProvider } from "@/providers/ThemeProvider";
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
    "Piattaforma decentralizzata per NFT di micro-mobilità. Acquista, personalizza e utilizza veicoli sostenibili attraverso la tecnologia blockchain.",
  keywords: [
    "NFT",
    "micro-mobilità",
    "blockchain",
    "sostenibilità",
    "scooter elettrici",
    "bici elettriche",
    "monopattini elettrici",
    "Milano",
  ],
  authors: [{ name: "Moove Team" }],
  creator: "Moove NFT Platform",
  publisher: "Moove",
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "",
    title: "Moove NFT Platform - Mobilità Decentralizzata",
    description:
      "La nuova era della micro-mobilità urbana attraverso NFT e blockchain.",
    siteName: "Moove NFT Platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "Moove NFT Platform",
    description: "Mobilità decentralizzata con NFT",
    creator: "@MooveNFT",
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
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00D4AA" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
};

// Viewport configuration
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="it" className={`light ${inter.variable}`}>
      <head>
        {/* ✅ IPFS Gateways preconnect */}
        <link rel="preconnect" href="https://ipfs.io" />
        <link rel="preconnect" href="https://gateway.pinata.cloud" />
        <link rel="preconnect" href="https://cloudflare-ipfs.com" />

        {/* Favicon and icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Meta tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* ✅ Web3 related meta tags */}
        <meta name="ethereum-provider" content="rainbowkit" />
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
