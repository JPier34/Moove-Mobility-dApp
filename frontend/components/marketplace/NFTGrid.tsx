"use client";

import React, { useState } from "react";
import NFTCard from "./NFTCard";
import NFTModal from "./NFTModal";

export interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  currency: string;
  owner: string;
  category: string;
  attributes: {
    range: string;
    speed: string;
    battery: string;
    condition: string;
  };
  isForSale: boolean;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

interface NFTGridProps {
  nfts: NFT[];
  isLoading?: boolean;
}

export default function NFTGrid({ nfts, isLoading = false }: NFTGridProps) {
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-xl aspect-square mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (nfts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Nessun NFT trovato
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Non abbiamo trovato NFT che corrispondono ai tuoi criteri di ricerca.
          Prova a modificare i filtri o la ricerca.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* NFT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {nfts.map((nft) => (
          <NFTCard key={nft.id} nft={nft} onClick={() => setSelectedNFT(nft)} />
        ))}
      </div>

      {/* Page (placeholder for future implementation) */}
      {nfts.length > 0 && (
        <div className="flex justify-center items-center space-x-2 mt-12">
          <button
            disabled
            className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
          >
            ← Precedente
          </button>

          <div className="flex space-x-1">
            <button className="px-3 py-2 text-sm font-medium text-white bg-moove-primary rounded-lg">
              1
            </button>
            <button className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
              2
            </button>
            <button className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
              3
            </button>
          </div>

          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Successiva →
          </button>
        </div>
      )}

      {/* NFT details modal */}
      {selectedNFT && (
        <NFTModal
          nft={selectedNFT}
          isOpen={!!selectedNFT}
          onClose={() => setSelectedNFT(null)}
        />
      )}
    </>
  );
}
