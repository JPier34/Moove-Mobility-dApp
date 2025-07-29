export enum AuctionType {
  TRADITIONAL = 0,
  ENGLISH = 1,
  DUTCH = 2,
  SEALED_BID = 3,
}

export enum AuctionStatus {
  ACTIVE = 0,
  ENDED = 1,
  CANCELLED = 2,
  REVEALING = 3,
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
    range: string;
    speed: string;
    battery: string;
    condition: string;
  };
}

export interface Bid {
  bidder: string;
  amount: bigint;
  timestamp: bigint;
  isRevealed: boolean;
  bidHash: string;
}
