/**
 * Unified Auction Types - Compatibilità Completa
 * Risolve le inconsistenze tra contratto e frontend
 */

// ============= TIPI BASE =============

export type AuctionId = string; // Sempre string per compatibilità frontend
export type TokenId = string; // Sempre string per compatibilità frontend
export type Address = string; // Sempre string per compatibilità frontend

// ============= ENUM =============

export enum AuctionType {
  ENGLISH = 0,
  DUTCH = 1,
  SEALED_BID = 2,
  RESERVE = 3,
}

export enum AuctionStatus {
  PENDING = 0, // Created but not started
  ACTIVE = 1, // Currently accepting bids
  REVEAL = 2, // Sealed bid reveal phase
  ENDED = 3, // Finished, awaiting settlement
  SETTLED = 4, // Completed and settled
  CANCELLED = 5, // Cancelled by seller or admin
}

// ============= INTERFACCIA CONTRATTO =============

/**
 * Struttura dati raw dal contratto smart contract
 * Corrisponde esattamente alla struct Auction nel contratto
 */
export interface ContractAuctionData {
  // Identificatori
  auctionId: bigint;
  nftContract: Address;
  tokenId: bigint;
  seller: Address;

  // Configurazione asta
  auctionType: bigint;
  status: bigint;
  allowPartialFulfillment: boolean;
  isSettled: boolean;
  revealPhaseStarted: boolean;

  // Prezzi
  startingPrice: bigint;
  reservePrice: bigint;
  buyNowPrice: bigint;
  currentPrice: bigint;
  bidIncrement: bigint;
  highestBid: bigint;

  // Timing
  startTime: bigint;
  endTime: bigint;
  extensionThreshold: bigint;
  extensionDuration: bigint;
  revealEndTime: bigint;

  // Partecipanti
  highestBidder: Address;
  minBidders: bigint;
  totalBidders: bigint;
}

// ============= INTERFACCIA FRONTEND =============

/**
 * Struttura dati ottimizzata per il frontend
 * Tutti i valori sono convertiti in formati user-friendly
 */
export interface FrontendAuction {
  // Identificatori (sempre string)
  auctionId: AuctionId;
  nftContract: Address;
  tokenId: TokenId;
  seller: Address;

  // Configurazione asta
  auctionType: AuctionType;
  status: AuctionStatus;
  allowPartialFulfillment: boolean;
  isSettled: boolean;
  revealPhaseStarted: boolean;

  // Prezzi (sempre string in ETH)
  startingPrice: string;
  reservePrice: string;
  buyNowPrice: string;
  currentPrice: string;
  bidIncrement: string;
  highestBid: string;

  // Timing (Date objects)
  startTime: Date;
  endTime: Date;
  extensionThreshold: number; // seconds
  extensionDuration: number;
  extensionThresholdMinutes: number; // minutes
  extensionDurationMinutes: number; // minutes
  revealEndTime: Date;

  // Partecipanti
  highestBidder: Address;
  minBidders: number;
  totalBidders: number;

  // Metadati aggiuntivi per UI
  nftName?: string;
  nftImage?: string;
  nftCategory?: string;
  currency: string;
  bidCount: number;
  transactionHash?: string;

  // Attributi NFT
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

// ============= INTERFACCIA COLLEZIONE =============

/**
 * Struttura dati per NFT in my-collection
 * Unifica dati da aste e trasferimenti diretti
 */
export interface CollectionNFT {
  // Identificatori
  id: string;
  tokenId: TokenId;

  // Metadati NFT
  name: string;
  description: string;
  image: string;
  rarity: "common" | "rare" | "epic" | "legendary";

  // Dati acquisto
  purchaseDate: Date;
  price: number; // Sempre number per calcoli
  priceSource:
    | "auction"
    | "transaction"
    | "fallback"
    | "known_auction"
    | "deserted_auction";
  transactionHash: string;

  // Dati asta (se applicabile)
  auctionWon?: {
    auctionId: AuctionId;
    finalBid: number;
    bidders: number;
    auctionType: AuctionType;
  };

  // Proprietà aggiuntive
  owner: Address;
  isDesertedAuction: boolean;
}

// ============= UTILITY FUNCTIONS =============

/**
 * Converte dati raw del contratto in formato frontend
 */
export function convertContractToFrontend(
  contractData: ContractAuctionData
): FrontendAuction {
  return {
    // Identificatori
    auctionId: contractData.auctionId.toString(),
    nftContract: contractData.nftContract,
    tokenId: contractData.tokenId.toString(),
    seller: contractData.seller,

    // Configurazione asta
    auctionType: Number(contractData.auctionType) as AuctionType,
    status: Number(contractData.status) as AuctionStatus,
    allowPartialFulfillment: contractData.allowPartialFulfillment,
    isSettled: contractData.isSettled,
    revealPhaseStarted: contractData.revealPhaseStarted,

    // Prezzi (convertiti da wei a ETH)
    startingPrice: formatEther(contractData.startingPrice),
    reservePrice: formatEther(contractData.reservePrice),
    buyNowPrice: formatEther(contractData.buyNowPrice),
    currentPrice: formatEther(contractData.currentPrice),
    bidIncrement: formatEther(contractData.bidIncrement),
    highestBid: formatEther(contractData.highestBid),

    // Timing (convertiti da timestamp a Date)
    startTime: new Date(Number(contractData.startTime) * 1000),
    endTime: new Date(Number(contractData.endTime) * 1000),
    extensionThreshold: Number(contractData.extensionThreshold), // uint32 from contract
    extensionDuration: Number(contractData.extensionDuration),
    extensionThresholdMinutes: Math.floor(
      Number(contractData.extensionThreshold) / 60
    ),
    extensionDurationMinutes: Math.floor(
      Number(contractData.extensionDuration) / 60
    ),
    revealEndTime: new Date(Number(contractData.revealEndTime) * 1000),

    // Partecipanti
    highestBidder: contractData.highestBidder,
    minBidders: Number(contractData.minBidders),
    totalBidders: Number(contractData.totalBidders),

    // Valori di default per UI
    currency: "ETH",
    bidCount: Number(contractData.totalBidders),

    // Attributi vuoti (da popolare separatamente)
    attributes: {},
  };
}

/**
 * Converte array di valori dal contratto in oggetto tipizzato
 */
export function parseContractAuctionData(rawData: any[]): ContractAuctionData {
  return {
    auctionId: rawData[0],
    nftContract: rawData[1],
    tokenId: rawData[2],
    seller: rawData[3],
    auctionType: rawData[4],
    status: rawData[5],
    allowPartialFulfillment: rawData[6],
    isSettled: rawData[7],
    revealPhaseStarted: rawData[8],
    startingPrice: rawData[9],
    reservePrice: rawData[10],
    buyNowPrice: rawData[11],
    currentPrice: rawData[12],
    bidIncrement: rawData[13],
    highestBid: rawData[14],
    startTime: rawData[15],
    endTime: rawData[16],
    extensionThreshold: rawData[17],
    extensionDuration: rawData[18],
    revealEndTime: rawData[19],
    highestBidder: rawData[20],
    minBidders: rawData[21],
    totalBidders: rawData[22],
  };
}

/**
 * Utility per convertire wei in ETH
 */
function formatEther(wei: bigint): string {
  // Usa ethers se disponibile, altrimenti conversione manuale
  if (typeof window !== "undefined" && (window as any).ethers) {
    return (window as any).ethers.formatEther(wei);
  }

  // Fallback: conversione manuale
  const weiString = wei.toString();
  const ethValue = parseFloat(weiString) / Math.pow(10, 18);
  return ethValue.toFixed(6);
}

// ============= TYPE GUARDS =============

export function isContractAuctionData(data: any): data is ContractAuctionData {
  return (
    data &&
    typeof data.auctionId !== "undefined" &&
    typeof data.nftContract === "string" &&
    typeof data.tokenId !== "undefined"
  );
}

export function isFrontendAuction(data: any): data is FrontendAuction {
  return (
    data &&
    typeof data.auctionId === "string" &&
    typeof data.nftContract === "string" &&
    typeof data.tokenId === "string"
  );
}

export function isCollectionNFT(data: any): data is CollectionNFT {
  return (
    data &&
    typeof data.id === "string" &&
    typeof data.tokenId === "string" &&
    typeof data.name === "string"
  );
}

