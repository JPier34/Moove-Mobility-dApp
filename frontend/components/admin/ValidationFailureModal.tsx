"use client";

import React from "react";
import { toast } from "react-hot-toast";

interface ValidationFailureModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationResult: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  };
  onSuggestionClick?: (suggestion: string) => void;
}

export function ValidationFailureModal({
  isOpen,
  onClose,
  validationResult,
  onSuggestionClick,
}: ValidationFailureModalProps) {
  if (!isOpen) return null;

  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionClick?.(suggestion);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-red-400 flex items-center">
            <span className="text-2xl mr-2">❌</span>
            Validazione NFT Fallita
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Errori Critici */}
          {validationResult.errors.length > 0 && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
              <h3 className="text-red-200 font-semibold mb-3 flex items-center">
                <span className="text-red-400 mr-2">🚫</span>
                Errori Critici ({validationResult.errors.length})
              </h3>
              <ul className="space-y-2">
                {validationResult.errors.map((error, index) => (
                  <li
                    key={index}
                    className="text-red-300 text-sm flex items-start"
                  >
                    <span className="text-red-400 mr-2 mt-0.5">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warning */}
          {validationResult.warnings.length > 0 && (
            <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4">
              <h3 className="text-yellow-200 font-semibold mb-3 flex items-center">
                <span className="text-yellow-400 mr-2">⚠️</span>
                Avvisi ({validationResult.warnings.length})
              </h3>
              <ul className="space-y-2">
                {validationResult.warnings.map((warning, index) => (
                  <li
                    key={index}
                    className="text-yellow-300 text-sm flex items-start"
                  >
                    <span className="text-yellow-400 mr-2 mt-0.5">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggerimenti */}
          {validationResult.suggestions.length > 0 && (
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-blue-200 font-semibold mb-3 flex items-center">
                <span className="text-blue-400 mr-2">💡</span>
                Suggerimenti ({validationResult.suggestions.length})
              </h3>
              <div className="space-y-2">
                {validationResult.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="block w-full text-left bg-blue-800/50 hover:bg-blue-700/50 rounded p-3 text-blue-200 text-sm transition-colors border border-blue-600/30 hover:border-blue-500/50"
                  >
                    <span className="text-blue-400 mr-2">→</span>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Riepilogo */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">
              📊 Riepilogo Validazione
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-400">
                  {validationResult.errors.length}
                </div>
                <div className="text-xs text-gray-400">Errori</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">
                  {validationResult.warnings.length}
                </div>
                <div className="text-xs text-gray-400">Avvisi</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {validationResult.suggestions.length}
                </div>
                <div className="text-xs text-gray-400">Suggerimenti</div>
              </div>
            </div>
          </div>

          {/* Azioni */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors"
            >
              Chiudi
            </button>
            {validationResult.suggestions.length > 0 && (
              <button
                onClick={() =>
                  handleSuggestionClick(validationResult.suggestions[0])
                }
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
              >
                Applica Primo Suggerimento
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}







