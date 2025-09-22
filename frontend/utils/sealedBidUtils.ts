import { ethers } from "ethers";

// ============= SEALED BID UTILITIES =============

/**
 * Genera un nonce casuale per le Sealed Bid auctions
 */
export function generateSealedBidNonce(): string {
  // Genera un nonce casuale di 32 bytes
  const randomBytes = ethers.randomBytes(32);
  return ethers.hexlify(randomBytes);
}

/**
 * Genera un commit hash per una Sealed Bid
 */
export function generateSealedBidCommit(
  bidAmount: string,
  nonce: string,
  bidderAddress: string
): string {
  // Crea il commit hash: keccak256(bidAmount + nonce + bidderAddress)
  const message = ethers.solidityPackedKeccak256(
    ["uint256", "bytes32", "address"],
    [ethers.parseEther(bidAmount), nonce, bidderAddress]
  );
  return message;
}

/**
 * Salva i dati del bid nel localStorage per la reveal phase
 */
export function saveSealedBidData(
  auctionId: string,
  bidderAddress: string,
  bidAmount: string,
  nonce: string,
  commitHash: string
): void {
  const bidData = {
    auctionId,
    bidderAddress,
    bidAmount,
    nonce,
    commitHash,
    timestamp: Date.now(),
    status: "committed" as const,
  };

  const key = `sealed_bid_${auctionId}_${bidderAddress}`;
  localStorage.setItem(key, JSON.stringify(bidData));

  console.log("💾 Sealed bid data saved:", {
    auctionId,
    bidAmount,
    nonce: nonce.slice(0, 10) + "...",
    commitHash: commitHash.slice(0, 10) + "...",
  });
}

/**
 * Recupera i dati del bid dal localStorage
 */
export function getSealedBidData(
  auctionId: string,
  bidderAddress: string
): {
  auctionId: string;
  bidderAddress: string;
  bidAmount: string;
  nonce: string;
  commitHash: string;
  timestamp: number;
  status: "committed" | "revealed";
} | null {
  const key = `sealed_bid_${auctionId}_${bidderAddress}`;
  const data = localStorage.getItem(key);

  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("❌ Error parsing sealed bid data:", error);
    return null;
  }
}

/**
 * Aggiorna lo status del bid (committed -> revealed)
 */
export function updateSealedBidStatus(
  auctionId: string,
  bidderAddress: string,
  status: "revealed"
): void {
  const bidData = getSealedBidData(auctionId, bidderAddress);

  if (bidData) {
    bidData.status = status;
    const key = `sealed_bid_${auctionId}_${bidderAddress}`;
    localStorage.setItem(key, JSON.stringify(bidData));

    console.log("🔄 Sealed bid status updated:", {
      auctionId,
      status,
    });
  }
}

/**
 * Rimuove i dati del bid dal localStorage
 */
export function clearSealedBidData(
  auctionId: string,
  bidderAddress: string
): void {
  const key = `sealed_bid_${auctionId}_${bidderAddress}`;
  localStorage.removeItem(key);

  console.log("🗑️ Sealed bid data cleared:", {
    auctionId,
    bidderAddress,
  });
}

/**
 * Valida che un bid sia almeno il prezzo minimo
 */
export function validateSealedBidAmount(
  bidAmount: string,
  minimumPrice: string
): { isValid: boolean; error?: string } {
  const bid = parseFloat(bidAmount);
  const minimum = parseFloat(minimumPrice);

  if (isNaN(bid) || bid <= 0) {
    return {
      isValid: false,
      error: "Bid amount must be a valid positive number",
    };
  }

  if (bid < minimum) {
    return {
      isValid: false,
      error: `Bid must be at least ${minimumPrice} ETH (minimum price)`,
    };
  }

  return { isValid: true };
}

/**
 * Ottiene tutti i bid committati per un'asta
 */
export function getAllSealedBidsForAuction(auctionId: string): Array<{
  auctionId: string;
  bidderAddress: string;
  bidAmount: string;
  nonce: string;
  commitHash: string;
  timestamp: number;
  status: "committed" | "revealed";
}> {
  const bids: Array<{
    auctionId: string;
    bidderAddress: string;
    bidAmount: string;
    nonce: string;
    commitHash: string;
    timestamp: number;
    status: "committed" | "revealed";
  }> = [];

  // Scansiona tutti i key del localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (key && key.startsWith(`sealed_bid_${auctionId}_`)) {
      const data = getSealedBidData(auctionId, key.split("_").pop() || "");

      if (data) {
        bids.push(data);
      }
    }
  }

  return bids;
}





