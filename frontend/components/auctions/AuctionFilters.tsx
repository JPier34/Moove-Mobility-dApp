"use client";

import React, { useState } from "react";
import Button from "../ui/Button";
import { AuctionType, AuctionStatus } from "../../types/auction";

interface FilterOptions {
  auctionType: string;
  status: string;
  priceRange: string;
  category: string;
  timeRemaining: string;
  sortBy: string;
}

interface AuctionFiltersProps {
  onFilter?: (filters: FilterOptions) => void;
  onSearch?: (query: string) => void;
}

export default function AuctionFilters({
  onFilter,
  onSearch,
}: AuctionFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    auctionType: "all",
    status: "all",
    priceRange: "all",
    category: "all",
    timeRemaining: "all",
    sortBy: "ending_soon",
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      auctionType: "all",
      status: "all",
      priceRange: "all",
      category: "all",
      timeRemaining: "all",
      sortBy: "ending_soon",
    };
    setFilters(defaultFilters);
    onFilter?.(defaultFilters);
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== "all" && value !== "ending_soon"
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      {/* Main search and quick filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        {/* Search input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cerca aste per nome, categoria o attributi..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moove-primary focus:border-moove-primary transition-colors"
          />
        </div>

        {/* Quick auction type filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Tipo:
          </label>
          <select
            value={filters.auctionType}
            onChange={(e) => handleFilterChange("auctionType", e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-moove-primary focus:border-moove-primary"
          >
            <option value="all">Tutti i tipi</option>
            <option value={AuctionType.TRADITIONAL.toString()}>
              🏛️ Tradizionale
            </option>
            <option value={AuctionType.ENGLISH.toString()}>⬆️ Inglese</option>
            <option value={AuctionType.DUTCH.toString()}>⬇️ Olandese</option>
            <option value={AuctionType.SEALED_BID.toString()}>
              🔒 Buste chiuse
            </option>
          </select>
        </div>

        {/* Quick sort */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Ordina per:
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-moove-primary focus:border-moove-primary"
          >
            <option value="ending_soon">⏰ In scadenza</option>
            <option value="newest">🆕 I più nuovi</option>
            <option value="oldest">📅 I meno nuovi </option>
            <option value="price_low">💰 Prezzi: dal più basso</option>
            <option value="price_high">💎 Prezzi: dal più alto</option>
            <option value="most_bids">🔥 Con più offerte</option>
            <option value="least_bids">📊 Con meno offerte</option>
          </select>
        </div>

        {/* Advanced filters toggle */}
        <Button
          variant="outline"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="lg:w-auto relative"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filtri avanzati {isFiltersOpen ? "▲" : "▼"}
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-moove-primary rounded-full"></span>
          )}
        </Button>
      </div>

      {/* Advanced filters panel */}
      {isFiltersOpen && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Auction Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-moove-primary focus:border-moove-primary"
              >
                <option value="all">All Status</option>
                <option value={AuctionStatus.ACTIVE.toString()}>
                  🟢 Attivo
                </option>
                <option value={AuctionStatus.ENDED.toString()}>
                  🔴 Terminato
                </option>
                <option value={AuctionStatus.REVEALING.toString()}>
                  🔓 Apertura buste...
                </option>
                <option value={AuctionStatus.CANCELLED.toString()}>
                  ❌ Cancellato
                </option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offerta corrente (ETH)
              </label>
              <select
                value={filters.priceRange}
                onChange={(e) =>
                  handleFilterChange("priceRange", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-moove-primary focus:border-moove-primary"
              >
                <option value="all">All Prices</option>
                <option value="0-0.001">0 - 0.001 ETH</option>
                <option value="0.001-0.003">0.001 - 0.003 ETH</option>
                <option value="0.003-0.005">0.003 - 0.005 ETH</option>
                <option value="0.005-0.01">0.005 - 0.01 ETH</option>
                <option value="0.01+">0.01+ ETH</option>
              </select>
            </div>

            {/* Vehicle Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria veicolo
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-moove-primary focus:border-moove-primary"
              >
                <option value="all">Tutte le Categorie</option>
                <option value="scooter">🛴 Scooter</option>
                <option value="bike">🚲 Biciclette</option>
                <option value="skateboard">🛹 Skateboard</option>
                <option value="moped">🛵 Motorini</option>
              </select>
            </div>

            {/* Time Remaining */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tempo rimanente
              </label>
              <select
                value={filters.timeRemaining}
                onChange={(e) =>
                  handleFilterChange("timeRemaining", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-moove-primary focus:border-moove-primary"
              >
                <option value="all">In qualunque momento</option>
                <option value="ending_today">📅 In scadenza oggi</option>
                <option value="ending_1h">⏰ Termina tra un'ora!</option>
                <option value="ending_6h">🕕 Termina tra 6 ore</option>
                <option value="ending_24h">📆 Termina tra 24 ore!</option>
                <option value="long_term">📈 Tra più di un giorno </option>
              </select>
            </div>
          </div>

          {/* Quick filter chips */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Filtri rapidi
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange("timeRemaining", "ending_1h")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.timeRemaining === "ending_1h"
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🚨 In scadenza!
              </button>
              <button
                onClick={() => handleFilterChange("priceRange", "0-0.001")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.priceRange === "0-0.001"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                💚 Prezzo basso!
              </button>
              <button
                onClick={() =>
                  handleFilterChange(
                    "auctionType",
                    AuctionType.DUTCH.toString()
                  )
                }
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.auctionType === AuctionType.DUTCH.toString()
                    ? "bg-purple-100 text-purple-800 border border-purple-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ⬇️ Aste Olandesi
              </button>
              <button
                onClick={() => handleFilterChange("sortBy", "most_bids")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.sortBy === "most_bids"
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🔥 Le aste più seguite
              </button>
              <button
                onClick={() =>
                  handleFilterChange(
                    "status",
                    AuctionStatus.REVEALING.toString()
                  )
                }
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.status === AuctionStatus.REVEALING.toString()
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🔓 Fase di apertura buste
              </button>
            </div>
          </div>

          {/* Filter actions */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Pulisci filtri
            </button>
            <div className="text-sm text-gray-500">
              {hasActiveFilters && (
                <span className="inline-flex items-center px-2 py-1 bg-moove-100 text-moove-700 rounded-full text-xs">
                  <span className="w-2 h-2 bg-moove-primary rounded-full mr-1"></span>
                  Filtri attivi
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
