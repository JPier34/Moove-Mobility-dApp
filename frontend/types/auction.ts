export enum AuctionType {
  ENGLISH = 0, // Traditional ascending bid auction
  DUTCH = 1, // Descending price auction
  SEALED_BID = 2, // Sealed bid auction with reveal phase
  RESERVE = 3, // Reserve auction with hidden minimum
}

export enum AuctionStatus {
  PENDING = 0, // Created but not started
  ACTIVE = 1, // Currently accepting bids
  REVEAL = 2, // Sealed bid reveal phase
  ENDED = 3, // Finished, awaiting settlement
  SETTLED = 4, // Completed and settled
  CANCELLED = 5, // Cancelled by seller or admin
}

export interface Auction {
  auctionId: string;
  nftId: string;
  nftName: string;
  nftImage: string;
  nftCategory: string;
  seller: string;
  auctionType: AuctionType;
  status: AuctionStatus;
  startPrice: string;
  reservePrice: string;
  buyNowPrice: string | null;
  currentBid: string;
  highestBidder: string | null;
  bidCount: number;
  startTime: Date;
  endTime: Date;
  bidIncrement: string;
  currency: string;
  isSettled?: boolean;
  transactionHash?: string;
  attributes: {
    rarity?: string;
    designer?: string;
    collection?: string;
    achievement?: string;
    requirement?: string;
    holders?: string;
    effects?: string;
    compatibility?: string;
    special?: string;
    traits?: string;
    supply?: string;
    mystery?: string;
    unlocks?: string;
    community?: string;
    edition?: string;
    range?: string;
    speed?: string;
    battery?: string;
    condition?: string;
  };
}

export interface Bid {
  bidder: string;
  amount: bigint;
  timestamp: bigint;
  isRevealed: boolean;
  bidHash: string;
}
