import { VehicleType } from "./cities";

export interface VehicleOption {
  type: VehicleType;
  name: string;
  icon: string;
  image: string;
  priceEth: string;
  description: string;
  range: string;
  features: string[];
  gradient: string;
}

export const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    type: "bike",
    name: "E-Bike Access",
    icon: "🚲",
    image: "/images/vehicles/e-bike-city.jpg",
    priceEth: "0.00000075 ETH",
    description: "Perfect for city exploration and daily commutes",
    range: "25-50 km",
    features: [
      "30 days unlimited access",
      "All partner bikes",
      "City-wide coverage",
    ],
    gradient: "from-green-400 to-blue-500",
  },
  {
    type: "scooter",
    name: "E-Scooter Access",
    icon: "🛴",
    image: "/images/vehicles/e-scooter-city.jpg",
    priceEth: "0.000001 ETH",
    description: "Fast and convenient for short to medium distances",
    range: "15-30 km",
    features: [
      "30 days unlimited access",
      "All partner scooters",
      "Quick unlock",
    ],
    gradient: "from-purple-400 to-pink-500",
  },
  {
    type: "monopattino",
    name: "Monopattino Access",
    icon: "🛵",
    image: "/images/vehicles/monopattino-city.jpg",
    priceEth: "0.00000125 ETH",
    description: "Premium electric scooters for urban mobility",
    range: "20-40 km",
    features: [
      "30 days unlimited access",
      "Premium fleet",
      "Enhanced safety features",
    ],
    gradient: "from-orange-400 to-red-500",
  },
];

