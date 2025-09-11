import { useState, useCallback } from "react";
import { ethers } from "ethers";

export interface TransactionData {
  hash: string;
  auctionId: string;
  type:
    | "dutch_commit"
    | "dutch_buy"
    | "dutch_settle"
    | "english_bid"
    | "reserve_bid"
    | "sealed_bid"
    | "claim";
  status: "pending" | "confirmed" | "failed";
  blockNumber?: number;
  timestamp?: number;
}

export function useTransactionTracker() {
  const [transactions, setTransactions] = useState<
    Map<string, TransactionData>
  >(new Map());

  const addTransaction = useCallback((data: TransactionData) => {
    setTransactions((prev) => {
      const newMap = new Map(prev);
      newMap.set(data.hash, data);
      return newMap;
    });
  }, []);

  const updateTransactionStatus = useCallback(
    (hash: string, status: TransactionData["status"], blockNumber?: number) => {
      setTransactions((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(hash);
        if (existing) {
          newMap.set(hash, {
            ...existing,
            status,
            blockNumber,
            timestamp: Date.now(),
          });
        }
        return newMap;
      });
    },
    []
  );

  const getTransactionByAuction = useCallback(
    (auctionId: string) => {
      const auctionTransactions: TransactionData[] = [];
      transactions.forEach((tx) => {
        if (tx.auctionId === auctionId) {
          auctionTransactions.push(tx);
        }
      });
      return auctionTransactions;
    },
    [transactions]
  );

  const getLatestTransactionByAuction = useCallback(
    (auctionId: string) => {
      const auctionTxs = getTransactionByAuction(auctionId);
      if (auctionTxs.length === 0) return null;

      // Return the most recent transaction (highest block number or latest timestamp)
      return auctionTxs.reduce((latest, current) => {
        if (!latest) return current;
        if (current.blockNumber && latest.blockNumber) {
          return current.blockNumber > latest.blockNumber ? current : latest;
        }
        if (current.timestamp && latest.timestamp) {
          return current.timestamp > latest.timestamp ? current : latest;
        }
        return current;
      });
    },
    [getTransactionByAuction]
  );

  const isAuctionCompleted = useCallback(
    (auctionId: string) => {
      const latestTx = getLatestTransactionByAuction(auctionId);
      return latestTx?.status === "confirmed";
    },
    [getLatestTransactionByAuction]
  );

  const getTransactionHash = useCallback(
    (auctionId: string) => {
      const latestTx = getLatestTransactionByAuction(auctionId);
      return latestTx?.hash;
    },
    [getLatestTransactionByAuction]
  );

  return {
    transactions: Array.from(transactions.values()),
    addTransaction,
    updateTransactionStatus,
    getTransactionByAuction,
    getLatestTransactionByAuction,
    isAuctionCompleted,
    getTransactionHash,
  };
}
