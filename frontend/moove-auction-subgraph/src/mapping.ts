import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  AuctionSettled,
  AuctionCreated,
} from "../generated/MooveAuction/MooveAuction";
import { Transfer } from "../generated/MooveNFT/MooveNFT";
import {
  Auction,
  AuctionSettled as AuctionSettledEntity,
  AuctionCreated as AuctionCreatedEntity,
  NFT,
  Transfer as TransferEntity,
  UserCollection,
} from "../generated/schema";

export function handleAuctionSettled(event: AuctionSettled): void {
  let auctionId = event.params.auctionId.toString();

  // Create AuctionSettled entity
  let auctionSettled = new AuctionSettledEntity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  auctionSettled.auctionId = event.params.auctionId;
  auctionSettled.tokenId = BigInt.fromI32(0); // We need to get this from AuctionCreated event
  auctionSettled.winner = event.params.winner;
  auctionSettled.finalBid = event.params.finalPrice;
  auctionSettled.timestamp = event.block.timestamp;
  auctionSettled.transactionHash = event.transaction.hash;
  auctionSettled.blockNumber = event.block.number;
  auctionSettled.save();

  // Update or create Auction entity
  let auction = Auction.load(auctionId);
  if (auction == null) {
    auction = new Auction(auctionId);
  }

  auction.auctionId = event.params.auctionId;
  auction.winner = event.params.winner;
  auction.finalBid = event.params.finalPrice;
  auction.settled = true;
  auction.settledAt = event.block.timestamp;
  auction.transactionHash = event.transaction.hash;
  auction.blockNumber = event.block.number;

  auction.save();
}

export function handleAuctionCreated(event: AuctionCreated): void {
  let auctionId = event.params.auctionId.toString();

  // Create AuctionCreated entity
  let auctionCreated = new AuctionCreatedEntity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  auctionCreated.auctionId = event.params.auctionId;
  auctionCreated.tokenId = event.params.tokenId;
  auctionCreated.auctionType = event.params.auctionType;
  auctionCreated.startPrice = event.params.startingPrice;
  auctionCreated.endTime = event.params.duration;
  auctionCreated.timestamp = event.block.timestamp;
  auctionCreated.transactionHash = event.transaction.hash;
  auctionCreated.blockNumber = event.block.number;
  auctionCreated.save();

  // Create or update Auction entity
  let auction = Auction.load(auctionId);
  if (auction == null) {
    auction = new Auction(auctionId);
  }

  auction.auctionId = event.params.auctionId;
  auction.tokenId = event.params.tokenId;
  auction.auctionType = event.params.auctionType;
  auction.startPrice = event.params.startingPrice;
  auction.endTime = event.params.duration;
  auction.settled = false;
  auction.createdAt = event.block.timestamp;
  auction.transactionHash = event.transaction.hash;
  auction.blockNumber = event.block.number;

  auction.save();
}

export function handleTransfer(event: Transfer): void {
  let tokenId = event.params.tokenId.toString();
  let transferId =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  // Create Transfer entity
  let transfer = new TransferEntity(transferId);
  transfer.tokenId = event.params.tokenId;
  transfer.from = event.params.from;
  transfer.to = event.params.to;
  transfer.timestamp = event.block.timestamp;
  transfer.transactionHash = event.transaction.hash;
  transfer.blockNumber = event.block.number;
  transfer.save();

  // Update NFT entity
  let nft = NFT.load(tokenId);
  if (nft == null) {
    nft = new NFT(tokenId);
    nft.tokenId = event.params.tokenId;
    nft.tokenURI = ""; // Will be updated when we have the tokenURI
    nft.createdAt = event.block.timestamp;
    nft.transactionHash = event.transaction.hash;
    nft.blockNumber = event.block.number;
  }

  nft.owner = event.params.to;
  nft.save();

  // Create UserCollection entry if this is a transfer TO a user (not from zero address)
  if (
    event.params.from.toHex() != "0x0000000000000000000000000000000000000000"
  ) {
    let collectionId = event.params.to.toHex() + "-" + tokenId;
    let userCollection = new UserCollection(collectionId);
    userCollection.user = event.params.to;
    userCollection.tokenId = event.params.tokenId;
    userCollection.nft = tokenId;
    userCollection.acquiredAt = event.block.timestamp;
    userCollection.acquisitionMethod = "transfer";
    userCollection.transactionHash = event.transaction.hash;
    userCollection.blockNumber = event.block.number;
    userCollection.save();
  }
}
