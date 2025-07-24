import { useMemo } from "react";
import { useIPFS } from "@/hooks/useIPFS";
import React from "react";
import { useReadMooveNFT, useWriteMooveNFT } from "./useContract";
import { VehicleInfo, CustomizationData, MooveNFT } from "@/types/nft";
import { useAccount } from "wagmi";
import { formatEther } from "viem";

export function useNFTsByOwner(owner?: string) {
  const {
    data: tokenIds,
    isLoading,
    error,
    refetch,
  } = useReadMooveNFT<number[]>(
    "getTokensByOwner",
    owner ? [owner] : undefined,
    { enabled: !!owner }
  );

  return { tokenIds, isLoading, error, refetch };
}

export function useNFTsForSale() {
  const {
    data: tokenIds,
    isLoading,
    error,
    refetch,
  } = useReadMooveNFT<number[]>("getNFTsForSale");

  return { tokenIds, isLoading, error, refetch };
}

export function useVehicleInfo(tokenId: number) {
  const {
    data: vehicleInfo,
    isLoading,
    error,
  } = useReadMooveNFT<VehicleInfo>("getVehicleInfo", [tokenId], {
    enabled: tokenId >= 0,
  });

  return { vehicleInfo, isLoading, error };
}

export function useCustomizationData(tokenId: number) {
  const {
    data: customization,
    isLoading,
    error,
  } = useReadMooveNFT<CustomizationData>("getCustomizationData", [tokenId], {
    enabled: tokenId >= 0,
  });

  return { customization, isLoading, error };
}

export function useTokenURI(tokenId: number) {
  const {
    data: tokenURI,
    isLoading,
    error,
  } = useReadMooveNFT<string>("tokenURI", [tokenId], { enabled: tokenId >= 0 });

  return { tokenURI, isLoading, error };
}

export function useNFTDetails(tokenId: number): {
  nft: MooveNFT | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { vehicleInfo, isLoading: vehicleLoading } = useVehicleInfo(tokenId);
  const { customization, isLoading: customLoading } =
    useCustomizationData(tokenId);
  const { tokenURI, isLoading: uriLoading } = useTokenURI(tokenId);
  const { data: owner, isLoading: ownerLoading } = useReadMooveNFT<string>(
    "ownerOf",
    [tokenId],
    { enabled: tokenId >= 0 }
  );

  const isLoading =
    vehicleLoading || customLoading || uriLoading || ownerLoading;

  const nft = useMemo(() => {
    if (!vehicleInfo || !customization || !owner || !tokenURI) return null;

    return {
      tokenId,
      owner,
      vehicleInfo,
      customization,
      tokenURI,
    } as MooveNFT;
  }, [tokenId, owner, vehicleInfo, customization, tokenURI]);

  return { nft, isLoading, error: null };
}

export function usePurchaseNFT() {
  const { writeMooveNFT, isPending, isConfirming, isSuccess, error } =
    useWriteMooveNFT();

  const purchaseNFT = (tokenId: number, price: bigint) => {
    writeMooveNFT("purchaseNFT", [tokenId], price);
  };

  return {
    purchaseNFT,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useSetForSale() {
  const { writeMooveNFT, isPending, isConfirming, isSuccess, error } =
    useWriteMooveNFT();

  const setForSale = (tokenId: number, price: bigint) => {
    writeMooveNFT("setForSale", [tokenId, price]);
  };

  return {
    setForSale,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useRemoveFromSale() {
  const { writeMooveNFT, isPending, isConfirming, isSuccess, error } =
    useWriteMooveNFT();

  const removeFromSale = (tokenId: number) => {
    writeMooveNFT("removeFromSale", [tokenId]);
  };

  return {
    removeFromSale,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useNFTImage(tokenId: number) {
  const { tokenURI, isLoading: uriLoading } = useTokenURI(tokenId);
  const { fetchMetadata } = useIPFS();
  const [imageHash, setImageHash] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (tokenURI) {
      setIsLoading(true);
      fetchMetadata(tokenURI).then((metadata) => {
        if (metadata?.image) {
          setImageHash(metadata.image);
        }
        setIsLoading(false);
      });
    }
  }, [tokenURI, fetchMetadata]);

  return {
    imageHash,
    isLoading: uriLoading || isLoading,
  };
}
