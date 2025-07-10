export enum VehicleType {
  BIKE = 0,
  SCOOTER = 1,
  MONOPATTINO = 2,
}

export interface VehicleInfo {
  vehicleType: VehicleType;
  name: string;
  description: string;
  dailyRate: bigint;
  isActive: boolean;
  isForSale: boolean;
  price: bigint;
  location: string;
  createdAt: bigint;
}

export interface CustomizationData {
  stickers: string[];
  colorScheme: string;
  achievements: string[];
  lastUpdated: bigint;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  vehicle_specs?: {
    max_speed: string;
    range: string;
    weight: string;
    battery_capacity?: string;
  };
}

export interface MooveNFT {
  tokenId: number;
  owner: string;
  vehicleInfo: VehicleInfo;
  customization: CustomizationData;
  metadata?: NFTMetadata;
  tokenURI: string;
}
