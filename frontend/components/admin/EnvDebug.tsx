"use client";

import React from "react";

export function EnvDebug() {
  // Debug environment variables
  const envVars = {
    PINATA_API_KEY: process.env.PINATA_API_KEY ? "✅ Set" : "❌ Not set",
    PINATA_SECRET_KEY: process.env.PINATA_SECRET_KEY ? "✅ Set" : "❌ Not set",
    NEXT_PUBLIC_PINATA_API_KEY: process.env.NEXT_PUBLIC_PINATA_API_KEY
      ? "✅ Set"
      : "❌ Not set",
    NEXT_PUBLIC_PINATA_SECRET_KEY: process.env.NEXT_PUBLIC_PINATA_SECRET_KEY
      ? "✅ Set"
      : "❌ Not set",
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-3">
        Debug Variabili d'Ambiente
      </h3>

      <div className="space-y-2">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-gray-300 text-sm font-mono">{key}:</span>
            <span
              className={`text-sm ${
                value.includes("✅") ? "text-green-400" : "text-red-400"
              }`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
        <p className="text-yellow-200 text-sm">
          <strong>Nota:</strong> Per il client-side, Next.js richiede il
          prefisso{" "}
          <code className="bg-gray-700 px-1 rounded">NEXT_PUBLIC_</code>
        </p>
      </div>

      <div className="mt-3 text-xs text-gray-400">
        <p>
          <strong>Soluzioni:</strong>
        </p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>
            Aggiungi <code>NEXT_PUBLIC_</code> alle tue variabili in .env.local
          </li>
          <li>Oppure usa un API route per upload server-side</li>
          <li>Riavvia il server dopo aver modificato .env.local</li>
        </ul>
      </div>
    </div>
  );
}
