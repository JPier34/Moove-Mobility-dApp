"use client";

import React, { useState } from "react";
import Button from "../ui/Button";

interface FilterOptions {
  category: string;
  priceRange: string;
  rarity: string;
  availability: string;
  sortBy: string;
}

interface SearchAndFiltersProps {
  onSearch?: (query: string) => void;
  onFilter?: (filters: FilterOptions) => void;
}

export default function SearchAndFilters({
  onSearch,
  onFilter,
}: SearchAndFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    category: "all",
    priceRange: "all",
    rarity: "all",
    availability: "all",
    sortBy: "newest",
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
      category: "all",
      priceRange: "all",
      rarity: "all",
      availability: "all",
      sortBy: "newest",
    };
    setFilters(defaultFilters);
    onFilter?.(defaultFilters);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      {/* Main search bar */}
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
            placeholder="Cerca NFT per nome, categoria o attributi..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moove-primary focus:border-moove-primary transition-colors"
          />
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
            <option value="newest">Più recenti</option>
            <option value="oldest">Meno recenti</option>
            <option value="price-low">Prezzo crescente</option>
            <option value="price-high">Prezzo decrescente</option>
            <option value="rarity">Rarità</option>
          </select>
        </div>

        {/* Filters toggle button */}
        <Button
          variant="outline"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="lg:w-auto dark:bg-gray-800"
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
          Filtri {isFiltersOpen ? "▲" : "▼"}
        </Button>
      </div>

      {/* Panel filters extendable */}
      {isFiltersOpen && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-moove-primary focus:border-moove-primary"
              >
                <option value="all">Tutte le categorie</option>
                <option value="scooter">Scooter</option>
                <option value="bike">Biciclette</option>
                <option value="skateboard">Skateboard</option>
                <option value="moped">Moped</option>
              </select>
            </div>

            {/* Price range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prezzo (ETH)
              </label>
              <select
                value={filters.priceRange}
                onChange={(e) =>
                  handleFilterChange("priceRange", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-moove-primary focus:border-moove-primary"
              >
                <option value="all">Tutti i prezzi</option>
                <option value="0-0.5">0 - 0.5 ETH</option>
                <option value="0.5-1">0.5 - 1 ETH</option>
                <option value="1-2">1 - 2 ETH</option>
                <option value="2+">2+ ETH</option>
              </select>
            </div>

            {/* Rarity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rarità
              </label>
              <select
                value={filters.rarity}
                onChange={(e) => handleFilterChange("rarity", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-moove-primary focus:border-moove-primary"
              >
                <option value="all">Tutte le rarità</option>
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>

            {/* Disponibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disponibilità
              </label>
              <select
                value={filters.availability}
                onChange={(e) =>
                  handleFilterChange("availability", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-moove-primary focus:border-moove-primary"
              >
                <option value="all">Tutti gli NFT</option>
                <option value="for-sale">In vendita</option>
                <option value="not-for-sale">Non in vendita</option>
                <option value="auction">In asta</option>
              </select>
            </div>
          </div>

          {/* Filter actions */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancella tutti i filtri
            </button>
            <div className="text-sm text-gray-500">
              {/* Placeholder for filtered content */}
              Mostrando tutti i risultati
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
