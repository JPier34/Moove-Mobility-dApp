/**
 * Sistema di eventi per notificare i trasferimenti NFT
 * Permette ai componenti di reagire immediatamente ai cambiamenti di ownership
 */

class NFTEventEmitter extends EventTarget {
  /**
   * Emette un evento quando un NFT viene trasferito
   */
  emitTransfer(
    tokenId: string,
    from: string,
    to: string,
    transactionHash?: string
  ) {
    const event = new CustomEvent("nftTransfer", {
      detail: {
        tokenId,
        from: from.toLowerCase(),
        to: to.toLowerCase(),
        transactionHash,
        timestamp: Date.now(),
      },
    });

    console.log(`📡 Emitting NFT transfer event:`, event.detail);
    this.dispatchEvent(event);
  }

  /**
   * Emette un evento quando un NFT viene creato
   */
  emitCreation(tokenId: string, owner: string, transactionHash?: string) {
    const event = new CustomEvent("nftCreated", {
      detail: {
        tokenId,
        owner: owner.toLowerCase(),
        transactionHash,
        timestamp: Date.now(),
      },
    });

    console.log(`📡 Emitting NFT creation event:`, event.detail);
    this.dispatchEvent(event);
  }

  /**
   * Emette un evento quando un NFT viene venduto in asta
   */
  emitSale(
    tokenId: string,
    seller: string,
    buyer: string,
    auctionId: string,
    transactionHash?: string
  ) {
    const event = new CustomEvent("nftSold", {
      detail: {
        tokenId,
        seller: seller.toLowerCase(),
        buyer: buyer.toLowerCase(),
        auctionId,
        transactionHash,
        timestamp: Date.now(),
      },
    });

    console.log(`📡 Emitting NFT sale event:`, event.detail);
    this.dispatchEvent(event);
  }

  /**
   * Emette un evento quando un'asta viene creata
   */
  emitAuctionCreated(
    auctionId: string,
    tokenId: string,
    seller: string,
    transactionHash?: string
  ) {
    const event = new CustomEvent("auctionCreated", {
      detail: {
        auctionId,
        tokenId,
        seller: seller.toLowerCase(),
        transactionHash,
        timestamp: Date.now(),
      },
    });

    console.log(`📡 Emitting auction creation event:`, event.detail);
    this.dispatchEvent(event);
  }
}

// Istanza globale del sistema di eventi
export const nftEvents = new NFTEventEmitter();

// Tipi per TypeScript
export interface NFTTransferEvent {
  tokenId: string;
  from: string;
  to: string;
  transactionHash?: string;
  timestamp: number;
}

export interface NFTCreationEvent {
  tokenId: string;
  owner: string;
  transactionHash?: string;
  timestamp: number;
}

export interface NFTSaleEvent {
  tokenId: string;
  seller: string;
  buyer: string;
  auctionId: string;
  transactionHash?: string;
  timestamp: number;
}

export interface AuctionCreatedEvent {
  auctionId: string;
  tokenId: string;
  seller: string;
  transactionHash?: string;
  timestamp: number;
}














