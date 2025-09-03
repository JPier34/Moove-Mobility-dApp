export interface VehicleInfo {
  vehicleType: string; // Changed from VehicleType enum to string to match config/cities
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
  external_url?: string;
  // Additional fields for better compatibility
  title?: string;
  symbol?: string;
  collection?: {
    name: string;
    family: string;
  };
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  properties?: {
    category?: string;
    rarity?: string;
    isLimitedEdition?: boolean;
    creator?: string;
    creationDate?: string;
    customization?: {
      allowColorChange: boolean;
      allowTextChange: boolean;
      allowSizeChange: boolean;
      allowEffectsChange: boolean;
      availableColors: string[];
      maxTextLength: number;
    };
  };
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
