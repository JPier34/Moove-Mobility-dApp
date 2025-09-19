import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, useWatchContractEvent } from "wagmi";
import { useAuctionsEnhanced } from "./enhanced-auction-utils";
import { contracts } from "../utils/contracts";
import { ethers } from "ethers";

export interface WonAuction {
  auctionId: string;
  nftId: string;
  name: string;
  image: string;
  category: string;
  status: number;
  hasImage: boolean;
  hasName: boolean;
  finalBid: number;
  bidders: number;
  isSettled: boolean;
  endTime?: number;
  transactionHash?: string;
  // Enhanced metadata
  description?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  collection?: {
    name: string;
    description: string;
  };
  // Additional fields for modal display
  auctionType?: number;
  currentBid?: number;
  startingPrice?: number;
  highestBidder?: string;
  seller?: string;
}

export interface UseWonAuctionsReturn {
  wonAuctions: WonAuction[]; // Only unsettled auctions (for notifications)
  unsettledAuctions: WonAuction[]; // Alias for wonAuctions
  allWonAuctions: WonAuction[]; // All won auctions (including settled, for collection)
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Function to check the current ownership of an NFT
async function checkNFTOwnershipReal(
  tokenId: string,
  userAddress: string | undefined
): Promise<boolean> {
  if (!userAddress || typeof window === "undefined" || !window.ethereum) {
    return false;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const nftContract = new ethers.Contract(
      contracts.MooveNFT.address,
      contracts.MooveNFT.abi,
      provider
    );

    const owner = await nftContract.ownerOf(tokenId);
    const isOwner = owner.toLowerCase() === userAddress.toLowerCase();

    console.log(`🔍 Real ownership check for token ${tokenId}:`, {
      owner,
      userAddress,
      isOwner,
    });

    return isOwner;
  } catch (error) {
    console.error(
      `❌ Error in real ownership check for token ${tokenId}:`,
      error
    );
    return false;
  }
}

// Funzione per filtrare le aste in base all'ownership attuale
async function filterAuctionsByOwnership(
  auctions: any[],
  address: string | undefined
): Promise<any[]> {
  if (!address) return [];

  const filtered: any[] = [];

  for (const auction of auctions) {
    const isUserWinner =
      auction.highestBidder &&
      auction.highestBidder.toLowerCase() === address.toLowerCase();

    // Considera l'asta "ended" se status === 3 (ENDED) OPPURE status === 4 (SETTLED) OPPURE se status === 1 ma tempo scaduto
    const isEnded = auction.status === 3;
    const isSettled = auction.status === 4;
    const isTimeExpired =
      auction.status === 1 &&
      auction.endTime &&
      new Date(auction.endTime).getTime() <= Date.now();
    const isAuctionEnded = isEnded || isSettled || isTimeExpired;

    if (!isUserWinner || !isAuctionEnded) {
      continue; // Skip se non è vincitore o asta non finita
    }

    // Per aste SETTLED (status 4), verifica l'ownership attuale dell'NFT
    if (isSettled && auction.nftId) {
      console.log(
        `🔍 Checking ownership for settled auction ${auction.auctionId} (token ${auction.nftId})`
      );

      try {
        const isStillOwner = await checkNFTOwnershipReal(
          auction.nftId,
          address
        );
        if (isStillOwner) {
          console.log(`✅ Token ${auction.nftId} is still owned by user`);
          filtered.push(auction);
        } else {
          console.log(`❌ Token ${auction.nftId} has been transferred away`);
        }
      } catch (error) {
        console.error(
          `❌ Error checking ownership for token ${auction.nftId}:`,
          error
        );
        // If there's an error, exclude the NFT for safety
      }
    } else {
      // For other statuses (ENDED, TIME_EXPIRED), include always
      console.log(
        `✅ Including auction ${auction.auctionId} (status ${auction.status})`
      );
      filtered.push(auction);
    }
  }

  console.log(
    `✅ Filtered auctions by ownership: ${filtered.length}/${auctions.length} auctions still owned by user`
  );
  return filtered;
}

export function useWonAuctions(): UseWonAuctionsReturn {
  const { address } = useAccount();
  const [wonAuctions, setWonAuctions] = useState<WonAuction[]>([]);
  const [allWonAuctions, setAllWonAuctions] = useState<WonAuction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Watch for auction settlement events
  useWatchContractEvent({
    address: contracts.MooveAuction.address as `0x${string}`,
    abi: contracts.MooveAuction.abi,
    eventName: "AuctionSettled",
    onLogs: (logs) => {
      console.log("🎉 AuctionSettled event detected:", logs);
      // Refetch won auctions when an auction is settled
      if (hasLoaded) {
        setTimeout(() => {
          setHasLoaded(false); // Reset flag to allow refetch
        }, 1000);
      }
    },
  });

  // Use enhanced auctions hook to get all auction data
  const {
    auctions,
    isLoading: auctionsLoading,
    refetch: refetchAuctions,
  } = useAuctionsEnhanced();

  // Debug: Log auctions data
  console.log("🔍 DEBUG: useAuctionsEnhanced result:", {
    auctions,
    auctionsLoading,
    auctionsLength: auctions?.length || 0,
    sampleAuctions: auctions?.slice(0, 3) || [],
  });

  // Transaction tracker not needed for status 3 auctions

  // Helper function to fetch NFT metadata using IPFS
  const fetchNFTMetadata = useCallback(async (tokenId: number) => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No ethereum provider available");
      }

      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const nftContract = new ethers.Contract(
        contracts.MooveNFT.address,
        contracts.MooveNFT.abi,
        provider
      );

      // Get tokenURI from contract
      const tokenURI = await nftContract.tokenURI(tokenId);
      if (!tokenURI) {
        throw new Error("No tokenURI found");
      }

      // Convert ipfs:// to HTTP gateway URL
      const IPFS_GATEWAY =
        process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/";
      const httpUrl = tokenURI.startsWith("ipfs://")
        ? `${IPFS_GATEWAY}${tokenURI.slice(7)}`
        : tokenURI;

      const response = await fetch(httpUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }

      const ipfsMetadata = await response.json();

      // Convert image IPFS URL if needed
      let imageUrl = ipfsMetadata.image || "/images/default-nft.svg";
      if (imageUrl.startsWith("ipfs://")) {
        imageUrl = `${IPFS_GATEWAY}${imageUrl.slice(7)}`;
      }

      return {
        name: ipfsMetadata.name || `NFT #${tokenId}`,
        description:
          ipfsMetadata.description || `A unique NFT with token ID ${tokenId}`,
        image: imageUrl,
        attributes: ipfsMetadata.attributes || [
          {
            trait_type: "Token ID",
            value: tokenId.toString(),
          },
          {
            trait_type: "Type",
            value: "Genesis Collection",
          },
        ],
        properties: ipfsMetadata.properties || {
          tokenId: tokenId.toString(),
          collection: "Genesis",
        },
        collection: ipfsMetadata.collection || {
          name: "Genesis Collection",
          description: "The original collection of Moove NFTs",
        },
      };
    } catch (error) {
      console.error(`❌ Failed to fetch metadata for NFT #${tokenId}:`, error);
      return {
        name: `NFT #${tokenId}`,
        description: `A unique NFT with token ID ${tokenId}`,
        image: "/images/default-nft.svg",
        attributes: [
          {
            trait_type: "Token ID",
            value: tokenId.toString(),
          },
          {
            trait_type: "Type",
            value: "Genesis Collection",
          },
        ],
        collection: {
          name: "Genesis Collection",
          description: "The original collection of Moove NFTs",
        },
      };
    }
  }, []);

  const fetchWonAuctions = useCallback(async () => {
    if (!address || auctionsLoading) {
      return;
    }

    // Temporarily disable hasLoaded check to see debug logs
    // if (hasLoaded) {
    //   return;
    // }

    console.log(`🚀 fetchWonAuctions called with:`, {
      address,
      auctionsLoading,
      auctionsLength: auctions.length,
      hasLoaded,
    });

    try {
      setIsLoading(true);
      setError(null);

      // Filter auctions where the user has won (active and finished)
      const userWonAuctions = await filterAuctionsByOwnership(
        auctions,
        address
      );

      // Debug logging to understand the filtering
      console.log(`🔍 Debug auction filtering:`, {
        totalAuctions: auctions.length,
        userAddress: address,
        userWonAuctions: userWonAuctions.length,
        sampleAuctions: auctions.slice(0, 3).map((a) => ({
          auctionId: a.auctionId,
          highestBidder: a.highestBidder,
          status: a.status,
          isUserWinner:
            a.highestBidder?.toLowerCase() === address?.toLowerCase(),
        })),
      });

      const wonAuctions: WonAuction[] = [];

      for (const auction of userWonAuctions) {
        // Determine if the auction is really finished (status 3, 4 or time expired)
        const isEnded = auction.status === 3;
        const isSettled = auction.status === 4; // Solo status 4 è settled per vincitori
        const isTimeExpired =
          auction.status === 1 &&
          auction.endTime &&
          new Date(auction.endTime).getTime() <= Date.now();
        const isAuctionEnded = isEnded || isSettled || isTimeExpired;

        // Transaction hash not needed for status 3 auctions - they're ready for settlement
        const txHash = undefined;
        const isCompleted = false;

        // Fetch NFT metadata
        const tokenId = parseInt(auction.nftId?.toString() || "0");
        let nftMetadata = null;

        if (tokenId > 0) {
          try {
            nftMetadata = await fetchNFTMetadata(tokenId);
          } catch (error) {
            console.warn(
              `⚠️ Failed to fetch metadata for NFT #${tokenId}:`,
              error
            );
          }
        }

        const wonAuction: WonAuction = {
          auctionId: auction.auctionId,
          nftId: auction.nftId?.toString() || "0",
          name: nftMetadata?.name || auction.nftName || `NFT #${auction.nftId}`,
          image:
            nftMetadata?.image || auction.nftImage || "/images/default-nft.svg",
          category: auction.nftCategory || "sticker",
          status: isAuctionEnded ? 3 : auction.status, // Force status 3 if time expired
          hasImage: !!(nftMetadata?.image || auction.nftImage),
          hasName: !!(nftMetadata?.name || auction.nftName),
          finalBid: parseFloat(auction.currentBid) || 0,
          bidders: auction.bidCount || 0,
          isSettled: auction.isSettled || auction.status === 4 || isCompleted, // Only status 4 is settled for winners
          endTime: auction.endTime
            ? new Date(auction.endTime).getTime()
            : undefined,
          transactionHash: txHash,
          // Enhanced metadata
          description: nftMetadata?.description,
          attributes: nftMetadata?.attributes,
          collection: nftMetadata?.collection,
          // Additional fields for modal display
          auctionType: auction.auctionType,
          currentBid: parseFloat(auction.currentBid) || 0,
          startingPrice: parseFloat(auction.startPrice) || 0,
          highestBidder: auction.highestBidder || undefined,
          seller: auction.seller || undefined,
        };

        wonAuctions.push(wonAuction);
      }

      // Filter to show only unsettled auctions for notifications
      // Only show auctions that are ready for settlement (status 3) and not yet settled
      const confirmedAuctions = wonAuctions.filter(
        (auction) =>
          auction.status === 3 && // Only ENDED auctions
          !auction.isSettled // Not yet settled
        // Removed transaction tracker dependency - not needed for status 3 auctions
      );

      // For collection display, we need ALL won auctions (including settled ones)
      const allWonAuctions = wonAuctions.filter(
        (auction) => auction.status === 3 || auction.status === 4 // ENDED or SETTLED auctions
      );

      // Debug logging for final filter
      console.log(`🔍 Final filter debug:`, {
        wonAuctions: wonAuctions.length,
        confirmedAuctions: confirmedAuctions.length,
        sampleWonAuctions: wonAuctions.slice(0, 3).map((a) => ({
          auctionId: a.auctionId,
          status: a.status,
          isSettled: a.isSettled,
          passesFilter: a.status === 3 && !a.isSettled,
        })),
      });

      setWonAuctions(confirmedAuctions);
      setAllWonAuctions(allWonAuctions);
      setHasLoaded(true);
    } catch (err) {
      console.error("❌ Error fetching won auctions:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [
    address,
    auctions,
    auctionsLoading,
    hasLoaded,
    // Removed transaction tracker dependencies - not needed for status 3 auctions
  ]);

  useEffect(() => {
    fetchWonAuctions();
  }, [fetchWonAuctions]); // Use fetchWonAuctions as dependency since it's now properly memoized

  // Intelligent polling for auto-update (fallback)
  useEffect(() => {
    if (!hasLoaded || wonAuctions.length === 0) return;

    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing won auctions...");
      setHasLoaded(false); // Reset flag to allow refetch
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [hasLoaded, wonAuctions.length]);

  const unsettledAuctions = useMemo(
    () => wonAuctions.filter((auction) => !auction.isSettled),
    [wonAuctions]
  );

  const refetch = useCallback(() => {
    setHasLoaded(false);
    fetchWonAuctions();
  }, [fetchWonAuctions]);

  return {
    wonAuctions,
    unsettledAuctions,
    allWonAuctions,
    isLoading,
    error,
    refetch,
  };
}
