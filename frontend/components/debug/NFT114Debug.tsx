"use client";

import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { contracts } from "@/utils/contracts";
import { useNFTDataCorrections } from "@/hooks/useNFTDataCorrections";

export default function NFT114Debug() {
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { applyCorrections, hasCorrections, getCorrections } =
    useNFTDataCorrections();

  // Read tokenURI for NFT 114
  const { data: tokenURI, isLoading: uriLoading } = useReadContract({
    address: contracts.MooveNFT.address,
    abi: contracts.MooveNFT.abi,
    functionName: "tokenURI",
    args: [BigInt(114)],
  });

  useEffect(() => {
    if (!tokenURI || uriLoading) return;

    const fetchMetadata = async () => {
      setLoading(true);
      let tokenURIString = "";
      try {
        console.log("🔍 NFT 114 tokenURI:", tokenURI);

        // Check if this is detected as test data
        tokenURIString = String(tokenURI);
        const isTestHash =
          tokenURIString.includes("QmTest123") ||
          tokenURIString.includes("QmMockMetadataHashForTesting");

        console.log("🔍 Is test hash detected:", isTestHash);

        // Convert IPFS URL to HTTP
        const httpUrl = tokenURIString.startsWith("ipfs://")
          ? `https://ipfs.io/ipfs/${tokenURIString.slice(7)}`
          : tokenURIString;

        console.log("🔍 Fetching from:", httpUrl);

        const response = await fetch(httpUrl);
        if (response.ok) {
          const data = await response.json();
          console.log("✅ NFT 114 metadata:", data);

          // Apply corrections
          const correctedData = applyCorrections(114, data);
          console.log("🔧 Applied corrections:", correctedData._corrections);

          setMetadata({
            ...correctedData,
            _debug: {
              tokenURI: tokenURIString,
              httpUrl,
              isTestHash,
              rawResponse: data,
              correctionsApplied: hasCorrections(114),
              corrections: getCorrections(114),
            },
          });
        } else {
          console.error("❌ Failed to fetch metadata:", response.status);
          setMetadata({
            _debug: {
              tokenURI: tokenURIString,
              httpUrl,
              isTestHash,
              error: `HTTP ${response.status}`,
            },
          });
        }
      } catch (error) {
        console.error("❌ Error fetching NFT 114 metadata:", error);
        setMetadata({
          _debug: {
            tokenURI: tokenURIString,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [tokenURI, uriLoading]);

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-2">NFT 114 Debug</h3>

      <div className="mb-2">
        <strong>TokenURI:</strong> {uriLoading ? "Loading..." : tokenURI}
      </div>

      <div className="mb-2">
        <strong>Metadata:</strong> {loading ? "Loading..." : "Loaded"}
      </div>

      {metadata && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Metadata Details:</h4>
          <div className="bg-white p-3 rounded border">
            {metadata.name && (
              <div>
                <strong>Name:</strong> {metadata.name}
              </div>
            )}
            {metadata.description && (
              <div>
                <strong>Description:</strong> {metadata.description}
              </div>
            )}
            {metadata.image && (
              <div>
                <strong>Image:</strong> {metadata.image}
              </div>
            )}
            {metadata.attributes && (
              <div>
                <strong>Attributes:</strong>
                <ul className="ml-4">
                  {metadata.attributes.map((attr: any, index: number) => (
                    <li key={index}>
                      {attr.trait_type}: {attr.value}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Debug Information */}
            {metadata._debug && (
              <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <h5 className="font-semibold text-yellow-800 mb-2">
                  🔍 Debug Info:
                </h5>
                <div className="text-sm">
                  <div>
                    <strong>TokenURI:</strong> {metadata._debug.tokenURI}
                  </div>
                  <div>
                    <strong>HTTP URL:</strong> {metadata._debug.httpUrl}
                  </div>
                  <div>
                    <strong>Is Test Hash:</strong>{" "}
                    {metadata._debug.isTestHash ? "✅ YES" : "❌ NO"}
                  </div>
                  {metadata._debug.error && (
                    <div>
                      <strong>Error:</strong> {metadata._debug.error}
                    </div>
                  )}
                  {metadata._debug.correctionsApplied && (
                    <div>
                      <strong>Corrections Applied:</strong> ✅ YES
                    </div>
                  )}
                  {metadata._debug.corrections && (
                    <div>
                      <strong>Corrections:</strong>{" "}
                      {metadata._debug.corrections.note}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
