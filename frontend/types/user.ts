import { AuctionType } from "@/types/auction";

export interface ActiveBid {
  auctionId: string;
  nftName: string;
  nftImage: string;
  myBidAmount: string;
  currentHighestBid: string;
  isWinning: boolean | null;
  endTime: Date;
  auctionType: AuctionType;
}

export interface WonAuction {
  auctionId: string;
  nftName: string;
  nftImage: string;
  winningBid: string;
  endTime: Date;
  isClaimed: boolean;
  claimDeadline: Date;
  auctionType: AuctionType;
}

export interface OwnedNFT {
  id: string;
  name: string;
  image: string;
  category: string;
  acquiredDate: Date;
  acquiredPrice: string;
  currentValue: string;
  isForSale: boolean;
  attributes: {
    range: string;
    speed: string;
    battery: string;
    condition: string;
  };
  source: "marketplace" | "auction";
}

export interface AuctionHistoryItem {
  auctionId: string;
  nftName: string;
  action: "bid" | "won" | "lost" | "created";
  amount: string;
  date: Date;
  result: "lost" | "won" | "pending";
  auctionType: AuctionType;
}

export interface UserData {
  address: string;
  totalNFTs: number;
  totalValue: string;
  wonAuctions: number;

  activeBids: ActiveBid[];
  ownedNFTs: OwnedNFT[];
  wonAuctionsDetails: WonAuction[];
  auctionHistory: AuctionHistoryItem[];
}
