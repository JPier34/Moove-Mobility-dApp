// BACKUP SAFE di contracts.ts - 25 Gennaio 2025
// Questo file contiene la configurazione funzionante dei contratti prima del rideploy

// Contract Addresses (Updated with deployed contracts)
export const CONTRACT_ADDRESSES = {
  MooveAccessControl: "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42",
  MooveNFT: "0x40E455515bf712144C1A5D859F19d64b537754f7",
  MooveAuction: "0xd13E0582e7f13a8260A7C768B641e8C1Aee26585",
  MooveRentalPass: "0x52d95a8Fd4D8c0Ad210DCAD3BA8EBd533EB5420a",
} as const;

// FUNZIONI CRITICHE IDENTIFICATE:
// MooveAccessControl: hasRole, grantRole, revokeRole, DEFAULT_ADMIN_ROLE, MASTER_ADMIN_ROLE, MINTER_ROLE, AUCTION_MANAGER_ROLE
// MooveNFT: mintNFT, getApproved, isApprovedForAll, setApprovalForAll, Transfer event, Approval event
// MooveAuction: createAuction, getAuction, buyNowDutch (SENZA nonce), getDutchPrice, totalAuctions, endAuction, settleAuction
// MooveRentalPass: mintRentalPassPublic, getRentalPass, validateAndUseAccessCode

// NOTE IMPORTANTI:
// 1. buyNowDutch accetta solo auctionId (senza nonce)
// 2. getDutchPrice restituisce il prezzo calcolato dal contratto
// 3. Tutti gli ABI sono completi e funzionanti
// 4. Gli indirizzi sono quelli deployati e testati

// Questo backup deve essere mantenuto fino a quando il nuovo contratto non è completamente testato
