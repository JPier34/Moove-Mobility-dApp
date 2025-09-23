"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { contracts } from "@/utils/contracts";
import MooveAuctionABI from "../../src/abis/MooveAuction.json";
import MooveNFTABI from "../../src/abis/MooveNFT.json";

export default function ContractFunctionTester() {
  const { address, isConnected } = useAccount();
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testContract = async () => {
    setLoading(true);
    setError(null);
    setContractInfo(null);

    try {
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No ethereum provider available");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      // Test MooveAuction contract with JSON ABI
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        MooveAuctionABI.abi,
        provider
      );

      console.log("🔍 Testing MooveAuction contract...");
      console.log(`📍 Contract address: ${contracts.MooveAuction.address}`);
      console.log(`📋 JSON ABI functions count: ${MooveAuctionABI.abi.length}`);

      // Get all available functions
      console.log("🔍 Checking auction contract interface...");
      console.log("Interface:", auctionContract.interface);
      console.log("Interface type:", typeof auctionContract.interface);
      console.log("Fragments:", auctionContract.interface?.fragments);
      console.log(
        "Fragments type:",
        typeof auctionContract.interface?.fragments
      );
      console.log("JSON ABI sample:", MooveAuctionABI.abi.slice(0, 3));

      if (!auctionContract.interface || !auctionContract.interface.fragments) {
        throw new Error("Contract interface or fragments not available");
      }

      // Filter only function fragments (not errors, events, etc.)
      const functionFragments = auctionContract.interface.fragments.filter(
        (fragment: any) => fragment.type === "function"
      );
      console.log("Function fragments count:", functionFragments.length);
      const functionList = functionFragments.map((fragment: any) => ({
        name: fragment.name,
        signature: fragment.format(),
        inputs: fragment.inputs,
        outputs: fragment.outputs,
        stateMutability: fragment.stateMutability,
        type: fragment.type,
      }));

      // Test some basic functions
      const testResults = [];

      // Test totalAuctions
      try {
        const totalAuctions = await auctionContract.totalAuctions();
        testResults.push({
          function: "totalAuctions()",
          success: true,
          result: totalAuctions.toString(),
          error: null,
        });
      } catch (error) {
        testResults.push({
          function: "totalAuctions()",
          success: false,
          result: null,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Test getAuction
      try {
        const auction = await auctionContract.getAuction(1);
        testResults.push({
          function: "getAuction(1)",
          success: true,
          result: "Auction data retrieved",
          error: null,
        });
      } catch (error) {
        testResults.push({
          function: "getAuction(1)",
          success: false,
          result: null,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Test createAuction function existence
      const createAuctionTests = [];
      const possibleCreateNames = [
        "createAuction",
        "create",
        "newAuction",
        "startAuction",
        "addAuction",
        "createNewAuction",
        "initializeAuction",
      ];

      for (const name of possibleCreateNames) {
        try {
          const func = auctionContract.interface.getFunction(name);
          createAuctionTests.push({
            name,
            exists: true,
            signature: func.format(),
            inputs: func.inputs.length,
            outputs: func.outputs.length,
          });
        } catch (error) {
          createAuctionTests.push({
            name,
            exists: false,
            signature: null,
            inputs: 0,
            outputs: 0,
          });
        }
      }

      // Test MooveNFT contract too with JSON ABI
      const nftContract = new ethers.Contract(
        contracts.MooveNFT.address,
        MooveNFTABI.abi,
        provider
      );

      console.log("🔍 Checking NFT contract interface...");
      console.log("NFT Interface:", nftContract.interface);
      console.log("NFT Fragments:", nftContract.interface?.fragments);

      if (!nftContract.interface || !nftContract.interface.fragments) {
        throw new Error("NFT Contract interface or fragments not available");
      }

      // Filter only function fragments for NFT contract
      const nftFunctionFragments = nftContract.interface.fragments.filter(
        (fragment: any) => fragment.type === "function"
      );
      console.log("NFT Function fragments count:", nftFunctionFragments.length);

      const nftFunctionList = nftFunctionFragments.map((fragment: any) => ({
        name: fragment.name,
        signature: fragment.format(),
        inputs: fragment.inputs.length,
        outputs: fragment.outputs.length,
        stateMutability: fragment.stateMutability,
        type: fragment.type,
      }));

      setContractInfo({
        auctionContract: {
          address: contracts.MooveAuction.address,
          abiLength: MooveAuctionABI.abi.length,
          functions: functionList,
          testResults,
          createAuctionTests,
        },
        nftContract: {
          address: contracts.MooveNFT.address,
          abiLength: MooveNFTABI.abi.length,
          functions: nftFunctionList,
        },
      });

      console.log("✅ Contract testing completed successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("❌ Error testing contracts:", err);
    } finally {
      setLoading(false);
    }
  };

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-4xl max-h-96 overflow-auto">
      <div className="font-bold mb-2 text-green-400">
        🔧 Contract Function Tester
      </div>

      <button
        onClick={testContract}
        disabled={loading || !address}
        className="mb-4 w-full px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test Contract Functions"}
      </button>

      {error && <div className="text-red-400 mb-4">❌ Error: {error}</div>}

      {contractInfo && (
        <div className="space-y-4">
          {/* Auction Contract Info */}
          <div>
            <h3 className="text-yellow-400 font-bold mb-2">
              🏛️ MooveAuction Contract
            </h3>
            <div className="text-xs space-y-1">
              <div>📍 Address: {contractInfo.auctionContract.address}</div>
              <div>
                📋 ABI Functions: {contractInfo.auctionContract.abiLength}
              </div>

              {/* Test Results */}
              <div className="mt-2">
                <div className="text-green-400 font-bold">🧪 Test Results:</div>
                {contractInfo.auctionContract.testResults.map(
                  (test: any, index: number) => (
                    <div
                      key={index}
                      className={`ml-2 ${
                        test.success ? "text-green-300" : "text-red-300"
                      }`}
                    >
                      {test.success ? "✅" : "❌"} {test.function}:{" "}
                      {test.result || test.error}
                    </div>
                  )
                )}
              </div>

              {/* Create Auction Tests */}
              <div className="mt-2">
                <div className="text-blue-400 font-bold">
                  🔍 Create Auction Functions:
                </div>
                {contractInfo.auctionContract.createAuctionTests.map(
                  (test: any, index: number) => (
                    <div
                      key={index}
                      className={`ml-2 ${
                        test.exists ? "text-green-300" : "text-gray-400"
                      }`}
                    >
                      {test.exists ? "✅" : "❌"} {test.name}:{" "}
                      {test.exists
                        ? `${test.signature} (${test.inputs} inputs, ${test.outputs} outputs)`
                        : "Not found"}
                    </div>
                  )
                )}
              </div>

              {/* All Functions */}
              <div className="mt-2">
                <div className="text-purple-400 font-bold">
                  📝 All Functions (
                  {contractInfo.auctionContract.functions.length}):
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {contractInfo.auctionContract.functions.map(
                    (func: any, index: number) => (
                      <div key={index} className="ml-2 text-gray-300 text-xs">
                        {func.name}: {func.signature}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* NFT Contract Info */}
          <div>
            <h3 className="text-yellow-400 font-bold mb-2">
              🎨 MooveNFT Contract
            </h3>
            <div className="text-xs space-y-1">
              <div>📍 Address: {contractInfo.nftContract.address}</div>
              <div>📋 ABI Functions: {contractInfo.nftContract.abiLength}</div>

              {/* All Functions */}
              <div className="mt-2">
                <div className="text-purple-400 font-bold">
                  📝 All Functions ({contractInfo.nftContract.functions.length}
                  ):
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {contractInfo.nftContract.functions.map(
                    (func: any, index: number) => (
                      <div key={index} className="ml-2 text-gray-300 text-xs">
                        {func.name}: {func.signature}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
