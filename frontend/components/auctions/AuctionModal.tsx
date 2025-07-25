"use client";

import React, { useState, useEffect } from "react";
import { Auction, AuctionType, AuctionStatus } from "../../types/auction";
import Button from "../ui/Button";
import { shortenAddress } from "../../utils/shortenAddress";
import { useAccount } from "wagmi";

interface AuctionModalProps {
  auction: Auction;
  isOpen: boolean;
  onClose: () => void;
}

// Category emojis
const categoryEmojis = {
  scooter: "🛴",
  bike: "🚲",
  skateboard: "🛹",
  moped: "🛵",
};

export default function AuctionModal({
  auction,
  isOpen,
  onClose,
}: AuctionModalProps) {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"details" | "bids" | "history">(
    "details"
  );
  const [timeLeft, setTimeLeft] = useState("");
  const [currentDutchPrice, setCurrentDutchPrice] = useState(
    auction.currentBid
  );

  // Bidding state
  const [bidAmount, setBidAmount] = useState("");
  const [customBidAmount, setCustomBidAmount] = useState("");
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);

  // Sealed bid state
  const [sealedBidAmount, setSealedBidAmount] = useState("");
  const [sealedBidNonce, setSealedBidNonce] = useState("");

  // Close modal with ESC
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

  // Calculate time remaining
  useEffect(() => {
    if (!isOpen) return;

    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(auction.endTime).getTime();
      const difference = endTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      } else {
        setTimeLeft("Auction Ended");
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [auction.endTime, isOpen]);

  // Update Dutch price
  useEffect(() => {
    if (!isOpen || auction.auctionType !== AuctionType.DUTCH) return;

    const updateDutchPrice = () => {
      const now = new Date().getTime();
      const startTime = new Date(auction.startTime).getTime();
      const endTime = new Date(auction.endTime).getTime();
      const elapsed = now - startTime;
      const duration = endTime - startTime;

      if (elapsed <= 0) {
        setCurrentDutchPrice(auction.startPrice);
        return;
      }

      if (elapsed >= duration) {
        setCurrentDutchPrice(auction.reservePrice);
        return;
      }

      const startPrice = parseFloat(auction.startPrice);
      const reservePrice = parseFloat(auction.reservePrice);
      const priceReduction = ((startPrice - reservePrice) * elapsed) / duration;
      const currentPrice = startPrice - priceReduction;

      setCurrentDutchPrice(Math.max(currentPrice, reservePrice).toFixed(6));
    };

    updateDutchPrice();
    const interval = setInterval(updateDutchPrice, 1000); // Update every second for smooth price changes
    return () => clearInterval(interval);
  }, [auction, isOpen]);

  const handleBid = async (amount: string) => {
    if (!isConnected) {
      alert("Connect wallet to place bid");
      return;
    }

    setIsSubmittingBid(true);
    try {
      // TODO: Implement actual bidding with smart contract
      console.log(
        "Placing bid:",
        amount,
        "ETH for auction:",
        auction.auctionId
      );

      // Simulate bid submission
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert(`Bid of ${amount} ETH placed successfully!`);
      onClose();
    } catch (error) {
      console.error("Error placing bid:", error);
      alert("Error placing bid");
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handleSealedBid = async () => {
    if (!sealedBidAmount || !sealedBidNonce) {
      alert("Please enter both bid amount and nonce");
      return;
    }

    setIsSubmittingBid(true);
    try {
      // TODO: Implement sealed bid submission
      console.log("Submitting sealed bid for auction:", auction.auctionId);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert("Sealed bid submitted successfully!");
      onClose();
    } catch (error) {
      console.error("Error submitting sealed bid:", error);
      alert("Error submitting sealed bid");
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handleDutchBuy = async () => {
    if (!isConnected) {
      alert("Connect wallet to buy");
      return;
    }

    setIsSubmittingBid(true);
    try {
      // TODO: Implement Dutch auction buy now
      console.log("Buying at Dutch price:", currentDutchPrice, "ETH");

      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert(`Successfully purchased for ${currentDutchPrice} ETH!`);
      onClose();
    } catch (error) {
      console.error("Error buying:", error);
      alert("Error processing purchase");
    } finally {
      setIsSubmittingBid(false);
    }
  };

  // Quick bid amounts (FIFA-style)
  const getQuickBidAmounts = () => {
    const currentBid = parseFloat(auction.currentBid);
    const increment = parseFloat(auction.bidIncrement);

    return [
      {
        label: `+${increment} ETH`,
        amount: (currentBid + increment).toFixed(4),
      },
      {
        label: `+${(increment * 2).toFixed(4)} ETH`,
        amount: (currentBid + increment * 2).toFixed(4),
      },
      {
        label: `+${(increment * 5).toFixed(4)} ETH`,
        amount: (currentBid + increment * 5).toFixed(4),
      },
      { label: "Custom", amount: "custom" },
    ];
  };

  const isOwner =
    address && address.toLowerCase() === auction.seller.toLowerCase();

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
          className="relative bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {auction.nftName}
              </h2>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-sm text-gray-500">
                  Auction #{auction.auctionId}
                </span>
                <span className="text-sm font-medium text-moove-primary">
                  {timeLeft}
                </span>
              </div>
            </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* Left column - Image and details */}
            <div className="space-y-6">
              {/* NFT Image */}
              <div className="aspect-square bg-gradient-to-br from-moove-50 to-moove-100 rounded-xl p-8">
                <div className="w-full h-full bg-gradient-to-br from-moove-primary to-moove-secondary rounded-xl flex items-center justify-center text-8xl text-white">
                  {categoryEmojis[
                    auction.nftCategory as keyof typeof categoryEmojis
                  ] || "🚗"}
                </div>
              </div>

              {/* Tabs */}
              <div>
                <div className="flex border-b border-gray-200 mb-4">
                  {[
                    { id: "details", label: "Details" },
                    { id: "bids", label: `Bids (${auction.bidCount})` },
                    { id: "history", label: "History" },
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

                {/* Tab content */}
                {activeTab === "details" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(auction.attributes).map(
                        ([key, value]) => (
                          <div key={key} className="bg-gray-50 rounded-lg p-3">
                            <div className="text-sm text-gray-500 mb-1">
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </div>
                            <div className="font-medium text-gray-900">
                              {value}
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Seller info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">
                        Venditore
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-moove-primary rounded-full flex items-center justify-center text-white text-sm">
                          {auction.seller.slice(2, 4).toUpperCase()}
                        </div>
                        <span className="font-mono text-gray-900">
                          {auction.seller}
                        </span>
                        {isOwner && (
                          <span className="px-2 py-1 bg-moove-100 text-moove-700 rounded-full text-xs">
                            Tu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "bids" && (
                  <div className="space-y-3">
                    {auction.bidCount > 0 ? (
                      <div className="text-sm text-gray-500">
                        Lo storico delle offerte è visibile qui
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🔇</div>
                        <div className="text-sm text-gray-500">
                          Ancora nessuna offerta
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm">Asta creata</span>
                      <span className="text-sm text-gray-500">
                        {new Date(auction.startTime).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right column - Bidding interface */}
            <div className="space-y-6">
              {/* Current price */}
              <div className="bg-gradient-to-r from-moove-50 to-moove-100 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-2">
                  {auction.auctionType === AuctionType.DUTCH
                    ? "Current Price"
                    : auction.auctionType === AuctionType.SEALED_BID &&
                      auction.status === AuctionStatus.REVEALING
                    ? "Hidden Bids"
                    : auction.currentBid === "0"
                    ? "Starting Price"
                    : "Current Bid"}
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {auction.auctionType === AuctionType.DUTCH
                      ? currentDutchPrice
                      : auction.auctionType === AuctionType.SEALED_BID &&
                        auction.status === AuctionStatus.REVEALING
                      ? "???"
                      : auction.currentBid === "0"
                      ? auction.startPrice
                      : auction.currentBid}
                  </span>
                  <span className="text-xl text-gray-600">
                    {auction.currency}
                  </span>
                </div>
                {auction.currentBid !== "0" &&
                  auction.auctionType !== AuctionType.DUTCH && (
                    <div className="text-sm text-gray-500 mt-1">
                      Offerta minima:{" "}
                      {(
                        parseFloat(auction.currentBid) +
                        parseFloat(auction.bidIncrement)
                      ).toFixed(4)}{" "}
                      ETH
                    </div>
                  )}
              </div>

              {/* Bidding interface */}
              {!isOwner && auction.status === AuctionStatus.ACTIVE && (
                <div className="space-y-4">
                  {auction.auctionType === AuctionType.DUTCH && (
                    <Button
                      onClick={handleDutchBuy}
                      disabled={!isConnected || isSubmittingBid}
                      className="w-full"
                      size="lg"
                    >
                      {isSubmittingBid
                        ? "Processing..."
                        : `Buy Now for ${currentDutchPrice} ETH`}
                    </Button>
                  )}

                  {auction.auctionType === AuctionType.SEALED_BID &&
                    (auction.status as AuctionStatus) ===
                      AuctionStatus.ACTIVE && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Offerta (ETH)
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            placeholder="0.0000"
                            value={sealedBidAmount}
                            onChange={(e) => setSealedBidAmount(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-moove-primary focus:border-moove-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nonce (Codice segreto)
                          </label>
                          <input
                            type="number"
                            placeholder="123456"
                            value={sealedBidNonce}
                            onChange={(e) => setSealedBidNonce(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-moove-primary focus:border-moove-primary"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Ricorda questo numero - ti servirà per rivelare la
                            tua offerta!
                          </div>
                        </div>
                        <Button
                          onClick={handleSealedBid}
                          disabled={
                            !isConnected ||
                            isSubmittingBid ||
                            !sealedBidAmount ||
                            !sealedBidNonce
                          }
                          className="w-full"
                          size="lg"
                        >
                          {isSubmittingBid
                            ? "Submitting..."
                            : "Submit Sealed Bid"}
                        </Button>
                      </div>
                    )}

                  {auction.auctionType === AuctionType.SEALED_BID &&
                    (auction.status as AuctionStatus) ===
                      AuctionStatus.REVEALING && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="text-yellow-800 font-medium mb-2">
                          🔓 Fase di apertura buste attiva
                        </div>
                        <div className="text-yellow-700 text-sm mb-4">
                          Se hai inviato un'offerta sigillata, devi rivelarla
                          ora con il tuo importo originale e il nonce.
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                        >
                          Rivela la mia offerta
                        </Button>
                      </div>
                    )}

                  {(auction.auctionType === AuctionType.TRADITIONAL ||
                    auction.auctionType === AuctionType.ENGLISH) && (
                    <div className="space-y-4">
                      {/* Quick bid buttons */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Offerta rapida
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {getQuickBidAmounts().map((bid, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (bid.amount === "custom") {
                                  // Focus custom input
                                  return;
                                }
                                setBidAmount(bid.amount);
                              }}
                              className={
                                bidAmount === bid.amount
                                  ? "border-moove-primary bg-moove-50"
                                  : ""
                              }
                            >
                              {bid.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Custom bid amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Offerta personalizzata (ETH)
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          placeholder={(
                            parseFloat(auction.currentBid) +
                            parseFloat(auction.bidIncrement)
                          ).toFixed(4)}
                          value={customBidAmount}
                          onChange={(e) => {
                            setCustomBidAmount(e.target.value);
                            setBidAmount(e.target.value);
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-moove-primary focus:border-moove-primary"
                        />
                      </div>

                      {/* Bid button */}
                      <Button
                        onClick={() => handleBid(bidAmount)}
                        disabled={!isConnected || isSubmittingBid || !bidAmount}
                        className="w-full"
                        size="lg"
                      >
                        {isSubmittingBid ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Placing Bid...
                          </>
                        ) : (
                          `Place Bid: ${bidAmount || "0.0000"} ETH`
                        )}
                      </Button>

                      {/* Buy now option */}
                      {auction.buyNowPrice &&
                        parseFloat(auction.buyNowPrice) > 0 && (
                          <div className="pt-4 border-t border-gray-200">
                            <Button
                              onClick={() => handleBid(auction.buyNowPrice!)}
                              disabled={!isConnected || isSubmittingBid}
                              variant="secondary"
                              className="w-full"
                              size="lg"
                            >
                              Buy Now for {auction.buyNowPrice} ETH
                            </Button>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

              {/* Owner message */}
              {isOwner && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-blue-800 font-medium mb-2">
                    🎉 This is your auction!
                  </div>
                  <div className="text-blue-700 text-sm">
                    Non puoi fare offerte sulla tua stessa asta. Puoi monitorare
                    le offerte e gestire l'asta dal tuo dashboard.
                  </div>
                </div>
              )}

              {/* Not connected message */}
              {!isConnected && auction.status === AuctionStatus.ACTIVE && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-yellow-800 font-medium mb-2">
                    ⚠️ Wallet non connesso
                  </div>
                  <div className="text-yellow-700 text-sm">
                    Connetti il tuo wallet per partecipare a questa asta.
                  </div>
                </div>
              )}

              {/* Auction ended message */}
              {auction.status !== AuctionStatus.ACTIVE && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-gray-800 font-medium mb-2">
                    {auction.status === AuctionStatus.ENDED
                      ? "🏁 Auction Ended"
                      : auction.status === AuctionStatus.CANCELLED
                      ? "❌ Auction Cancelled"
                      : "⏸️ Auction Inactive"}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {auction.status === AuctionStatus.ENDED &&
                    auction.highestBidder
                      ? `Won by ${shortenAddress(auction.highestBidder)} for ${
                          auction.currentBid
                        } ETH`
                      : "This auction is no longer active."}
                  </div>
                </div>
              )}

              {/* Auction info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Auction Type</span>
                  <span className="font-medium">
                    {auction.auctionType === AuctionType.TRADITIONAL
                      ? "🏛️ Traditional"
                      : auction.auctionType === AuctionType.ENGLISH
                      ? "⬆️ English"
                      : auction.auctionType === AuctionType.DUTCH
                      ? "⬇️ Dutch"
                      : "🔒 Sealed Bid"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Prezzo di partenza</span>
                  <span className="font-medium">{auction.startPrice} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Prezzo riserva</span>
                  <span className="font-medium">
                    {auction.reservePrice} ETH
                  </span>
                </div>
                {auction.buyNowPrice && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Compra ora</span>
                    <span className="font-medium">
                      {auction.buyNowPrice} ETH
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Incremento offerta</span>
                  <span className="font-medium">
                    {auction.bidIncrement} ETH
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tempo restante</span>
                  <span className="font-medium">{timeLeft}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
