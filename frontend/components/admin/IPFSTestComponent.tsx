"use client";

import React, { useState } from "react";

interface IPFSTestComponentProps {
  className?: string;
}

export default function IPFSTestComponent({
  className = "",
}: IPFSTestComponentProps) {
  const [hash, setHash] = useState(
    "QmUwztfCYtEAnFqn57Z4t3Ri4JVxaqvsa5Ano8aesHEpTt"
  );
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testIPFS = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log(`🧪 Testing IPFS hash: ${hash}`);

      // Test proxy server
      const proxyUrl = `/api/ipfs-proxy?hash=${encodeURIComponent(hash)}`;
      console.log(`🔄 Testing proxy URL: ${proxyUrl}`);

      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      console.log(`📊 Response status: ${response.status}`);
      console.log(
        `📊 Response headers:`,
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        const data = await response.json();
        setResult({ method: "Proxy Server", data, success: true });
        console.log("✅ Proxy server success:", data);
      } else {
        const errorText = await response.text();
        console.error(`❌ Proxy server error:`, errorText);
        throw new Error(
          `Proxy server failed: ${response.status} - ${errorText}`
        );
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      console.error("❌ IPFS test failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const testDirectGateway = async (gateway: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const url = `${gateway}${hash}`;
      console.log(`🧪 Testing direct gateway: ${url}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json, text/plain, */*",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResult({ method: `Direct: ${gateway}`, data, success: true });
        console.log("✅ Direct gateway success:", data);
      } else {
        throw new Error(`Gateway failed: ${response.status}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      console.error("❌ Direct gateway test failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`bg-white border border-gray-300 rounded-lg shadow-lg p-6 ${className}`}
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        🧪 IPFS Gateway Tester
      </h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          IPFS Hash:
        </label>
        <input
          type="text"
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter IPFS hash"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={testIPFS}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Proxy Server"}
        </button>

        <button
          onClick={() =>
            testDirectGateway("https://gateway.pinata.cloud/ipfs/")
          }
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
        >
          Test Pinata Direct
        </button>

        <button
          onClick={() => testDirectGateway("https://ipfs.io/ipfs/")}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
        >
          Test IPFS.io Direct
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
          <p className="text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {result && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-md">
          <p className="text-green-700 text-sm mb-2">
            <strong>Success with {result.method}:</strong>
          </p>
          {result.data.error ? (
            <div className="text-yellow-700 text-sm mb-2">
              <strong>Warning:</strong> {result.data.error}
            </div>
          ) : null}
          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>
          This component helps test IPFS gateway connectivity and troubleshoot
          CORS issues.
        </p>
      </div>
    </div>
  );
}
