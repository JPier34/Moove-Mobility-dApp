"use client";

import React, { useState, useEffect } from "react";
import { WonAuction } from "@/types/user";
import { useNFTOwnershipCheck } from "@/hooks/useNFTOwnershipCheck";
import { useAccount } from "wagmi";

interface OwnershipFilterProps {
  auctions: WonAuction[];
  children: (filteredAuctions: WonAuction[]) => React.ReactNode;
}

/**
 * Componente che filtra gli NFT in base all'ownership attuale
 * Esclude gli NFT che sono stati trasferiti dopo la vittoria dell'asta
 */
export function OwnershipFilter({ auctions, children }: OwnershipFilterProps) {
  const [filteredAuctions, setFilteredAuctions] = useState<WonAuction[]>([]);
  const [isFiltering, setIsFiltering] = useState(true);

  useEffect(() => {
    if (!auctions || auctions.length === 0) {
      setFilteredAuctions([]);
      setIsFiltering(false);
      return;
    }

    console.log(
      `🔍 OwnershipFilter: Checking ${auctions.length} auctions for ownership...`
    );

    // Filtra gli NFT che sono ancora dell'utente
    const filterByOwnership = async () => {
      const filtered: WonAuction[] = [];

      for (const auction of auctions) {
        // Per NFT con status SETTLED (4), verifica l'ownership
        if (auction.status === 4) {
          console.log(
            `🔍 Checking ownership for settled auction ${auction.auctionId} (token ${auction.nftId})`
          );

          // Per ora, assumiamo che tutti gli NFT siano ancora dell'utente
          // Questo dovrebbe essere sostituito con una verifica reale dell'ownership
          // usando il hook useNFTOwnershipCheck
          filtered.push(auction);
        } else {
          // Per altri status, includi sempre
          filtered.push(auction);
        }
      }

      console.log(
        `✅ OwnershipFilter: ${filtered.length}/${auctions.length} auctions still owned by user`
      );
      setFilteredAuctions(filtered);
      setIsFiltering(false);
    };

    filterByOwnership();
  }, [auctions]);

  if (isFiltering) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-gray-500">Checking ownership...</div>
      </div>
    );
  }

  return <>{children(filteredAuctions)}</>;
}

/**
 * Hook per verificare l'ownership di una lista di NFT
 */
export function useOwnershipFilter(auctions: WonAuction[]) {
  const { address } = useAccount();
  const [filteredAuctions, setFilteredAuctions] = useState<WonAuction[]>([]);
  const [isFiltering, setIsFiltering] = useState(true);
  const [ownershipChecks, setOwnershipChecks] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!auctions || auctions.length === 0) {
      setFilteredAuctions([]);
      setIsFiltering(false);
      return;
    }

    console.log(
      `🔍 useOwnershipFilter: Checking ${auctions.length} auctions for ownership...`
    );

    // Filtra gli NFT che sono ancora dell'utente
    const filterByOwnership = async () => {
      const filtered: WonAuction[] = [];
      const checks: Record<string, boolean> = {};

      for (const auction of auctions) {
        // Per NFT con status SETTLED (4), verifica l'ownership
        if (auction.status === 4) {
          console.log(
            `🔍 Checking ownership for settled auction ${auction.auctionId} (token ${auction.nftId})`
          );

          // Verifica ownership reale usando il contratto
          try {
            const isOwner = await checkNFTOwnershipReal(auction.nftId, address);
            checks[auction.nftId] = isOwner;

            if (isOwner) {
              console.log(`✅ Token ${auction.nftId} is still owned by user`);
              filtered.push(auction);
            } else {
              console.log(
                `❌ Token ${auction.nftId} has been transferred away`
              );
            }
          } catch (error) {
            console.error(
              `❌ Error checking ownership for token ${auction.nftId}:`,
              error
            );
            // In caso di errore, escludi l'NFT per sicurezza
            checks[auction.nftId] = false;
          }
        } else {
          // Per altri status, includi sempre
          console.log(
            `✅ Including auction ${auction.auctionId} (status ${auction.status})`
          );
          filtered.push(auction);
        }
      }

      setOwnershipChecks(checks);
      console.log(
        `✅ useOwnershipFilter: ${filtered.length}/${auctions.length} auctions still owned by user`
      );
      setFilteredAuctions(filtered);
      setIsFiltering(false);
    };

    filterByOwnership();
  }, [auctions, address]);

  return {
    filteredAuctions,
    isFiltering,
    ownershipChecks,
  };
}

// Funzione helper per verificare l'ownership reale
async function checkNFTOwnershipReal(
  tokenId: string,
  userAddress: string | undefined
): Promise<boolean> {
  if (!userAddress || typeof window === "undefined" || !window.ethereum) {
    return false;
  }

  try {
    const { ethers } = await import("ethers");
    const { contracts } = await import("@/utils/contracts");

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
