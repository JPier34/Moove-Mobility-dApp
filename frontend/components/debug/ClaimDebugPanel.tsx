import React, { useState, useEffect } from "react";
import { useEventBasedClaim } from "@/hooks/useEventBasedClaim";

interface ClaimDebugPanelProps {
  auctionId?: string;
}

export default function ClaimDebugPanel({ auctionId }: ClaimDebugPanelProps) {
  const { claimableAuctions, isPending } = useEventBasedClaim();
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const addLog = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev.slice(-9), `[${timestamp}] ${message}`]);
    };

    if (isPending) {
      addLog(`⏳ Transaction pending...`);
    }
  }, [isPending]);

  const targetAuction = auctionId
    ? claimableAuctions.find((a) => a.auctionId === auctionId)
    : null;

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
      <h3 className="font-bold mb-2">🔍 Claim Debug Panel</h3>

      <div className="space-y-2 text-sm">
        <div>
          <strong>Is Pending:</strong> {isPending ? "Yes" : "No"}
        </div>

        {targetAuction && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900 rounded">
            <strong>Target Auction {auctionId}:</strong>
            <div>Status: {targetAuction.claimStatus}</div>
            <div>Amount: {targetAuction.amount} ETH</div>
            <div>
              Timestamp:{" "}
              {new Date(targetAuction.timestamp * 1000).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <h4 className="font-semibold mb-2">Recent Logs:</h4>
        <div className="bg-black text-green-400 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
          {logs.length === 0
            ? "No logs yet..."
            : logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>
    </div>
  );
}
