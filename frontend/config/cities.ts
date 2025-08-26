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
  emoji?: string;
  allowedVehicles: VehicleType[];
  vehicleLimit: {
    bike: number;
    scooter: number;
    monopattino: number;
  };
  // Hero section image configuration
  heroImage?: {
    ipfsHash?: string;
    icon: string;
    altText: string;
    directUrl?: string;
  };
}

export type VehicleType = "bike" | "scooter" | "monopattino";

// 20+ European Cities Configuration
export const EUROPEAN_CITIES: CityConfig[] = [
  {
    id: "milan",
    name: "Milan",
    country: "Italy",
    coordinates: { lat: 45.4642, lng: 9.19 },
    bounds: { north: 45.52, south: 45.4, east: 9.28, west: 9.1 },
    timezone: "Europe/Rome",
    emoji: "🏛️",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 150, scooter: 100, monopattino: 80 },
    heroImage: {
      ipfsHash: "",
      icon: "🏛️",
      altText: "Milano with Duomo and Galleria Vittorio Emanuele",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/milan-hero.jpg",
    },
  },

  {
    id: "rome",
    name: "Rome",
    country: "Italy",
    coordinates: { lat: 41.9028, lng: 12.4964 },
    bounds: { north: 41.95, south: 41.85, east: 12.55, west: 12.44 },
    timezone: "Europe/Rome",
    emoji: "🏛️",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 200, scooter: 120, monopattino: 100 },
    heroImage: {
      ipfsHash: "bafkreigwgxcrnygcj2s6eu7yikt2wtrby5dy4tj7c4f6gs3fu3wxtkhv4e",
      icon: "🏛️",
      altText: "Rome skyline with Colosseum and historical monuments",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/rome-hero.jpg",
    },
  },

  {
    id: "naples",
    name: "Naples",
    country: "Italy",
    coordinates: { lat: 40.8518, lng: 14.2681 },
    bounds: { north: 40.9, south: 40.8, east: 14.32, west: 14.2 },
    timezone: "Europe/Rome",
    emoji: "🍕",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 80, scooter: 60, monopattino: 50 },
    heroImage: {
      ipfsHash: "",
      icon: "🍕",
      altText: "Naples with Gulf of Naples and Vesuvius",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/naples-hero.jpg",
    },
  },

  {
    id: "sanbenedetto",
    name: "San Benedetto del Tronto",
    country: "Italy",
    coordinates: { lat: 42.9448, lng: 13.8833 },
    bounds: { north: 43.0, south: 42.89, east: 13.95, west: 13.82 },
    timezone: "Europe/Rome",
    emoji: "🏖️",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 60, scooter: 40, monopattino: 30 },
    heroImage: {
      ipfsHash: "bafkreida5qw3breb2a6k4xkw3tg7a5nuoktqmnzi64snutlm4gfn6n7mt4",
      icon: "🏖️",
      altText: "San Benedetto del Tronto with sea and promenade",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/san-benedetto-del-tronto-hero.jpg",
    },
  },

  {
    id: "madrid",
    name: "Madrid",
    country: "Spain",
    coordinates: { lat: 40.4168, lng: -3.7038 },
    bounds: { north: 40.5, south: 40.35, east: -3.6, west: -3.8 },
    timezone: "Europe/Madrid",
    emoji: "🌞",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 180, scooter: 110, monopattino: 90 },
    heroImage: {
      ipfsHash: "",
      icon: "🌞",
      altText: "Madrid skyline with Plaza Mayor and Gran Via",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/madrid-hero.jpg",
    },
  },

  {
    id: "barcelona",
    name: "Barcelona",
    country: "Spain",
    coordinates: { lat: 41.3851, lng: 2.1734 },
    bounds: { north: 41.45, south: 41.32, east: 2.25, west: 2.1 },
    timezone: "Europe/Madrid",
    emoji: "🏗️",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 160, scooter: 100, monopattino: 85 },
    heroImage: {
      ipfsHash: "",
      icon: "🏗️",
      altText: "Barcelona with Sagrada Familia and modern architecture",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/barcelona-hero.jpeg",
    },
  },

  {
    id: "paris",
    name: "Paris",
    country: "France",
    coordinates: { lat: 48.8566, lng: 2.3522 },
    bounds: { north: 48.9, south: 48.81, east: 2.42, west: 2.28 },
    timezone: "Europe/Paris",
    emoji: "🗼",
    allowedVehicles: ["bike", "scooter"],
    vehicleLimit: { bike: 250, scooter: 150, monopattino: 0 },
    heroImage: {
      ipfsHash: "",
      icon: "🗼",
      altText: "Paris with Eiffel Tower and Champs-Élysées",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/paris-hero.jpg",
    },
  },

  {
    id: "lyon",
    name: "Lyon",
    country: "France",
    coordinates: { lat: 45.764, lng: 4.8357 },
    bounds: { north: 45.8, south: 45.72, east: 4.9, west: 4.77 },
    timezone: "Europe/Paris",
    emoji: "🍷",
    allowedVehicles: ["bike", "scooter"],
    vehicleLimit: { bike: 120, scooter: 80, monopattino: 0 },
    heroImage: {
      ipfsHash: "",
      icon: "🍷",
      altText: "Lyon with Basilica of Fourvière and historical center",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/lyon-hero.jpg",
    },
  },

  {
    id: "berlin",
    name: "Berlin",
    country: "Germany",
    coordinates: { lat: 52.52, lng: 13.405 },
    bounds: { north: 52.6, south: 52.45, east: 13.5, west: 13.3 },
    timezone: "Europe/Berlin",
    emoji: "🏛️",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 200, scooter: 130, monopattino: 110 },
    heroImage: {
      ipfsHash: "",
      icon: "🏛️",
      altText: "Berlin with Brandenburg Gate and Reichstag",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/berlin-hero.jpg",
    },
  },

  {
    id: "munich",
    name: "Munich",
    country: "Germany",
    coordinates: { lat: 48.1351, lng: 11.582 },
    bounds: { north: 48.2, south: 48.07, east: 11.7, west: 11.46 },
    timezone: "Europe/Berlin",
    emoji: "🍺",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 140, scooter: 90, monopattino: 70 },
    heroImage: {
      ipfsHash: "",
      icon: "🍺",
      altText: "Munich with Marienplatz and Frauenkirche",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/munchen-hero.jpg",
    },
  },

  {
    id: "amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
    coordinates: { lat: 52.3676, lng: 4.9041 },
    bounds: { north: 52.4, south: 52.33, east: 4.98, west: 4.83 },
    timezone: "Europe/Amsterdam",
    emoji: "🚲",
    allowedVehicles: ["bike", "scooter"],
    vehicleLimit: { bike: 300, scooter: 100, monopattino: 0 },
    heroImage: {
      ipfsHash: "",
      icon: "🚲",
      altText: "Amsterdam with canals and traditional Dutch architecture",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/amsterdam-hero.jpeg",
    },
  },

  {
    id: "rotterdam",
    name: "Rotterdam",
    country: "Netherlands",
    coordinates: { lat: 51.9225, lng: 4.4792 },
    bounds: { north: 51.96, south: 51.88, east: 4.55, west: 4.4 },
    timezone: "Europe/Amsterdam",
    emoji: "🏗️",
    allowedVehicles: ["bike", "scooter"],
    vehicleLimit: { bike: 180, scooter: 70, monopattino: 0 },
    heroImage: {
      ipfsHash: "",
      icon: "🏗️",
      altText: "Rotterdam with modern architecture and port",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/rotterdam-hero.jpg",
    },
  },

  {
    id: "brussels",
    name: "Brussels",
    country: "Belgium",
    coordinates: { lat: 50.8503, lng: 4.3517 },
    bounds: { north: 50.9, south: 50.8, east: 4.42, west: 4.28 },
    timezone: "Europe/Brussels",
    emoji: "🍫",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 120, scooter: 80, monopattino: 60 },
    heroImage: {
      ipfsHash: "",
      icon: "🍫",
      altText: "Brussels with Grand Place and Atomium",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/bruxelles-hero.jpg",
    },
  },

  {
    id: "vienna",
    name: "Vienna",
    country: "Austria",
    coordinates: { lat: 48.2082, lng: 16.3738 },
    bounds: { north: 48.27, south: 48.14, east: 16.48, west: 16.27 },
    timezone: "Europe/Vienna",
    emoji: "🎭",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 160, scooter: 100, monopattino: 80 },
    heroImage: {
      ipfsHash: "",
      icon: "🎭",
      altText: "Vienna with Schönbrunn Palace and historical center",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/wien-hero.jpg",
    },
  },

  {
    id: "lisbon",
    name: "Lisbon",
    country: "Portugal",
    coordinates: { lat: 38.7223, lng: -9.1393 },
    bounds: { north: 38.8, south: 38.65, east: -9.05, west: -9.23 },
    timezone: "Europe/Lisbon",
    emoji: "🌅",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 100, scooter: 80, monopattino: 60 },
    heroImage: {
      ipfsHash: "",
      icon: "🌅",
      altText: "Lisbon with Alfama and view of Tago",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/lisbon-hero.jpg",
    },
  },

  {
    id: "prague",
    name: "Prague",
    country: "Czech Republic",
    coordinates: { lat: 50.0755, lng: 14.4378 },
    bounds: { north: 50.13, south: 50.02, east: 14.56, west: 14.32 },
    timezone: "Europe/Prague",
    emoji: "🏰",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 130, scooter: 90, monopattino: 70 },
    heroImage: {
      ipfsHash: "",
      icon: "🏰",
      altText: "Prague with Castle and Charles Bridge",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/prague-hero.jpeg",
    },
  },

  {
    id: "copenhagen",
    name: "Copenhagen",
    country: "Denmark",
    coordinates: { lat: 55.6761, lng: 12.5683 },
    bounds: { north: 55.73, south: 55.62, east: 12.65, west: 12.49 },
    timezone: "Europe/Copenhagen",
    emoji: "🧜‍♀️",
    allowedVehicles: ["bike", "scooter"],
    vehicleLimit: { bike: 200, scooter: 80, monopattino: 0 },
    heroImage: {
      ipfsHash: "",
      icon: "🧜‍♀️",
      altText: "Copenhagen with Little Mermaid and Nyhavn",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/copenaghen-hero.jpg",
    },
  },

  {
    id: "stockholm",
    name: "Stockholm",
    country: "Sweden",
    coordinates: { lat: 59.3293, lng: 18.0686 },
    bounds: { north: 59.4, south: 59.26, east: 18.18, west: 17.96 },
    timezone: "Europe/Stockholm",
    emoji: "🏛️",
    allowedVehicles: ["bike", "scooter"],
    vehicleLimit: { bike: 150, scooter: 70, monopattino: 0 },
    heroImage: {
      ipfsHash: "",
      icon: "🏛️",
      altText: "Stockholm with Gamla Stan and Royal Palace",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/stockholm-hero.jpg",
    },
  },

  {
    id: "zurich",
    name: "Zurich",
    country: "Switzerland",
    coordinates: { lat: 47.3769, lng: 8.5417 },
    bounds: { north: 47.42, south: 47.33, east: 8.6, west: 8.48 },
    timezone: "Europe/Zurich",
    emoji: "🏔️",
    allowedVehicles: ["bike", "scooter"],
    vehicleLimit: { bike: 100, scooter: 60, monopattino: 0 },
    heroImage: {
      ipfsHash: "",
      icon: "🏔️",
      altText: "Zurich with lake and view of Alps",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/zurich-hero.jpeg",
    },
  },

  {
    id: "warsaw",
    name: "Warsaw",
    country: "Poland",
    coordinates: { lat: 52.2297, lng: 21.0122 },
    bounds: { north: 52.3, south: 52.16, east: 21.15, west: 20.87 },
    timezone: "Europe/Warsaw",
    emoji: "🦅",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 140, scooter: 90, monopattino: 70 },
    heroImage: {
      ipfsHash: "",
      icon: "🦅",
      altText: "Warsaw with Old Town and Palace of Culture",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/warsaw-hero.jpg",
    },
  },

  {
    id: "budapest",
    name: "Budapest",
    country: "Hungary",
    coordinates: { lat: 47.4979, lng: 19.0402 },
    bounds: { north: 47.55, south: 47.44, east: 19.15, west: 18.93 },
    timezone: "Europe/Budapest",
    emoji: "♨️",
    allowedVehicles: ["bike", "scooter", "monopattino"],
    vehicleLimit: { bike: 120, scooter: 80, monopattino: 60 },
    heroImage: {
      ipfsHash: "",
      icon: "♨️",
      altText: "Budapest with Parliament and thermal baths",
      directUrl:
        "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/budapest-hero.jpg",
    },
  },
];

// Helper function to get the city hero image
export function getCityHeroImage(cityId: string): string | null {
  const city = EUROPEAN_CITIES.find((city) => city.id === cityId);
  return city?.heroImage?.directUrl || null;
}

// Helper function to get the city hero info
export function getCityHeroInfo(cityId: string) {
  const city = EUROPEAN_CITIES.find((city) => city.id === cityId);
  return city?.heroImage || null;
}
