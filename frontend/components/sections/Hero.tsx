"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";

export default function Hero() {
  const router = useRouter();

  const handleExploreClick = () => {
    router.push("/marketplace");
  };

  const handleLearnMoreClick = () => {
    router.push("/about");
  }; // unused but can be used for future enhancements

  return (
    <section className="pt-24 pb-16 bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 bg-[#00D4AA]/10 rounded-full border border-[#00D4AA]/20">
                <span className="text-[#00D4AA] font-semibold text-sm">
                  🚀 Il Futuro è Qui
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-black leading-tight">
                <span className="text-gray-900">Mobilità</span>
                <br />
                <span className="bg-gradient-to-r from-[#00D4AA] to-[#0052CC] bg-clip-text text-transparent">
                  Decentralizzata
                </span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Acquista, personalizza e utilizza NFT per accedere alla flotta
                di veicoli sostenibili Moove. Una nuova era di mobilità urbana.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={handleExploreClick} className="group">
                Esplora Marketplace
                <svg
                  className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/auctions")}
              >
                Vedi Aste Live
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
              <div>
                <div className="text-2xl font-bold text-gray-900">1,247</div>
                <div className="text-sm text-gray-600">NFT Attivi</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">89</div>
                <div className="text-sm text-gray-600">Aste Live</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">742</div>
                <div className="text-sm text-gray-600">Utenti</div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative z-10">
              {/* Main NFT Card */}
              <div className="bg-white rounded-3xl p-6 shadow-2xl transform hover:scale-105 transition-transform duration-500">
                <div className="bg-gradient-to-br from-[#00D4AA] to-[#0052CC] rounded-2xl h-64 flex items-center justify-center mb-6">
                  <span className="text-white text-6xl">🛴</span>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Electric Scooter #001
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Range:</span>
                      <span className="font-semibold text-gray-900">25km</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Speed:</span>
                      <span className="font-semibold text-gray-900">
                        25km/h
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-2xl font-bold text-gray-900">
                      0.5 ETH
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Disponibile
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00D4AA]/20 to-[#0052CC]/20 rounded-full blur-3xl transform scale-150"></div>
            <div className="absolute top-10 right-10 w-20 h-20 bg-[#FF6B35]/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-10 left-10 w-16 h-16 bg-[#00D4AA]/30 rounded-full blur-lg animate-bounce"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
