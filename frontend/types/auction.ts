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
  auctionId: number;
  nftId: number;
  nftContract: string;
  seller: string;
  auctionType: AuctionType;
  status: AuctionStatus;
  startPrice: bigint;
  reservePrice: bigint;
  buyNowPrice: bigint;
  startTime: bigint;
  endTime: bigint;
  extensionTime: bigint;
  highestBidder: string;
  highestBid: bigint;
  bidIncrement: bigint;
  nftClaimed: boolean;
  sellerPaid: boolean;
}

export interface Bid {
  bidder: string;
  amount: bigint;
  timestamp: bigint;
  isRevealed: boolean;
  bidHash: string;
}
