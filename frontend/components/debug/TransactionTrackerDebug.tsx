"use client";

import React, { useState } from "react";
import { useTransactionTracker } from "../../hooks/useTransactionTracker";

export default function TransactionTrackerDebug() {
  const {
    transactions,
    addTransaction,
    updateTransactionStatus,
    getTransactionHash,
    isAuctionCompleted,
  } = useTransactionTracker();

  const [auctionId, setAuctionId] = useState("6");
  const [transactionHash, setTransactionHash] = useState(
    "0xcb8048f21401fee329eda466108aaf73ff3e090f94fe21162f8baa186ba5946b"
  );

  const handleAddTransaction = () => {
    addTransaction({
      hash: transactionHash,
      auctionId: auctionId,
      type: "dutch_settle",
      status: "confirmed",
      blockNumber: 9180562,
      timestamp: Date.now(),
    });
  };

  const handleCheckAuction = () => {
    const hash = getTransactionHash(auctionId);
    const completed = isAuctionCompleted(auctionId);
    console.log(
      `Auction ${auctionId} - Hash: ${hash}, Completed: ${completed}`
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Transaction Tracker Debug</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Auction ID:</label>
          <input
            type="text"
            value={auctionId}
            onChange={(e) => setAuctionId(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Transaction Hash:
          </label>
          <input
            type="text"
            value={transactionHash}
            onChange={(e) => setTransactionHash(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleAddTransaction}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Transaction
          </button>

          <button
            onClick={handleCheckAuction}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Check Auction
          </button>
        </div>

        <div>
          <h4 className="font-medium mb-2">
            Tracked Transactions ({transactions.length}):
          </h4>
          <div className="max-h-40 overflow-y-auto">
            {transactions.map((tx, index) => (
              <div key={index} className="text-xs bg-gray-100 p-2 mb-1 rounded">
                <div>
                  <strong>Hash:</strong> {tx.hash}
                </div>
                <div>
                  <strong>Auction:</strong> {tx.auctionId}
                </div>
                <div>
                  <strong>Type:</strong> {tx.type}
                </div>
                <div>
                  <strong>Status:</strong> {tx.status}
                </div>
                <div>
                  <strong>Block:</strong> {tx.blockNumber}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



