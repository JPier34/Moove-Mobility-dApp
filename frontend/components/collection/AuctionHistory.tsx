"use client";

import React, { useState } from "react";
import Button from "../ui/Button";
import { AuctionType } from "../../types/auction";

interface HistoryEntry {
  auctionId: string;
  nftName: string;
  action: "bid" | "won" | "lost" | "created";
  amount: string;
  date: Date;
  result: "won" | "lost" | "pending";
  auctionType: AuctionType;
}

interface AuctionHistoryProps {
  history: HistoryEntry[];
}

// Action icons and colors
const actionInfo = {
  bid: { icon: "💰", label: "Offerta", color: "text-blue-600" },
  won: { icon: "🏆", label: "Vinta", color: "text-green-600" },
  lost: { icon: "❌", label: "Persa", color: "text-red-600" },
  created: { icon: "🎨", label: "Creata", color: "text-purple-600" },
};

// Auction type emojis
const auctionTypeEmojis = {
  [AuctionType.TRADITIONAL]: "🏛️",
  [AuctionType.ENGLISH]: "⬆️",
  [AuctionType.DUTCH]: "⬇️",
  [AuctionType.SEALED_BID]: "🔒",
};

export default function AuctionHistory({ history }: AuctionHistoryProps) {
  const [filter, setFilter] = useState<"all" | "won" | "lost" | "bid">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  // Filter and sort history
  const filteredHistory = history
    .filter((entry) => {
      if (filter === "all") return true;
      return entry.action === filter || entry.result === filter;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return parseFloat(b.amount) - parseFloat(a.amount);
      }
    });

  const handleViewAuction = (auctionId: string) => {
    // TODO: Navigate to auction detail
    window.location.href = `/auctions/${auctionId}`;
  };

  // Calculate stats
  const totalWon = history.filter((h) => h.result === "won").length;
  const totalLost = history.filter((h) => h.result === "lost").length;
  const totalSpent = history
    .filter((h) => h.result === "won")
    .reduce((sum, h) => sum + parseFloat(h.amount), 0);
  const winRate =
    history.length > 0 ? Math.round((totalWon / history.length) * 100) : 0;

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📜</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Nessuno storico
        </h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Non hai ancora partecipato a nessuna asta. Inizia a fare offerte per
          costruire il tuo storico!
        </p>
        <Button onClick={() => (window.location.href = "/auctions")}>
          Vai alle Aste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{totalWon}</div>
          <div className="text-sm text-green-700">Aste Vinte</div>
        </div>
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{totalLost}</div>
          <div className="text-sm text-red-700">Aste Perse</div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{winRate}%</div>
          <div className="text-sm text-purple-700">Tasso Successo</div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            {totalSpent.toFixed(3)}
          </div>
          <div className="text-sm text-blue-700">ETH Spesi</div>
        </div>
      </div>

      {/* Filters and sorting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filtro:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-moove-primary focus:border-moove-primary"
          >
            <option value="all">Tutte le attività ({history.length})</option>
            <option value="won">Aste vinte ({totalWon})</option>
            <option value="lost">Aste perse ({totalLost})</option>
            <option value="bid">Solo offerte</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Ordina per:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-moove-primary focus:border-moove-primary"
          >
            <option value="date">Data (più recente)</option>
            <option value="amount">Importo (più alto)</option>
          </select>
        </div>
      </div>

      {/* History timeline */}
      <div className="space-y-4">
        {filteredHistory.map((entry, index) => {
          const actionData = actionInfo[entry.action];
          const typeEmoji = auctionTypeEmojis[entry.auctionType];

          return (
            <div
              key={`${entry.auctionId}-${index}`}
              className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                {/* Left side - Action info */}
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl">
                    {actionData.icon}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {entry.nftName}
                      </h4>
                      <span className="text-sm text-gray-500">
                        #{entry.auctionId}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`text-sm font-medium ${actionData.color}`}
                      >
                        {actionData.label}
                      </span>
                      <span className="text-sm text-gray-500">
                        {typeEmoji}{" "}
                        {entry.auctionType === AuctionType.TRADITIONAL
                          ? "Traditional"
                          : entry.auctionType === AuctionType.ENGLISH
                          ? "English"
                          : entry.auctionType === AuctionType.DUTCH
                          ? "Dutch"
                          : "Sealed Bid"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {entry.date.toLocaleDateString()} alle{" "}
                        {entry.date.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center - Amount */}
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {entry.amount} ETH
                  </div>
                  <div className="text-sm text-gray-500">
                    ≈ ${(parseFloat(entry.amount) * 2000).toLocaleString()} USD
                  </div>
                </div>

                {/* Right side - Result and action */}
                <div className="text-right">
                  <div className="mb-2">
                    {entry.result === "won" && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        🎉 Vinta
                      </span>
                    )}
                    {entry.result === "lost" && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                        😔 Persa
                      </span>
                    )}
                    {entry.result === "pending" && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                        ⏳ In corso
                      </span>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewAuction(entry.auctionId)}
                  >
                    Visualizza
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state for filtered results */}
      {filteredHistory.length === 0 && filter !== "all" && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔍</div>
          <div className="text-gray-500">
            Nessuna attività corrisponde al filtro selezionato
          </div>
        </div>
      )}

      {/* Load more placeholder */}
      {filteredHistory.length >= 10 && (
        <div className="text-center py-4">
          <Button variant="outline">Carica altre attività</Button>
        </div>
      )}
    </div>
  );
}
