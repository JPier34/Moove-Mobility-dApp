import {
  IMooveVehicleNFT__factory,
  MooveAuction__factory,
  MooveAccessControl__factory,
} from "../../typechain-types";

// Contract addresses (actualize after deploy)
export const CONTRACT_ADDRESSES = {
  MooveNFT: process.env.NEXT_PUBLIC_MOOVE_NFT_ADDRESS as `0x${string}`,
  MooveAuction: process.env.NEXT_PUBLIC_MOOVE_AUCTION_ADDRESS as `0x${string}`,
  MooveAccessControl: process.env
    .NEXT_PUBLIC_MOOVE_ACCESS_CONTROL_ADDRESS as `0x${string}`,
} as const;

// ABIs from TypeChain
export const CONTRACT_ABIS = {
  MooveNFT: IMooveVehicleNFT__factory.abi,
  MooveAuction: MooveAuction__factory.abi,
  MooveAccessControl: MooveAccessControl__factory.abi,
} as const;

// Type-safe contract factories
export const createContracts = (runner: any) => ({
  mooveNFT: IMooveVehicleNFT__factory.connect(
    CONTRACT_ADDRESSES.MooveNFT,
    runner
  ),
  mooveAuction: MooveAuction__factory.connect(
    CONTRACT_ADDRESSES.MooveAuction,
    runner
  ),
  mooveAccessControl: MooveAccessControl__factory.connect(
    CONTRACT_ADDRESSES.MooveAccessControl,
    runner
  ),
});
