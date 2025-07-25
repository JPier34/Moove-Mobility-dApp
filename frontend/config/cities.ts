export interface CityConfig {
  id: string;
  name: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  timezone: string;
  allowedVehicles: VehicleType[];
  vehicleLimit: {
    bike: number;
    scooter: number;
    monopattino: number;
  };
}

export type VehicleType = "bike" | "scooter" | "monopattino";

// 20 European Cities Configuration
export const EUROPEAN_CITIES: CityConfig[] = [
  {
    id: "milan",
    name: "Milan",
    country: "Italy",
    coordinates: { lat: 45.4642, lng: 9.19 },
    bounds: { north: 45.52, south: 45.4, east: 9.28, west: 9.1 },
    timezone: "Europe/Rome",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 150, scooter: 100, monopattino: 80 },
  },

  {
    id: "rome",
    name: "Rome",
    country: "Italy",
    coordinates: { lat: 41.9028, lng: 12.4964 },
    bounds: { north: 41.95, south: 41.85, east: 12.55, west: 12.44 },
    timezone: "Europe/Rome",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 200, scooter: 120, monopattino: 100 },
  },

  {
    id: "naples",
    name: "Naples",
    country: "Italy",
    coordinates: { lat: 40.8518, lng: 14.2681 },
    bounds: { north: 40.9, south: 40.8, east: 14.32, west: 14.2 },
    timezone: "Europe/Rome",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 80, scooter: 60, monopattino: 50 },
  },

  {
    id: "madrid",
    name: "Madrid",
    country: "Spain",
    coordinates: { lat: 40.4168, lng: -3.7038 },
    bounds: { north: 40.5, south: 40.35, east: -3.6, west: -3.8 },
    timezone: "Europe/Madrid",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 180, scooter: 110, monopattino: 90 },
  },

  {
    id: "barcelona",
    name: "Barcelona",
    country: "Spain",
    coordinates: { lat: 41.3851, lng: 2.1734 },
    bounds: { north: 41.45, south: 41.32, east: 2.25, west: 2.1 },
    timezone: "Europe/Madrid",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 160, scooter: 100, monopattino: 85 },
  },

  {
    id: "paris",
    name: "Paris",
    country: "France",
    coordinates: { lat: 48.8566, lng: 2.3522 },
    bounds: { north: 48.9, south: 48.81, east: 2.42, west: 2.28 },
    timezone: "Europe/Paris",
    allowedVehicles: ["bike", "scooter"],
    vehicleLimit: { bike: 250, scooter: 150, monopattino: 0 },
  },

  {
    id: "lyon",
    name: "Lyon",
    country: "France",
    coordinates: { lat: 45.764, lng: 4.8357 },
    bounds: { north: 45.8, south: 45.72, east: 4.9, west: 4.77 },
    timezone: "Europe/Paris",
    allowedVehicles: ["bike", "scooter"],
    vehicleLimit: { bike: 120, scooter: 80, monopattino: 0 },
  },

  {
    id: "berlin",
    name: "Berlin",
    country: "Germany",
    coordinates: { lat: 52.52, lng: 13.405 },
    bounds: { north: 52.6, south: 52.45, east: 13.5, west: 13.3 },
    timezone: "Europe/Berlin",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 200, scooter: 130, monopattino: 110 },
  },

  {
    id: "munich",
    name: "Munich",
    country: "Germany",
    coordinates: { lat: 48.1351, lng: 11.582 },
    bounds: { north: 48.2, south: 48.07, east: 11.7, west: 11.46 },
    timezone: "Europe/Berlin",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 140, scooter: 90, monopattino: 70 },
  },

  {
    id: "amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
    coordinates: { lat: 52.3676, lng: 4.9041 },
    bounds: { north: 52.4, south: 52.33, east: 4.98, west: 4.83 },
    timezone: "Europe/Amsterdam",
    allowedVehicles: ["bike", "scooter"],
    vehicleLimit: { bike: 300, scooter: 100, monopattino: 0 },
  },

  {
    id: "rotterdam",
    name: "Rotterdam",
    country: "Netherlands",
    coordinates: { lat: 51.9225, lng: 4.4792 },
    bounds: { north: 51.96, south: 51.88, east: 4.55, west: 4.4 },
    timezone: "Europe/Amsterdam",
    allowedVehicles: ["bike", "scooter"],
    vehicleLimit: { bike: 180, scooter: 70, monopattino: 0 },
  },

  {
    id: "brussels",
    name: "Brussels",
    country: "Belgium",
    coordinates: { lat: 50.8503, lng: 4.3517 },
    bounds: { north: 50.9, south: 50.8, east: 4.42, west: 4.28 },
    timezone: "Europe/Brussels",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 120, scooter: 80, monopattino: 60 },
  },

  {
    id: "vienna",
    name: "Vienna",
    country: "Austria",
    coordinates: { lat: 48.2082, lng: 16.3738 },
    bounds: { north: 48.27, south: 48.14, east: 16.48, west: 16.27 },
    timezone: "Europe/Vienna",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 160, scooter: 100, monopattino: 80 },
  },

  {
    id: "lisbon",
    name: "Lisbon",
    country: "Portugal",
    coordinates: { lat: 38.7223, lng: -9.1393 },
    bounds: { north: 38.8, south: 38.65, east: -9.05, west: -9.23 },
    timezone: "Europe/Lisbon",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 100, scooter: 80, monopattino: 60 },
  },

  {
    id: "prague",
    name: "Prague",
    country: "Czech Republic",
    coordinates: { lat: 50.0755, lng: 14.4378 },
    bounds: { north: 50.13, south: 50.02, east: 14.56, west: 14.32 },
    timezone: "Europe/Prague",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 130, scooter: 90, monopattino: 70 },
  },

  {
    id: "copenhagen",
    name: "Copenhagen",
    country: "Denmark",
    coordinates: { lat: 55.6761, lng: 12.5683 },
    bounds: { north: 55.73, south: 55.62, east: 12.65, west: 12.49 },
    timezone: "Europe/Copenhagen",
    allowedVehicles: ["bike", "scooter"],
    vehicleLimit: { bike: 200, scooter: 80, monopattino: 0 },
  },

  {
    id: "stockholm",
    name: "Stockholm",
    country: "Sweden",
    coordinates: { lat: 59.3293, lng: 18.0686 },
    bounds: { north: 59.4, south: 59.26, east: 18.18, west: 17.96 },
    timezone: "Europe/Stockholm",
    allowedVehicles: ["bike", "scooter"],
    vehicleLimit: { bike: 150, scooter: 70, monopattino: 0 },
  },

  {
    id: "zurich",
    name: "Zurich",
    country: "Switzerland",
    coordinates: { lat: 47.3769, lng: 8.5417 },
    bounds: { north: 47.42, south: 47.33, east: 8.6, west: 8.48 },
    timezone: "Europe/Zurich",
    allowedVehicles: ["bike", "scooter"],
    vehicleLimit: { bike: 100, scooter: 60, monopattino: 0 },
  },

  {
    id: "warsaw",
    name: "Warsaw",
    country: "Poland",
    coordinates: { lat: 52.2297, lng: 21.0122 },
    bounds: { north: 52.3, south: 52.16, east: 21.15, west: 20.87 },
    timezone: "Europe/Warsaw",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 140, scooter: 90, monopattino: 70 },
  },

  {
    id: "budapest",
    name: "Budapest",
    country: "Hungary",
    coordinates: { lat: 47.4979, lng: 19.0402 },
    bounds: { north: 47.55, south: 47.44, east: 19.15, west: 18.93 },
    timezone: "Europe/Budapest",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 120, scooter: 80, monopattino: 60 },
  },
];
