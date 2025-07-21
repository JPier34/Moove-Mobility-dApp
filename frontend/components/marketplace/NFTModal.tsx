"use client";

import React, { useEffect, useState } from "react";
import { NFT } from "./NFTGrid";
import Button from "../ui/Button";
import { useWeb3Context } from "../../providers/Web3Provider";

interface NFTModalProps {
  nft: NFT;
  isOpen: boolean;
  onClose: () => void;
}

// Mapping per le emoji delle categorie
const categoryEmojis = {
  scooter: "🛴",
  bike: "🚲",
  skateboard: "🛹",
  moped: "🛵",
};

export default function NFTModal({ nft, isOpen, onClose }: NFTModalProps) {
  const { isConnected, account, shortenAddress } = useWeb3Context();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "details" | "history" | "attributes"
  >("details");

  // Chiudi modal con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handlePurchase = async () => {
    if (!isConnected) {
      alert("Connetti il wallet per acquistare");
      return;
    }

    setIsPurchasing(true);
    try {
      // TODO: Implementare logica di acquisto con smart contract
      console.log("Purchasing NFT:", nft.id);

      // Simulazione acquisto
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert("Acquisto completato con successo!");
      onClose();
    } catch (error) {
      console.error("Error purchasing NFT:", error);
      alert("Errore durante l'acquisto");
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleMakeOffer = () => {
    if (!isConnected) {
      alert("Connetti il wallet per fare un'offerta");
      return;
    }
    // TODO: Implementare logica per fare offerte
    console.log("Making offer for NFT:", nft.id);
    alert("Funzionalità in arrivo!");
  };

  const isOwner = account && account.toLowerCase() === nft.owner.toLowerCase();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header del modal */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">{nft.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Contenuto principale */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* Colonna sinistra - Immagine e gallery */}
            <div className="space-y-4">
              {/* Immagine principale */}
              <div className="aspect-square bg-gradient-to-br from-moove-50 to-moove-100 rounded-xl p-8">
                <div className="w-full h-full bg-gradient-to-br from-moove-primary to-moove-secondary rounded-xl flex items-center justify-center text-8xl text-white">
                  {categoryEmojis[
                    nft.category as keyof typeof categoryEmojis
                  ] || "🚗"}
                </div>
              </div>

              {/* Thumbnail gallery (placeholder) */}
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gray-100 rounded-lg p-2"
                  >
                    <div className="w-full h-full bg-gradient-to-br from-moove-primary/20 to-moove-secondary/20 rounded flex items-center justify-center text-2xl">
                      {categoryEmojis[
                        nft.category as keyof typeof categoryEmojis
                      ] || "🚗"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Colonna destra - Dettagli e azioni */}
            <div className="space-y-6">
              {/* Info di base */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-2 py-1 bg-moove-100 text-moove-700 rounded-full text-sm font-medium">
                    {nft.category.charAt(0).toUpperCase() +
                      nft.category.slice(1)}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-sm font-medium ${
                      nft.rarity === "legendary"
                        ? "bg-yellow-100 text-yellow-800"
                        : nft.rarity === "epic"
                        ? "bg-purple-100 text-purple-800"
                        : nft.rarity === "rare"
                        ? "bg-blue-100 text-blue-800"
                        : nft.rarity === "uncommon"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {nft.rarity.charAt(0).toUpperCase() + nft.rarity.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {nft.description}
                </p>
              </div>

              {/* Proprietario */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Proprietario</div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-moove-primary rounded-full flex items-center justify-center text-white text-sm">
                    {nft.owner.slice(2, 4).toUpperCase()}
                  </div>
                  <span className="font-mono text-gray-900">{nft.owner}</span>
                  {isOwner && (
                    <span className="px-2 py-1 bg-moove-100 text-moove-700 rounded-full text-xs">
                      Tuo
                    </span>
                  )}
                </div>
              </div>

              {/* Prezzo */}
              <div className="bg-gradient-to-r from-moove-50 to-moove-100 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">
                  Prezzo corrente
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {nft.price}
                  </span>
                  <span className="text-xl text-gray-600">{nft.currency}</span>
                  <span className="text-sm text-gray-500">
                    (≈ ${(parseFloat(nft.price) * 2000).toLocaleString()} USD)
                  </span>
                </div>
              </div>

              {/* Tabs per dettagli */}
              <div>
                <div className="flex border-b border-gray-200 mb-4">
                  {[
                    { id: "details", label: "Dettagli" },
                    { id: "attributes", label: "Attributi" },
                    { id: "history", label: "Storia" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-moove-primary text-moove-primary"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Contenuto tabs */}
                {activeTab === "details" && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Token ID</span>
                      <span className="font-mono">#{nft.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Categoria</span>
                      <span>{nft.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rarità</span>
                      <span>{nft.rarity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stato</span>
                      <span>
                        {nft.isForSale ? "In vendita" : "Non in vendita"}
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === "attributes" && (
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(nft.attributes).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-500 mb-1">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </div>
                        <div className="font-medium text-gray-900">{value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-500">
                      Storia delle transazioni
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm">Creazione</span>
                        <span className="text-sm text-gray-500">
                          30 giorni fa
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm">Primo acquisto</span>
                        <span className="text-sm text-gray-500">
                          25 giorni fa
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm">Ultima vendita</span>
                        <span className="text-sm text-gray-500">
                          15 giorni fa
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Azioni */}
              {!isOwner && nft.isForSale && (
                <div className="flex space-x-3">
                  <Button
                    onClick={handlePurchase}
                    disabled={!isConnected || isPurchasing}
                    className="flex-1"
                  >
                    {isPurchasing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Acquistando...
                      </>
                    ) : (
                      `Acquista per ${nft.price} ${nft.currency}`
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleMakeOffer}
                    disabled={!isConnected}
                  >
                    Fai un'offerta
                  </Button>
                </div>
              )}

              {!isOwner && !nft.isForSale && (
                <Button
                  variant="outline"
                  onClick={handleMakeOffer}
                  disabled={!isConnected}
                  className="w-full"
                >
                  Fai un'offerta
                </Button>
              )}

              {isOwner && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-blue-800 font-medium mb-2">
                    🎉 Questo NFT è tuo!
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      Trasferisci
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      {nft.isForSale
                        ? "Rimuovi dalla vendita"
                        : "Metti in vendita"}
                    </Button>
                  </div>
                </div>
              )}

              {!isConnected && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-yellow-800 font-medium mb-2">
                    ⚠️ Wallet non connesso
                  </div>
                  <div className="text-yellow-700 text-sm">
                    Connetti il tuo wallet per acquistare o fare offerte.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
