import { VehicleType } from "@/config/cities";
import { EUROPEAN_CITIES } from "@/config/cities";
import { CityConfig } from "@/config/cities";

// ============= TYPES (keep existing interfaces for compatibility) =============
export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface CitySupport {
  inCity: boolean;
  cityName?: string;
  distance?: number;
  nearestCity?: string;
}

export interface NearbyVehicle {
  vehicleId: string;
  vehicleType: VehicleType;
  location: LocationCoordinates;
  distance: number;
  batteryLevel: number;
  estimatedRange: number;
  isAvailable: boolean;
  lastUpdate: Date;
  cityId: string;
}

// New simplified state interface
interface LocationStateResult {
  currentCity: any | null;
  isLoading: boolean;
  error: string | null;
  canRent: boolean;
  lastUpdated: number;
  method: "gps" | "manual" | "cached";
}

// Vehicle location interface (for fleet management)
interface VehicleLocation {
  vehicleId: string;
  vehicleType: VehicleType;
  cityId: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  batteryLevel: number;
  isAvailable: boolean;
  lastUpdate: Date;
  estimatedRange: number;
}

// ============= CONSTANTS =============
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false, // Less resource intensive
  timeout: 10000, // 10 seconds
  maximumAge: 300000, // 5 minutes cache
};

const STORAGE_KEY = "moove_city_location";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export class VehicleGeolocationSystem {
  private static instance: VehicleGeolocationSystem;
  private vehicleLocations: Map<string, VehicleLocation> = new Map();

  static getInstance(): VehicleGeolocationSystem {
    if (!VehicleGeolocationSystem.instance) {
      VehicleGeolocationSystem.instance = new VehicleGeolocationSystem();
      VehicleGeolocationSystem.instance.initializeVehicleFleet();
    }
    return VehicleGeolocationSystem.instance;
  }

  constructor() {
    if (!this.vehicleLocations.size) {
      this.initializeVehicleFleet();
    }
  }

  // ============= PERSISTENT LOCATION MANAGEMENT =============

  private saveLocationToStorage(state: LocationStateResult): void {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (error) {
      console.warn("Failed to save location:", error);
    }
  }

  private loadLocationFromStorage(): LocationStateResult | null {
    try {
      if (typeof window === "undefined" || !window.sessionStorage) {
        return null;
      }

      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored) as LocationStateResult;
      const now = Date.now();

      // Check if cache is still valid
      if (now - data.lastUpdated > CACHE_DURATION) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return data;
    } catch (error) {
      console.warn("Failed to load location:", error);
      return null;
    }
  }

  // ============= MAIN LOCATION METHODS =============

  /**
   * Get current user location with caching
   */
  async getCurrentLocation(): Promise<LocationCoordinates> {
    // Try cache first for LocationCoordinates compatibility
    const cached = this.loadLocationFromStorage();
    if (cached && cached.currentCity) {
      console.log("Using cached location");
      return cached.currentCity.coordinates;
    }

    // Get fresh location
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported by this browser");
    }

    return new Promise<LocationCoordinates>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates: LocationCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // Find and cache nearest city
          const nearestCity = this.findNearestSupportedCity(coordinates);
          this.saveLocationState(coordinates, nearestCity);

          resolve(coordinates);
        },
        (error) => {
          let message: string;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message =
                "Location access denied. Please enable location services.";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location information unavailable.";
              break;
            case error.TIMEOUT:
              message = "Location request timed out.";
              break;
            default:
              message = "Unknown location error.";
          }
          reject(new Error(message));
        },
        GEOLOCATION_OPTIONS
      );
    });
  }

  /**
   * Get current location state (new method for compatibility)
   */
  async getCurrentLocationState(): Promise<LocationStateResult> {
    // Try cache first
    const cached = this.loadLocationFromStorage();
    if (cached) {
      console.log("Using cached location state");
      return cached;
    }

    // Get fresh location
    try {
      const coordinates = await this.getCurrentLocation();
      const nearestCity = this.findNearestSupportedCity(coordinates);
      return this.saveLocationState(coordinates, nearestCity);
    } catch (error: any) {
      return {
        currentCity: null,
        isLoading: false,
        error: error.message,
        canRent: false,
        lastUpdated: Date.now(),
        method: "gps",
      };
    }
  }

  private saveLocationState(
    coordinates: LocationCoordinates,
    nearestCity: any | null
  ): LocationStateResult {
    const state: LocationStateResult = {
      currentCity: nearestCity,
      isLoading: false,
      error: null,
      canRent: !!nearestCity,
      lastUpdated: Date.now(),
      method: "gps",
    };

    this.saveLocationToStorage(state);
    return state;
  }

  private findNearestSupportedCity(
    coordinates: LocationCoordinates
  ): any | null {
    let nearestCity = null;
    let minDistance = Infinity;

    for (const city of EUROPEAN_CITIES) {
      const { bounds } = city;

      // Check if inside city bounds first
      if (
        coordinates.lat >= bounds.south &&
        coordinates.lat <= bounds.north &&
        coordinates.lng >= bounds.west &&
        coordinates.lng <= bounds.east
      ) {
        return city; // Inside city, return immediately
      }

      // Calculate distance to city center
      const distance = this.calculateDistance(
        coordinates.lat,
        coordinates.lng,
        city.coordinates.lat,
        city.coordinates.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }

    // Only return city if within reasonable distance (100km)
    return minDistance <= 100 ? nearestCity : null;
  }

  /**
   * Check if user is in a supported city
   */
  checkCitySupport(location: LocationCoordinates): CitySupport {
    // Check if user is within any supported city bounds
    for (const city of EUROPEAN_CITIES) {
      const { bounds } = city;

      if (
        location.lat >= bounds.south &&
        location.lat <= bounds.north &&
        location.lng >= bounds.west &&
        location.lng <= bounds.east
      ) {
        return {
          inCity: true,
          cityName: city.id,
          distance: 0,
        };
      }
    }

    // User is not in a supported city, find nearest one
    const distances = EUROPEAN_CITIES.map((city) => ({
      city: city.id,
      name: city.name,
      distance: this.calculateDistance(
        location.lat,
        location.lng,
        city.coordinates.lat,
        city.coordinates.lng
      ),
    }));

    const nearest = distances.reduce((min, curr) =>
      curr.distance < min.distance ? curr : min
    );

    return {
      inCity: false,
      distance: nearest.distance,
      nearestCity: nearest.name,
    };
  }

  // ============= DEVELOPMENT/TESTING METHODS =============

  /**
   * Set manual location for testing
   */
  async setTestLocation(cityId: string): Promise<LocationStateResult> {
    const city = EUROPEAN_CITIES.find((c) => c.id === cityId);

    if (!city) {
      throw new Error(`City ${cityId} not found`);
    }

    const state: LocationStateResult = {
      currentCity: city,
      isLoading: false,
      error: null,
      canRent: true,
      lastUpdated: Date.now(),
      method: "manual",
    };

    this.saveLocationToStorage(state);
    console.log(`🧪 Test location set: ${city.name}`);
    return state;
  }

  /**
   * Clear location cache
   */
  clearLocationCache(): void {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.removeItem(STORAGE_KEY);
      }
      console.log("Location cache cleared");
    } catch (error) {
      console.warn("Failed to clear location:", error);
    }
  }

  /**
   * Check location permission (for compatibility)
   */
  async checkLocationPermission(): Promise<"granted" | "denied" | "prompt"> {
    if (!navigator.permissions) {
      return "prompt";
    }

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });
      return permission.state as "granted" | "denied" | "prompt";
    } catch (error) {
      console.warn("Could not check location permission:", error);
      return "prompt";
    }
  }

  // ============= NEARBY VEHICLES METHODS (existing functionality) =============

  /**
   * Get nearby vehicles within specified radius
   */
  async getNearbyVehicles(
    location: LocationCoordinates,
    radiusKm: number = 2,
    vehicleType?: VehicleType,
    onlyAvailable: boolean = true
  ): Promise<NearbyVehicle[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const nearbyVehicles: NearbyVehicle[] = [];

    this.vehicleLocations.forEach((vehicle) => {
      // Filter by availability if requested
      if (onlyAvailable && !vehicle.isAvailable) return;

      // Filter by vehicle type if specified
      if (vehicleType && vehicle.vehicleType !== vehicleType) return;

      const distance = this.calculateDistance(
        location.lat,
        location.lng,
        vehicle.coordinates.lat,
        vehicle.coordinates.lng
      );

      if (distance <= radiusKm) {
        nearbyVehicles.push({
          vehicleId: vehicle.vehicleId,
          vehicleType: vehicle.vehicleType,
          location: {
            lat: vehicle.coordinates.lat,
            lng: vehicle.coordinates.lng,
          },
          distance,
          batteryLevel: vehicle.batteryLevel,
          estimatedRange: vehicle.estimatedRange,
          isAvailable: vehicle.isAvailable,
          lastUpdate: vehicle.lastUpdate,
          cityId: vehicle.cityId,
        });
      }
    });

    // Sort by distance
    return nearbyVehicles.sort((a, b) => a.distance - b.distance);
  }

  // Get vehicles near user location
  getVehiclesNearLocation(
    userLat: number,
    userLng: number,
    radiusKm: number = 2,
    vehicleType?: VehicleType
  ): (VehicleLocation & { distance: number })[] {
    const nearbyVehicles: (VehicleLocation & { distance: number })[] = [];

    this.vehicleLocations.forEach((vehicle) => {
      if (!vehicle.isAvailable) return;
      if (vehicleType && vehicle.vehicleType !== vehicleType) return;

      const distance = this.calculateDistance(
        userLat,
        userLng,
        vehicle.coordinates.lat,
        vehicle.coordinates.lng
      );

      if (distance <= radiusKm) {
        nearbyVehicles.push({
          ...vehicle,
          distance,
        });
      }
    });

    return nearbyVehicles.sort((a, b) => a.distance - b.distance);
  }

  // Get vehicles in specific city
  getVehiclesInCity(
    cityId: string,
    vehicleType?: VehicleType
  ): VehicleLocation[] {
    const cityVehicles: VehicleLocation[] = [];

    this.vehicleLocations.forEach((vehicle) => {
      if (vehicle.cityId !== cityId) return;
      if (!vehicle.isAvailable) return;
      if (vehicleType && vehicle.vehicleType !== vehicleType) return;

      cityVehicles.push(vehicle);
    });

    return cityVehicles;
  }

  // ============= UTILITY METHODS =============

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // ============= VEHICLE FLEET METHODS (existing) =============

  initializeVehicleFleet(): void {
    EUROPEAN_CITIES.forEach((city) => {
      Object.entries(city.vehicleLimit).forEach(([vehicleType, limit]) => {
        if (
          limit > 0 &&
          city.allowedVehicles.includes(vehicleType as VehicleType)
        ) {
          for (let i = 0; i < limit; i++) {
            const vehicleId = this.generateVehicleId(
              city.id,
              vehicleType as VehicleType,
              i
            );
            const location = this.generateRandomLocationInCity(city);

            this.vehicleLocations.set(vehicleId, {
              vehicleId,
              vehicleType: vehicleType as VehicleType,
              cityId: city.id,
              coordinates: location,
              batteryLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
              isAvailable: Math.random() > 0.15, // 85% available
              lastUpdate: new Date(),
              estimatedRange: this.calculateRange(vehicleType as VehicleType),
            });
          }
        }
      });
    });
  }

  private generateVehicleId(
    cityId: string,
    vehicleType: VehicleType,
    index: number
  ): string {
    const typeCode = {
      bike: "BK",
      scooter: "SC",
      monopattino: "MP",
    }[vehicleType];

    const cityCode = cityId.substring(0, 3).toUpperCase();
    return `MOOVE-${cityCode}-${typeCode}-${(index + 1)
      .toString()
      .padStart(3, "0")}`;
  }

  private generateRandomLocationInCity(city: CityConfig): {
    lat: number;
    lng: number;
  } {
    const latRange = city.bounds.north - city.bounds.south;
    const lngRange = city.bounds.east - city.bounds.west;

    return {
      lat: city.bounds.south + Math.random() * latRange,
      lng: city.bounds.west + Math.random() * lngRange,
    };
  }

  private calculateRange(vehicleType: VehicleType): number {
    const ranges = {
      bike: [25, 50], // 25-50km
      scooter: [30, 60], // 30-60km
      monopattino: [15, 35], // 15-35km
    };

    const [min, max] = ranges[vehicleType];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Vehicle management methods (existing)
  reserveVehicle(vehicleId: string): boolean {
    const vehicle = this.vehicleLocations.get(vehicleId);
    if (vehicle && vehicle.isAvailable) {
      vehicle.isAvailable = false;
      vehicle.lastUpdate = new Date();
      return true;
    }
    return false;
  }

  releaseVehicle(
    vehicleId: string,
    newLocation?: { lat: number; lng: number }
  ): void {
    const vehicle = this.vehicleLocations.get(vehicleId);
    if (vehicle) {
      vehicle.isAvailable = true;
      vehicle.lastUpdate = new Date();
      if (newLocation) {
        vehicle.coordinates = newLocation;
      }
      vehicle.batteryLevel = Math.max(
        0,
        vehicle.batteryLevel - Math.floor(Math.random() * 20)
      );
    }
  }

  getVehicle(vehicleId: string): VehicleLocation | undefined {
    return this.vehicleLocations.get(vehicleId);
  }

  getAllVehicles(): VehicleLocation[] {
    return Array.from(this.vehicleLocations.values());
  }

  updateVehicleLocation(
    vehicleId: string,
    newLocation: { lat: number; lng: number }
  ): void {
    const vehicle = this.vehicleLocations.get(vehicleId);
    if (vehicle) {
      vehicle.coordinates = newLocation;
      vehicle.lastUpdate = new Date();
    }
  }
}

// ============= HELPER FUNCTIONS (existing) =============

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 0.1) {
    return "Very close";
  } else if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else {
    return `${distanceKm.toFixed(1)}km`;
  }
}

export function getBatteryColor(level: number): string {
  if (level > 70) return "text-green-600";
  if (level > 30) return "text-yellow-600";
  return "text-red-600";
}

export function getVehicleEmoji(type: VehicleType): string {
  switch (type) {
    case "bike":
      return "🚲";
    case "scooter":
      return "🛴";
    case "monopattino":
      return "🛵";
    default:
      return "🚲";
  }
}

// Export default for compatibility
export default VehicleGeolocationSystem;
