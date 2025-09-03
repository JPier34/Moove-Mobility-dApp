"use client";

import React, { useState } from "react";
import { useIPFSUnified } from "@/hooks/useIPFSUnified";

export function PinataTest() {
  const { isPinataConfigured, uploadFile } = useIPFSUnified();
  const [testResult, setTestResult] = useState<string>("");
  const [isTesting, setIsTesting] = useState(false);

  const testPinataConnection = async () => {
    setIsTesting(true);
    setTestResult("🔄 Testando connessione Pinata...");

    try {
      // Create a small test file
      const testContent = "Test file for Pinata connection";
      const testFile = new File([testContent], "test.txt", {
        type: "text/plain",
      });

      // Try to upload
      const hash = await uploadFile(testFile);

      if (isPinataConfigured) {
        setTestResult(`✅ Connessione Pinata OK! (Client-side) Hash: ${hash}`);
      } else {
        setTestResult(
          `✅ Connessione Pinata OK! (Server-side API) Hash: ${hash}`
        );
      }
    } catch (error) {
      setTestResult(
        `❌ Errore connessione: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-3">
        Test Connessione Pinata
      </h3>

      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-3 h-3 rounded-full ${
            isPinataConfigured ? "bg-green-500" : "bg-red-500"
          }`}
        ></div>
        <span className="text-white">
          {isPinataConfigured ? "Pinata Configurato" : "Pinata Non Configurato"}
        </span>
      </div>

      {!isPinataConfigured && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 mb-3">
          <p className="text-red-200 text-sm">
            <strong>Configurazione Richiesta:</strong> Aggiungi le tue API keys
            di Pinata al file{" "}
            <code className="bg-gray-700 px-1 rounded">.env.local</code>
          </p>
          <div className="mt-2 text-xs text-gray-400">
            <p>Variabili richieste:</p>
            <ul className="list-disc list-inside mt-1">
              <li>
                <code>PINATA_API_KEY=your_api_key</code>
              </li>
              <li>
                <code>PINATA_SECRET_KEY=your_secret_key</code>
              </li>
            </ul>
          </div>
        </div>
      )}

      {isPinataConfigured && (
        <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3 mb-3">
          <p className="text-green-200 text-sm">
            <strong>Pinata Configurato:</strong> Le tue API keys sono state
            rilevate correttamente.
          </p>
        </div>
      )}

      <button
        onClick={testPinataConnection}
        disabled={isTesting}
        className={`px-4 py-2 rounded-lg font-medium transition-all ${
          !isTesting
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-600 text-gray-300 cursor-not-allowed"
        }`}
      >
        {isTesting ? "Testando..." : "Testa Connessione"}
      </button>

      {testResult && (
        <div className="mt-3 p-3 rounded-lg bg-gray-700">
          <p className="text-sm text-white">{testResult}</p>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400">
        <p>
          <strong>Note:</strong>
        </p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Il test caricherà un piccolo file di testo su Pinata</li>
          <li>Se il test fallisce, verifica le tue API keys</li>
          <li>Assicurati che il file .env.local sia nella root del progetto</li>
        </ul>
      </div>
    </div>
  );
}
