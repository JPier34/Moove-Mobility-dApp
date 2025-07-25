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
  // Hourly
  {
    id: "hourly_bike",
    name: "Bike Hourly",
    description: "Perfect for short rides",
    duration: "hourly",
    priceETH: "0.005",
    priceEUR: "2.50",
    features: ["Unlock + 1 hour", "GPS tracking", "Basic insurance"],
    vehicleTypes: ["bike"],
    freeMinutes: 5,
  },
  {
    id: "hourly_scooter",
    name: "Scooter Hourly",
    description: "Quick city travels",
    duration: "hourly",
    priceETH: "0.008",
    priceEUR: "4.00",
    features: ["Unlock + 1 hour", "GPS tracking", "Premium insurance"],
    vehicleTypes: ["scooter"],
    freeMinutes: 5,
  },
  {
    id: "hourly_monopattino",
    name: "E-Scooter Hourly",
    description: "Urban mobility",
    duration: "hourly",
    priceETH: "0.006",
    priceEUR: "3.00",
    features: ["Unlock + 1 hour", "GPS tracking", "Basic insurance"],
    vehicleTypes: ["monopattino"],
    freeMinutes: 5,
  },

  // Daily
  {
    id: "daily_all",
    name: "Daily Pass",
    description: "Full day access to all vehicles",
    duration: "daily",
    priceETH: "0.025",
    priceEUR: "12.50",
    features: [
      "24h unlimited rides",
      "All vehicle types",
      "Premium support",
      "Free parking",
    ],
    vehicleTypes: ["bike", "scooter", "monopattino"],
    maxRides: 10,
    freeMinutes: 15,
  },

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
