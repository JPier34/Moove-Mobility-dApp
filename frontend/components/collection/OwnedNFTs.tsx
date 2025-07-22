"use client";

import React, { useState } from "react";
import Button from "../ui/Button";
import { shortenAddress } from "../../utils/shortenAddress";

interface OwnedNFT {
  id: string;
  name: string;
  image: string;
  category: string;
  acquiredDate: Date;
  acquiredPrice: string;
  currentValue: string;
  isForSale: boolean;
  attributes: {
    range: string;
    speed: string;
    battery: string;
    condition: string;
  };
  source: "marketplace" | "auction";
}

interface OwnedNFTsProps {
  nfts: OwnedNFT[];
}

// Category emojis
const categoryEmojis = {
  scooter: "🛴",
  bike: "🚲",
  skateboard: "🛹",
  moped: "🛵",
};

export default function OwnedNFTs({ nfts }: OwnedNFTsProps) {
  const [selectedNFT, setSelectedNFT] = useState<OwnedNFT | null>(null);
  const [filter, setFilter] = useState<"all" | "for-sale" | "not-for-sale">(
    "all"
  );

  // Filter NFTs based on selected filter
  const filteredNFTs = nfts.filter((nft) => {
    if (filter === "for-sale") return nft.isForSale;
    if (filter === "not-for-sale") return !nft.isForSale;
    return true;
  });

  const handleSellNFT = (nft: OwnedNFT) => {
    // TODO: Implement sell NFT logic
    console.log("Selling NFT:", nft.id);
    alert(`Mettendo in vendita ${nft.name}...`);
  };

  const handleCreateAuction = (nft: OwnedNFT) => {
    // TODO: Implement create auction logic
    console.log("Creating auction for NFT:", nft.id);
    alert(`Creando asta per ${nft.name}...`);
  };

  const handleRemoveFromSale = (nft: OwnedNFT) => {
    // TODO: Implement remove from sale logic
    console.log("Removing from sale:", nft.id);
    alert(`Rimuovendo ${nft.name} dalla vendita...`);
  };

  if (nfts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🖼️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Nessun NFT posseduto
        </h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Non possiedi ancora nessun NFT. Visita il marketplace o partecipa alle
          aste per iniziare la tua collezione!
        </p>
        <div className="space-x-4">
          <Button onClick={() => (window.location.href = "/marketplace")}>
            Esplora Marketplace
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/auctions")}
          >
            Vai alle Aste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filtro:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-moove-primary focus:border-moove-primary"
          >
            <option value="all">Tutti gli NFT ({nfts.length})</option>
            <option value="for-sale">
              In vendita ({nfts.filter((n) => n.isForSale).length})
            </option>
            <option value="not-for-sale">
              Non in vendita ({nfts.filter((n) => !n.isForSale).length})
            </option>
          </select>
        </div>

        <div className="text-sm text-gray-500">
          Valore totale:{" "}
          {nfts
            .reduce((sum, nft) => sum + parseFloat(nft.currentValue), 0)
            .toFixed(3)}{" "}
          ETH
        </div>
      </div>

      {/* NFTs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNFTs.map((nft) => (
          <div
            key={nft.id}
            className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
          >
            {/* NFT Image */}
            <div className="aspect-square bg-gradient-to-br from-moove-50 to-moove-100 rounded-xl p-6 mb-4">
              <div className="w-full h-full bg-gradient-to-br from-moove-primary to-moove-secondary rounded-xl flex items-center justify-center text-6xl text-white">
                {categoryEmojis[nft.category as keyof typeof categoryEmojis] ||
                  "🚗"}
              </div>
            </div>

            {/* NFT Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{nft.name}</h3>
                {nft.isForSale && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    In vendita
                  </span>
                )}
              </div>

              {/* Attributes */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">🔋</span>
                  <span className="text-gray-700">{nft.attributes.range}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">⚡</span>
                  <span className="text-gray-700">{nft.attributes.speed}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">⭐</span>
                  <span className="text-gray-700">
                    {nft.attributes.condition}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">🔧</span>
                  <span className="text-gray-700">
                    {nft.attributes.battery}
                  </span>
                </div>
              </div>

              {/* Value info */}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-gray-500">Acquistato:</span>
                  <span className="font-medium">{nft.acquiredPrice} ETH</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-gray-500">Valore corrente:</span>
                  <span className="font-medium">{nft.currentValue} ETH</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-gray-500">P&L:</span>
                  <span
                    className={`font-medium ${
                      parseFloat(nft.currentValue) >=
                      parseFloat(nft.acquiredPrice)
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {parseFloat(nft.currentValue) >=
                    parseFloat(nft.acquiredPrice)
                      ? "+"
                      : ""}
                    {(
                      ((parseFloat(nft.currentValue) -
                        parseFloat(nft.acquiredPrice)) *
                        100) /
                      parseFloat(nft.acquiredPrice)
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  Acquisito{" "}
                  {nft.source === "auction" ? "in asta" : "nel marketplace"} il{" "}
                  {nft.acquiredDate.toLocaleDateString()}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {!nft.isForSale ? (
                  <>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleSellNFT(nft)}
                    >
                      Metti in vendita
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleCreateAuction(nft)}
                    >
                      Crea asta
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => handleRemoveFromSale(nft)}
                  >
                    Rimuovi dalla vendita
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNFTs.length === 0 && filter !== "all" && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔍</div>
          <div className="text-gray-500">
            Nessun NFT corrisponde al filtro selezionato
          </div>
        </div>
      )}
    </div>
  );
}
