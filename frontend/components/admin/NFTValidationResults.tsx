"use client";

import React from "react";
import { toast } from "react-hot-toast";

interface NFTValidationResultsProps {
  result: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  };
  onSuggestionClick?: (suggestion: string) => void;
  onClearCache?: () => void;
}

export function NFTValidationResults({
  result,
  onSuggestionClick,
  onClearCache,
}: NFTValidationResultsProps) {
  if (result.isValid && result.warnings.length === 0) {
    return (
      <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-green-400 text-xl">✅</span>
          <h3 className="text-lg font-semibold text-green-200">
            NFT Validato con Successo
          </h3>
        </div>
        <p className="text-green-300 text-sm mt-2">
          Tutti i controlli sono passati. Puoi procedere con la creazione.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Risultati Validazione NFT
        </h3>
        {onClearCache && (
          <button
            onClick={onClearCache}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            title="Pulisci cache NFT (per testing)"
          >
            🗑️ Clear Cache
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Errori */}
        {result.errors.length > 0 && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3">
            <h4 className="text-red-200 font-medium mb-2 flex items-center">
              <span className="text-red-400 mr-2">❌</span>
              Errori ({result.errors.length})
            </h4>
            <ul className="space-y-1">
              {result.errors.map((error, index) => (
                <li key={index} className="text-red-300 text-sm">
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warning */}
        {result.warnings.length > 0 && (
          <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3">
            <h4 className="text-yellow-200 font-medium mb-2 flex items-center">
              <span className="text-yellow-400 mr-2">⚠️</span>
              Avvisi ({result.warnings.length})
            </h4>
            <ul className="space-y-1">
              {result.warnings.map((warning, index) => (
                <li key={index} className="text-yellow-300 text-sm">
                  • {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggerimenti */}
        {result.suggestions.length > 0 && (
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
            <h4 className="text-blue-200 font-medium mb-2 flex items-center">
              <span className="text-blue-400 mr-2">💡</span>
              Suggerimenti ({result.suggestions.length})
            </h4>
            <div className="space-y-2">
              {result.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className="block w-full text-left bg-blue-800/50 hover:bg-blue-700/50 rounded p-2 text-blue-200 text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status Summary */}
        <div className="bg-gray-700 rounded-lg p-3">
          <h4 className="text-white font-medium mb-2">Riepilogo</h4>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="text-center">
              <div
                className={`text-lg font-bold ${
                  result.errors.length === 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {result.errors.length}
              </div>
              <div className="text-gray-400">Errori</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 text-lg font-bold">
                {result.warnings.length}
              </div>
              <div className="text-gray-400">Avvisi</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 text-lg font-bold">
                {result.suggestions.length}
              </div>
              <div className="text-gray-400">Suggerimenti</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
