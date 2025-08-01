import { VehicleType } from "@/config/cities";

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  duration: "hourly" | "daily" | "monthly";
  priceETH: string;
  priceEUR: string;
  features: string[];
  vehicleTypes: VehicleType[];
  maxRides?: number;
  freeMinutes?: number;
}

export const PRICING_TIERS: PricingTier[] = [
  // Monthly
  {
    id: "monthly_basic",
    name: "Basic Monthly",
    description: "Occasional users",
    duration: "monthly",
    priceETH: "0.15",
    priceEUR: "75.00",
    features: [
      "30 rides included",
      "All vehicle types",
      "24/7 support",
      "Priority booking",
    ],
    vehicleTypes: ["bike", "scooter", "monopattino"],
    maxRides: 30,
    freeMinutes: 30,
  },
  {
    id: "monthly_unlimited",
    name: "Unlimited Monthly",
    description: "Heavy users",
    duration: "monthly",
    priceETH: "0.25",
    priceEUR: "125.00",
    features: [
      "Unlimited rides",
      "All vehicle types",
      "VIP support",
      "Vehicle reservation",
      "Home delivery",
    ],
    vehicleTypes: ["bike", "scooter", "monopattino"],
    freeMinutes: 60,
  },
];
