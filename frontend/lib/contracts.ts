import {
  IMooveVehicleNFT__factory,
  MooveAuction__factory,
  MooveAccessControl__factory,
} from "../../typechain-types";
import MooveNFTABI from "../src/abis/MooveNFT.json";
import MooveAuctionABI from "../src/abis/MooveAuction.json";

// Contract addresses (actualize after deploy)
export const CONTRACT_ADDRESSES = {
  MooveNFT: "0x40E455515bf712144C1A5D859F19d64b537754f7" as `0x${string}`,
  MooveAuction: "0x329203985A29E3c78aD140B0D3e383D2fE58d832" as `0x${string}`,
  MooveAccessControl:
    "0x005672EcC14b09A958742B960Ebb76eBE52Be44A" as `0x${string}`,
} as const;

// ABIs from JSON files (more reliable)
export const CONTRACT_ABIS = {
  MooveNFT: MooveNFTABI.abi,
  MooveAuction: MooveAuctionABI.abi,
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
