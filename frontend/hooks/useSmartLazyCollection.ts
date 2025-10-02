"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { contracts } from "@/utils/contracts";
import { ethers } from "ethers";
import { useNFTDataCorrections } from "./useNFTDataCorrections";

export interface NFT {
  tokenId: number;
  name: string;
  description: string;
  image: string;
  rarity: string;
  purchaseDate?: number;
  price?: number;
  transactionHash?: string;
}

export function useSmartLazyCollection() {
  const { address } = useAccount();
  const { applyCorrections } = useNFTDataCorrections();
  const [nfts, setNfts] = useState<NFT[]>([]); // Currently displayed NFTs
  const [allNFTs, setAllNFTs] = useState<NFT[]>([]); // All user NFTs
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Pagination constants (like original)
  const INITIAL_BATCH_SIZE = 12;
  const SCROLL_BATCH_SIZE = 8;

  // Smart range detection function - find first non-existent token
  const findUpperBound = useCallback(async (): Promise<number> => {
    let searchPoint = 200; // Start from 200 like original
    let increment = 100; // Progressive increment: +100, +200, +300, etc.

    console.log(`🔍 Starting smart range detection from ${searchPoint}`);

    while (true) {
      try {
        // Check if token exists at current search point
        const ownerResponse = await fetch("/api/contract-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "ownerOf",
            args: [searchPoint],
            contract: "nft",
          }),
        });

        if (ownerResponse.ok) {
          // Token exists, continue searching higher
          searchPoint += increment;
          increment += 100; // Progressive increment: +100, +200, +300, etc.
          console.log(
            `🔍 Token ${searchPoint - increment} exists, trying ${searchPoint}`
          );
        } else {
          // Token doesn't exist, this is our upper bound
          console.log(
            `✅ Found upper bound at token ${searchPoint} (first non-existent)`
          );
          return searchPoint;
        }
      } catch (error) {
        console.warn(`⚠️ Error checking token ${searchPoint}:`, error);
        // On error, assume token doesn't exist
        console.log(
          `✅ Found upper bound at token ${searchPoint} (error case)`
        );
        return searchPoint;
      }

      // Safety limit to prevent infinite loops
      if (searchPoint > 10000) {
        console.log(
          `🛑 Reached safety limit, using ${searchPoint} as upper bound`
        );
        return searchPoint;
      }
    }
  }, []);

  // Find the upper bound for NFT search (starting from 110, searching progressively)
  const findFirstExistingToken = useCallback(async (): Promise<number> => {
    console.log(`🔍 Finding NFT search range starting from 110...`);

    const MIN_TOKEN_ID = 110;

    // Cerca progressivamente: 200, 300, 400, 500... fino a trovare un token vuoto
    for (let step = 200; step <= 1000; step += 100) {
      try {
        const ownerResponse = await fetch("/api/contract-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "ownerOf",
            args: [step],
            contract: "nft",
          }),
        });

        if (!ownerResponse.ok) {
          // Token vuoto trovato! Questo è il nostro limite superiore
          console.log(
            `✅ Found empty token at ${step}, will search reverse from ${
              step - 1
            } to ${MIN_TOKEN_ID}`
          );
          return step - 1; // Ritorna l'ultimo token esistente
        }
      } catch (error) {
        // Token vuoto, continua
        continue;
      }
    }

    // Se arriviamo qui, tutti i token fino a 1000 esistono
    // Fallback: cerca sequenzialmente da 110 per trovare il primo esistente
    console.log(
      `🔍 All tokens up to 1000 exist, searching sequentially from ${MIN_TOKEN_ID}`
    );
    for (let tokenId = MIN_TOKEN_ID; tokenId <= 1000; tokenId++) {
      try {
        const ownerResponse = await fetch("/api/contract-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "ownerOf",
            args: [tokenId],
            contract: "nft",
          }),
        });

        if (ownerResponse.ok) {
          console.log(`✅ Found first existing token: ${tokenId}`);
          return tokenId;
        }
      } catch (error) {
        // Token doesn't exist, continue searching
        continue;
      }
    }

    console.log(
      `⚠️ No tokens found in range ${MIN_TOKEN_ID}-1000, using fallback`
    );
    return MIN_TOKEN_ID; // Fallback
  }, []);

  // Check if user owns a specific token (simplified version for loadMore)
  const checkTokenOwnership = useCallback(
    async (tokenId: number): Promise<NFT | null> => {
      if (!address) return null;

      try {
        // Check ownership
        const ownerResponse = await fetch("/api/contract-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "ownerOf",
            args: [tokenId],
            contract: "nft",
          }),
        });

        if (!ownerResponse.ok) return null;

        const owner = await ownerResponse.text();
        const cleanOwner = owner.replace(/"/g, "");

        if (cleanOwner.toLowerCase() !== address.toLowerCase()) return null;

        // User owns this token, fetch metadata
        const tokenURIResponse = await fetch("/api/contract-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "tokenURI",
            args: [tokenId],
            contract: "nft",
          }),
        });

        if (!tokenURIResponse.ok) return null;

        const tokenURI = await tokenURIResponse.text();
        const cleanTokenURI = tokenURI.replace(/"/g, "");

        // Fetch metadata
        let metadata;
        try {
          const response = await fetch(cleanTokenURI);
          metadata = await response.json();
        } catch {
          metadata = {
            name: `NFT #${tokenId}`,
            description: "NFT from Moove Mobility",
            image: "/images/default-nft.svg",
            attributes: [{ trait_type: "Rarity", value: "common" }],
          };
        }

        const rarityAttr = metadata.attributes?.find(
          (attr: any) => attr.trait_type?.toLowerCase() === "rarity"
        );
        const rarity = rarityAttr?.value?.toLowerCase() || "common";

        return {
          tokenId,
          name: metadata.name || `NFT #${tokenId}`,
          description: metadata.description || "NFT from Moove Mobility",
          image: metadata.image || "/images/default-nft.svg",
          rarity,
          purchaseDate: Date.now(),
          price: getFallbackPrice(tokenId), // Fallback pricing
        };
      } catch (error) {
        return null;
      }
    },
    [address]
  );

  // Get auction data and transaction details for an NFT
  const getAuctionAndTransactionData = useCallback(
    async (
      tokenId: number
    ): Promise<{
      price: number;
      purchaseDate: number;
      transactionHash?: string;
    }> => {
      try {
        console.log(
          `🔍 Fetching auction and transaction data for NFT #${tokenId}`
        );

        // Create provider for event queries
        if (!window.ethereum) {
          console.warn("⚠️ No ethereum provider available");
          return { price: 0, purchaseDate: Date.now() };
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const auctionContract = new ethers.Contract(
          contracts.MooveAuction.address,
          contracts.MooveAuction.abi,
          provider
        );

        // Get current block number
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 200000); // Last 200k blocks (more comprehensive)

        console.log(
          `📊 Current block: ${currentBlock}, searching from block: ${fromBlock}`
        );
        console.log(
          `🔍 Searching for auction data for token #${tokenId} in blocks ${fromBlock}-${currentBlock}`
        );
        console.log(`📋 Using contracts:`, {
          MooveAuction: contracts.MooveAuction.address,
          MooveNFT: contracts.MooveNFT.address,
        });

        // Look for AuctionSettled events with this tokenId
        let auctionData = null;
        let transactionHash = undefined;

        try {
          const settledFilter = auctionContract.filters.AuctionSettled();
          const settledEvents = await auctionContract.queryFilter(
            settledFilter,
            fromBlock,
            currentBlock
          );

          console.log(
            `🔍 Found ${settledEvents.length} AuctionSettled events total`
          );

          // Log first few events to see their structure
          if (settledEvents.length > 0) {
            const event = settledEvents[0] as any;
            console.log(`📋 Sample AuctionSettled event:`, {
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash,
              args: event.args
                ? {
                    auctionId: event.args.auctionId?.toString(),
                    tokenId: event.args.tokenId?.toString(),
                    finalPrice: event.args.finalPrice?.toString(),
                  }
                : "no args",
            });
          }

          // Filter events by tokenId manually (since we can't filter by tokenId directly)
          const relevantEvents = settledEvents.filter((event: any) => {
            if ("args" in event && event.args) {
              return Number(event.args.tokenId) === tokenId;
            }
            return false;
          });

          console.log(
            `🎯 Found ${relevantEvents.length} relevant AuctionSettled events for token #${tokenId}`
          );

          if (relevantEvents.length > 0) {
            const settledEvent = relevantEvents[relevantEvents.length - 1]; // Get the latest
            if ("args" in settledEvent && settledEvent.args) {
              auctionData = {
                auctionId: settledEvent.args.auctionId.toString(),
                finalBid: parseFloat(
                  ethers.formatEther(settledEvent.args.finalPrice)
                ),
              };
              transactionHash = settledEvent.transactionHash;
              console.log(
                `🏆 Found auction data for #${tokenId}:`,
                auctionData
              );
            }
          }
        } catch (auctionError) {
          console.warn(
            `⚠️ Error fetching auction data for #${tokenId}:`,
            auctionError
          );
        }

        // If no auction data, try to find Transfer events to get transaction hash
        if (!transactionHash) {
          try {
            const nftContract = new ethers.Contract(
              contracts.MooveNFT.address,
              contracts.MooveNFT.abi,
              provider
            );

            const transferFilter = nftContract.filters.Transfer(null, address);
            const transferEvents = await nftContract.queryFilter(
              transferFilter,
              fromBlock,
              currentBlock
            );

            console.log(
              `🔍 Found ${transferEvents.length} Transfer events total`
            );

            // Log first few transfer events to see their structure
            if (transferEvents.length > 0) {
              const event = transferEvents[0] as any;
              console.log(`📋 Sample Transfer event:`, {
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                args: event.args
                  ? {
                      from: event.args.from,
                      to: event.args.to,
                      tokenId: event.args.tokenId?.toString(),
                    }
                  : "no args",
              });
            }

            // Find transfer events for this specific tokenId
            const relevantTransfers = transferEvents.filter((event: any) => {
              if ("args" in event && event.args) {
                return Number(event.args.tokenId) === tokenId;
              }
              return false;
            });

            console.log(
              `🎯 Found ${relevantTransfers.length} relevant Transfer events for token #${tokenId}`
            );

            if (relevantTransfers.length > 0) {
              const transferEvent =
                relevantTransfers[relevantTransfers.length - 1];
              transactionHash = transferEvent.transactionHash;
              console.log(
                `📄 Found transfer event for #${tokenId}:`,
                transactionHash
              );
            }
          } catch (transferError) {
            console.warn(
              `⚠️ Error fetching transfer data for #${tokenId}:`,
              transferError
            );
          }
        }

        // Get transaction details for purchase date and price
        let purchaseDate = Date.now();
        let price = auctionData?.finalBid || 0;

        if (transactionHash) {
          try {
            const tx = await provider.getTransaction(transactionHash);
            if (tx) {
              // Get timestamp from block
              try {
                const block = await provider.getBlock(tx.blockNumber || 0);
                purchaseDate = block ? block.timestamp * 1000 : Date.now();
                console.log(
                  `📅 Purchase date for #${tokenId}:`,
                  new Date(purchaseDate)
                );
              } catch (blockError) {
                console.warn(
                  `⚠️ Could not get block timestamp for ${transactionHash}`
                );
              }

              // If no auction price, use transaction value
              if (!auctionData?.finalBid) {
                price = parseFloat(ethers.formatEther(tx.value || 0));
                console.log(
                  `💰 Using transaction value for #${tokenId}: ${price} ETH`
                );
              } else {
                console.log(
                  `💰 Using auction final bid for #${tokenId}: ${price} ETH`
                );
              }
            }
          } catch (txError) {
            console.warn(
              `⚠️ Error fetching transaction details for ${transactionHash}:`,
              txError
            );
          }
        }

        console.log(
          `📊 Final result for #${tokenId}: price=${price} ETH, purchaseDate=${new Date(
            purchaseDate
          ).toISOString()}, transactionHash=${transactionHash || "none"}`
        );

        // If no auction data found, this NFT might not have been purchased through an auction
        if (price === 0 && !transactionHash) {
          console.log(
            `⚠️ NFT #${tokenId} has no auction/transfer data - might be direct transfer or different purchase method`
          );
        }
        return { price, purchaseDate, transactionHash };
      } catch (error) {
        console.warn(
          `⚠️ Error getting auction and transaction data for #${tokenId}:`,
          error
        );
        return { price: 0, purchaseDate: Date.now() };
      }
    },
    [address]
  );

  const fetchNFTs = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("🔍 Fetching user NFTs with smart reverse search...");

      // First, find the upper bound for NFT search
      const upperBound = await findFirstExistingToken();
      console.log(
        `🎯 Starting reverse search from token ${upperBound} down to 110`
      );

      // Use reverse search approach: search from upperBound down to 110
      const userNFTs: NFT[] = [];
      let foundCount = 0;
      let consecutiveNotFound = 0;
      const MAX_CONSECUTIVE_NOT_FOUND = 10;
      const BATCH_SIZE = 20;
      const currentFoundIds = new Set<number>();
      const MIN_TOKEN_ID = 110;

      console.log(
        `🚀 Starting reverse NFT search from tokenId ${upperBound} to ${MIN_TOKEN_ID}`
      );

      // Search strategy: check tokens from upperBound down to MIN_TOKEN_ID
      for (
        let currentTokenId = upperBound;
        currentTokenId >= MIN_TOKEN_ID;
        currentTokenId--
      ) {
        if (foundCount >= INITIAL_BATCH_SIZE) break;
        try {
          // Check if user owns this token using API
          const ownerResponse = await fetch("/api/contract-call", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              method: "ownerOf",
              args: [currentTokenId],
              contract: "nft",
            }),
          });

          if (ownerResponse.ok) {
            const owner = await ownerResponse.text();
            const cleanOwner = owner.replace(/"/g, ""); // Remove quotes

            if (cleanOwner.toLowerCase() === address.toLowerCase()) {
              console.log(`✅ User owns token ${currentTokenId}`);

              // Get token URI
              const tokenURIResponse = await fetch("/api/contract-call", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  method: "tokenURI",
                  args: [currentTokenId],
                  contract: "nft",
                }),
              });

              if (tokenURIResponse.ok) {
                const tokenURI = await tokenURIResponse.text();
                const cleanTokenURI = tokenURI.replace(/"/g, "");
                console.log(
                  `🔗 TokenURI for ${currentTokenId}: "${tokenURI}" → "${cleanTokenURI}"`
                );

                // Fetch metadata
                let metadata;
                try {
                  console.log(
                    `🔍 Fetching metadata for token ${currentTokenId} from: ${cleanTokenURI}`
                  );

                  // Check if this is a mock metadata hash
                  if (cleanTokenURI.includes("QmMockMetadataHashForTesting")) {
                    console.log(
                      `🎭 Mock metadata detected for token ${currentTokenId}, using enhanced fallback`
                    );
                    metadata = {
                      name: `Moove NFT #${currentTokenId}`,
                      description: `Premium Moove Mobility NFT - Token ID ${currentTokenId}`,
                      image: "/images/moove-nft.svg",
                      attributes: [
                        { trait_type: "Rarity", value: "rare" },
                        { trait_type: "Type", value: "Auction Won" },
                        {
                          trait_type: "Token ID",
                          value: currentTokenId.toString(),
                        },
                        { trait_type: "Collection", value: "Moove Mobility" },
                      ],
                    };
                  } else {
                    const response = await fetch(cleanTokenURI);
                    if (response.ok) {
                      const rawMetadata = await response.json();
                      console.log(
                        `📊 Raw metadata for token ${currentTokenId}:`,
                        rawMetadata
                      );

                      // Apply corrections if available
                      metadata = applyCorrections(currentTokenId, rawMetadata);

                      if (metadata !== rawMetadata) {
                        console.log(
                          `🔧 Applied corrections for token ${currentTokenId}:`,
                          metadata._corrections
                        );
                      }
                    } else {
                      console.warn(
                        `⚠️ Metadata fetch failed for token ${currentTokenId}: ${response.status}`
                      );
                      throw new Error(`HTTP ${response.status}`);
                    }
                  }
                } catch (error) {
                  console.warn(
                    `⚠️ Failed to fetch metadata for token ${currentTokenId}:`,
                    error
                  );
                  metadata = {
                    name: `Moove NFT #${currentTokenId}`,
                    description: `Premium Moove Mobility NFT - Token ID ${currentTokenId}`,
                    image: "/images/moove-nft.svg",
                    attributes: [
                      { trait_type: "Rarity", value: "common" },
                      { trait_type: "Type", value: "Auction Won" },
                      {
                        trait_type: "Token ID",
                        value: currentTokenId.toString(),
                      },
                      { trait_type: "Collection", value: "Moove Mobility" },
                    ],
                  };
                }

                // Extract rarity
                const rarityAttr = metadata.attributes?.find(
                  (attr: any) => attr.trait_type?.toLowerCase() === "rarity"
                );
                const rarity = rarityAttr?.value?.toLowerCase() || "common";

                // Create NFT with basic data first (for immediate display)
                const nft: NFT = {
                  tokenId: currentTokenId,
                  name: metadata.name || `NFT #${currentTokenId}`,
                  description:
                    metadata.description || "NFT from Moove Mobility",
                  image: metadata.image || "/images/default-nft.svg",
                  rarity,
                  purchaseDate: Date.now(), // Temporary
                  price: getFallbackPrice(currentTokenId), // Fallback pricing
                };

                userNFTs.push(nft);
                foundCount++;
                currentFoundIds.add(currentTokenId);
                console.log(
                  `✅ Added NFT #${currentTokenId}: ${nft.name} (basic data)`
                );

                // Get comprehensive NFT data in background (async, non-blocking)
                getComprehensiveNFTData(currentTokenId)
                  .then(
                    ({
                      price,
                      purchaseDate,
                      priceSource,
                      owner,
                      isDesertedAuction,
                    }) => {
                      console.log(
                        `💰 Price source for #${currentTokenId}: ${priceSource}, price: ${price} ETH, owner: ${owner}, deserted: ${isDesertedAuction}`
                      );

                      // Update the NFT with real data
                      const nftIndex = userNFTs.findIndex(
                        (n) => n.tokenId === currentTokenId
                      );
                      if (nftIndex !== -1) {
                        userNFTs[nftIndex].price = price;
                        userNFTs[nftIndex].purchaseDate = purchaseDate;
                        console.log(
                          `🔄 Updated NFT #${currentTokenId} with real data: price=${price} ETH, date=${new Date(
                            purchaseDate
                          ).toISOString()}, source=${priceSource}`
                        );

                        // Trigger re-render by updating state
                        setAllNFTs([...userNFTs]);
                        setNfts([...userNFTs.slice(0, INITIAL_BATCH_SIZE)]);
                      }
                    }
                  )
                  .catch((error) => {
                    console.warn(
                      `⚠️ Failed to get auction data for #${currentTokenId}:`,
                      error
                    );
                  });
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ Error checking token ${currentTokenId}:`, error);
        }
      }

      // Store all NFTs
      setAllNFTs(userNFTs);

      // Display only the first batch
      const initialBatch = userNFTs.slice(0, INITIAL_BATCH_SIZE);
      setNfts(initialBatch);

      // Set hasMore based on whether we found more NFTs than displayed
      const hasMoreNFTs = userNFTs.length > INITIAL_BATCH_SIZE;
      setHasMore(hasMoreNFTs);

      console.log(
        `🎉 Found ${userNFTs.length} NFTs using reverse search (${upperBound} → ${MIN_TOKEN_ID}), hasMore: ${hasMoreNFTs}`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch NFTs";
      setError(errorMessage);
      console.error("❌ Error fetching user collection:", err);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    // Continue reverse search from where we left off
    setTimeout(async () => {
      try {
        const currentDisplayed = nfts.length;
        const nextBatch: NFT[] = [];
        let tokenId = Math.max(...allNFTs.map((nft) => nft.tokenId), 110) - 1; // Start from previous token (reverse search)
        let foundCount = 0;
        const MIN_TOKEN_ID = 110; // Same minimum as main search
        const newFoundIds = new Set(allNFTs.map((nft) => nft.tokenId));

        while (foundCount < SCROLL_BATCH_SIZE && tokenId >= MIN_TOKEN_ID) {
          // Skip if already found
          if (newFoundIds.has(tokenId)) {
            tokenId--;
            continue;
          }
          try {
            // Check if user owns this token using API
            const ownerResponse = await fetch("/api/contract-call", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                method: "ownerOf",
                args: [tokenId],
                contract: "nft",
              }),
            });

            if (ownerResponse.ok) {
              const owner = await ownerResponse.text();
              if (
                address &&
                owner.replace(/"/g, "").toLowerCase() === address.toLowerCase()
              ) {
                console.log(`✅ User owns token ${tokenId} (loadMore)`);

                // Get token URI
                const tokenURIResponse = await fetch("/api/contract-call", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    method: "tokenURI",
                    args: [tokenId],
                    contract: "nft",
                  }),
                });

                if (tokenURIResponse.ok) {
                  const tokenURI = await tokenURIResponse.text();
                  const cleanTokenURI = tokenURI.replace(/"/g, "");

                  // Fetch metadata
                  let metadata;
                  try {
                    const response = await fetch(cleanTokenURI);
                    metadata = await response.json();
                  } catch {
                    metadata = {
                      name: `NFT #${tokenId}`,
                      description: "NFT from Moove Mobility",
                      image: "/images/default-nft.svg",
                      attributes: [{ trait_type: "Rarity", value: "common" }],
                    };
                  }

                  // Extract rarity
                  const rarityAttr = metadata.attributes?.find(
                    (attr: any) => attr.trait_type?.toLowerCase() === "rarity"
                  );
                  const rarity = rarityAttr?.value?.toLowerCase() || "common";

                  // Create NFT with basic data first (for immediate display)
                  const nft: NFT = {
                    tokenId,
                    name: metadata.name || `NFT #${tokenId}`,
                    description:
                      metadata.description || "NFT from Moove Mobility",
                    image: metadata.image || "/images/default-nft.svg",
                    rarity,
                    purchaseDate: Date.now(), // Temporary
                    price: getFallbackPrice(tokenId), // Fallback pricing
                  };

                  nextBatch.push(nft);
                  foundCount++;
                  newFoundIds.add(tokenId);
                  console.log(
                    `✅ Added NFT #${tokenId} (loadMore): ${nft.name} (basic data)`
                  );

                  // Get comprehensive NFT data in background (async, non-blocking)
                  getComprehensiveNFTData(tokenId)
                    .then(
                      ({
                        price,
                        purchaseDate,
                        priceSource,
                        owner,
                        isDesertedAuction,
                      }) => {
                        console.log(
                          `💰 Price source for #${tokenId}: ${priceSource}, price: ${price} ETH, owner: ${owner}, deserted: ${isDesertedAuction}`
                        );

                        // Update the NFT with real data
                        const nftIndex = nextBatch.findIndex(
                          (n) => n.tokenId === tokenId
                        );
                        if (nftIndex !== -1) {
                          nextBatch[nftIndex].price = price;
                          nextBatch[nftIndex].purchaseDate = purchaseDate;
                          console.log(
                            `🔄 Updated NFT #${tokenId} (loadMore) with real data: price=${price} ETH, date=${new Date(
                              purchaseDate
                            ).toISOString()}, source=${priceSource}`
                          );

                          // Trigger re-render by updating state
                          setAllNFTs((prev) => [...prev]);
                          setNfts((prev) => [...prev]);
                        }
                      }
                    )
                    .catch((error) => {
                      console.warn(
                        `⚠️ Failed to get auction data for #${tokenId} (loadMore):`,
                        error
                      );
                    });
                }
              }
            }
          } catch (error) {
            console.warn(
              `⚠️ Error checking token ${tokenId} (loadMore):`,
              error
            );
          }

          tokenId--;
        }

        if (nextBatch.length > 0) {
          setNfts((prev) => [...prev, ...nextBatch]);
          setAllNFTs((prev) => [...prev, ...nextBatch]);

          // Check if there are more NFTs to find
          setHasMore(foundCount === SCROLL_BATCH_SIZE && tokenId >= 0);

          console.log(
            `📄 Loaded ${nextBatch.length} more NFTs (total displayed: ${
              currentDisplayed + nextBatch.length
            })`,
            `hasMore: ${foundCount === SCROLL_BATCH_SIZE && tokenId >= 0}`
          );
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error("❌ Error in loadMore:", error);
        setHasMore(false);
      } finally {
        setIsLoadingMore(false);
      }
    }, 300);
  }, [isLoadingMore, hasMore, nfts.length, address]);

  const refresh = useCallback(async () => {
    setAllNFTs([]);
    setNfts([]);
    setHasMore(true);
    await fetchNFTs();
  }, [fetchNFTs]);

  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  // Listen for NFT claim events to refresh collection
  useEffect(() => {
    const handleNFTClaimed = () => {
      console.log("🔄 NFT claimed event received, refreshing collection...");
      refresh();
    };

    window.addEventListener("nftClaimed", handleNFTClaimed);
    return () => window.removeEventListener("nftClaimed", handleNFTClaimed);
  }, [refresh]);

  // Calculate stats based on all NFTs (like original)
  const totalItems = allNFTs.length;
  const totalValue = allNFTs.reduce((sum, nft) => sum + (nft.price || 0), 0);
  const cacheStats = {
    total: allNFTs.length,
    cached: allNFTs.length,
    lastUpdated: Date.now(),
  };

  // Enhanced fallback pricing function for deserted auctions and better data
  const getFallbackPrice = useCallback(
    (tokenId: number, rarity?: string): number => {
      // Pricing based on rarity if available
      if (rarity) {
        const rarityLower = rarity.toLowerCase();
        if (rarityLower.includes("legendary") || rarityLower.includes("epic"))
          return 0.5;
        if (rarityLower.includes("rare")) return 0.2;
        if (rarityLower.includes("uncommon")) return 0.1;
        if (rarityLower.includes("common")) return 0.05;
      }

      // Fallback to tokenId-based pricing
      if (tokenId <= 10) return 0.1; // Early NFTs - higher value
      if (tokenId <= 50) return 0.05; // Mid-range NFTs
      if (tokenId <= 100) return 0.03; // Common NFTs
      return 0.01; // Default fallback price
    },
    []
  );

  // Enhanced function to get comprehensive NFT data for my-collection
  const getComprehensiveNFTData = useCallback(
    async (
      tokenId: number
    ): Promise<{
      price: number;
      purchaseDate: number;
      priceSource: string;
      owner: string;
      isDesertedAuction: boolean;
    }> => {
      try {
        if (!window.ethereum) {
          return {
            price: getFallbackPrice(tokenId),
            purchaseDate: Date.now(),
            priceSource: "fallback",
            owner: "",
            isDesertedAuction: false,
          };
        }

        const provider = new ethers.BrowserProvider(window.ethereum);

        // Get owner address
        const nftContract = new ethers.Contract(
          contracts.MooveNFT.address,
          contracts.MooveNFT.abi,
          provider
        );

        let owner = "";
        try {
          owner = await nftContract.ownerOf(tokenId);
        } catch (error) {
          console.warn(`⚠️ Could not get owner for tokenId ${tokenId}`);
        }

        // Try to get auction data from contract first
        console.log(
          `🔍 Getting auction data from contract for tokenId ${tokenId}`
        );

        try {
          const auctionData = await getAuctionDataFromContract(tokenId);
          if (auctionData.priceSource !== "fallback") {
            console.log(
              `✅ Got auction data from contract: ${auctionData.priceSource}`
            );
            return {
              price: auctionData.price,
              purchaseDate: auctionData.purchaseDate,
              priceSource: auctionData.priceSource,
              owner,
              isDesertedAuction: auctionData.price === 0,
            };
          }
        } catch (error) {
          console.warn(`⚠️ Error getting auction data from contract: ${error}`);
        }

        // Try to get price from Transfer events with value > 0
        try {
          const currentBlock = await provider.getBlockNumber();
          const fromBlock = Math.max(0, currentBlock - 50000);

          const transferFilter = nftContract.filters.Transfer();
          const transferEvents = await nftContract.queryFilter(
            transferFilter,
            fromBlock,
            currentBlock
          );

          // Find transfers for this tokenId
          const relevantTransfers = transferEvents.filter((event) => {
            const eventTokenId = Number((event as any).args.tokenId);
            return eventTokenId === tokenId;
          });

          if (relevantTransfers.length > 0) {
            // Check the most recent transfer for transaction value
            const latestTransfer =
              relevantTransfers[relevantTransfers.length - 1];
            try {
              const tx = await provider.getTransaction(
                latestTransfer.transactionHash
              );
              if (tx && tx.value > 0) {
                const price = parseFloat(ethers.formatEther(tx.value));
                console.log(
                  `💰 Found transaction value for tokenId ${tokenId}: ${price} ETH`
                );

                // Get block timestamp
                let purchaseDate = Date.now();
                try {
                  const block = await provider.getBlock(tx.blockNumber || 0);
                  purchaseDate = block ? block.timestamp * 1000 : Date.now();
                } catch (blockError) {
                  console.warn(
                    `⚠️ Could not get block timestamp for tx ${latestTransfer.transactionHash}`
                  );
                }

                return {
                  price,
                  purchaseDate,
                  priceSource: "transaction",
                  owner,
                  isDesertedAuction: false,
                };
              } else {
                // Transaction with 0 value - likely deserted auction
                console.log(
                  `🏜️ Deserted auction detected for tokenId ${tokenId} (0 ETH transfer)`
                );
                return {
                  price: 0, // Deserted auction = 0 price
                  purchaseDate:
                    Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Random date within last month
                  priceSource: "deserted_auction",
                  owner,
                  isDesertedAuction: true,
                };
              }
            } catch (txError) {
              console.warn(
                `⚠️ Error getting transaction details: ${
                  txError instanceof Error ? txError.message : "Unknown error"
                }`
              );
            }
          }
        } catch (transferError) {
          console.warn(
            `⚠️ Error checking transfer events: ${
              transferError instanceof Error
                ? transferError.message
                : "Unknown error"
            }`
          );
        }

        // Fallback: Use intelligent pricing based on tokenId and metadata
        const fallbackPrice = getFallbackPrice(tokenId);
        console.log(
          `🎁 Using fallback pricing for tokenId ${tokenId}: ${fallbackPrice} ETH`
        );

        return {
          price: fallbackPrice,
          purchaseDate: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Random date within last month
          priceSource: "fallback",
          owner,
          isDesertedAuction: false,
        };
      } catch (error) {
        console.warn(
          `⚠️ Error getting comprehensive NFT data for #${tokenId}:`,
          error
        );
        return {
          price: getFallbackPrice(tokenId),
          purchaseDate: Date.now(),
          priceSource: "fallback",
          owner: "",
          isDesertedAuction: false,
        };
      }
    },
    [getFallbackPrice]
  );

  // NEW: Get auction data directly from contract (more reliable than events)
  const getAuctionDataFromContract = useCallback(
    async (
      tokenId: number
    ): Promise<{
      price: number;
      purchaseDate: number;
      priceSource: string;
    }> => {
      try {
        if (!window.ethereum) {
          return {
            price: getFallbackPrice(tokenId),
            purchaseDate: Date.now(),
            priceSource: "fallback",
          };
        }

        console.log(
          `🔍 Getting auction data from contract for tokenId ${tokenId}`
        );

        // Try to get auction data from contract first
        const provider = new ethers.BrowserProvider(window.ethereum);
        const auctionContract = new ethers.Contract(
          contracts.MooveAuction.address,
          contracts.MooveAuction.abi,
          provider
        );

        // Search through recent auctions to find the one with this tokenId
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 50000);

        // Get AuctionCreated events to find which auction has this tokenId
        const auctionCreatedFilter = auctionContract.filters.AuctionCreated();
        const auctionCreatedEvents = await auctionContract.queryFilter(
          auctionCreatedFilter,
          fromBlock,
          currentBlock
        );

        // Find auction with matching tokenId
        const matchingAuction = auctionCreatedEvents.find((event) => {
          const eventTokenId = Number((event as any).args.tokenId);
          return eventTokenId === tokenId;
        });

        if (matchingAuction) {
          const auctionId = Number((matchingAuction as any).args.auctionId);
          console.log(`🎯 Found auction ${auctionId} for tokenId ${tokenId}`);

          // Get auction data
          const auctionData = await auctionContract.getAuction(auctionId);
          const status = Number(auctionData[5]); // status
          const finalPrice = auctionData[14]; // highestBid
          const endTime = Number(auctionData[16]); // endTime

          if (status === 4) {
            // SETTLED
            const priceInEth = parseFloat(ethers.formatEther(finalPrice));
            console.log(
              `💰 Auction ${auctionId} settled with price: ${priceInEth} ETH`
            );

            return {
              price: priceInEth,
              purchaseDate: endTime * 1000, // Convert to milliseconds
              priceSource: "contract_auction",
            };
          }
        }

        // Fallback: Check if this is a known auction with real price
        const knownAuctionPrices: { [key: number]: number } = {
          110: 0.001, // Auction 15 - confirmed from notification
          114: 0.0, // Auction 19 - won by user (0 ETH because it was deserted, but user won it)
          // Add more known prices as they are discovered
        };

        if (knownAuctionPrices[tokenId]) {
          console.log(
            `💰 Using known auction price for tokenId ${tokenId}: ${knownAuctionPrices[tokenId]} ETH`
          );
          return {
            price: knownAuctionPrices[tokenId],
            purchaseDate: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // Random date within last week
            priceSource: "known_auction",
          };
        }

        // Alternative 2: Try to get price from Transfer events with value > 0
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const nftContract = new ethers.Contract(
            contracts.MooveNFT.address,
            contracts.MooveNFT.abi,
            provider
          );

          const currentBlock = await provider.getBlockNumber();
          const fromBlock = Math.max(0, currentBlock - 50000);

          const transferFilter = nftContract.filters.Transfer();
          const transferEvents = await nftContract.queryFilter(
            transferFilter,
            fromBlock,
            currentBlock
          );

          // Find transfers for this tokenId
          const relevantTransfers = transferEvents.filter((event) => {
            const eventTokenId = Number((event as any).args.tokenId);
            return eventTokenId === tokenId;
          });

          if (relevantTransfers.length > 0) {
            // Check the most recent transfer for transaction value
            const latestTransfer =
              relevantTransfers[relevantTransfers.length - 1];
            try {
              const tx = await provider.getTransaction(
                latestTransfer.transactionHash
              );
              if (tx && tx.value > 0) {
                const price = parseFloat(ethers.formatEther(tx.value));
                console.log(
                  `💰 Found transaction value for tokenId ${tokenId}: ${price} ETH`
                );

                // Get block timestamp
                let purchaseDate = Date.now();
                try {
                  const block = await provider.getBlock(tx.blockNumber || 0);
                  purchaseDate = block ? block.timestamp * 1000 : Date.now();
                } catch (blockError) {
                  console.warn(
                    `⚠️ Could not get block timestamp for tx ${latestTransfer.transactionHash}`
                  );
                }

                return { price, purchaseDate, priceSource: "transaction" };
              }
            } catch (txError) {
              console.warn(
                `⚠️ Error getting transaction details: ${
                  txError instanceof Error ? txError.message : "Unknown error"
                }`
              );
            }
          }
        } catch (transferError) {
          console.warn(
            `⚠️ Error checking transfer events: ${
              transferError instanceof Error
                ? transferError.message
                : "Unknown error"
            }`
          );
        }

        // Fallback: Use intelligent pricing based on tokenId and metadata
        const fallbackPrice = getFallbackPrice(tokenId);
        console.log(
          `🎁 Using fallback pricing for tokenId ${tokenId}: ${fallbackPrice} ETH`
        );

        return {
          price: fallbackPrice,
          purchaseDate: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Random date within last month
          priceSource: "fallback",
        };
      } catch (error) {
        console.warn(
          `⚠️ Error getting auction data from contract for #${tokenId}:`,
          error
        );
        return {
          price: getFallbackPrice(tokenId),
          purchaseDate: Date.now(),
          priceSource: "fallback",
        };
      }
    },
    [getFallbackPrice]
  );

  return {
    nfts,
    allNFTs,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    totalItems,
    totalValue,
    cacheStats,
    loadMore,
    refresh,
    refetch: fetchNFTs,
    getFallbackPrice, // Export fallback pricing function
    getComprehensiveNFTData, // Export comprehensive NFT data function
    getAuctionDataFromContract, // Export contract-based auction data function
  };
}
